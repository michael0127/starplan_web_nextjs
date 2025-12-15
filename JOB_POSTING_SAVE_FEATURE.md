# Job Posting 保存与展示功能实现文档

## 📋 功能概述

实现了完整的职位发布数据流：
1. **用户填写表单** → 保存到数据库（通过 Prisma）
2. **数据库存储** → 所有字段完整保存
3. **Jobs 页面展示** → 查看、编辑、删除职位

---

## ✅ 已实现的功能

### 1. 保存草稿功能

**触发位置**: 所有步骤都可以使用"Save Draft"按钮

**功能特点**:
- ✅ 随时保存当前进度
- ✅ 自动保存为 DRAFT 状态
- ✅ 成功提示消息
- ✅ 最小验证（至少需要 job title 和 category）

**API 端点**: `POST /api/job-postings`

**数据示例**:
```json
{
  "status": "DRAFT",
  "jobTitle": "Senior ML Engineer",
  "categories": ["Machine Learning Engineer (AI / ML)"],
  "categorySkills": ["Python", "PyTorch", "TensorFlow"],
  // ... 所有其他字段
}
```

---

### 2. 发布职位功能

**触发位置**: 第 4 步（Review & Payment）的"Publish Job Ad"按钮

**功能特点**:
- ✅ 完整表单验证（Step 1, 2 必填字段）
- ✅ 自动保存为 PUBLISHED 状态
- ✅ 成功后跳转到 Jobs 页面
- ✅ 所有数据持久化到数据库

**API 端点**: `POST /api/job-postings`

**发布流程**:
```
用户点击 Publish
    ↓
验证 Step 1 必填字段
    ↓
验证 Step 2 必填字段
    ↓
调用 API 保存（status: PUBLISHED）
    ↓
显示成功消息
    ↓
1.5秒后跳转到 /employer/jobs
```

---

### 3. Jobs 页面展示

**页面路径**: `/employer/jobs`

**功能特点**:
- ✅ 展示所有职位列表
- ✅ 按状态筛选（All / Published / Drafts / Closed）
- ✅ 显示关键信息：
  - 职位标题
  - 公司名称
  - 地点和工作类型
  - 发布日期
  - Categories（最多显示 3 个）
  - 职位摘要
  - 状态标签

**操作按钮**:
- **草稿职位**: "Continue Editing" 按钮
- **已发布职位**: "View Details" + "Edit" + "Delete"

---

## 🗄️ 数据库存储

### 完整字段映射

所有表单字段都会保存到数据库的 `job_postings` 表：

#### Step 1: Job Classification (14 个字段)
```typescript
{
  jobTitle: string           // 职位标题 ✅
  categories: string[]       // 多个类别 ✅
  categorySkills: string[]   // 技能列表 ✅
  isCategoryManuallySelected: boolean  // 是否手动选择
  countryRegion: string      // 国家/地区 ✅
  experienceLevel: string    // 经验级别 ✅
  experienceYearsFrom: number // 最少年限 ✅
  experienceYearsTo: string  // 最多年限 ✅
  workType: string           // 工作类型 ✅
  payType: string            // 薪资类型 ✅
  currency: string           // 货币 ✅
  payFrom: string            // 最低薪资 ✅
  payTo: string              // 最高薪资 ✅
  showSalaryOnAd: boolean    // 是否显示薪资
  salaryDisplayText: string? // 自定义薪资文本
}
```

#### Step 2: Job Details (9 个字段)
```typescript
{
  companyName: string        // 公司名称 ✅
  jobDescription: string     // 职位描述 ✅
  jobSummary: string         // 职位摘要 ✅
  keySellingPoint1: string?  // 卖点 1
  keySellingPoint2: string?  // 卖点 2
  keySellingPoint3: string?  // 卖点 3
  companyLogo: string?       // Logo (Base64/URL)
  companyCoverImage: string? // 封面图 (Base64/URL)
  videoLink: string?         // YouTube 链接
}
```

#### Step 3: Screening & Filters (4 个字段)
```typescript
{
  selectedCountries: string[]           // 选中的国家
  workAuthByCountry: Record<string, string> // 工作授权映射
  systemScreeningAnswers: Array<{       // 系统筛选答案
    questionId: string
    requirement: string
    selectedAnswers: string[]
  }>
  customScreeningQuestions: Array<{     // 自定义问题
    questionText: string
    answerType: string
    options: string[]
    mustAnswer: boolean
    idealAnswer: string | string[]
    disqualifyIfNotIdeal: boolean
  }>
  applicationDeadline: Date?            // 申请截止日期
}
```

#### 系统字段 (5 个)
```typescript
{
  id: string            // UUID 主键
  userId: string        // 用户 ID
  status: JobStatus     // DRAFT / PUBLISHED / CLOSED / ARCHIVED
  createdAt: Date       // 创建时间
  updatedAt: Date       // 更新时间
}
```

