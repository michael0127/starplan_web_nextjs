# Profile Edit Panel Implementation

## 概述 (Overview)

实现了个人资料编辑面板功能。当用户点击各个section的编辑按钮时，会从右侧滑入一个编辑面板，允许用户编辑个人信息。

## 实现的功能 (Features Implemented)

### 1. 编辑面板组件 (EditPanel Component)

创建了新的编辑面板组件：
- **文件位置**: `src/components/profile/EditPanel.tsx`
- **样式文件**: `src/components/profile/EditPanel.module.css`

#### 主要特性：
- ✅ 从右侧滑入/滑出动画
- ✅ 背景遮罩层（点击关闭）
- ✅ Personal 信息编辑表单
- ✅ Education 多条目编辑（可添加/删除）
- ✅ Work Experience 多条目编辑（可添加/删除）
- ✅ Skills 标签式管理界面
- ✅ 表单验证（必填字段标记为红色*）
- ✅ 实时保存到数据库
- ✅ 保存后自动刷新数据
- ✅ 日期选择器（年-月格式）
- ✅ "当前在读/在职"复选框功能

#### 所有表单字段：

**Personal Section:**
- First Name *, Last Name *
- Email *, Phone *
- City, Postal Code, County, Address Line
- LinkedIn URL *, Github URL, Portfolio URL

**Education Section (可多条):**
- School Name *（下拉选择）
- Major *（下拉选择）
- Degree Type *（下拉选择）
- GPA（可选）
- Start Date, End Date（年月选择）
- I currently study here（复选框）

**Work Experience Section (可多条):**
- Job Title *（下拉选择）
- Company *（下拉选择，带提示）
- Job Type *（Full-time/Part-time/Internship/Contract）
- Location（下拉选择）
- Start Date, End Date（年月选择）
- I currently work here（复选框）
- Experience Summary（文本域）

**Skills Section:**
- 技能标签列表（可添加/删除）
- 输入框添加新技能（支持Enter键）

### 2. Profile页面更新

更新了 `src/app/profile/page.tsx`：

#### 新增状态：
```typescript
const [editPanelOpen, setEditPanelOpen] = useState(false);
const [editSection, setEditSection] = useState<TabType>('personal');
```

#### 新增函数：
- `handleOpenEdit(section)` - 打开编辑面板
- `handleCloseEdit()` - 关闭编辑面板
- `handleSaveEdit(data)` - 保存编辑的数据

#### 更新所有编辑按钮：
为每个section的编辑按钮添加了点击事件处理：
- Personal → `onClick={() => handleOpenEdit('personal')}`
- Education → `onClick={() => handleOpenEdit('education')}`
- Work Experience → `onClick={() => handleOpenEdit('work')}`
- Skills → `onClick={() => handleOpenEdit('skills')}`
- Equal Employment → `onClick={() => handleOpenEdit('employment')}`

### 3. useUser Hook 增强

更新了 `src/hooks/useUser.ts`：

#### 新增功能：
- `refreshUser()` 函数 - 允许手动刷新用户数据
- 返回值现在包含: `{ user, loading, error, refreshUser }`

这使得在保存编辑后可以立即刷新显示的数据。

## 工作流程 (Workflow)

1. 用户点击任意section的编辑按钮
2. 编辑面板从右侧滑入
3. 表单自动填充当前数据
4. 用户修改信息
5. 点击"UPDATE"按钮保存
6. 数据通过API保存到数据库
7. 自动刷新用户数据
8. 面板关闭，显示更新后的信息

## 样式设计 (Design)

### 面板样式：
- 宽度: 600px
- 位置: 固定在右侧
- 动画: 平滑的滑入/滑出效果
- 阴影: 柔和的左侧阴影

