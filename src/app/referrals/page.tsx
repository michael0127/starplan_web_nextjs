'use client';

import Header from '@/components/Header';
import { PageTransition } from '@/components/PageTransition';
import { SidebarLayout } from '@/components/navigation/SidebarLayout';
import styles from './page.module.css';

export default function ReferralsPage() {
  return (
    <PageTransition>
      <main className={styles.main}>
        <Header />
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


