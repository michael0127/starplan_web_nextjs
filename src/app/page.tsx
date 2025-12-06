'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import LatestRoles from '@/components/LatestRoles';
import HowItWorks from '@/components/HowItWorks';
import FindAJob from '@/components/FindAJob';
import WhyChoose from '@/components/WhyChoose';
import GetStarPlan from '@/components/GetStarPlan';
import SectionWrapper from '@/components/common/SectionWrapper';
import { PageTransition } from '@/components/PageTransition';
import { useHashScroll } from '@/hooks/useHashScroll';
import styles from './page.module.css';

declare global {
  interface Window {
    Calendly: {
      initBadgeWidget: (options: {
        url: string;
        text: string;
        color: string;
        textColor: string;
        branding: boolean;
      }) => void;
    };
  }
}

export default function Home() {
  useHashScroll();

  useEffect(() => {
    if (window.Calendly) {
      window.Calendly.initBadgeWidget({
        url: 'https://calendly.com/hello-starplan',
        text: 'Book Consultation',
        color: '#4a5bf4',
        textColor: '#ffffff',
        branding: false,
      });
    }
  }, []);

  // Apply minimal styles to Calendly badge
  useEffect(() => {
    const applyMinimalStyles = () => {
      const badgeSelectors = [
        '[data-calendly-badge]',
        '.calendly-badge-widget',
        'div[id*="calendly"]',
        'a[href*="calendly.com"]',
      ];

      badgeSelectors.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element) => {
          const htmlElement = element as HTMLElement;
          
          // Skip if already styled
          if (htmlElement.dataset.minimalStyled === 'true') return;
          htmlElement.dataset.minimalStyled = 'true';
          
          // Minimal styling
          htmlElement.style.fontFamily = 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
          htmlElement.style.fontSize = '14px';
          htmlElement.style.fontWeight = '400';
          htmlElement.style.letterSpacing = '0.2px';
          htmlElement.style.borderRadius = '24px';
          htmlElement.style.padding = '10px 20px';
          htmlElement.style.boxShadow = '0 2px 8px rgba(74, 91, 244, 0.15)';
          htmlElement.style.transition = 'all 0.2s ease';
          htmlElement.style.border = 'none';
          htmlElement.style.textTransform = 'none';
          
          // Minimal hover effect
          htmlElement.addEventListener('mouseenter', () => {
            htmlElement.style.boxShadow = '0 4px 12px rgba(74, 91, 244, 0.25)';
            htmlElement.style.transform = 'translateY(-1px)';
          });
          
          htmlElement.addEventListener('mouseleave', () => {
            htmlElement.style.boxShadow = '0 2px 8px rgba(74, 91, 244, 0.15)';
            htmlElement.style.transform = '';
          });
        });
      });
    };

    // Apply styles immediately and periodically until badge appears
    applyMinimalStyles();
    const interval = setInterval(() => {
      applyMinimalStyles();
    }, 500);

    // Cleanup
    return () => clearInterval(interval);
  }, []);

  return (
    <PageTransition>
      <main className={styles.main}>
        <Script
          src="https://assets.calendly.com/assets/external/widget.js"
          strategy="afterInteractive"
          onLoad={() => {
            if (window.Calendly) {
              window.Calendly.initBadgeWidget({
                url: 'https://calendly.com/hello-starplan',
                text: 'Book Consultation',
                color: '#4a5bf4',
                textColor: '#ffffff',
                branding: false,
              });
            }
          }}
        />
        <Header />
        <SectionWrapper animationType="fadeIn" delay={0}>
          <Hero />
        </SectionWrapper>
        <SectionWrapper animationType="fadeUp" delay={100}>
          <LatestRoles />
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
    </PageTransition>
  );
}