**总计**: 32+ 个字段完整保存

---

## 🔌 API 接口

### 1. 创建/更新职位

**端点**: `POST /api/job-postings`

**请求体**:
```typescript
{
  status: 'DRAFT' | 'PUBLISHED',
  // ... 所有表单字段
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "status": "PUBLISHED",
    "jobTitle": "...",
    "categories": [...],
    // ... 所有保存的数据
    "systemScreeningAnswers": [...],
    "customScreeningQuestions": [...]
  }
}
```

### 2. 获取职位列表

**端点**: `GET /api/job-postings`

**查询参数**:
- `status` (可选): DRAFT / PUBLISHED / CLOSED / ARCHIVED

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "jobTitle": "Senior ML Engineer",
      "companyName": "StarPlan",
      "status": "PUBLISHED",
      "categories": ["Machine Learning Engineer (AI / ML)"],
      // ... 其他字段
    }
  ]
}
```

### 3. 获取单个职位

**端点**: `GET /api/job-postings/[id]`

**响应**: 单个职位的完整数据

### 4. 删除职位

**端点**: `DELETE /api/job-postings/[id]`

**响应**:
```json
{
  "success": true,
  "message": "Job posting deleted successfully"
}
```

---

## 🎨 UI 交互

### 保存草稿按钮

**位置**: 所有步骤底部，导航按钮右侧

**状态**:
```typescript
// 禁用条件
disabled={
  isSaving ||                      // 正在保存
  !formData.jobTitle ||            // 没有标题
  formData.categories.length === 0 // 没有选择类别
}

// 按钮文本
{isSaving ? 'Saving...' : 'Save Draft'}
```

### 发布按钮

**位置**: 第 4 步底部

**状态**:
```typescript
disabled={isSaving}
{isSaving ? 'Publishing...' : 'Publish Job Ad'}
```

### 保存消息提示

**样式**:
- ✅ 成功: 绿色背景 + 对勾图标
- ❌ 错误: 红色背景 + 叉号图标
- 🎬 动画: 滑入效果
- ⏱️ 自动消失: 3 秒后

**示例**:
```
✓ Draft saved successfully!
✓ Job posted successfully!
✕ Failed to save draft
```

---

## 📱 Jobs 页面功能

### 职位卡片信息

```
┌─────────────────────────────────────────────────┐
│ Senior ML Engineer                [Published]   │
│ StarPlan • Australia • Full-time • Dec 14, 2024 │
│                                                  │
│ Categories: ML Engineer, Data Scientist, +1 more│
│                                                  │
│ Join our AI team to build cutting-edge         │
│ solutions that impact millions...               │
│                                                  │
│ [View Details] [Edit] [Delete]                  │
└─────────────────────────────────────────────────┘
```

### 状态筛选

- **All**: 显示所有职位
- **Published**: 只显示已发布
- **Drafts**: 只显示草稿
- **Closed**: 只显示已关闭

### 操作按钮

**草稿职位**:
- 主要按钮: "Continue Editing" → 继续编辑
- 次要按钮: "Edit" → 编辑
- 危险按钮: "Delete" → 删除

**已发布职位**:
- 次要按钮: "View Details" → 查看详情
- 次要按钮: "Edit" → 编辑
- 危险按钮: "Delete" → 删除

---

## 🔒 权限控制

### 认证检查

```typescript
const { user, loading, isEmployer } = useUserType({
  required: 'EMPLOYER',
  redirectTo: '/companies',
});
```

- ✅ 必须登录
- ✅ 必须是 EMPLOYER 用户类型
- ✅ 未认证自动跳转到 /companies

### 数据权限

所有 API 都会验证：
- ✅ 用户必须登录（Supabase session）
- ✅ 只能操作自己的职位（userId 匹配）
- ✅ 403 错误：尝试操作他人职位

---

## 🔄 完整数据流

### 发布流程

```
用户填写表单
    ↓
Step 1 (Classify)
    - 输入职位标题
    - 选择多个 categories
    - 选择地点、经验、薪资等
    ↓
[可选: Save Draft]
    ↓
Step 2 (Write)
    - 输入公司名称
    - 编写职位描述和摘要
    - 添加卖点、品牌资料
    ↓
[可选: Save Draft]
    ↓
Step 3 (Screening)
    - 选择国家（基于 Step 1）
    - 配置工作授权
    - 设置筛选问题
    ↓
[可选: Save Draft]
    ↓
Step 4 (Review)
    - 查看所有信息
    - 点击 Publish
    ↓
POST /api/job-postings
    {
      status: 'PUBLISHED',
      jobTitle: '...',
      categories: [...],
      // ... 所有 32+ 字段
    }
    ↓
Prisma 保存到数据库
    ↓
成功响应
    ↓
显示成功消息
    ↓
跳转到 /employer/jobs
    ↓
