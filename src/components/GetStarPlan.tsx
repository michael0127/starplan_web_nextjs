import Link from 'next/link';
import Image from 'next/image';
import styles from './GetStarPlan.module.css';

export default function GetStarPlan() {
  return (
    <section className={styles.testimonialsSection}>
      <div className={styles.container}>
        <div className={styles.left}>
          <div className={styles.imageWrapper}>
            <Image
              src="/img/pc-left-phone4x.png"
              alt="StarPlan App"
              width={300}
              height={225}
              style={{ width: '100%', maxHeight: '225px', height: 'auto', objectFit: 'contain' }}
            />
          </div>
          <div className={styles.imageWrapper2}>
            <Image
              src="/img/pc-right-phone4x.png"
              alt="StarPlan App"
              width={300}
              height={225}
              style={{ width: '100%', maxHeight: '225px', height: 'auto', objectFit: 'contain' }}
            />
          </div>
        </div>
        <div className={styles.right}>
          <h1 className={styles.title}>Get the StarPlan Today!</h1>
          <p className={styles.description}>
            Join thousands of professionals who have found their dream jobs with StarPlan. Register now and take the next step in your career!
          </p>
          <Link href="/register" className={styles.btn1}>
            Create Your Free Profile
          </Link>
        </div>
      </div>
    </section>
  );
}

