# Payment Cancellation 处理

## ✅ 实现内容

已实现支付取消后返回到编辑页面的功能。

## 🔄 工作流程

### 用户操作流程

1. **用户在 Step 4** → 点击 "Proceed to Payment"
2. **重定向到 Stripe** → 进入 Stripe Checkout 页面
3. **用户取消支付** → 点击 Stripe 页面的 "Back" 或关闭页面
4. **Stripe 重定向** → 返回到 `cancelUrl`
5. **返回 Step 4** → 显示在原来的职位编辑页面
6. **显示提示** → "Payment was canceled. You can try again when ready."
7. **可以重试** → 用户可以再次点击 "Proceed to Payment"

### Cancel URL 设置

```typescript
cancelUrl: `${window.location.origin}/employer/jobs/new?edit=${jobId}&step=4&payment=canceled`
```

**URL 参数说明：**
- `edit=${jobId}` - 编辑模式，加载已保存的职位数据
- `step=4` - 直接跳转到 Step 4（Review & Payment）
- `payment=canceled` - 标记支付已取消

### Success URL 设置

```typescript
successUrl: `${window.location.origin}/employer/jobs?success=true&job=${jobId}`
```

**说明：**
- 支付成功后跳转到职位列表页面
- 显示成功消息
- 职位状态由 Webhook 自动更新为 `PUBLISHED`

## 📝 代码实现

### 1. URL 参数读取

```typescript
const editId = searchParams.get('edit');
const stepParam = searchParams.get('step');
const paymentStatus = searchParams.get('payment');
```

### 2. 初始步骤设置

```typescript
const [currentStep, setCurrentStep] = useState(stepParam ? parseInt(stepParam) : 1);
```

**逻辑：**
- 如果 URL 中有 `step` 参数，使用该值
- 否则默认从 Step 1 开始

### 3. 支付取消处理

```typescript
useEffect(() => {
  if (paymentStatus === 'canceled') {
    setPurchaseError('Payment was canceled. You can try again when ready.');
    // Clear the payment status from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('payment');
    window.history.replaceState({}, '', url.toString());
  }
}, [paymentStatus]);
```

**功能：**
1. 检测到 `payment=canceled` 参数
2. 设置错误消息（显示在支付区域）
3. 清除 URL 中的 `payment` 参数（避免刷新时重复提示）
4. 保持在 Step 4，允许用户重试

## 🎨 用户界面

### 取消后的显示

```
┌─────────────────────────────────────┐
│  Review Your Job Posting            │
│  ┌─────────────────────────────┐    │
│  │ Job Details...              │    │
│  └─────────────────────────────┘    │
│                                      │
│  ┌─────────────────────────────┐    │
│  │ Complete Payment            │    │
│  │                             │    │
│  │ ⚠️ Payment was canceled.    │ ◄── 错误提示
│  │    You can try again when   │
│  │    ready.                   │
│  │                             │    │
│  │ [🔒 Proceed to Payment]     │ ◄── 可以重试
│  └─────────────────────────────┘    │
│                                      │
│  [← Back to Edit]                   │
└─────────────────────────────────────┘
```

### CSS 样式

错误消息使用现有的 `.errorMessage` 样式：

```css
.errorMessage {
  margin: 1rem 0;
  padding: 0.9rem;
  background: #fed7d7;
  border: 2px solid #fc8181;
  border-radius: 8px;
}

.errorMessage p {
  margin: 0;
  color: #c53030;
  font-size: 0.85rem;
  font-weight: 600;
}
```

## 🔧 技术细节

### URL 参数清理

使用 `window.history.replaceState` 清除参数：

```typescript
const url = new URL(window.location.href);
url.searchParams.delete('payment');
window.history.replaceState({}, '', url.toString());
```

**好处：**
- 不会触发页面刷新
- 用户刷新页面时不会再次看到取消消息
- 保持其他 URL 参数（`edit`, `step`）

### 状态保持

取消后保持在 Step 4：
1. URL 中有 `step=4` 参数
2. 组件初始化时读取并设置 `currentStep`
3. 所有表单数据保持不变（通过 `edit=${jobId}` 加载）

