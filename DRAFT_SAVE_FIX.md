# 草稿保存功能修复文档

## 🐛 问题描述

**错误信息 1**: `Failed to save job posting` at `handleSaveDraft`

**原因**: 
1. Step 2 的必填字段（`companyName`, `jobDescription`, `jobSummary`）在数据库中不允许为空
2. 用户在 Step 1 就想保存草稿时，这些字段还没有填写
3. Prisma 无法插入空值到非空字段，导致保存失败

**错误信息 2**: `API Error: {}` (空对象)

**原因**:
1. `systemScreeningAnswers` 和 `customScreeningQuestions` 在草稿保存时可能是 `undefined`
2. 代码试图对 `undefined` 调用 `.map()` 方法导致服务器崩溃
3. 服务器崩溃导致返回空响应，客户端解析为空对象 `{}`

**错误信息 3**: `Argument 'currency': Invalid value provided. Expected String, provided Object.`

**原因**:
1. 客户端 `formData.currency` 存储为对象：`{ code: 'AUD', symbol: 'A$', name: 'Australian Dollar' }`
2. 数据库 schema 定义 `currency` 为 `String` 类型
3. 直接发送对象给 API 导致 Prisma 类型错误

---

## ✅ 解决方案

### 1. 数据库 Schema 修改

**修改前**:
```prisma
// Step 2: Job Details
companyName       String  @map("company_name")           // ❌ 必填
jobDescription    String  @map("job_description") @db.Text  // ❌ 必填
jobSummary        String  @map("job_summary")            // ❌ 必填
```

**修改后**:
```prisma
// Step 2: Job Details
companyName       String  @default("") @map("company_name")        // ✅ 默认空字符串
jobDescription    String  @default("") @map("job_description") @db.Text  // ✅ 默认空字符串
jobSummary        String  @default("") @map("job_summary")         // ✅ 默认空字符串
```

**迁移**: `20251215061051_allow_empty_fields_for_draft`

---

### 2. API 验证逻辑

添加了基于状态的验证：

```typescript
// Validate required fields based on status
const isDraft = body.status === 'DRAFT';

// 始终要求 job title
if (!body.jobTitle || !body.jobTitle.trim()) {
  return NextResponse.json(
    { error: 'Job title is required' },
    { status: 400 }
  );
}

// 只在发布时验证其他必填字段
if (!isDraft) {
  if (!body.companyName || !body.companyName.trim()) {
    return NextResponse.json(
      { error: 'Company name is required for publishing' },
      { status: 400 }
    );
  }
  if (!body.jobDescription || !body.jobDescription.trim()) {
    return NextResponse.json(
      { error: 'Job description is required for publishing' },
      { status: 400 }
    );
  }
  if (!body.jobSummary || !body.jobSummary.trim()) {
    return NextResponse.json(
      { error: 'Job summary is required for publishing' },
      { status: 400 }
    );
  }
}
```

---

### 3. 默认值处理

为所有字段提供默认值，避免 undefined 导致的错误：

```typescript
const jobPostingData = {
  userId,
  status: (body.status as 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED') || 'DRAFT',
  
  // Step 1: Job Classification - 提供默认值
  jobTitle: body.jobTitle,
  categories: body.categories || [],                    // ✅ 默认空数组
  categorySkills: body.categorySkills || [],            // ✅ 默认空数组
  isCategoryManuallySelected: body.isCategoryManuallySelected || false,
  countryRegion: body.countryRegion || 'Australia',     // ✅ 默认值
  experienceLevel: body.experienceLevel || 'Junior',    // ✅ 默认值
  experienceYearsFrom: body.experienceYearsFrom || 0,   // ✅ 默认值
  experienceYearsTo: body.experienceYearsTo?.toString() || '0',
  workType: body.workType || 'Full-time',               // ✅ 默认值
  payType: body.payType || 'Annual salary',             // ✅ 默认值
  currency: body.currency || 'AUD',                     // ✅ 默认值
  payFrom: body.payFrom || '',                          // ✅ 默认空字符串
  payTo: body.payTo || '',                              // ✅ 默认空字符串
  showSalaryOnAd: body.showSalaryOnAd ?? true,
  salaryDisplayText: body.salaryDisplayText || null,
  
  // Step 2: Job Details - 允许空值（草稿）
  companyName: body.companyName || '',                  // ✅ 默认空字符串
  jobDescription: body.jobDescription || '',            // ✅ 默认空字符串
  jobSummary: body.jobSummary || '',                    // ✅ 默认空字符串
  keySellingPoint1: body.keySellingPoint1 || null,
  keySellingPoint2: body.keySellingPoint2 || null,
  keySellingPoint3: body.keySellingPoint3 || null,
  companyLogo: body.companyLogo || null,
  companyCoverImage: body.companyCoverImage || null,
  videoLink: body.videoLink || null,
  
  // Step 3: Screening & Filters
  selectedCountries: body.selectedCountries || [],      // ✅ 默认空数组
  workAuthByCountry: body.workAuthByCountry || {},      // ✅ 默认空对象
  applicationDeadline: body.applicationDeadline 
    ? new Date(body.applicationDeadline) 
    : null,
};
```

