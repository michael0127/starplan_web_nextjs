# 职位购买功能 - 快速入门指南

## 🚀 5 分钟快速开始

### 第一步：执行数据库迁移

选择最简单的方式：

```bash
cd /Users/michael/Documents/StarPlan/starplan_web_nextjs
npx prisma db push
```

如果遇到错误，在 Supabase SQL Editor 中执行：

```sql
-- 复制 MIGRATION_INSTRUCTIONS.md 中的完整 SQL
CREATE TYPE "ProductType" AS ENUM ('JUNIOR', 'SENIOR');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELED', 'REFUNDED');
-- ... (其余 SQL 语句)
```

### 第二步：验证环境变量

确认 `.env` 文件包含：

```env
STRIPE_SECRET_KEY=sk_test_51SezSJFNsxPjNnLX... ✅
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SezSJFNsxPjNnLX... ✅
STRIPE_WEBHOOK_SECRET=whsec_074e392569b084bebce4acdf3d98c63798d777ae6c9c7a8fc37411819523428c ✅
```

### 第三步：启动 Webhook 监听（开发环境）

在新终端窗口运行：

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

> 💡 这已经在你的 Terminal 3 中运行了！

### 第四步：集成到职位发布流程

在 `src/app/employer/jobs/new/page.tsx` 的最后一步添加：

```typescript
// 在表单提交成功后
const handleFinalSubmit = async () => {
  // ... 保存职位数据 ...
  
  // 重定向到购买页面
  router.push(`/employer/jobs/${jobPostingId}/purchase`);
};
```

### 第五步：测试购买流程

1. 访问: `http://localhost:3000/employer/jobs/new`
2. 填写职位信息（注意选择 `experienceLevel`）
3. 提交后会跳转到购买页面
4. 使用 Stripe 测试卡号: `4242 4242 4242 4242`
5. 完成支付

## 🧪 测试卡号

| 卡号 | 用途 | 结果 |
|------|------|------|
| 4242 4242 4242 4242 | 成功支付 | ✅ 支付成功 |
| 4000 0000 0000 0002 | 被拒绝 | ❌ 卡被拒绝 |
| 4000 0000 0000 9995 | 资金不足 | ❌ 资金不足 |

- **过期日期**: 任何未来日期 (例如: 12/34)
- **CVC**: 任何 3 位数字 (例如: 123)
- **邮编**: 任何 5 位数字 (例如: 12345)

## 📊 产品价格

| 经验等级 | 产品类型 | 价格 |
|---------|---------|------|
| Intern, Junior | Junior Package | $30.00 AUD |
| Mid-level, Senior, Lead, Principal | Senior Package | $300.00 AUD |

## 🔍 验证购买状态

### 方法 1: API 查询

```bash
curl -X GET http://localhost:3000/api/job-postings/{job-id}/purchase \
  -H "Authorization: Bearer {your-token}"
```

### 方法 2: 数据库查询

在 Supabase SQL Editor 中：

```sql
SELECT * FROM job_posting_purchases 
ORDER BY created_at DESC 
LIMIT 10;
```

### 方法 3: Prisma Studio

```bash
npx prisma studio
```

然后访问 `http://localhost:5555` 查看 `JobPostingPurchase` 表。

## 🎯 关键文件位置

### API 端点
- 购买: `src/app/api/job-postings/[id]/purchase/route.ts`
- Webhook: `src/app/api/stripe/webhook/route.ts`

### 前端组件
- 购买组件: `src/components/employer/JobPostingPurchase.tsx`
- 购买页面: `src/app/employer/jobs/[id]/purchase/page.tsx`

### 配置文件
- Stripe 产品: `src/lib/stripeProducts.ts`
- 类型定义: `src/types/purchase.ts`

## 🐛 常见问题

### Q1: Webhook 没有收到事件？
**A**: 确保 Stripe CLI 正在运行：
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Q2: 支付成功但职位状态没更新？
**A**: 检查 Webhook 签名是否正确：
```typescript
// 在 webhook route.ts 中添加日志
console.log('Webhook secret:', process.env.STRIPE_WEBHOOK_SECRET);
```

### Q3: 数据库迁移失败？
**A**: 使用手动 SQL 方式，参考 `MIGRATION_INSTRUCTIONS.md`

### Q4: 重复购买错误？
**A**: 系统会自动检测，如需重新测试，先删除已有购买记录：
```sql
DELETE FROM job_posting_purchases WHERE job_posting_id = 'your-job-id';
```

## 📱 前端集成示例

### 简单集成

```typescript
import { useRouter } from 'next/navigation';

function JobPostingForm() {
  const router = useRouter();
  
  const handleSubmit = async (data) => {
    // 保存职位
    const response = await fetch('/api/job-postings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    const jobPosting = await response.json();
    
    // 跳转到购买页面
    router.push(`/employer/jobs/${jobPosting.id}/purchase`);
  };
  
  return (/* your form */);
}
```

### 高级集成（带状态检查）

```typescript
import { useState, useEffect } from 'react';

function JobPostingFlow() {
  const [purchaseStatus, setPurchaseStatus] = useState(null);
  
  // 检查购买状态
  useEffect(() => {
    const checkPurchase = async () => {
      const response = await fetch(`/api/job-postings/${jobId}/purchase`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPurchaseStatus(data.paymentStatus);
      }
    };
    
    checkPurchase();
  }, [jobId]);
  
  if (purchaseStatus === 'SUCCEEDED') {
    return <SuccessMessage />;
  }
  
  return <PurchaseComponent />;
}
```

## 🔄 完整流程图

```
用户创建职位
    ↓
选择 Experience Level
    ↓
系统自动确定产品类型
(JUNIOR 或 SENIOR)
    ↓
点击 "Proceed to Payment"
    ↓
创建 Stripe Checkout Session
    ↓
重定向到 Stripe Checkout
    ↓
用户填写支付信息
    ↓
Stripe 处理支付
    ↓
Webhook 通知后端
    ↓
更新购买状态 → SUCCEEDED
更新职位状态 → PUBLISHED
    ↓
用户返回成功页面
```

## ✨ 下一步

1. ✅ 完成数据库迁移
2. ✅ 启动开发服务器: `npm run dev`
3. ✅ 启动 Webhook 监听
4. ✅ 测试完整流程
5. 🚀 部署到 staging 环境
6. 🚀 部署到生产环境

## 📚 更多文档

- **完整流程**: `STRIPE_PURCHASE_FLOW.md`
- **迁移说明**: `MIGRATION_INSTRUCTIONS.md`
- **实现总结**: `JOB_POSTING_PURCHASE_SUMMARY.md`

## 💡 提示

- 使用 `console.log` 调试 API 调用
- 检查浏览器 Network 选项卡查看请求
- 使用 Stripe Dashboard 查看支付事件
- 使用 Prisma Studio 查看数据库记录

---

**准备好了吗？** 开始执行第一步的数据库迁移吧！ 🚀




