'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  background?: 'default' | 'surface' | 'surface-2';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
}

const backgroundClasses = {
  default: 'bg-background',
  surface: 'bg-surface',
  'surface-2': 'bg-surface-2',
};

const paddingClasses = {
  sm: 'py-12 md:py-16',
  md: 'py-16 md:py-20',
  lg: 'py-20 md:py-28',
  xl: 'py-24 md:py-32',
};

export function Section({
  children,
  className = '',
  id,
  background = 'default',
  padding = 'lg',
  animate = true,
}: SectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const content = (
    <div className="max-w-6xl mx-auto px-6 md:px-10">
      {children}
    </div>
  );

  if (!animate) {
    return (
      <section
        id={id}
        className={`${backgroundClasses[background]} ${paddingClasses[padding]} ${className}`}
      >
        {content}
      </section>
    );
  }

  return (
    <motion.section
      id={id}
      ref={ref}
      className={`${backgroundClasses[background]} ${paddingClasses[padding]} ${className}`}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {content}
    </motion.section>
  );
}

interface SectionHeaderProps {
  badge?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
}

export function SectionHeader({
  badge,
  title,
  description,
  align = 'center',
}: SectionHeaderProps) {
  const alignClasses = align === 'center' ? 'text-center mx-auto' : 'text-left';

  return (
    <div className={`max-w-2xl mb-12 md:mb-16 ${alignClasses}`}>
      {badge && (
        <span className="inline-block px-3 py-1 text-sm font-medium text-accent bg-violet-50 border border-violet-100 rounded-full mb-4">
          {badge}
        </span>
      )}
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-text-primary mb-4">
        {title}
      </h2>
      {description && (
        <p className="text-lg text-text-secondary leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

export default Section;
