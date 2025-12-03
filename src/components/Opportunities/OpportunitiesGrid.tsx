import { Opportunity } from './OpportunityCard';
import { OpportunityCard } from './OpportunityCard';
import styles from './OpportunitiesGrid.module.css';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

interface OpportunitiesGridProps {
  items: Opportunity[];
}

export function OpportunitiesGrid({ items }: OpportunitiesGridProps) {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  if (!items.length) {
    return null;
  }

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`${styles.grid} ${isVisible ? styles.gridVisible : ''}`}
    >
      {items.map((item) => (
        <OpportunityCard key={item.id} opportunity={item} />
      ))}
    </div>
  );
}



