# Sidebar用户信息自动获取功能

## ✅ 实现完成

登录后，Sidebar会自动获取并显示当前登录用户的信息。

## 功能特性

### 1. 自动用户信息获取
- ✅ 从Supabase Auth获取当前登录用户
- ✅ 从数据库获取用户详细信息（name, avatarUrl）
- ✅ 实时监听认证状态变化
- ✅ 会话自动持久化

### 2. 用户信息显示
- **用户名显示优先级**：
  1. 数据库中的用户名 (dbUser.name)
  2. 邮箱用户名部分 (email前缀)
  3. 默认 "User"

- **头像显示**：
  - 如果有avatarUrl：显示用户头像图片
  - 如果没有：显示用户名首字母

- **邮箱显示**：显示用户的登录邮箱

### 3. 加载状态
- 显示 "Loading..." 在获取用户信息时
- 防止闪烁和空白状态

### 4. 未登录状态
- 显示 "Not logged in" 提示
- 点击可跳转到登录页面

### 5. 登出功能
- 将原来的 "Settings" 按钮改为 "Logout" 按钮
- 点击后：
  - 清除Supabase会话
  - 跳转到登录页面

## 新增文件

### `src/hooks/useAuth.ts`
认证Hook，提供：
- `user`: 当前Supabase用户对象
- `loading`: 加载状态
- `isAuthenticated`: 是否已认证
- `signOut()`: 登出函数

## 修改文件

### `src/components/navigation/Sidebar.tsx`
主要改动：
1. 引入 `useAuth` 和 `useUser` hooks
2. 实时获取用户认证状态
3. 根据用户ID从数据库获取详细信息
4. 动态显示用户信息
5. 实现登出功能

### `src/components/navigation/Sidebar.module.css`
添加：
- `.avatarImage` - 用户头像图片样式
- 更新 `.settingsButton` - 支持按钮元素

## 工作流程

```
登录成功
    ↓
Supabase Auth 创建会话
    ↓
useAuth Hook 监听到状态变化
    ↓
获取 authUser (Supabase用户)
    ↓
useUser Hook 根据 authUser.id 获取数据库用户信息
    ↓
Sidebar 显示用户名、邮箱、头像
```

## 数据流

```typescript
Supabase Auth (authUser)
    ↓
    ├─ authUser.id → useUser Hook → API /api/user/[id]
    │                                   ↓
    │                              Database (dbUser)
    │                                   ↓
    └─────────────────────────────────→ Sidebar Display
                                        - name: dbUser.name || email prefix
                                        - email: authUser.email
                                        - avatar: dbUser.avatarUrl || initial
```

## 使用示例

用户登录后自动在Sidebar底部看到：
```
┌─────────────────┐
│   [Logout]      │  ← 点击登出
├─────────────────┤
│  [J]  John Doe  │  ← 用户信息卡片（可点击跳转到profile）
│      john@...   │
└─────────────────┘
```

## 测试步骤

1. **未登录状态**：
   ```
   - 打开任何带Sidebar的页面（如 /explore）
   - 应该看到 "Not logged in"
   ```

2. **登录后**：
   ```
   - 登录账号
   - 自动跳转到 /explore
   - Sidebar应显示用户邮箱和首字母
   ```

3. **登出功能**：
   ```
   - 点击 "Logout" 按钮
   - 应该跳转到 /login
   - 再次访问 /explore 应该看到 "Not logged in"
   ```

## 技术细节

### 认证状态监听
```typescript
// 实时监听Supabase Auth状态变化
supabase.auth.onAuthStateChange((event, session) => {
  setUser(session?.user ?? null);
});
```

### 级联数据获取
```typescript
// 1. 获取Supabase用户
const { user: authUser } = useAuth();

// 2. 根据用户ID获取数据库信息
const { user: dbUser } = useUser(authUser?.id);

// 3. 合并显示
const displayName = dbUser?.name || authUser?.email?.split('@')[0];
```

## 注意事项

1. **会话持久化**：Supabase会话会自动保存在浏览器中，刷新页面后用户仍然保持登录状态

2. **数据同步**：依赖于Supabase Auth触发器自动同步用户数据到数据库

3. **性能优化**：使用React hooks缓存用户数据，避免重复请求

4. **错误处理**：如果获取用户信息失败，会优雅降级显示邮箱信息

## 下一步优化建议

- [ ] 添加用户头像上传功能
- [ ] 实现用户信息编辑（在profile页面）
- [ ] 添加会话超时提醒
- [ ] 实现"记住我"功能
- [ ] 添加用户在线状态指示器









