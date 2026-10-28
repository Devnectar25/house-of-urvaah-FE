import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { getSupabaseMediaUrl } from '../../lib/supabase';
import { startVisiblePolling } from '../../lib/livePolling';

const DEFAULT_CATEGORIES = [
  {
    id: 'hot-1',
    anchorId: 'co-ord-sets',
    title: 'CO-ORD SET',
    image: '/assets/Images/Blue02.png',
    link: '/co-ord-sets'
  },
  {
    id: 'hot-2',
    anchorId: 'festive-wear',
    title: 'FESTIVE WEAR',
    image: '/assets/Images/Peach01.png',
    link: '/festive-wear'
  },
  {
    id: 'hot-3',
    anchorId: 'kurtis-and-dresses',
    title: 'KURTIS AND DRESSES',
    image: '/assets/Images/Kurti_1.png',
    link: '/kurtis-and-dresses'
  },
  {
    id: 'hot-4',
    anchorId: 'corset-tops',
    title: 'CORSET',
    image: '/assets/Images/Corset04.png',
    link: '/corset-tops'
  }
];

export const WhatsHot = () => {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const getCanonicalCategoryUrl = (slug) => {
    const s = String(slug || '').toLowerCase().trim();
    if (s.includes('new-arrival')) return '/new-arrivals';
    if (s.includes('co-ord')) return '/co-ord-sets';
    if (s.includes('festive') || s.includes('ethnic')) return '/festive-wear';
    if (s.includes('kurti') || s.includes('dress')) return '/kurtis-and-dresses';
    if (s.includes('corset')) return '/corset-tops';
    return `/category/${s}`;
  };

  const fetchCategories = async () => {
    try {
      const res = await apiClient('/api/categories/active');
      const list = Array.isArray(res) ? res : (res?.data || res?.data?.data || []);
      if (Array.isArray(list) && list.length > 0) {
        const mapped = list
          .filter((cat) => {
            const rawImg = cat.category_image || cat.image_url || cat.image || '';
            return !rawImg.includes('Brown01.png');
          })
          .map((cat, idx) => {
            const rawName = cat.name || cat.title || `Category ${idx + 1}`;
            let title = rawName.toUpperCase();
            if (title === 'KURTI' || title === 'KURTIS') {
              title = 'KURTIS AND DRESSES';
            }
            if (title === 'ETHNIC WEAR' || title === 'ETHNIC') {
              title = 'FESTIVE WEAR';
            }
            const anchorId = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
            const rawImg = cat.category_image || cat.image_url || cat.image || '';
            
            return {
              id: cat.id || cat.category_id || `cat-${idx}`,
              anchorId: anchorId || `cat-${idx}`,
              title: title,
              image: rawImg ? getSupabaseMediaUrl(rawImg) : '/assets/Images/Blue02.png',
              link: getCanonicalCategoryUrl(anchorId)
            };
          });

        if (mapped.length > 0) {
          setCategories(mapped);
        }
      }
    } catch (err) {
      console.warn('[WhatsHot] Failed to fetch live categories:', err.message);
    }
  };

  const checkScrollPosition = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 5) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < maxScroll - 10);
  }, []);

  const getScrollStep = () => {
    if (!scrollRef.current) return 320;
    const cards = scrollRef.current.children;
    if (!cards || cards.length === 0) return 320;
    const firstCard = cards[0];
    const secondCard = cards[1];
    if (firstCard && secondCard) {
      const firstRect = firstCard.getBoundingClientRect();
      const secondRect = secondCard.getBoundingClientRect();
      const step = Math.round(secondRect.left - firstRect.left);
      if (step > 50) return step;
    }
    return Math.round(firstCard.getBoundingClientRect().width) + 20;
  };

  const handleScroll = (direction) => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    if (maxScroll <= 5) return;

    const step = getScrollStep();
    const currentScroll = el.scrollLeft;

    let nextScroll;
    if (direction === 'right') {
      nextScroll = Math.min(maxScroll, currentScroll + step);
    } else {
      nextScroll = Math.max(0, currentScroll - step);
    }

    el.scrollTo({ left: nextScroll, behavior: 'smooth' });
    setTimeout(checkScrollPosition, 100);
    setTimeout(checkScrollPosition, 350);
  };

  useEffect(() => {
    fetchCategories();

    // Event listeners for instant live updates when Admin creates/edits categories
    const handleUpdate = () => fetchCategories();
    window.addEventListener('urvaah_categories_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    // Continuous polling interval for seamless multi-tab / session synchronization
    const stopLivePolling = startVisiblePolling(fetchCategories);

    return () => {
      window.removeEventListener('urvaah_categories_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      stopLivePolling();
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScrollPosition();
    el.addEventListener('scroll', checkScrollPosition, { passive: true });
    window.addEventListener('resize', checkScrollPosition, { passive: true });

    const timer = setTimeout(checkScrollPosition, 200);

    return () => {
      el.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
      clearTimeout(timer);
    };
  }, [checkScrollPosition, categories]);

  return (
    <section className="pt-16 md:pt-20 pb-0 px-4 md:px-8 max-w-[1800px] mx-auto bg-white font-serif">
      {/* Section Heading matching Trending on the gram / BestSellers typography */}
      <div className="mb-10 md:mb-14 border-b border-neutral-200 pb-6 md:pb-7 text-left">
        <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 font-serif block mb-1">
          HOUSE OF URVAAH
        </span>
        <h2 className="section-heading font-serif tracking-[0.1em] text-brand-dark">
          THE HOT LIST
        </h2>
      </div>

      {/* Relative Carousel Track with Floating Arrow Navigation */}
      <div className="relative group">
        {/* Left Floating Arrow Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleScroll('left');
          }}
          className={`absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-white/95 shadow-xl text-brand-dark transition-all duration-300 border border-neutral-200/90 items-center justify-center flex ${
            canScrollLeft
              ? 'opacity-100 hover:bg-white hover:scale-110 cursor-pointer pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          }`}
          aria-label="Scroll left categories"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2]" />
        </button>

        {/* Right Floating Arrow Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleScroll('right');
          }}
          className={`absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-white/95 shadow-xl text-brand-dark transition-all duration-300 border border-neutral-200/90 items-center justify-center flex ${
            canScrollRight
              ? 'opacity-100 hover:bg-white hover:scale-110 cursor-pointer pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          }`}
          aria-label="Scroll right categories"
        >
          <ChevronRight className="w-5 h-5 stroke-[2]" />
        </button>

        {/* Scrollable Track: 4 visible at once on desktop, seamlessly scrollable */}
        <div
          ref={scrollRef}
          className="flex gap-4 md:gap-5 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-3"
        >
          {categories.map((category, idx) => (
            <motion.div
              key={category.id}
              id={category.anchorId}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="group/card relative block aspect-[3/4] overflow-hidden bg-neutral-100 w-[78vw] sm:w-[calc(50%-8px)] md:w-[calc(33.333%-14px)] lg:w-[calc(25%-15px)] min-w-[78vw] sm:min-w-[calc(50%-8px)] md:min-w-[calc(33.333%-14px)] lg:min-w-[calc(25%-15px)] flex-shrink-0 snap-start"
            >
              <Link
                to={category.link}
                onClick={() => {
                  try {
                    sessionStorage.setItem('urvaah_home_last_section', 'whats-hot');
                    sessionStorage.setItem('urvaah_home_scroll_y', String(window.scrollY || 0));
                    sessionStorage.setItem('urvaah_home_should_restore', 'true');
                  } catch (err) {}
                }}
                state={{ fromSection: 'whats-hot', fromScrollY: window.scrollY || 0 }}
                className="block w-full h-full relative cursor-pointer"
                aria-label={category.title}
              >

                <img
                  src={category.image}
                  alt={category.title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/assets/Images/Blue02.png';
                  }}
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover/card:scale-[1.03]"
                />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatsHot;


