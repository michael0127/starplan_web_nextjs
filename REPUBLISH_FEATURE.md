# Republish Archived Job Postings Feature

## 📋 功能概述

允许雇主重新发布已归档的职位，前提是职位未过期（30天有效期内）。

## 🎯 需求

1. **Archived 职位显示 Republish 按钮**
2. **检查有效期**：只有未过期的职位才能重新发布
3. **更新状态**：从 ARCHIVED → PUBLISHED
4. **友好提示**：过期职位显示无法重新发布的原因

## 📁 新增/修改文件

### 1. `/src/app/api/job-postings/[id]/republish/route.ts` (新增)

重新发布职位的 API 端点。

**功能：**
- 验证用户身份和职位所有权
- 检查职位状态（必须是 ARCHIVED）
- 检查是否过期（调用 `isJobPostingExpired()`）
- 检查支付状态（必须是 SUCCEEDED）
- 更新状态为 PUBLISHED

**请求：**
```typescript
PATCH /api/job-postings/[id]/republish
Headers: { Authorization: Bearer <token> }
```

**响应（成功）：**
```json
{
  "success": true,
  "message": "Job posting republished successfully",
  "data": { ...updatedJobPosting }
}
```

**响应（过期）：**
```json
{
  "error": "Cannot republish expired job posting. The 30-day validity period has ended."
}
```

**错误代码：**
- 401: 未授权
- 403: 不是职位所有者
- 404: 职位不存在
- 400: 只能重新发布 ARCHIVED 职位 / 职位已过期 / 支付未成功

### 2. `/src/app/employer/jobs/page.tsx` (修改)

职位列表页面，添加 Republish 功能。

**新增状态：**
```typescript
const [republishModalOpen, setRepublishModalOpen] = useState(false);
const [jobToRepublish, setJobToRepublish] = useState<{ 
  id: string; 
  title: string; 
  expired: boolean 
} | null>(null);
const [isRepublishing, setIsRepublishing] = useState(false);
const [checkingExpiry, setCheckingExpiry] = useState<string | null>(null);
```

**新增函数：**
```typescript
- openRepublishModal(id: string, title: string): Promise<void>
  // 检查职位是否过期，打开确认弹窗
  
- closeRepublishModal(): void
  // 关闭弹窗
  
- handleRepublish(): Promise<void>
  // 执行重新发布操作
```

**按钮逻辑：**
```tsx
{job.status === 'ARCHIVED' && (
  <>
    <button 
      className={styles.btnSuccess}
      onClick={() => openRepublishModal(job.id, job.jobTitle)}
      disabled={checkingExpiry === job.id}
    >
      {checkingExpiry === job.id ? 'Checking...' : 'Republish'}
    </button>
    <button className={styles.btnDanger}>Delete</button>
  </>
)}
```

**Republish 确认弹窗：**
- 未过期：显示重新发布确认
- 已过期：显示错误提示，无法重新发布

### 3. `/src/app/employer/jobs/page.module.css` (修改)

添加 Republish 相关样式。

**新增样式：**
```css
.btnSuccess {
  /* 绿色边框按钮 */
  border: 1px solid #10b981;
  color: #10b981;
}

.btnSuccess:hover {
  background: #10b981;
  color: white;
}

.btnModalRepublish {
  /* 绿色实心按钮 */
  background: #10b981;
  color: white;
}

.btnModalRepublish:hover {
  background: #059669;
}
```

## 🔄 工作流程

### 重新发布流程

```
用户查看 Archived 职位
    ↓
点击 "Republish" 按钮
    ↓
前端调用 GET /api/job-postings/[id]/expiry
    ↓
检查是否过期
    ↓
┌─────────────────┬─────────────────┐
│   未过期        │    已过期        │
├─────────────────┼─────────────────┤
│ 显示确认弹窗     │ 显示错误提示     │
│ 用户确认        │ 无法重新发布     │
│     ↓           │                 │
│ 调用 PATCH      │                 │
│ republish API   │                 │
│     ↓           │                 │
│ 验证身份和状态   │                 │
│     ↓           │                 │
│ 更新状态为      │                 │
│ PUBLISHED       │                 │
│     ↓           │                 │
│ 关闭弹窗        │                 │
│ 刷新列表        │                 │
│     ↓           │                 │
│ 职位出现在      │                 │
│ Published 标签   │                 │
└─────────────────┴─────────────────┘
```

