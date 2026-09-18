import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { MOCK_PRODUCTS } from '../../data/mockProducts';
import { ProductCard } from '../common/ProductCard';

export const ProductCarousel = ({ onQuickView }) => {
  const scrollRef = useRef(null);

  const newInProducts = MOCK_PRODUCTS.filter((p) => p.isNew || p.tag === 'NEW IN');

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-20 bg-white border-t border-neutral-100 font-serif">
      <div className="max-w-[1800px] mx-auto px-4 md:px-8">
        {/* Header Bar */}
        <div className="flex items-end justify-between mb-10 md:mb-14 border-b border-neutral-200 pb-6 md:pb-7">
          <div>
            <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 font-serif block mb-1">
              WEEKLY DROP #34
            </span>
            <h2 className="section-heading font-serif tracking-[0.1em] text-brand-dark">
              NEW IN
            </h2>
          </div>

          <div className="flex items-center gap-6">
            {/* Scroll Controls */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => handleScroll('left')}
                className="p-2.5 border border-neutral-200 hover:border-black transition-colors rounded-full text-brand-dark"
                aria-label="Previous products"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleScroll('right')}
                className="p-2.5 border border-neutral-200 hover:border-black transition-colors rounded-full text-brand-dark"
                aria-label="Next products"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <a
              href="#new-in"
              className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.2em] uppercase text-brand-dark hover:text-neutral-500 transition-colors group"
            >
              VIEW ALL
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>

        {/* Carousel Horizontal Scroll Container */}
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-6 -mx-4 px-4 md:mx-0 md:px-0"
        >
          {newInProducts.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="min-w-[70vw] sm:min-w-[280px] md:min-w-[320px] flex-shrink-0 snap-center"
            >
              <ProductCard product={product} onQuickView={onQuickView} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
