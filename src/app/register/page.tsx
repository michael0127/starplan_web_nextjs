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

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const mounted = usePageAnimation();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
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

      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setIsLoading(false);
        return;
      }

      // Sign up with Supabase with email verification
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
          data: {
            user_type: 'CANDIDATE', // 标记为候选人账户 (必须大写以匹配数据库enum)
          }
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Redirect to check-email page
        router.push('/check-email');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <AuthLayout mounted={mounted}>
        <div className={formStyles.title}>Create Your Account</div>
        <p className={formStyles.subtitle}>
          Start your journey to find your dream job with AI-powered matching
        </p>

        <form id="registerForm" className={formStyles.form} onSubmit={handleRegister}>
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
            <p className={styles.passwordHint}>Password must be at least 6 characters</p>
          </div>

          <button 
            type="submit" 
            className={formStyles.button} 
            id="registerBtn"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
          {error && <div className={formStyles.errorMessage}>{error}</div>}
        </form>

        {/* 或分隔线 */}
        <div className={formStyles.divider}>
          <span>or</span>
        </div>

        {/* Google注册按钮 */}
        <GoogleButton>Continue with Google</GoogleButton>

        <p className={formStyles.linkText}>
          Already have an account? <Link href="/login">Login</Link>
        </p>
      </AuthLayout>
    </PageTransition>
  );
}
