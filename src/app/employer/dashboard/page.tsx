'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageTransition } from '@/components/PageTransition';
import { usePageAnimation } from '@/hooks/usePageAnimation';
import { useUserType } from '@/hooks/useUserType';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

export default function EmployerDashboard() {
  const mounted = usePageAnimation();
  const router = useRouter();
  const [isJobPostsDropdownOpen, setIsJobPostsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // 使用权限检查 hook，要求必须是 EMPLOYER
  const { user, loading, isEmployer, userType } = useUserType({
    required: 'EMPLOYER',
    redirectTo: '/',
  });

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsJobPostsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // 如果不是 loading 状态且不是 employer，显示提示
    if (!loading && userType && !isEmployer) {
      console.log('Access denied: User is not an employer');
    }
  }, [loading, isEmployer, userType]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/companies');
  };

  // 如果正在加载或用户类型不是 employer，显示加载状态
  if (loading || !isEmployer) {
    return (
      <PageTransition>
        <div className={styles.container}>
          <div className={styles.loading}>Loading...</div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.logo}>
              <Link href="/employer/dashboard">
                <img src="/img/logo.png" alt="StarPlan" />
              </Link>
            </div>
            <nav className={styles.nav}>
              <Link href="/employer/dashboard" className={styles.navLink}>
                Dashboard
              </Link>
              
              {/* Job Posts 下拉菜单 */}
              <div className={styles.dropdown} ref={dropdownRef}>
                <button 
                  className={styles.dropdownBtn}
                  onClick={() => setIsJobPostsDropdownOpen(!isJobPostsDropdownOpen)}
                >
                Job Posts
                  <svg 
                    width="12" 
                    height="8" 
                    viewBox="0 0 12 8" 
                    fill="none"
                    className={`${styles.dropdownIcon} ${isJobPostsDropdownOpen ? styles.open : ''}`}
                  >
                    <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
                {isJobPostsDropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    <Link 
                      href="/employer/jobs" 
                      className={styles.dropdownItem}
                      onClick={() => setIsJobPostsDropdownOpen(false)}
                    >
                      All jobs
                    </Link>
                    <Link 
                      href="/employer/jobs/new" 
                      className={styles.dropdownItem}
                      onClick={() => setIsJobPostsDropdownOpen(false)}
                    >
                      Create a Job ad
              </Link>
                  </div>
                )}
              </div>

              <Link href="/employer/candidates" className={styles.navLink}>
                Candidates
              </Link>
              <div className={styles.userMenu}>
                <span className={styles.userEmail}>{user?.email}</span>
                <button onClick={handleSignOut} className={styles.signOutBtn}>
                  Sign Out
                </button>
              </div>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className={styles.main}>
          <div className={styles.welcomeSection}>
            <h1 className={styles.title}>Welcome to Your Employer Dashboard</h1>
            <p className={styles.subtitle}>
              Manage your job posts and find the perfect candidates with AI-powered matching
            </p>
          </div>

          {/* Quick Stats */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <polyline points="17 11 19 13 23 9"></polyline>
                </svg>
              </div>
              <div className={styles.statContent}>
                <div className={styles.statNumber}>0</div>
                <div className={styles.statLabel}>Active Job Posts</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div className={styles.statContent}>
                <div className={styles.statNumber}>0</div>
                <div className={styles.statLabel}>Applications</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <div className={styles.statContent}>
                <div className={styles.statNumber}>0</div>
                <div className={styles.statLabel}>Interviews Scheduled</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
              </div>
              <div className={styles.statContent}>
                <div className={styles.statNumber}>0</div>
                <div className={styles.statLabel}>Candidates Matched</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={styles.actionsSection}>
            <h2 className={styles.sectionTitle}>Quick Actions</h2>
            <div className={styles.actionsGrid}>
              <Link href="/employer/jobs/new" className={styles.actionCard}>
                <div className={styles.actionIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </div>
                <h3>Post a New Job</h3>
                <p>Create and publish a new job posting</p>
              </Link>

              <Link href="/employer/candidates" className={styles.actionCard}>
                <div className={styles.actionIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <h3>Browse Candidates</h3>
                <p>Search and filter through our talent pool</p>
              </Link>

              <Link href="/employer/settings" className={styles.actionCard}>
                <div className={styles.actionIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M12 1v6m0 6v6m8.66-9l-5.2 3m-6.92 4l-5.2 3m0-12l5.2 3m6.92 4l5.2 3"></path>
                  </svg>
                </div>
                <h3>Company Settings</h3>
                <p>Update your company profile and preferences</p>
              </Link>

              <Link href="/help" className={styles.actionCard}>
                <div className={styles.actionIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </div>
                <h3>Help & Support</h3>
                <p>Get help and learn how to use the platform</p>
              </Link>
            </div>
          </div>

          {/* Getting Started */}
          <div className={styles.gettingStarted}>
            <h2 className={styles.sectionTitle}>Getting Started</h2>
            <div className={styles.stepsGrid}>
              <div className={styles.step}>
                <div className={styles.stepNumber}>1</div>
                <h3>Complete Your Company Profile</h3>
                <p>Add your company details, logo, and description to attract top talent</p>
                <Link href="/employer/settings">Complete Profile →</Link>
              </div>

              <div className={styles.step}>
                <div className={styles.stepNumber}>2</div>
                <h3>Post Your First Job</h3>
                <p>Create a detailed job posting to start receiving applications</p>
                <Link href="/employer/jobs/new">Create Job Post →</Link>
              </div>

              <div className={styles.step}>
                <div className={styles.stepNumber}>3</div>
                <h3>Review AI-Matched Candidates</h3>
                <p>Our AI will automatically match qualified candidates to your positions</p>
                <Link href="/employer/candidates">View Matches →</Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