### 表单样式：
- 输入框: 圆角8px，聚焦时蓝色边框
- 按钮: UPDATE按钮使用品牌绿色 (#00D9A3)
- 必填标记: 红色星号
- 响应式: 在小屏幕上面板占满全宽

### 动画效果：
- 面板滑入: `cubic-bezier(0.4, 0, 0.2, 1)` 0.3s
- 背景遮罩淡入: 0.3s
- 按钮悬停: 0.2s

## API集成 (API Integration)

### 保存个人信息：
```typescript
PATCH /api/user/${userId}
Body: {
  profile: {
    cv_data: {
      personal: { ... }
    }
  }
}
```

## 已完成所有板块 (All Sections Completed)

所有主要sections的编辑功能已完全实现：

### 1. ✅ Education（教育经历）
- 支持多个教育经历（可添加/删除）
- 字段包括：
  - School Name（下拉选择）
  - Major（专业，下拉选择）
  - Degree Type（学位类型，下拉选择）
  - GPA（可选）
  - Start Date / End Date（年月选择器）
  - "I currently study here"复选框

### 2. ✅ Work Experience（工作经历）
- 支持多个工作经历（可添加/删除）
- 字段包括：
  - Job Title（职位，下拉选择）
  - Company（公司，下拉选择，带提示）
  - Job Type（工作类型：Full-time/Part-time/Internship/Contract）
  - Location（地点，下拉选择）
  - Start Date / End Date（年月选择器）
  - "I currently work here"复选框
  - Experience Summary（经历描述，文本域）

### 3. ✅ Skills（技能）
- 技能标签管理界面
- 动态添加/删除技能
- 技能以标签形式显示（带删除按钮）
- 输入框支持Enter键快速添加
- 自动分类为technical_skills和soft_skills

### 4. ⏳ Equal Employment（待实现）
- 此板块主要用于就业偏好设置
- 数据存储在user表的独立字段中（非profile JSON）
- 需要单独实现

## 文件清单 (Files Modified/Created)

### 新建文件：
- ✅ `src/components/profile/EditPanel.tsx`
- ✅ `src/components/profile/EditPanel.module.css`
- ✅ `PROFILE_EDIT_PANEL.md` (本文档)

### 修改文件：
- ✅ `src/app/profile/page.tsx`
- ✅ `src/hooks/useUser.ts`

## 使用说明 (Usage)

### 开发者：
1. 确保开发服务器运行: `npm run dev`
2. 访问 `/profile` 页面
3. 点击任意编辑按钮测试功能

### 用户：
1. 登录后访问 Profile 页面
2. 点击Personal section的编辑按钮
3. 修改个人信息
4. 点击UPDATE保存
5. 或点击Cancel/背景遮罩取消

## 功能特点 (Features)

### Education 表单特点：
- 📚 多条教育经历支持
- 🗑️ 每条记录右上角有删除按钮
- ➕ 底部"+ Add Education"按钮添加新记录
- 📅 日期选择器生成过去20年的年月选项
- ✅ "I currently study here"自动禁用结束日期

### Work Experience 表单特点：
- 💼 多条工作经历支持
- 🗑️ 每条记录右上角有删除按钮
- ➕ 底部"+ Add Work Experience"按钮
- 💡 公司选择带智能提示
- 📝 经历描述支持多行文本
- ✅ "I currently work here"自动禁用结束日期

### Skills 表单特点：
- 🏷️ 标签式界面，直观易用
- ➕ 输入框添加新技能
- ⌨️ 支持Enter键快速添加
- ❌ 每个标签有删除按钮
- 🎨 美观的渐变色标签

## 注意事项 (Notes)

1. **必填字段**: 
   - Personal: First Name, Last Name, Email, Phone, LinkedIn URL
   - Education: School Name, Major, Degree Type
   - Work: Job Title, Company, Job Type
   - Skills: 无必填要求

2. **数据验证**: 
   - 使用HTML5原生验证（type="email", type="url"等）
   - Select下拉必须选择有效选项

3. **错误处理**: 保存失败时显示错误消息

4. **加载状态**: 保存时按钮显示"Saving..."

5. **下拉选项**: 
   - 城市: ROWVILLE, Melbourne, Sydney, Brisbane
   - 学校: University of Melbourne, Caulfield Grammar School等
   - 专业: Data Science, VCE, Computer Science等
   - 学位: B.Sc., M.Sc., Ph.D., VCE等
   - 职位: Innovation Marketing Intern, Software Engineer等
   - 公司: Baozun E-Commerce, Google, Microsoft等

6. **日期格式**: YYYY-MM（例如：2024-01）

## 技术栈 (Tech Stack)

- React 18+ (Client Component)
- Next.js 14+ (App Router)
- TypeScript
- CSS Modules
- Prisma (数据库ORM)

## 截图参考 (Screenshot Reference)

面板样式参考了提供的设计截图：
- 右侧滑入面板
- 两列表单布局
- 绿色UPDATE按钮
- 清晰的字段标签
- 必填字段星号标记

