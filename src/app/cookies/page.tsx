import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Cookie Policy — StarPlan',
  description: 'Learn how StarPlan uses cookies and similar technologies.',
};

export default function CookiesPage() {
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
        <h1 className="text-4xl font-semibold text-text-primary mb-4">Cookie Policy</h1>
        <p className="text-text-muted mb-12">Last updated: January 28, 2026</p>

        <div className="prose prose-lg max-w-none text-text-secondary">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">1. What Are Cookies</h2>
            <p className="mb-4">
              Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide information to the website owners.
            </p>
            <p>
              We use cookies and similar technologies (such as local storage and pixels) to enhance your experience on StarPlan.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">2. Types of Cookies We Use</h2>
            
            <div className="bg-surface rounded-2xl p-6 mb-6">
              <h3 className="text-xl font-medium text-text-primary mb-3">Essential Cookies</h3>
              <p className="mb-2">
                These cookies are necessary for the website to function properly. They enable core functionality such as security, authentication, and session management.
              </p>
              <p className="text-sm text-text-muted">
                <strong>Examples:</strong> Session cookies, authentication tokens, CSRF protection
              </p>
            </div>

            <div className="bg-surface rounded-2xl p-6 mb-6">
              <h3 className="text-xl font-medium text-text-primary mb-3">Functional Cookies</h3>
              <p className="mb-2">
                These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings.
              </p>
              <p className="text-sm text-text-muted">
                <strong>Examples:</strong> Language preferences, theme settings, saved filters
              </p>
            </div>

            <div className="bg-surface rounded-2xl p-6 mb-6">
              <h3 className="text-xl font-medium text-text-primary mb-3">Analytics Cookies</h3>
              <p className="mb-2">
                These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
              </p>
              <p className="text-sm text-text-muted">
                <strong>Examples:</strong> Google Analytics, page view tracking, feature usage metrics
              </p>
            </div>

            <div className="bg-surface rounded-2xl p-6">
              <h3 className="text-xl font-medium text-text-primary mb-3">Marketing Cookies</h3>
              <p className="mb-2">
                These cookies are used to track visitors across websites to display relevant advertisements.
              </p>
              <p className="text-sm text-text-muted">
                <strong>Examples:</strong> Advertising pixels, retargeting cookies
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">3. Specific Cookies We Use</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-text-primary">Cookie Name</th>
                    <th className="text-left py-3 px-4 font-medium text-text-primary">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-text-primary">Duration</th>
                    <th className="text-left py-3 px-4 font-medium text-text-primary">Purpose</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-border/50">
                    <td className="py-3 px-4 font-mono text-xs">sb-*-auth-token</td>
                    <td className="py-3 px-4">Essential</td>
                    <td className="py-3 px-4">Session</td>
                    <td className="py-3 px-4">User authentication</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 px-4 font-mono text-xs">_sp_session</td>
                    <td className="py-3 px-4">Essential</td>
                    <td className="py-3 px-4">Session</td>
                    <td className="py-3 px-4">Session management</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 px-4 font-mono text-xs">user_preferences</td>
                    <td className="py-3 px-4">Functional</td>
                    <td className="py-3 px-4">1 year</td>
                    <td className="py-3 px-4">Store user preferences</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 px-4 font-mono text-xs">_ga</td>
                    <td className="py-3 px-4">Analytics</td>
                    <td className="py-3 px-4">2 years</td>
                    <td className="py-3 px-4">Google Analytics ID</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 px-4 font-mono text-xs">_gid</td>
                    <td className="py-3 px-4">Analytics</td>
                    <td className="py-3 px-4">24 hours</td>
                    <td className="py-3 px-4">Google Analytics session</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">4. Third-Party Cookies</h2>
            <p className="mb-4">
              Some cookies are placed by third-party services that appear on our pages. We do not control these cookies. Third-party services we use include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Google Analytics:</strong> For website analytics and performance monitoring</li>
              <li><strong>Supabase:</strong> For authentication and database services</li>
              <li><strong>Stripe:</strong> For payment processing (on checkout pages)</li>
              <li><strong>Calendly:</strong> For scheduling demos (when embedded)</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">5. Managing Cookies</h2>
            <p className="mb-4">
              You can control and manage cookies in various ways. Please note that removing or blocking cookies may impact your user experience.
            </p>

            <h3 className="text-xl font-medium text-text-primary mt-6 mb-3">Browser Settings</h3>
            <p className="mb-4">
              Most browsers allow you to refuse to accept cookies and to delete cookies. The methods for doing so vary from browser to browser:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Chrome</a></li>
              <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Firefox</a></li>
              <li><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Safari</a></li>
              <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Edge</a></li>
            </ul>

            <h3 className="text-xl font-medium text-text-primary mt-6 mb-3">Opt-Out Links</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Analytics Opt-Out</a></li>
              <li><a href="https://www.networkadvertising.org/choices/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Network Advertising Initiative Opt-Out</a></li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">6. Do Not Track</h2>
            <p>
              Some browsers have a &quot;Do Not Track&quot; feature that signals to websites that you do not want to have your online activity tracked. Currently, we do not respond to &quot;Do Not Track&quot; signals, but we do provide the opt-out options described above.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">7. Updates to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our data practices. Any changes will be posted on this page with an updated revision date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-text-primary mb-4">8. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about our use of cookies, please contact us:
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
            <Link href="/privacy" className="text-sm text-text-muted hover:text-text-secondary">Privacy</Link>
            <Link href="/terms" className="text-sm text-text-muted hover:text-text-secondary">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
