import { useEffect, useState } from 'react';

export function usePageAnimation() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 滚动到页面顶部
    window.scrollTo(0, 0);
    // 确保页面可以正常滚动以显示所有内容
    document.body.style.overflow = 'auto';
    // 触发页面进入动画
    setMounted(true);
    return () => {
      // 组件卸载时恢复默认
      document.body.style.overflow = 'unset';
    };
  }, []);

  return mounted;
}

