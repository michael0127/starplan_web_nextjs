import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Terms of Service — StarPlan',
  description: 'Read the terms and conditions for using StarPlan recruitment platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/img/star.png" alt="StarPlan" width={24} height={24} />
            <span className="font-semibold text-text-primary">StarPlan</span>
          </Link>
          <Link href="/" className="text-sm text-primary hover:underline">
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-semibold text-text-primary mb-4">Terms of Service</h1>
        <p className="text-text-muted mb-12">Last updated: January 28, 2026</p>

        <div className="prose prose-lg max-w-none text-text-secondary">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing or using StarPlan (&quot;the Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you disagree with any part of these terms, you may not access the Service.
            </p>
            <p>
              These Terms apply to all users of the Service, including employers, candidates, and visitors.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">2. Description of Service</h2>
            <p className="mb-4">
              StarPlan is an AI-powered recruitment platform that connects AI startups with qualified candidates. Our services include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>AI-powered candidate ranking and matching</li>
              <li>Job posting and management tools</li>
              <li>Candidate profile hosting and resume parsing</li>
              <li>Application tracking and communication tools</li>
              <li>Agency recruitment services (optional add-on)</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">3. User Accounts</h2>
            
            <h3 className="text-xl font-medium text-text-primary mt-6 mb-3">3.1 Account Creation</h3>
            <p className="mb-4">
              To use certain features of the Service, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
            </p>

            <h3 className="text-xl font-medium text-text-primary mt-6 mb-3">3.2 Account Security</h3>
            <p className="mb-4">
              You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You agree not to disclose your password to any third party.
            </p>

            <h3 className="text-xl font-medium text-text-primary mt-6 mb-3">3.3 Account Types</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Candidate Accounts:</strong> Free for job seekers to create profiles and apply to positions</li>
              <li><strong>Employer Accounts:</strong> Paid subscription required to post jobs and access candidate rankings</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">4. User Conduct</h2>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
              <li>Post false, inaccurate, misleading, or fraudulent content</li>
              <li>Impersonate any person or entity</li>
              <li>Harass, abuse, or harm another person</li>
              <li>Send spam or unsolicited communications</li>
              <li>Attempt to circumvent any security features of the Service</li>
              <li>Scrape, crawl, or use automated means to access the Service without permission</li>
              <li>Interfere with the proper working of the Service</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">5. Employer Terms</h2>
            
            <h3 className="text-xl font-medium text-text-primary mt-6 mb-3">5.1 Job Postings</h3>
            <p className="mb-4">
              Employers are responsible for ensuring that all job postings are accurate, non-discriminatory, and comply with applicable employment laws. StarPlan reserves the right to remove any job posting that violates these Terms.
            </p>

            <h3 className="text-xl font-medium text-text-primary mt-6 mb-3">5.2 Hiring Decisions</h3>
            <p className="mb-4">
              AI rankings and recommendations are provided as decision-support tools only. Employers are solely responsible for all hiring decisions and must comply with all applicable employment and anti-discrimination laws.
            </p>

            <h3 className="text-xl font-medium text-text-primary mt-6 mb-3">5.3 Payments</h3>
            <p>
              Employer subscriptions are billed according to the selected plan. All fees are non-refundable unless otherwise stated. We reserve the right to modify pricing with 30 days notice.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">6. Candidate Terms</h2>
            
            <h3 className="text-xl font-medium text-text-primary mt-6 mb-3">6.1 Profile Information</h3>
            <p className="mb-4">
              Candidates must provide accurate information in their profiles. False or misleading information may result in account termination.
            </p>

            <h3 className="text-xl font-medium text-text-primary mt-6 mb-3">6.2 Data Usage Consent</h3>
            <p>
              By creating a profile, candidates consent to their information being processed by our AI algorithms and shared with employers when they apply to positions or are matched with job opportunities.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">7. Intellectual Property</h2>
            <p className="mb-4">
              The Service and its original content, features, and functionality are and will remain the exclusive property of StarPlan. The Service is protected by copyright, trademark, and other laws.
            </p>
            <p>
              You retain ownership of any content you submit to the Service. By submitting content, you grant StarPlan a worldwide, non-exclusive, royalty-free license to use, reproduce, and display such content in connection with providing the Service.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">8. AI and Algorithm Disclaimer</h2>
            <p className="mb-4">
              Our AI-powered ranking system is designed to assist in candidate evaluation but is not infallible. StarPlan does not guarantee:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The accuracy of any AI-generated rankings or recommendations</li>
              <li>That any candidate will be suitable for any particular role</li>
              <li>Employment outcomes for any candidate or employer</li>
            </ul>
            <p className="mt-4">
              Users should exercise their own judgment and conduct appropriate due diligence in all hiring decisions.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">9. Limitation of Liability</h2>
            <p className="mb-4">
              To the maximum extent permitted by law, StarPlan shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Loss of profits, data, or business opportunities</li>
              <li>Hiring decisions based on our recommendations</li>
              <li>Any employment-related disputes</li>
              <li>Service interruptions or data loss</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">10. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless StarPlan and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses arising out of your use of the Service or violation of these Terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">11. Termination</h2>
            <p className="mb-4">
              We may terminate or suspend your account immediately, without prior notice, for any reason, including breach of these Terms. Upon termination, your right to use the Service will immediately cease.
            </p>
            <p>
              You may terminate your account at any time by contacting us. For paid subscriptions, please refer to your subscription agreement for cancellation terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">12. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will provide notice of any material changes by posting the new Terms on this page. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">13. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-text-primary mb-4">14. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about these Terms, please contact us:
            </p>
            <ul className="list-none space-y-2">
              <li>Email: <a href="mailto:legal@starplan.ai" className="text-primary hover:underline">legal@starplan.ai</a></li>
              <li>Website: <a href="https://starplan.ai" className="text-primary hover:underline">starplan.ai</a></li>
            </ul>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-sm text-text-muted">© {new Date().getFullYear()} StarPlan</span>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-sm text-text-muted hover:text-text-secondary">Privacy</Link>
            <Link href="/cookies" className="text-sm text-text-muted hover:text-text-secondary">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
