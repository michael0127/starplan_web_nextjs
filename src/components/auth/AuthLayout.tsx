'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ReactNode } from 'react';
import styles from './AuthLayout.module.css';

interface AuthLayoutProps {
  children: ReactNode;
  mounted?: boolean;
  variant?: 'jobseeker' | 'employer';
}

// B端(雇主)专用营销面板
function EmployerMarketingPanel() {
  return (
    <div className={styles.employerMarketing}>
      <div className={styles.employerContent}>
        <h2 className={styles.employerTitle}>
          Find Top Talent with <span className={styles.employerHighlight}>AI-Powered</span> Matching
        </h2>
        <p className={styles.employerSubtitle}>
          Post jobs and connect with qualified candidates faster than ever before.
        </p>
        
        <div className={styles.employerFeatures}>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className={styles.featureText}>
              <strong>Smart Matching</strong>
              <span>AI matches candidates to your job requirements</span>
            </div>
          </div>
          
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className={styles.featureText}>
              <strong>Talent Pool Access</strong>
              <span>Access thousands of verified professionals</span>
            </div>
          </div>
          
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className={styles.featureText}>
              <strong>Fast Hiring</strong>
              <span>Reduce time-to-hire by up to 60%</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 装饰性元素 */}
      <div className={styles.decorativeCircle1}></div>
      <div className={styles.decorativeCircle2}></div>
      <div className={styles.decorativeCircle3}></div>
    </div>
  );
}

// C端(求职者)专用营销面板
function JobSeekerMarketingPanel() {
  return (
    <div className={styles.imageWrapper}>
      <Image
        src="/img/RightSection-453170fb.png"
        alt="Job Matching"
        fill
        style={{ objectFit: 'contain' }}
        priority
      />
    </div>
  );
}

export default function AuthLayout({ children, mounted = false, variant = 'jobseeker' }: AuthLayoutProps) {
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
        <div className={`${styles.marketingPanel} ${variant === 'employer' ? styles.employerVariant : ''}`}>
          {variant === 'employer' ? <EmployerMarketingPanel /> : <JobSeekerMarketingPanel />}
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






















































