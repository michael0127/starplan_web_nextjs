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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      if (!email || !password || !confirmPassword) {
        setError('Please fill in all fields');
        setIsLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setIsLoading(false);
        return;
      }

      // Sign up with Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined, // Disable email verification redirect
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Redirect to explore page on success
        router.push('/explore');
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
            <label className={formStyles.label} htmlFor="password">Password</label>
            <div className={formStyles.passwordContainer}>
              <input
                type={showPassword ? 'text' : 'password'}
                className={formStyles.input}
                id="password"
                placeholder="Enter your password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className={formStyles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className={formStyles.formItem}>
            <label className={formStyles.label} htmlFor="confirmPassword">Confirm Password</label>
            <div className={formStyles.passwordContainer}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className={formStyles.input}
                id="confirmPassword"
                placeholder="Enter your password again"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className={formStyles.passwordToggle}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
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
