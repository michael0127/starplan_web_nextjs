'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AuthLayout from '@/components/auth/AuthLayout';
import { PageTransition } from '@/components/PageTransition';
import { usePageAnimation } from '@/hooks/usePageAnimation';
import styles from './page.module.css';

function ConfirmAuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mounted = usePageAnimation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleAuthConfirmation = async () => {
      try {
        // 从 URL 参数获取重定向目标和用户类型
        const nextUrl = searchParams.get('next') || '/onboarding';
        const userType = searchParams.get('userType') || 'CANDIDATE';
        
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
            
            // 检查是否是邀请类型
            // 1. 从 URL hash 中检查 type 参数
            // 2. 从用户元数据中检查 invitation_type
            const isInvite = type === 'invite' || 
                           data.session.user.user_metadata?.invitation_type === 'cv_upload';
            
            if (isInvite) {
              // 邀请用户需要先设置密码
              setTimeout(() => {
                router.push('/auth/set-password');
              }, 1000);
              return;
            }
            
            // 根据用户类型和 API 检查用户状态
            try {
              const response = await fetch(`/api/user/${data.session.user.id}`);
              if (response.ok) {
                const userData = await response.json();
                
                // Employer 不需要 onboarding，直接跳转到 dashboard
                if (userData.userType === 'EMPLOYER') {
                  setTimeout(() => {
                    router.push('/employer/dashboard');
                  }, 1000);
                  return;
                }
                
                // Candidate 检查 onboarding 状态
                if (userData.hasCompletedOnboarding) {
                  setTimeout(() => {
                    router.push('/explore');
                  }, 1000);
                  return;
                }
              }
            } catch (apiError) {
              console.error('Error fetching user data:', apiError);
            }
            
            // Candidate 新用户跳转到 onboarding
            // Employer 如果 API 失败也尝试跳转到目标页面
            setTimeout(() => {
              router.push(userType === 'EMPLOYER' ? '/employer/dashboard' : nextUrl);
            }, 1000);
            return;
          }
        }

        // If no valid tokens, check if user is already logged in
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setStatus('success');
          
          // 检查用户状态
          try {
            const response = await fetch(`/api/user/${session.user.id}`);
            if (response.ok) {
              const userData = await response.json();
              
              // Employer 不需要 onboarding，直接跳转到 dashboard
              if (userData.userType === 'EMPLOYER') {
                setTimeout(() => {
                  router.push('/employer/dashboard');
                }, 1000);
                return;
              }
              
              // Candidate 检查 onboarding 状态
              if (userData.hasCompletedOnboarding) {
                setTimeout(() => {
                  router.push('/explore');
                }, 1000);
                return;
              }
            }
          } catch (apiError) {
            console.error('Error fetching user data:', apiError);
          }
          
          // Candidate 跳转到 onboarding，Employer 跳转到 dashboard
          setTimeout(() => {
            router.push(userType === 'EMPLOYER' ? '/employer/dashboard' : nextUrl);
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
  }, [router, searchParams]);

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

export default function ConfirmAuth() {
  const mounted = usePageAnimation();
  
  return (
    <Suspense fallback={
      <PageTransition>
        <AuthLayout mounted={mounted}>
          <div className={styles.container}>
            <div className={styles.spinner}></div>
            <h1 className={styles.title}>Loading...</h1>
          </div>
        </AuthLayout>
      </PageTransition>
    }>
      <ConfirmAuthContent />
    </Suspense>
  );
}
































