# 邮箱验证配置指南 (Email Verification Setup)

## 📋 概述

本指南将帮助您在 Supabase 中启用邮箱验证功能，并配置用户点击验证邮件后自动跳转到 onboarding 页面。

## 🔧 Supabase Dashboard 配置步骤

### 1. 启用邮箱验证

1. 打开 **Supabase Dashboard**
   - 访问：https://supabase.com/dashboard/project/nhutoqszfhpszxyjddmm

2. 进入 **Authentication** 设置
   - 点击左侧菜单的 **Authentication**
   - 点击 **Providers** 标签

3. 配置 **Email Provider**
   - 找到 **Email** provider
   - 点击展开配置

4. **启用邮箱确认**
   - 找到 **"Confirm email"** 选项
   - 将其切换为 **ON（开启）** ✅
   - 点击 **Save** 保存

### 2. 配置重定向 URLs

1. 在 **Authentication** → **URL Configuration**

2. 添加以下 URLs 到 **Redirect URLs**：
   ```
   http://localhost:3000/auth/callback
   https://your-production-domain.com/auth/callback
   ```

3. 设置 **Site URL**：
   ```
   Development: http://localhost:3000
   Production: https://your-production-domain.com
   ```

## 📧 邮件模板配置

### 访问邮件模板设置

1. **Supabase Dashboard** → **Authentication** → **Email Templates**

2. 选择 **Confirm signup** 模板

### 推荐的邮件模板

#### 模板 1: 简洁专业版

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - StarPlan</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #4a5bf4 0%, #3544e4 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Welcome to StarPlan!</h1>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #252525; font-size: 22px; margin-bottom: 20px; font-weight: 600;">Verify Your Email Address</h2>
      
      <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        Thank you for signing up with StarPlan! We're excited to help you find your dream job with AI-powered matching.
      </p>

      <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
        To get started, please verify your email address by clicking the button below:
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 35px 0;">
        <a href="{{ .ConfirmationURL }}" 
           style="display: inline-block; padding: 15px 40px; background-color: #4a5bf4; color: #ffffff; text-decoration: none; border-radius: 25px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(74, 91, 244, 0.3);">
          Verify Email Address
        </a>
      </div>

      <p style="color: #888; font-size: 14px; line-height: 1.6; margin-top: 30px;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <p style="color: #4a5bf4; font-size: 13px; word-break: break-all; background-color: #f8f9fa; padding: 12px; border-radius: 6px; border-left: 3px solid #4a5bf4;">
        {{ .ConfirmationURL }}
      </p>

      <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e0e0e0;">
        <p style="color: #888; font-size: 13px; line-height: 1.6; margin: 0;">
          If you didn't create an account with StarPlan, please ignore this email.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
      <p style="color: #888; font-size: 12px; margin: 0 0 8px 0;">
        © 2024 StarPlan. All rights reserved.
      </p>
      <p style="color: #aaa; font-size: 11px; margin: 0;">
        AI-Powered Job Matching Platform
      </p>
    </div>

  </div>
