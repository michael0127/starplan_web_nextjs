import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Privacy Policy — StarPlan',
  description: 'Learn how StarPlan collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
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
        <h1 className="text-4xl font-semibold text-text-primary mb-4">Privacy Policy</h1>
        <p className="text-text-muted mb-12">Last updated: January 28, 2026</p>

        <div className="prose prose-lg max-w-none text-text-secondary">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">1. Introduction</h2>
            <p className="mb-4">
              StarPlan (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered recruitment platform.
            </p>
            <p>
              By using StarPlan, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-medium text-text-primary mt-6 mb-3">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Account information (name, email address, company name)</li>
              <li>Profile information (resume, GitHub profile, portfolio links)</li>
              <li>Job posting details and hiring requirements</li>
              <li>Communication preferences</li>
            </ul>

            <h3 className="text-xl font-medium text-text-primary mt-6 mb-3">2.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Device and browser information</li>
              <li>IP address and location data</li>
              <li>Usage patterns and interaction data</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h3 className="text-xl font-medium text-text-primary mt-6 mb-3">2.3 Information from Third Parties</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Public GitHub repository data (with your consent)</li>
              <li>LinkedIn profile information (when connected)</li>
              <li>Academic publications and research papers</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and improve our recruitment matching services</li>
              <li>To generate AI-powered candidate rankings and recommendations</li>
              <li>To facilitate communication between candidates and employers</li>
              <li>To personalize your experience on our platform</li>
              <li>To send service-related communications and updates</li>
              <li>To analyze usage patterns and improve our algorithms</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">4. Data Sharing and Disclosure</h2>
            <p className="mb-4">We may share your information with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Employers:</strong> When you apply to job postings, relevant profile information is shared with the hiring company</li>
              <li><strong>Service Providers:</strong> Third-party vendors who assist in operating our platform</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
            </ul>
            <p className="mt-4">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">5. Data Security</h2>
            <p className="mb-4">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Secure data centers with physical security measures</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">6. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to provide our services and fulfill the purposes described in this policy. Candidates may request deletion of their data at any time. Employers&apos; data is retained according to their subscription agreement.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">7. Your Rights</h2>
            <p className="mb-4">Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access and receive a copy of your personal data</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Request deletion of your personal data</li>
              <li>Object to or restrict certain processing activities</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, please contact us at <a href="mailto:privacy@starplan.ai" className="text-primary hover:underline">privacy@starplan.ai</a>.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">8. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your data in accordance with applicable laws.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">9. Children&apos;s Privacy</h2>
            <p>
              StarPlan is not intended for individuals under the age of 18. We do not knowingly collect personal information from children.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-text-primary mb-4">11. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <ul className="list-none space-y-2">
              <li>Email: <a href="mailto:privacy@starplan.ai" className="text-primary hover:underline">privacy@starplan.ai</a></li>
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
            <Link href="/terms" className="text-sm text-text-muted hover:text-text-secondary">Terms</Link>
            <Link href="/cookies" className="text-sm text-text-muted hover:text-text-secondary">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
