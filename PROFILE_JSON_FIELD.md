# Profile JSON Field 使用指南

## 📋 概述

User表现在包含一个`profile` JSON字段，可以灵活存储用户的额外个人资料信息。

## 🗄️ 数据库Schema

```prisma
model User {
  // ... 其他字段
  
  // Profile额外信息（JSON格式）
  profile Json? @map("profile")
  
  // ...
}
```

**字段属性：**
- 类型：`Json` (PostgreSQL JSONB)
- 可选：`?` (nullable)
- 数据库列名：`profile`

## 📊 推荐的JSON结构

```typescript
interface UserProfile {
  // 基本信息
  bio?: string;                    // 个人简介
  headline?: string;                // 一句话介绍
  location?: string;                // 所在地
  timezone?: string;                // 时区
  
  // 社交链接
  social?: {
    linkedin?: string;              // LinkedIn URL
    github?: string;                // GitHub URL
    twitter?: string;               // Twitter/X URL
    website?: string;               // 个人网站
  };
  
  // 教育经历
  education?: Array<{
    institution: string;            // 学校名称
    degree: string;                 // 学位
    field: string;                  // 专业
    startDate: string;              // 开始日期
    endDate?: string;               // 结束日期（在读可为空）
    description?: string;           // 描述
  }>;
  
  // 工作经历
  experience?: Array<{
    company: string;                // 公司名称
    position: string;               // 职位
    location?: string;              // 工作地点
    startDate: string;              // 开始日期
    endDate?: string;               // 结束日期（在职可为空）
    description?: string;           // 工作描述
    achievements?: string[];        // 主要成就
  }>;
  
  // 技能
  skills?: Array<{
    name: string;                   // 技能名称
    level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    category?: string;              // 分类（如：编程语言、工具等）
  }>;
  
  // 项目
  projects?: Array<{
    name: string;                   // 项目名称
    description: string;            // 项目描述
    url?: string;                   // 项目链接
    technologies?: string[];        // 使用的技术
    startDate?: string;
    endDate?: string;
  }>;
  
  // 语言
  languages?: Array<{
    name: string;                   // 语言名称
    proficiency: 'basic' | 'conversational' | 'fluent' | 'native';
  }>;
  
  // 证书
  certifications?: Array<{
    name: string;                   // 证书名称
    issuer: string;                 // 颁发机构
    date: string;                   // 获得日期
    url?: string;                   // 证书链接
  }>;
  
  // 偏好设置
  preferences?: {
    emailNotifications?: boolean;   // 邮件通知
    jobAlerts?: boolean;            // 职位提醒
    newsletter?: boolean;           // 订阅新闻
    visibility?: 'public' | 'private' | 'connections';
  };
}
```

## 💻 使用示例

### 1. 创建/更新用户Profile

```typescript
// 在API路由中
import { prisma } from '@/lib/prisma';

// 创建完整的profile
await prisma.user.update({
  where: { id: userId },
  data: {
    profile: {
      bio: "Passionate data scientist with 3+ years of experience",
      headline: "Data Scientist | ML Engineer",
      social: {
        linkedin: "https://linkedin.com/in/michael-liu",
        github: "https://github.com/michael0127"
      },
      education: [
        {
          institution: "University of Melbourne",
          degree: "Bachelor of Science",
          field: "Data Science",
          startDate: "2023-01",
          endDate: null // 在读
        }
      ],
      skills: [
        { name: "Python", level: "advanced", category: "Programming" },
        { name: "Machine Learning", level: "intermediate", category: "AI/ML" }
      ]
    }
  }
});
```

### 2. 部分更新Profile

```typescript
// 只更新特定字段
const currentUser = await prisma.user.findUnique({
  where: { id: userId }
});

const updatedProfile = {
  ...(currentUser.profile as object || {}),
  bio: "Updated bio text",
  social: {
    ...(currentUser.profile?.social || {}),
    github: "https://github.com/newusername"
  }
};

await prisma.user.update({
  where: { id: userId },
  data: { profile: updatedProfile }
});
```