### 过期检查

```typescript
// 步骤 1: 点击 Republish 按钮
onClick={() => openRepublishModal(job.id, job.jobTitle)}

// 步骤 2: 调用 expiry API 检查
const response = await fetch(`/api/job-postings/${id}/expiry`);
const data = await response.json();

// 步骤 3: 设置过期状态
setJobToRepublish({ 
  id, 
  title,
  expired: data.expiry.isExpired // true or false
});

// 步骤 4: 显示相应的弹窗
if (expired) {
  // 显示错误提示，只有 "Close" 按钮
} else {
  // 显示确认提示，有 "Cancel" 和 "Republish" 按钮
}
```

## 🎨 用户界面

### Archived 职位卡片

```
┌─────────────────────────────────────┐
│ Senior Software Engineer            │
│ [Archived] Badge                    │
│                                     │
│ Tech Corp • Remote • Full-time     │
│                                     │
│ Posted 15 days ago                 │
│ (未过期，还有 15 天有效期)           │
│                                     │
│ [Edit] [Republish] [Delete]        │ ← Republish 按钮（绿色）
└─────────────────────────────────────┘
```

```
┌─────────────────────────────────────┐
│ Junior Developer                    │
│ [Archived] Badge                    │
│                                     │
│ Startup Inc • Sydney • Part-time   │
│                                     │
│ Posted 35 days ago                 │
│ (已过期)                            │
│                                     │
│ [Edit] [Republish] [Delete]        │ ← Republish 可点击，但会提示过期
└─────────────────────────────────────┘
```

### Republish 确认弹窗（未过期）

```
┌─────────────────────────────────────┐
│ Republish Job Posting          [×] │
│                                     │
│      🔄 Republish Icon (Green)      │
│                                     │
│ Republish "Senior Software          │
│ Engineer"?                          │
│                                     │
│ This will make the job posting     │
│ visible to candidates again. It    │
│ will appear in the Published tab   │
│ and candidates can apply.          │
│                                     │
│    [Cancel]  [Republish Job]       │
│             (Green button)          │
└─────────────────────────────────────┘
```

### Republish 错误弹窗（已过期）

```
┌─────────────────────────────────────┐
│ Cannot Republish               [×] │
│                                     │
│      ⚠️ Error Icon (Red)            │
│                                     │
│ "Senior Software Engineer"         │
│ has expired                        │
│                                     │
│ This job posting's 30-day validity │
│ period has ended. You cannot       │
│ republish an expired job. Please   │
│ create a new job posting instead.  │
│                                     │
│              [Close]                │
└─────────────────────────────────────┘
```

## 🔐 权限和验证

### API 验证流程

```typescript
// 1. 身份验证
const authHeader = request.headers.get('authorization');
if (!authHeader) return 401;

// 2. 所有权验证
if (jobPosting.userId !== user.id) return 403;

// 3. 状态验证
if (jobPosting.status !== 'ARCHIVED') 
  return 400 "Only archived jobs can be republished";

// 4. 过期验证
const expired = await isJobPostingExpired(jobPostingId);
if (expired) 
  return 400 "Cannot republish expired job posting";

// 5. 支付验证
if (jobPosting.purchase?.paymentStatus !== 'SUCCEEDED')
  return 400 "Cannot republish job posting without successful payment";
```

### 前端保护

- 只对 ARCHIVED 状态显示 Republish 按钮
- 点击时先检查是否过期
- 显示 "Checking..." 加载状态
- 过期时禁用 Republish 操作

## 📊 状态流转

### 正常重新发布

```
PUBLISHED (已发布)
    ↓
雇主手动 Archive
    ↓
ARCHIVED (已归档)
    ↓
雇主点击 Republish (未过期)
    ↓
PUBLISHED (重新发布) ← 回到发布状态
```

### 过期无法重新发布

```
PUBLISHED (已发布) - 有效期 30 天
    ↓
雇主手动 Archive (第 10 天)
    ↓
ARCHIVED (已归档) - 剩余 20 天有效期
    ↓
时间流逝...
    ↓
过期 (第 30 天)
    ↓
雇主尝试 Republish
    ↓
❌ 失败：职位已过期
    ↓
提示创建新职位
```

