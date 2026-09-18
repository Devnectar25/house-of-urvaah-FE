import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { MOCK_PRODUCTS } from '../../data/mockProducts';
import { ProductCard } from '../common/ProductCard';

export const SearchOverlay = () => {
  const { isSearchOpen, setIsSearchOpen, setQuickViewProduct } = useCart();
  const [searchTerm, setSearchTerm] = useState('');

  const trendingTags = [
    'Silk Dresses',
    'Co-ord Sets',
    'Tailored Blazers',
    'Cashmere Knitwear',
    'Calfskin Shoulder Bag',
    'Wide Leg Trousers',
  ];

  const filteredProducts = searchTerm.trim()
    ? MOCK_PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.subcategory.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSearchOpen(false)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs"
          />

          {/* Slide-down Search Bar Panel */}
          <motion.div
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed top-0 inset-x-0 z-50 bg-white text-brand-dark shadow-2xl p-6 md:p-10 border-b border-neutral-200 font-serif max-h-[85vh] overflow-y-auto"
          >
            <div className="max-w-5xl mx-auto">
              {/* Input Header */}
              <div className="relative flex items-center border-b border-black pb-4 mb-6">
                <Search className="w-6 h-6 text-neutral-400 mr-3" />
                <input
                  type="text"
                  placeholder="SEARCH FOR BLAZERS, DRESSES, COATS, LEATHER..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                  className="w-full text-base md:text-xl font-light tracking-wider uppercase bg-transparent outline-none placeholder:text-neutral-300"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="p-1 hover:text-black text-neutral-400 mr-2 text-xs uppercase"
                  >
                    CLEAR
                  </button>
                )}
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="p-2 text-neutral-500 hover:text-black transition-colors"
                  aria-label="Close search"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Trending Tags */}
              {!searchTerm && (
                <div className="py-4">
                  <h4 className="text-[10px] tracking-widest text-neutral-400 uppercase font-semibold mb-4">
                    TRENDING SEARCHES
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {trendingTags.map((tag, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSearchTerm(tag)}
                        className="px-4 py-2 bg-brand-sand hover:bg-neutral-200 text-xs tracking-wider uppercase font-medium transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results */}
              {searchTerm && (
                <div className="pt-4">
                  <h4 className="text-[10px] tracking-widest text-neutral-400 uppercase font-semibold mb-6">
                    SEARCH RESULTS ({filteredProducts.length})
                  </h4>

                  {filteredProducts.length === 0 ? (
                    <p className="text-sm text-neutral-500 tracking-wider py-8 text-center uppercase">
                      NO PRODUCTS FOUND MATCHING "{searchTerm}"
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {filteredProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onQuickView={(p) => {
                            setIsSearchOpen(false);
                            setQuickViewProduct(p);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
