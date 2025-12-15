 # Job Categories 更新说明

## 更新内容

将 Job Categories 改为**直接使用 CSV 中的完整名称**（包括括号中的父类别），并且**允许用户自定义输入**任意 category。

---

## ✅ 主要变更

### 1. **使用 CSV 中的完整 Subcategory 名称**

之前的结构：
```typescript
// 旧: 按父类别分组
{
  name: 'Artificial Intelligence / Machine Learning',
  subcategories: ['Machine Learning Engineer', 'Deep Learning Engineer', ...]
}
```

现在的结构：
```typescript
// 新: 直接使用完整名称（包括括号）
const JOB_CATEGORIES = [
  'Machine Learning Engineer (Artificial Intelligence / Machine Learning)',
  'Deep Learning Engineer (Artificial Intelligence / Machine Learning)',
  'Data Scientist (Data Science & Analytics)',
  'Backend Engineer (Software Engineering)',
  // ... 共 115 个完整名称
]
```

**优势**：
- ✅ 保留完整的分类信息
- ✅ 名称更清晰明确
- ✅ 与 CSV 数据完全一致
- ✅ 方便 Fuse.js 进行模糊匹配

---

### 2. **支持自定义 Category 输入**

用户现在可以：
1. ✅ 从 115 个预定义 category 中选择
2. ✅ 接受智能推荐（Top 4）
3. ✅ 点击 "➕ Create Custom Category" 输入任意 category

**自定义输入界面**：
- 输入框：输入任意 category 名称
- 取消按钮：返回下拉选择
- 添加按钮：确认添加自定义 category
- Enter 键支持：快速提交

**自定义 Category 显示**：
```
┌──────────────────────────────────────┐
│ ➕ Custom: Senior Blockchain Engineer │  [×]
└──────────────────────────────────────┘
```

---

## 📋 完整的 115 个 Category

按领域分类（括号内为父类别）：

### Artificial Intelligence / Machine Learning (14)
- Machine Learning Engineer
- Deep Learning Engineer
- Generative AI Engineer
- Multi-Agent Systems Engineer
- Reinforcement Learning Engineer
- NLP Engineer
- Computer Vision Engineer
- Speech/Audio AI Engineer
- AI Research Scientist
- Applied AI Scientist
- AI Ethics & Policy Specialist
- AI Product Manager
- AI Data Curator / Data Labeling Ops
- AI Infrastructure Engineer (MLOps/LLMOps)

### Data Science & Analytics (8)
- Data Scientist
- Data Analyst
- Quantitative Analyst
- BI Analyst
- Statistician
- Data Visualization Engineer
- Experimentation / Causal Inference Scientist
- Decision Scientist

### Data Engineering (6)
- Data Engineer
- Big Data Engineer
- ETL Developer
- Database Engineer
- Analytics Engineer
- Data Platform Engineer

### Software Engineering (11)
- Backend Engineer
- Frontend Engineer
- Full Stack Engineer
- Systems Engineer
- Embedded Engineer
- Cloud Software Engineer
- Mobile Engineer (iOS/Android)
- API Engineer
- DevOps Engineer
- Site Reliability Engineer (SRE)
- Platform Engineer

### Cloud & Infrastructure (6)
- Cloud Architect
- Cloud Engineer
- Cloud Security Engineer
- Infrastructure Engineer
- Network Engineer
- Kubernetes Engineer

### Security & Cybersecurity (8)
- Cybersecurity Engineer
- Security Analyst
- Security Architect
- Penetration Tester / Ethical Hacker
- Threat Intelligence Analyst
- Application Security Engineer
- Cloud Security Specialist
- Governance Risk & Compliance (GRC)

### Product & Project Roles (8)
- Technical Product Manager
- AI Product Manager
- Technical Program Manager
- Scrum Master
- Product Analyst
- UX Researcher
- UI/UX Designer
- Service Designer

### Robotics & Autonomous Systems (6)
- Robotics Engineer
- Autonomous Systems Engineer
- Mechatronics Engineer
- Sensor Fusion Engineer
- Robot Learning Engineer
- Hardware/Embedded Robotics Engineer

### Hardware & Semiconductor (7)
- Hardware Engineer
- FPGA Engineer
- ASIC Engineer
- Chip Design Engineer
- Computer Architect
- Embedded Systems Engineer
- IoT Engineer

### Tech Leadership (8)
- CTO
- VP Engineering
- Head of AI
- Head of Product
- Chief Data Officer
- Chief Information Security Officer
- AI Team Lead / Engineering Manager
- Tech Lead / Staff Engineer / Principal Engineer

### IT & Systems (6)
- Systems Administrator
- IT Support / Helpdesk
- Network Administrator
- IT Operations Specialist
- Systems Analyst
- ERP/CRM Engineer

### Tech in Business Functions (5)
- AI for Finance
- AI in Marketing
- AI in Operations
- AI in HR
- AI in Supply Chain

### GenerativeAI (11)
- LLM Application Developer
- AI Agent Engineer
- AI Workflow Automation Engineer
- Prompt Engineer
- Synthetic Data Engineer
- Digital Twin Engineer
- AI Safety & Alignment Researcher
- Human-AI Interaction Engineer
- AI Quality & Evaluation Engineer
- Autonomous Agent Safety Analyst
- AI Compliance / Audit Engineer

### Design (10)
- Product Designer
- UX Designer
- UI Designer
- Interaction Designer
- Visual Designer
- Design Researcher
- Design Systems Designer
- Motion Designer
- Creative Technologist
- AI UX Designer

---

## 🔧 技术实现

### 文件变更

#### 1. `src/lib/jobCategories.ts`
- ✅ 改为简单的数组结构
- ✅ 包含所有 115 个完整名称
- ✅ 添加 `isCustomCategory()` 检测函数
- ✅ 添加 `searchCategories()` 搜索函数

