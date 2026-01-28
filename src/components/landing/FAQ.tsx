'use client';

import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    q: 'How do you evaluate candidates?',
    a: 'We analyze GitHub activity, research papers, project complexity, and collaboration patterns to score technical ability and predict success.',
  },
  {
    q: 'Does this replace our ATS?',
    a: 'No. StarPlan integrates with your existing ATS or works alongside it. We enhance your pipeline, not replace it.',
  },
  {
    q: 'What roles do you support?',
    a: 'ML Engineers, Research Scientists, LLM Engineers, AI Infrastructure, Applied AI, and related technical roles.',
  },
  {
    q: 'Is it free for candidates?',
    a: 'Yes. Candidates can create a profile, get matched, and apply at no cost.',
  },
  {
    q: 'How fast can we get started?',
    a: 'Most teams receive their first ranked shortlist within a week of onboarding.',
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} id="faq" className="py-32 px-6 relative">
      {/* Subtle background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-surface/30 to-white" />
      
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 text-xs font-medium text-primary bg-primary/5 rounded-full mb-6">
            FAQ
          </span>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-text-primary">
            Common questions
          </h2>
        </motion.div>

        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className={i > 0 ? 'border-t border-border' : ''}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-surface/50 transition-colors"
              >
                <span className="text-base font-medium text-text-primary pr-8">{faq.q}</span>
                <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  open === i ? 'bg-primary text-white' : 'bg-surface text-text-muted'
                }`}>
                  {open === i ? <Minus size={16} /> : <Plus size={16} />}
                </span>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-5 text-text-secondary leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQ;
