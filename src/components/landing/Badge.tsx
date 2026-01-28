import { LucideIcon } from 'lucide-react';

type BadgeVariant = 'default' | 'success' | 'accent' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  icon?: LucideIcon;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-surface text-text-secondary border-border',
  success: 'bg-emerald-50 text-success border-emerald-100',
  accent: 'bg-violet-50 text-accent border-violet-100',
  outline: 'bg-transparent text-text-secondary border-border',
};

export function Badge({ children, variant = 'default', icon: Icon, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full border ${variantClasses[variant]} ${className}`}
    >
      {Icon && <Icon size={14} />}
      {children}
    </span>
  );
}

export default Badge;
