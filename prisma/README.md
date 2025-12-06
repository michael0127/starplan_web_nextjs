# Prisma 数据库设置指南

## 📋 概述

这个项目使用 Prisma ORM 来管理数据库，并与 Supabase Auth 集成。

## 🚀 设置步骤

### 1. 环境变量配置

确保 `.env` 文件中包含以下变量：

```env
# Supabase 数据库连接（用于迁移）
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Supabase 连接池（用于应用运行时）
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].pooler.supabase.com:5432/postgres"

# Supabase 公开密钥
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

### 2. 生成 Prisma Client

```bash
npx prisma generate
```

### 3. 运行数据库迁移

```bash
npx prisma migrate dev
```

### 4. 设置 Supabase Auth 触发器

在 Supabase Dashboard 的 SQL Editor 中执行 `supabase_auth_trigger.sql` 文件的内容。

步骤：
1. 打开 Supabase Dashboard
2. 进入你的项目
3. 点击左侧菜单的 "SQL Editor"
4. 创建新查询
5. 复制粘贴 `supabase_auth_trigger.sql` 的内容
6. 点击 "Run" 执行

这将创建触发器，自动同步 `auth.users` 和 `public.users` 表。

## 📊 数据库模型

### User 模型

```prisma
model User {
  id            String   @id @default(uuid()) @db.Uuid
  email         String   @unique
  name          String?
  avatarUrl     String?  @map("avatar_url")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  
  @@map("users")
}
```

## 🔄 工作流程

### 当用户注册时：
1. Supabase Auth 在 `auth.users` 表中创建记录
2. 触发器自动在 `public.users` 表中创建对应记录
3. 你的应用可以使用 Prisma 访问 `public.users` 表

### 当用户更新信息时：
1. Supabase Auth 更新 `auth.users` 表
2. 触发器自动更新 `public.users` 表

### 当用户删除账户时：
1. Supabase Auth 删除 `auth.users` 表中的记录
2. 触发器自动删除 `public.users` 表中的记录

## 🛠️ 常用命令

```bash
# 生成 Prisma Client
npx prisma generate

# 创建新迁移
npx prisma migrate dev --name migration_name

# 重置数据库（开发环境）
npx prisma migrate reset

# 查看数据库状态
npx prisma migrate status

# 打开 Prisma Studio（数据库 GUI）
npx prisma studio

# 推送模式变化（不创建迁移）
npx prisma db push

# 从现有数据库拉取模式
npx prisma db pull
```

## 📝 在代码中使用 Prisma

### 1. 导入 Prisma Client

```typescript
import { prisma } from '@/lib/prisma'
```

### 2. 查询用户

```typescript
// 获取所有用户
const users = await prisma.user.findMany()

// 根据 ID 获取用户
const user = await prisma.user.findUnique({
  where: { id: userId }
})

// 根据 email 获取用户
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' }
})

// 创建用户（通常由触发器自动完成）
const user = await prisma.user.create({
  data: {
    id: authUserId,
    email: 'user@example.com',
    name: 'John Doe'
  }
})

// 更新用户
const user = await prisma.user.update({
  where: { id: userId },
  data: {
    name: 'New Name',
    avatarUrl: 'https://example.com/avatar.jpg'
  }
})

// 删除用户
const user = await prisma.user.delete({
  where: { id: userId }
})
```

## 🔒 安全建议

1. **Row Level Security (RLS)**: 在 Supabase 中为 `users` 表设置 RLS 策略
2. **Service Role Key**: 只在服务器端使用 Service Role Key
3. **环境变量**: 永远不要提交 `.env` 文件到版本控制
4. **验证**: 始终在服务器端验证用户身份

## 🐛 故障排除

### 触发器未工作

检查触发器是否已创建：
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE 'on_auth_user%';
```

### 连接问题

确保使用正确的连接字符串：
- 迁移时使用 `DATABASE_URL`（直连）
- 应用运行时使用 `DIRECT_URL`（连接池）

### ID 不匹配

确保 `public.users` 表的 `id` 类型是 UUID，与 `auth.users` 匹配。

## 📚 相关文档

- [Prisma 文档](https://www.prisma.io/docs)
- [Supabase Auth 文档](https://supabase.com/docs/guides/auth)
- [Supabase + Prisma 集成](https://supabase.com/docs/guides/integrations/prisma)









