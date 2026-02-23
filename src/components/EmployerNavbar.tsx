'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from './EmployerNavbar.module.css';

interface EmployerNavbarProps {
  userEmail?: string;
}

export default function EmployerNavbar({ userEmail }: EmployerNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/companies');
  };

  const isActive = (path: string) => {
    if (path === '/employer/dashboard') {
      return pathname === path;
    }
    if (path === '/employer/jobs') {
      return pathname?.startsWith('/employer/jobs') && !pathname?.includes('/invitations');
    }
    if (path === '/employer/candidates') {
      return pathname?.startsWith('/employer/candidates');
    }
    if (path === '/employer/quick-rank') {
      return pathname?.startsWith('/employer/quick-rank');
    }
    if (path === '/employer/invitations') {
      return pathname?.startsWith('/employer/invitations') || pathname?.includes('/invitations');
    }
    if (path === '/employer/team') {
      return pathname?.startsWith('/employer/team');
    }
    if (path === '/employer/settings') {
      return pathname?.startsWith('/employer/settings');
    }
    return false;
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.logo}>
          <Link href="/employer/dashboard">
            <img src="/img/logo.png" alt="StarPlan" />
          </Link>
        </div>
        <nav className={styles.nav}>
          <Link 
            href="/employer/dashboard" 
            className={`${styles.navLink} ${isActive('/employer/dashboard') ? styles.active : ''}`}
          >
            Dashboard
          </Link>
          <Link 
            href="/employer/jobs" 
            className={`${styles.navLink} ${isActive('/employer/jobs') ? styles.active : ''}`}
          >
            Jobs
          </Link>
          <Link 
            href="/employer/candidates" 
            className={`${styles.navLink} ${isActive('/employer/candidates') ? styles.active : ''}`}
          >
            Candidates
          </Link>
          <Link 
            href="/employer/quick-rank" 
            className={`${styles.navLink} ${isActive('/employer/quick-rank') ? styles.active : ''}`}
          >
            Quick Rank
          </Link>
          <Link 
            href="/employer/invitations" 
            className={`${styles.navLink} ${isActive('/employer/invitations') ? styles.active : ''}`}
          >
            Invitations
          </Link>
          <Link 
            href="/employer/team" 
            className={`${styles.navLink} ${isActive('/employer/team') ? styles.active : ''}`}
          >
            Team
          </Link>
          <Link 
            href="/employer/settings" 
            className={`${styles.navLink} ${isActive('/employer/settings') ? styles.active : ''}`}
          >
            Settings
          </Link>
          <div className={styles.userMenu}>
            <span className={styles.userEmail}>{userEmail}</span>
            <button onClick={handleSignOut} className={styles.signOutBtn}>
              Sign Out
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

