# PAGE 3 - SCREENING & FILTERS 实现文档

## 🎯 功能概览

Page 3 - Screening & Filters 用于设置候选人筛选条件，包含工作授权、系统筛选问题和自定义问题。

---

## ✅ 功能需求实现

### FR-S1: 多国家工作权利模块 ⭐

#### 国家/地区多选

```
┌────────────────────────────────────────────────┐
│ Countries/Regions                               │
│                                                 │
│ [🇦🇺 Australia] [🇺🇸 United States] [🇸🇬 Singapore]│
│ [🇨🇳 Mainland China] [🇭🇰 HKSAR of China] [🌐 Remote]│
└────────────────────────────────────────────────┘
```

**特点**：
- ✅ 支持多国家/地区选择
- ✅ 国旗图标展示
- ✅ 复选框交互

---

#### 工作授权选项（按国家）

**🇦🇺 Australia (11 options)**
- I'm an Australian citizen
- I'm a permanent resident and/or NZ citizen
- I have a family/partner visa with no restrictions
- ... (11 total options)

**🇺🇸 United States (19 options)**
- I am a U.S. citizen
- I am a U.S. lawful permanent resident (Green Card holder)
- I hold an H-1B visa
- ... (19 total options)

**🇸🇬 Singapore (16 options)**
- I am a Singapore Citizen
- I am a Singapore Permanent Resident (PR)
- I hold an Employment Pass (EP)
- ... (16 total options)

**🇨🇳 Mainland China (12 options - 中文)**
- 我是中国大陆公民，可在中国大陆不受限制工作
- 我是中国（内地）签发的永久居留身份证持有人
- ... (12 total options)

**🇭🇰 HKSAR of China (15 options)**
- I am a Hong Kong Permanent Resident (HKPR)
- I hold a Hong Kong employment visa (GEP)
- ... (15 total options)

**🌐 Remote (2 options)**
- I can work remotely from any location
- I require specific work authorization for remote work

---

### FR-S2: 系统筛选问题 ⭐

#### 4个预定义问题

1. **Programming Languages** (Multiple choice)
   - Python, JavaScript, TypeScript, Java, C++, C#, Go, Rust, Ruby, PHP, Swift, Kotlin, Scala, R, MATLAB, SQL, Other

2. **English Proficiency** (Single choice)
   - Native or bilingual proficiency
   - Full professional proficiency
   - Professional working proficiency
   - Limited working proficiency
   - Elementary proficiency
   - No proficiency

3. **Engineering Qualification** (Single choice)
   - PhD in Computer Science or related field
   - Master's degree in Computer Science or related field
   - Bachelor's degree in Computer Science or related field
   - Bachelor's degree in other field
   - Some college coursework
   - High school diploma or equivalent
   - Self-taught / Bootcamp graduate

4. **Machine Learning Experience** (Single choice)
   - 5+ years of hands-on ML experience
   - 3-5 years of hands-on ML experience
   - 1-3 years of hands-on ML experience
   - Less than 1 year of hands-on ML experience
   - Academic ML projects only
   - No ML experience

---

#### 需求级别 (Answer Requirement)

每个问题支持3种需求级别：

```
[⭐ Must Have]  [✓ Preferred]  [○ Accept Any]
```

- **Must Have**: 必须满足，不满足则自动淘汰
- **Preferred**: 优先考虑，满足者优先展示
- **Accept Any**: 接受任何答案，仅用于信息收集

---

### FR-S3: 自定义筛选问题构建器 ⭐

#### 问题字段

```typescript
interface CustomScreeningQuestion {
  id: string;
  questionText: string;                   // 问题文本 *
  answerType: CustomQuestionType;         // 答案类型 *
  options?: string[];                     // 选项（单选/多选时）
  mustAnswer: boolean;                    // 是否必答
  idealAnswer?: string | string[];        // 理想答案
  disqualifyIfNotIdeal: boolean;          // 不匹配时淘汰
}
```

---

#### 答案类型 (Answer Type)

1. **Short Text Answer**
   - 候选人输入简短文本
   - 示例："Describe your experience with AWS"

2. **Yes/No**
   - 简单的是/否选择
   - 示例："Do you have a driver's license?"

3. **Single Choice**
   - 单选题，需提供选项
   - 示例："Preferred work location: [Office/Hybrid/Remote]"

4. **Multiple Choice**
   - 多选题，需提供选项
   - 示例："Which cloud platforms have you used? [AWS/Azure/GCP/Other]"

---

#### 自定义问题示例