---

### 4. 处理空数组 (修复 "API Error: {}" 问题)

防止对 `undefined` 调用 `.map()` 方法：

```typescript
// ❌ 之前：如果 body.systemScreeningAnswers 是 undefined 会报错
systemScreeningAnswers: {
  create: body.systemScreeningAnswers.map(answer => ({
    questionId: answer.questionId,
    requirement: answer.requirement,
    selectedAnswers: answer.selectedAnswers,
  })),
}

// ✅ 现在：提供默认空数组
systemScreeningAnswers: {
  create: (body.systemScreeningAnswers || []).map(answer => ({
    questionId: answer.questionId,
    requirement: answer.requirement,
    selectedAnswers: answer.selectedAnswers,
  })),
}
```

同样应用到 `customScreeningQuestions`：

```typescript
customScreeningQuestions: {
  create: (body.customScreeningQuestions || []).map(question => ({
    questionText: question.questionText,
    answerType: question.answerType,
    options: question.options || [],
    mustAnswer: question.mustAnswer,
    idealAnswer: question.idealAnswer ? question.idealAnswer : undefined,
    disqualifyIfNotIdeal: question.disqualifyIfNotIdeal,
  })),
}
```

---

### 5. Currency 类型转换 (修复 "Expected String, provided Object" 问题)

客户端存储对象，发送给 API 时转换为字符串：

```typescript
const payload = {
  ...formData,
  // Convert currency object to string (code only)
  currency: typeof formData.currency === 'object' 
    ? formData.currency.code    // ✅ "AUD"
    : formData.currency,         // Already a string
  status: 'DRAFT' as const,
};
```

**为什么需要转换**:

| 位置 | 类型 | 示例 | 原因 |
|------|------|------|------|
| **客户端 `formData`** | Object | `{ code: 'AUD', symbol: 'A$', name: 'Australian Dollar' }` | UI 需要显示符号和名称 |
| **API/数据库** | String | `"AUD"` | 数据库只需要存储货币代码 |

**数据流**:
```
UI 显示 → { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' }
                           ↓ 转换
API 发送 → "AUD"
                           ↓
数据库存储 → "AUD"
```

---

### 6. 客户端错误处理改进

添加了更详细的错误信息展示和服务器响应检查：

```typescript
const response = await fetch('/api/job-postings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  },
  body: JSON.stringify(payload),
});

// ✅ 检查响应状态
if (!response.ok) {
  const text = await response.text();
  console.error('Server Error Response:', text);
  throw new Error(`Server error (${response.status}): ${text || 'Unknown error'}`);
}

const data = await response.json();

if (data.success) {
  setSaveMessage({ type: 'success', text: 'Draft saved successfully!' });
  setTimeout(() => setSaveMessage(null), 3000);
} else {
  // Log detailed error for debugging
  console.error('API Error:', data);
  const errorMessage = data.details 
    ? `${data.error}: ${data.details}`      // ✅ 显示详细错误
    : data.error || 'Failed to save draft';
  throw new Error(errorMessage);
}
```

**改进点**:
- ✅ 在解析 JSON 前先检查 HTTP 状态码
- ✅ 如果服务器崩溃，显示原始错误文本
- ✅ 显示 HTTP 状态码（400, 500 等）
- ✅ 防止空对象 `{}` 问题

---

## 📊 验证逻辑对比

### 草稿 (DRAFT)
**最低要求**:
- ✅ `jobTitle` - 必填
- ✅ `categories` - 至少一个（客户端验证）

**可为空**:
- ✅ `companyName` - 可空
- ✅ `jobDescription` - 可空
- ✅ `jobSummary` - 可空
- ✅ 所有其他字段

### 发布 (PUBLISHED)
**必填字段**:
- ✅ `jobTitle` - 必填
- ✅ `categories` - 至少一个
- ✅ `companyName` - 必填
- ✅ `jobDescription` - 必填
- ✅ `jobSummary` - 必填

---

## 🔄 保存流程

### 草稿保存流程

```
用户在 Step 1 填写基本信息
    ↓
点击 "Save Draft"
    ↓
客户端验证:
  - jobTitle 不为空 ✅
  - categories.length > 0 ✅
    ↓
发送请求: { status: 'DRAFT', ... }
    ↓
API 验证:
  - jobTitle 不为空 ✅
  - 跳过其他必填验证（因为是草稿）
    ↓
Prisma 保存:
  - companyName: "" (默认值)
  - jobDescription: "" (默认值)
  - jobSummary: "" (默认值)
    ↓
✅ 保存成功 → 显示成功消息
```

### 发布流程

```
用户完成所有步骤
    ↓
Step 4 点击 "Publish Job Ad"
    ↓
客户端验证:
  - Step 1 所有必填字段 ✅
  - Step 2 所有必填字段 ✅
    ↓
发送请求: { status: 'PUBLISHED', ... }
    ↓
API 验证:
  - jobTitle 不为空 ✅
  - companyName 不为空 ✅
  - jobDescription 不为空 ✅
  - jobSummary 不为空 ✅
    ↓
Prisma 保存所有数据
    ↓
✅ 发布成功 → 跳转到 Jobs 页面
```

