'use client';

import { PageTransition } from '@/components/PageTransition';
import styles from './page.module.css';
import { OpportunitiesPage as ExploreContent } from '@/components/Opportunities/OpportunitiesPage';
import { SidebarLayout } from '@/components/navigation/SidebarLayout';

export default function ExplorePage() {
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


