'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AuthLayout from '@/components/auth/AuthLayout';
import { PageTransition } from '@/components/PageTransition';
import { usePageAnimation } from '@/hooks/usePageAnimation';
import styles from './page.module.css';

// OAuth 信息存储 key（与 GoogleButton 保持一致）
const OAUTH_STORAGE_KEY = 'starplan_oauth_info';

interface OAuthInfo {
  userType: 'CANDIDATE' | 'EMPLOYER';
  redirectTo: string;
  timestamp: number;
}

export default function ConfirmAuth() {
  const router = useRouter();
  const mounted = usePageAnimation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  // 从 localStorage 获取 OAuth 信息
  const getOAuthInfo = (): OAuthInfo | null => {
    try {
      const stored = localStorage.getItem(OAUTH_STORAGE_KEY);
      if (stored) {
        const info = JSON.parse(stored) as OAuthInfo;
        // 检查是否过期（10分钟）
        if (Date.now() - info.timestamp < 10 * 60 * 1000) {
          return info;
        }
        // 过期则清除
        localStorage.removeItem(OAUTH_STORAGE_KEY);
      }
    } catch (err) {
      console.error('Error reading OAuth info:', err);
    }
    return null;
  };

  // 清除 OAuth 信息
  const clearOAuthInfo = () => {
    try {
      localStorage.removeItem(OAUTH_STORAGE_KEY);
    } catch (err) {
      console.error('Error clearing OAuth info:', err);
    }
  };

  // 根据用户类型获取正确的重定向 URL
  const getRedirectUrl = async (userId: string, userType?: string, oauthInfo?: OAuthInfo | null): Promise<string> => {
    // 优先使用 OAuth 信息中的用户类型
    const effectiveUserType = oauthInfo?.userType || userType;
    
    // 如果已知是 EMPLOYER，直接跳转到 employer dashboard
    if (effectiveUserType === 'EMPLOYER') {
      return '/employer/dashboard';
    }
    
    // 如果有 OAuth 信息中的 redirectTo
    if (oauthInfo?.redirectTo && oauthInfo.redirectTo !== '/onboarding') {
      return oauthInfo.redirectTo;
    }
    
    // 查询数据库获取用户信息
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

  // 处理用户创建/更新（用于 OAuth 用户）
  // 返回 API 确认的 redirectTo
  const handleUserSetup = async (userId: string, email: string, oauthInfo: OAuthInfo | null, userMetadata: Record<string, unknown>): Promise<string | null> => {
    try {
      const userType = oauthInfo?.userType || 'CANDIDATE';
      
      // 调用 API 创建或更新用户
      const response = await fetch('/api/auth/oauth-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email,
          userType,
          name: userMetadata?.full_name || userMetadata?.name || null,
          avatarUrl: userMetadata?.avatar_url || userMetadata?.picture || null,
        })
      });
      
      if (!response.ok) {
        console.error('Failed to setup user:', await response.text());
        return null;
      }
      
      const result = await response.json();
      console.log('User setup successful:', result);
      return result.redirectTo || null;
    } catch (err) {
      console.error('Error setting up user:', err);
      return null;
    }
  };

  useEffect(() => {
    const handleAuthConfirmation = async () => {
      try {
        // 获取 OAuth 信息（如果有）
        const oauthInfo = getOAuthInfo();
        console.log('OAuth info from localStorage:', oauthInfo);
        
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
            clearOAuthInfo();
            return;
          }

          if (data.session) {
            setStatus('success');
            
            const user = data.session.user;
            const isGoogleOAuth = user.app_metadata?.provider === 'google';
            
            // 检查是否是邀请类型
            const isInvite = type === 'invite' || 
                           user.user_metadata?.invitation_type === 'cv_upload';
            
            if (isInvite) {
              clearOAuthInfo();
              setTimeout(() => {
                router.push('/auth/set-password');
              }, 1000);
              return;
            }
            
            // 如果是 Google OAuth 用户，处理用户创建/更新并使用 API 返回的 redirectTo
            let redirectUrl: string;
            if (isGoogleOAuth && oauthInfo) {
              const apiRedirectTo = await handleUserSetup(user.id, user.email!, oauthInfo, user.user_metadata || {});
              redirectUrl = apiRedirectTo || (oauthInfo.userType === 'EMPLOYER' ? '/employer/dashboard' : '/onboarding');
            } else {
              const userType = user.user_metadata?.user_type;
              redirectUrl = await getRedirectUrl(user.id, userType, oauthInfo);
            }
            
            console.log('Final redirect URL:', redirectUrl);
            clearOAuthInfo();
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
          const user = session.user;
          const isGoogleOAuth = user.app_metadata?.provider === 'google';
          
          // 如果是 Google OAuth 用户，处理用户创建/更新并使用 API 返回的 redirectTo
          let redirectUrl: string;
          if (isGoogleOAuth && oauthInfo) {
            const apiRedirectTo = await handleUserSetup(user.id, user.email!, oauthInfo, user.user_metadata || {});
            redirectUrl = apiRedirectTo || (oauthInfo.userType === 'EMPLOYER' ? '/employer/dashboard' : '/onboarding');
          } else {
            const userType = user.user_metadata?.user_type;
            redirectUrl = await getRedirectUrl(user.id, userType, oauthInfo);
          }
          
          console.log('Final redirect URL:', redirectUrl);
          clearOAuthInfo();
          setTimeout(() => {
            router.push(redirectUrl);
          }, 1000);
          return;
        }

        // No valid auth data
        setStatus('error');
        setErrorMessage('No valid authentication data found. Please try again.');
        clearOAuthInfo();
      } catch (err) {
        console.error('Confirmation error:', err);
        setStatus('error');
        setErrorMessage('An unexpected error occurred.');
        clearOAuthInfo();
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
































