'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { href: '/explore', label: 'Explore', icon: 'explore', requireAuth: false },
  { href: '/resume', label: 'Resume', icon: 'resume', requireAuth: true },
  { href: '/invitations', label: 'Invitations', icon: 'invitations', requireAuth: true },
  { href: '/profile', label: 'Profile', icon: 'profile', requireAuth: true },
];

const PENDING_INVITATIONS_KEY = 'starplan_pending_invitations';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, loading: authLoading, signOut } = useAuth();
  const { user: dbUser, loading: dbLoading } = useUser(authUser?.id);
  
  // Initialize from localStorage to prevent flash
  const [pendingInvitations, setPendingInvitations] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(PENDING_INVITATIONS_KEY);
      return cached ? parseInt(cached, 10) : 0;
    }
    return 0;
  });

  // Fetch pending invitations count for candidates
  useEffect(() => {
    const fetchPendingCount = async () => {
      if (!authUser || dbUser?.userType !== 'CANDIDATE') {
        setPendingInvitations(0);
        localStorage.removeItem(PENDING_INVITATIONS_KEY);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const response = await fetch('/api/user/invitations', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        });

        const data = await response.json();
        if (data.success) {
          const count = data.data.stats.pending || 0;
          setPendingInvitations(count);
          // Cache in localStorage to prevent flash on next load
          if (count > 0) {
            localStorage.setItem(PENDING_INVITATIONS_KEY, count.toString());
          } else {
            localStorage.removeItem(PENDING_INVITATIONS_KEY);
          }
        }
      } catch (error) {
        console.error('Failed to fetch pending invitations:', error);
      }
    };

    fetchPendingCount();
  }, [authUser, dbUser?.userType]);

  // 获取用户显示信息
  const displayName = dbUser?.name || authUser?.email?.split('@')[0] || 'User';
  const displayEmail = authUser?.email || 'user@example.com';
  const avatarInitial = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, item: typeof NAV_ITEMS[0]) => {
    // 如果需要认证但用户未登录，阻止导航并跳转到登录页
    if (item.requireAuth && !authUser) {
      e.preventDefault();
      router.push('/login');
    }
  };

  return (
    <aside className={styles.sidebar} aria-label="Main navigation">
      <Link href="/" className={styles.logo}>
        <Image
          src="/img/logo.png"
          alt="StarPlan Logo"
          width={195}
          height={40}
          priority
        />
      </Link>
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const showBadge = item.href === '/invitations' && pendingInvitations > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.item} ${
                isActive ? styles.itemActive : ''
              }`}
              onClick={(e) => handleNavClick(e, item)}
            >
              <span className={`${styles.icon} ${styles[`icon_${item.icon}`]}`} aria-hidden="true" />
              <span className={styles.label}>{item.label}</span>
              {showBadge && (
                <span className={styles.badge}>{pendingInvitations}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className={styles.footer}>
        {authUser && (
          <button onClick={handleLogout} className={styles.settingsButton}>
            <span className={styles.settingsIcon} aria-hidden="true" />
            <span>Logout</span>
          </button>
        )}
        {authLoading || dbLoading ? (
          <div className={styles.userCard}>
            <div className={styles.avatar} aria-hidden="true">
              <span className={styles.avatarText}>...</span>
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>Loading...</div>
              <div className={styles.userEmail}>Please wait</div>
            </div>
          </div>
        ) : authUser ? (
          <Link 
            href="/profile" 
            className={styles.userCard}
            onClick={(e) => {
              if (!authUser) {
                e.preventDefault();
                router.push('/login');
              }
            }}
          >
            <div className={styles.avatar} aria-hidden="true">
              {dbUser?.avatarUrl ? (
                <img 
                  src={dbUser.avatarUrl} 
                  alt={displayName}
                  className={styles.avatarImage}
                />
              ) : (
                <span className={styles.avatarText}>{avatarInitial}</span>
              )}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{displayName}</div>
              <div className={styles.userEmail}>{displayEmail}</div>
            </div>
          </Link>
        ) : (
          <Link href="/login" className={styles.userCard}>
            <div className={styles.avatar} aria-hidden="true">
              <span className={styles.avatarText}>?</span>
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>Not logged in</div>
              <div className={styles.userEmail}>Click to login</div>
            </div>
          </Link>
        )}
      </div>
    </aside>
  );
}


