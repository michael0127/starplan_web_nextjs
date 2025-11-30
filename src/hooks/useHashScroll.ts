import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { smoothScrollTo } from '@/utils/smoothScroll';

/**
 * 处理页面加载时的hash滚动
 */
export function useHashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    // 只在首页处理hash
    if (pathname !== '/') return;

    const handleHashScroll = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        // 延迟执行，确保DOM已渲染和动画完成
        const timer = setTimeout(() => {
          smoothScrollTo(hash);
        }, 500);
        return () => clearTimeout(timer);
      }
    };

    // 页面加载完成后处理hash
    if (document.readyState === 'complete') {
      handleHashScroll();
    } else {
      window.addEventListener('load', handleHashScroll);
      return () => window.removeEventListener('load', handleHashScroll);
    }
  }, [pathname]);
}

