import Image from 'next/image';
import styles from './FindAJob.module.css';

export default function FindAJob() {
  return (
    <section id="starPlan" className={styles.starPlan}>
      <div className={styles.imageContainer}>
        <Image
          src="/img/pc-starPlan.png"
          alt="StarPlan Matches"
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
      </div>
      <div className={styles.info}>
        <div className={styles.t}>StarPlan Matches You <br /> with the Perfect Job</div>
        <div className={styles.p}>
          At StarPlan, we believe finding the perfect job should be simple and personal. Our advanced
          AI technology understands your unique skills and interests to match you with the best-fit job.
        </div>
      </div>
    </section>
  );
}

