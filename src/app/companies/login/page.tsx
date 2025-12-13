'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageTransition } from '@/components/PageTransition';
import { usePageAnimation } from '@/hooks/usePageAnimation';
import AuthLayout from '@/components/auth/AuthLayout';
import GoogleButton from '@/components/auth/GoogleButton';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';
import formStyles from '@/components/auth/AuthForm.module.css';

function EmployerLoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const mounted = usePageAnimation();
  const router = useRouter();

  // 从URL参数中获取邮箱
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate inputs
      if (!email || !password) {
        setError('Please fill in all fields');
        setIsLoading(false);
        return;
      }

      // Sign in with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Redirect to employer dashboard
        router.push('/employer/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <AuthLayout mounted={mounted}>
        <div className={formStyles.title}>
          Employer <span className={formStyles.highlight}>Login</span>
        </div>
        <p className={formStyles.subtitle}>
          Sign in to access your employer dashboard
        </p>

        <form id="employerLoginForm" className={formStyles.form} onSubmit={handleLogin}>
          <div className={formStyles.formItem}>
            <label className={formStyles.label} htmlFor="email">Email Address</label>
            <input
              type="email"
              className={formStyles.input}
              id="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className={formStyles.formItem}>
            <div className={styles.labelRow}>
              <label className={formStyles.label} htmlFor="password">Password</label>
              <button
                type="button"
                className={styles.showButton}
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              className={formStyles.input}
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            className={formStyles.button} 
            id="employerLoginBtn"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
          {error && <div className={formStyles.errorMessage}>{error}</div>}
        </form>

        {/* 或分隔线 */}
        <div className={formStyles.divider}>
          <span>or</span>
        </div>

        {/* Google登录按钮 */}
        <GoogleButton>Continue with Google</GoogleButton>

        <p className={formStyles.linkText}>
          Don't have an account? <Link href="/companies/register">Sign Up</Link>
        </p>

        <p className={formStyles.linkText}>
          Looking for a job? <Link href="/login">Job Seeker Login</Link>
        </p>
      </AuthLayout>
    </PageTransition>
  );
}

export default function EmployerLogin() {
  return (
    <Suspense fallback={
      <PageTransition>
        <AuthLayout mounted={true}>
          <div className={formStyles.title}>
            Employer <span className={formStyles.highlight}>Login</span>
          </div>
          <p className={formStyles.subtitle}>
            Sign in to access your employer dashboard
          </p>
          <div className={formStyles.form}>Loading...</div>
        </AuthLayout>
      </PageTransition>
    }>
      <EmployerLoginForm />
    </Suspense>
  );
}
