'use client';

import { Section, SectionHeader } from './Section';
import { ArrowRight, Database, Lock, Cpu, Layers } from 'lucide-react';

const flywheelSteps = [
  'SaaS usage',
  'Agency placements',
  'Interview outcomes',
  'Performance signals',
  'Model improves',
  'Better rankings',
  'More customers',
];

const advantages = [
  {
    icon: Database,
    title: 'Private dataset',
    description:
      'We collect outcome data that no public dataset has: who got hired, who succeeded, and why.',
  },
  {
    icon: Lock,
    title: 'Outcome-driven',
    description:
      'Our rankings are trained on real hiring decisions and post-hire performance, not proxy metrics.',
  },
  {
    icon: Cpu,
    title: 'Vertical focus',
    description:
      'AI-only specialization means deeper signal extraction for ML, LLM, and infrastructure roles.',
  },
  {
    icon: Layers,
    title: 'Hybrid advantage',
    description:
      'SaaS + Agency model creates a data flywheel: more placements → better model → better placements.',
  },
];

export function Flywheel() {
  return (
    <Section id="flywheel">
      <SectionHeader
        badge="Defensibility"
        title="A moat that deepens with use"
        description="Our hybrid SaaS + Agency model creates compounding data advantages that pure software can't replicate."
      />

      {/* Flywheel Flow */}
      <div className="mb-16 p-8 bg-surface border border-border rounded-2xl">
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
          {flywheelSteps.map((step, index) => (
            <div key={index} className="flex items-center gap-2 md:gap-3">
              <span className="px-3 py-1.5 text-sm font-medium text-text-primary bg-white border border-border rounded-lg whitespace-nowrap">
                {step}
              </span>
              {index < flywheelSteps.length - 1 && (
                <ArrowRight size={16} className="text-text-muted shrink-0" />
              )}
            </div>
          ))}
          <ArrowRight size={16} className="text-primary shrink-0 hidden md:block" />
          <span className="text-sm text-primary font-medium hidden md:block">
            (repeat)
          </span>
        </div>
      </div>

      {/* Advantages Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {advantages.map((advantage, index) => (
          <div
            key={index}
            className="flex items-start gap-4 p-6 bg-surface border border-border rounded-2xl"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center shrink-0">
              <advantage.icon size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-1">
                {advantage.title}
              </h3>
              <p className="text-text-secondary leading-relaxed">
                {advantage.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

export default Flywheel;
