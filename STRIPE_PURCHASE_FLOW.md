# Stripe Job Posting Purchase Flow

## 概述

本文档描述了 employer 在发布职位时购买产品的完整流程。根据职位的经验等级（Experience Level），系统会自动选择对应的产品类型。

## 产品类型

### 1. Junior Product
- **适用经验等级**: `INTERN`, `JUNIOR`
- **Stripe Product ID**: `prod_TcmwWtCeq8zV3Z`
- **Price ID**: `price_1SfXN5FNsxPjNnLXgWKViqTx`
- **价格**: $30.00 AUD

### 2. Senior Product
- **适用经验等级**: `MID_LEVEL`, `SENIOR`, `LEAD`, `PRINCIPAL`
- **Stripe Product ID**: `prod_TcsyqfzZ8A2vRu`
- **Price ID**: `price_1SfdCTFNsxPjNnLXam3BHQ7m`
- **价格**: $300.00 AUD

## 数据库模型

### 新增 Enums

```prisma
enum ProductType {
  JUNIOR  // For INTERN, JUNIOR experience levels
  SENIOR  // For MID_LEVEL, SENIOR, LEAD, PRINCIPAL experience levels
}

enum PaymentStatus {
  PENDING
  PROCESSING
  SUCCEEDED
  FAILED
  CANCELED
  REFUNDED
}
```

### JobPostingPurchase 模型

```prisma
model JobPostingPurchase {
  id                    String        @id @default(uuid()) @db.Uuid
  jobPostingId          String        @unique @map("job_posting_id") @db.Uuid
  userId                String        @map("user_id") @db.Uuid
  
  // Product Information
  productType           ProductType   @map("product_type")
  stripeProductId       String        @map("stripe_product_id")
  stripePriceId         String        @map("stripe_price_id")
  
  // Payment Information
  paymentStatus         PaymentStatus @default(PENDING) @map("payment_status")
  stripeCustomerId      String?       @map("stripe_customer_id")
  stripePaymentIntentId String?       @map("stripe_payment_intent_id")
  stripeSessionId       String?       @map("stripe_session_id")
  
  // Pricing
  amount                Int           // Amount in cents
  currency              String        @default("aud")
  
  // Metadata
  paidAt                DateTime?     @map("paid_at")
  refundedAt            DateTime?     @map("refunded_at")
  canceledAt            DateTime?     @map("canceled_at")
  metadata              Json?
  
  createdAt             DateTime      @default(now()) @map("created_at")
  updatedAt             DateTime      @updatedAt @map("updated_at")

  // Relations
  jobPosting JobPosting @relation(fields: [jobPostingId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([paymentStatus])
  @@index([stripePaymentIntentId])
  @@index([stripeCustomerId])
  @@map("job_posting_purchases")
}
```

## 购买流程

### 1. 创建 Job Posting
用户通过 `/employer/jobs/new` 页面创建职位，包括设置 `experienceLevel`。

### 2. 触发购买流程
在最后一步，前端调用购买 API：

```typescript
POST /api/job-postings/{id}/purchase

// Request Body
{
  "successUrl": "https://yourdomain.com/employer/jobs?success=true",
  "cancelUrl": "https://yourdomain.com/employer/jobs/new?canceled=true"
}

// Response
{
  "purchaseId": "uuid",
  "sessionId": "cs_test_...",
  "sessionUrl": "https://checkout.stripe.com/...",
  "amount": 3000,
  "currency": "aud",
  "productType": "JUNIOR",
  "status": "PENDING"
}
```

### 3. 重定向到 Stripe Checkout
前端将用户重定向到 `sessionUrl`，用户在 Stripe Checkout 页面完成支付。

### 4. Stripe Webhook 处理
支付完成后，Stripe 发送 webhook 到 `/api/stripe/webhook`：

