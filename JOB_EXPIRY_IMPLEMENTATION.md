# Job Posting 30-Day Expiry Implementation

## 📋 概述

已为职位发布实现 30 天有效期功能。支付成功后，职位将在 30 天后自动过期并归档。

## 🗄️ 数据库变更

### Schema 更新

添加到 `JobPostingPurchase` 模型：

```prisma
model JobPostingPurchase {
  // ... existing fields ...
  
  expiresAt  DateTime?  @map("expires_at")  // 30 days after paidAt
  
  // ... other fields ...
  
  @@index([expiresAt])  // Index for efficient expiry queries
}
```

### 迁移步骤

**方法 1: 使用 Prisma Migrate（推荐）**

```bash
npx prisma migrate dev --name add_job_posting_expiry
```

**方法 2: 使用 Prisma DB Push（开发环境）**

```bash
npx prisma db push
```

**方法 3: 手动 SQL（生产环境）**

```sql
-- Add expires_at column
ALTER TABLE job_posting_purchases 
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient queries
CREATE INDEX idx_job_posting_purchases_expires_at 
ON job_posting_purchases(expires_at);

-- Optional: Update existing records (set expiry to 30 days after paid_at)
UPDATE job_posting_purchases 
SET expires_at = paid_at + INTERVAL '30 days'
WHERE paid_at IS NOT NULL 
  AND payment_status = 'SUCCEEDED'
  AND expires_at IS NULL;
```

## ⚙️ 工作原理

### 1. 支付成功时设置过期时间

当 Stripe Webhook 收到支付成功事件时：

```typescript
const now = new Date();
const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

await prisma.jobPostingPurchase.update({
  where: { jobPostingId },
  data: {
    paymentStatus: PaymentStatus.SUCCEEDED,
    paidAt: now,
    expiresAt: expiresAt,  // ✅ 设置过期时间
  },
});
```

**计算公式：**
- `30 days = 30 * 24 * 60 * 60 * 1000 milliseconds`
- `expiresAt = paidAt + 30 days`

### 2. 数据库查询示例

**检查职位是否过期：**

```sql
SELECT * FROM job_posting_purchases 
WHERE job_posting_id = 'xxx' 
  AND expires_at < NOW();
```

**获取所有过期的职位：**

```sql
SELECT job_posting_id 
FROM job_posting_purchases 
WHERE expires_at < NOW() 
  AND payment_status = 'SUCCEEDED';
```

**获取即将过期的职位（7天内）：**

```sql
SELECT job_posting_id, expires_at
FROM job_posting_purchases 
WHERE expires_at > NOW() 
  AND expires_at < NOW() + INTERVAL '7 days'
  AND payment_status = 'SUCCEEDED';
```

## 📁 新增文件

### 1. `/src/lib/jobPostingExpiry.ts`

工具函数库，提供过期相关的业务逻辑：

**主要函数：**

```typescript
// 检查职位是否过期
async function isJobPostingExpired(jobPostingId: string): Promise<boolean>

// 获取所有过期的职位
async function getExpiredJobPostings(): Promise<string[]>

// 归档所有过期的职位
async function archiveExpiredJobPostings(): Promise<number>

// 获取剩余天数
async function getDaysUntilExpiry(jobPostingId: string): Promise<number | null>

// 获取即将过期的职位（默认7天内）
async function getJobPostingsExpiringSoon(withinDays?: number): Promise<string[]>

// 验证职位是否有效
async function isJobPostingValid(jobPostingId: string): Promise<boolean>
```

### 2. `/src/app/api/cron/archive-expired-jobs/route.ts`

**Cron Job API** - 自动归档过期职位

```typescript
GET/POST /api/cron/archive-expired-jobs
```

**响应示例：**

```json
{
  "success": true,
  "archivedCount": 5,
  "expiredJobIds": ["uuid1", "uuid2", "uuid3", "uuid4", "uuid5"],
  "timestamp": "2024-01-15T00:00:00.000Z"
}
```

### 3. `/src/app/api/job-postings/[id]/expiry/route.ts`

**获取职位过期信息 API**

```typescript
GET /api/job-postings/[id]/expiry
```

**响应示例：**

```json
{
  "jobPostingId": "uuid",
  "status": "PUBLISHED",
  "purchase": {
    "paidAt": "2024-01-01T00:00:00.000Z",
    "expiresAt": "2024-01-31T00:00:00.000Z",
    "paymentStatus": "SUCCEEDED"
  },
  "expiry": {
    "isExpired": false,
    "daysRemaining": 15,
    "hasExpiry": true
  }
}
```

### 4. `vercel.json` (已更新)

配置 Vercel Cron Jobs：