</body>
</html>
```

#### 模板 2: 现代渐变版

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - StarPlan</title>
</head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
  
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.15);">
    
    <!-- Header with Icon -->
    <div style="background: linear-gradient(135deg, #4a5bf4 0%, #3544e4 100%); padding: 50px 20px; text-align: center; position: relative;">
      <div style="width: 80px; height: 80px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
        <div style="font-size: 40px;">✉️</div>
      </div>
      <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Welcome to StarPlan</h1>
    </div>

    <!-- Content -->
    <div style="padding: 50px 40px;">
      <h2 style="color: #252525; font-size: 24px; margin-bottom: 15px; font-weight: 600; text-align: center;">One More Step!</h2>
      
      <p style="color: #666; font-size: 16px; line-height: 1.7; text-align: center; margin-bottom: 15px;">
        You're almost ready to start your journey with StarPlan.
      </p>

      <p style="color: #666; font-size: 16px; line-height: 1.7; text-align: center; margin-bottom: 35px;">
        Please verify your email address to unlock all features.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="{{ .ConfirmationURL }}" 
           style="display: inline-block; padding: 18px 50px; background: linear-gradient(135deg, #4a5bf4 0%, #3544e4 100%); color: #ffffff; text-decoration: none; border-radius: 30px; font-size: 18px; font-weight: 700; box-shadow: 0 8px 25px rgba(74, 91, 244, 0.4); transition: all 0.3s ease;">
          Verify My Email →
        </a>
      </div>

      <!-- Features Preview -->
      <div style="background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%); padding: 30px; border-radius: 12px; margin: 35px 0;">
        <h3 style="color: #4a5bf4; font-size: 18px; margin: 0 0 20px 0; font-weight: 600;">What's Next?</h3>
        <ul style="color: #555; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Complete your profile</li>
          <li>Get AI-powered job recommendations</li>
          <li>Connect with top employers</li>
          <li>Track your applications</li>
        </ul>
      </div>

      <p style="color: #999; font-size: 13px; line-height: 1.6; margin-top: 35px; text-align: center;">
        If the button doesn't work, use this link:
      </p>
      <p style="color: #4a5bf4; font-size: 12px; word-break: break-all; background-color: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; margin: 10px 0 0 0;">
        {{ .ConfirmationURL }}
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
      <p style="color: #999; font-size: 12px; margin: 0 0 10px 0;">
        Didn't sign up? You can safely ignore this email.
      </p>
      <p style="color: #aaa; font-size: 11px; margin: 0;">
        © 2024 StarPlan - AI-Powered Career Platform
      </p>
    </div>

  </div>

  <!-- Outer spacing -->
  <div style="height: 20px;"></div>

</body>
</html>
```

#### 模板 3: 简约文本版 (纯文本备选)

```
Subject: Verify your email - StarPlan

Hi there,

Welcome to StarPlan! 🎉

Thank you for signing up. To complete your registration and start finding your dream job with AI-powered matching, please verify your email address.

Click here to verify: {{ .ConfirmationURL }}

After verification, you'll be redirected to complete your profile and get started.

What you can do with StarPlan:
• Get personalized job recommendations
• Match with top employers
• Track your applications
• Receive instant notifications

If you didn't create this account, please ignore this email.

Best regards,
The StarPlan Team

---
© 2024 StarPlan. All rights reserved.
```

## 📝 邮件模板变量说明

Supabase 提供以下模板变量：

- `{{ .ConfirmationURL }}` - 邮箱验证链接（必需）
- `{{ .Token }}` - 验证令牌
- `{{ .TokenHash }}` - 令牌哈希值
- `{{ .SiteURL }}` - 站点 URL
- `{{ .Email }}` - 用户邮箱地址

## 🔄 用户注册流程

### 完整流程图

```
用户填写注册表单
       ↓
点击 "Create Account"
       ↓
Supabase 创建用户账户
       ↓
发送验证邮件
       ↓
显示提示: "请检查邮箱"
       ↓
[用户打开邮箱]
       ↓
点击 "Verify Email" 按钮
       ↓
跳转到: /auth/callback?code=xxx&next=/onboarding
       ↓
验证令牌并创建会话
       ↓
自动跳转到: /onboarding
       ↓
用户完成 onboarding 流程
```

## 💻 代码实现说明

### 1. 注册页面 (`src/app/register/page.tsx`)

```typescript
const { data, error: signUpError } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
  },
});
```

**关键点**：
- `emailRedirectTo`: 指定验证后的回调 URL
- `next=/onboarding`: 查询参数，指定最终跳转页面

### 2. 回调路由 (`src/app/auth/callback/route.ts`)

```typescript
export async function GET(request: NextRequest) {
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/onboarding';
  
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }
  
  return NextResponse.redirect(new URL('/login?error=verification_failed', requestUrl.origin));
}
```

**功能**：
- 接收验证码 `code`
- 交换为用户会话
- 重定向到 onboarding 页面

## 🧪 测试步骤

### 1. 本地开发测试

```bash
# 启动开发服务器
npm run dev
```

### 2. 注册新用户

1. 访问：http://localhost:3000/register
2. 填写邮箱和密码
3. 点击 "Create Account"
4. 应该看到提示："Please check your email to verify your account."

