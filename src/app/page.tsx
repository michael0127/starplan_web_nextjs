'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Banner from '@/components/Banner';
import HowItWorks from '@/components/HowItWorks';
import FindAJob from '@/components/FindAJob';
import WhyChoose from '@/components/WhyChoose';
import GetStarPlan from '@/components/GetStarPlan';
import SectionWrapper from '@/components/common/SectionWrapper';
import { useHashScroll } from '@/hooks/useHashScroll';
import styles from './page.module.css';

export default function Home() {
  useHashScroll();

  return (
    <main className={styles.main}>
      <Header />
      <SectionWrapper animationType="fadeIn" delay={0}>
        <Banner />
      </SectionWrapper>
      <SectionWrapper animationType="fadeUp" delay={100}>
        <HowItWorks />
      </SectionWrapper>
      <SectionWrapper animationType="slideRight" delay={200}>
        <FindAJob />
      </SectionWrapper>
      <SectionWrapper animationType="fadeUp" delay={100}>
        <WhyChoose />
      </SectionWrapper>
      <SectionWrapper animationType="slideLeft" delay={200}>
        <GetStarPlan />
      </SectionWrapper>
      <Footer />
    </main>
  );
}

