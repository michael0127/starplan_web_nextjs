# Auth Components

共享的认证相关组件和样式。

## 组件结构

```
src/components/auth/
├── AuthLayout.tsx              # 认证页面布局组件（包含顶部栏、营销面板、版权信息）
├── AuthLayout.module.css       # 布局样式
├── AuthForm.module.css         # 表单通用样式
├── GoogleButton.tsx           # Google登录/注册按钮组件
├── PasswordInput.tsx           # 密码输入组件
└── README.md                   # 本文档
```

## 使用方式

### AuthLayout

包裹整个认证页面，提供统一的布局：

```tsx
import AuthLayout from '@/components/auth/AuthLayout';
import { usePageAnimation } from '@/hooks/usePageAnimation';

export default function Login() {
  const mounted = usePageAnimation();
  
  return (
    <AuthLayout mounted={mounted}>
      {/* 页面内容 */}
    </AuthLayout>
  );
}
```

### GoogleButton

Google登录/注册按钮：

```tsx
import GoogleButton from '@/components/auth/GoogleButton';

<GoogleButton>Continue with Google</GoogleButton>
```

### PasswordInput

密码输入框组件（带显示/隐藏功能）：

```tsx
import PasswordInput from '@/components/auth/PasswordInput';

<PasswordInput 
  id="password"
  label="Password"
  placeholder="Enter your password"
  required
  errorId="passwordError"
/>
```

## 样式类

所有表单相关的样式类都在 `AuthForm.module.css` 中，包括：
- `.form`, `.formItem`, `.label`, `.input`
- `.button`, `.continueBtn`
- `.divider`, `.googleLoginBtn`
- `.passwordContainer`, `.passwordToggle`
- `.errorMessage`, `.successMessage`
- `.title`, `.subtitle`
- 等等...

## Hooks

### usePageAnimation

处理页面进入动画和body滚动：

```tsx
import { usePageAnimation } from '@/hooks/usePageAnimation';

const mounted = usePageAnimation();
```