- **checkout.session.completed**: 更新购买状态为 `SUCCEEDED`，发布职位（`JobStatus.PUBLISHED`）
- **payment_intent.succeeded**: 确认支付成功
- **payment_intent.failed**: 标记支付失败
- **charge.refunded**: 处理退款

### 5. 用户返回成功页面
支付成功后，用户被重定向到 `successUrl`。

## API 端点

### POST /api/job-postings/[id]/purchase
创建 Stripe Checkout Session

**认证**: 需要 Bearer token

**请求体**:
```json
{
  "successUrl": "string",
  "cancelUrl": "string"
}
```

**响应**:
```json
{
  "purchaseId": "string",
  "sessionId": "string",
  "sessionUrl": "string",
  "amount": number,
  "currency": "string",
  "productType": "JUNIOR" | "SENIOR",
  "status": "PENDING"
}
```

### GET /api/job-postings/[id]/purchase
查询购买状态

**认证**: 需要 Bearer token

**响应**:
```json
{
  "purchaseId": "string",
  "jobPostingId": "string",
  "productType": "JUNIOR" | "SENIOR",
  "amount": number,
  "currency": "string",
  "paymentStatus": "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELED" | "REFUNDED",
  "paidAt": "string?",
  "createdAt": "string"
}
```

### POST /api/stripe/webhook
处理 Stripe webhook 事件

**认证**: Stripe 签名验证

## 辅助函数

### getProductTypeFromExperienceLevel
根据经验等级确定产品类型：

```typescript
import { getProductTypeFromExperienceLevel } from '@/lib/stripeProducts';

const productType = getProductTypeFromExperienceLevel('JUNIOR');
// Returns: ProductType.JUNIOR
```

### getStripeProductConfig
获取 Stripe 产品配置：

```typescript
import { getStripeProductConfig } from '@/lib/stripeProducts';

const config = getStripeProductConfig('SENIOR');
// Returns: {
//   productId: 'prod_TcsyqfzZ8A2vRu',
//   priceId: 'price_1SfdCTFNsxPjNnLXam3BHQ7m',
//   amount: 30000,
//   currency: 'aud',
//   name: 'Senior Job Posting',
//   description: '...'
// }
```

### formatCurrency
格式化货币显示：

```typescript
import { formatCurrency } from '@/lib/stripeProducts';

const formatted = formatCurrency(30000, 'aud');
// Returns: "$300.00"
```

## 数据库迁移

运行以下命令创建数据库迁移：

```bash
npx prisma migrate dev --name add_job_posting_purchase
```

## 测试 Webhook

使用 Stripe CLI 测试 webhook：

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## 环境变量

确保以下环境变量已配置：

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 前端集成示例

```typescript
// In your job posting form's final step
const handlePurchase = async (jobPostingId: string) => {
  try {
    const response = await fetch(`/api/job-postings/${jobPostingId}/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        successUrl: `${window.location.origin}/employer/jobs?success=true`,
        cancelUrl: `${window.location.origin}/employer/jobs/new?canceled=true`,
      }),
    });

    const data = await response.json();
    
    if (data.sessionUrl) {
      // Redirect to Stripe Checkout
      window.location.href = data.sessionUrl;
    }
  } catch (error) {
    console.error('Purchase error:', error);
  }
};
```

## 安全注意事项

1. **验证所有权**: API 验证用户是否拥有 job posting
2. **防止重复购买**: 检查是否已经存在成功的购买记录
3. **Webhook 签名验证**: 使用 Stripe 签名验证所有 webhook 请求
4. **密钥保护**: 不要在客户端暴露 `STRIPE_SECRET_KEY` 和 `STRIPE_WEBHOOK_SECRET`

## 后续扩展

1. **订阅模式**: 支持月度/年度订阅
2. **折扣码**: 集成 Stripe Coupons
3. **发票**: 自动生成和发送发票
4. **退款管理**: 提供退款界面
5. **分析报表**: 购买数据分析和报表




