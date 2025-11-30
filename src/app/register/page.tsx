'use client';

import Link from 'next/link';
import { useState } from 'react';
import AuthLayout from '@/components/auth/AuthLayout';
import GoogleButton from '@/components/auth/GoogleButton';
import PasswordInput from '@/components/auth/PasswordInput';
import { usePageAnimation } from '@/hooks/usePageAnimation';
import styles from './page.module.css';
import formStyles from '@/components/auth/AuthForm.module.css';

export default function Register() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '']);
  const mounted = usePageAnimation();

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
  };

  return (
    <AuthLayout mounted={mounted}>
      {/* Step 1: Account Creation */}
      {currentStep === 1 && (
        <div id="step1" className={formStyles.stepContent}>
          <div className={formStyles.title}>Create Your Account</div>
          <div className={formStyles.subtitle}>Account Information</div>
          <div className={formStyles.progressBar}>
            <div className={`${formStyles.progressStep} ${formStyles.active}`}></div>
            <div className={formStyles.progressStep}></div>
          </div>

          <form id="accountForm" className={formStyles.form}>
            <div className={formStyles.formItem}>
              <label className={formStyles.label} htmlFor="email">Email Address</label>
              <input
                type="email"
                className={formStyles.input}
                id="email"
                placeholder="email@example.com"
                required
              />
              <div className={formStyles.errorMessage} id="emailError"></div>
            </div>

            <div className={formStyles.formItem}>
              <label className={formStyles.label} htmlFor="password">Password</label>
              <div className={formStyles.passwordContainer}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={formStyles.input}
                  id="password"
                  placeholder="Enter your password"
                  required
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

            <div className={formStyles.formItem}>
              <label className={formStyles.label} htmlFor="confirmPassword">Confirm Password</label>
              <div className={formStyles.passwordContainer}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={formStyles.input}
                  id="confirmPassword"
                  placeholder="Enter your password again"
                  required
                />
                <button
                  type="button"
                  className={formStyles.passwordToggle}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className={formStyles.errorMessage} id="confirmPasswordError"></div>
            </div>

            <button 
              type="button" 
              className={formStyles.continueBtn} 
              id="accountBtn"
              onClick={() => setCurrentStep(2)}
            >
              Continue
            </button>
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
        </div>
      )}

      {/* Step 2: Email Verification */}
      {currentStep === 2 && (
        <div id="step2" className={formStyles.stepContent}>
          <button className={formStyles.backBtn} onClick={() => setCurrentStep(1)}>
            ← Back
          </button>
          <div className={formStyles.title}>Verification</div>
          <div className={formStyles.subtitle}>
            Enter the code that was sent to your email
          </div>
          <div className={formStyles.progressBar}>
            <div className={`${formStyles.progressStep} ${formStyles.active}`}></div>
            <div className={`${formStyles.progressStep} ${formStyles.active}`}></div>
          </div>

          <p className={formStyles.verificationDescription}>
            To finish registering, please enter the verification code we gave
            you. It might take a few minutes to receive your code.
          </p>

          <div className={formStyles.verificationContainer}>
            {[0, 1, 2, 3].map((index) => (
              <input
                key={index}
                type="text"
                className={formStyles.verificationInput}
                maxLength={1}
                value={verificationCode[index]}
                onChange={(e) => handleCodeChange(index, e.target.value)}
              />
            ))}
          </div>

          <div className={formStyles.resendLink}>
            Didn't receive the code?
            <span>Resend code</span>
          </div>

          <button 
            className={formStyles.continueBtn} 
            id="verifyBtn"
            onClick={() => setCurrentStep(3)}
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 3: Registration Success */}
      {currentStep === 3 && (
        <div id="step3" className={formStyles.stepContent}>
          <div className={formStyles.successContainer}>
            <div className={formStyles.title}>Welcome to StarPlan!</div>
            <div className={formStyles.description}>
              Thank you for joining the StarPlan community. Your journey to
              find your dream job with AI-powered matching begins now.
            </div>
            <Link href="/" className={formStyles.getStartedBtn}>
              Get Started
            </Link>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
