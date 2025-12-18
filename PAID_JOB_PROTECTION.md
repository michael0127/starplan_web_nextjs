# Paid Job Posting Protection

## 概述

已付费的职位发布不允许被删除，只能归档。这样可以：
- 保护付费数据不被误删
- 保留支付记录和购买历史
- 确保财务审计追溯性

## 实现逻辑

### DELETE API 保护

```typescript
// src/app/api/job-postings/[id]/route.ts

// Check if job posting has a successful payment
if (jobPosting.purchase && jobPosting.purchase.paymentStatus === 'SUCCEEDED') {
  return NextResponse.json(
    { error: 'Cannot delete a paid job posting. Please archive it instead.' },
    { status: 403 }
  );
}
```

### 检查条件

删除职位时会检查：
1. **是否有购买记录** - `jobPosting.purchase` 存在
2. **支付状态** - `paymentStatus === 'SUCCEEDED'`

如果满足这两个条件，则**禁止删除**。

## 允许删除的情况

可以删除的职位：
- ✅ 未付费的草稿（`DRAFT`）
- ✅ 支付失败的职位（`paymentStatus: 'FAILED'`）
- ✅ 支付取消的职位（`paymentStatus: 'CANCELED'`）
- ✅ 没有购买记录的职位
- ✅ 支付待处理的职位（`paymentStatus: 'PENDING'`）

## 禁止删除的情况

不可删除的职位：
- ❌ 支付成功的职位（`paymentStatus: 'SUCCEEDED'`）
- ❌ 已退款的职位（`paymentStatus: 'REFUNDED'`）- 需要保留退款记录

## 正确的操作流程

### 如果想移除已付费的职位

使用 **PATCH** 更新状态为 `ARCHIVED`：

```bash
# API 调用
PATCH /api/job-postings/{id}
{
  "status": "ARCHIVED"
}
```

**前端调用示例：**

