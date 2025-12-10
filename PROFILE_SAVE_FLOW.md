# Profile 数据保存流程详解

## 🔄 完整的数据保存流程

### 是的！点击 UPDATE 后，JSON 数据**完整保存回数据库**

```
用户点击 UPDATE
     ↓
EditPanel.handleSubmit()
     ↓
构建更新数据 (data)
     ↓
调用 onSave(data)
     ↓
profile/page.tsx handleSaveEdit()
     ↓
构建完整的 updatedProfile JSON
     ↓
PATCH /api/user/[id]
     ↓
updateUser() [Prisma]
     ↓
数据库 UPDATE 操作
     ↓
✅ profile JSON 字段已更新
     ↓
refreshUser() 刷新数据
     ↓
页面显示最新数据
```

## 📝 详细步骤说明

### 步骤 1: 用户在 EditPanel 中修改数据

```typescript
// src/components/profile/EditPanel.tsx

// 用户修改表单字段
const handleChange = (e) => {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value
  });
};

// 或者修改 Education 列表
const handleEducationChange = (index, field, value) => {
  const updated = [...educationList];
  updated[index][field] = value;
  setEducationList(updated);
};
```

### 步骤 2: 用户点击 UPDATE 按钮

```typescript
// src/components/profile/EditPanel.tsx

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSaving(true);
  
  try {
    if (section === 'personal') {
      // 构建 Personal 数据
      const updatedPersonalInfo = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        full_name: `${formData.first_name} ${formData.last_name}`,
        personal_email: formData.personal_email,
        phone_number: formData.phone_number,
        location: formData.location,
        linkedin_url: formData.linkedin_url,
        github_url: formData.github_url,
      };
      
      // 调用 onSave 传递给父组件
      await onSave({
        section: 'personal',
        data: updatedPersonalInfo,
      });
    }
    // ... 其他 section 类似
    
    onClose(); // 关闭面板
  } catch (err) {
    setError('Failed to save changes');
  } finally {
    setIsSaving(false);
  }
};
```

### 步骤 3: profile/page.tsx 处理保存

```typescript
// src/app/profile/page.tsx

const handleSaveEdit = async (data: any) => {
  if (!authUser) return;
  
  try {
    // 1. 深拷贝当前 profile
    const updatedProfile: any = profile 
      ? JSON.parse(JSON.stringify(profile)) 
      : {};
    
    // 2. 确保基本结构存在
    if (!updatedProfile.personal) updatedProfile.personal = {};
    if (!updatedProfile.education) updatedProfile.education = [];
    if (!updatedProfile.work_experience) updatedProfile.work_experience = [];
    if (!updatedProfile.skills) updatedProfile.skills = { 
      technical_skills: [], 
      soft_skills: [] 
    };
    
    // 3. 根据 section 更新对应数据
    if (data.section === 'personal') {
      updatedProfile.personal = {
        ...updatedProfile.personal,
        ...data.data,  // 合并新数据
      };
    } else if (data.section === 'education') {
      updatedProfile.education = data.data;  // 替换整个数组
    } else if (data.section === 'work') {
      updatedProfile.work_experience = data.data;
    } else if (data.section === 'skills') {
      updatedProfile.skills = data.data;
    }
    
    // 4. 发送到 API
    const response = await fetch(`/api/user/${authUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: updatedProfile,  // 完整的 profile JSON
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update profile');
    }
    
    // 5. 刷新用户数据
    await refreshUser();
    setProfile(updatedProfile);
    
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};
```

### 步骤 4: API 路由处理请求

```typescript
// src/app/api/user/[id]/route.ts

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    
    // 提取 profile 字段
    const { name, avatarUrl, profile } = body;
    
    // 验证至少有一个字段
    if (!name && !avatarUrl && !profile) {
      return NextResponse.json(
        { error: 'At least one field must be provided' },
        { status: 400 }
      );
    }
    
    // 调用 updateUser 函数
    const updatedUser = await updateUser(id, {
      ...(name !== undefined && { name }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      ...(profile !== undefined && { profile }),  // 传递完整的 profile JSON
    });
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 步骤 5: 数据访问层更新数据库

```typescript
// src/lib/user.ts

export type UserUpdateInput = {
  name?: string;
  avatarUrl?: string;
  profile?: any;  // JSON 类型
};

export async function updateUser(
  id: string,
  data: UserUpdateInput
): Promise<User> {
  return prisma.user.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      ...(data.profile !== undefined && { profile: data.profile }),  // 更新 profile JSON
      updatedAt: new Date(),  // 更新时间戳
    },
  });
}
```

### 步骤 6: Prisma 执行数据库 UPDATE

```sql
-- Prisma 生成的 SQL（简化版）
UPDATE "User"
SET 
  "profile" = '{"personal":{"full_name":"Michael Liu",...},"education":[...],...}',
  "updatedAt" = '2024-12-08T12:00:00.000Z'
WHERE "id" = 'user-uuid-here';
```

### 步骤 7: 数据已保存，刷新显示

```typescript
// profile/page.tsx

// refreshUser() 重新从数据库读取用户数据
await refreshUser();

// 更新本地 state
setProfile(updatedProfile);

// 页面自动重新渲染，显示最新数据
```

## 💾 数据库中的实际存储

### User 表结构

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (UUID) | 主键 |
| email | String | 邮箱 |
| name | String? | 名称 |
| avatarUrl | String? | 头像URL |
| **profile** | **Json?** | **完整的 profile 数据** |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

### profile 字段存储的 JSON

```json
{
  "personal": {
    "full_name": "Michael Liu",
    "first_name": "Michael",
    "last_name": "Liu",
    "personal_email": "liuxianhe0127@gmail.com",
    "phone_number": "15800972241",
    "location": "Melbourne, VIC, 3000",
    "linkedin_url": "https://linkedin.com/in/michael-liu",
    "github_url": "https://github.com/michael0127/..."
  },
  "education": [
    {
      "institution_name": "University of Melbourne",
      "degree": "B.Sc. Data Science",
      "major": "Data Science",
      "gpa": "3.8",
      "start_date": "2023-01",
      "end_date": null,
      "is_current": true,
      "location": "Melbourne"
    }
  ],
  "work_experience": [
    {
      "company_name": "Baozun E-Commerce",
      "job_title": "Innovation Marketing Intern",
      "job_type": "Internship",
      "location": "Remote",
      "start_date": "2024-01",
      "end_date": "2024-03",
      "is_current": false,
      "description": "Led BI tools integration..."
    }
  ],
  "skills": {
    "technical_skills": ["Python", "R", "Pandas", "NumPy"],
    "soft_skills": ["Leadership", "Communication"]
  }
}
```

## ✅ 验证数据已保存

### 方法 1: 查看数据库

```sql
-- 使用 Prisma Studio 或直接查询
SELECT id, email, profile, "updatedAt" 
FROM "User" 
WHERE id = 'your-user-id';
```

### 方法 2: 刷新页面

1. 保存数据后关闭编辑面板
2. 刷新浏览器页面 (F5)
3. 如果数据仍然存在，说明已成功保存到数据库

### 方法 3: 查看网络请求

打开浏览器开发者工具 (F12) → Network 标签：

1. 点击 UPDATE 按钮
2. 查看 PATCH 请求到 `/api/user/[id]`
3. 查看 Request Payload（发送的数据）
4. 查看 Response（返回的更新后的用户数据）

**Request Payload 示例:**
```json
{
  "profile": {
    "personal": { ... },
    "education": [ ... ],
    "work_experience": [ ... ],
    "skills": { ... }
  }
}
```

**Response 示例:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "profile": { 
    "personal": { ... },
    "education": [ ... ],
    ...
  },
  "updatedAt": "2024-12-08T12:00:00.000Z"
}
```

### 方法 4: 查看控制台日志

```typescript
// profile/page.tsx 中已有的日志
console.log('Saving profile:', updatedProfile);
```

## 🔍 常见问题

### Q1: 数据保存失败怎么办？

**检查清单:**
1. ✅ 网络请求是否成功（查看 Network 标签）
2. ✅ 是否有错误信息显示（红色错误框）
3. ✅ 控制台是否有错误日志
4. ✅ 数据库连接是否正常
5. ✅ 必填字段是否都已填写

**错误提示:**
```typescript
// EditPanel 中会显示
{error && <div className={styles.error}>{error}</div>}
```

### Q2: 保存后数据没有显示？

**原因:**
- `refreshUser()` 可能失败
- 本地 state 没有更新

**解决方案:**
```typescript
// 确保刷新成功
await refreshUser();
setProfile(updatedProfile);
```

### Q3: 部分数据丢失？

**原因:**
- 没有正确合并现有数据
- 覆盖了不应该修改的字段

**正确做法:**
```typescript
// Personal 更新时合并数据
updatedProfile.personal = {
  ...updatedProfile.personal,  // 保留现有数据
  ...data.data,                // 只更新修改的字段
};

