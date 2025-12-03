'use client';

import Header from '@/components/Header';
import { PageTransition } from '@/components/PageTransition';
import { SidebarLayout } from '@/components/navigation/SidebarLayout';
import styles from './page.module.css';

export default function ProfilePage() {
  return (
    <PageTransition>
      <main className={styles.main}>
        <Header />
        <SidebarLayout>
          <section>
            <h1>Profile</h1>
            <p>Coming soon: manage your StarPlan profile and preferences.</p>
          </section>
        </SidebarLayout>
      </main>
    </PageTransition>
  );
}


