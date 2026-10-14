import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Eye, ShoppingBag, Bell, X, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { StockNotificationModal } from '../product/StockNotificationModal';

export const ProductCard = ({ product, onQuickView, hideColorDots = true, hideOriginalPrice = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [hasSubscribedStock, setHasSubscribedStock] = useState(false);
  const [isSelectingSize, setIsSelectingSize] = useState(false);
  const [selectedSize, setSelectedSize] = useState('M');
  const [isAdding, setIsAdding] = useState(false);
  const cardRef = useRef(null);

  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist, setPdpProduct, pdpProduct, quickViewProduct, setQuickViewProduct, user } = useCart();
  const isWishlisted = isInWishlist(product.id);
  const isModalOpen = Boolean(pdpProduct || quickViewProduct || isStockModalOpen);
  const activeHover = isHovered && !isModalOpen;

  const isOutOfStock = Boolean(
    product?.inStock === false ||
    product?.instock === false ||
    (product?.stockQuantity !== undefined && product.stockQuantity !== null && Number(product.stockQuantity) <= 0) ||
    (product?.stock_quantity !== undefined && product.stock_quantity !== null && Number(product.stock_quantity) <= 0) ||
    (product?.stock !== undefined && product.stock !== null && Number(product.stock) <= 0) ||
    product?.isOutOfStock === true ||
    product?.status === 'Out of Stock' ||
    product?.status === 'out_of_stock'
  );

  const availableSizes = Array.isArray(product?.sizes) && product.sizes.length > 0
    ? product.sizes
    : ['XS', 'S', 'M', 'L', 'XL'];

  useEffect(() => {
    if (product?.id) {
      try {
        const generalKey = `urvaah_stock_notified_${product.id}_all`;
        const sizeKey = `urvaah_stock_notified_${product.id}_M`;
        const isStored =
          localStorage.getItem(generalKey) === 'true' ||
          localStorage.getItem(sizeKey) === 'true';
        setHasSubscribedStock(isStored);
      } catch (e) {
        setHasSubscribedStock(false);
      }
    }
  }, [product?.id]);

  const handleStockSubscribed = ({ productId } = {}) => {
    const targetId = productId || product?.id;
    try {
      localStorage.setItem(`urvaah_stock_notified_${targetId}_all`, 'true');
    } catch (e) {}
    setHasSubscribedStock(true);
  };

  useEffect(() => {
    if (!product?.carouselImages || product.carouselImages.length <= 1) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % product.carouselImages.length);
    }, 2500); // crossfade every 2.5s matching banner sections
    return () => clearInterval(interval);
  }, [product?.carouselImages]);

  // Close size selection when clicking anywhere outside this card
  useEffect(() => {
    if (!isSelectingSize) return;

    const handleDocumentClick = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        setIsSelectingSize(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('touchstart', handleDocumentClick);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('touchstart', handleDocumentClick);
    };
  }, [isSelectingSize]);

  const handleAddSelectedSize = (overrideSize = null) => {
    const sizeToUse = overrideSize || selectedSize || (availableSizes.includes('M') ? 'M' : availableSizes[0] || 'M');
    setIsAdding(true);
    // Add product to shopping bag with selected size
    addToCart(product, sizeToUse);

    setTimeout(() => {
      setIsAdding(false);
      setIsSelectingSize(false);
    }, 450);
  };

  const handleCardClick = () => {
    if (product?.id) {
      let targetId = product.id;
      if (product.id === 'bs-101' || product.id === '101' || product.id === '105' || product.id === 'prod-105' || product.id === 'bs-105' || (product.name && (product.name.toUpperCase().includes('CHESTNUT BLOOM SET') || product.name.toUpperCase().includes('MOCHA BROWN EMBROIDERED CO-ORD SET')))) {
        targetId = 'bs-101';
      } else if (product.id === 'bs-103' || product.id === '103' || product.id === '106' || product.id === 'prod-102' || product.id === 'bs-106' || (product.name && (product.name.toUpperCase().includes('SAGE BLOOM EMBROIDERED CORSET') || product.name.toUpperCase().includes('GILDED MIST CORSET') || product.name.toUpperCase().includes('PEACH BLOOM CORSET SET')))) {
        targetId = 'bs-103';
      }
      navigate(`/product/${targetId}`);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const formatPrice = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div
      ref={cardRef}
      onClick={handleCardClick}
      className={`group relative flex flex-col cursor-pointer transition-all duration-300 editorial-card ${
        isModalOpen ? 'pointer-events-none' : ''
      }`}
      onMouseEnter={() => !isModalOpen && setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsSelectingSize(false);
      }}
    >
      {/* Image Container */}
      <div className="relative w-full aspect-[3/4] bg-neutral-100 overflow-hidden mb-3">
        {/* Primary & Hover / Auto Carousel Images */}
        {product.carouselImages && product.carouselImages.length > 1 ? (
          product.carouselImages.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={`${product.name} ${i}`}
              className={`absolute inset-0 w-full h-full object-cover object-top filter brightness-[0.98] contrast-[1.02] transition-opacity duration-1000 ease-in-out ${
                i === carouselIndex ? 'opacity-100' : 'opacity-0'
              } transform ${!isModalOpen ? 'group-hover:scale-105' : ''} transition-transform duration-700 ease-out`}
              loading="lazy"
            />
          ))
        ) : (
          <div className="relative w-full h-full">
            <img
              src={product.image}
              alt={product.name}
              className={`absolute inset-0 w-full h-full object-cover object-top transition-all duration-500 ease-out transform ${
                !isModalOpen ? 'group-hover:scale-105' : ''
              } ${product.hoverImage && activeHover ? 'opacity-0' : 'opacity-100'}`}
              loading="lazy"
            />
            {product.hoverImage && (
              <img
                src={product.hoverImage}
                alt={`${product.name} hover view`}
                className={`absolute inset-0 w-full h-full object-cover object-top transition-all duration-500 ease-out transform ${
                  !isModalOpen ? 'group-hover:scale-105' : ''
                } ${activeHover ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                loading="lazy"
              />
            )}
          </div>
        )}

        {/* Wishlist Icon Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          aria-label="Wishlist toggle"
          title="Save to Wishlist"
          className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-10 w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center text-brand-dark transition-all duration-300 hover:bg-white hover:scale-110 shadow-sm min-w-[36px] min-h-[36px]"
        >
          <Heart
            className={`w-4 h-4 transition-colors duration-300 ${
              isWishlisted ? 'fill-red-700 text-red-700' : 'text-neutral-700'
            }`}
          />
        </button>

        {/* Quick Action Overlay Bar at bottom of card */}
        {isOutOfStock ? (
          <div className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent p-2 sm:p-3 transition-transform duration-300 ease-in-out flex items-center gap-1.5 sm:gap-2 z-10 ${
            !isModalOpen ? 'md:translate-y-full md:group-hover:translate-y-0 translate-y-0' : 'translate-y-full pointer-events-none'
          }`}>
            {hasSubscribedStock ? (
              <button
                type="button"
                disabled
                onClick={(e) => e.stopPropagation()}
                className="flex-1 bg-neutral-200/95 text-neutral-600 text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase py-2 px-2 sm:px-3 flex items-center justify-center gap-1 shadow-md min-h-[36px] cursor-not-allowed select-none border border-neutral-300/80"
                title="Alert registered — you will be notified when this item is back in stock"
              >
                <span>OUT OF STOCK</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsStockModalOpen(true);
                }}
                className="flex-1 bg-neutral-900 text-white hover:bg-black text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase py-2 px-2 sm:px-3 transition-colors flex items-center justify-center gap-1.5 shadow-md min-h-[36px] cursor-pointer group/notify"
                title="Notify me when available"
              >
                <Bell className="w-3.5 h-3.5 text-amber-300 group-hover/notify:scale-110 transition-transform" />
                <span>OUT OF STOCK</span>
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              title="View Product Details"
              aria-label="View Product Details"
              className="bg-black/85 hover:bg-black text-white p-2 min-w-[36px] min-h-[36px] transition-colors flex items-center justify-center shadow-md cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : !isSelectingSize ? (
          <div className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent p-2 sm:p-3 transition-transform duration-300 ease-in-out flex items-center gap-1.5 sm:gap-2 z-10 ${
            !isModalOpen ? 'md:translate-y-full md:group-hover:translate-y-0 translate-y-0' : 'translate-y-full pointer-events-none'
          }`}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsSelectingSize(true);
                if (!selectedSize || !availableSizes.includes(selectedSize)) {
                  setSelectedSize(availableSizes.includes('M') ? 'M' : availableSizes[0] || 'M');
                }
              }}
              className="flex-1 bg-white text-brand-dark text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase py-2 px-2 sm:px-3 hover:bg-neutral-100 transition-colors flex items-center justify-center gap-1 shadow-md min-h-[36px] cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              + Quick Add
            </button>
            
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              title="View Product Details"
              aria-label="View Product Details"
              className="bg-black/85 hover:bg-black text-white p-2 min-w-[36px] min-h-[36px] transition-colors flex items-center justify-center shadow-md cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* Size Selection Overlay (revealed upon clicking + Quick Add) */
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-md p-2.5 sm:p-3 shadow-xl border-t border-neutral-200/90 z-20 transition-all duration-300 ease-out flex flex-col gap-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-brand-dark uppercase font-serif">
                Select Size
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSelectingSize(false);
                }}
                className="text-neutral-400 hover:text-black p-1 transition-colors cursor-pointer rounded-full hover:bg-neutral-100"
                aria-label="Close size selector"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Size options buttons */}
            <div className="flex flex-wrap items-center gap-1.5 justify-center">
              {availableSizes.map((sz) => {
                const isSelected = selectedSize === sz;
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSize(sz);
                    }}
                    className={`flex-1 min-w-[32px] max-w-[58px] h-8 sm:h-9 border text-[10px] sm:text-[11px] font-semibold tracking-wider transition-all duration-200 flex items-center justify-center cursor-pointer shadow-2xs ${
                      isSelected
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-brand-dark border-neutral-300 hover:border-black hover:bg-neutral-50'
                    }`}
                    title={`Select size ${sz}`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>

            {/* Add to Bag Action Button */}
            <div className="w-full">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddSelectedSize();
                }}
                disabled={isAdding}
                className="w-full bg-brand-dark hover:bg-black text-white text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase py-2 px-3 transition-colors flex items-center justify-center gap-1.5 shadow-md min-h-[34px] sm:min-h-[36px] cursor-pointer disabled:opacity-75"
              >
                {isAdding ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Added to Bag</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add to Bag</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-col flex-1 px-1">
        <div className="flex justify-between items-start mb-1 gap-2">
          <h3 className="text-xs font-medium tracking-[0.12em] text-brand-dark uppercase line-clamp-1 group-hover:text-neutral-600 transition-colors font-serif">
            {product.name}
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs tracking-wide">
          <span className="font-medium text-brand-dark font-sans tabular-nums">
            {formatPrice(product.price)}
          </span>
          {!hideOriginalPrice && product.originalPrice && (
            <span className="text-neutral-400 line-through text-[11px] font-sans tabular-nums">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Color swatches preview */}
        {!hideColorDots && product.colors && product.colors.length > 0 && (
          <div className="flex items-center gap-1 mt-2">
            {product.colors.map((color, idx) => (
              <span
                key={idx}
                className="w-2.5 h-2.5 rounded-full border border-black/20"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stock Notification / Out of Stock Popup */}
      <StockNotificationModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        product={product}
        selectedSize="all"
        selectedColor="Default"
        user={user}
        onSubscribed={handleStockSubscribed}
      />
    </div>
  );
};
