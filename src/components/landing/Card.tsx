import { LucideIcon } from 'lucide-react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'bordered';
  padding?: 'sm' | 'md' | 'lg';
}

interface CardWithIconProps {
  icon: LucideIcon;
  iconColor?: string;
  title: string;
  description: string;
  className?: string;
}

const variantClasses = {
  default: 'bg-surface border border-border',
  elevated: 'bg-white border border-border shadow-md',
  bordered: 'bg-white border border-border',
};

const paddingClasses = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
}: CardProps) {
  return (
    <div className={`rounded-2xl ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}

export function CardWithIcon({
  icon: Icon,
  iconColor = '#4F67FF',
  title,
  description,
  className = '',
}: CardWithIconProps) {
  return (
    <Card className={`flex flex-col gap-4 ${className}`} padding="lg">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `color-mix(in srgb, ${iconColor} 10%, transparent)` }}
      >
        <Icon size={20} style={{ color: iconColor }} />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
        <p className="text-text-secondary text-base leading-relaxed">{description}</p>
      </div>
    </Card>
  );
}

export default Card;
