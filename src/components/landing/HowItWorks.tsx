'use client';

import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ClipboardList, ListOrdered, CheckCircle, FileText, Compass, Send } from 'lucide-react';

const forHiring = [
  { icon: ClipboardList, step: 'Share your role', desc: 'Tell us what you need' },
  { icon: ListOrdered, step: 'Get ranked candidates', desc: 'Scored on real signals' },
  { icon: CheckCircle, step: 'Hire with confidence', desc: 'Every pick explained' },
];

const forCandidates = [
  { icon: FileText, step: 'Upload your profile', desc: 'Resume, GitHub, or papers' },
  { icon: Compass, step: 'Get matched', desc: 'Roles ranked by fit' },
  { icon: Send, step: 'Apply in one click', desc: 'Skip the noise' },
];

export function HowItWorks() {
  const [view, setView] = useState<'hiring' | 'candidates'>('hiring');
  const steps = view === 'hiring' ? forHiring : forCandidates;
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} id="how-it-works" className="py-32 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-surface" />
      <div className="absolute inset-0 -z-10 bg-dots opacity-40" />
      
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16"
        >
          <div>
            <span className="inline-block px-3 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full mb-6">
              How it works
            </span>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-text-primary">
              Three simple steps
            </h2>
          </div>
          
          {/* Toggle */}
          <div className="flex gap-1 p-1.5 bg-white border border-border rounded-full shadow-sm">
            <button
              onClick={() => setView('hiring')}
              className={`px-5 py-2.5 text-sm font-medium rounded-full transition-all ${
                view === 'hiring'
                  ? 'bg-text-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              For hiring
            </button>
            <button
              onClick={() => setView('candidates')}
              className={`px-5 py-2.5 text-sm font-medium rounded-full transition-all ${
                view === 'candidates'
                  ? 'bg-text-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              For candidates
            </button>
          </div>
        </motion.div>

        <motion.div
          key={view}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid md:grid-cols-3 gap-6"
        >
          {steps.map((item, i) => (
            <div 
              key={i} 
              className="relative p-8 bg-white rounded-2xl border border-border shadow-sm"
            >
              {/* Step number */}
              <div className="absolute top-6 right-6 text-5xl font-bold text-border">
                {String(i + 1).padStart(2, '0')}
              </div>
              
              {/* Icon */}
              <div className="w-11 h-11 mb-6 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                <item.icon size={20} className="text-white" />
              </div>
              
              <h3 className="text-lg font-semibold text-text-primary mb-2">{item.step}</h3>
              <p className="text-text-secondary">{item.desc}</p>
              
              {/* Connector */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-border" />
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default HowItWorks;
