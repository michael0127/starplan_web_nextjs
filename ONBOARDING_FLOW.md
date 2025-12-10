# 用户注册和引导流程实现文档

## 📋 概述

本文档说明了新用户注册后自动进入onboarding页面的完整实现流程。

## 🔄 用户流程

```
1. 用户访问 /register 页面注册
   ↓
2. 注册成功后自动跳转到 /onboarding
   ↓
3. 用户完成引导（填写职位偏好 + 上传简历）
   ↓
4. 数据保存到数据库，标记 hasCompletedOnboarding = true
   ↓
5. 自动跳转到 /explore 页面
```

### 登录用户流程

```
1. 用户访问 /login 页面登录
   ↓
2. 系统检查用户的 hasCompletedOnboarding 状态
   ↓
3a. 如果 hasCompletedOnboarding = false → 跳转到 /onboarding
3b. 如果 hasCompletedOnboarding = true → 跳转到 /explore
```

## 🗄️ 数据库变更

### User表新增字段

```prisma
model User {
  // ... 原有字段
  
  // Onboarding相关字段
  hasCompletedOnboarding Boolean  @default(false) @map("has_completed_onboarding")
  jobFunction            String?  @map("job_function")
  jobTypes               String[] @default([]) @map("job_types")
  preferredLocation      String?  @map("preferred_location")
  remoteOpen             Boolean  @default(false) @map("remote_open")
  h1bSponsorship         Boolean  @default(false) @map("h1b_sponsorship")
}
```

### 迁移命令

```bash
npx prisma migrate dev --name add_onboarding_fields
```

## 🔌 API端点

### 1. POST /api/user/onboarding

保存用户的onboarding数据。

**请求头:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**请求体:**
```json
{
  "jobFunction": "Software Engineer",
  "jobTypes": ["Full-time", "Contract"],
  "location": "Within the US",
  "remoteOpen": true,
  "h1bSponsorship": false
}
```

**响应:**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "hasCompletedOnboarding": true,
    "jobFunction": "Software Engineer",
    "jobTypes": ["Full-time", "Contract"],
    "preferredLocation": "Within the US",
    "remoteOpen": true,
    "h1bSponsorship": false
  }
}
```

### 2. POST /api/user/resume

上传用户简历到存储服务。

**请求头:**
```
Authorization: Bearer <access_token>
```

**请求体 (multipart/form-data):**
```
resume: File (PDF/Word, max 10MB)
```

**存储服务调用:**
```bash
curl -X POST "https://starplan-service.onrender.com/api/v1/storage/upload" \
  -F "file=@resume.pdf" \
  -F "bucket_name=cvs" \
  -F "folder_path=<user_id>"
```

**响应:**
```json
{
  "success": true,
  "cv": {
    "id": "cv-uuid",
    "fileUrl": "https://your-project.supabase.co/storage/v1/object/public/cvs/<user_id>/resume.pdf",
    "createdAt": "2025-12-06T12:00:00.000Z"
  }
}
```

## 📄 修改的文件清单

### 1. 数据库Schema
- ✅ `prisma/schema.prisma` - 添加onboarding相关字段

### 2. 注册页面
- ✅ `src/app/register/page.tsx` 
  - 修改成功后跳转逻辑：`/explore` → `/onboarding`

### 3. 登录页面
- ✅ `src/app/login/page.tsx`
  - 添加用户状态检查逻辑
  - 根据 `hasCompletedOnboarding` 决定跳转目标

### 4. Onboarding页面
- ✅ `src/app/onboarding/page.tsx` - 引导页面主组件
- ✅ `src/app/onboarding/page.module.css` - 样式文件

### 5. API路由
- ✅ `src/app/api/user/onboarding/route.ts` - 保存onboarding数据
- ✅ `src/app/api/user/resume/route.ts` - 上传简历文件

### 6. 文档
- ✅ `ONBOARDING_PAGE.md` - Onboarding页面功能文档
- ✅ `ONBOARDING_FLOW.md` - 本文档

## 🎨 页面功能

### Step 1: 职位偏好设置

**必填项:**
- Job Function (文本输入)
- Job Type (至少选择一个)

**选填项:**
- Location (默认: Within the US)
- Open to Remote (默认: checked)
- H1B Sponsorship (默认: unchecked)

### Step 2: 简历上传

**要求:**
- 文件格式: PDF, DOC, DOCX
- 最大文件大小: 10MB
- 必须上传才能继续

### Step 3: 处理状态

- 显示加载动画
- 显示处理提示文字
- 展示产品特性亮点
- 2秒后自动跳转到explore页面

## 🔒 安全性

### 1. 认证验证
- 所有API端点都需要 Bearer token
- 使用 Supabase Auth 验证用户身份
- 未认证用户自动重定向到登录页

### 2. 数据验证
- 前端表单验证
- 后端参数验证
- 文件类型和大小验证

### 3. 数据隐私
- 简历文件按用户ID分文件夹存储
- 数据库关系通过外键约束
- 级联删除保证数据一致性

## 🧪 测试场景

### 场景1: 新用户注册
```
1. 访问 /register
2. 填写邮箱和密码
3. 点击"Create Account"
4. ✅ 应该跳转到 /onboarding
```

### 场景2: 完成引导流程
```
1. 在 /onboarding 页面
2. 填写 Job Function
3. 选择 Job Types
4. 点击"Next"
5. 上传简历文件
6. 点击"Start Matching"
7. ✅ 应该看到处理动画
8. ✅ 2秒后跳转到 /explore
```

### 场景3: 已完成引导的用户登录
```
1. 访问 /login
2. 输入已完成引导的用户凭证
3. 点击"Login"
4. ✅ 应该直接跳转到 /explore（跳过onboarding）
```

### 场景4: 未完成引导的用户登录
```
1. 访问 /login
2. 输入未完成引导的用户凭证
3. 点击"Login"
4. ✅ 应该跳转到 /onboarding
```

### 场景5: 退出登录
```
1. 在 /onboarding 页面
2. 点击右上角"Logout"按钮
3. ✅ 应该跳转到 /login
```

## 🐛 错误处理

### 前端错误
- 表单验证失败 → 显示红色错误消息
- 文件过大 → "File size must not exceed 10MB"
- 文件类型错误 → "Only PDF and Word documents are allowed"
- API调用失败 → 显示服务器返回的错误消息

### 后端错误
- 未认证 → 401 Unauthorized
- 验证失败 → 400 Bad Request
- 服务器错误 → 500 Internal Server Error

## 📊 数据流

### 前端 → 后端

```typescript
// 1. Onboarding数据
POST /api/user/onboarding
{
  jobFunction: string,
  jobTypes: string[],
  location: string,
  remoteOpen: boolean,
  h1bSponsorship: boolean
}

