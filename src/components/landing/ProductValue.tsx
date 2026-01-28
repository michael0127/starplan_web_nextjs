'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Code2, GitBranch, Zap, Users } from 'lucide-react';

const signals = [
  { icon: Code2, label: 'Technical depth', desc: 'Code quality & architecture', color: 'text-blue-600 bg-blue-50' },
  { icon: GitBranch, label: 'Project complexity', desc: 'Real challenges solved', color: 'text-violet-600 bg-violet-50' },
  { icon: Zap, label: 'Learning velocity', desc: 'Speed of adoption', color: 'text-amber-600 bg-amber-50' },
  { icon: Users, label: 'Collaboration', desc: 'Team & OSS work', color: 'text-emerald-600 bg-emerald-50' },
];

export function ProductValue() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} id="for-hr" className="py-32 px-6 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white via-primary/5 to-white" />
      
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 text-xs font-medium text-primary bg-primary/5 rounded-full mb-6">
            The engine
          </span>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-text-primary mb-6">
            Four signals that matter
          </h2>
          <p className="text-xl text-text-secondary max-w-lg mx-auto">
            We look beyond resumes to evaluate what predicts success.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {signals.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group p-6 bg-white rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 text-center"
            >
              <div className={`w-14 h-14 mx-auto mb-4 flex items-center justify-center rounded-2xl ${s.color}`}>
                <s.icon size={24} />
              </div>
              <div className="font-semibold text-text-primary mb-1">{s.label}</div>
              <div className="text-sm text-text-muted">{s.desc}</div>
            </motion.div>
          ))}
        </div>

        {/* Visual separator */}
        <div className="mt-20 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 text-sm text-text-muted bg-white">
              Trusted by AI startups in North America & Australia
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductValue;
