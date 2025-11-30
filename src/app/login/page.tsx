'use client';

import Link from 'next/link';
import { useState } from 'react';
import AuthLayout from '@/components/auth/AuthLayout';
import GoogleButton from '@/components/auth/GoogleButton';
import PasswordInput from '@/components/auth/PasswordInput';
import { usePageAnimation } from '@/hooks/usePageAnimation';
import styles from './page.module.css';
import formStyles from '@/components/auth/AuthForm.module.css';

export default function Login() {
  const [loginMethod, setLoginMethod] = useState<'password' | 'verifyCode'>('password');
  const [showPassword, setShowPassword] = useState(false);
  const mounted = usePageAnimation();

  return (
    <AuthLayout mounted={mounted}>
      <div className={formStyles.title}>
        Empower your job seeking<br />
        Journey with <span className={formStyles.highlight}>StarPlan</span>
      </div>
      <p className={formStyles.subtitle}>
        Offering transformative features and strategic insights<br />for
        unparalleled success
      </p>

      <form id="loginForm" className={formStyles.form}>
        {/* 登录方式切换标签 */}
        <div className={formStyles.loginTabs}>
          <div 
            className={`${formStyles.tabItem} ${loginMethod === 'password' ? formStyles.active : ''}`}
            onClick={() => setLoginMethod('password')}
          >
            Password Login
          </div>
          <div 
            className={`${formStyles.tabItem} ${loginMethod === 'verifyCode' ? formStyles.active : ''}`}
            onClick={() => setLoginMethod('verifyCode')}
          >
            Verification Code Login
          </div>
        </div>

        <div className={formStyles.formItem}>
          <label className={formStyles.label} htmlFor="email">Email Address</label>
          <input
            type="email"
            className={formStyles.input}
            id="email"
            placeholder="example@email.com"
            required
          />
          <div className={formStyles.errorMessage} id="emailError"></div>
        </div>

        {/* 密码登录 */}
        {loginMethod === 'password' && (
          <>
            <div className={formStyles.formItem} id="passwordField">
              <label className={formStyles.label} htmlFor="password">Password</label>
              <div className={formStyles.passwordContainer}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={formStyles.input}
                  id="password"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className={formStyles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className={formStyles.errorMessage} id="passwordError"></div>
            </div>
            <div className={formStyles.forgotPassword} id="forgotPasswordLink">
              <Link href="/forgot-password" style={{ color: '#252525', textDecoration: 'none' }}>
                Forgot Password?
              </Link>
            </div>
          </>
        )}

        {/* 验证码登录 */}
        {loginMethod === 'verifyCode' && (
          <div className={formStyles.formItem} id="verifyCodeField">
            <label className={formStyles.label} htmlFor="verifyCode">Verification Code</label>
            <div className={formStyles.verifyCodeContainer}>
              <input
                type="text"
                className={formStyles.input}
                id="verifyCode"
                placeholder="Enter 6-digit code"
                maxLength={6}
              />
              <button
                type="button"
                className={formStyles.sendCodeBtn}
                id="sendCodeBtn"
              >
                Send Code
              </button>
            </div>
            <div className={formStyles.errorMessage} id="verifyCodeError"></div>
          </div>
        )}
        
        <button type="submit" className={formStyles.button} id="loginBtn">
          Login
        </button>
        <div className={formStyles.successMessage} id="successMessage"></div>
        <div className={formStyles.errorMessage} id="loginError"></div>
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
  );
}
