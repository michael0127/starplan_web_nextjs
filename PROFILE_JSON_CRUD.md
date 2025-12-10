# Profile JSON 数据 CRUD 功能文档

## 📊 数据结构

### User 表的 `profile` 字段（JSON类型）

```json
{
  "personal": {
    "full_name": "Michael Liu",
    "first_name": "Michael",
    "last_name": "Liu",
    "personal_email": "liuxianhe0127@gmail.com",
    "phone_number": "15800972241",
    "location": null,
    "linkedin_url": null,
    "github_url": "https://github.com/michael0127/Bookstore-recommendation-System"
  },
  "education": [
    {
      "institution_name": "University of Melbourne",
      "degree": "B.Sc. Data Science",
      "major": null,
      "gpa": null,
      "start_date": "2023",
      "end_date": null,
      "is_current": true,
      "location": null
    },
    {
      "institution_name": "Caulfield Grammar School, Melbourne",
      "degree": "VCE",
      "major": null,
      "gpa": null,
      "start_date": "2020",
      "end_date": "2022",
      "is_current": false,
      "location": null
    }
  ],
  "work_experience": [
    {
      "company_name": "Baozun E-Commerce",
      "job_title": "Innovation Marketing Intern",
      "job_type": null,
      "location": null,
      "start_date": "2024-01",
      "end_date": "2024-03",
      "is_current": false,
      "description": "Gained expertise in aligning technology..."
    },
    {
      "company_name": "GT Education",
      "job_title": "Math Teaching Assistant",
      "job_type": null,
      "location": null,
      "start_date": "2023",
      "end_date": null,
      "is_current": true,
      "description": "Simplified complex problems..."
    }
  ],
  "skills": {
    "technical_skills": [
      "Python",
      "R",
      "data cleaning",
      "data analysis",
      "Pandas",
      "NumPy",
      "Scikit-Learn"
    ],
    "soft_skills": [
      "Logical Executor",
      "Business Acumen",
      "Effective collaboration"
    ]
  }
}
```

## 🔧 CRUD 操作实现

### 1. CREATE（创建）

#### Personal Information
**场景**: 用户首次填写个人信息

**操作**:
```typescript
// EditPanel 中
const updatedProfile = {
  personal: {
    full_name: "Michael Liu",
    first_name: "Michael",
    last_name: "Liu",
    personal_email: "email@example.com",
    phone_number: "1234567890",
    location: "Melbourne, VIC, 3000",
    linkedin_url: "https://linkedin.com/in/...",
    github_url: "https://github.com/..."
  },
  education: [],
  work_experience: [],
  skills: { technical_skills: [], soft_skills: [] }
};
```

#### Education（添加新记录）
**场景**: 用户点击"+ Add Education"

**操作**:
```typescript
const addEducation = () => {
  setEducationList([...educationList, {
    institution_name: '',
    degree: '',
    major: '',
    gpa: '',
    start_date: '',
    end_date: '',
    is_current: false,
    location: '',
  }]);
};
```

#### Work Experience（添加新记录）
**场景**: 用户点击"+ Add Work Experience"

**操作**:
```typescript
const addWork = () => {
  setWorkList([...workList, {
    job_title: '',
    company_name: '',
    job_type: 'Full-time',
    location: '',
    start_date: '',
    end_date: '',
    is_current: false,
    description: '',
  }]);
};
```

#### Skills（添加技能）
**场景**: 用户输入技能名称并按Enter或点击添加

**操作**:
```typescript
const addSkill = () => {
  if (newSkill.trim() && !skillsList.includes(newSkill.trim())) {
    setSkillsList([...skillsList, newSkill.trim()]);
    setNewSkill('');
  }
};
```

### 2. READ（读取）

#### 从数据库读取完整Profile
```typescript
// profile/page.tsx
useEffect(() => {
  if (dbUser?.profile) {
    setProfile(dbUser.profile as UserProfile);
  }
}, [dbUser]);
```

