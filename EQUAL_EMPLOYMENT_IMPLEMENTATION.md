# Equal Employment 编辑功能实现

## 📊 数据结构说明

### Equal Employment 数据存储位置

**重要**: Equal Employment 的数据**不存储在 profile JSON 字段中**，而是存储在 User 表的**独立字段**中。

### Prisma Schema

```prisma
model User {
  id                     String   @id @default(uuid())
  email                  String   @unique
  name                   String?
  avatarUrl              String?
  userType               UserType @default(CANDIDATE)
  
  // ⭐ Equal Employment 字段（独立存储）
  hasCompletedOnboarding Boolean  @default(false)
  jobFunction            String?
  jobTypes               String[] @default([])
  preferredLocation      String?
  remoteOpen             Boolean  @default(false)
  h1bSponsorship         Boolean  @default(false)
  
  // Profile JSON（Personal/Education/Work/Skills 存储在这里）
  profile                Json?
  
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
}
```

## 🔄 数据流对比

### Personal / Education / Work / Skills
```
EditPanel → profile/page.tsx → API → Prisma
                ↓
          更新 profile JSON 字段
```

### Equal Employment
```
EditPanel → profile/page.tsx → API → Prisma
                ↓
          更新 User 表独立字段
          (jobFunction, jobTypes, etc.)
```

## 📝 字段映射

| UI 字段 | 数据库字段 | 类型 | 必填 | 默认值 | 说明 |
|---------|-----------|------|------|--------|------|
| Job Function | `jobFunction` | String | ✅ | null | 职位类别 |
| Job Types | `jobTypes` | String[] | ✅ | [] | 工作类型（多选） |
| Preferred Location | `preferredLocation` | String | ✅ | null | 首选工作地点 |
| Open to Remote | `remoteOpen` | Boolean | ❌ | false | 是否接受远程 |
| H1B Sponsorship | `h1bSponsorship` | Boolean | ❌ | false | 是否需要H1B |
| - | `hasCompletedOnboarding` | Boolean | - | false | 是否完成入职 |

## 🎯 功能实现

### 1. EditPanel 组件

#### 初始化 Employment 数据

```typescript
// src/components/profile/EditPanel.tsx

useEffect(() => {
  if (isOpen && section === 'employment') {
    // 从 User 对象读取数据（不是 profile JSON）
    setEmploymentData({
      jobFunction: (profile as any)?.jobFunction || '',
      jobTypes: (profile as any)?.jobTypes || [],
      preferredLocation: (profile as any)?.preferredLocation || '',
      remoteOpen: (profile as any)?.remoteOpen || false,
      h1bSponsorship: (profile as any)?.h1bSponsorship || false,
    });
  }
}, [isOpen, section, profile]);
```

#### 表单字段

```typescript
const renderEmploymentForm = () => (
  <form onSubmit={handleSubmit}>
    {/* Job Function - 下拉选择 */}
    <select value={employmentData.jobFunction}>
      <option value="Software Engineering">Software Engineering</option>
      <option value="Data Science">Data Science</option>
      <option value="Product Management">Product Management</option>
      {/* ... 更多选项 */}
    </select>

    {/* Job Types - 多选复选框 */}
    <div className={styles.checkboxGrid}>
      {['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'].map(type => (
        <input 
          type="checkbox"
          checked={employmentData.jobTypes.includes(type)}
          onChange={() => handleJobTypesChange(type)}
        />
      ))}
    </div>

    {/* Preferred Location - 下拉选择 */}
    <select value={employmentData.preferredLocation}>
      <option value="Melbourne">Melbourne</option>
      <option value="Sydney">Sydney</option>
      {/* ... */}
    </select>

    {/* Remote Open - 单个复选框 */}
    <input 
      type="checkbox"
      checked={employmentData.remoteOpen}
    />

    {/* H1B Sponsorship - 单个复选框 */}
    <input 
      type="checkbox"
      checked={employmentData.h1bSponsorship}
    />
  </form>
);
```

### 2. profile/page.tsx 保存逻辑

