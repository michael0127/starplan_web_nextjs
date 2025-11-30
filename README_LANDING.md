# StarPlan C端 Landing Page

这是StarPlan C端（候选人端）的landing page，使用Next.js框架构建。

## 页面结构

### 主页面 (Home)
- **路径**: `/`
- **包含部分**:
  - Banner区域 - "Create Your Free Profile"按钮
  - How it Works - 4个步骤说明
  - Find a Job - StarPlan匹配功能展示
  - Why Choose - 为什么选择StarPlan
  - Get StarPlan Today - 行动号召区域

### 登录页面
- **路径**: `/login`
- 包含登录表单

### 注册页面
- **路径**: `/register`
- 包含注册表单，标题为"Create Your Free Profile"

## 组件结构

### 核心组件
- `Header.tsx` - 导航栏组件
- `Footer.tsx` - 页脚组件
- `Banner.tsx` - Banner区域组件
- `HowItWorks.tsx` - "How it Works"部分组件
- `FindAJob.tsx` - "Find a Job"部分组件
- `WhyChoose.tsx` - "Why Choose"部分组件
- `GetStarPlan.tsx` - "Get StarPlan Today"部分组件

## 导航菜单

Header导航包含以下链接：
- Home - 首页
- How it Works - 跳转到#how锚点
- Find a Job - 跳转到#starPlan锚点
- Why Choose - 跳转到#why锚点
- Login - 登录页面
- Register - 注册页面

## 样式

所有组件使用CSS Modules进行样式管理，样式文件位于各组件同目录下，文件名为`[ComponentName].module.css`。

## 图片资源

所有图片资源位于`/public/img/`目录下，包括：
- `pc-candidate.png` - Banner背景图
- `pc-howWork1-4x.png`, `pc-howWork2.png`, `pc-howWork4.png` - How it Works步骤图片
- `pc-starPlan.png` - Find a Job背景图
- `pc-WhyChoose.png` - Why Choose背景图
- `pc-left-phone4x.png`, `pc-right-phone4x.png` - Get StarPlan部分手机图片
- `logo.png` - Logo图片
- `j.png`, `jj.png` - 交互图标

## 运行项目

```bash
npm install
npm run dev
```

访问 http://localhost:3000 查看landing page。

## 功能特性

1. **响应式设计** - 支持桌面端和移动端
2. **交互式How it Works** - 点击步骤可切换显示对应图片
3. **平滑滚动** - Header在滚动时改变背景色
4. **现代化UI** - 使用圆角、阴影等现代设计元素

