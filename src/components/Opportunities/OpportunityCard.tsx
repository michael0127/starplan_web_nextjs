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

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const {
    title,
    minRate,
    maxRate,
    currency,
    unit,
    hiredThisMonth,
    avgPayout,
  } = opportunity;

  return (
    <article className={styles.card}>
      <div>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.rate}>
          {currency}
          {minRate} - {currency}
          {maxRate} / {unit}
        </p>
      </div>
      <div className={styles.metaRow}>
        <div>
          <p className={styles.stat}>Hired this month</p>
          <p className={styles.figure}>{hiredThisMonth}</p>
        </div>
        <div>
          <p className={styles.stat}>Avg. payout</p>
          <p className={styles.figure}>
            {currency}
            {avgPayout}
          </p>
        </div>
      </div>
    </article>
  );
}


