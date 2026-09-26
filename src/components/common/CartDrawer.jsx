import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { Button } from './Button';

export const CartDrawer = () => {
  const navigate = useNavigate();
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    cartSubtotal,
    freeShippingProgress,
  } = useCart();

  const formatPrice = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const freeShippingNeeded = Math.max(0, 2999 - cartSubtotal);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-serif selection:bg-brand-dark selection:text-white select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40"
          />

          {/* Right Slide-in Side Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md h-full bg-white border-l border-neutral-200 shadow-2xl overflow-hidden flex flex-col text-brand-dark"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-neutral-100 flex items-center justify-between bg-[#FAF8F3]">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-neutral-800 stroke-[1.75]" />
                <h2 className="text-sm sm:text-base font-semibold tracking-widest uppercase text-neutral-900">
                  SHOPPING BAG ({cart.reduce((a, b) => a + b.quantity, 0)})
                </h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-neutral-500 hover:text-black transition-colors cursor-pointer"
                aria-label="Close cart popup"
              >
                <X className="w-5 h-5 stroke-[1.75]" />
              </button>
            </div>

            {/* Free Shipping Meter */}
            <div className="bg-[#FAF8F3] px-5 sm:px-6 py-3 border-b border-neutral-200/80">
              <div className="flex justify-between items-center text-xs tracking-wide mb-1.5 font-medium">
                <span>
                  {freeShippingNeeded === 0 ? (
                    <span className="text-emerald-800 font-semibold">
                      🎉 YOU QUALIFY FOR FREE EXPRESS SHIPPING!
                    </span>
                  ) : (
                    <span className="text-neutral-700">
                      Add <strong className="text-black font-semibold">{formatPrice(freeShippingNeeded)}</strong> more for FREE Express Shipping
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-neutral-600 font-mono font-bold">{freeShippingProgress}%</span>
              </div>
              <div className="w-full bg-neutral-200/90 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#111111] h-full transition-all duration-500"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 divide-y divide-neutral-100">
              {cart.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center text-neutral-400">
                  <ShoppingBag className="w-12 h-12 stroke-[1] mb-4 text-neutral-300" />
                  <p className="text-sm tracking-wider uppercase mb-6 text-neutral-700 font-medium">
                    YOUR SHOPPING BAG IS EMPTY
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setIsCartOpen(false)}
                    className="text-xs tracking-widest uppercase"
                  >
                    CONTINUE SHOPPING
                  </Button>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={`${item.product.id}-${item.selectedSize}-${idx}`} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-20 h-24 object-cover object-top bg-neutral-100 flex-shrink-0 border border-neutral-200/60"
                    />

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-900 line-clamp-1">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.product.id, item.selectedSize)}
                            className="text-neutral-400 hover:text-red-700 transition-colors p-1"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5 stroke-[1.75]" />
                          </button>
                        </div>
                        <p className="text-[11px] text-neutral-600 tracking-wider mt-1 font-medium">
                          SIZE: <span className="font-bold text-neutral-900">{item.selectedSize}</span>
                        </p>
                        <p className="text-xs font-semibold text-neutral-900 mt-1">
                          {formatPrice(item.product.price)}
                        </p>
                      </div>

                      {/* Quantity selector */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-100">
                        <div className="flex items-center border border-neutral-300 text-xs">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.selectedSize, -1)}
                            className="p-1.5 px-2 hover:bg-neutral-100 transition-colors"
                          >
                            <Minus className="w-3 h-3 stroke-[1.75]" />
                          </button>
                          <span className="px-3 font-semibold text-xs text-neutral-900">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.selectedSize, 1)}
                            className="p-1.5 px-2 hover:bg-neutral-100 transition-colors"
                          >
                            <Plus className="w-3 h-3 stroke-[1.75]" />
                          </button>
                        </div>

                        <span className="text-xs font-bold text-neutral-900">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer / Summary */}
            {cart.length > 0 && (
              <div className="p-5 sm:p-6 border-t border-neutral-200 bg-white">
                <div className="flex justify-between items-center mb-1 text-xs tracking-wider">
                  <span className="text-neutral-600 uppercase font-semibold">SUBTOTAL</span>
                  <span className="font-bold text-base text-neutral-900">{formatPrice(cartSubtotal)}</span>
                </div>
                <p className="text-[10px] text-neutral-500 tracking-wide mb-4 font-light">
                  Taxes and shipping calculated at checkout.
                </p>

                <Button
                  fullWidth
                  variant="primary"
                  className="group flex items-center justify-center gap-2 py-4 bg-[#111111] hover:bg-neutral-800 text-white text-xs font-semibold tracking-[0.25em] uppercase transition-colors cursor-pointer"
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/checkout');
                  }}
                >
                  PROCEED TO CHECKOUT
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform stroke-[1.75]" />
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
