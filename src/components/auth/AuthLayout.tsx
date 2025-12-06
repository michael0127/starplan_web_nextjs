'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ReactNode } from 'react';
import styles from './AuthLayout.module.css';

interface AuthLayoutProps {
  children: ReactNode;
  mounted?: boolean;
}

export default function AuthLayout({ children, mounted = false }: AuthLayoutProps) {
  return (
    <div className={`${styles.authPage} ${mounted ? styles.mounted : ''}`}>
      <div className={styles.topBar}>
        <div className={styles.back}>
          <Link href="/">
            <Image 
              src="/img/left-arrow.png" 
              alt="Back" 
              width={24} 
              height={24}
            />
            <span>Back</span>
          </Link>
        </div>
        <div className={styles.logoContainer}>
          <Image 
            src="/img/logo.png" 
            alt="StarPlan" 
            width={120} 
            height={40}
            priority
          />
        </div>
        <div className={styles.topBarSpacer}></div>
      </div>
      <div className={styles.container}>
        <div className={styles.panel}>
          {children}
        </div>
        <div className={styles.marketingPanel}>
          <div className={styles.imageWrapper}>
            <Image
              src="/img/RightSection-453170fb.png"
              alt="Job Matching"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
        </div>
      </div>
      <div className={styles.copyright}>
        <div className={styles.copyrightText}>
          ©2024-2025 StarPlan. All rights reserved
        </div>
        <div className={styles.legalLinks}>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/privacy">Privacy Policy</Link>
        </div>
        <Link href="/cookie">Cookie Policy</Link>
      </div>
    </div>
  );
}














