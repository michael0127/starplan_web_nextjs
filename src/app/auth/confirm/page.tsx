'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AuthLayout from '@/components/auth/AuthLayout';
import { PageTransition } from '@/components/PageTransition';
import { usePageAnimation } from '@/hooks/usePageAnimation';
import styles from './page.module.css';

export default function ConfirmAuth() {
  const router = useRouter();
  const mounted = usePageAnimation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleAuthConfirmation = async () => {
      try {
        // Check if there's a hash fragment with auth data
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (accessToken && refreshToken) {
          // Set the session with the tokens from the URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Error setting session:', error);
            setStatus('error');
            setErrorMessage(error.message);
            return;
          }

          if (data.session) {
            setStatus('success');
            // Small delay to show success message
            setTimeout(() => {
              router.push('/onboarding');
            }, 1000);
            return;
          }
        }

        // If no valid tokens, check if user is already logged in
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setStatus('success');
          setTimeout(() => {
            router.push('/onboarding');
          }, 1000);
          return;
        }

        // No valid auth data
        setStatus('error');
        setErrorMessage('No valid authentication data found. Please try again.');
      } catch (err) {
        console.error('Confirmation error:', err);
        setStatus('error');
        setErrorMessage('An unexpected error occurred.');
      }
    };

    handleAuthConfirmation();
  }, [router]);

  return (
    <PageTransition>
      <AuthLayout mounted={mounted}>
        <div className={styles.container}>
          {status === 'loading' && (
            <>
              <div className={styles.spinner}></div>
              <h1 className={styles.title}>Verifying your email...</h1>
              <p className={styles.description}>
                Please wait while we confirm your account.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className={styles.successIcon}>✓</div>
              <h1 className={styles.title}>Email Verified!</h1>
              <p className={styles.description}>
                Your email has been successfully verified. Redirecting you to complete your profile...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className={styles.errorIcon}>✕</div>
              <h1 className={styles.title}>Verification Failed</h1>
              <p className={styles.description}>
                {errorMessage || 'We could not verify your email. The link may have expired or is invalid.'}
              </p>
              <button
                onClick={() => router.push('/login')}
                className={styles.backButton}
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </AuthLayout>
    </PageTransition>
  );
}