```typescript
const archiveJob = async (jobId: string) => {
  const response = await fetch(`/api/job-postings/${jobId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      status: 'ARCHIVED',
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to archive job posting');
  }
  
  return response.json();
};
```

### 归档 vs 删除

| 操作 | 适用场景 | 数据保留 | 可恢复 |
|------|---------|---------|--------|
| **归档** (ARCHIVED) | 已付费的职位 | ✅ 完整保留 | ✅ 可以改回 PUBLISHED |
| **删除** (DELETE) | 未付费的草稿 | ❌ 永久删除 | ❌ 不可恢复 |

## API 响应

### 成功删除（未付费职位）

```json
{
  "success": true,
  "message": "Job posting deleted successfully"
}
```

### 禁止删除（已付费职位）

```json
{
  "error": "Cannot delete a paid job posting. Please archive it instead."
}
```

**HTTP 状态码：** `403 Forbidden`

## 前端处理建议

### 1. 删除按钮逻辑

```typescript
const canDelete = (jobPosting: JobPosting) => {
  // 如果没有购买记录，可以删除
  if (!jobPosting.purchase) return true;
  
  // 如果支付成功或已退款，不可删除
  if (jobPosting.purchase.paymentStatus === 'SUCCEEDED' || 
      jobPosting.purchase.paymentStatus === 'REFUNDED') {
    return false;
  }
  
  return true;
};
```

### 2. UI 显示

```tsx
{canDelete(jobPosting) ? (
  <button onClick={() => handleDelete(jobPosting.id)}>
    🗑️ Delete
  </button>
) : (
  <button onClick={() => handleArchive(jobPosting.id)}>
    📦 Archive
  </button>
)}
```

### 3. 错误处理

```typescript
const handleDelete = async (jobId: string) => {
  try {
    const response = await fetch(`/api/job-postings/${jobId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      
      if (response.status === 403 && error.error.includes('paid')) {
        // 提示用户改用归档
        alert('This is a paid job posting. Please archive it instead of deleting.');
        return;
      }
      
      throw new Error(error.error || 'Failed to delete');
    }
    
    // 删除成功
    console.log('Job posting deleted successfully');
  } catch (error) {
    console.error('Delete error:', error);
  }
};
```

## 数据库层面的保护

### Cascade Delete 策略

```prisma
model JobPosting {
  // ...
  purchase JobPostingPurchase?
}

model JobPostingPurchase {
  jobPosting JobPosting @relation(fields: [jobPostingId], references: [id], onDelete: Cascade)
}
```

**说明：**
- 如果 `JobPosting` 被删除，关联的 `JobPostingPurchase` 也会被删除
- 但 API 层面已经阻止了删除付费职位
- 这是双重保护机制

## 审计追溯

### 为什么要保护已付费职位？

1. **财务审计**
   - 需要保留所有交易记录
   - Stripe 交易 ID 必须与数据库记录对应

2. **法律合规**
   - 支付记录可能需要保留数年
   - 退款、争议处理需要历史数据

3. **数据完整性**
   - 保持 Stripe 和数据库的一致性
   - 避免孤立的 Stripe 交易

4. **用户保护**
   - 防止误删付费内容
   - 可以恢复归档的职位

## 特殊情况处理

### 1. 退款后的职位

退款后的职位仍然**不允许删除**：

```typescript
if (jobPosting.purchase?.paymentStatus === 'REFUNDED') {
  // Still cannot delete - need to keep refund records
  return 403;
}
```

**原因：**
- 需要保留退款记录
- 财务审计需要
- 可能涉及争议处理

### 2. 管理员强制删除

如果确实需要删除（例如违规内容），应该：

1. **创建管理员 API**（需要特殊权限）
2. **记录删除日志**（谁、何时、为什么删除）
3. **保留核心数据**（至少保留购买记录）

```typescript
// 管理员 API 示例（未实现）
POST /api/admin/job-postings/{id}/force-delete
Authorization: Bearer {admin_token}

{
  "reason": "Violation of terms",
  "keepPurchaseRecord": true
}
```

### 3. 批量清理

定期清理可删除的职位：

```sql
-- 只删除未付费的草稿（超过90天）
DELETE FROM job_postings 
WHERE status = 'DRAFT' 
  AND created_at < NOW() - INTERVAL '90 days'
  AND id NOT IN (
    SELECT job_posting_id 
    FROM job_posting_purchases 
    WHERE payment_status = 'SUCCEEDED'
  );
```

## 测试场景

### 场景 1: 尝试删除未付费草稿

```bash
DELETE /api/job-postings/{draft_id}
# ✅ 成功 - 200 OK
```

### 场景 2: 尝试删除已付费职位

```bash
DELETE /api/job-postings/{paid_id}
# ❌ 失败 - 403 Forbidden
# "Cannot delete a paid job posting. Please archive it instead."
```

### 场景 3: 归档已付费职位

```bash
PATCH /api/job-postings/{paid_id}
Body: { "status": "ARCHIVED" }
# ✅ 成功 - 200 OK
```

### 场景 4: 删除支付失败的职位

```bash
DELETE /api/job-postings/{failed_payment_id}
# ✅ 成功 - 200 OK
```

## 状态转换规则

```
DRAFT → DELETE ✅ (if not paid)
DRAFT → PUBLISHED ✅ (after payment)
PUBLISHED → ARCHIVED ✅
PUBLISHED → DELETE ❌ (if paid)
ARCHIVED → PUBLISHED ✅ (can restore)
ARCHIVED → DELETE ❌ (if paid)
CLOSED → DELETE ❌ (if paid)
CLOSED → ARCHIVED ✅
```

## 实现检查清单

- [x] API 层面检查 `paymentStatus === 'SUCCEEDED'`
- [x] 返回 403 错误和友好提示
- [x] 允许归档作为替代方案
- [x] 保护退款记录
- [x] 数据库 Cascade Delete 策略
- [x] 文档说明用户指南

## 总结

**规则：**
- ✅ 可以归档任何职位
- ✅ 只能删除未付费的职位
- ❌ 不能删除已付费的职位

**好处：**
- 🔒 保护付费数据
- 📊 保留审计追溯
- 💰 保持财务记录完整
- ♻️ 支持恢复归档职位

**用户体验：**
- 清晰的错误提示
- 提供替代方案（归档）
- 防止误删重要数据