### 3. 验证邮箱

1. 打开邮箱收件箱
2. 找到来自 Supabase 的验证邮件
3. 点击 "Verify Email Address" 按钮
4. 应该自动跳转到：http://localhost:3000/onboarding

### 4. 检查数据库

在 Supabase SQL Editor 中运行：

```sql
-- 查看最近注册的用户
SELECT 
  email,
  email_confirmed_at,
  created_at,
  confirmed_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;
```

**预期结果**：
- `email_confirmed_at`: 应该有时间戳（验证后）
- `confirmed_at`: 应该有时间戳

## ⚙️ 环境变量检查

确保 `.env.local` 包含：

```env
NEXT_PUBLIC_SUPABASE_URL=https://nhutoqszfhpszxyjddmm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 🔒 安全最佳实践

### 1. 生产环境配置

✅ **必须配置**：
- 启用邮箱验证
- 配置自定义 SMTP（不使用 Supabase 默认邮件服务）
- 添加 CAPTCHA 验证
- 实施频率限制

### 2. 自定义 SMTP 配置

在 **Supabase Dashboard** → **Project Settings** → **Auth** → **SMTP Settings**：

```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Password: your_sendgrid_api_key
Sender Email: noreply@starplan.com
Sender Name: StarPlan Team
```

推荐的邮件服务提供商：
- **SendGrid** (推荐，免费额度：100 emails/day)
- **Mailgun** (免费额度：5,000 emails/month)
- **AWS SES** (便宜，需要验证域名)
- **Resend** (现代化，开发者友好)

### 3. 邮件发送限制

配置防止滥用：

```sql
-- 限制每个 IP 每小时只能注册 3 次
-- 在 Supabase Dashboard → Database → Extensions → pg_cron 中配置
```

## 📊 监控和日志

### 查看邮件发送日志

**Supabase Dashboard** → **Logs** → **Auth Logs**

可以看到：
- 邮件发送状态
- 验证尝试
- 失败原因

### 常见问题排查

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 收不到邮件 | SMTP 配置错误 | 检查 SMTP 设置 |
| 邮件进入垃圾箱 | SPF/DKIM 未配置 | 配置域名验证 |
| 验证链接无效 | Token 过期 | 重新发送验证邮件 |
| 点击后无反应 | 回调路由错误 | 检查 /auth/callback |

## 🎨 自定义建议

### 1. 品牌化邮件

- 添加公司 logo
- 使用品牌色彩
- 统一字体样式

### 2. 多语言支持

可以根据用户偏好发送不同语言的邮件：

```typescript
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      language: 'zh-CN', // 或 'en-US'
    },
  },
});
```

### 3. A/B 测试

创建不同的邮件模板版本，测试：
- 按钮文案
- 邮件长度
- 视觉风格

## 📚 相关文档

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Email Templates Guide](https://supabase.com/docs/guides/auth/auth-email-templates)
- [SMTP Settings](https://supabase.com/docs/guides/auth/auth-smtp)

## ✅ 检查清单

- [ ] Supabase Dashboard 中启用邮箱验证
- [ ] 添加回调 URL 到 Redirect URLs
- [ ] 配置邮件模板
- [ ] 测试完整注册流程
- [ ] 检查邮件能否正常接收
- [ ] 验证点击链接后跳转正确
- [ ] 确认用户会话已创建
- [ ] 生产环境配置自定义 SMTP

## 🆘 需要帮助？

如果遇到问题：

1. **检查 Supabase 日志**：Dashboard → Logs
2. **查看浏览器控制台**：F12 → Console
3. **检查网络请求**：F12 → Network
4. **查看数据库**：确认用户记录已创建

## 总结

✅ **代码已实现**：
- 注册时启用邮箱验证
- 回调路由处理验证
- 自动跳转到 onboarding

⚙️ **需要配置**：
- Supabase Dashboard 启用验证
- 添加回调 URL
- 自定义邮件模板

🎯 **用户体验**：
- 注册后提示检查邮箱
- 点击邮件链接一键验证
- 自动跳转开始使用


