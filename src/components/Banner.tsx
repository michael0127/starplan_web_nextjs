import Link from 'next/link';
import Image from 'next/image';
import styles from './Banner.module.css';

export default function Banner() {
  return (
    <section id="banner" className={styles.banner}>
      <div className={styles.btns}>
        <Link href="/register" className={styles.btn1}>
          Create Your Free Profile
        </Link>
      </div>
    </section>
  );
}