## 📊 完整流程图

```
用户点击 "Proceed to Payment"
    ↓
保存职位草稿
    ↓
创建 Stripe Checkout Session
    ↓
重定向到 Stripe
    ↓
┌─────────────────────────────────┐
│ 用户在 Stripe 页面              │
│                                 │
│  [完成支付]  →  成功页面        │ → /employer/jobs?success=true
│                                 │
│  [取消/返回]  →  返回编辑       │ → /employer/jobs/new?edit={id}&step=4&payment=canceled
└─────────────────────────────────┘
    ↓ (取消路径)
加载 Step 4
    ↓
显示错误提示
    ↓
用户可以：
  - 重新点击支付
  - 返回修改职位信息
  - 保存为草稿
```

## ✨ 用户体验优化

### 1. 无缝返回
- 直接返回到 Step 4，无需重新填写
- 所有数据保持不变
- 继续在原来的位置

### 2. 清晰反馈
- 明确提示支付已取消
- 告知可以重试
- 不影响已填写的内容

### 3. 灵活操作
- 可以立即重试支付
- 可以返回修改内容
- 可以保存为草稿稍后处理

### 4. 智能清理
- 自动清除 URL 中的临时参数
- 避免刷新时重复显示消息
- 保持 URL 整洁

## 🧪 测试场景

### 场景 1：支付取消
```bash
1. 填写 Step 1-3
2. 进入 Step 4
3. 点击 "Proceed to Payment"
4. 在 Stripe 页面点击 "Back"
5. ✅ 验证返回到 Step 4
6. ✅ 验证显示取消消息
7. ✅ 验证所有数据保持不变
8. ✅ 验证可以重新支付
```

### 场景 2：取消后重试
```bash
1. 从场景 1 继续
2. 再次点击 "Proceed to Payment"
3. 完成支付
4. ✅ 验证支付成功
5. ✅ 验证跳转到职位列表
6. ✅ 验证职位状态为 PUBLISHED
```

### 场景 3：取消后编辑
```bash
1. 从场景 1 继续
2. 点击 "Back to Edit"
3. 修改职位信息
4. 再次进入 Step 4
5. ✅ 验证修改已保存
6. ✅ 验证可以支付
```

### 场景 4：刷新页面
```bash
1. 从场景 1 继续
2. 刷新页面
3. ✅ 验证不再显示取消消息
4. ✅ 验证停留在 Step 4
5. ✅ 验证数据完整
```

## 🔐 安全考虑

### 1. 数据保护
- 取消支付不影响已保存的草稿
- 所有数据保持加密传输
- 不在 URL 中暴露敏感信息

### 2. 状态验证
- 每次操作验证用户身份
- 验证职位所有权
- 防止未授权访问

### 3. 重试控制
- 无限次重试机会
- 每次都创建新的 Checkout Session
- 防止重复支付（服务端检查）

## 📈 可能的改进

### 短期优化
1. **倒计时提示**：支付取消后显示 "您可以在 X 分钟内继续支付"
2. **原因收集**：询问用户取消支付的原因
3. **优惠提醒**：取消后显示优惠信息鼓励完成支付

### 长期优化
1. **保存支付意图**：记录用户尝试支付但取消的行为
2. **跟进邮件**：发送提醒邮件
3. **价格优化**：基于取消率调整定价策略
4. **A/B 测试**：测试不同的取消后提示

## ✅ 实现检查清单

- [x] Cancel URL 指向编辑页面
- [x] URL 包含 `edit`, `step`, `payment` 参数
- [x] 读取并处理 URL 参数
- [x] 显示取消错误消息
- [x] 清除临时 URL 参数
- [x] 保持在 Step 4
- [x] 允许重新支付
- [x] 保持表单数据
- [x] Success URL 指向职位列表
- [x] 无 TypeScript 错误

## 🎉 总结

支付取消处理已完整实现：
- ✅ 返回到原职位的 Step 4
- ✅ 显示友好的取消提示
- ✅ 保持所有填写的数据
- ✅ 允许立即重试支付
- ✅ 智能清理临时参数
- ✅ 完整的用户体验

用户可以在支付取消后无缝继续操作！

