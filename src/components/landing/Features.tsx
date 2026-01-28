'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Layers, Shield, Zap, Globe, BarChart2, RefreshCw } from 'lucide-react';

const features = [
  {
    icon: Layers,
    title: 'Multi-signal analysis',
    description: 'GitHub, papers, projects, and work history combined into one score.',
  },
  {
    icon: Shield,
    title: 'Bias reduction',
    description: 'Objective metrics minimize unconscious bias in candidate evaluation.',
  },
  {
    icon: Zap,
    title: 'Real-time ranking',
    description: 'Candidates ranked instantly as they apply, not after weeks of review.',
  },
  {
    icon: Globe,
    title: 'Global talent pool',
    description: 'Access candidates from North America, Australia, and beyond.',
  },
  {
    icon: BarChart2,
    title: 'Outcome tracking',
    description: 'Our model improves from real hiring outcomes and performance data.',
  },
  {
    icon: RefreshCw,
    title: 'Continuous learning',
    description: 'The more you hire, the better our predictions become for your team.',
  },
];

export function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-32 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-white" />
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-primary/5 to-transparent -z-10" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-accent/5 to-transparent -z-10" />
      
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 text-xs font-medium text-accent bg-accent/10 rounded-full mb-6">
            Platform features
          </span>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-text-primary mb-6">
            Built for modern hiring
          </h2>
          <p className="text-xl text-text-secondary max-w-lg mx-auto">
            Everything you need to find and hire the best AI talent, faster.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative"
            >
              <div className="p-8 h-full bg-surface rounded-2xl border border-border hover:border-primary/30 hover:bg-white transition-all duration-300">
                {/* Decorative line */}
                <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <feature.icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary mb-2 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
