import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';

import { useNavigate } from 'react-router-dom';
import { productApi } from '../../services/productApi';

export const CategoryGrid = () => {
  const scrollRef = useRef(null);
  const navigate = useNavigate();
  const [productsList, setProductsList] = useState([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart, toggleWishlist, isInWishlist } = useCart();

  const lastUserInteractionRef = useRef(0);
  const targetScrollLeftRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadRecommendedProducts = async () => {
      try {
        const res = await productApi.getRecommendations({ limit: 10 });
        const data = Array.isArray(res) ? res : (res?.data || []);
        if (isMounted) {
          const dbProductsMapped = data.map((p) => ({
            ...p,
            formattedPrice: p.formattedPrice || `₹ ${Number(p.price).toLocaleString('en-IN')}`,
          }));
          setProductsList((prev) => {
            if (
              prev.length === dbProductsMapped.length &&
              prev.every(
                (p, i) =>
                  p.id === dbProductsMapped[i]?.id &&
                  p.price === dbProductsMapped[i]?.price &&
                  p.name === dbProductsMapped[i]?.name
              )
            ) {
              return prev;
            }
            return dbProductsMapped;
          });
        }
      } catch (err) {
        console.warn('[Recommended Section]: Failed to load recommended products', err);
      }
    };

    loadRecommendedProducts();

    // Custom event & storage listeners for instant updates when Admin modifies products
    const handleProductUpdate = () => {
      loadRecommendedProducts();
    };

    window.addEventListener('urvaah_products_updated', handleProductUpdate);
    window.addEventListener('storage', handleProductUpdate);

    // Sync periodically with Admin panel updates
    const pollingInterval = setInterval(loadRecommendedProducts, 10000);

    return () => {
      isMounted = false;
      window.removeEventListener('urvaah_products_updated', handleProductUpdate);
      window.removeEventListener('storage', handleProductUpdate);
      clearInterval(pollingInterval);
    };
  }, []);

  const checkScrollPosition = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 5) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft < maxScroll - 8);
  };

  // Re-check scroll position on mount, resize, and when products load
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScrollPosition();
    const handleScrollEvent = () => {
      checkScrollPosition();
      if (Date.now() - lastUserInteractionRef.current > 500) {
        targetScrollLeftRef.current = null;
      }
    };

    el.addEventListener('scroll', handleScrollEvent, { passive: true });
    window.addEventListener('resize', checkScrollPosition, { passive: true });

    return () => {
      el.removeEventListener('scroll', handleScrollEvent);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkScrollPosition();
    }, 150);
    return () => clearTimeout(timer);
  }, [productsList]);

  const getCardStep = () => {
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
    return Math.round(firstCard.getBoundingClientRect().width) + 16;
  };

  const handleScroll = (direction) => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    lastUserInteractionRef.current = Date.now();

    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    if (maxScroll <= 5) return;

    const step = getCardStep();
    const currentScroll = el.scrollLeft;

    // Accumulate successive rapid clicks smoothly without dropping
    let baseScroll = targetScrollLeftRef.current !== null ? targetScrollLeftRef.current : currentScroll;

    if (Math.abs(baseScroll - currentScroll) > step * 2) {
      baseScroll = currentScroll;
    }

    let nextScroll;
    if (direction === 'right') {
      nextScroll = Math.min(maxScroll, baseScroll + step);
    } else {
      nextScroll = Math.max(0, baseScroll - step);
    }

    targetScrollLeftRef.current = nextScroll;
    el.scrollTo({ left: nextScroll, behavior: 'smooth' });

    setTimeout(checkScrollPosition, 80);
    setTimeout(checkScrollPosition, 350);
  };

  // Auto-scroll effect: calm 4.5s interval, pauses 6s on user interaction or hover
  useEffect(() => {
    let intervalId;
    if (!isHovered) {
      intervalId = setInterval(() => {
        if (!scrollRef.current) return;
        if (Date.now() - lastUserInteractionRef.current < 6000) return;

        const el = scrollRef.current;
        const { scrollLeft, scrollWidth, clientWidth } = el;
        const maxScroll = scrollWidth - clientWidth;
        if (maxScroll <= 10) return;

        if (scrollLeft >= maxScroll - 15) {
          targetScrollLeftRef.current = 0;
          el.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          const step = getCardStep();
          const nextScroll = Math.min(maxScroll, scrollLeft + step);
          targetScrollLeftRef.current = nextScroll;
          el.scrollTo({ left: nextScroll, behavior: 'smooth' });
        }
      }, 4500);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isHovered]);

  return (
    <section id="recommended-for-you" className="pt-6 md:pt-8 pb-0 px-4 md:px-8 max-w-[1800px] mx-auto bg-white">
      {/* Section Heading matching Trending on the gram typography */}
      <div className="mb-10 md:mb-14 border-b border-neutral-200 pb-6 md:pb-7 text-left">
        <h2 className="text-2xl sm:text-3xl md:text-4xl text-black flex items-baseline flex-wrap">
          <span className="font-parfumerie capitalize inline-block mr-2">Recommended</span>
          <span className="font-le-jour lowercase">for you</span>
        </h2>
      </div>

      {/* Relative Carousel Wrapper with Floating Arrow Navigation */}
      <div
        className="relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => {
          setIsHovered(true);
          lastUserInteractionRef.current = Date.now();
        }}
        onTouchEnd={() => {
          setIsHovered(false);
          lastUserInteractionRef.current = Date.now();
        }}
      >
        {/* Left Floating Arrow Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleScroll('left');
          }}
          className={`absolute left-1 sm:left-2 top-[42%] -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-white/95 shadow-lg text-brand-dark transition-all duration-300 border border-neutral-200/80 items-center justify-center flex ${canScrollLeft
              ? 'opacity-100 hover:bg-white hover:scale-105 cursor-pointer pointer-events-auto'
              : 'opacity-0 pointer-events-none'
            }`}
          aria-label="Scroll left for previous products"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
        </button>

        {/* Single Horizontal Track (1 Row, 4 Visible at once on Desktop) */}
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar snap-x snap-proximity sm:snap-none pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {productsList.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="group/card relative flex flex-col min-w-[70vw] sm:min-w-[45vw] md:min-w-[calc(33.333%-0.75rem)] lg:min-w-[calc(25%-0.75rem)] w-[calc(25%-0.75rem)] flex-shrink-0 snap-start"
            >
              {/* Product Photo Container */}
              <div
                onClick={() => {
                  if (product.id) {
                    let targetId = product.id;
                    if (product.id === 'bs-101' || product.id === '101' || product.id === '105' || product.id === 'prod-105' || product.id === 'bs-105' || (product.name && (product.name.toUpperCase().includes('CHESTNUT BLOOM SET') || product.name.toUpperCase().includes('MOCHA BROWN EMBROIDERED CO-ORD SET')))) {
                      targetId = 'bs-101';
                    } else if (product.id === 'bs-103' || product.id === '103' || product.id === '106' || product.id === 'prod-102' || product.id === 'bs-106' || (product.name && (product.name.toUpperCase().includes('SAGE BLOOM EMBROIDERED CORSET') || product.name.toUpperCase().includes('GILDED MIST CORSET') || product.name.toUpperCase().includes('PEACH BLOOM CORSET SET')))) {
                      targetId = 'bs-103';
                    }
                    navigate(`/product/${targetId}`);
                    window.scrollTo({ top: 0, behavior: 'instant' });
                  }
                }}
                className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100/90 cursor-pointer"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover object-top filter brightness-[0.98] transition-transform duration-500 group-hover/card:scale-105"
                  loading="lazy"
                />

                {/* Top-Right: Wishlist Heart Icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product.id);
                  }}
                  className="absolute top-2.5 right-2.5 z-10 p-2.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full bg-white/90 shadow-sm text-neutral-700 hover:text-red-600 transition-colors"
                  aria-label="Wishlist"
                >
                  <Heart
                    className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-red-600 text-red-600' : 'stroke-[1.5]'
                      }`}
                  />
                </button>

                {/* Bottom-Right: Bag Quick-Add Icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product);
                  }}
                  className="absolute bottom-2.5 right-2.5 z-10 p-2.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full bg-white/90 shadow-md text-brand-dark hover:bg-black hover:text-white transition-all transform hover:scale-105"
                  aria-label="Add to Shopping Bag"
                >
                  <ShoppingBag className="w-4 h-4 stroke-[1.5]" />
                </button>
              </div>

              {/* Product Info Below Image */}
              <div
                onClick={() => {
                  if (product.id) {
                    let targetId = product.id;
                    if (product.id === 'bs-101' || product.id === '101' || product.id === '105' || product.id === 'prod-105' || product.id === 'bs-105' || (product.name && (product.name.toUpperCase().includes('CHESTNUT BLOOM SET') || product.name.toUpperCase().includes('MOCHA BROWN EMBROIDERED CO-ORD SET')))) {
                      targetId = 'bs-101';
                    } else if (product.id === 'bs-103' || product.id === '103' || product.id === '106' || product.id === 'prod-102' || product.id === 'bs-106' || (product.name && (product.name.toUpperCase().includes('SAGE BLOOM EMBROIDERED CORSET') || product.name.toUpperCase().includes('GILDED MIST CORSET') || product.name.toUpperCase().includes('PEACH BLOOM CORSET SET')))) {
                      targetId = 'bs-103';
                    }
                    navigate(`/product/${targetId}`);
                    window.scrollTo({ top: 0, behavior: 'instant' });
                  }
                }}
                className="mt-2.5 flex flex-col text-left cursor-pointer hover:opacity-80 transition-opacity"
              >
                <h3 className="text-[11px] sm:text-xs font-semibold tracking-wider text-brand-dark uppercase line-clamp-1">
                  {product.name}
                </h3>
                <span className="text-[11px] sm:text-xs text-neutral-500 font-normal mt-0.5">
                  {product.formattedPrice}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Right Floating Arrow Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleScroll('right');
          }}
          className={`absolute right-1 sm:right-2 top-[42%] -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-white/95 shadow-lg text-brand-dark transition-all duration-300 border border-neutral-200/80 items-center justify-center flex ${canScrollRight
              ? 'opacity-100 hover:bg-white hover:scale-105 cursor-pointer pointer-events-auto'
              : 'opacity-0 pointer-events-none'
            }`}
          aria-label="Scroll right for next products"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
        </button>
      </div>
    </section>
  );
};


