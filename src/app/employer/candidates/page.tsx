'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageTransition } from '@/components/PageTransition';
import { usePageAnimation } from '@/hooks/usePageAnimation';
import { useUserType } from '@/hooks/useUserType';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

export default function EmployerCandidates() {
  const mounted = usePageAnimation();
  const router = useRouter();
  
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
              <Link href="/employer/jobs" className={styles.navLink}>
                Job Posts
              </Link>
              <Link href="/employer/candidates" className={styles.navLink + ' ' + styles.active}>
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

        <main className={styles.main}>
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Candidates</h1>
            <p className={styles.pageSubtitle}>
              Browse and manage candidates for your job postings
            </p>
          </div>

          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h2 className={styles.emptyTitle}>No candidates yet</h2>
            <p className={styles.emptyDescription}>
              Create a job posting to start receiving applications from qualified candidates
            </p>
            <Link href="/employer/jobs/new" className={styles.btnEmptyState}>
              Create Your First Job Ad
            </Link>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}



