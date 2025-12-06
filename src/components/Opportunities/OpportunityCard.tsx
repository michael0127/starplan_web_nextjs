import styles from './OpportunityCard.module.css';

export interface Opportunity {
  id: string;
  title: string;
  minRate: number;
  maxRate: number;
  currency: string;
  unit: 'hour' | 'project' | 'month';
  hiredThisMonth: number;
  avgPayout: number;
}

interface OpportunityCardProps {
  opportunity: Opportunity;
}

// Generate avatar colors based on index
const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
];

function generateAvatars(count: number): string[] {
  return Array.from({ length: Math.min(count, 3) }, (_, i) => AVATAR_COLORS[i % AVATAR_COLORS.length]);
}

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const {
    title,
    minRate,
    maxRate,
    currency,
    unit,
    hiredThisMonth,
  } = opportunity;

  const avatarColors = generateAvatars(3);

  return (
    <article className={styles.card}>
      <div className={styles.content}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.rate}>
          {currency}
          {minRate}-{currency}
          {maxRate}/{unit}
        </p>
      </div>
      <div className={styles.footer}>
        <div className={styles.avatarsContainer}>
          {avatarColors.map((color, index) => (
            <div 
              key={index} 
              className={styles.avatar}
              style={{ 
                backgroundColor: color,
                zIndex: avatarColors.length - index,
                marginLeft: index > 0 ? '-8px' : '0'
              }}
            />
          ))}
          <span className={styles.hiredText}>{hiredThisMonth} hired recently</span>
        </div>
        <button className={styles.applyButton}>Apply</button>
      </div>
    </article>
  );
}


