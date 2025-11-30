import Link from 'next/link';
import Image from 'next/image';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer id="footer" className={styles.footer}>
      <div className={styles.cont}>
        <div className={styles.top}>
          <div className={styles.left}>
            <Link href="/" className={styles.logo}>
              <Image 
                src="/img/logo.png" 
                alt="StarPlan Logo" 
                width={195} 
                height={40}
              />
            </Link>
            <div className={styles.description}>
              The ultimate job finder powered by cutting-edge AI technology.
            </div>
            <Link href="/register" className={styles.btn1}>
              Create Your Free Profile
            </Link>
          </div>
        </div>
        <div className={styles.bottom}>
          <div>© 2024-2025 StarPlan. All rights reserved</div>
          <div className={styles.links}>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/cookie">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