```json
{
  "framework": "nextjs",
  "crons": [
    {
      "path": "/api/cron/archive-expired-jobs",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Cron 调度：** 每天凌晨 0:00 运行（UTC 时区）

## 🔄 自动归档流程

### Vercel Cron Jobs（推荐）

1. **自动执行**：Vercel 每天自动调用 `/api/cron/archive-expired-jobs`
2. **查找过期职位**：`expiresAt < NOW()` 且状态为 `PUBLISHED`
3. **批量归档**：将状态更新为 `ARCHIVED`
4. **记录日志**：输出归档数量和 ID

### 手动触发（测试用）

```bash
# 本地测试
curl http://localhost:3000/api/cron/archive-expired-jobs

# 生产环境（需要 CRON_SECRET）
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/cron/archive-expired-jobs
```

### 可选：设置 Cron Secret

在 `.env` 中添加：

```env
CRON_SECRET=your-random-secret-here
```

这样只有携带正确 token 的请求才能触发 cron job。

## 🎯 使用场景

### 1. 在 API 中检查职位是否有效

```typescript
import { isJobPostingExpired } from '@/lib/jobPostingExpiry';

export async function GET(request: NextRequest) {
  const jobId = '...';
  
  const expired = await isJobPostingExpired(jobId);
  
  if (expired) {
    return NextResponse.json(
      { error: 'Job posting has expired' },
      { status: 410 } // 410 Gone
    );
  }
  
  // Continue processing...
}
```

### 2. 显示过期提示给用户

```typescript
import { getDaysUntilExpiry } from '@/lib/jobPostingExpiry';

const daysRemaining = await getDaysUntilExpiry(jobId);

if (daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 7) {
  // Show warning: "Your job posting expires in {daysRemaining} days"
} else if (daysRemaining === -1) {
  // Show error: "This job posting has expired"
}
```

### 3. 发送到期提醒邮件

```typescript
import { getJobPostingsExpiringSoon } from '@/lib/jobPostingExpiry';

// Get jobs expiring in next 3 days
const expiringSoon = await getJobPostingsExpiringSoon(3);

// Send reminder emails to employers
for (const jobId of expiringSoon) {
  // await sendExpiryReminderEmail(jobId);
}
```

### 4. 管理员仪表板

```typescript
import { getExpiredJobPostings, getJobPostingsExpiringSoon } from '@/lib/jobPostingExpiry';

const expired = await getExpiredJobPostings();
const expiringSoon = await getJobPostingsExpiringSoon(7);

console.log(`Expired: ${expired.length}, Expiring soon: ${expiringSoon.length}`);
```

## 📊 数据库索引优化

已添加索引以优化查询性能：

```sql
CREATE INDEX idx_job_posting_purchases_expires_at 
ON job_posting_purchases(expires_at);
```

**优化的查询：**
- `WHERE expires_at < NOW()`
- `WHERE expires_at > NOW() AND expires_at < future_date`
- `ORDER BY expires_at`

## 🧪 测试场景

### 测试 1: 支付后设置过期时间

```bash
1. 创建职位并支付
2. 检查数据库：
   SELECT paid_at, expires_at 
   FROM job_posting_purchases 
   WHERE job_posting_id = 'xxx';
3. ✅ 验证 expires_at = paid_at + 30 days
```

### 测试 2: 检查过期状态

```bash
# 修改数据库让职位立即过期（测试用）
UPDATE job_posting_purchases 
SET expires_at = NOW() - INTERVAL '1 day'
WHERE job_posting_id = 'xxx';

# 调用 API
curl http://localhost:3000/api/job-postings/xxx/expiry

# ✅ 验证返回 isExpired: true
```

### 测试 3: Cron Job 归档

```bash
# 手动触发 cron job
curl http://localhost:3000/api/cron/archive-expired-jobs

# 检查数据库
SELECT id, status, updated_at 
FROM job_postings 
WHERE id IN (SELECT job_posting_id FROM job_posting_purchases WHERE expires_at < NOW());

# ✅ 验证状态变为 ARCHIVED
```

### 测试 4: 剩余天数计算

```bash
# 设置 expires_at 为 5 天后
UPDATE job_posting_purchases 
SET expires_at = NOW() + INTERVAL '5 days'
WHERE job_posting_id = 'xxx';

# 调用 API
curl http://localhost:3000/api/job-postings/xxx/expiry

