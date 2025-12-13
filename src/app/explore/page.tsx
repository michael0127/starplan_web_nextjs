'use client';

import { PageTransition } from '@/components/PageTransition';
import { useUserType } from '@/hooks/useUserType';
import styles from './page.module.css';
import { OpportunitiesPage as ExploreContent } from '@/components/Opportunities/OpportunitiesPage';
import { SidebarLayout } from '@/components/navigation/SidebarLayout';

export default function ExplorePage() {
  // 权限检查：只允许 CANDIDATE 访问
  const { loading } = useUserType({
    required: 'CANDIDATE',
    redirectTo: '/employer/dashboard',
  });

  if (loading) {
    return (
      <PageTransition>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          Loading...
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <main className={styles.main}>
        <SidebarLayout>
          <ExploreContent />
        </SidebarLayout>
      </main>
    </PageTransition>
  );
}


