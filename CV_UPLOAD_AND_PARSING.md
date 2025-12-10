# CV Upload and Parsing Flow

## 概述

当用户在onboarding页面上传CV时，系统会自动：
1. 上传文件到存储服务
2. 调用CV解析服务提取简历信息
3. **解析服务自动将提取的数据保存到用户的profile字段**
4. 保存CV记录到本地数据库

## API调用流程

### 1. 文件上传到存储服务

**Endpoint**: `https://starplan-service.onrender.com/api/v1/storage/upload`

**Request**:
```bash
curl -X POST 'https://starplan-service.onrender.com/api/v1/storage/upload' \
  -F 'file=@resume.pdf' \
  -F 'bucket_name=cvs' \
  -F 'folder_path=<user_id>'
```

**Response**:
```json
{
  "success": true,
  "url": "https://your-project.supabase.co/storage/v1/object/public/cvs/user_id/resume.pdf",
  "bucket": "cvs",
  "path": "user_id/resume.pdf",
  "filename": "resume.pdf"
}
```

### 2. CV解析并自动保存Profile

**Endpoint**: `https://starplan-service.onrender.com/api/v1/cv-extraction/extract?user_id=<user_id>`

**Request**:
```bash
curl -X POST \
  'https://starplan-service.onrender.com/api/v1/cv-extraction/extract?user_id=73ed0f9d-7fae-4b53-abda-444f35c0ddf4' \
  -H 'accept: application/json' \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@CV Michael Liu.pdf;type=application/pdf'
```

**Response** (解析的CV数据):
```json
{
  "personal": {
    "full_name": "Michael Liu",
    "first_name": "Michael",
    "last_name": "Liu",
    "personal_email": "michael@example.com",
    "phone_number": "+1234567890",
    "linkedin_url": "https://linkedin.com/in/michaelliu",
    "github_url": "https://github.com/michaelliu",
    "location": "San Francisco, CA"
  },
  "education": [
    {
      "institution_name": "Stanford University",
      "degree": "Master of Science",
      "major": "Computer Science",
      "location": "Stanford, CA",
      "start_date": "2020-09",
      "end_date": "2022-06",
      "is_current": false
    }
  ],
  "work_experience": [
    {
      "company_name": "Google",
      "job_title": "Software Engineer",
      "location": "Mountain View, CA",
      "start_date": "2022-07",
      "end_date": null,
      "is_current": true,
      "description": "Developed scalable backend services..."
    }
  ],
  "skills": {
    "technical_skills": ["Python", "Java", "React", "AWS"],
    "soft_skills": ["Leadership", "Problem-solving"]
  }
}
```

**重要**：CV解析服务会自动将上述数据保存到数据库中该用户的 `profile` JSONB字段，不需要前端或本地API再次保存。

### 3. 本地CV记录保存

我们的API会保存CV的元数据到本地数据库的 `cvs` 表：

```typescript
const cv = await prisma.cV.create({
  data: {
    userId: user.id,
    fileUrl: fileUrl,           // 存储服务返回的URL
    extractedData: extractedData // CV解析返回的完整数据（可选）
  }
});
```

## 前端调用示例

### 在Onboarding页面上传CV

```typescript
const handleStartMatching = async () => {
  // ... validation ...

  const { data: { session } } = await supabase.auth.getSession();
  
  // 上传简历（会自动触发解析和profile保存）
  const resumeFormData = new FormData();
  resumeFormData.append('resume', uploadedFile);

  const resumeResponse = await fetch('/api/user/resume', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: resumeFormData,
  });

  if (!resumeResponse.ok) {
    const errorData = await resumeResponse.json();
    console.error('Failed to upload resume:', errorData.error);
    return;
  }

  const result = await resumeResponse.json();
  
  // result.extraction.success 表示CV是否成功解析
  // result.extraction.data 包含解析的CV数据
  // profile数据已经自动保存到数据库
  
  console.log('CV uploaded and parsed:', result);
  router.push('/explore');
};
```

## API Response格式

### `/api/user/resume` Response

```json
{
  "success": true,
  "cv": {
    "id": "cv-uuid",
    "fileUrl": "https://.../cvs/user_id/resume.pdf",
    "createdAt": "2024-12-07T12:00:00.000Z"
  },
  "extraction": {
    "success": true,
    "data": {
      "personal": { ... },
      "education": [ ... ],
      "work_experience": [ ... ],
      "skills": { ... }
    },
    "message": "CV parsed and profile updated successfully"
  }
}
```