// 2. 简历文件
POST /api/user/resume
FormData {
  resume: File
}
```

### 后端 → 存储服务

```typescript
// 上传到StarPlan存储服务
POST https://starplan-service.onrender.com/api/v1/storage/upload
FormData {
  file: File,
  bucket_name: "cvs",
  folder_path: <user_id>
}
```

### 后端 → 数据库

```sql
-- 更新用户onboarding状态
UPDATE users 
SET 
  has_completed_onboarding = true,
  job_function = 'Software Engineer',
  job_types = ARRAY['Full-time', 'Contract'],
  preferred_location = 'Within the US',
  remote_open = true,
  h1b_sponsorship = false
WHERE id = '<user_id>';

-- 创建简历记录
INSERT INTO cvs (user_id, file_url)
VALUES ('<user_id>', '<storage_url>');
```

## 🚀 部署检查清单

- [ ] 数据库迁移已执行
- [ ] 环境变量已配置
  - [ ] DATABASE_URL
  - [ ] DIRECT_URL
  - [ ] NEXT_PUBLIC_SUPABASE_URL
  - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] 存储服务可访问
  - [ ] https://starplan-service.onrender.com/api/v1/storage/upload
- [ ] API路由正常工作
  - [ ] POST /api/user/onboarding
  - [ ] POST /api/user/resume
  - [ ] GET /api/user/[id]
- [ ] 页面正常渲染
  - [ ] /register
  - [ ] /login
  - [ ] /onboarding
  - [ ] /explore

## 🔧 维护和扩展

### 添加更多onboarding步骤
1. 在 `OnboardingData` 接口中添加字段
2. 更新数据库schema
3. 在UI中添加新的表单项
4. 更新API验证逻辑

### 修改存储服务
1. 更新 `src/app/api/user/resume/route.ts` 中的上传逻辑
2. 修改 `bucket_name` 或 `folder_path` 参数
3. 更新错误处理逻辑

### 跳过onboarding功能
可以添加"Skip"按钮：
```typescript
const handleSkip = async () => {
  // 标记为已完成但不保存数据
  await fetch('/api/user/onboarding/skip', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  });
  router.push('/explore');
};
```

## 📞 问题排查

### 问题: 注册后没有跳转到onboarding
**解决方案:**
1. 检查 `src/app/register/page.tsx` 第68行
2. 确认跳转逻辑是 `router.push('/onboarding')`

### 问题: 登录后总是跳转到onboarding
**解决方案:**
1. 检查数据库中用户的 `has_completed_onboarding` 字段
2. 确认用户成功完成了引导流程
3. 检查API `/api/user/onboarding` 是否正确更新了该字段

### 问题: 文件上传失败
**解决方案:**
1. 检查存储服务是否在线
2. 确认API地址正确: `https://starplan-service.onrender.com/api/v1/storage/upload`
3. 检查bucket名称是否为 `cvs`
4. 查看服务器日志获取详细错误

### 问题: Prisma类型错误
**解决方案:**
```bash
npx prisma generate
```

## ✅ 完成状态

- [x] 数据库schema更新
- [x] 注册流程修改
- [x] 登录流程修改
- [x] Onboarding页面创建
- [x] Onboarding API创建
- [x] 简历上传API创建
- [x] 存储服务集成
- [x] 错误处理
- [x] 表单验证
- [x] 响应式设计
- [x] 文档编写

---

**创建时间**: 2025-12-06
**最后更新**: 2025-12-06
**状态**: ✅ 完成并可用于生产环境