---

## 📝 数据库迁移

### 迁移文件内容

```sql
-- AlterTable
ALTER TABLE "job_postings" 
  ALTER COLUMN "company_name" SET DEFAULT '',
  ALTER COLUMN "job_description" SET DEFAULT '',
  ALTER COLUMN "job_summary" SET DEFAULT '';
```

**影响**:
- ✅ 现有数据不受影响
- ✅ 新记录可以使用默认空字符串
- ✅ 支持草稿保存功能

---

## 🎯 客户端按钮禁用逻辑

### Save Draft 按钮

```typescript
disabled={
  isSaving ||                          // 正在保存
  !formData.jobTitle ||                // 没有标题
  formData.categories.length === 0     // 没有选择类别
}
```

**要求**:
- 最少需要 job title 和至少一个 category

### Publish Job Ad 按钮

```typescript
disabled={isSaving}

// 点击时会执行完整验证
if (!validateStep1() || !validateStep2()) {
  setSaveMessage({ type: 'error', text: 'Please complete all required fields' });
  return;
}
```

**要求**:
- Step 1 所有必填字段
- Step 2 所有必填字段

---

## 🐛 调试技巧

### 查看详细错误

客户端会在控制台输出详细错误：

```typescript
console.error('API Error:', data);
// 输出: { error: "...", details: "...", status: 400 }
```

### 常见错误信息

| 错误 | 原因 | 解决方法 |
|------|------|----------|
| `Job title is required` | 标题为空 | 填写职位标题 |
| `Company name is required for publishing` | 发布时公司名为空 | 填写公司名称 |
| `Job description is required for publishing` | 发布时描述为空 | 填写职位描述 |
| `Job summary is required for publishing` | 发布时摘要为空 | 填写职位摘要 |
| `Unauthorized` | 没有登录或 token 过期 | 重新登录 |
| `API Error: {}` (空对象) | 服务器崩溃（通常是 undefined.map() 错误） | 已修复：添加默认空数组 |
| `Expected String, provided Object` | Currency 对象未转换为字符串 | 已修复：自动转换 currency.code |
| `Server error (500): ...` | 服务器内部错误 | 查看详细错误信息 |

---

## ✅ 测试清单

### 草稿保存测试

- [ ] Step 1 填写 title 和 category 后可以保存
- [ ] 保存草稿后在 Jobs 页面显示为 DRAFT
- [ ] 可以重新编辑草稿
- [ ] 草稿数据正确保存

### 发布测试

- [ ] 没有填写完整时显示错误提示
- [ ] 填写完整后可以发布
- [ ] 发布后显示为 PUBLISHED
- [ ] 发布后正确跳转到 Jobs 页面

### 空值测试

- [ ] 草稿可以保存空的 companyName
- [ ] 草稿可以保存空的 jobDescription
- [ ] 草稿可以保存空的 jobSummary
- [ ] 发布时这些字段不能为空

---

## 📊 数据示例

### 草稿数据

```json
{
  "status": "DRAFT",
  "jobTitle": "Senior ML Engineer",
  "categories": ["Machine Learning Engineer (AI / ML)"],
  "categorySkills": ["Python", "PyTorch"],
  "countryRegion": "Australia",
  "experienceLevel": "Senior",
  
  // ✅ 这些可以为空
  "companyName": "",
  "jobDescription": "",
  "jobSummary": "",
  "selectedCountries": [],
  "systemScreeningAnswers": [],
  "customScreeningQuestions": []
}
```

### 发布数据

```json
{
  "status": "PUBLISHED",
  "jobTitle": "Senior ML Engineer",
  "categories": ["Machine Learning Engineer (AI / ML)"],
  
  // ✅ 这些必须有值
  "companyName": "StarPlan Technologies",
  "jobDescription": "We are seeking an experienced ML Engineer...",
  "jobSummary": "Join our AI team to build cutting-edge solutions.",
  
  // ... 其他完整数据
}
```

---

## 🎉 总结

### 修复内容

✅ **数据库**: 允许 Step 2 必填字段使用默认空值  
✅ **API 验证**: 基于状态的分层验证  
✅ **默认值**: 所有字段提供合理默认值  
✅ **空数组处理**: 防止对 undefined 调用 .map() 方法  
✅ **Currency 转换**: 对象转换为字符串再发送给 API  
✅ **错误处理**: 显示详细错误信息和服务器响应  

### 用户体验改进

- 🎯 **更灵活**: 可以在任何步骤保存草稿
- 📝 **更清晰**: 明确区分草稿和发布的要求
- 🔍 **更友好**: 详细的错误提示
- 🚀 **更快速**: 不需要填写完整即可保存进度

现在用户可以：
1. ✅ 在 Step 1 就保存草稿
2. ✅ 随时保存工作进度
3. ✅ 回来继续编辑草稿
4. ✅ 完成后发布职位

所有草稿保存问题已修复！🎊

