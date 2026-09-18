import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, ShoppingBag, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { Button } from './Button';

export const QuickViewModal = () => {
  const { quickViewProduct, setQuickViewProduct, addToCart, toggleWishlist, isInWishlist } = useCart();
  const [selectedSize, setSelectedSize] = useState('M');
  const [addedSuccess, setAddedSuccess] = useState(false);

  if (!quickViewProduct) return null;

  const isWishlisted = isInWishlist(quickViewProduct.id);

  const formatPrice = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleAdd = () => {
    addToCart(quickViewProduct, selectedSize);
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
      setQuickViewProduct(null);
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setQuickViewProduct(null)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-3xl bg-white shadow-2xl overflow-y-auto max-h-[96vh] md:max-h-[88vh] flex flex-col md:flex-row text-brand-dark rounded-none sm:rounded-sm border border-neutral-200"
        >
          {/* Close Button */}
          <button
            onClick={() => setQuickViewProduct(null)}
            className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-30 p-2.5 bg-white/95 shadow-md border border-neutral-200 rounded-full hover:bg-black hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-black" />
          </button>

          {/* Left: Product Images */}
          <div className="w-full md:w-1/2 bg-neutral-100 relative aspect-[3/4]">
            <img
              src={quickViewProduct.image}
              alt={quickViewProduct.name}
              className="w-full h-full object-cover object-top"
            />
            {quickViewProduct.tag && (
              <span className="absolute top-4 left-4 bg-black text-white text-[9px] tracking-widest px-2.5 py-1 uppercase font-semibold">
                {quickViewProduct.tag}
              </span>
            )}
          </div>

          {/* Right: Details & Size Selector */}
          <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between">
            <div>
              <p className="text-[10px] tracking-widest text-neutral-400 uppercase mb-1">
                {quickViewProduct.category} — {quickViewProduct.subcategory}
              </p>
              <h2 className="text-base md:text-lg font-semibold tracking-wider uppercase mb-2">
                {quickViewProduct.name}
              </h2>
              <div className="text-base font-medium mb-4">
                {formatPrice(quickViewProduct.price)}
              </div>

              <p className="text-xs text-neutral-600 leading-relaxed mb-6 font-light">
                {quickViewProduct.description}
              </p>

              {/* Size Selection */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2 text-xs">
                  <span className="font-semibold tracking-wider uppercase">SELECT SIZE</span>
                  <button className="text-[10px] text-neutral-500 underline hover:text-black">
                    SIZE GUIDE
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(quickViewProduct.sizes || ['XS', 'S', 'M', 'L', 'XL']).map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`h-10 min-w-[40px] px-3 border text-xs font-semibold tracking-wider transition-all ${
                        selectedSize === size
                          ? 'border-brand-dark bg-brand-dark text-white'
                          : 'border-neutral-200 text-brand-dark hover:border-black'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-neutral-100">
              <Button
                fullWidth
                variant="primary"
                onClick={handleAdd}
                className="flex items-center justify-center gap-2 py-3.5"
              >
                {addedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    ADDED TO BAG
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    ADD TO BAG
                  </>
                )}
              </Button>

              <button
                onClick={() => toggleWishlist(quickViewProduct.id)}
                className={`p-3 border border-neutral-200 hover:border-black transition-colors ${
                  isWishlisted ? 'bg-red-50 text-red-600 border-red-200' : 'text-neutral-700'
                }`}
                title="Wishlist"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-600' : ''}`} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
