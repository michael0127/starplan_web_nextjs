'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Image from 'next/image';

// Company logos represented as styled text (since we don't have actual logos)
const companies = [
  { name: 'Anthropic', style: 'font-semibold' },
  { name: 'OpenAI', style: 'font-bold' },
  { name: 'Cohere', style: 'font-medium italic' },
  { name: 'Stability AI', style: 'font-semibold' },
  { name: 'Hugging Face', style: 'font-bold' },
  { name: 'Midjourney', style: 'font-medium' },
  { name: 'Runway', style: 'font-semibold italic' },
  { name: 'Jasper', style: 'font-bold' },
];

export function TrustedBy() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section ref={ref} className="py-16 px-6 bg-surface border-y border-border overflow-hidden relative">
      {/* Subtle animated background */}
      <motion.div
        className="absolute inset-0 -z-10"
        animate={{
          background: [
            'radial-gradient(ellipse at 0% 50%, rgba(79,70,229,0.03) 0%, transparent 50%)',
            'radial-gradient(ellipse at 100% 50%, rgba(139,92,246,0.03) 0%, transparent 50%)',
            'radial-gradient(ellipse at 0% 50%, rgba(79,70,229,0.03) 0%, transparent 50%)',
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.8 }}
        className="max-w-6xl mx-auto"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <Image src="/Small Logo.svg" alt="" width={16} height={16} className="opacity-40" />
          </motion.div>
          <p className="text-center text-sm text-text-muted">
            Trusted by leading AI companies
          </p>
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <Image src="/Small Logo.svg" alt="" width={16} height={16} className="opacity-40" />
          </motion.div>
        </div>
        
        {/* Marquee container */}
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-surface to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-surface to-transparent z-10" />
          
          {/* Scrolling logos - Row 1 */}
          <div className="flex overflow-hidden mb-4">
            <motion.div
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              className="flex shrink-0"
            >
              {[...companies, ...companies].map((company, i) => (
                <motion.div
                  key={i}
                  className="flex items-center justify-center px-10 py-4"
                  whileHover={{ scale: 1.1 }}
                >
                  <span className={`text-xl text-text-muted/50 hover:text-primary transition-colors whitespace-nowrap ${company.style}`}>
                    {company.name}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>
          
          {/* Scrolling logos - Row 2 (reverse direction) */}
          <div className="flex overflow-hidden">
            <motion.div
              animate={{ x: ['-50%', '0%'] }}
              transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
              className="flex shrink-0"
            >
              {[...companies.slice().reverse(), ...companies.slice().reverse()].map((company, i) => (
                <motion.div
                  key={i}
                  className="flex items-center justify-center px-10 py-4"
                  whileHover={{ scale: 1.1 }}
                >
                  <span className={`text-lg text-text-muted/40 hover:text-accent transition-colors whitespace-nowrap ${company.style}`}>
                    {company.name}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export default TrustedBy;
