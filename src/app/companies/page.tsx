'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PageTransition } from '@/components/PageTransition';
import { usePageAnimation } from '@/hooks/usePageAnimation';
import styles from './page.module.css';

export default function EmployerLanding() {
  const [email, setEmail] = useState('');
  const mounted = usePageAnimation();

  return (
    <PageTransition>
      <div className={styles.container}>
        <div className={styles.content}>
          {/* Left side - Form */}
          <div className={styles.formSection}>
            <div className={styles.formContainer}>
              <h1 className={styles.title}>
                Hiring made easy - post your jobs today
              </h1>
              <p className={styles.subtitle}>
                Our AI-powered platform matches you with the right candidate, fast.
              </p>

              <div className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>
                    Enter your email
                  </label>
                  <div className={styles.inputGroup}>
                    <input
                      type="email"
                      id="email"
                      className={styles.input}
                      placeholder="example@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Link 
                      href={`/companies/register${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                      className={styles.registerButton}
                    >
                      Register
                    </Link>
                  </div>
                </div>
              </div>

              <div className={styles.loginSection}>
                <p className={styles.loginText}>
                  Already have an employer account?
                </p>
                <Link 
                  href={`/companies/login${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                  className={styles.loginButton}
                >
                  Sign In
                </Link>
              </div>

              <div className={styles.helpSection}>
                <p className={styles.helpText}>
                  Need help? Reach out to us at
                </p>
                <p className={styles.phone}>hello@starplan.ai</p>
                <p className={styles.hours}>Mon - Fri, 8:30am - 6pm AEST</p>
                <p className={styles.helpLink}>
                  Or visit our <Link href="/help">Help Centre</Link>.
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Compelling Content */}
          <div className={styles.contentSection}>
            <div className={styles.contentWrapper}>
              <h2 className={styles.contentTitle}>
                Why Choose StarPlan?
              </h2>
              
              <div className={styles.featuresList}>
                <div className={styles.featureItem}>
                  <div className={styles.featureIcon}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 11l3 3L22 4"></path>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                    </svg>
                  </div>
                  <div className={styles.featureContent}>
                    <h3>AI-Powered Matching</h3>
                    <p>Our advanced AI analyzes candidate profiles to find your perfect match, saving you hours of manual screening.</p>
                  </div>
                </div>

                <div className={styles.featureItem}>
                  <div className={styles.featureIcon}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </div>
                  <div className={styles.featureContent}>
                    <h3>Hire 3x Faster</h3>
                    <p>Reduce time-to-hire with instant candidate recommendations and streamlined communication tools.</p>
                  </div>
                </div>

                <div className={styles.featureItem}>
                  <div className={styles.featureIcon}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <div className={styles.featureContent}>
                    <h3>Access Top Talent</h3>
                    <p>Connect with thousands of qualified candidates actively seeking opportunities in your industry.</p>
                  </div>
                </div>

                <div className={styles.featureItem}>
                  <div className={styles.featureIcon}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                      <path d="M2 17l10 5 10-5"></path>
                      <path d="M2 12l10 5 10-5"></path>
                    </svg>
                  </div>
                  <div className={styles.featureContent}>
                    <h3>All-in-One Platform</h3>
                    <p>Manage job posts, applicants, interviews, and offers all in one intuitive dashboard.</p>
                  </div>
                </div>
              </div>

              <div className={styles.statsSection}>
                <div className={styles.statItem}>
                  <div className={styles.statNumber}>10,000+</div>
                  <div className={styles.statLabel}>Active Candidates</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statNumber}>500+</div>
                  <div className={styles.statLabel}>Companies Hiring</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statNumber}>95%</div>
                  <div className={styles.statLabel}>Match Success Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
