'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { TrendingUp, Clock, Target, Users } from 'lucide-react';

const stats = [
  { icon: Clock, value: 45, suffix: '%', label: 'Faster time-to-hire', color: 'text-emerald-500 bg-emerald-50' },
  { icon: Target, value: 3, suffix: 'x', label: 'Better candidate fit', color: 'text-blue-500 bg-blue-50' },
  { icon: TrendingUp, value: 92, suffix: '%', label: 'Interview-to-offer rate', color: 'text-violet-500 bg-violet-50' },
  { icon: Users, value: 500, suffix: '+', label: 'AI candidates ranked', color: 'text-amber-500 bg-amber-50' },
];

function AnimatedNumber({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    
    let start = 0;
    const duration = 2000;
    const step = Math.ceil(value / (duration / 16));
    
    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {count}{suffix}
    </span>
  );
}

export function Stats() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-24 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary via-primary-dark to-accent" />
      
      {/* Floating shapes */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid opacity-10" />
      
      <div className="max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
            Results that speak
          </h2>
          <p className="text-white/70 max-w-lg mx-auto">
            Our AI-powered ranking delivers measurable outcomes for both companies and candidates.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 text-center group hover:bg-white/20 transition-all"
            >
              <div className={`w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-xl ${stat.color}`}>
                <stat.icon size={22} />
              </div>
              <div className="text-4xl font-bold text-white mb-2">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-sm text-white/70">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Stats;
