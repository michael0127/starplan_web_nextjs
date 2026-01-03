'use client';

import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './layout.module.css';
import {
  DashboardIcon,
  UploadIcon,
  UsersIcon,
  BriefcaseIcon,
  SettingsIcon,
  LogoutIcon,
} from '@/components/admin/SidebarIcons';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Don't show sidebar on login page
  if (pathname === '/admin/login' || pathname === '/admin') {
    return <>{children}</>;
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/admin/dashboard',
      icon: DashboardIcon,
    },
    {
      name: 'Batch Upload',
      path: '/admin/batch-upload',
      icon: UploadIcon,
    },
    {
      name: 'Users',
      path: '/admin/users',
      icon: UsersIcon,
    },
    {
      name: 'Job Postings',
      path: '/admin/jobs',
      icon: BriefcaseIcon,
    },
    {
      name: 'Settings',
      path: '/admin/settings',
      icon: SettingsIcon,
    },
  ];

  return (
    <div className={styles.adminLayout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Image 
            src="/img/logo.png" 
            alt="StarPlan" 
            width={120} 
            height={40}
            priority
          />
          <h2 className={styles.adminTitle}>Admin Panel</h2>
        </div>

        <nav className={styles.nav}>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`${styles.navItem} ${pathname === item.path ? styles.active : ''}`}
              >
                <IconComponent className={styles.navIcon} />
                <span className={styles.navText}>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogoutIcon className={styles.navIcon} />
            <span className={styles.navText}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}

