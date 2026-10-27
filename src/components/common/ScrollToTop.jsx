import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { forceUnlockScroll } from '../../hooks/useModalScrollLock';

/**
 * ScrollToTop
 * Manages scroll restoration when navigating across routes:
 * 1. Restores the exact section and scroll position when returning to the Homepage / sections
 * 2. Preserves scroll position on back/forward (POP) navigation
 * 3. Scrolls to top (0, 0) only on genuine forward route transitions (PUSH)
 */
export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();
  const prevPathname = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let ticking = false;
    const recordScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY || window.pageYOffset || 0;
          sessionStorage.setItem(`urvaah_scroll_${pathname}`, String(y));
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', recordScroll, { passive: true });
    return () => {
      const y = window.scrollY || window.pageYOffset || 0;
      sessionStorage.setItem(`urvaah_scroll_${pathname}`, String(y));
      window.removeEventListener('scroll', recordScroll);
    };
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Never re-scroll if user is staying on the same pathname
    if (prevPathname.current === pathname) {
      return;
    }

    const isBackNav = navigationType === 'POP';
    const isHomePage = pathname === '/' || pathname === '';

    prevPathname.current = pathname;

    // Reset any lingering scroll locks when navigating between views
    forceUnlockScroll();

    // Do not scroll to top if target is the FAQs anchor or route
    if (pathname === '/faqs' || pathname === '/faq' || hash === '#faqs') {
      return;
    }

    // If navigating back to homepage, or if restoring to a homepage section was requested
    if (isHomePage && (isBackNav || sessionStorage.getItem('urvaah_home_should_restore') === 'true')) {
      sessionStorage.removeItem('urvaah_home_should_restore');
      const targetSection = sessionStorage.getItem('urvaah_home_last_section');
      const savedY = parseInt(sessionStorage.getItem('urvaah_home_scroll_y') || '0', 10);

      const restoreScroll = () => {
        let restored = false;
        if (targetSection) {
          const el = document.getElementById(targetSection);
          if (el) {
            el.scrollIntoView({ behavior: 'instant', block: 'start' });
            restored = true;
          }
        }
        if (!restored && savedY > 0) {
          window.scrollTo({ top: savedY, left: 0, behavior: 'instant' });
          restored = true;
        }
        return restored;
      };

      restoreScroll();
      requestAnimationFrame(restoreScroll);
      const t1 = setTimeout(restoreScroll, 60);
      const t2 = setTimeout(restoreScroll, 180);
      const t3 = setTimeout(restoreScroll, 350);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }

    // If general back/forward navigation (POP) on any other route
    if (isBackNav) {
      const routeSavedY = parseInt(sessionStorage.getItem(`urvaah_scroll_${pathname}`) || '0', 10);
      if (routeSavedY > 0) {
        window.scrollTo({ top: routeSavedY, left: 0, behavior: 'instant' });
        return;
      }
      return; // Do not force top: 0 on back navigation
    }

    // Only scroll to top on genuine forward route transition (PUSH)
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash, navigationType]);

  return null;
};

export default ScrollToTop;

