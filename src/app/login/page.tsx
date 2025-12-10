'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/auth/AuthLayout';
import GoogleButton from '@/components/auth/GoogleButton';
import PasswordInput from '@/components/auth/PasswordInput';
import { PageTransition } from '@/components/PageTransition';
import { usePageAnimation } from '@/hooks/usePageAnimation';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';
import formStyles from '@/components/auth/AuthForm.module.css';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const mounted = usePageAnimation();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate inputs
      if (!email || !password) {
        setError('Please enter both email and password');
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
        // Check if user has completed onboarding
        try {
          const response = await fetch(`/api/user/${data.user.id}`);
          if (response.ok) {
            const userData = await response.json();
            // Redirect based on onboarding status
            if (userData.hasCompletedOnboarding) {
              router.push('/explore');
            } else {
              router.push('/onboarding');
            }
          } else {
            // If user data not found, go to onboarding
            router.push('/onboarding');
          }
        } catch (err) {
          // On error, default to explore page
        router.push('/explore');
        }
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
          Empower your job seeking<br />
          Journey with <span className={formStyles.highlight}>StarPlan</span>
        </div>
        <p className={formStyles.subtitle}>
          Offering transformative features and strategic insights<br />for
          unparalleled success
        </p>

      <form id="loginForm" className={formStyles.form} onSubmit={handleLogin}>

        <div className={formStyles.formItem}>
          <label className={formStyles.label} htmlFor="email">Email Address</label>
          <input
            type="email"
            className={formStyles.input}
            id="email"
            placeholder="example@email.com"
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

        <div className={formStyles.forgotPassword}>
          <Link href="/forgot-password" style={{ color: '#252525', textDecoration: 'none' }}>
            Forgot Password?
          </Link>
        </div>
        
        <button type="submit" className={formStyles.button} id="loginBtn" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
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
        Having trouble logging in?
        <Link href="/register">Register</Link>
      </p>
      </AuthLayout>
    </PageTransition>
  );
}
