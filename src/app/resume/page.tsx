'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageTransition } from '@/components/PageTransition';
import { SidebarLayout } from '@/components/navigation/SidebarLayout';
import { useAuth } from '@/hooks/useAuth';
import styles from './page.module.css';

export default function ResumePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // 显示加载状态
  if (loading) {
    return (
      <PageTransition>
        <main className={styles.main}>
          <SidebarLayout>
            <section className={styles.inner}>
              <p>Loading...</p>
            </section>
          </SidebarLayout>
        </main>
      </PageTransition>
    );
  }

  // 如果没有用户，返回 null（会被重定向）
  if (!user) {
    return null;
  }

  return (
    <PageTransition>
      <main className={styles.main}>
        <SidebarLayout>
          <section className={styles.inner}>
            <div className={styles.headerRow}>
              <div className={styles.titleGroup}>
                <h1 className={styles.title}>Resume</h1>
                <p className={styles.subtitle}>
                  Build and manage your professional resume for StarPlan opportunities.
                </p>
              </div>
            </div>
            <div className={styles.content}>
              <div className={styles.placeholder}>
                Resume builder coming soon...
              </div>
            </div>
          </section>
        </SidebarLayout>
      </main>
    </PageTransition>
  );
}