## 🧪 测试场景

### 测试 1: 重新发布未过期的 Archived 职位

```bash
1. 创建并支付职位（状态：PUBLISHED）
2. 手动归档职位（状态：ARCHIVED）
3. 确认未过期（例如：第 10 天，还有 20 天有效期）
4. 在 Archived 标签页查看
5. ✅ 验证显示 [Republish] 按钮（绿色）
6. 点击 [Republish]
7. ✅ 验证显示 "Checking..." 状态
8. ✅ 验证显示重新发布确认弹窗
9. ✅ 验证弹窗内容正确（绿色图标，确认文案）
10. 点击 [Republish Job]
11. ✅ 验证职位状态变为 PUBLISHED
12. ✅ 验证职位出现在 Published 标签页
13. ✅ 验证职位从 Archived 标签页消失
```

### 测试 2: 尝试重新发布已过期的 Archived 职位

```bash
1. 创建并支付职位
2. 手动归档职位
3. 修改数据库，设置 expires_at 为过去时间
   UPDATE job_posting_purchases 
   SET expires_at = NOW() - INTERVAL '1 day'
   WHERE job_posting_id = 'xxx';
4. 在 Archived 标签页查看
5. ✅ 验证仍显示 [Republish] 按钮
6. 点击 [Republish]
7. ✅ 验证显示错误弹窗
8. ✅ 验证弹窗标题为 "Cannot Republish"
9. ✅ 验证显示红色错误图标
10. ✅ 验证显示过期提示文案
11. ✅ 验证只有 [Close] 按钮，没有 [Republish Job] 按钮
12. 点击 [Close]
13. ✅ 验证职位仍为 ARCHIVED 状态
```

### 测试 3: API 直接调用（已过期）

```bash
# 获取已过期的 ARCHIVED 职位 ID
JOB_ID="xxx"
TOKEN="yyy"

# 尝试重新发布
curl -X PATCH \
  http://localhost:3000/api/job-postings/$JOB_ID/republish \
  -H "Authorization: Bearer $TOKEN"

# ✅ 验证返回 400 错误
# ✅ 验证错误消息："Cannot republish expired job posting"
```

### 测试 4: 尝试重新发布 PUBLISHED 职位（应失败）

```bash
# 获取 PUBLISHED 职位 ID
JOB_ID="xxx"

# 尝试重新发布
curl -X PATCH \
  http://localhost:3000/api/job-postings/$JOB_ID/republish \
  -H "Authorization: Bearer $TOKEN"

# ✅ 验证返回 400 错误
# ✅ 验证错误消息："Only archived jobs can be republished"
```

### 测试 5: 权限验证

```bash
1. 用户 A 创建并归档职位
2. 用户 B 尝试重新发布用户 A 的职位
3. ✅ 验证返回 403 Forbidden
```

### 测试 6: 重新发布后的有效期

```bash
1. 创建职位（支付时间：Day 1，过期时间：Day 31）
2. 归档职位（Day 10）
3. 重新发布（Day 15）
4. ✅ 验证过期时间仍为 Day 31（不会重置）
5. 等待到 Day 32
6. ✅ 验证 Cron Job 将职位变为 CLOSED
```

## 🔄 与有效期的关系

### 有效期不会重置

**重要**：重新发布 **不会** 重置 30 天有效期。

```
支付成功：Day 1
  ├─ expires_at = Day 31
  ↓
归档：Day 10
  ├─ 状态：ARCHIVED
  ├─ expires_at 仍为 Day 31（不变）
  ↓
重新发布：Day 15
  ├─ 状态：PUBLISHED
  ├─ expires_at 仍为 Day 31（不变）
  ↓
自动关闭：Day 31
  ├─ Cron Job 检查 expires_at < NOW()
  ├─ 状态：CLOSED
```

### 如果想延长有效期

需要重新支付（未来功能）：

```
1. 归档职位
2. 创建新的支付
3. 重新设置 30 天有效期
4. 重新发布
```

## 🎨 颜色主题

### Republish (绿色)
- Border: `#10b981`
- Background Hover: `#10b981`
- Modal Button: `#10b981`
- Modal Button Hover: `#059669`

### 状态对比

