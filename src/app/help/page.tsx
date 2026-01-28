'use client';

import Link from 'next/link';
import { PageTransition } from '@/components/PageTransition';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import styles from './page.module.css';

export default function HelpCentre() {
  return (
    <PageTransition>
      <div className={styles.container}>
        <Header />
        <main className={styles.main}>
          <div className={styles.content}>
            <h1 className={styles.title}>Help Centre</h1>
            <p className={styles.subtitle}>
              We're here to help. Browse our frequently asked questions or get in touch with our support team.
            </p>

            <div className={styles.contactSection}>
              <div className={styles.contactCard}>
                <h2>Contact Support</h2>
                <p className={styles.phone}>+61 413 678 116</p>
                <p className={styles.hours}>Mon - Fri, 8:30am - 6pm AEST</p>
              </div>

              <div className={styles.contactCard}>
                <h2>Email Us</h2>
                <p>
                  <a href="mailto:hello@starplan.ai" className={styles.email}>
                    hello@starplan.ai
                  </a>
                </p>
                <p className={styles.note}>We'll respond within 24 hours</p>
              </div>
            </div>

            <div className={styles.faqSection}>
              <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
              
              <div className={styles.faqItem}>
                <h3>How does the AI matching work?</h3>
                <p>
                  Our AI-powered platform analyzes your skills, experience, and preferences to match you with the most suitable opportunities. The more information you provide in your profile, the better the matches will be.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3>Is StarPlan free to use?</h3>
                <p>
                  Yes! Creating a profile and exploring opportunities is completely free for candidates. Employers can post jobs and access our matching platform through our various subscription plans.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3>How long does it take to set up my profile?</h3>
                <p>
                  Setting up your basic profile takes just 5-10 minutes. You can always come back later to add more details and improve your matches.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3>Can I edit my profile after creating it?</h3>
                <p>
                  Absolutely! You can update your profile, skills, and preferences at any time from your dashboard.
                </p>
              </div>
            </div>

            <div className={styles.backLink}>
              <Link href="/">← Back to Home</Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
}
