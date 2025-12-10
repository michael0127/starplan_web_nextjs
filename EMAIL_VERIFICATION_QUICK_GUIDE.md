# 邮箱验证快速配置指南 ⚡

## 🎯 快速开始（5分钟配置）

### 第一步：启用 Supabase 邮箱验证

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard/project/nhutoqszfhpszxyjddmm)
2. 左侧菜单：**Authentication** → **Providers**
3. 找到 **Email**，点击展开
4. 打开 **"Confirm email"** 开关 ✅
5. 点击 **Save** 保存

### 第二步：配置回调 URL

1. **Authentication** → **URL Configuration**
2. 添加到 **Redirect URLs**：
   ```
   http://localhost:3000/auth/callback
   ```
3. 点击 **Save**

### 第三步：配置邮件模板（可选）

1. **Authentication** → **Email Templates**
2. 选择 **Confirm signup**
3. 粘贴下面的模板代码
4. 点击 **Save**

---

## 📧 推荐邮件模板（复制粘贴即可）

### 简洁版（推荐用于开发）

```html
<h2>欢迎加入 StarPlan!</h2>
<p>感谢您的注册。请点击下面的按钮验证您的邮箱：</p>
<p><a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 30px;background:#4a5bf4;color:#fff;text-decoration:none;border-radius:6px;">验证邮箱</a></p>
<p>如果按钮无法点击，请复制此链接到浏览器：<br>{{ .ConfirmationURL }}</p>
```

### 完整专业版（推荐用于生产）

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>验证您的邮箱 - StarPlan</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;background:#fff;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#4a5bf4 0%,#3544e4 100%);padding:40px 20px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:28px;">欢迎加入 StarPlan!</h1>
    </div>

    <!-- Content -->
    <div style="padding:40px 30px;">
      <h2 style="color:#252525;font-size:22px;margin-bottom:20px;">验证您的邮箱地址</h2>
      
      <p style="color:#555;font-size:16px;line-height:1.6;margin-bottom:20px;">
        感谢您注册 StarPlan！我们很高兴帮助您通过 AI 匹配找到理想的工作。
      </p>

      <p style="color:#555;font-size:16px;line-height:1.6;margin-bottom:30px;">
        请点击下面的按钮验证您的邮箱地址：
      </p>

      <!-- Button -->
      <div style="text-align:center;margin:35px 0;">
        <a href="{{ .ConfirmationURL }}" 
           style="display:inline-block;padding:15px 40px;background:#4a5bf4;color:#fff;text-decoration:none;border-radius:25px;font-size:16px;font-weight:600;box-shadow:0 4px 15px rgba(74,91,244,0.3);">
          验证邮箱地址
        </a>
      </div>

      <p style="color:#888;font-size:14px;line-height:1.6;margin-top:30px;">
        如果按钮无法使用，请复制下面的链接到浏览器：
      </p>
      <p style="color:#4a5bf4;font-size:13px;word-break:break-all;background:#f8f9fa;padding:12px;border-radius:6px;border-left:3px solid #4a5bf4;">
        {{ .ConfirmationURL }}
      </p>

      <div style="margin-top:40px;padding-top:30px;border-top:1px solid #e0e0e0;">
        <p style="color:#888;font-size:13px;line-height:1.6;margin:0;">
          如果您没有注册 StarPlan 账户，请忽略此邮件。
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8f9fa;padding:25px 30px;text-align:center;border-top:1px solid #e0e0e0;">
      <p style="color:#888;font-size:12px;margin:0 0 8px 0;">
        © 2024 StarPlan. 保留所有权利。
      </p>
      <p style="color:#aaa;font-size:11px;margin:0;">
        AI 驱动的工作匹配平台
      </p>
    </div>

  </div>
</body>
</html>
```

---

## 🔄 用户体验流程

```
用户注册
   ↓
显示 "请检查邮箱" 页面
   ↓
用户打开邮箱
   ↓
点击验证链接
   ↓
自动跳转到 /onboarding
   ↓
