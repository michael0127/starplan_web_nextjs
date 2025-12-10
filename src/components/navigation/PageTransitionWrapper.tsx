'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionWrapperProps {
  children: ReactNode;
}

// 为内部页面（带侧边栏的页面）使用的过渡效果
export function PageTransitionWrapper({ children }: PageTransitionWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}



















