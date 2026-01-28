'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const tiers = [
  {
    name: 'Starter',
    price: '$399',
    period: '',
    desc: 'Perfect for a single hire',
    features: [
      'Any job posting for 4 weeks',
      '1 AI ranking at account level',
      'Candidate shortlist',
      'Email support',
    ],
    cta: 'Get started',
    primary: false,
  },
  {
    name: 'Growth',
    price: '$799',
    period: '',
    desc: 'Best value for growing teams',
    features: [
      'Any job posting for 4 weeks',
      '5 AI rankings at account level',
      'Priority candidate matching',
      'Detailed ranking insights',
      'Priority support',
    ],
    cta: 'Get started',
    primary: true,
    recommended: true,
  },
  {
    name: 'Scale',
    price: '$1,099',
    period: '',
    desc: 'For high-volume hiring',
    features: [
      'Any job posting for 4 weeks',
      '10 AI rankings at account level',
      'Advanced signal analysis',
      'Bulk candidate processing',
      'Dedicated success manager',
    ],
    cta: 'Get started',
    primary: false,
  },
];

const enterprise = {
  name: 'Enterprise',
  desc: 'For teams with 2+ accounts',
  features: ['Custom volume pricing', 'Unlimited rankings', 'API access', 'SSO & security', 'Dedicated support'],
};

export function Pricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} id="pricing" className="py-32 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-surface" />
      <div className="absolute inset-0 -z-10 bg-grid opacity-30" />
      
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full mb-6">
            Pricing
          </span>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-text-primary mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-text-secondary max-w-lg mx-auto">
            One price per plan. No subscriptions. No hidden fees.
          </p>
        </motion.div>

        {/* Main tiers */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative p-8 rounded-2xl transition-all duration-300 ${
                tier.primary
                  ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-2xl shadow-primary/20 scale-105'
                  : 'bg-white border border-border hover:border-primary/30 hover:shadow-lg'
              }`}
            >
              {tier.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-medium bg-accent text-white rounded-full">
                  Recommended
                </div>
              )}
              
              <div className="mb-6">
                <div className={`text-sm font-medium mb-2 ${tier.primary ? 'text-white/70' : 'text-text-muted'}`}>
                  {tier.name}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-semibold">{tier.price}</span>
                  {tier.period && (
                    <span className={`text-sm ${tier.primary ? 'text-white/60' : 'text-text-muted'}`}>
                      {tier.period}
                    </span>
                  )}
                </div>
                <div className={`text-sm mt-2 ${tier.primary ? 'text-white/70' : 'text-text-secondary'}`}>
                  {tier.desc}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm">
                    <Check size={16} className={`mt-0.5 shrink-0 ${tier.primary ? 'text-white/80' : 'text-success'}`} />
                    <span className={tier.primary ? 'text-white/90' : 'text-text-secondary'}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/companies"
                className={`group flex items-center justify-center gap-2 w-full py-3 text-sm font-medium rounded-full transition-all ${
                  tier.primary
                    ? 'bg-white text-primary hover:bg-white/90'
                    : 'bg-surface-2 hover:bg-text-primary hover:text-white text-text-primary'
                }`}
              >
                {tier.cta}
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Enterprise tier */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="p-8 bg-white border border-border rounded-2xl"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className="text-xl font-semibold text-text-primary mb-1">{enterprise.name}</h3>
              <p className="text-text-secondary mb-4">{enterprise.desc}</p>
              <div className="flex flex-wrap gap-3">
                {enterprise.features.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 text-sm bg-surface rounded-full text-text-secondary">
                    <Check size={14} className="text-success" />
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <Link
              href="mailto:hello@starplan.ai?subject=Enterprise%20Inquiry"
              className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-text-primary bg-surface-2 hover:bg-text-primary hover:text-white rounded-full transition-all"
            >
              Contact sales
              <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>

        {/* Note */}
        <p className="text-center text-sm text-text-muted mt-8">
          Each plan includes any job posting for 4 weeks. AI rankings can be used across all jobs in your account.
        </p>
      </div>
    </section>
  );
}

export default Pricing;
