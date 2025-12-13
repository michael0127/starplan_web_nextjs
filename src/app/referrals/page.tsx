'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageTransition } from '@/components/PageTransition';
import { SidebarLayout } from '@/components/navigation/SidebarLayout';
import { useAuth } from '@/hooks/useAuth';
import { useUserType } from '@/hooks/useUserType';
import styles from './page.module.css';

export default function ReferralsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  // 权限检查：只允许 CANDIDATE 访问
  const { loading: userTypeLoading, isCandidate } = useUserType({
    required: 'CANDIDATE',
    redirectTo: '/employer/dashboard',
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // 显示加载状态
  if (loading || userTypeLoading || !isCandidate) {
    return (
      <PageTransition>
        <main className={styles.main}>
          <SidebarLayout>
            <section>
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
          <section>
            <h1>Referrals</h1>
            <p>Coming soon: track and manage your StarPlan referral rewards.</p>
          </section>
        </SidebarLayout>
      </main>
    </PageTransition>
  );
}


