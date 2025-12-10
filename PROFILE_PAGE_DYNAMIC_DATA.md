# Profile Page Dynamic Data Display

## 概述

Profile页面现在可以动态获取并展示users表中的profile JSON数据。数据来源于CV解析服务提取的简历信息，页面会根据实际数据智能展示或显示空状态。

## 数据结构

Profile页面展示的数据基于CV解析服务的返回格式：

```typescript
interface UserProfile {
  cv_data?: {
    personal: {
      full_name: string | null;
      first_name: string | null;
      last_name: string | null;
      personal_email: string | null;
      phone_number: string | null;
      linkedin_url: string | null;
      github_url: string | null;
      location: string | null;
    };
    education: Array<{
      institution_name: string | null;
      degree: string | null;
      major: string | null;
      location: string | null;
      start_date: string | null;  // 'YYYY-MM' or 'YYYY'
      end_date: string | null;
      is_current: boolean;
    }>;
    work_experience: Array<{
      company_name: string | null;
      job_title: string | null;
      location: string | null;
      start_date: string | null;
      end_date: string | null;
      is_current: boolean;
      description: string | null;
    }>;
    skills: {
      technical_skills: string[];
      soft_skills: string[];
    };
  };
}
```

## 页面功能

### 1. 动态数据加载

```typescript
// 从数据库加载用户profile
const { user: dbUser } = useUser(authUser?.id);

// 解析profile JSON
useEffect(() => {
  if (dbUser?.profile) {
    setProfile(dbUser.profile as UserProfile);
  }
}, [dbUser]);
```

### 2. Personal Information (个人信息)

**显示内容**：
- 全名 (full_name)
- 邮箱 (personal_email)
- 电话 (phone_number)
- 地址 (location)
- LinkedIn链接 (linkedin_url)
- GitHub链接 (github_url)

**降级策略**：
- 如果CV中没有名字，使用数据库中的name字段
- 如果CV中没有邮箱，使用认证邮箱
- 缺失的字段不显示

**示例**：
```tsx
const displayName = personalInfo?.full_name || dbUser?.name || authUser.email || 'User';
const displayEmail = personalInfo?.personal_email || authUser.email;
const displayPhone = personalInfo?.phone_number;
```

### 3. Education (教育经历)

**显示内容**：
- 时间段 (start_date - end_date 或 Present)
- 学校名称 (institution_name)
- 学位和专业 (degree in major)
- 地理位置 (location)

**空状态**：
- 如果没有教育信息，显示空状态占位符
- 在编辑模式下显示"+ Add Education"按钮

**示例数据**：
```tsx
{
  education.map((edu, index) => (
    <div key={index}>
      <div>{formatDate(edu.start_date, edu.end_date, edu.is_current)}</div>
      <h3>{edu.institution_name || 'Institution not specified'}</h3>
      <p>{edu.degree && edu.major ? `${edu.degree} in ${edu.major}` : edu.degree || edu.major}</p>
      {edu.location && <p>{edu.location}</p>}
    </div>
  ))
}
```

### 4. Work Experience (工作经历)

**显示内容**：
- 时间段 (start_date - end_date 或 Present)
- 公司名称 (company_name)
- 职位 (job_title)
- 地理位置 (location)
- 工作描述 (description)

**空状态**：
- 如果没有工作经历，显示空状态占位符
- 在编辑模式下显示"+ Add Experience"按钮

**示例数据**：
```tsx
{
  workExperience.map((work, index) => (
    <div key={index}>
      <div>{formatDate(work.start_date, work.end_date, work.is_current)}</div>
      <h3>{work.company_name || 'Company not specified'}</h3>
      <p>{work.job_title || 'Position not specified'}</p>
      {work.location && <p>{work.location}</p>}
      {work.description && <p>{work.description}</p>}
    </div>
  ))
}
```

### 5. Skills (技能)

**显示内容**：
- 技术技能 (technical_skills) - 显示为标签云
- 软技能 (soft_skills) - 显示为标签云

**空状态**：
- 如果没有技能信息，显示空状态占位符
- 在编辑模式下显示"+ Add Skills"按钮

**示例数据**：
```tsx
<div>
  {technicalSkills.length > 0 && (
    <div>
      <h4>Technical Skills</h4>
      <div>
        {technicalSkills.map((skill, index) => (
          <span key={index} className={styles.skillTag}>{skill}</span>
        ))}
      </div>
    </div>
  )}
  {softSkills.length > 0 && (
    <div>
      <h4>Soft Skills</h4>
      <div>
        {softSkills.map((skill, index) => (
          <span key={index} className={styles.skillTag}>{skill}</span>
        ))}
      </div>
    </div>
  )}
</div>
```

### 6. Job Preferences (工作偏好)

**显示内容**：
- Job Function (职位类型)
- Job Types (工作类型)
- Location (期望地点)
- Remote Open (是否接受远程)
- H1B Sponsorship (是否需要H1B)

这些数据来自onboarding阶段用户填写的信息，存储在users表的对应字段中。

## 日期格式化

```typescript
const formatDate = (
  startDate: string | null, 
  endDate: string | null, 
  isCurrent: boolean
) => {
  if (!startDate) return 'Date not specified';
  const start = startDate;  // 'YYYY-MM' or 'YYYY'
  const end = isCurrent ? 'Present' : (endDate || 'Present');
  return `${start} - ${end}`;
};
```

