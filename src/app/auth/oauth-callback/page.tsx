'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AuthLayout from '@/components/auth/AuthLayout';
import { PageTransition } from '@/components/PageTransition';
import { usePageAnimation } from '@/hooks/usePageAnimation';
import styles from '../confirm/page.module.css';

export default function OAuthCallback() {
  const router = useRouter();
  const mounted = usePageAnimation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // 获取当前会话
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          setStatus('error');
          setErrorMessage(sessionError.message);
          return;
        }

        if (!session) {
          // 没有会话，可能需要等待 Supabase 处理
          // 尝试从 URL 中获取 code 并交换 session
          const urlParams = new URLSearchParams(window.location.search);
          const code = urlParams.get('code');
          
          if (code) {
            // 有 code，让 Supabase 处理
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              console.error('Code exchange error:', error);
              setStatus('error');
              setErrorMessage(error.message);
              return;
            }
            if (!data.session) {
              setStatus('error');
              setErrorMessage('Failed to create session');
              return;
            }
          } else {
            setStatus('error');
            setErrorMessage('No authentication session found');
            return;
          }
        }

        // 获取保存的重定向信息
        const savedRedirectTo = localStorage.getItem('oauth_redirect_to') || '/onboarding';
        const savedUserType = localStorage.getItem('oauth_user_type') || 'CANDIDATE';

        // 清除保存的信息
        localStorage.removeItem('oauth_redirect_to');
        localStorage.removeItem('oauth_user_type');

        // 获取最新的会话信息
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!currentSession) {
          setStatus('error');
          setErrorMessage('Session lost');
          return;
        }

        const user = currentSession.user;

        // 调用 API 来处理用户数据库记录
        try {
          const response = await fetch('/api/auth/oauth-complete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              email: user.email,
              name: user.user_metadata?.full_name || user.user_metadata?.name,
              avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture,
              userType: savedUserType,
            }),
          });

          const result = await response.json();

          if (result.redirectTo) {
            // 使用 API 返回的重定向地址
            setStatus('success');
            setTimeout(() => {
              router.push(result.redirectTo);
            }, 1000);
            return;
          }
        } catch (apiError) {
          console.error('API error:', apiError);
          // 继续使用默认重定向
        }

        // 默认重定向
        setStatus('success');
        setTimeout(() => {
          router.push(savedRedirectTo);
        }, 1000);

      } catch (err) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setErrorMessage('An unexpected error occurred');
      }
    };

    handleOAuthCallback();
  }, [router]);

  return (
    <PageTransition>
      <AuthLayout mounted={mounted}>
        <div className={styles.container}>
          {status === 'loading' && (
            <>
              <div className={styles.spinner}></div>
              <h1 className={styles.title}>Completing sign in...</h1>
              <p className={styles.description}>
                Please wait while we set up your account.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className={styles.successIcon}>✓</div>
              <h1 className={styles.title}>Success!</h1>
              <p className={styles.description}>
                Redirecting you to your dashboard...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className={styles.errorIcon}>✕</div>
              <h1 className={styles.title}>Sign In Failed</h1>
              <p className={styles.description}>
                {errorMessage || 'Something went wrong. Please try again.'}
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