```
┌────────────────────────────────────────────────┐
│ Question: Do you have experience with cloud    │
│ infrastructure (AWS/Azure/GCP)?                │
│                                                 │
│ Answer Type: Yes/No                            │
│ [✓] Required Question                          │
│ Ideal Answer: Yes                              │
│ [✓] Automatically disqualify if not ideal      │
└────────────────────────────────────────────────┘
```

---

## 🎨 UI/UX 设计

### 整体布局

```
┌──────────────────────────────────────────────┐
│ 【Screening & Filters】                      │
│                                               │
│ ┌──────────────────────────────────────────┐│
│ │ Work Authorization Requirements         ││
│ │ (FR-S1)                                  ││
│ │                                          ││
│ │ Countries/Regions: [多选网格]           ││
│ │                                          ││
│ │ 🇦🇺 Australia - Work Authorization      ││
│ │ ○ Option 1                               ││
│ │ ○ Option 2                               ││
│ │ ...                                      ││
│ └──────────────────────────────────────────┘│
│                                               │
│ ┌──────────────────────────────────────────┐│
│ │ System Screening Questions (FR-S2)       ││
│ │                                          ││
│ │ Programming Languages                    ││
│ │ [⭐ Must Have] [✓ Preferred] [○ Accept Any]││
│ │ ☑ Python  ☑ Java  ☐ C++                ││
│ │                                          ││
│ │ English Proficiency                      ││
│ │ ...                                      ││
│ └──────────────────────────────────────────┘│
│                                               │
│ ┌──────────────────────────────────────────┐│
│ │ Custom Screening Questions (FR-S3)       ││
│ │                                          ││
│ │ [Existing question cards]                ││
│ │ [+ Add Custom Question]                  ││
│ └──────────────────────────────────────────┘│
│                                               │
│ [Back]                        [Continue] →  │
└──────────────────────────────────────────────┘
```

---

## 💻 技术实现

### 数据结构

```typescript
interface JobFormData {
  // ... other fields ...
  
  // Step 3: Screening
  selectedCountries: string[];              // 选中的国家/地区
  workAuthByCountry: Record<string, string>; // 国家 -> 工作授权选项
  systemScreeningAnswers: SystemScreeningAnswer[];
  customScreeningQuestions: CustomScreeningQuestion[];
  applicationDeadline: string;
}

interface SystemScreeningAnswer {
  questionId: string;
  requirement: 'must-have' | 'preferred' | 'accept-any';
  selectedAnswers: string[];
}
```

---

### 核心处理函数

#### 1. 国家选择切换
```typescript
const handleCountryToggle = (country: string) => {
  setFormData(prev => {
    const newSelectedCountries = prev.selectedCountries.includes(country)
      ? prev.selectedCountries.filter(c => c !== country)
      : [...prev.selectedCountries, country];
    
    // 如果取消选择，删除该国家的工作授权
    const newWorkAuthByCountry = { ...prev.workAuthByCountry };
    if (!newSelectedCountries.includes(country)) {
      delete newWorkAuthByCountry[country];
    }
    
    return {
      ...prev,
      selectedCountries: newSelectedCountries,
      workAuthByCountry: newWorkAuthByCountry,
    };
  });
};
```

#### 2. 工作授权选择
```typescript
const handleWorkAuthSelect = (country: string, authOption: string) => {
  setFormData(prev => ({
    ...prev,
    workAuthByCountry: {
      ...prev.workAuthByCountry,
      [country]: authOption,
    },
  }));
};
```

#### 3. 系统筛选问题
```typescript
const handleSystemScreeningChange = (
  questionId: string,
  requirement: AnswerRequirement,
  answers: string[]
) => {
  setFormData(prev => {
    const existingIndex = prev.systemScreeningAnswers.findIndex(
      a => a.questionId === questionId
    );
    const newAnswers = [...prev.systemScreeningAnswers];
    
    if (existingIndex >= 0) {
      newAnswers[existingIndex] = { questionId, requirement, selectedAnswers: answers };
    } else {
      newAnswers.push({ questionId, requirement, selectedAnswers: answers });
    }
    
    return { ...prev, systemScreeningAnswers: newAnswers };
  });
};
```

#### 4. 自定义问题管理
```typescript
const handleAddCustomQuestion = (question: CustomScreeningQuestion) => {
  setFormData(prev => ({
    ...prev,
    customScreeningQuestions: [
      ...prev.customScreeningQuestions,
      { ...question, id: Date.now().toString() }
    ],
  }));
};

const handleEditCustomQuestion = (question: CustomScreeningQuestion) => {
  setEditingCustomQuestion(question);
  setShowCustomQuestionBuilder(true);
};

const handleDeleteCustomQuestion = (questionId: string) => {
  setFormData(prev => ({
    ...prev,
    customScreeningQuestions: prev.customScreeningQuestions.filter(
      q => q.id !== questionId
    ),
  }));
};
```

