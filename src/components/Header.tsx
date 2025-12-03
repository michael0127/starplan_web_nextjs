'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { smoothScrollTo } from '@/utils/smoothScroll';
import styles from './Header.module.css';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // 判断是否为应用内页面（explore, profile, referrals, resume等）
  const isAppPage = pathname.startsWith('/explore') || 
                    pathname.startsWith('/profile') || 
                    pathname.startsWith('/referrals') || 
                    pathname.startsWith('/resume');

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // 如果是hash链接
    if (href.includes('#')) {
      const hash = href.split('#')[1];
      
      // 如果不在首页，先导航到首页
      if (pathname !== '/') {
        e.preventDefault();
        router.push(`/#${hash}`);
        // 等待页面加载后再滚动
        setTimeout(() => {
          smoothScrollTo(hash);
        }, 300);
      } else {
        // 在首页，直接平滑滚动
        e.preventDefault();
        smoothScrollTo(hash);
      }
    }
  };

  return (
    <header 
      id="header" 
      className={styles.header}
      style={{ backgroundColor: isScrolled ? '#fff' : 'transparent' }}
    >
      <div className={styles.cont}>
        <Link href="/" className={styles.logo}>
          <Image 
            src="/img/logo.png" 
            alt="StarPlan Logo" 
            width={195} 
            height={40}
            priority
          />
        </Link>
        {/* 只在非应用页面（如首页）显示导航菜单 */}
        {!isAppPage && (
          <>
            <nav className={styles.nav}>
              <Link href="/">Home</Link>
              <Link 
                href="/#how" 
                onClick={(e) => handleNavClick(e, '/#how')}
              >
                How it Works
              </Link>
              <Link 
                href="/#starPlan" 
                onClick={(e) => handleNavClick(e, '/#starPlan')}
              >
                Find a Job
              </Link>
              <Link 
                href="/#why" 
                onClick={(e) => handleNavClick(e, '/#why')}
              >
                Why Choose
              </Link>
            </nav>
            <div className={styles.btns}>
              {isLoggedIn ? (
                <Link href="/explore" className={styles.btn1}>
                  Enter
                </Link>
              ) : (
                <>
                  <Link href="/login" className={styles.btn1}>
                    Login
                  </Link>
                  <Link href="/register" className={styles.btn2}>
                    Register
                  </Link>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}