**示例输出**：
- `"2023-01 - Present"` (当前在读/在职)
- `"2020-09 - 2022-06"` (已完成)
- `"2022 - 2023"` (只有年份)

## 空状态处理

### 视觉设计

```css
.emptyState {
  padding: 3rem 2rem;
  text-align: center;
  background: #f9fafb;
  border-radius: 12px;
  border: 2px dashed #e5e7eb;
}
```

### 编辑模式

当用户点击"Edit Profile"按钮时，`isEditing`状态为true，空状态会显示"Add"按钮：

```tsx
{education.length === 0 && (
  <div className={styles.emptyState}>
    <p>No education information available.</p>
    {isEditing && <button className={styles.addButton}>+ Add Education</button>}
  </div>
)}
```

## 数据获取流程

```
用户访问 /profile
  ↓
useAuth() → 获取认证用户
  ↓
useUser(userId) → 从数据库获取用户信息
  ↓
profile = dbUser.profile → 解析profile JSON
  ↓
提取 cv_data.personal, education, work_experience, skills
  ↓
动态渲染页面内容
```

## 数据优先级

### 姓名显示优先级
1. `profile.cv_data.personal.full_name` (CV中的全名)
2. `dbUser.name` (数据库中的名字)
3. `authUser.email` (认证邮箱作为fallback)
4. `"User"` (最后的默认值)

### 邮箱显示优先级
1. `profile.cv_data.personal.personal_email` (CV中的邮箱)
2. `authUser.email` (认证邮箱)

### 其他信息
- 如果字段为null或空字符串，不显示该项
- 数组字段为空时，显示空状态
- 可选字段(如location, description)为null时不显示

## UI/UX特性

### 1. 加载状态
```tsx
if (authLoading || userLoading) {
  return (
    <div className={styles.loading}>
      <div className={styles.spinner}></div>
      <p>Loading your profile...</p>
    </div>
  );
}
```

### 2. 交互式时间轴
- 每个时间节点有动画效果
- Hover时节点放大
- 渐变连接线

### 3. 技能标签云
- 自适应布局
- 不同技能分类
- 视觉上区分technical和soft skills

### 4. 社交链接
- LinkedIn和GitHub可点击
- 在新标签页打开
- 带图标识别

## 工具函数

从`@/types/profile`导入的辅助函数：

```typescript
import { 
  getDisplayName,      // 获取显示名称
  getContactEmail,     // 获取联系邮箱
  getContactPhone,     // 获取联系电话
  getAllSkills,        // 获取所有技能
} from '@/types/profile';

// 使用示例
const name = getDisplayName(profile);
const email = getContactEmail(profile);
const allSkills = getAllSkills(profile);
```

## 未来增强

### 1. 编辑功能 (TODO)
- 点击"Edit Profile"进入编辑模式
- 内联编辑各个section
- 保存更新到数据库

### 2. 头像上传 (TODO)
- 点击头像可上传新图片
- 更新`avatarUrl`字段

### 3. Profile完整度 (TODO)
- 显示profile完整度百分比
- 提示用户填写缺失信息
- 使用`calculateProfileCompleteness()`

### 4. 导出简历 (TODO)
- 导出为PDF格式
- 使用profile数据生成简历

## 测试

### 测试场景

1. **有完整CV数据的用户**
   - 所有section都显示实际数据
   - 没有空状态

2. **部分CV数据的用户**
   - 有数据的section显示内容
   - 缺失的section显示空状态

3. **没有CV数据的新用户**
   - 所有section显示空状态
   - 显示"Add"按钮（编辑模式下）

4. **只有onboarding数据的用户**
   - Personal info使用基本信息
   - CV sections显示空状态
   - Job Preferences显示onboarding填写的内容

### 测试数据库查询

```sql
-- 查看用户的profile数据
SELECT 
  id, 
  email, 
  name, 
  profile 
FROM users 
WHERE id = 'user-uuid';

-- 查看profile中的specific字段
SELECT 
  profile->'cv_data'->'personal'->>'full_name' as name,
  profile->'cv_data'->'education' as education,
  profile->'cv_data'->'skills'->'technical_skills' as tech_skills
FROM users 
WHERE id = 'user-uuid';
```

## 相关文件

- `/src/app/profile/page.tsx` - Profile页面组件
- `/src/app/profile/page.module.css` - Profile页面样式
- `/src/types/profile.ts` - Profile类型定义和工具函数
- `/src/hooks/useUser.ts` - 用户数据获取hook
- `/src/hooks/useAuth.ts` - 认证状态hook
- `PROFILE_JSON_FIELD.md` - Profile字段详细文档
- `CV_UPLOAD_AND_PARSING.md` - CV上传和解析流程

## 总结

Profile页面现在完全基于动态数据：
1. ✅ 从数据库读取profile JSON
2. ✅ 智能展示CV解析的数据
3. ✅ 优雅的空状态处理
4. ✅ 支持编辑模式（UI已就绪）
5. ✅ 响应式布局
6. ✅ 平滑的加载动画
7. ✅ 类型安全的数据访问

用户上传CV后，profile页面会立即展示解析后的简历信息，无需任何手动操作！