---

## 🎯 完整交互流程

### 场景 1: 设置多国家工作授权

```
步骤 1: 选择国家/地区
  ☑ 🇦🇺 Australia
  ☑ 🇺🇸 United States
  ☐ 🇸🇬 Singapore
  
步骤 2: 为Australia选择工作授权
  ○ I'm an Australian citizen
  ● I'm a permanent resident and/or NZ citizen ← 选中
  ○ I have a family/partner visa
  
步骤 3: 为United States选择工作授权
  ○ I am a U.S. citizen
  ● I hold an H-1B visa ← 选中
  ○ I require H-1B sponsorship
  
✅ 完成工作授权设置
```

---

### 场景 2: 配置系统筛选问题

```
Programming Languages:
  需求级别: [⭐ Must Have] ← 选择
  答案: ☑ Python  ☑ JavaScript  ☑ TypeScript
  
English Proficiency:
  需求级别: [✓ Preferred] ← 选择
  答案: ● Full professional proficiency ← 选择
  
Engineering Qualification:
  需求级别: [○ Accept Any] ← 选择
  答案: (不需要选择具体答案)
  
ML Experience:
  需求级别: [⭐ Must Have] ← 选择
  答案: ● 3-5 years of hands-on ML experience ← 选择
  
✅ 系统筛选问题配置完成
```

---

### 场景 3: 添加自定义问题

```
步骤 1: 点击 [+ Add Custom Question]

步骤 2: 填写问题信息
  Question Text: "Do you have experience with Kubernetes?"
  Answer Type: [Yes/No] ← 选择
  [✓] Required Question
  Ideal Answer: "Yes"
  [✓] Automatically disqualify if not ideal
  
步骤 3: 点击 [Add Question]

步骤 4: 问题卡片显示
┌────────────────────────────────────────┐
│ Do you have experience with Kubernetes?│
│ Type: yes-no | Required | Has Ideal    │
│ Answer | Auto-Disqualify               │
│                         [Edit] [Delete]│
└────────────────────────────────────────┘

✅ 自定义问题添加完成
```

---

## 📊 数据示例

### 完整的 Step 3 数据

```typescript
{
  // 工作授权
  selectedCountries: ["Australia", "United States"],
  workAuthByCountry: {
    "Australia": "I'm a permanent resident and/or NZ citizen",
    "United States": "I hold an H-1B visa and am authorized to work for my current employer"
  },
  
  // 系统筛选
  systemScreeningAnswers: [
    {
      questionId: "programming_languages",
      requirement: "must-have",
      selectedAnswers: ["Python", "JavaScript", "TypeScript"]
    },
    {
      questionId: "english_proficiency",
      requirement: "preferred",
      selectedAnswers: ["Full professional proficiency"]
    },
    {
      questionId: "ml_experience",
      requirement: "must-have",
      selectedAnswers: ["3-5 years of hands-on ML experience"]
    }
  ],
  
  // 自定义问题
  customScreeningQuestions: [
    {
      id: "1702345678901",
      questionText: "Do you have experience with Kubernetes?",
      answerType: "yes-no",
      mustAnswer: true,
      idealAnswer: "Yes",
      disqualifyIfNotIdeal: true
    },
    {
      id: "1702345678902",
      questionText: "Which cloud platforms have you used?",
      answerType: "multiple",
      options: ["AWS", "Azure", "GCP", "Other"],
      mustAnswer: false,
      idealAnswer: ["AWS", "GCP"],
      disqualifyIfNotIdeal: false
    }
  ],
  
  applicationDeadline: "2024-12-31"
}
```

---

## 🎊 总结

### ✅ 已实现的功能

1. ✅ **FR-S1**: 多国家工作权利模块
   - 6个国家/地区支持
   - 73个工作授权选项（总计）
   - 多国家选择
   - 单国家内单选工作授权

2. ✅ **FR-S2**: 系统筛选问题
   - 4个预定义问题
   - 3种需求级别
   - 单选/多选支持

3. ✅ **FR-S3**: 自定义问题构建器
   - 4种答案类型
   - 必答设置
   - 理想答案
   - 自动淘汰逻辑

### 📈 技术特点

- ✅ TypeScript 类型安全
- ✅ 独立组件化（CustomQuestionBuilder）
- ✅ 完整的状态管理
- ✅ 响应式设计
- ✅ 0错误编译

### 🎨 UI/UX 亮点

- 🎯 国旗视觉识别
- 💡 清晰的需求级别切换
- ✨ 动态问题卡片
- 🔒 完整的表单验证
- 📱 移动端友好

**Page 3 - Screening & Filters 完整实现完成！** 🎉



