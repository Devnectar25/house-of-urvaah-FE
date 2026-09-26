import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hero } from './Hero';
import { DualCampaignBanner } from './DualCampaignBanner';
import { useCart } from '../../context/CartContext';

export const HeroParallaxBlock = () => {
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const [isPinned, setIsPinned] = useState(true);
  const [opacity, setOpacity] = useState(1);
  const [isPastHero, setIsPastHero] = useState(false);
  const { isMobileMenuOpen } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Check if user has scrolled past the hero section into the second section
      if (heroRef.current) {
        const heroRect = heroRef.current.getBoundingClientRect();
        // Hero is considered passed when its bottom is <= 40% of viewport height
        // (i.e. user has scrolled into DualCampaignBanner, the second section)
        const scrolledPastHero = heroRect.bottom <= windowHeight * 0.4;
        setIsPastHero(scrolledPastHero);
      }

      // fadeStartThreshold: starts fading when bottom of DualCampaignBanner is 1.4x windowHeight from top
      const fadeStartThreshold = windowHeight * 1.4;
      // fadeEndThreshold: completely unpinned & opacity 0 when bottom reaches viewport bottom (1.0x windowHeight)
      const fadeEndThreshold = windowHeight * 1.0;

      if (rect.bottom > fadeEndThreshold) {
        setIsPinned(true);

        if (rect.bottom < fadeStartThreshold) {
          const fadeProgress = (rect.bottom - fadeEndThreshold) / (fadeStartThreshold - fadeEndThreshold);
          setOpacity(Math.max(0, Math.min(1, fadeProgress)));
        } else {
          setOpacity(1);
        }
      } else {
        // Fully past the parallax block — unpin before TrendingOnGram enters viewport
        setIsPinned(false);
        setOpacity(0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const activeOpacity = isPastHero ? opacity : 0;

  return (
    <div ref={containerRef} className="relative w-full bg-white">
      {/* 1. Hero Video Background */}
      <div ref={heroRef} className="w-full">
        <Hero />
      </div>

      {/* 2. Side-by-Side Dual Image Campaign Banner (Blue02.png & Brown02.png) */}
      <DualCampaignBanner />

      {/* 3. Pinned Oversized Logo Overlay across Hero + Dual Campaign Banner */}
      <AnimatePresence>
        {isPinned && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: activeOpacity }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className={`fixed bottom-3 md:bottom-8 lg:bottom-12 pointer-events-none flex items-end max-w-[88vw] overflow-visible ${
              isPastHero && activeOpacity > 0 ? 'visible' : 'invisible'
            } ${
              isMobileMenuOpen
                ? 'right-3 sm:right-6 md:right-10 lg:right-12 left-auto justify-end z-[60]'
                : 'left-2 sm:left-4 md:left-6 lg:left-8 right-auto justify-start z-20'
            }`}
            style={{ 
              opacity: activeOpacity,
              transition: 'opacity 0.4s ease, visibility 0.4s ease'
            }}
          >
            <div
              className={`inline-flex items-center justify-center select-none h-10 sm:h-20 md:h-36 lg:h-[250px] w-auto max-w-full transition-all duration-500 ease-in-out ${
                isMobileMenuOpen
                  ? 'translate-x-0'
                  : '-translate-x-[8px] sm:-translate-x-[20px] md:-translate-x-[34px]'
              }`}
            >
              <img
                src="/assets/logo.png"
                alt="House of Urvaah"
                className={`h-full w-auto object-contain transition-all duration-500 ease-in-out ${
                  isMobileMenuOpen
                    ? 'mix-blend-normal brightness-0 drop-shadow-sm'
                    : 'mix-blend-multiply drop-shadow-md hover:opacity-85'
                }`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