```typescript
const handleSaveEdit = async (data: any) => {
  if (data.section === 'employment') {
    // ⚠️ 特殊处理：Employment 数据直接更新 User 表字段
    const response = await fetch(`/api/user/${authUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobFunction: data.data.jobFunction,
        jobTypes: data.data.jobTypes,
        preferredLocation: data.data.preferredLocation,
        remoteOpen: data.data.remoteOpen,
        h1bSponsorship: data.data.h1bSponsorship,
        hasCompletedOnboarding: true, // 标记完成
      }),
    });
    
    await refreshUser(); // 刷新用户数据
  } else {
    // 其他 sections 更新 profile JSON
    // ...
  }
};
```

### 3. API 路由 (/api/user/[id]/route.ts)

```typescript
export async function PATCH(request, context) {
  const body = await request.json();
  
  const { 
    name, 
    avatarUrl, 
    profile,
    // ⭐ Employment 字段
    jobFunction,
    jobTypes,
    preferredLocation,
    remoteOpen,
    h1bSponsorship,
    hasCompletedOnboarding 
  } = body;
  
  const updatedUser = await updateUser(id, {
    ...(name !== undefined && { name }),
    ...(profile !== undefined && { profile }),
    // ⭐ Employment 字段
    ...(jobFunction !== undefined && { jobFunction }),
    ...(jobTypes !== undefined && { jobTypes }),
    ...(preferredLocation !== undefined && { preferredLocation }),
    ...(remoteOpen !== undefined && { remoteOpen }),
    ...(h1bSponsorship !== undefined && { h1bSponsorship }),
    ...(hasCompletedOnboarding !== undefined && { hasCompletedOnboarding }),
  });
  
  return NextResponse.json(updatedUser);
}
```

### 4. 数据访问层 (src/lib/user.ts)

```typescript
export type UserUpdateInput = {
  name?: string;
  avatarUrl?: string;
  profile?: any;
  // ⭐ Employment preferences
  jobFunction?: string;
  jobTypes?: string[];
  preferredLocation?: string;
  remoteOpen?: boolean;
  h1bSponsorship?: boolean;
  hasCompletedOnboarding?: boolean;
};

export async function updateUser(id: string, data: UserUpdateInput) {
  return prisma.user.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.profile !== undefined && { profile: data.profile }),
      // ⭐ Employment 字段直接更新
      ...(data.jobFunction !== undefined && { jobFunction: data.jobFunction }),
      ...(data.jobTypes !== undefined && { jobTypes: data.jobTypes }),
      ...(data.preferredLocation !== undefined && { preferredLocation: data.preferredLocation }),
      ...(data.remoteOpen !== undefined && { remoteOpen: data.remoteOpen }),
      ...(data.h1bSponsorship !== undefined && { h1bSponsorship: data.h1bSponsorship }),
      ...(data.hasCompletedOnboarding !== undefined && { hasCompletedOnboarding: data.hasCompletedOnboarding }),
      updatedAt: new Date(),
    },
  });
}
```

## 🎨 表单设计

### Job Function 选项

```
- Software Engineering
- Data Science
- Product Management
- Design
- Marketing
- Sales
- Finance
- Human Resources
- Operations
- Customer Success
- Other
```

### Job Types（多选）

```
☑ Full-time
☑ Part-time
☑ Contract
☑ Internship
☑ Freelance
```

### Preferred Location 选项

```
- Melbourne
- Sydney
- Brisbane
- Perth
- Adelaide
- Canberra
- Remote - Australia
- Remote - Global
- Flexible
```

### Work Preferences

```
☑ Open to Remote Work
```

### Visa & Sponsorship

```
☑ Require H1B Sponsorship
```

## 💾 数据保存示例

### Request Payload

```json
{
  "jobFunction": "Software Engineering",
  "jobTypes": ["Full-time", "Contract"],
  "preferredLocation": "Melbourne",
  "remoteOpen": true,
  "h1bSponsorship": false,
  "hasCompletedOnboarding": true
}
```

### 数据库更新 (SQL)

```sql
UPDATE "users"
SET 
  "job_function" = 'Software Engineering',
  "job_types" = ARRAY['Full-time', 'Contract'],
  "preferred_location" = 'Melbourne',
  "remote_open" = true,
  "h1b_sponsorship" = false,
  "has_completed_onboarding" = true,
  "updated_at" = '2024-12-08T12:00:00.000Z'
WHERE "id" = 'user-uuid';
```

### Response

```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "User Name",
  "jobFunction": "Software Engineering",
  "jobTypes": ["Full-time", "Contract"],
  "preferredLocation": "Melbourne",
  "remoteOpen": true,
  "h1bSponsorship": false,
  "hasCompletedOnboarding": true,
  "profile": {
    "personal": {...},
    "education": [...],
    ...
  },
  "createdAt": "...",
  "updatedAt": "2024-12-08T12:00:00.000Z"
}
```

## 🔍 数据读取

### 在 Profile 页面显示

```typescript
// src/app/profile/page.tsx

