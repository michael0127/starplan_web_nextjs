'use client';

import Header from '@/components/Header';
import { PageTransition } from '@/components/PageTransition';
import styles from './page.module.css';
import { OpportunitiesPage as ExploreContent } from '@/components/Opportunities/OpportunitiesPage';
import { SidebarLayout } from '@/components/navigation/SidebarLayout';

export default function ExplorePage() {
  return (
    <PageTransition>
      <main className={styles.main}>
        <Header />
        <SidebarLayout>
          <ExploreContent />
        </SidebarLayout>
      </main>
    </PageTransition>
  );
}