Jobs 页面显示新发布的职位
```

### 查看流程

```
用户访问 /employer/jobs
    ↓
GET /api/job-postings
    ↓
Prisma 查询数据库
    ↓
返回职位列表
    ↓
渲染职位卡片
    ↓
用户可以:
    - 查看详情
    - 编辑职位
    - 删除职位
    - 按状态筛选
```

---

## 📊 数据示例

### 完整的发布请求

```json
{
  "status": "PUBLISHED",
  
  // Step 1
  "jobTitle": "Senior Machine Learning Engineer",
  "categories": [
    "Machine Learning Engineer (AI / ML)",
    "MLOps Engineer (AI / ML)"
  ],
  "categorySkills": [
    "Python", "PyTorch", "TensorFlow", "Kubernetes",
    "Docker", "MLOps", "CI/CD"
  ],
  "isCategoryManuallySelected": true,
  "countryRegion": "Australia",
  "experienceLevel": "Senior",
  "experienceYearsFrom": 5,
  "experienceYearsTo": "10",
  "workType": "Full-time",
  "payType": "Annual salary",
  "currency": "AUD",
  "payFrom": "150000",
  "payTo": "200000",
  "showSalaryOnAd": true,
  "salaryDisplayText": "",
  
  // Step 2
  "companyName": "StarPlan Technologies",
  "jobDescription": "We are seeking an experienced ML Engineer to join our AI team...",
  "jobSummary": "Join our AI team to build cutting-edge solutions.",
  "keySellingPoint1": "Competitive salary + equity",
  "keySellingPoint2": "Work on AI/ML projects",
  "keySellingPoint3": "Flexible remote work",
  "companyLogo": "data:image/png;base64,...",
  "companyCoverImage": "data:image/jpeg;base64,...",
  "videoLink": "https://www.youtube.com/watch?v=...",
  
  // Step 3
  "selectedCountries": ["Australia", "Remote"],
  "workAuthByCountry": {
    "Australia": "I'm an Australian citizen",
    "Remote": "I can work remotely from any location"
  },
  "systemScreeningAnswers": [
    {
      "questionId": "programming_languages",
      "requirement": "must-have",
      "selectedAnswers": ["Python", "PyTorch"]
    },
    {
      "questionId": "ml_experience",
      "requirement": "must-have",
      "selectedAnswers": ["3-5 years of hands-on ML experience"]
    }
  ],
  "customScreeningQuestions": [
    {
      "id": "1702345678901",
      "questionText": "Do you have experience with Kubernetes?",
      "answerType": "yes-no",
      "options": [],
      "mustAnswer": true,
      "idealAnswer": "Yes",
      "disqualifyIfNotIdeal": true
    }
  ],
  "applicationDeadline": "2024-12-31"
}
```

---

## ✅ 测试清单

### 保存草稿测试
- [ ] Step 1 填写基本信息后点击 Save Draft
- [ ] Step 2 填写详情后点击 Save Draft
- [ ] Step 3 配置筛选后点击 Save Draft
- [ ] 验证草稿在 Jobs 页面显示
- [ ] 验证草稿状态标签为 "Draft"

### 发布职位测试
- [ ] 填写完整流程后点击 Publish
- [ ] 验证必填字段验证
- [ ] 验证成功消息显示
- [ ] 验证自动跳转到 Jobs 页面
- [ ] 验证新职位在列表中显示
- [ ] 验证状态为 "Published"

### Jobs 页面测试
- [ ] 查看所有职位
- [ ] 按状态筛选（All/Published/Drafts/Closed）
- [ ] 点击 "View Details" 查看详情
- [ ] 点击 "Edit" 编辑职位
- [ ] 点击 "Delete" 删除职位
- [ ] 验证删除确认提示
- [ ] 验证空状态显示

### 数据完整性测试
- [ ] 验证所有 Step 1 字段保存正确
- [ ] 验证所有 Step 2 字段保存正确
- [ ] 验证所有 Step 3 字段保存正确
- [ ] 验证 categories 数组保存
- [ ] 验证 systemScreeningAnswers 保存
- [ ] 验证 customScreeningQuestions 保存
- [ ] 验证图片 Base64 保存

---

## 🎉 总结

### 已实现功能
✅ **表单填写** - 4 步完整流程  
✅ **保存草稿** - 随时保存进度  
✅ **发布职位** - 完整验证 + 持久化  
✅ **数据存储** - 32+ 字段完整保存  
✅ **Jobs 页面** - 查看、编辑、删除  
✅ **状态管理** - DRAFT / PUBLISHED  
✅ **权限控制** - 用户认证 + 数据权限  

### 技术栈
- **前端**: Next.js 16 + TypeScript + React
- **后端**: Next.js API Routes
- **数据库**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **认证**: Supabase Auth

### 数据流
用户表单 → API Routes → Prisma → PostgreSQL → Jobs 页面

所有功能已完成并通过构建测试！🚀

