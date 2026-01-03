'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/auth/AuthLayout';
import { PageTransition } from '@/components/PageTransition';
import { usePageAnimation } from '@/hooks/usePageAnimation';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';
import formStyles from '@/components/auth/AuthForm.module.css';

export default function SetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);

  const mounted = usePageAnimation();
  const router = useRouter();

  // 验证邀请链接并获取用户信息
  useEffect(() => {
    const verifyInvite = async () => {
      try {
        // 获取当前用户会话
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          setError('Unable to verify invitation. Please try again or request a new invitation.');
          setIsVerifying(false);
          return;
        }

        // 获取用户邮箱
        setEmail(session.user.email || '');
        setIsVerifying(false);
      } catch (err) {
        console.error('Verification error:', err);
        setError('An unexpected error occurred. Please try again.');
        setIsVerifying(false);
      }
    };

    verifyInvite();
  }, []);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 验证输入
      if (!password || !confirmPassword) {
        setError('Please fill in all fields');
        setIsLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setIsLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }

      // 更新用户密码
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message);
        setIsLoading(false);
        return;
      }

      // 密码设置成功，重定向到 onboarding
      router.push('/onboarding');
    } catch (err) {
      console.error('Set password error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <PageTransition>
        <AuthLayout mounted={mounted}>
          <div className={styles.container}>
            <div className={styles.spinner}></div>
            <h1 className={styles.title}>Verifying invitation...</h1>
            <p className={styles.description}>
              Please wait while we verify your invitation link.
            </p>
          </div>
        </AuthLayout>
      </PageTransition>
    );
  }

  if (error && !email) {
    return (
      <PageTransition>
        <AuthLayout mounted={mounted}>
          <div className={styles.container}>
            <div className={styles.errorIcon}>✕</div>
            <h1 className={styles.title}>Invalid Invitation</h1>
            <p className={styles.description}>{error}</p>
            <button
              onClick={() => router.push('/login')}
              className={styles.backButton}
            >
              Back to Login
            </button>
          </div>
        </AuthLayout>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <AuthLayout mounted={mounted}>
        <div className={formStyles.container}>
          <div className={formStyles.header}>
            <h1 className={formStyles.title}>Set Your Password</h1>
            <p className={formStyles.subtitle}>
              Welcome to StarPlan! Please set a password to complete your account setup.
            </p>
            {email && (
              <p className={formStyles.email}>
                Account: <strong>{email}</strong>
              </p>
            )}
          </div>

          <form onSubmit={handleSetPassword} className={formStyles.form}>
            <div className={formStyles.inputGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label htmlFor="password" className={formStyles.label}>
                  Password
                </label>
                <button
                  type="button"
                  className={formStyles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'static', transform: 'none' }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                className={formStyles.input}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isLoading}
                required
              />
              <p className={formStyles.hint}>
                Must be at least 6 characters
              </p>
            </div>

            <div className={formStyles.inputGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label htmlFor="confirmPassword" className={formStyles.label}>
                  Confirm Password
                </label>
                <button
                  type="button"
                  className={formStyles.passwordToggle}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'static', transform: 'none' }}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className={formStyles.input}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                disabled={isLoading}
                required
              />
            </div>

            {error && <div className={formStyles.error}>{error}</div>}

            <button
              type="submit"
              className={formStyles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? 'Setting Password...' : 'Set Password & Continue'}
            </button>
          </form>
        </div>
      </AuthLayout>
    </PageTransition>
  );
}

