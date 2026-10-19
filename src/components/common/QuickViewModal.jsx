import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, ShoppingBag, Check, Bell, CheckCircle2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { Button } from './Button';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import { StockNotificationModal } from '../product/StockNotificationModal';

export const QuickViewModal = () => {
  const { quickViewProduct, setQuickViewProduct, addToCart, toggleWishlist, isInWishlist, user } = useCart();
  const [selectedSize, setSelectedSize] = useState('M');
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [hasSubscribedStock, setHasSubscribedStock] = useState(false);

  const totalStock = Number(
    quickViewProduct?.stockQuantity !== undefined && quickViewProduct?.stockQuantity !== null
      ? quickViewProduct.stockQuantity
      : (quickViewProduct?.stock_quantity ?? quickViewProduct?.stock ?? quickViewProduct?.quantity ?? 0)
  );

  const sizeStock = quickViewProduct?.sizeStock || quickViewProduct?.size_stock || {};
  const selectedMatchKey = Object.keys(sizeStock).find(k => k.trim().toUpperCase() === String(selectedSize).trim().toUpperCase());
  const selectedSizeQty = selectedMatchKey !== undefined ? Math.max(0, parseInt(sizeStock[selectedMatchKey], 10) || 0) : null;

  const isOutOfStock = Boolean(
    (selectedSizeQty !== null && selectedSizeQty <= 0) ||
    totalStock <= 0 ||
    (totalStock <= 0 && (quickViewProduct?.inStock === false || quickViewProduct?.instock === false)) ||
    quickViewProduct?.isOutOfStock === true ||
    quickViewProduct?.status === 'Out of Stock' ||
    quickViewProduct?.status === 'out_of_stock'
  );

  useEffect(() => {
    if (quickViewProduct?.id) {
      try {
        const sizeKey = `urvaah_stock_notified_${quickViewProduct.id}_${selectedSize || 'all'}`;
        const isStored = localStorage.getItem(sizeKey) === 'true';
        setHasSubscribedStock(isStored);
      } catch (e) {
        setHasSubscribedStock(false);
      }
    }
  }, [quickViewProduct?.id, selectedSize]);

  const handleStockSubscribed = ({ productId, size } = {}) => {
    const targetId = productId || quickViewProduct?.id;
    const targetSize = size || selectedSize || 'all';
    try {
      localStorage.setItem(`urvaah_stock_notified_${targetId}_${targetSize}`, 'true');
    } catch (e) {}
    setHasSubscribedStock(true);
  };

  // Lock background screen scroll while QuickView is active
  useModalScrollLock(Boolean(quickViewProduct || isStockModalOpen), () => {
    if (!isStockModalOpen) setQuickViewProduct(null);
  });

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto overscroll-contain">
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
            className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-30 p-2.5 bg-white/95 text-black shadow-md border border-neutral-200 rounded-full hover:bg-black hover:text-white transition-colors duration-250 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 transition-colors duration-250" />
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
                  {(quickViewProduct.sizes || ['XS', 'S', 'M', 'L', 'XL']).map((size) => {
                    const matchK = Object.keys(sizeStock).find(k => k.trim().toUpperCase() === String(size).trim().toUpperCase());
                    const isSizeOut = matchK !== undefined && (parseInt(sizeStock[matchK], 10) || 0) <= 0;
                    const isSelected = selectedSize === size;

                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`relative h-10 min-w-[40px] px-3 border text-xs font-semibold tracking-wider transition-all overflow-hidden ${
                          isSelected
                            ? isSizeOut
                              ? 'border-neutral-800 bg-neutral-800 text-neutral-300 shadow-sm'
                              : 'border-brand-dark bg-brand-dark text-white shadow-sm'
                            : isSizeOut
                              ? 'border-neutral-200 bg-neutral-100 text-neutral-400 hover:border-neutral-400'
                              : 'border-neutral-200 text-brand-dark hover:border-black'
                        }`}
                        title={isSizeOut ? `Size ${size} (Out of Stock)` : `Size ${size}`}
                      >
                        <span className={isSizeOut ? 'line-through opacity-70' : ''}>{size}</span>
                        {isSizeOut && (
                          <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-bl-sm" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-neutral-100">
              {isOutOfStock ? (
                <Button
                  fullWidth
                  variant="primary"
                  onClick={() => setIsStockModalOpen(true)}
                  className="flex items-center justify-center gap-2 py-3.5 bg-neutral-900 hover:bg-black text-white"
                  title={
                    hasSubscribedStock
                      ? `Alert registered for size ${selectedSize}. Click to update contact details.`
                      : `Notify me when size ${selectedSize} is back in stock`
                  }
                >
                  {hasSubscribedStock ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>NOTIFY ME ({selectedSize}) - REGISTERED</span>
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4 text-amber-300 shrink-0" />
                      <span>NOTIFY ME ({selectedSize})</span>
                    </>
                  )}
                </Button>
              ) : (
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
              )}

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

        {/* Stock Notification / Out of Stock Popup */}
        <StockNotificationModal
          isOpen={isStockModalOpen}
          onClose={() => setIsStockModalOpen(false)}
          product={quickViewProduct}
          selectedSize={selectedSize}
          selectedColor="Default"
          user={user}
          onSubscribed={handleStockSubscribed}
        />
      </div>
    </AnimatePresence>
  );
};

export default QuickViewModal;
