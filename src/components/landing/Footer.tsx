import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="py-16 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/img/star.png" alt="StarPlan" width={20} height={20} />
              <span className="font-medium text-text-primary">StarPlan</span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/privacy" className="text-sm text-text-muted hover:text-text-secondary transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-text-muted hover:text-text-secondary transition-colors">
                Terms
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-6">
            <a
              href="mailto:hello@starplan.ai"
              className="text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              hello@starplan.ai
            </a>
            <span className="text-sm text-text-muted">
              © {new Date().getFullYear()} StarPlan
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