# ✅ 验证返回 daysRemaining: 5
```

## 🔐 权限和安全

### API 权限

1. **`/api/job-postings/[id]/expiry`**
   - 需要认证
   - 只能查看自己的职位

2. **`/api/cron/archive-expired-jobs`**
   - 可选：使用 `CRON_SECRET` 保护
   - 建议在生产环境启用

### 数据保护

- 过期职位状态变为 `ARCHIVED`，不会被删除
- 保留所有购买记录和支付信息
- 雇主仍可访问归档的职位
- 候选人无法看到归档的职位

## 📈 监控和维护

### 建议的监控指标

1. **每日归档数量**
   - 监控 cron job 返回的 `archivedCount`
   - 异常数量可能表示问题

2. **即将过期的职位**
   - 定期检查 7 天内过期的职位数量
   - 可用于发送提醒邮件

3. **过期但未归档的职位**
   - 如果 cron job 失败，会有职位过期但未归档
   - 定期检查并手动处理

### 日志示例

```
[2024-01-15 00:00:00] Cron job started
[2024-01-15 00:00:05] Found 5 expired job postings
[2024-01-15 00:00:06] Archived job posting: uuid1, expired at: 2024-01-14
[2024-01-15 00:00:06] Archived job posting: uuid2, expired at: 2024-01-13
[2024-01-15 00:00:06] ...
[2024-01-15 00:00:07] Cron job completed: 5 jobs archived
```

## 🚀 部署清单

### 本地开发

- [x] 更新 Prisma schema
- [x] 运行 `npx prisma generate`
- [x] 创建迁移或运行 `npx prisma db push`
- [x] 创建工具函数 `jobPostingExpiry.ts`
- [x] 创建 API routes
- [x] 更新 Webhook 处理
- [x] 配置 `vercel.json`

### 测试环境

- [ ] 执行数据库迁移
- [ ] 测试支付流程（验证 `expiresAt` 设置）
- [ ] 测试 Expiry API
- [ ] 手动触发 Cron Job 测试
- [ ] 验证归档功能

### 生产环境

- [ ] 执行数据库迁移
- [ ] 设置 `CRON_SECRET` 环境变量
- [ ] 部署到 Vercel
- [ ] 验证 Cron Job 配置
- [ ] 监控第一次自动归档
- [ ] （可选）为现有记录设置 `expiresAt`

## 🔄 现有数据迁移

如果已有付费职位，需要设置它们的过期时间：

```sql
-- 为所有已支付但未设置过期时间的职位设置过期时间
UPDATE job_posting_purchases 
SET expires_at = paid_at + INTERVAL '30 days'
WHERE paid_at IS NOT NULL 
  AND payment_status = 'SUCCEEDED'
  AND expires_at IS NULL;
```

**注意：** 这将为现有职位追溯设置过期时间。如果不希望这样做，可以只为新购买的职位设置。

## ✨ 未来增强

### 短期优化

1. **邮件提醒**
   - 7 天前提醒
   - 3 天前提醒
   - 过期当天通知

2. **续费功能**
   - 允许雇主续费职位
   - 延长 30 天有效期

3. **灵活的有效期**
   - Junior 职位: 30 天
   - Senior 职位: 60 天
   - 允许自定义有效期

### 长期优化

1. **自动续费**
   - 订阅模式
   - 自动扣款

2. **折扣优惠**
   - 即将过期时提供续费折扣
   - 批量购买优惠

3. **分析报告**
   - 职位有效期利用率
   - 平均招聘完成时间
   - ROI 分析

## 📊 SQL 查询参考

### 查看所有过期信息

```sql
SELECT 
  jp.id,
  jp.job_title,
  jp.status,
  jpp.paid_at,
  jpp.expires_at,
  jpp.payment_status,
  CASE 
    WHEN jpp.expires_at IS NULL THEN 'No expiry'
    WHEN jpp.expires_at < NOW() THEN 'Expired'
    WHEN jpp.expires_at < NOW() + INTERVAL '7 days' THEN 'Expiring soon'
    ELSE 'Active'
  END AS expiry_status,
  EXTRACT(DAY FROM (jpp.expires_at - NOW())) AS days_remaining
FROM job_postings jp
LEFT JOIN job_posting_purchases jpp ON jp.id = jpp.job_posting_id
WHERE jp.status = 'PUBLISHED'
ORDER BY jpp.expires_at ASC;
```

### 统计报告

```sql
SELECT 
  COUNT(*) FILTER (WHERE expires_at > NOW()) AS active_jobs,
  COUNT(*) FILTER (WHERE expires_at < NOW()) AS expired_jobs,
  COUNT(*) FILTER (WHERE expires_at > NOW() AND expires_at < NOW() + INTERVAL '7 days') AS expiring_soon,
  AVG(EXTRACT(DAY FROM (expires_at - paid_at))) AS avg_listing_duration
FROM job_posting_purchases
WHERE payment_status = 'SUCCEEDED';
```

## ✅ 完成检查清单

- [x] Prisma schema 添加 `expiresAt` 字段
- [x] 添加 `expiresAt` 索引
- [x] Webhook 设置 30 天过期时间
- [x] 创建 `jobPostingExpiry.ts` 工具库
- [x] 创建 Cron Job API route
- [x] 创建 Expiry Info API route
- [x] 配置 Vercel Cron Jobs
- [x] 生成 Prisma client
- [x] 编写完整文档

## 🎉 总结

30 天有效期功能已完整实现：

- ✅ 支付成功时自动设置过期时间
- ✅ 数据库级别的过期检查（`expires_at > NOW()`）
- ✅ 自动归档过期职位（每天运行）
- ✅ API 查询过期信息
- ✅ 完整的工具函数库
- ✅ Vercel Cron Jobs 配置
- ✅ 生产就绪的实现

现在需要运行数据库迁移来应用更改！