如果解析失败：
```json
{
  "success": true,
  "cv": {
    "id": "cv-uuid",
    "fileUrl": "https://.../cvs/user_id/resume.pdf",
    "createdAt": "2024-12-07T12:00:00.000Z"
  },
  "extraction": {
    "success": false,
    "data": null,
    "message": "CV uploaded but parsing failed - you can retry later"
  }
}
```

## 数据库Schema

### users表的profile字段

```sql
-- users表
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  profile JSONB,  -- CV解析服务自动写入这里
  ...
);
```

**profile字段结构**：
```json
{
  "cv_data": {
    "personal": { ... },
    "education": [ ... ],
    "work_experience": [ ... ],
    "skills": { ... }
  },
  "last_cv_update": "2024-12-07T12:00:00.000Z",
  "profile_completeness": 85,
  "version": "1.0"
}
```

### cvs表

```sql
-- cvs表
CREATE TABLE cvs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  file_url TEXT NOT NULL,
  extracted_data JSONB,  -- 存储解析的原始数据（备份）
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 错误处理

### 1. 文件上传失败
```typescript
if (!uploadResponse.ok) {
  return NextResponse.json(
    { error: 'Failed to upload file to storage' },
    { status: 500 }
  );
}
```

### 2. CV解析失败（不阻断流程）
```typescript
try {
  const extractionResponse = await fetch(/* ... */);
  if (!extractionResponse.ok) {
    console.error('CV extraction error');
    // 继续，只是标记解析失败
  }
} catch (error) {
  console.error('CV extraction request failed:', error);
  // 继续，CV文件已上传
}
```

### 3. 数据库保存失败
```typescript
catch (error) {
  console.error('Resume upload API error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

## Profile数据使用

### 读取用户的profile数据

```typescript
import { prisma } from '@/lib/prisma';

// 获取用户profile
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    email: true,
    name: true,
    profile: true,  // JSONB字段
  }
});

// TypeScript类型安全
import { UserProfile } from '@/types/profile';
const profile = user.profile as UserProfile;

// 访问CV数据
const fullName = profile.cv_data?.personal?.full_name;
const education = profile.cv_data?.education || [];
const skills = profile.cv_data?.skills?.technical_skills || [];
```

### 使用工具函数

```typescript
import { 
  getDisplayName, 
  getContactEmail, 
  getAllSkills,
  calculateProfileCompleteness 
} from '@/types/profile';

const name = getDisplayName(user.profile);
const email = getContactEmail(user.profile);
const allSkills = getAllSkills(user.profile);
const completeness = calculateProfileCompleteness(user.profile);
```

## 安全考虑

1. **认证**: 所有上传操作需要有效的JWT token
2. **文件验证**: 
   - 只允许PDF和Word文档
   - 最大文件大小10MB
3. **用户隔离**: 使用用户ID作为文件夹路径，确保文件隔离
4. **错误处理**: CV解析失败不会阻断用户流程

## 测试

### 手动测试CV上传

```bash
# 1. 获取JWT token (登录后从浏览器获取)
TOKEN="your-jwt-token"

# 2. 上传CV
curl -X POST 'http://localhost:3000/api/user/resume' \
  -H "Authorization: Bearer $TOKEN" \
  -F 'resume=@test-resume.pdf'

# 3. 查看返回结果
# - success: true 表示文件上传成功
# - extraction.success: true 表示CV解析成功
# - extraction.data 包含解析的数据

# 4. 验证profile是否更新（在数据库中查询）
# SELECT profile FROM users WHERE id = 'user-id';
```

## 相关文件

- `/src/app/api/user/resume/route.ts` - CV上传API
- `/src/types/profile.ts` - Profile类型定义
- `/src/app/onboarding/page.tsx` - Onboarding页面
- `/prisma/schema.prisma` - 数据库Schema
- `PROFILE_JSON_FIELD.md` - Profile字段文档

## 总结

1. **单次上传，双重处理**：一次上传同时完成文件存储和数据解析
2. **自动profile更新**：CV解析服务自动将数据写入用户的profile字段
3. **容错设计**：解析失败不影响文件上传成功
4. **类型安全**：完整的TypeScript类型定义和工具函数
5. **可追溯**：CV记录和解析数据都保存在数据库中