开始使用！
```

---

## ✅ 测试步骤

1. **启动开发服务器**
   ```bash
   npm run dev
   ```

2. **注册新用户**
   - 访问：http://localhost:3000/register
   - 填写邮箱和密码
   - 点击注册

3. **检查邮箱**
   - 应该收到验证邮件
   - 点击验证链接

4. **验证跳转**
   - 应该自动跳转到：http://localhost:3000/onboarding

---

## 🐛 常见问题

### 收不到邮件？

**检查垃圾邮件箱**
- 验证邮件可能被标记为垃圾邮件

**使用真实邮箱**
- 测试时使用 Gmail、Outlook 等真实邮箱
- 避免使用临时邮箱服务

**检查 Supabase 日志**
1. Dashboard → Logs
2. 查看是否有邮件发送记录

### 点击链接后无反应？

**检查回调 URL 配置**
- 确保 `http://localhost:3000/auth/callback` 在 Redirect URLs 中

**清除浏览器缓存**
- 按 Cmd+Shift+Delete (Mac)
- 清除缓存和 Cookie

**检查控制台错误**
- 按 F12 打开开发者工具
- 查看 Console 标签是否有错误

### 验证后没有跳转到 onboarding？

**检查代码**
- 确保 `/src/app/auth/callback/route.ts` 文件存在
- 检查 `next` 参数是否正确

**查看浏览器地址栏**
- 是否有错误参数（如 `?error=...`）

---

## 🎨 自定义邮件样式

### 修改主题色

将模板中的颜色代码替换：
- `#4a5bf4` → 你的品牌主色
- `#3544e4` → 你的品牌深色

### 添加 Logo

在 Header 部分添加：
```html
<img src="https://your-domain.com/logo.png" alt="StarPlan" style="width:120px;margin-bottom:20px;">
```

### 修改文案

直接修改模板中的中文文字即可。

---

## 📊 生产环境建议

### 使用专业邮件服务

推荐使用 **SendGrid**（免费额度：100封/天）：

1. 注册 [SendGrid](https://sendgrid.com)
2. 获取 API Key
3. 在 Supabase Dashboard → Project Settings → Auth → SMTP Settings 配置：
   ```
   SMTP Host: smtp.sendgrid.net
   SMTP Port: 587
   SMTP User: apikey
   SMTP Password: 你的_API_KEY
   Sender Email: noreply@your-domain.com
   Sender Name: StarPlan
   ```

### 添加域名验证

配置 SPF 和 DKIM 记录，提高邮件送达率：
- 在 SendGrid 中验证你的域名
- 添加 DNS 记录
- 等待验证通过

---

## 📁 相关文件

- `/src/app/register/page.tsx` - 注册页面
- `/src/app/auth/callback/route.ts` - 验证回调
- `/src/app/check-email/page.tsx` - 检查邮箱提示页
- `EMAIL_VERIFICATION_SETUP.md` - 完整配置文档

---

## 🔒 安全提示

⚠️ **开发环境**：
- 可以使用 Supabase 默认邮件服务
- 邮件可能进入垃圾箱

✅ **生产环境**：
- 必须配置自定义 SMTP
- 必须验证域名
- 添加防滥用措施（CAPTCHA、频率限制）

---

## 💡 提示

**快速测试**：使用 Gmail 的 `+` 功能
```
yourname+test1@gmail.com
yourname+test2@gmail.com
yourname+test3@gmail.com
```
这些都会发送到 `yourname@gmail.com`，但 Supabase 会认为是不同的邮箱。

**临时禁用验证**（仅开发）：
- 参考 `DISABLE_EMAIL_VERIFICATION.md`

---

## ✨ 完成！

配置完成后，您的应用将拥有完整的邮箱验证流程：
- ✅ 安全的用户注册
- ✅ 专业的验证邮件
- ✅ 流畅的用户体验
- ✅ 自动跳转到 onboarding

需要更多帮助？查看 `EMAIL_VERIFICATION_SETUP.md` 获取详细文档。


