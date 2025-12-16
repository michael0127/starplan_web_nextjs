'use client';

import Link from 'next/link';
import AuthLayout from '@/components/auth/AuthLayout';
import { PageTransition } from '@/components/PageTransition';
import { usePageAnimation } from '@/hooks/usePageAnimation';
import styles from './page.module.css';

export default function CheckEmail() {
  const mounted = usePageAnimation();

  return (
    <PageTransition>
      <AuthLayout mounted={mounted}>
        <div className={styles.container}>
          {/* Email Icon */}
          <div className={styles.iconWrapper}>
            <div className={styles.icon}>📧</div>
          </div>

          {/* Title */}
          <h1 className={styles.title}>Check Your Email</h1>

          {/* Description */}
          <p className={styles.description}>
            We've sent a verification link to your email address.
          </p>

          <p className={styles.subdescription}>
            Click the link in the email to verify your account and get started with StarPlan.
          </p>

          {/* Instructions */}
          <div className={styles.instructions}>
            <h3 className={styles.instructionsTitle}>What's Next?</h3>
            <ol className={styles.instructionsList}>
              <li>Open your email inbox</li>
              <li>Find the email from StarPlan</li>
              <li>Click the "Verify Email" button</li>
              <li>You'll be redirected to complete your profile</li>
            </ol>
          </div>

          {/* Help Text */}
          <div className={styles.helpText}>
            <p className={styles.helpParagraph}>
              <strong>Didn't receive the email?</strong>
            </p>
            <ul className={styles.helpList}>
              <li>Check your spam or junk folder</li>
              <li>Make sure you entered the correct email address</li>
              <li>Wait a few minutes and check again</li>
            </ul>
          </div>

          {/* Back to Login */}
          <div className={styles.actions}>
            <Link href="/login" className={styles.backLink}>
              Back to Login
            </Link>
          </div>
        </div>
      </AuthLayout>
    </PageTransition>
  );
}
























