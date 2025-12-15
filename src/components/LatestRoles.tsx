'use client';

import { OpportunityCard, Opportunity } from './Opportunities/OpportunityCard';
import styles from './LatestRoles.module.css';

const LATEST_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'senior-fullstack',
    title: 'Senior Full Stack Developer',
    minRate: 80,
    maxRate: 150,
    currency: '$',
    unit: 'hour',
    hiredThisMonth: 42,
    avgPayout: 115,
  },
  {
    id: 'product-manager',
    title: 'Product Manager - SaaS',
    minRate: 90,
    maxRate: 160,
    currency: '$',
    unit: 'hour',
    hiredThisMonth: 28,
    avgPayout: 125,
  },
  {
    id: 'machine-learning',
    title: 'Machine Learning Engineer',
    minRate: 85,
    maxRate: 170,
    currency: '$',
    unit: 'hour',
    hiredThisMonth: 35,
    avgPayout: 130,
  },
  {
    id: 'ux-designer',
    title: 'UX/UI Designer',
    minRate: 60,
    maxRate: 120,
    currency: '$',
    unit: 'hour',
    hiredThisMonth: 51,
    avgPayout: 90,
  },
  {
    id: 'data-scientist',
    title: 'Data Scientist',
    minRate: 75,
    maxRate: 140,
    currency: '$',
    unit: 'hour',
    hiredThisMonth: 38,
    avgPayout: 110,
  },
  {
    id: 'devops-engineer',
    title: 'DevOps Engineer',
    minRate: 70,
    maxRate: 130,
    currency: '$',
    unit: 'hour',
    hiredThisMonth: 44,
    avgPayout: 100,
  },
  {
    id: 'backend-engineer',
    title: 'Backend Engineer - Python',
    minRate: 75,
    maxRate: 135,
    currency: '$',
    unit: 'hour',
    hiredThisMonth: 47,
    avgPayout: 105,
  },
  {
    id: 'mobile-developer',
    title: 'Mobile Developer - React Native',
    minRate: 65,
    maxRate: 125,
    currency: '$',
    unit: 'hour',
    hiredThisMonth: 39,
    avgPayout: 95,
  },
];

export default function LatestRoles() {
  return (
    <section className={styles.section}>
      {/* Background decorative elements */}
      <div className={styles.bgDecoration}>
        <div className={styles.gradientBlob1}></div>
        <div className={styles.gradientBlob2}></div>
        <div className={styles.gradientBlob3}></div>
        <div className={styles.circle1}></div>
        <div className={styles.circle2}></div>
        <div className={styles.circle3}></div>
      </div>
      
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Featured Opportunities</h2>
          <button className={styles.arrowButton} aria-label="View more opportunities">
            →
          </button>
        </div>
        <div className={styles.grid}>
          {LATEST_OPPORTUNITIES.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      </div>
      
      {/* Soft gradient fade at bottom */}
      <div className={styles.bottomFade}></div>
    </section>
  );
}




































