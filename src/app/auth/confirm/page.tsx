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

  // 根据用户类型获取正确的重定向 URL
  const getRedirectUrl = async (userId: string, userType?: string): Promise<string> => {
    // 如果已知是 EMPLOYER，直接跳转到 employer dashboard
    if (userType === 'EMPLOYER') {
      return '/employer/dashboard';
    }
    
    // 否则查询数据库获取用户信息
    try {
      const response = await fetch(`/api/user/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        if (userData.userType === 'EMPLOYER') {
          return '/employer/dashboard';
        }
        if (userData.hasCompletedOnboarding) {
          return '/explore';
        }
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
    
    // 默认跳转到 onboarding
    return '/onboarding';
  };

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
            
            const user = data.session.user;
            const userType = user.user_metadata?.user_type;
            
            // 检查是否是邀请类型
            // 1. 从 URL hash 中检查 type 参数
            // 2. 从用户元数据中检查 invitation_type
            const isInvite = type === 'invite' || 
                           user.user_metadata?.invitation_type === 'cv_upload';
            
            if (isInvite) {
              // 邀请用户需要先设置密码
              setTimeout(() => {
                router.push('/auth/set-password');
              }, 1000);
              return;
            }
            
            // 根据用户类型跳转
            const redirectUrl = await getRedirectUrl(user.id, userType);
            setTimeout(() => {
              router.push(redirectUrl);
            }, 1000);
            return;
          }
        }

        // If no valid tokens, check if user is already logged in
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setStatus('success');
          const userType = session.user.user_metadata?.user_type;
          const redirectUrl = await getRedirectUrl(session.user.id, userType);
          setTimeout(() => {
            router.push(redirectUrl);
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
































