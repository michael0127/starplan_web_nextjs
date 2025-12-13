'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageTransition } from '@/components/PageTransition';
import { usePageAnimation } from '@/hooks/usePageAnimation';
import { useUserType } from '@/hooks/useUserType';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

export default function EmployerJobs() {
  const mounted = usePageAnimation();
  const router = useRouter();
  
  // 使用权限检查 hook
  const { user, loading, isEmployer } = useUserType({
    required: 'EMPLOYER',
    redirectTo: '/companies',
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/companies');
  };

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
              <Link href="/employer/jobs" className={styles.navLink + ' ' + styles.active}>
                Job Posts
              </Link>
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
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>Job Posts</h1>
              <p className={styles.pageSubtitle}>
                Manage all your job postings and track applications
              </p>
            </div>
            <Link href="/employer/jobs/new" className={styles.btnPrimary}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Create Job Ad
            </Link>
          </div>

          {/* Empty State */}
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
            <h2 className={styles.emptyTitle}>No job posts yet</h2>
            <p className={styles.emptyDescription}>
              Start by creating your first job posting to find the perfect candidates
            </p>
            <Link href="/employer/jobs/new" className={styles.btnEmptyState}>
              Create Your First Job Ad
            </Link>
          </div>

          {/* Future: Job List */}
          {/* 
          <div className={styles.jobList}>
            <div className={styles.jobCard}>
              <div className={styles.jobHeader}>
                <div>
                  <h3 className={styles.jobTitle}>Senior Software Engineer</h3>
                  <div className={styles.jobMeta}>
                    <span>Sydney, NSW</span>
                    <span>•</span>
                    <span>Full-time</span>
                    <span>•</span>
                    <span>Posted 2 days ago</span>
                  </div>
                </div>
                <div className={styles.jobStatus}>
                  <span className={styles.statusBadge + ' ' + styles.active}>Active</span>
                </div>
              </div>
              <div className={styles.jobStats}>
                <div className={styles.stat}>
                  <span className={styles.statNumber}>24</span>
                  <span className={styles.statLabel}>Applications</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statNumber}>8</span>
                  <span className={styles.statLabel}>Shortlisted</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statNumber}>2</span>
                  <span className={styles.statLabel}>Interviews</span>
                </div>
              </div>
              <div className={styles.jobActions}>
                <button className={styles.btnSecondary}>View Applications</button>
                <button className={styles.btnSecondary}>Edit</button>
                <button className={styles.btnSecondary}>Close</button>
              </div>
            </div>
          </div>
          */}
        </main>
      </div>
    </PageTransition>
  );
}



