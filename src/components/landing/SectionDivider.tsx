'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';

const BRAND_COLOR = '#4F67FF';
const BRAND_RGB = '79,103,255';

type DividerVariant = 'wave' | 'curve' | 'angle' | 'dots' | 'gradient' | 'stars';

interface SectionDividerProps {
  variant?: DividerVariant;
  fromColor?: string;
  toColor?: string;
  flip?: boolean;
}

// Wave SVG path
function WaveDivider({ flip, fromColor, toColor }: { flip?: boolean; fromColor: string; toColor: string }) {
  return (
    <div className={`relative w-full overflow-hidden ${flip ? 'rotate-180' : ''}`} style={{ marginTop: -1, marginBottom: -1 }}>
      <svg
        viewBox="0 0 1440 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        preserveAspectRatio="none"
        style={{ display: 'block', height: '60px' }}
      >
        <path
          d="M0 60L48 55C96 50 192 40 288 45C384 50 480 70 576 75C672 80 768 70 864 55C960 40 1056 20 1152 15C1248 10 1344 20 1392 25L1440 30V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V60Z"
          fill={toColor}
        />
      </svg>
      <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${fromColor} 0%, transparent 50%)` }} />
    </div>
  );
}

// Curve SVG
function CurveDivider({ flip, toColor }: { flip?: boolean; toColor: string }) {
  return (
    <div className={`relative w-full overflow-hidden ${flip ? 'rotate-180' : ''}`} style={{ marginTop: -1, marginBottom: -1 }}>
      <svg
        viewBox="0 0 1440 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full"
        preserveAspectRatio="none"
        style={{ display: 'block', height: '50px' }}
      >
        <path
          d="M0 80V40C240 80 480 0 720 0C960 0 1200 80 1440 40V80H0Z"
          fill={toColor}
        />
      </svg>
    </div>
  );
}

// Angle divider
function AngleDivider({ flip, toColor }: { flip?: boolean; toColor: string }) {
  return (
    <div className={`relative w-full overflow-hidden ${flip ? 'rotate-180' : ''}`} style={{ marginTop: -1, marginBottom: -1 }}>
      <svg
        viewBox="0 0 1440 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full"
        preserveAspectRatio="none"
        style={{ display: 'block', height: '40px' }}
      >
        <polygon points="0,60 1440,0 1440,60" fill={toColor} />
      </svg>
    </div>
  );
}

// Animated dots transition
function DotsDivider() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  
  return (
    <div ref={ref} className="py-8 flex items-center justify-center gap-3">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: BRAND_COLOR }}
          initial={{ opacity: 0, scale: 0 }}
          animate={isInView ? { opacity: [0.3, 0.8, 0.3], scale: 1 } : {}}
          transition={{ 
            opacity: { duration: 2, repeat: Infinity, delay: i * 0.2 },
            scale: { duration: 0.3, delay: i * 0.1 }
          }}
        />
      ))}
    </div>
  );
}

// Gradient fade transition
function GradientDivider({ fromColor, toColor }: { fromColor: string; toColor: string }) {
  return (
    <div 
      className="h-24 w-full"
      style={{ background: `linear-gradient(to bottom, ${fromColor}, ${toColor})` }}
    />
  );
}

// Logo divider
function StarsDivider() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  
  return (
    <div ref={ref} className="py-10 relative overflow-hidden">
      <div className="flex items-center justify-center">
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
        >
          {/* Left line */}
          <motion.div 
            className="h-px w-24 md:w-40"
            style={{ background: `linear-gradient(to right, transparent, rgba(${BRAND_RGB},0.3))` }}
            initial={{ scaleX: 0, originX: 1 }}
            animate={isInView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
          
          {/* Logos */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0, rotate: -180 }}
              animate={isInView ? { opacity: 1, scale: 1, rotate: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }}
            >
              <Image 
                src="/Small Logo.svg" 
                alt="" 
                width={i === 1 ? 20 : 16} 
                height={i === 1 ? 20 : 16} 
                className={i === 1 ? 'opacity-80' : 'opacity-50'}
              />
            </motion.div>
          ))}
          
          {/* Right line */}
          <motion.div 
            className="h-px w-24 md:w-40"
            style={{ background: `linear-gradient(to left, transparent, rgba(${BRAND_RGB},0.3))` }}
            initial={{ scaleX: 0, originX: 0 }}
            animate={isInView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
        </motion.div>
      </div>
    </div>
  );
}

export function SectionDivider({ 
  variant = 'dots', 
  fromColor = 'white', 
  toColor = '#FAFAFA',
  flip = false 
}: SectionDividerProps) {
  switch (variant) {
    case 'wave':
      return <WaveDivider flip={flip} fromColor={fromColor} toColor={toColor} />;
    case 'curve':
      return <CurveDivider flip={flip} toColor={toColor} />;
    case 'angle':
      return <AngleDivider flip={flip} toColor={toColor} />;
    case 'dots':
      return <DotsDivider />;
    case 'gradient':
      return <GradientDivider fromColor={fromColor} toColor={toColor} />;
    case 'stars':
      return <StarsDivider />;
    default:
      return <DotsDivider />;
  }
}

export default SectionDivider;
