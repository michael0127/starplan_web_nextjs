'use client';

import { Section, SectionHeader } from './Section';
import { Target, Cpu, Eye } from 'lucide-react';

const trustPoints = [
  {
    icon: Target,
    title: 'Outcome focus',
    description:
      'We measure success by hires that work out, not by resumes delivered. Our incentives align with yours.',
  },
  {
    icon: Cpu,
    title: 'AI-only specialization',
    description:
      'We only recruit for AI roles. This vertical focus means deeper pattern recognition and better candidate networks.',
  },
  {
    icon: Eye,
    title: 'Transparent reasoning',
    description:
      'Every ranking comes with explainability. You see why each candidate was recommended, not just that they were.',
  },
];

const stats = [
  { value: '4.8/5', label: 'Founder satisfaction' },
  { value: '12+', label: 'Active engagements' },
  { value: '45%', label: 'Faster time-to-hire' },
];

export function SocialProof() {
  return (
    <Section id="for-candidates">
      <SectionHeader
        badge="Trust"
        title="Why founders trust us"
        description="From AI startups in North America and Australia — teams that can't afford hiring mistakes."
      />

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-12 p-6 bg-surface border border-border rounded-2xl">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <div className="text-2xl md:text-3xl font-semibold text-text-primary">
              {stat.value}
            </div>
            <div className="text-sm text-text-muted">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Trust Points */}
      <div className="grid md:grid-cols-3 gap-6">
        {trustPoints.map((point, index) => (
          <div
            key={index}
            className="p-6 bg-surface border border-border rounded-2xl"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center mb-4">
              <point.icon size={20} className="text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              {point.title}
            </h3>
            <p className="text-text-secondary leading-relaxed">
              {point.description}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export default SocialProof;
