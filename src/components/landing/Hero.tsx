'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Brand color
const BRAND_COLOR = '#4F67FF';
const BRAND_RGB = '79,103,255';

// Floating particle
function FloatingParticle({ x, y, delay, size }: { x: string; y: string; delay: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{ left: x, top: y, width: size, height: size, backgroundColor: `rgba(${BRAND_RGB},0.4)` }}
      animate={{
        y: [0, -30, 0],
        opacity: [0.3, 0.8, 0.3],
        scale: [1, 1.2, 1],
      }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  );
}

// Shooting star
function ShootingStar({ delay }: { delay: number }) {
  return (
    <motion.div
      className="absolute w-1 h-1 rounded-full"
      style={{ left: '10%', top: '20%', backgroundColor: BRAND_COLOR }}
      initial={{ x: 0, y: 0, opacity: 0 }}
      animate={{
        x: [0, 300],
        y: [0, 150],
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        repeatDelay: 8,
        delay,
        ease: 'easeOut',
      }}
    >
      <div 
        className="absolute w-20 h-px -translate-x-full" 
        style={{ background: `linear-gradient(to right, ${BRAND_COLOR}, transparent)` }}
      />
    </motion.div>
  );
}

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        {/* Gradient base */}
        <div 
          className="absolute inset-0" 
          style={{ background: `linear-gradient(to bottom right, white, rgba(${BRAND_RGB},0.05), rgba(${BRAND_RGB},0.03))` }}
        />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid opacity-40" />
        
        {/* Animated gradient mesh */}
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              `radial-gradient(circle at 20% 30%, rgba(${BRAND_RGB},0.15) 0%, transparent 50%)`,
              `radial-gradient(circle at 80% 70%, rgba(${BRAND_RGB},0.12) 0%, transparent 50%)`,
              `radial-gradient(circle at 50% 50%, rgba(${BRAND_RGB},0.1) 0%, transparent 50%)`,
              `radial-gradient(circle at 20% 30%, rgba(${BRAND_RGB},0.15) 0%, transparent 50%)`,
            ],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Floating gradient orbs */}
        <motion.div
          className="absolute top-1/4 -left-32 w-96 h-96 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, rgba(${BRAND_RGB},0.3) 0%, transparent 70%)` }}
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, rgba(${BRAND_RGB},0.25) 0%, transparent 70%)` }}
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Central glow */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, rgba(${BRAND_RGB},0.08) 0%, transparent 60%)` }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Floating particles */}
        <FloatingParticle x="15%" y="25%" delay={0} size={4} />
        <FloatingParticle x="85%" y="20%" delay={1} size={3} />
        <FloatingParticle x="70%" y="75%" delay={2} size={5} />
        <FloatingParticle x="25%" y="80%" delay={1.5} size={3} />
        <FloatingParticle x="90%" y="50%" delay={0.5} size={4} />
        <FloatingParticle x="5%" y="60%" delay={2.5} size={3} />
        <FloatingParticle x="45%" y="15%" delay={1.2} size={4} />
        <FloatingParticle x="55%" y="85%" delay={0.8} size={3} />
        
        {/* Shooting stars */}
        <ShootingStar delay={0} />
        <ShootingStar delay={5} />
        
        {/* Fade overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-transparent to-white/80" />
      </div>

      <div className="max-w-4xl mx-auto text-center relative">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <span 
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white/80 backdrop-blur-sm rounded-full shadow-lg"
            style={{ color: BRAND_COLOR, borderColor: `rgba(${BRAND_RGB},0.2)`, borderWidth: 1, boxShadow: `0 10px 15px -3px rgba(${BRAND_RGB},0.1)` }}
          >
            <motion.span
              className="w-2 h-2 bg-success rounded-full"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            Now serving AI startups
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-text-primary mb-6 relative"
        >
          <span className="relative inline-block">
            Hire AI talent
            {/* Decorative logo */}
            <motion.span
              className="absolute -top-6 -right-10"
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Image src="/Small Logo.svg" alt="" width={28} height={28} />
            </motion.span>
          </span>
          <br />
          <span className="relative">
            <span style={{ color: BRAND_COLOR }}>
              ranked for success
            </span>
            {/* Underline effect */}
            <motion.span
              className="absolute -bottom-2 left-0 right-0 h-1 rounded-full"
              style={{ background: `linear-gradient(to right, transparent, ${BRAND_COLOR}, transparent)` }}
              animate={{ scaleX: [0, 1, 0], x: ['-50%', '0%', '50%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-text-secondary max-w-xl mx-auto mb-12"
        >
          We analyze code, papers, and projects to predict who will succeed—not just who matches keywords.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/companies"
            className="group relative inline-flex items-center gap-2 px-7 py-3.5 text-base font-medium text-white rounded-full transition-all duration-300 hover:-translate-y-0.5 overflow-hidden"
            style={{ 
              background: `linear-gradient(to right, ${BRAND_COLOR}, #3A4FE8)`,
              boxShadow: `0 10px 15px -3px rgba(${BRAND_RGB},0.25)`
            }}
          >
            {/* Shimmer effect */}
            <motion.span
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            />
            <span className="relative">I'm hiring</span>
            <ArrowRight size={18} className="relative group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-text-secondary hover:text-text-primary bg-white/50 backdrop-blur-sm border border-border hover:border-primary/30 rounded-full transition-all hover:shadow-lg"
          >
            I'm a candidate
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-24 pt-12 border-t border-border/50"
        >
          <div className="flex items-center justify-center gap-12 md:gap-20">
            {[
              { value: '45%', label: 'faster hiring' },
              { value: '4.8', label: 'satisfaction' },
              { value: '12+', label: 'active clients' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                className={`text-center ${i === 2 ? 'hidden sm:block' : ''}`}
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  className="text-3xl font-semibold"
                  style={{ color: BRAND_COLOR }}
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-sm text-text-muted mt-1">{stat.label}</div>
              </motion.div>
            ))}
            <div className="w-px h-10 bg-border hidden sm:block" style={{ order: 1 }} />
            <div className="w-px h-10 bg-border" style={{ order: 3 }} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