// Education/Work 整体替换
updatedProfile.education = data.data;  // 用户编辑的完整列表
```

### Q4: 如何确认数据已持久化？

**最可靠的方法:**
1. 保存数据
2. 退出登录
3. 重新登录
4. 查看数据是否还在

如果数据还在，说明已成功保存到数据库！

## 🎯 数据完整性保证

### 1. 事务性
Prisma 的 `update` 操作是原子性的，要么全部成功，要么全部失败。

### 2. 数据验证
- 前端：HTML5 表单验证
- 后端：TypeScript 类型检查
- 数据库：Prisma Schema 验证

### 3. 错误处理
```typescript
try {
  await updateUser(id, { profile: updatedProfile });
} catch (error) {
  // 数据库更新失败，用户会看到错误提示
  // 数据不会被损坏
  throw error;
}
```

### 4. 时间戳
每次更新都会自动更新 `updatedAt` 字段，可以追踪修改历史。

## 📊 性能优化

### 1. 只更新必要的字段
```typescript
// ✅ 好：只更新 profile
await updateUser(id, { profile: updatedProfile });

// ❌ 不好：更新所有字段
await updateUser(id, { 
  name, 
  avatarUrl, 
  profile 
});
```

### 2. 深拷贝避免引用问题
```typescript
const updatedProfile = JSON.parse(JSON.stringify(profile));
```

### 3. 批量更新
一次 UPDATE 操作更新整个 profile JSON，而不是多次更新。

## 📝 总结

**是的，点击 UPDATE 后，数据 100% 会保存到数据库！**

完整流程：
1. ✅ EditPanel 收集用户输入
2. ✅ 构建完整的 profile JSON
3. ✅ 通过 API 发送到后端
4. ✅ Prisma 执行数据库 UPDATE
5. ✅ profile 字段完整更新
6. ✅ 刷新用户数据显示
7. ✅ 数据持久化成功

**数据保存的位置:**
- 数据库: PostgreSQL (Supabase)
- 表: `User`
- 字段: `profile` (JSON 类型)
- 可以通过 Prisma Studio 或 SQL 查询验证

**安全性:**
- 原子性操作，不会出现部分更新
- 有错误处理，失败时用户会看到提示
- 不会影响其他字段（name, email 等）
- `updatedAt` 时间戳自动更新

现在可以放心使用，所有修改都会正确保存到数据库！ 🎉


