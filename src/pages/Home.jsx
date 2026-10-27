import React, { useEffect } from 'react';
// House of Urvaah - Home Page
import { SEOHead } from '../components/common/SEOHead';
import { HeroParallaxBlock } from '../components/home/HeroParallaxBlock';
import { CategoryGrid } from '../components/home/CategoryGrid';
import { EditorialBanner } from '../components/home/EditorialBanner';
import { BestSellers } from '../components/home/BestSellers';
import { StealDeals } from '../components/home/StealDeals';
import { TrendingOnGram } from '../components/home/TrendingOnGram';
import { WhatsHot } from '../components/home/WhatsHot';
import { BrandStory } from '../components/home/BrandStory';
import { useCart } from '../context/CartContext';

// Flag to control visibility of the "PRICE DROP ERA" (StealDeals) section on the homepage
const SHOW_PRICE_DROP_ERA = false;

const HOMEPAGE_SECTIONS = [
  'best-sellers',
  'trending',
  'whats-hot',
  'recommended',
  'editorial',
  'brand-story'
];

export const Home = () => {
  const { setPdpProduct } = useCart();

  // Scroll listener: dynamically track which section the user is browsing and their scroll offset
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY || window.pageYOffset || 0;
          sessionStorage.setItem('urvaah_home_scroll_y', String(currentY));

          // If scrolled near very top (< 200px), user is at hero
          if (currentY < 200) {
            sessionStorage.removeItem('urvaah_home_last_section');
          } else {
            // Find section currently in or closest to view
            let detected = null;
            for (const sId of HOMEPAGE_SECTIONS) {
              const el = document.getElementById(sId);
              if (el) {
                const rect = el.getBoundingClientRect();
                if (rect.top <= 300 && rect.bottom >= 80) {
                  detected = sId;
                }
              }
            }
            if (detected) {
              sessionStorage.setItem('urvaah_home_last_section', detected);
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Restore scroll position when returning back to Home from a product or collection
  useEffect(() => {
    const savedSection = sessionStorage.getItem('urvaah_home_last_section');
    const savedY = parseInt(sessionStorage.getItem('urvaah_home_scroll_y') || '0', 10);
    const shouldRestore = sessionStorage.getItem('urvaah_home_should_restore') === 'true';

    if (shouldRestore || savedSection || savedY > 0) {
      sessionStorage.removeItem('urvaah_home_should_restore');

      const attemptScroll = () => {
        let ok = false;
        if (savedSection) {
          const el = document.getElementById(savedSection);
          if (el) {
            el.scrollIntoView({ behavior: 'instant', block: 'start' });
            ok = true;
          }
        }
        if (!ok && savedY > 0) {
          window.scrollTo({ top: savedY, left: 0, behavior: 'instant' });
          ok = true;
        }
        return ok;
      };

      attemptScroll();
      requestAnimationFrame(attemptScroll);
      const t1 = setTimeout(attemptScroll, 60);
      const t2 = setTimeout(attemptScroll, 180);
      const t3 = setTimeout(attemptScroll, 350);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, []);

  return (
    <main className="w-full min-h-screen bg-white">
      <SEOHead 
        title="House of Urvaah | Official Online Store & Luxury House"
        description="Explore House of Urvaah: high-fashion runway tailoring, luxury silk dresses, minimalist co-ord sets, and timeless women's designer apparel."
        keywords="House of Urvaah, luxury clothing, architectural tailoring, silk dresses, co-ord sets, women fashion house"
        ogImage="/assets/Images/Brown01.png"
      />
      {/* Hero Video + Dual Campaign Banner Parallax Block with Pinned Logo Overlay */}
      <div id="hero-campaign">
        <HeroParallaxBlock />
      </div>

      {/* BEST SELLERS Section */}
      <section id="best-sellers" className="scroll-mt-20">
        <BestSellers />
      </section>

      {/* STEAL DEALS / PRICE DROP ERA Section */}
      {SHOW_PRICE_DROP_ERA && <StealDeals />}

      {/* TRENDING ON THE GRAM Section */}
      <section id="trending" className="scroll-mt-20">
        <div id="trending-on-gram" />
        <TrendingOnGram />
      </section>

      {/* THE HOT LIST Section */}
      <section id="whats-hot" className="scroll-mt-20">
        <WhatsHot />
      </section>

      {/* 4.4 Category Grid / Shop by Category */}
      <section id="recommended" className="scroll-mt-20">
        <div id="recommended-for-you" />
        <CategoryGrid />
      </section>

      {/* 4.6 Editorial/Lookbook Banner */}
      <section id="editorial" className="scroll-mt-20">
        <EditorialBanner />
      </section>

      {/* 4.8 Sustainability / Brand Story Strip */}
      <section id="brand-story" className="scroll-mt-20">
        <BrandStory />
      </section>
    </main>
  );
};

