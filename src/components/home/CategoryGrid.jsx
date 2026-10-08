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
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart, toggleWishlist, isInWishlist, setQuickViewProduct } = useCart();

  useEffect(() => {
    let isMounted = true;

    const loadRecommendedProducts = async () => {
      try {
        const res = await productApi.getRecommendations({ limit: 5 });
        const data = Array.isArray(res) ? res : (res?.data || []);
        if (isMounted) {
          const dbProductsMapped = data.map((p) => ({
            ...p,
            formattedPrice: p.formattedPrice || `₹ ${Number(p.price).toLocaleString('en-IN')}`,
          }));
          setProductsList(dbProductsMapped);
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

    // Auto-polling every 3s for live real-time sync with Admin panel
    const pollingInterval = setInterval(loadRecommendedProducts, 3000);

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
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScrollPosition();
    el.addEventListener('scroll', checkScrollPosition, { passive: true });
    window.addEventListener('resize', checkScrollPosition, { passive: true });

    return () => {
      el.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, []);

  useEffect(() => {
    let intervalId;
    if (!isHovered && scrollRef.current) {
      intervalId = setInterval(() => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          const firstCard = scrollRef.current.children[0];
          const cardWidth = firstCard ? firstCard.clientWidth : 300;
          scrollRef.current.scrollBy({ left: cardWidth + 16, behavior: 'smooth' });
        }
      }, 2400);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isHovered]);

  const handleScroll = (direction) => {
    if (!scrollRef.current) return;
    const clientWidth = scrollRef.current.clientWidth;
    const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <section id="recommended-for-you" className="pt-[100px] pb-12 md:pb-16 px-4 md:px-8 max-w-[1800px] mx-auto bg-white">
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
        onTouchStart={() => setIsHovered(true)}
        onTouchEnd={() => setIsHovered(false)}
      >
        {/* Left Floating Arrow Button */}
        {canScrollLeft && (
          <button
            onClick={() => handleScroll('left')}
            className="absolute left-1 sm:left-2 top-[42%] -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-white/90 shadow-lg text-brand-dark hover:bg-white hover:scale-105 transition-all border border-neutral-200/80 items-center justify-center"
            aria-label="Scroll left for previous products"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
          </button>
        )}

        {/* Single Horizontal Track (1 Row, 4 Visible at once on Desktop) */}
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {productsList.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="group/card relative flex flex-col min-w-[70vw] sm:min-w-[45vw] md:min-w-[calc(33.333%-0.75rem)] lg:min-w-[calc(25%-0.75rem)] w-[calc(25%-0.75rem)] flex-shrink-0 snap-center"
            >
              {/* Product Photo Container */}
              <div
                onClick={() => {
                  if (product.id) {
                    let targetId = product.id;
                    if (product.id === 'bs-101' || product.id === '101' || product.id === '105' || product.id === 'prod-105' || product.id === 'bs-105' || (product.name && product.name.toUpperCase().includes('CHESTNUT BLOOM SET'))) {
                      targetId = 'bs-101';
                    } else if (product.id === 'bs-103' || product.id === '103' || product.id === '106' || product.id === 'prod-102' || product.id === 'bs-106' || (product.name && (product.name.toUpperCase().includes('GILDED MIST CORSET') || product.name.toUpperCase().includes('PEACH BLOOM CORSET SET')))) {
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
                    if (product.id === 'bs-101' || product.id === '101' || product.id === '105' || product.id === 'prod-105' || product.id === 'bs-105' || (product.name && product.name.toUpperCase().includes('CHESTNUT BLOOM SET'))) {
                      targetId = 'bs-101';
                    } else if (product.id === 'bs-103' || product.id === '103' || product.id === '106' || product.id === 'prod-102' || product.id === 'bs-106' || (product.name && (product.name.toUpperCase().includes('GILDED MIST CORSET') || product.name.toUpperCase().includes('PEACH BLOOM CORSET SET')))) {
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
        {canScrollRight && (
          <button
            onClick={() => handleScroll('right')}
            className="absolute right-1 sm:right-2 top-[42%] -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-white/90 shadow-lg text-brand-dark hover:bg-white hover:scale-105 transition-all border border-neutral-200/80 items-center justify-center"
            aria-label="Scroll right for next products"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
          </button>
        )}
      </div>
    </section>
  );
};