{dbUser?.hasCompletedOnboarding ? (
  <div className={styles.employmentInfo}>
    <div className={styles.infoRow}>
      <div className={styles.infoLabel}>Job Function</div>
      <div className={styles.infoValue}>
        {dbUser.jobFunction || 'Not specified'}
      </div>
    </div>
    
    <div className={styles.infoRow}>
      <div className={styles.infoLabel}>Job Types</div>
      <div className={styles.infoValue}>
        {dbUser.jobTypes?.join(', ') || 'Not specified'}
      </div>
    </div>
    
    <div className={styles.infoRow}>
      <div className={styles.infoLabel}>Preferred Location</div>
      <div className={styles.infoValue}>
        {dbUser.preferredLocation || 'Not specified'}
      </div>
    </div>
    
    <div className={styles.infoRow}>
      <div className={styles.infoLabel}>Open to Remote</div>
      <div className={styles.infoValue}>
        <span className={dbUser.remoteOpen ? styles.badgeYes : styles.badgeNo}>
          {dbUser.remoteOpen ? 'Yes' : 'No'}
        </span>
      </div>
    </div>
    
    <div className={styles.infoRow}>
      <div className={styles.infoLabel}>H1B Sponsorship</div>
      <div className={styles.infoValue}>
        <span className={dbUser.h1bSponsorship ? styles.badgeYes : styles.badgeNo}>
          {dbUser.h1bSponsorship ? 'Required' : 'Not Required'}
        </span>
      </div>
    </div>
  </div>
) : (
  <div className={styles.emptyState}>
    <p>No employment preferences available. Please complete onboarding.</p>
  </div>
)}
```

## 🎯 关键差异总结

### Personal / Education / Work / Skills

| 特征 | 值 |
|------|-----|
| 存储位置 | `User.profile` JSON 字段 |
| 数据结构 | 嵌套 JSON 对象/数组 |
| 保存方式 | 整个 profile JSON 替换 |
| 读取方式 | `profile.personal`, `profile.education` |

### Equal Employment

| 特征 | 值 |
|------|-----|
| 存储位置 | User 表独立字段 |
| 数据结构 | 顶层字段（String, Boolean, Array） |
| 保存方式 | 直接更新字段值 |
| 读取方式 | `dbUser.jobFunction`, `dbUser.jobTypes` |

## ✅ 验证方法

### 1. 查看数据库

```sql
SELECT 
  id,
  email,
  job_function,
  job_types,
  preferred_location,
  remote_open,
  h1b_sponsorship,
  has_completed_onboarding
FROM users
WHERE id = 'your-user-id';
```

### 2. 刷新页面测试

1. 编辑 Equal Employment 信息
2. 点击 UPDATE
3. 刷新浏览器 (F5)
4. 检查数据是否仍然显示

### 3. 查看 Network 请求

Request Body:
```json
{
  "jobFunction": "Data Science",
  "jobTypes": ["Full-time"],
  "preferredLocation": "Sydney",
  "remoteOpen": true,
  "h1bSponsorship": true,
  "hasCompletedOnboarding": true
}
```

Response 应该包含更新后的字段值。

## 🚀 使用流程

1. 用户点击 Equal Employment section 的编辑按钮
2. EditPanel 从 `dbUser` 读取现有数据
3. 用户修改表单字段
4. 点击 UPDATE
5. 数据发送到 API `/api/user/[id]`
6. Prisma 更新 User 表的独立字段
7. `refreshUser()` 重新获取用户数据
8. 页面显示更新后的 Employment 信息

## 📝 注意事项

1. **数据隔离**: Employment 数据完全独立于 profile JSON
2. **字段类型**: `jobTypes` 是数组类型，支持多选
3. **必填验证**: `jobFunction`, `jobTypes`, `preferredLocation` 为必填
4. **Onboarding**: 保存后自动设置 `hasCompletedOnboarding = true`
5. **API 兼容**: 同一个 API 端点既支持 profile JSON 更新，也支持独立字段更新

## 🎊 总结

Equal Employment 编辑功能已完全实现：
- ✅ 从 User 表独立字段读取数据
- ✅ 完整的编辑表单（下拉框、多选框、复选框）
- ✅ 数据验证（必填字段）
- ✅ 保存到独立字段（不是 profile JSON）
- ✅ 刷新显示最新数据
- ✅ 与其他 sections 无缝集成

**数据存储位置**:
- Personal/Education/Work/Skills → `User.profile` JSON
- Equal Employment → User 表独立字段

现在可以完整编辑所有 5 个 sections！🎉