### 3. 读取Profile数据

```typescript
// 获取用户及其profile
const user = await prisma.user.findUnique({
  where: { id: userId }
});

// 类型断言
const profile = user.profile as UserProfile;

console.log(profile.bio);
console.log(profile.education?.[0]?.institution);
```

### 4. 在前端使用

```typescript
'use client';

import { useState, useEffect } from 'react';

interface UserProfile {
  bio?: string;
  social?: {
    linkedin?: string;
    github?: string;
  };
  // ... 其他字段
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      const res = await fetch('/api/user/me');
      const user = await res.json();
      setProfile(user.profile);
    }
    fetchProfile();
  }, []);

  return (
    <div>
      <p>{profile?.bio}</p>
      <a href={profile?.social?.linkedin}>LinkedIn</a>
    </div>
  );
}
```

## 🔧 API端点示例

### GET /api/user/profile

```typescript
// src/app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  // 获取当前用户ID（从session/token）
  const userId = 'xxx';
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      profile: true
    }
  });

  return NextResponse.json(user);
}
```

### PATCH /api/user/profile

```typescript
export async function PATCH(request: NextRequest) {
  const userId = 'xxx';
  const body = await request.json();

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      profile: body.profile
    }
  });

  return NextResponse.json(user);
}
```

## 🎯 实际应用场景

### 1. 完整简历页面
存储详细的教育背景、工作经历、项目经验等。

### 2. 社交链接展示
在用户卡片上显示LinkedIn、GitHub等链接。

### 3. 技能匹配
根据skills数组进行职位匹配和推荐。

### 4. 个性化设置
存储用户的通知偏好、隐私设置等。

## 📝 注意事项

### 1. **JSON验证**
虽然可以存储任意JSON，但建议：
- 在前端和后端都进行schema验证
- 使用TypeScript接口定义数据结构
- 考虑使用Zod或Yup进行运行时验证

```typescript
import { z } from 'zod';

const ProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  social: z.object({
    linkedin: z.string().url().optional(),
    github: z.string().url().optional(),
  }).optional(),
  // ...
});

// 验证
const validatedProfile = ProfileSchema.parse(userInput);
```

### 2. **性能考虑**
- JSONB字段支持索引，但需谨慎使用
- 大量嵌套数据可能影响查询性能
- 频繁更新的数据考虑独立表

### 3. **数据迁移**
如果需要重构JSON结构：
```typescript
// 批量更新所有用户的profile结构
const users = await prisma.user.findMany();

for (const user of users) {
  if (user.profile) {
    const oldProfile = user.profile as any;
    const newProfile = {
      ...oldProfile,
      // 添加新字段或重构结构
      newField: 'default value'
    };
    
    await prisma.user.update({
      where: { id: user.id },
      data: { profile: newProfile }
    });
  }
}
```

## 🔍 查询示例

### 1. 查询包含特定技能的用户
```typescript
// PostgreSQL JSONB查询
const usersWithPython = await prisma.$queryRaw`
  SELECT * FROM users
  WHERE profile @> '{"skills": [{"name": "Python"}]}'::jsonb
`;
```

### 2. 更新嵌套字段
```typescript
// 使用PostgreSQL的JSONB操作
await prisma.$executeRaw`
  UPDATE users
  SET profile = jsonb_set(
    profile,
    '{social,github}',
    '"https://github.com/newurl"'
  )
  WHERE id = ${userId}
`;
```

## 📚 相关资源

- [Prisma JSON字段文档](https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#json)
- [PostgreSQL JSONB文档](https://www.postgresql.org/docs/current/datatype-json.html)
- [TypeScript类型安全](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)

## ✅ 最佳实践

1. ✅ 定义清晰的TypeScript接口
2. ✅ 进行输入验证
3. ✅ 提供合理的默认值
4. ✅ 文档化JSON结构
5. ✅ 考虑版本控制（如添加version字段）
6. ✅ 定期备份和清理无效数据

---

**创建时间**: 2024-12-07
**迁移**: `20251207110320_add_profile_json_field`