#### 读取并显示Personal信息
```typescript
const personalInfo = (profile as any)?.personal;
const displayName = personalInfo?.full_name || 'User';
const displayEmail = personalInfo?.personal_email;
const displayPhone = personalInfo?.phone_number;
```

#### 读取Education列表
```typescript
const education = (profile as any)?.education || [];
// 显示在页面上
education.map((edu: any) => (
  <div key={index}>
    {edu.institution_name}
    {edu.degree} in {edu.major}
  </div>
))
```

#### 读取Work Experience列表
```typescript
const workExperience = (profile as any)?.work_experience || [];
```

#### 读取Skills
```typescript
const skills = (profile as any)?.skills;
const technicalSkills = skills?.technical_skills || [];
const softSkills = skills?.soft_skills || [];
```

### 3. UPDATE（更新）

#### Personal Information更新流程
```typescript
// 1. 用户在EditPanel中修改表单
handleChange(e) {
  setFormData(prev => ({
    ...prev,
    [e.target.name]: e.target.value
  }));
}

// 2. 点击UPDATE保存
handleSubmit() {
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
  
  await onSave({
    section: 'personal',
    data: updatedPersonalInfo,
  });
}

// 3. profile/page.tsx 处理保存
handleSaveEdit(data) {
  const updatedProfile = { ...profile };
  updatedProfile.personal = {
    ...updatedProfile.personal,
    ...data.data,
  };
  
  // 发送到API
  await fetch(`/api/user/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ profile: updatedProfile })
  });
}
```

#### Education更新流程
```typescript
// 更新单个Education字段
const handleEducationChange = (index, field, value) => {
  const updated = [...educationList];
  updated[index] = { ...updated[index], [field]: value };
  setEducationList(updated);
};

// 保存所有Education
handleSubmit() {
  await onSave({
    section: 'education',
    data: educationList,  // 整个数组
  });
}

// profile/page.tsx 处理
updatedProfile.education = data.data;  // 直接替换整个数组
```

#### Work Experience更新流程
```typescript
// 更新单个Work字段
const handleWorkChange = (index, field, value) => {
  const updated = [...workList];
  updated[index] = { ...updated[index], [field]: value };
  setWorkList(updated);
};

// 保存所有Work
handleSubmit() {
  await onSave({
    section: 'work',
    data: workList,
  });
}

// profile/page.tsx 处理
updatedProfile.work_experience = data.data;
```

#### Skills更新流程
```typescript
// 保存技能（分为technical和soft）
handleSubmit() {
  await onSave({
    section: 'skills',
    data: {
      technical_skills: skillsList.slice(0, Math.ceil(skillsList.length / 2)),
      soft_skills: skillsList.slice(Math.ceil(skillsList.length / 2)),
    },
  });
}

// profile/page.tsx 处理
updatedProfile.skills = data.data;
```

### 4. DELETE（删除）

#### 删除Education记录
```typescript
const removeEducation = (index: number) => {
  setEducationList(educationList.filter((_, i) => i !== index));
};
```

**使用场景**:
- 用户点击Education记录右上角的删除按钮
- 可以删除任意条目
- 如果删除所有记录，保存后 `profile.education` 将为空数组 `[]`

#### 删除Work Experience记录
```typescript
const removeWork = (index: number) => {
  setWorkList(workList.filter((_, i) => i !== index));
};
```

**使用场景**:
- 用户点击Work Experience记录右上角的删除按钮
- 可以删除任意条目

#### 删除Skills
```typescript
const removeSkill = (skill: string) => {
  setSkillsList(skillsList.filter(s => s !== skill));
};
```

**使用场景**:
- 用户点击技能标签上的 × 按钮
- 从列表中移除该技能

## 🔄 完整的数据流

### 保存流程（用户点击UPDATE）

```
1. EditPanel (用户界面)
   ↓
2. handleSubmit() (表单提交)
   ↓
3. onSave(data) (传递数据)
   ↓
4. profile/page.tsx handleSaveEdit(data) (处理保存逻辑)
   ↓
