'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Floating logo component
function FloatingLogo({ x, y, size, delay, duration }: {
  x: string;
  y: string;
  size: number;
  delay: number;
  duration: number;
}) {
  return (
    <motion.div
      className="absolute"
      style={{ left: x, top: y }}
      animate={{
        y: [0, -20, 0],
        opacity: [0.2, 0.5, 0.2],
        rotate: [0, 15, -15, 0],
      }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <Image src="/Small Logo.svg" alt="" width={size} height={size} className="brightness-0 invert opacity-50" />
    </motion.div>
  );
}

export function FinalCTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-32 px-6 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary via-primary-dark to-accent" />
      
      {/* Animated gradient overlay */}
      <motion.div
        className="absolute inset-0 -z-10"
        animate={{
          background: [
            'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 70% 70%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          ],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* Animated orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-white/10 rounded-full blur-3xl"
        animate={{ x: [0, -20, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* Floating stars */}
      <FloatingLogo x="10%" y="20%" size={24} delay={0} duration={6} />
      <FloatingLogo x="85%" y="15%" size={20} delay={1} duration={8} />
      <FloatingLogo x="75%" y="75%" size={22} delay={2} duration={7} />
      <FloatingLogo x="15%" y="70%" size={18} delay={1.5} duration={9} />
      <FloatingLogo x="90%" y="50%" size={20} delay={0.5} duration={6} />
      <FloatingLogo x="5%" y="45%" size={22} delay={2.5} duration={8} />
      <FloatingLogo x="50%" y="10%" size={18} delay={1} duration={7} />
      <FloatingLogo x="60%" y="85%" size={24} delay={0.8} duration={9} />
      
      {/* Grid overlay */}
      <div className="absolute inset-0 -z-10 bg-grid opacity-10" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto text-center relative"
      >
        <motion.div 
          className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm font-medium text-white/80 bg-white/10 rounded-full border border-white/20 backdrop-blur-sm"
          whileHover={{ scale: 1.05 }}
        >
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          >
            <Image src="/Small Logo.svg" alt="" width={16} height={16} className="brightness-0 invert" />
          </motion.span>
          Start hiring smarter today
        </motion.div>
        
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-white mb-6 relative">
          <span className="relative inline-block">
            Ready to build your
            <motion.span
              className="absolute -top-4 -right-8"
              animate={{ rotate: [0, 15, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Image src="/Small Logo.svg" alt="" width={24} height={24} className="brightness-0 invert opacity-60" />
            </motion.span>
          </span>
          <br />
          <span className="relative">
            AI dream team?
            <motion.span
              className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-white/0 via-white/50 to-white/0 rounded-full"
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </span>
        </h2>
        <p className="text-lg text-white/70 mb-10 max-w-md mx-auto">
          Join AI startups already using StarPlan to hire world-class talent.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/companies"
            className="group relative inline-flex items-center gap-2 px-7 py-3.5 text-base font-medium text-primary bg-white hover:bg-white/90 rounded-full shadow-xl transition-all overflow-hidden"
          >
            {/* Shimmer */}
            <motion.span
              className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
            />
            <span className="relative">I'm hiring</span>
            <ArrowRight size={18} className="relative group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white/80 hover:text-white border border-white/30 hover:border-white/50 hover:bg-white/10 rounded-full transition-all"
          >
            I'm a candidate
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

export default FinalCTA;
