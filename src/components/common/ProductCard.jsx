import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Eye, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const ProductCard = ({ product, onQuickView }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist, setPdpProduct, pdpProduct, quickViewProduct } = useCart();
  const isWishlisted = isInWishlist(product.id);
  const isModalOpen = Boolean(pdpProduct || quickViewProduct);
  const activeHover = isHovered && !isModalOpen;

  useEffect(() => {
    if (!product?.carouselImages || product.carouselImages.length <= 1) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % product.carouselImages.length);
    }, 2500); // crossfade every 2.5s matching banner sections
    return () => clearInterval(interval);
  }, [product?.carouselImages]);

  const handleCardClick = () => {
    if (product?.id) {
      navigate(`/product/${product.id}`);
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
      onClick={handleCardClick}
      className={`group relative flex flex-col cursor-pointer transition-all duration-300 editorial-card ${
        isModalOpen ? 'pointer-events-none' : ''
      }`}
      onMouseEnter={() => !isModalOpen && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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

        {/* Quick Action Overlay Bar at bottom of card (always visible on mobile, hover reveal on desktop) */}
        <div className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2 sm:p-3 transition-transform duration-300 ease-in-out flex items-center gap-1.5 sm:gap-2 ${
          !isModalOpen ? 'md:translate-y-full md:group-hover:translate-y-0 translate-y-0' : 'translate-y-full pointer-events-none'
        }`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
            className="flex-1 bg-white text-brand-dark text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase py-2 px-2 sm:px-3 hover:bg-neutral-100 transition-colors flex items-center justify-center gap-1 shadow-md min-h-[36px]"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            + Quick Add
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (product?.id) {
                navigate(`/product/${product.id}`);
                window.scrollTo({ top: 0, behavior: 'instant' });
              }
            }}
            title="Quick View"
            aria-label="Quick View"
            className="bg-black/85 hover:bg-black text-white p-2 min-w-[36px] min-h-[36px] transition-colors flex items-center justify-center shadow-md"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-col flex-1 px-1">
        <div className="flex justify-between items-start mb-1 gap-2">
          <h3 className="text-xs font-medium tracking-wider text-brand-dark uppercase line-clamp-1 group-hover:text-neutral-600 transition-colors">
            {product.name}
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs tracking-wider">
          <span className="font-normal text-brand-dark">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-neutral-400 line-through text-[11px]">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Color swatches preview */}
        {product.colors && product.colors.length > 0 && (
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
    </div>
  );
};
