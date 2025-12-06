'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { href: '/explore', label: 'Explore', icon: 'explore', requireAuth: false },
  { href: '/resume', label: 'Resume', icon: 'resume', requireAuth: true },
  { href: '/profile', label: 'Profile', icon: 'profile', requireAuth: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, loading: authLoading, signOut } = useAuth();
  const { user: dbUser, loading: dbLoading } = useUser(authUser?.id);

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
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;

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


