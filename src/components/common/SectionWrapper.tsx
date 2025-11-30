'use client';

import { ReactNode } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import styles from './SectionWrapper.module.css';

interface SectionWrapperProps {
  children: ReactNode;
  className?: string;
  animationType?: 'fadeUp' | 'fadeIn' | 'slideLeft' | 'slideRight';
  delay?: number;
}

export default function SectionWrapper({
  children,
  className = '',
  animationType = 'fadeUp',
  delay = 0,
}: SectionWrapperProps) {
  // 考虑navbar高度(72px)，让section在navbar下方开始显示时触发动画
  const { ref, isVisible } = useScrollAnimation({
    threshold: 0.1,
    rootMargin: '-72px 0px -100px 0px', // 顶部减去navbar高度
  });

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`${styles.section} ${styles[animationType]} ${isVisible ? styles.visible : ''} ${className}`}
      style={{ '--delay': `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