5. 构建 updatedProfile JSON 对象
   ↓
6. PATCH /api/user/[id] (API调用)
   ↓
7. updateUser() (Prisma 更新数据库)
   ↓
8. refreshUser() (刷新用户数据)
   ↓
9. setProfile(updatedProfile) (更新本地state)
   ↓
10. EditPanel 关闭，页面显示更新后的数据
```

### API 更新实现

```typescript
// api/user/[id]/route.ts
export async function PATCH(request, context) {
  const body = await request.json();
  const { profile } = body;
  
  // 更新用户的profile字段（JSON类型）
  const updatedUser = await updateUser(id, {
    profile: profile,  // 直接保存整个JSON对象
  });
  
  return NextResponse.json(updatedUser);
}
```

### 数据库更新

```typescript
// lib/user.ts
export async function updateUser(id: string, data: UpdateUserData) {
  return await prisma.user.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
}
```

## 🎯 字段映射表

### Personal Information

| UI 字段 | JSON 字段 | 类型 | 必填 | 说明 |
|---------|-----------|------|------|------|
| First Name | `personal.first_name` | string | ✅ | 名 |
| Last Name | `personal.last_name` | string | ✅ | 姓 |
| Full Name | `personal.full_name` | string | ✅ | 自动生成 |
| Email | `personal.personal_email` | string | ✅ | 个人邮箱 |
| Phone | `personal.phone_number` | string | ✅ | 电话号码 |
| City | `personal.location` | string | ❌ | 城市（部分） |
| Postal Code | `personal.location` | string | ❌ | 邮编（部分） |
| County | `personal.location` | string | ❌ | 县/州（部分） |
| Address Line | `personal.location` | string | ❌ | 完整地址 |
| LinkedIn URL | `personal.linkedin_url` | string | ✅ | LinkedIn链接 |
| Github URL | `personal.github_url` | string | ❌ | GitHub链接 |

### Education

| UI 字段 | JSON 字段 | 类型 | 必填 | 说明 |
|---------|-----------|------|------|------|
| School Name | `education[].institution_name` | string | ✅ | 学校名称 |
| Major | `education[].major` | string | ✅ | 专业 |
| Degree Type | `education[].degree` | string | ✅ | 学位类型 |
| GPA | `education[].gpa` | string | ❌ | 绩点 |
| Start Date | `education[].start_date` | string | ❌ | 开始日期 |
| End Date | `education[].end_date` | string | ❌ | 结束日期 |
| Currently Study | `education[].is_current` | boolean | ❌ | 当前在读 |
| Location | `education[].location` | string | ❌ | 学校位置 |

### Work Experience

| UI 字段 | JSON 字段 | 类型 | 必填 | 说明 |
|---------|-----------|------|------|------|
| Job Title | `work_experience[].job_title` | string | ✅ | 职位名称 |
| Company | `work_experience[].company_name` | string | ✅ | 公司名称 |
| Job Type | `work_experience[].job_type` | string | ✅ | 工作类型 |
| Location | `work_experience[].location` | string | ❌ | 工作地点 |
| Start Date | `work_experience[].start_date` | string | ❌ | 开始日期 |
| End Date | `work_experience[].end_date` | string | ❌ | 结束日期 |
| Currently Work | `work_experience[].is_current` | boolean | ❌ | 当前在职 |
| Description | `work_experience[].description` | string | ❌ | 工作描述 |

### Skills

| UI 字段 | JSON 字段 | 类型 | 必填 | 说明 |
|---------|-----------|------|------|------|
| 技能标签（前半部分） | `skills.technical_skills[]` | string[] | ❌ | 技术技能 |
| 技能标签（后半部分） | `skills.soft_skills[]` | string[] | ❌ | 软技能 |

## 💾 数据持久化

### 数据库Schema
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  profile   Json?    // <- Profile数据存储在这里
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 数据验证规则

1. **Personal**:
   - `first_name`, `last_name`, `personal_email`, `phone_number`, `linkedin_url` 为必填
   - Email格式验证（HTML5）
   - URL格式验证（HTML5）

2. **Education**:
   - `institution_name`, `major`, `degree` 为必填
   - 至少保留一条记录（UI建议）
   - `is_current` 为 true 时，`end_date` 自动清空

3. **Work Experience**:
   - `job_title`, `company_name`, `job_type` 为必填
   - `is_current` 为 true 时，`end_date` 自动清空

4. **Skills**:
   - 无必填要求
   - 自动去重（添加时检查）

## 🔒 数据安全

### 用户权限
```typescript
// TODO: 添加用户身份验证
// 确保只有用户自己才能更新自己的profile
// 可以使用 Supabase Auth 来验证

