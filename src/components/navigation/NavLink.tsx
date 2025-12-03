'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactNode, MouseEvent } from 'react';

interface NavLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

export function NavLink({ href, children, className, onClick }: NavLinkProps) {
  const router = useRouter();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // 如果有自定义的 onClick，先执行它
    if (onClick) {
      onClick(e);
    }

    // 如果事件没有被阻止，添加页面切换效果
    if (!e.defaultPrevented) {
      e.preventDefault();
      
      // 添加一个短暂的延迟以显示过渡动画
      document.documentElement.classList.add('transitioning');
      
      setTimeout(() => {
        router.push(href);
        
        // 移除过渡类
        setTimeout(() => {
          document.documentElement.classList.remove('transitioning');
        }, 300);
      }, 50);
    }
  };

  return (
    <Link 
      href={href} 
      className={className}
      onClick={handleClick}
      prefetch={true}
    >
      {children}
    </Link>
  );
}

