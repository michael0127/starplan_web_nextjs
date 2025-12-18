# 数据库迁移说明

## 概述

本次更新添加了职位发布购买功能，需要运行数据库迁移来创建相关表和字段。

## 迁移内容

### 新增 Enums
- `ProductType`: JUNIOR, SENIOR
- `PaymentStatus`: PENDING, PROCESSING, SUCCEEDED, FAILED, CANCELED, REFUNDED

### 新增表
- `job_posting_purchases`: 职位发布购买记录表

### 修改表
- `job_postings`: 添加 `purchase` 关联字段

## 迁移步骤

### 1. 备份数据库（重要！）

在运行迁移之前，请先备份数据库：

```bash
# 使用 pg_dump 备份
pg_dump -h your-host -U postgres -d postgres > backup_$(date +%Y%m%d_%H%M%S).sql
```

或者在 Supabase Dashboard 中创建备份：
1. 进入项目设置
2. Database → Backups
3. 创建手动备份

### 2. 检查 Prisma Schema

确认 `prisma/schema.prisma` 文件包含以下内容：

```prisma
enum ProductType {
  JUNIOR
  SENIOR
}

enum PaymentStatus {
  PENDING
  PROCESSING
  SUCCEEDED
  FAILED
  CANCELED
  REFUNDED
}

model JobPostingPurchase {
  // ... (完整模型定义)
}
```

### 3. 运行迁移

#### 方法一：使用 Prisma Migrate（推荐）

```bash
# 生成迁移文件
npx prisma migrate dev --name add_job_posting_purchase

# 如果上一步成功，则无需执行下面的命令
# 如果失败，可以使用 db push（不推荐用于生产环境）
npx prisma db push
```

#### 方法二：手动执行 SQL（如果 Prisma Migrate 失败）

如果遇到 TLS 证书问题或其他连接问题，可以在 Supabase SQL Editor 中手动执行以下 SQL：

```sql
-- 创建 ProductType enum
CREATE TYPE "ProductType" AS ENUM ('JUNIOR', 'SENIOR');

-- 创建 PaymentStatus enum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELED', 'REFUNDED');

-- 创建 job_posting_purchases 表
CREATE TABLE "job_posting_purchases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "job_posting_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "product_type" "ProductType" NOT NULL,
    "stripe_product_id" TEXT NOT NULL,
    "stripe_price_id" TEXT NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "stripe_customer_id" TEXT,
    "stripe_payment_intent_id" TEXT,
    "stripe_session_id" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'aud',
    "paid_at" TIMESTAMP(3),
    "refunded_at" TIMESTAMP(3),
    "canceled_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_posting_purchases_pkey" PRIMARY KEY ("id")
);

-- 创建唯一约束
ALTER TABLE "job_posting_purchases" ADD CONSTRAINT "job_posting_purchases_job_posting_id_key" UNIQUE ("job_posting_id");

-- 创建索引
CREATE INDEX "job_posting_purchases_user_id_idx" ON "job_posting_purchases"("user_id");
CREATE INDEX "job_posting_purchases_payment_status_idx" ON "job_posting_purchases"("payment_status");
CREATE INDEX "job_posting_purchases_stripe_payment_intent_id_idx" ON "job_posting_purchases"("stripe_payment_intent_id");
CREATE INDEX "job_posting_purchases_stripe_customer_id_idx" ON "job_posting_purchases"("stripe_customer_id");

-- 添加外键约束
ALTER TABLE "job_posting_purchases" ADD CONSTRAINT "job_posting_purchases_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

### 4. 验证迁移

运行以下命令验证迁移是否成功：

```bash
# 检查数据库状态
npx prisma migrate status

# 在数据库中验证表是否存在
# 在 Supabase SQL Editor 中运行：
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'job_posting_purchases';
```

### 5. 重新生成 Prisma Client

```bash
npx prisma generate
```

### 6. 测试

创建测试脚本验证新表：

```typescript
// test-purchase.ts
import { prisma } from './src/lib/prisma';
import { ProductType, PaymentStatus } from '@prisma/client';

async function testPurchase() {
  try {
    // 测试创建购买记录
    const purchase = await prisma.jobPostingPurchase.create({
      data: {
        jobPostingId: 'your-job-posting-id',
        userId: 'your-user-id',
        productType: ProductType.JUNIOR,
        stripeProductId: 'prod_TcmwWtCeq8zV3Z',
        stripePriceId: 'price_1SfXN5FNsxPjNnLXgWKViqTx',
        amount: 3000,
        currency: 'aud',
        paymentStatus: PaymentStatus.PENDING,
      },
    });

    console.log('Purchase created:', purchase);

    // 清理测试数据
    await prisma.jobPostingPurchase.delete({
      where: { id: purchase.id },
    });

    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testPurchase();
```

## 故障排查

### TLS 连接错误

如果遇到 "Error opening a TLS connection: bad certificate format" 错误：

1. **使用 db push 代替 migrate**:
   ```bash
   npx prisma db push
   ```

2. **检查连接字符串**:
   确保 `.env` 文件中的 `DATABASE_URL` 和 `DIRECT_URL` 正确

3. **手动执行 SQL**:
   在 Supabase Dashboard 的 SQL Editor 中手动执行上述 SQL

### 表已存在错误

如果表已存在：

```bash
# 重置数据库（警告：会删除所有数据！）
npx prisma migrate reset

# 或者删除特定表
# 在 Supabase SQL Editor 中：
DROP TABLE IF EXISTS "job_posting_purchases" CASCADE;
DROP TYPE IF EXISTS "ProductType" CASCADE;
DROP TYPE IF EXISTS "PaymentStatus" CASCADE;
```

### 迁移状态不一致

```bash
# 查看迁移状态
npx prisma migrate status

# 标记迁移为已应用（如果手动执行了 SQL）
npx prisma migrate resolve --applied add_job_posting_purchase
```

## 回滚迁移

如果需要回滚：

```sql
-- 删除外键约束
ALTER TABLE "job_posting_purchases" DROP CONSTRAINT IF EXISTS "job_posting_purchases_job_posting_id_fkey";

-- 删除表
DROP TABLE IF EXISTS "job_posting_purchases";

-- 删除枚举类型
DROP TYPE IF EXISTS "ProductType";
DROP TYPE IF EXISTS "PaymentStatus";
```

## 生产环境部署

在生产环境部署时：

1. **先在测试/staging 环境测试**
2. **创建数据库备份**
3. **使用迁移而非 db push**:
   ```bash
   npx prisma migrate deploy
   ```
4. **监控应用日志**
5. **准备回滚方案**

## 后续步骤

迁移完成后：

1. ✅ 测试 API 端点
2. ✅ 配置 Stripe Webhook
3. ✅ 测试购买流程
4. ✅ 部署到生产环境

## 相关文档

- [Prisma Migrate 文档](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Supabase 数据库管理](https://supabase.com/docs/guides/database)
- [STRIPE_PURCHASE_FLOW.md](./STRIPE_PURCHASE_FLOW.md) - 完整购买流程文档