| 操作 | 颜色 | 含义 |
|------|------|------|
| Delete | 红色 `#dc2626` | 危险操作 |
| Archive | 橙色 `#f59e0b` | 警告操作 |
| Republish | 绿色 `#10b981` | 成功/恢复操作 |

## 🔧 技术实现细节

### 检查过期逻辑

```typescript
// 前端：点击 Republish 时检查
const response = await fetch(`/api/job-postings/${id}/expiry`);
const data = await response.json();

if (data.expiry.isExpired) {
  // 显示错误弹窗
  setJobToRepublish({ id, title, expired: true });
} else {
  // 显示确认弹窗
  setJobToRepublish({ id, title, expired: false });
}
```

```typescript
// 后端：执行 Republish 时再次验证
const expired = await isJobPostingExpired(jobPostingId);
if (expired) {
  return NextResponse.json(
    { error: 'Cannot republish expired job posting...' },
    { status: 400 }
  );
}
```

### 双重验证的原因

1. **前端验证**：提供即时反馈，改善用户体验
2. **后端验证**：确保安全性，防止直接 API 调用

## 📝 数据库查询

### 查询可重新发布的 Archived 职位

```sql
SELECT 
  jp.id,
  jp.job_title,
  jp.status,
  jpp.paid_at,
  jpp.expires_at,
  jpp.payment_status,
  CASE 
    WHEN jpp.expires_at > NOW() THEN 'Can Republish'
    ELSE 'Expired - Cannot Republish'
  END AS republish_status,
  EXTRACT(DAY FROM (jpp.expires_at - NOW())) AS days_remaining
FROM job_postings jp
JOIN job_posting_purchases jpp ON jp.id = jpp.job_posting_id
WHERE jp.status = 'ARCHIVED'
  AND jpp.payment_status = 'SUCCEEDED'
ORDER BY jpp.expires_at DESC;
```

### 重新发布操作日志

```sql
-- 记录状态变更历史（如果需要）
CREATE TABLE job_posting_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id UUID NOT NULL REFERENCES job_postings(id),
  old_status VARCHAR(20) NOT NULL,
  new_status VARCHAR(20) NOT NULL,
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason VARCHAR(100)
);

-- 插入重新发布记录
INSERT INTO job_posting_status_history 
  (job_posting_id, old_status, new_status, changed_by, reason)
VALUES 
  ('job-id', 'ARCHIVED', 'PUBLISHED', 'user-id', 'Republished');
```

## 🚀 未来增强

### 短期优化

1. **批量重新发布**
   - 选择多个 Archived 职位
   - 一次性重新发布

2. **重新发布时编辑**
   - 在重新发布前允许编辑
   - 更新职位信息

3. **有效期显示**
   - 在职位卡片显示剩余天数
   - "15 days remaining" 提示

### 长期优化

1. **延长有效期**
   - 支付额外费用
   - 延长 30 天有效期
   - 无需重新创建职位

2. **自动提醒**
   - 职位即将过期提醒
   - 建议归档或延期

3. **重新发布统计**
   - 记录重新发布次数
   - 分析职位表现

## ✅ 部署清单

- [x] 创建 Republish API route
- [x] 更新职位列表页面
- [x] 添加 Republish 按钮（仅 ARCHIVED 职位）
- [x] 添加过期检查逻辑
- [x] 添加 Republish Modal（成功和错误状态）
- [x] 添加 CSS 样式（绿色主题）
- [x] 编写文档

### 测试清单

- [ ] 测试重新发布未过期职位
- [ ] 测试重新发布已过期职位（应显示错误）
- [ ] 测试 API 权限验证
- [ ] 测试 API 状态验证
- [ ] 测试 API 过期验证
- [ ] 测试重新发布后职位出现在 Published
- [ ] 测试有效期不会重置

## 🎉 总结

Republish 功能已完整实现：

- ✅ Archived 职位显示 Republish 按钮
- ✅ 自动检查职位是否过期
- ✅ 未过期：显示确认弹窗，允许重新发布
- ✅ 已过期：显示错误提示，禁止重新发布
- ✅ 完整的权限验证和状态验证
- ✅ 友好的用户界面和错误提示
- ✅ 绿色主题，符合"恢复"操作语义

雇主现在可以灵活管理已归档的职位，在有效期内重新激活！🚀
