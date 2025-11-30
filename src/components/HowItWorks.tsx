'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './HowItWorks.module.css';

const steps = [
  {
    title: 'Create Your Profile',
    description: 'Upload your resume or connect LinkedIn. Our AI builds a smart profile that highlights your top skills and experiences.',
    image: '/img/pc-howWork1-4x.png',
  },
  {
    title: 'Complete an AI Interview',
    description: 'Showcase your communication and problem-solving skills via structured questions — anytime, anywhere.',
    image: '/img/ai_default.png',
  },
  {
    title: 'Get Matched Instantly',
    description: 'Browse open roles or let us suggest top-fit positions. You\'ll see exactly why a role is a match — no guesswork.',
    image: '/img/pc-howWork2.png',
  },
  {
    title: 'Track Your Progress',
    description: 'Get real-time updates as your application moves through the hiring pipeline. No more silence.',
    image: '/img/pc-howWork4.png',
  },
];

export default function HowItWorks() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section id="how" className={styles.how}>
      <div className={styles.cont}>
        <div className={styles.left}>
          <div className={styles.tit}>How it works</div>
          <p className={styles.description}>
            Apply easily with the StarPlan in four steps to advance your career path.
          </p>
          {steps.map((step, index) => (
            <div key={index} className={styles.item}>
              <div className={styles.subt}>
                {step.title}
                <div
                  className={`${styles.imgs} ${activeIndex === index ? styles.on : ''}`}
                  onClick={() => setActiveIndex(index)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setActiveIndex(index);
                    }
                  }}
                >
                  <Image
                    src="/img/jj.png"
                    alt=""
                    className={styles.img1}
                    width={24}
                    height={24}
                  />
                  <Image
                    src="/img/j.png"
                    alt=""
                    className={styles.img2}
                    width={24}
                    height={24}
                  />
                </div>
              </div>
              <div
                className={`${styles.b} ${activeIndex === index ? styles.active : ''}`}
              >
                {step.description}
              </div>
            </div>
          ))}
        </div>
        <div className={styles.right}>
          {steps.map((step, index) => (
            <Image
              key={index}
              src={step.image}
              alt={step.title}
              className={`${styles.img} ${activeIndex === index ? styles.active : ''}`}
              width={550}
              height={400}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