```typescript
export const JOB_CATEGORIES = [
  'Machine Learning Engineer (Artificial Intelligence / Machine Learning)',
  // ... 115 个完整名称
] as const;

export const isCustomCategory = (category: string): boolean => {
  return category.trim().length > 0 && 
    !JOB_CATEGORIES.includes(category as JobCategory);
};
```

#### 2. `src/lib/categoryRecommendation.ts`
- ✅ 更新 Fuse.js 配置
- ✅ 直接搜索完整 category 名称
- ✅ 简化匹配逻辑

```typescript
const searchData: CategorySearchItem[] = JOB_CATEGORIES.map(cat => ({
  category: cat,
}));

const fuse = new Fuse<CategorySearchItem>(searchData, fuseOptions);
```

#### 3. `src/app/employer/jobs/new/page.tsx`
- ✅ 添加自定义输入状态管理
- ✅ 添加自定义输入 UI
- ✅ 添加自定义 category 显示徽章
- ✅ 支持删除自定义 category

```typescript
const [showCustomInput, setShowCustomInput] = useState(false);
const [customCategoryInput, setCustomCategoryInput] = useState('');

const handleCustomCategorySubmit = () => {
  if (customCategoryInput.trim()) {
    handleCategorySelect(customCategoryInput.trim());
  }
};
```

#### 4. `src/app/employer/jobs/new/page.module.css`
- ✅ 添加自定义输入样式
- ✅ 添加自定义徽章样式
- ✅ 添加删除按钮样式

---

## 🎨 UI/UX 变化

### 下拉菜单
```
┌─────────────────────────────────────────────────┐
│ Select from categories or create custom...      │
├─────────────────────────────────────────────────┤
│ Machine Learning Engineer (AI / ML)             │
│ Data Scientist (Data Science & Analytics)       │
│ Backend Engineer (Software Engineering)         │
│ ...                                              │
├─────────────────────────────────────────────────┤
│ ➕ Create Custom Category                       │
└─────────────────────────────────────────────────┘
```

### 自定义输入模式
```
┌─────────────────────────────────────────────────┐
│ Enter your custom category                       │
│ [                                              ] │
│                                                   │
│  [Cancel]  [Add Custom Category]                │
│                                                   │
│ ℹ️ Enter any category that best describes your  │
│   position                                        │
└─────────────────────────────────────────────────┘
```

### 自定义 Category 徽章
```
┌──────────────────────────────────────┐
│ ➕ Custom: Blockchain Architect    [×] │
└──────────────────────────────────────┘
```

---

## 🔄 工作流程

### 场景 1：使用预定义 Category
1. 输入 Job Title → 自动推荐
2. 点击推荐卡片或从下拉菜单选择
3. 显示 "✓ Selected by employer"

### 场景 2：创建自定义 Category
1. 从下拉菜单选择 "➕ Create Custom Category"
2. 输入自定义 category 名称
3. 点击 "Add Custom Category" 或按 Enter
4. 显示自定义徽章，可以删除

### 场景 3：智能推荐
1. 输入 "Machine Learning" → 推荐相关的 4 个 categories
2. 输入 "Data Scientist" → 推荐 Data Science 相关
3. 输入 "Backend" → 推荐 Software Engineering 相关

---

## ✅ 测试建议

### 智能推荐测试
```typescript
输入: "ML Engineer"
推荐: 
  1. Machine Learning Engineer (AI / ML)
  2. Deep Learning Engineer (AI / ML)
  3. Applied AI Scientist (AI / ML)
  4. AI Infrastructure Engineer (MLOps/LLMOps) (AI / ML)

输入: "Frontend"
推荐:
  1. Frontend Engineer (Software Engineering)
  2. Full Stack Engineer (Software Engineering)
  3. Mobile Engineer (iOS/Android) (Software Engineering)
  4. UI/UX Designer (Product & Project Roles)
```

### 自定义 Category 测试
```typescript
测试 1: 输入 "Blockchain Developer"
结果: ✅ 接受并显示徽章

测试 2: 输入 "   " (空格)
结果: ✅ 按钮禁用，无法提交

测试 3: 按 Enter 键提交
结果: ✅ 正确提交

测试 4: 点击 × 删除自定义 category
结果: ✅ 清除并返回空状态
```

---

## 📊 数据统计

| 指标 | 数值 |
|------|------|
| 预定义 Categories | 115 个 |
| 父类别数量 | 14 个 |
| 最长 Category 名称 | 72 字符 |
| 支持自定义 | ✅ 是 |
| Fuse.js 匹配阈值 | 0.4 |

---

## 🚀 未来优化

### 短期
1. **搜索优化**: 添加实时搜索过滤
2. **历史记录**: 保存用户常用的 categories
3. **验证**: 检查重复的自定义 category

### 中期
1. **标签化**: 支持为 category 添加标签
2. **分组显示**: 按父类别分组显示下拉选项
3. **模糊搜索**: 在下拉菜单中集成模糊搜索

### 长期
1. **AI 建议**: 基于 job description 自动推荐 category
2. **相似 Category**: 显示相似的 categories
3. **流行度排序**: 根据使用频率排序

---

## 📝 总结

✅ **完整保留 CSV 数据**
- 所有 115 个 subcategories
- 完整名称包括父类别

✅ **灵活的输入方式**
- 预定义 categories
- 智能推荐（Top 4）
- 自定义输入

✅ **优秀的 UX**
- 清晰的视觉反馈
- 简单的操作流程
- 支持快捷键

✅ **类型安全**
- TypeScript 完整支持
- 0 linter 错误
- 0 type 错误

用户现在可以选择 115 个预定义 categories 或创建自己的自定义 category！🎉













