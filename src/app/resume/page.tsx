'use client';

import Header from '@/components/Header';
import { PageTransition } from '@/components/PageTransition';
import { SidebarLayout } from '@/components/navigation/SidebarLayout';
import styles from './page.module.css';

export default function ResumePage() {
  return (
    <PageTransition>
      <main className={styles.main}>
        <Header />
        <SidebarLayout>
          <div className={styles.content}>
            <h1 className={styles.title}>Resume</h1>
            <p className={styles.description}>
              Build and manage your professional resume for StarPlan opportunities.
            </p>
            <div className={styles.placeholder}>
              Resume builder coming soon...
            </div>
          </div>
        </SidebarLayout>
      </main>
    </PageTransition>
  );
}

