# Onboarding Page - 用户引导页

## 📍 页面路径
`/onboarding`

## 🎯 功能概述

这是用户注册后的引导页面，帮助新用户：
1. 填写职位偏好信息（Job Function, Job Type, Location等）
2. 上传简历（Resume/CV）
3. 完成后自动跳转到 `/explore` 页面

## 🎨 设计特点

### 色彩方案（StarPlan 品牌色）
- **主色调**: `#4A5BF4` (品牌蓝)
- **背景渐变**: `linear-gradient(180deg, #ffffff 0%, rgba(74, 91, 244, 0.05) 100%)`
- **按钮颜色**: `#000000` (黑色主按钮)
- **辅助色**: 
  - 边框: `#e5e7eb`
  - 背景: `#f9fafb`
  - 文字: `#666666`

### 布局特点
- ✅ 紧凑型设计（单卡片布局）
- ✅ 两步引导流程
- ✅ 进度指示器（页面底部圆点）
- ✅ 响应式设计（移动端适配）

## 📝 页面结构

### Step 1: 职位偏好
```
- Job Function (必填) - 下拉/输入框
- Job Type - 多选框 (Full-time, Contract, Part-time, Internship)
- Location - 按钮选择 + Remote选项
- Work Authorization - H1B赞助复选框
```

### Step 2: 简历上传
```
- 隐私声明提示框
- 文件上传区域
  - 支持格式: PDF, Word (.doc, .docx)
  - 最大文件大小: 10MB
  - 拖拽或点击上传
```

### Step 3: 处理中状态
```
- 显示处理动画
- 进度条
- 提示文字: "Identifying your job preferences..."
- 功能亮点展示卡片
- 3秒后自动跳转到 /explore
```

## 🔧 技术实现

### 关键组件
- **客户端组件**: `'use client'` - 需要交互和状态管理
- **状态管理**: 使用 `useState` 管理表单数据和上传状态
- **路由导航**: 使用 `next/navigation` 的 `useRouter`

### 表单数据结构
```typescript
interface OnboardingData {
  jobFunction: string;
  jobTypes: string[];
  location: string;
  remoteOpen: boolean;
  h1bSponsorship: boolean;
}
```

### 文件验证
- 文件类型检查 (PDF, DOC, DOCX)
- 文件大小限制 (10MB)
- 实时错误提示

## 🎬 用户流程

```
注册完成 → /onboarding → Step 1 (填写偏好) → Step 2 (上传简历) 
→ 处理中动画 (3秒) → /explore (探索职位)
```

## 🚀 使用方式

### 1. 集成到注册流程
在用户成功注册后，重定向到此页面：

```typescript
// 在注册成功后
router.push('/onboarding');
```

### 2. 跳过引导（可选）
如果用户已经完成引导，可以添加检查逻辑：

```typescript
// 在 layout 或中间件中检查
if (user.hasCompletedOnboarding) {
  router.push('/explore');
}
```

## 📊 数据流

### 前端 → 后端
需要创建API端点来保存用户偏好和简历：

```typescript
// POST /api/user/onboarding
{
  jobFunction: string;
  jobTypes: string[];
  location: string;
  remoteOpen: boolean;
  h1bSponsorship: boolean;
  resumeFile: File;
}
```

### 数据库模型更新建议
可能需要扩展 User 模型：

```prisma
model User {
  // ... 现有字段
  jobFunction        String?
  jobTypes           String[]
  preferredLocation  String?
  remoteOpen         Boolean   @default(false)
  h1bSponsorship     Boolean   @default(false)
  hasCompletedOnboarding Boolean @default(false)
}
```

## 🎨 UI组件清单

### 顶部栏
- **Logo**: StarPlan Logo (使用 `/img/logo.png`)
- **Logout按钮**: 带图标的圆角按钮

### 主卡片
- **标题区**: 大标题 + 副标题
- **表单区**: 各种输入控件
- **底部栏**: 进度点 + 操作按钮

### 上传区
- **隐私提示**: 浅蓝背景的信息框
- **拖拽上传**: 虚线边框的上传区域
- **文件图标**: 自定义SVG图标

### 处理状态
- **动画图标**: 简历文档图标
- **进度条**: 自动填充动画
- **特性展示**: 带徽章的特性卡片

## 🎯 可访问性

- ✅ 语义化HTML结构
- ✅ 键盘导航支持
- ✅ ARIA标签（可继续完善）
- ✅ 表单验证和错误提示
- ✅ 高对比度文字

## 📱 响应式断点

```css
@media (max-width: 768px) {
  - 减少内边距
  - 垂直排列元素
  - 全宽按钮
  - 简化布局
}
```

## 🔄 动画效果

### 进度条动画
```css
@keyframes progress {
  0% { width: 0%; }
  50% { width: 70%; }
  100% { width: 100%; }
}
```

### 按钮悬停
- 轻微上移 (`translateY(-1px)`)
- 添加阴影效果
- 平滑过渡 (0.2s)

## 🛠️ 待优化项

1. **API集成**: 
   - 创建 `/api/user/onboarding` 端点
   - 实现简历文件上传到云存储（如Supabase Storage）
   - 保存用户偏好到数据库

2. **职位函数下拉**:
   - 添加预定义的职位函数列表
   - 实现自动完成功能
   - 添加搜索/筛选功能

3. **表单验证增强**:
   - 添加更详细的错误提示
   - 实时验证
   - 必填字段高亮

4. **用户体验**:
   - 添加"跳过"按钮选项
   - 保存草稿功能
   - 返回上一步功能

5. **数据分析**:
   - 追踪完成率
   - 分析用户偏好分布
   - 优化转化漏斗

## 📸 视觉参考

设计灵感来自提供的截图，主要特点：
- ✅ 清晰的StarPlan品牌标识
- ✅ Daisy AI助手的友好问候
- ✅ 简洁的问答式引导
- ✅ 友好的图标和插图
- ✅ 明确的进度指示
- ✅ 专业的隐私声明

## 🌟 最佳实践

1. **数据安全**: 简历数据需加密存储和传输
2. **性能优化**: 大文件上传使用分块上传
3. **错误处理**: 优雅的错误提示和恢复机制
4. **用户引导**: 清晰的说明和提示文字
5. **品牌一致性**: 保持StarPlan的视觉风格

## 🔗 相关文件

- 页面组件: `src/app/onboarding/page.tsx`
- 样式文件: `src/app/onboarding/page.module.css`
- Prisma Schema: `prisma/schema.prisma`
- 用户API: `src/app/api/user/[id]/route.ts`

## ✅ 完成状态

- [x] 页面布局和UI设计
- [x] 两步引导流程
- [x] 文件上传功能
- [x] 表单验证
- [x] 响应式设计
- [x] 处理状态动画
- [x] StarPlan色调应用
- [ ] API集成（待实现）
- [ ] 数据库保存（待实现）
- [ ] 云存储上传（待实现）

---

**创建时间**: 2025-12-06
**页面状态**: ✅ 前端完成，待后端集成