// 建议实现：
if (authUser.id !== userId) {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 403 }
  );
}
```

### 数据清理
```typescript
// 保存前清理空值
const cleanData = (data: any) => {
  return Object.entries(data).reduce((acc, [key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {} as any);
};
```

## 📝 使用示例

### 场景1: 用户首次创建Profile
```typescript
// 初始状态：profile = null 或 {}

// 用户填写Personal信息并保存
// 结果：
{
  "personal": { /* 用户填写的数据 */ },
  "education": [],
  "work_experience": [],
  "skills": { "technical_skills": [], "soft_skills": [] }
}
```

### 场景2: 添加第一条Education
```typescript
// 点击Education编辑按钮
// EditPanel显示一个空表单
// 用户填写信息并保存

// 结果：
{
  "education": [
    {
      "institution_name": "University of Melbourne",
      "degree": "B.Sc.",
      "major": "Data Science",
      // ...
    }
  ]
}
```

### 场景3: 添加多条Work Experience
```typescript
// 用户点击"+ Add Work Experience"
// 填写第一条工作经历
// 再次点击"+ Add Work Experience"
// 填写第二条工作经历
// 点击UPDATE保存

// 结果：
{
  "work_experience": [
    { /* 第一条工作经历 */ },
    { /* 第二条工作经历 */ }
  ]
}
```

### 场景4: 删除Education记录
```typescript
// 用户有3条Education记录
// 点击第2条的删除按钮
// 点击UPDATE保存

// 结果：education数组只剩2条记录
{
  "education": [
    { /* 第1条 */ },
    { /* 原来的第3条，现在变成第2条 */ }
  ]
}
```

### 场景5: 更新Skills
```typescript
// 原有技能：["Python", "R"]
// 用户添加："JavaScript", "TypeScript"
// 用户删除："R"
// 点击UPDATE保存

// 结果：
{
  "skills": {
    "technical_skills": ["Python", "JavaScript"],
    "soft_skills": ["TypeScript"]
  }
}
```

## 🚀 API 端点

### PATCH /api/user/[id]

**Request:**
```json
{
  "profile": {
    "personal": { /* ... */ },
    "education": [ /* ... */ ],
    "work_experience": [ /* ... */ ],
    "skills": { /* ... */ }
  }
}
```

**Response:**
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "name": "User Name",
  "profile": { /* 更新后的完整profile */ },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

## ✅ 测试清单

- [ ] Personal信息创建和更新
- [ ] Education添加、更新、删除
- [ ] Work Experience添加、更新、删除
- [ ] Skills添加和删除
- [ ] 空数据处理（首次使用）
- [ ] "当前在读/在职"复选框逻辑
- [ ] 必填字段验证
- [ ] URL格式验证
- [ ] 数据刷新和显示
- [ ] 错误处理和提示

## 📚 总结

该系统实现了完整的JSON数据CRUD功能：
- ✅ **CREATE**: 添加新的Education、Work、Skills记录
- ✅ **READ**: 从数据库读取并显示所有profile数据
- ✅ **UPDATE**: 修改Personal、Education、Work、Skills的任意字段
- ✅ **DELETE**: 删除Education、Work记录和Skills标签

所有操作都直接在 `user.profile` JSON字段中进行，数据结构清晰，易于扩展和维护。


