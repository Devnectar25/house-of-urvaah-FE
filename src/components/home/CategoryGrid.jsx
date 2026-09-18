import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const RECOMMENDED_PRODUCTS = [
  {
    id: 'rec-101',
    name: 'BLUE FLORAL HALTER CO-ORD SET',
    price: 3999,
    formattedPrice: '₹ 3,999',
    image: '/assets/Images/Blue02.png',
    sizes: ['XS', 'S', 'M', 'L'],
    description: 'Beautiful blue floral printed halter top and matching mini skirt set.'
  },
  {
    id: 'rec-102',
    name: 'PINK RIBBED FITTED TOP',
    price: 1299,
    formattedPrice: '₹ 1,299',
    image: '/assets/Images/Peach01.png',
    sizes: ['XS', 'S', 'M', 'L'],
    description: 'Soft stretch ribbed knit fitted top with fine crew neckline in dusty rose pink.'
  },
  {
    id: 'rec-103',
    name: 'BROWN FLORAL CO-ORD SET',
    price: 6999,
    formattedPrice: '₹ 6,999',
    image: '/assets/Images/Brown02.png',
    sizes: ['S', 'M', 'L'],
    description: 'Beautiful brown floral embroidered top and matching skirt set.'
  },
  {
    id: 'rec-104',
    name: 'DRAPED SILK MIDI DRESS',
    price: 8999,
    formattedPrice: '₹ 8,999',
    image: '/assets/Images/Corset04.png',
    sizes: ['XS', 'S', 'M'],
    description: 'Pure silk fluid midi dress featuring asymmetric draped hemline.'
  },
  {
    id: 'rec-105',
    name: 'OVERSIZED COTTON TRENCH COAT',
    price: 11999,
    formattedPrice: '₹ 11,999',
    image: '/assets/Images/Brown04.png',
    sizes: ['S', 'M', 'L'],
    description: 'Classic double-breasted cotton blend trench coat with belt.'
  },
  {
    id: 'rec-106',
    name: 'CHUNKY CASHMERE SWEATER',
    price: 5499,
    formattedPrice: '₹ 5,499',
    image: '/assets/Images/Peach04.png',
    sizes: ['S', 'M', 'L'],
    description: 'Relaxed fit ribbed cashmere sweater with high neck.'
  },
  {
    id: 'rec-107',
    name: 'PLEATED WIDE LEG TROUSERS',
    price: 4499,
    formattedPrice: '₹ 4,499',
    image: '/assets/Images/Blue04.png',
    sizes: ['XS', 'S', 'M', 'L'],
    description: 'High-waisted pleated tailored trousers in indigo navy.'
  },
  {
    id: 'rec-108',
    name: 'MINIMALIST SILK BLOUSE',
    price: 3499,
    formattedPrice: '₹ 3,499',
    image: '/assets/Images/Peach02.png',
    sizes: ['XS', 'S', 'M', 'L'],
    description: 'Elegant silk crepe blouse with delicate boat neckline.'
  }
];

import { productApi } from '../../services/productApi';

export const CategoryGrid = () => {
  const scrollRef = useRef(null);
  const [productsList, setProductsList] = useState(RECOMMENDED_PRODUCTS);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart, toggleWishlist, isInWishlist, setQuickViewProduct } = useCart();

  useEffect(() => {
    let isMounted = true;
    productApi.getProducts({ limit: 8 })
      .then(res => {
        const data = Array.isArray(res) ? res : (res?.data || []);
        if (isMounted && data && data.length > 0) {
          setProductsList(data.map(p => ({
            ...p,
            formattedPrice: `₹ ${Number(p.price).toLocaleString('en-IN')}`
          })));
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
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
    <section id="recommended-for-you" className="py-12 md:py-16 px-4 md:px-8 max-w-[1800px] mx-auto bg-white">
      {/* Section Heading */}
      <div className="mb-10 md:mb-14 border-b border-neutral-200 pb-6 md:pb-7">
        <h2 className="section-heading font-serif tracking-[0.1em] text-brand-dark">
          RECOMMENDED FOR YOU
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
                onClick={() => setQuickViewProduct(product)}
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
                    className={`w-4 h-4 ${
                      isInWishlist(product.id) ? 'fill-red-600 text-red-600' : 'stroke-[1.5]'
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
              <div className="mt-2.5 flex flex-col text-left">
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


