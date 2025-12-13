# 如何在新页面中使用页面过渡效果

## 快速开始

在任何新的页面组件中，只需用 `<PageTransition>` 包裹您的内容即可：

```tsx
'use client';

import { PageTransition } from '@/components/PageTransition';

export default function YourPage() {
  return (
    <PageTransition>
      <main>
        {/* 您的页面内容 */}
      </main>
    </PageTransition>
  );
}
```

## 完整示例

### 基础页面示例

```tsx
'use client';

import { PageTransition } from '@/components/PageTransition';
import Header from '@/components/Header';
import styles from './page.module.css';

export default function ExamplePage() {
  return (
    <PageTransition>
      <main className={styles.main}>
        <Header />
        <section className={styles.content}>
          <h1>欢迎来到新页面</h1>
          <p>这个页面会有丝滑的切换效果！</p>
        </section>
      </main>
    </PageTransition>
  );
}
```

### 带侧边栏的页面示例

```tsx
'use client';

import { PageTransition } from '@/components/PageTransition';
import Header from '@/components/Header';
import { SidebarLayout } from '@/components/navigation/SidebarLayout';
import styles from './page.module.css';

export default function DashboardPage() {
  return (
    <PageTransition>
      <main className={styles.main}>
        <Header />
        <SidebarLayout>
          <div className={styles.content}>
            <h1>仪表板</h1>
            {/* 您的内容 */}
          </div>
        </SidebarLayout>
      </main>
    </PageTransition>
  );
}
```

### 带表单的页面示例

```tsx
'use client';

import { PageTransition } from '@/components/PageTransition';
import AuthLayout from '@/components/auth/AuthLayout';
import { usePageAnimation } from '@/hooks/usePageAnimation';
import styles from './page.module.css';

export default function FormPage() {
  const mounted = usePageAnimation();

  return (
    <PageTransition>
      <AuthLayout mounted={mounted}>
        <form className={styles.form}>
          {/* 表单字段 */}
        </form>
      </AuthLayout>
    </PageTransition>
  );
}
```

## 重要提示

### 1. 必须使用 'use client'
由于 `PageTransition` 使用了 Framer Motion 和 React hooks，页面必须是客户端组件：

```tsx
'use client';  // 必须添加这一行！
```

### 2. 只包裹顶层内容
`PageTransition` 应该包裹页面的最外层内容，通常是 `<main>` 标签：

```tsx
// ✅ 正确
<PageTransition>
  <main>
    <Content />
  </main>
</PageTransition>

// ❌ 错误 - 不要嵌套多个 PageTransition
<PageTransition>
  <PageTransition>
    <Content />
  </PageTransition>
</PageTransition>
```

### 3. 与路由配合使用
Next.js 的 App Router 会自动处理路由切换，`PageTransition` 会检测路径变化并触发动画。

### 4. 自动滚动到顶部
`PageTransition` 会自动将页面滚动到顶部，您无需手动处理。

## 自定义过渡效果

如果您需要为特定页面自定义过渡效果，可以创建自己的过渡组件：

```tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

interface CustomTransitionProps {
  children: ReactNode;
}

export function CustomTransition({ children }: CustomTransitionProps) {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          transition: {
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1],
          }
        }}
        exit={{ 
          opacity: 0, 
          scale: 1.05,
          transition: {
            duration: 0.2,
            ease: [0.22, 1, 0.36, 1],
          }
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

## 可用的过渡动画类型

### 1. 淡入淡出（默认）
```tsx
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}
```

### 2. 从下方滑入（当前使用）
```tsx
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -10 }}
```

### 3. 从侧面滑入
```tsx
initial={{ opacity: 0, x: 50 }}
animate={{ opacity: 1, x: 0 }}
exit={{ opacity: 0, x: -50 }}
```

### 4. 缩放效果
```tsx
initial={{ opacity: 0, scale: 0.9 }}
animate={{ opacity: 1, scale: 1 }}
exit={{ opacity: 0, scale: 1.1 }}
```

## 性能优化建议

1. **使用 CSS transforms**：使用 `x`, `y`, `scale`, `rotate` 等属性而非 `left`, `top`
2. **避免动画 layout**：避免动画影响布局的属性如 `width`, `height`
3. **保持过渡简短**：过渡时间应在 200-500ms 之间
4. **使用硬件加速**：Framer Motion 自动使用 GPU 加速

## 故障排除

### 问题：过渡效果不显示
- 确保页面顶部有 `'use client'`
- 检查是否正确导入了 `PageTransition`
- 确认 `framer-motion` 已安装

### 问题：页面闪烁
- 确保使用了 `initial={false}`
- 检查是否有多个 `PageTransition` 嵌套

### 问题：滚动位置不正确
- `PageTransition` 已经处理了滚动，不要添加额外的滚动逻辑

## 更多资源

- [Framer Motion 文档](https://www.framer.com/motion/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [React Hooks](https://react.dev/reference/react)




























