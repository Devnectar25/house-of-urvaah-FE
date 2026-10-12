import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop
 * Ensures that navigating to a new route resets scroll position to top: 0.
 * Strictly prevents spontaneous scroll resets or jumping while the user is actively viewing/browsing a page.
 */
export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const prevPathname = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Never re-scroll if user is staying on the same pathname
    if (prevPathname.current === pathname) {
      return;
    }

    prevPathname.current = pathname;

    // Do not scroll to top if target is the FAQs anchor or route
    if (pathname === '/faqs' || pathname === '/faq' || hash === '#faqs') {
      return;
    }

    // Only scroll to top on genuine route transition or initial entry
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
