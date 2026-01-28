'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { BarChart3, TrendingUp, FileCheck } from 'lucide-react';
import Image from 'next/image';

const points = [
  {
    icon: BarChart3,
    title: 'Signal over noise',
    description: 'We analyze GitHub commits, paper citations, and project complexity—not resume keywords.',
    color: 'from-blue-500 to-indigo-600',
    glow: 'rgba(59,130,246,0.3)',
  },
  {
    icon: TrendingUp,
    title: 'Predictive ranking',
    description: 'Our model learns from real outcomes to predict who will succeed in your specific role.',
    color: 'from-violet-500 to-purple-600',
    glow: 'rgba(139,92,246,0.3)',
  },
  {
    icon: FileCheck,
    title: 'Clear reasoning',
    description: 'Every recommendation includes transparent logic. You see why, not just who.',
    color: 'from-emerald-500 to-teal-600',
    glow: 'rgba(16,185,129,0.3)',
  },
];

export function WhyStarPlan() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} id="product" className="py-32 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-surface/50 to-white" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      {/* Floating decorations */}
      <motion.div
        className="absolute top-20 left-10 opacity-20"
        animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Image src="/Small Logo.svg" alt="" width={40} height={40} />
      </motion.div>
      <motion.div
        className="absolute bottom-20 right-10 opacity-20"
        animate={{ y: [0, 15, 0], rotate: [0, -10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Image src="/Small Logo.svg" alt="" width={32} height={32} />
      </motion.div>
      
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <motion.span 
            className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-medium text-primary bg-primary/5 border border-primary/20 rounded-full mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              <Image src="/Small Logo.svg" alt="" width={14} height={14} />
            </motion.span>
            Why StarPlan
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-text-primary">
            AI hiring that actually works
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {points.map((point, index) => (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group relative p-8 bg-white rounded-2xl border border-border hover:border-primary/30 transition-all duration-300"
              style={{ boxShadow: 'none' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 20px 40px -15px ${point.glow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Animated icon */}
              <motion.div 
                className={`w-14 h-14 mb-6 rounded-xl bg-gradient-to-br ${point.color} flex items-center justify-center shadow-lg`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <point.icon size={24} className="text-white" />
              </motion.div>
              
              <h3 className="text-xl font-semibold text-text-primary mb-3 group-hover:text-primary transition-colors">
                {point.title}
              </h3>
              <p className="text-text-secondary leading-relaxed">
                {point.description}
              </p>
              
              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden rounded-tr-2xl">
                <motion.div
                  className={`absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br ${point.color} opacity-0 group-hover:opacity-10 transition-opacity`}
                  style={{ borderRadius: '50%' }}
                />
              </div>
              
              {/* Hover gradient */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default WhyStarPlan;
