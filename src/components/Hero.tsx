import Link from 'next/link';
import styles from './Hero.module.css';

export default function Hero() {
  return (
    <section className={styles.hero}>
      {/* Background decorative elements */}
      <div className={styles.bgDecoration}>
        <div className={styles.circle1}></div>
        <div className={styles.circle2}></div>
        <div className={styles.circle3}></div>
        <div className={styles.gradient1}></div>
        <div className={styles.gradient2}></div>
      </div>
      
      <div className={styles.content}>
        <h1 className={styles.title}>Find Your Dream Career with AI</h1>
        <div className={styles.subtitleContainer}>
          <p className={styles.subtitle}>
            AI-powered matching connects you with top opportunities.
          </p>
          <p className={styles.subtitle}>
            Get personalized job recommendations that fit your skills and goals.
          </p>
        </div>
        <div className={styles.buttons}>
          <Link href="/explore" className={styles.primaryButton}>
            Create Free Profile
          </Link>
          <Link href="/explore" className={styles.secondaryButton}>
            Explore Opportunities
          </Link>
        </div>
      </div>
      
      {/* Soft gradient fade at bottom for smooth transition */}
      <div className={styles.bottomFade}></div>
    </section>
  );
}







































