# 🔧 Supabase 触发器安装说明

## ⚠️ 重要提醒

**必须完成这个步骤才能让 User 表自动同步 Supabase Auth！**

如果不执行触发器，当用户注册时：
- ✅ 会在 `auth.users` 中创建记录（Supabase Auth）
- ❌ 不会在 `public.users` 中创建记录（你的应用数据库）
- ❌ 你的应用无法通过 Prisma 访问用户数据

## 📋 安装步骤

### 步骤 1: 打开 Supabase Dashboard

访问: https://app.supabase.com

### 步骤 2: 选择你的项目

点击你的项目（StarPlan）

### 步骤 3: 打开 SQL Editor

点击左侧菜单中的 **"SQL Editor"** 图标（数据库图标）

### 步骤 4: 创建新查询

点击右上角的 **"New Query"** 按钮

### 步骤 5: 复制 SQL

打开文件: `prisma/supabase_auth_trigger.sql`

复制全部内容（约 100 行）

### 步骤 6: 粘贴并执行

1. 将复制的 SQL 粘贴到 SQL Editor 中
2. 点击右下角的 **"Run"** 按钮
3. 或按快捷键: 
   - Mac: `Cmd + Enter`
   - Windows/Linux: `Ctrl + Enter`

### 步骤 7: 验证成功

如果看到 "Success. No rows returned" 或类似消息，说明执行成功！

## ✅ 验证触发器

在 SQL Editor 中运行以下查询来验证触发器已创建：

```sql
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name LIKE 'on_auth_user%'
ORDER BY trigger_name;
```

### 预期结果

你应该看到 3 行：

| trigger_name           | event_manipulation | event_object_table | action_timing |
|------------------------|-------------------|-------------------|---------------|
| on_auth_user_created   | INSERT            | users             | AFTER         |
| on_auth_user_deleted   | DELETE            | users             | AFTER         |
| on_auth_user_updated   | UPDATE            | users             | AFTER         |

## 🧪 测试触发器

### 方法 1: 通过应用注册（推荐）

1. 启动你的应用
2. 访问注册页面
3. 注册一个新用户
4. 检查 Supabase Dashboard > Table Editor > users
5. 应该看到新创建的用户记录

### 方法 2: 手动测试（高级）

在 SQL Editor 中运行：

```sql
-- 查看当前 users 表记录
SELECT * FROM public.users;

-- 查看当前 auth.users 记录（需要权限）
SELECT id, email, created_at FROM auth.users;
```

## 🔄 触发器工作原理

### 当用户注册时：

```
用户填写注册表单
       ↓
Supabase Auth 创建用户
       ↓
在 auth.users 表插入记录
       ↓
🔥 触发器自动执行
       ↓
在 public.users 表创建对应记录
       ↓
你的应用可以通过 Prisma 访问用户
```

### 当用户更新信息时：

```
Supabase Auth 更新 auth.users
       ↓
🔥 触发器自动执行
       ↓
同步更新 public.users
```

### 当用户删除账户时：

```
Supabase Auth 删除 auth.users
       ↓
🔥 触发器自动执行
       ↓
自动删除 public.users 中的记录
```

## 🔍 触发器包含的函数

### 1. handle_new_user()
- 当新用户在 `auth.users` 中创建时触发
- 在 `public.users` 中创建对应记录
- 从 `raw_user_meta_data` 中提取额外信息（如头像）

### 2. handle_user_update()
- 当 `auth.users` 中的用户信息更新时触发
- 同步更新 `public.users` 中的对应记录

### 3. handle_user_delete()
- 当 `auth.users` 中的用户被删除时触发
- 自动删除 `public.users` 中的对应记录

## 📊 同步现有用户（可选）

如果你的 `auth.users` 表中已经有用户，运行以下 SQL 来同步：

```sql
INSERT INTO public.users (id, email, avatar_url, created_at, updated_at)
SELECT 
  id,
  email,
  raw_user_meta_data->>'avatar_url',
  created_at,
  updated_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  avatar_url = EXCLUDED.avatar_url,
  updated_at = EXCLUDED.updated_at;
```

## 🐛 故障排除

### 问题: 触发器未执行

**检查：**
```sql
-- 1. 确认触发器存在
SELECT * FROM pg_trigger WHERE tgname LIKE 'on_auth_user%';

-- 2. 查看触发器函数
SELECT proname FROM pg_proc WHERE proname LIKE 'handle_%user%';
```

**如果触发器不存在：**
重新执行 `supabase_auth_trigger.sql`

### 问题: 执行 SQL 时出错

**常见错误：**

1. **"permission denied"**
   - 确保你有数据库的管理员权限
   - 在 Supabase Dashboard 中执行，而不是在外部工具

2. **"relation does not exist"**
   - 确保已运行 Prisma 迁移创建了 `users` 表
   - 运行: `npx prisma migrate deploy`

3. **"duplicate function"**
   - 触发器已经存在
   - 这不是问题，可以忽略
   - 或者先删除再创建

### 问题: 用户注册后 public.users 表中没有记录

**排查步骤：**

1. 确认触发器已创建（见上面的验证步骤）
2. 检查 Supabase Logs:
   - Dashboard > Logs > Postgres Logs
   - 查找错误信息
3. 手动测试触发器函数
4. 确认 `auth.users` 中有记录

### 问题: UUID 类型不匹配

**解决方案：**

确保 `public.users` 表的 `id` 字段是 UUID 类型：

```sql
-- 查看字段类型
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'id';

-- 应该显示: uuid
```

如果不是，需要修改 Prisma schema 并重新迁移。

## 📝 修改触发器

如果需要修改触发器逻辑：

1. 编辑 `supabase_auth_trigger.sql`
2. 在 Supabase SQL Editor 中重新执行
3. `CREATE OR REPLACE FUNCTION` 会覆盖现有函数

## 🔒 安全建议

触发器使用 `SECURITY DEFINER`，这意味着：
- ✅ 触发器以创建者的权限运行
- ✅ 即使用户没有直接访问 `public.users` 的权限，触发器也能工作
- ⚠️ 确保触发器逻辑安全，不要泄露敏感信息

## 📚 相关资源

- [Supabase Triggers 文档](https://supabase.com/docs/guides/database/postgres/triggers)
- [PostgreSQL Trigger 文档](https://www.postgresql.org/docs/current/sql-createtrigger.html)
- [Prisma + Supabase 集成](https://www.prisma.io/docs/guides/database/supabase)

## ✅ 完成检查清单

- [ ] 在 Supabase SQL Editor 中执行了 `supabase_auth_trigger.sql`
- [ ] 验证查询显示了 3 个触发器
- [ ] 测试注册流程，确认 `public.users` 表有记录
- [ ] （可选）同步了现有的 auth 用户

完成所有步骤后，你的 User 表就会自动与 Supabase Auth 同步了！🎉

















































