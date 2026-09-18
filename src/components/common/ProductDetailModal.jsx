import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  ShoppingBag,
  Share2,
  ChevronDown,
  Ruler,
  Truck,
  Plus,
  Minus,
  X
} from 'lucide-react';
import { BEST_SELLERS_PRODUCTS, MOCK_PRODUCTS } from '../../data/mockProducts';
import { useCart } from '../../context/CartContext';
import { productApi } from '../../services/productApi';

export const ProductDetailModal = () => {
  const { pdpProduct, setPdpProduct, addToCart, toggleWishlist, isInWishlist, setIsCartOpen } = useCart();
  const [liveProduct, setLiveProduct] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (pdpProduct) {
      const prodId = typeof pdpProduct === 'object' ? pdpProduct.id : pdpProduct;
      if (prodId) {
        productApi.getProductById(prodId)
          .then(data => {
            if (isMounted && data) {
              setLiveProduct(data);
            }
          })
          .catch(() => {});
      }
    } else {
      setLiveProduct(null);
    }
    return () => { isMounted = false; };
  }, [pdpProduct]);

  // If pdpProduct is a string (id) or object, normalize product object
  const product = liveProduct || (pdpProduct
    ? typeof pdpProduct === 'object'
      ? pdpProduct
      : BEST_SELLERS_PRODUCTS.find((p) => p.id === pdpProduct) ||
        MOCK_PRODUCTS.find((p) => p.id === pdpProduct) ||
        BEST_SELLERS_PRODUCTS[0]
    : null);

  const gallery = Array.from(
    new Set(
      (product?.gallery || [
        product?.image,
        product?.hoverImage,
        '/assets/Images/Brown02.png',
        '/assets/Images/Brown03.png',
        '/assets/Images/Brown04.png',
        '/assets/Images/Brown01.png'
      ]).filter(Boolean)
    )
  ).slice(0, 4);

  const availableSizes = product?.sizes || [26, 28, 30, 32, 34, 36];

  const [selectedImage, setSelectedImage] = useState(gallery[0]);
  const [isMainHovered, setIsMainHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState(availableSizes[1] || availableSizes[0]);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [pincode, setPincode] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('8th and 9th Sep');
  const [openAccordion, setOpenAccordion] = useState(null);

  const thumbnailContainerRef = useRef(null);

  // Sync selected image & body scroll lock when pdpProduct opens/closes
  useEffect(() => {
    if (product) {
      if (gallery && gallery.length > 0) {
        setSelectedImage(gallery[0]);
      }
      if (availableSizes && availableSizes.length > 0) {
        setSelectedSize(availableSizes[1] || availableSizes[0]);
      }
      document.body.style.overflow = 'hidden';

      // Push URL state for shareability/history
      try {
        const hashUrl = `/#/product/${product.id}`;
        window.history.pushState({ pdpId: product.id }, '', hashUrl);
      } catch (e) {
        // Fallback silently if pushState fails
      }
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [pdpProduct]);

  // Handle Escape key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    if (product) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product]);

  const handleClose = () => {
    setPdpProduct(null);
    setIsSizeChartOpen(false);
    try {
      if (window.location.hash.includes('/product/')) {
        window.history.pushState({}, '', window.location.pathname);
      }
    } catch (e) {}
  };

  if (!product) return null;

  const isWishlisted = isInWishlist(product.id);

  const handleAddToCart = () => {
    addToCart({
      ...product,
      selectedSize
    });
    setIsAdded(true);
    setIsCartOpen(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  const scrollThumbnails = (direction) => {
    if (!thumbnailContainerRef.current) return;
    const scrollAmount = direction === 'down' ? 120 : -120;
    thumbnailContainerRef.current.scrollBy({ top: scrollAmount, behavior: 'smooth' });
  };

  const handleCheckPincode = () => {
    if (!pincode.trim()) return;
    const today = new Date();
    const d1 = new Date(today);
    d1.setDate(today.getDate() + 3);
    const d2 = new Date(today);
    d2.setDate(today.getDate() + 4);

    const monthName = d1.toLocaleString('default', { month: 'short' });
    setDeliveryDate(`${d1.getDate()}th and ${d2.getDate()}th ${monthName}`);
  };

  const toggleAccordion = (index) => {
    setOpenAccordion(openAccordion === index ? null : index);
  };

  const formatPrice = (val) => {
    if (!val) return '₹ 0';
    return '₹ ' + Number(val).toLocaleString('en-IN');
  };

  const coupons = [
    {
      title: 'Get 10% off on your first order via APP',
      btnText: 'DOWNLOAD NOW'
    },
    {
      title: 'Buy 2 Get Additional 10% Off on Selected Styles',
      btnText: 'VIEW ELIGIBLE PRODUCTS'
    },
    {
      title: 'Flat ₹500 Off on orders above ₹4999',
      btnText: 'APPLY AT CHECKOUT'
    }
  ];

  const accordionItems = [
    {
      title: 'SIZE DETAILS',
      content:
        product.sizeDetails ||
        "Model is 5'9\" (175 cm) wearing size 28. Tailored for a relaxed yet structured silhouette. Fits true to size."
    },
    {
      title: 'PRODUCT DESCRIPTION',
      content:
        product.description ||
        'Structured high-fashion garment crafted from premium virgin fabrics with meticulous architectural tailoring details, horn-effect buttons, and hand-finished seams.'
    },
    {
      title: 'ADDITIONAL INFORMATION',
      content:
        product.additionalInfo ||
        'Care: Dry clean only. Material: 70% Premium Wool, 30% Silk Twill. Country of Origin: India. Style Code: HOU-2026-AW.'
    },
    {
      title: 'CHECK AVAILABILITY',
      content:
        product.availability ||
        'Available in select House of Uraah flagships across Mumbai, New Delhi, and Bengaluru. Contact boutique concierge for private styling appointments.'
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 select-none font-serif">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative z-10 bg-white w-full max-w-[1200px] h-[96vh] sm:h-auto max-h-[96vh] sm:max-h-[88vh] rounded-none sm:rounded-sm shadow-2xl overflow-hidden flex flex-col border border-neutral-200"
        >
          {/* Explicit Close Button ("×" icon) */}
          <button
            onClick={handleClose}
            className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-30 w-10 h-10 rounded-full bg-white/95 shadow-md border border-neutral-200 flex items-center justify-center text-brand-dark hover:bg-black hover:text-white transition-all cursor-pointer min-w-[44px] min-h-[44px]"
            aria-label="Close modal"
            title="Close (Esc)"
          >
            <X className="w-5 h-5 stroke-[2]" />
          </button>

          {/* Inner Scrollable Body */}
          <div className="overflow-y-auto p-4 sm:p-6 md:p-10 no-scrollbar">
            {/* Grid: Left Gallery + Right Info */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
              {/* LEFT SIDE: Vertical Thumbnails + Main Product Image (7 Cols) */}
              <div className="lg:col-span-7 flex flex-col md:flex-row gap-3 md:gap-5 items-start">
                {/* Vertical Thumbnail Strip */}
                <div className="order-2 md:order-1 flex md:flex-col gap-2.5 max-h-[480px] md:max-h-[520px] overflow-x-auto md:overflow-y-auto no-scrollbar scroll-smooth p-0.5">
                  {gallery.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(imgUrl)}
                      className={`w-14 h-18 md:w-18 md:h-24 flex-shrink-0 bg-neutral-100 overflow-hidden transition-all border ${
                        selectedImage === imgUrl
                          ? 'border-2 border-black opacity-100 shadow-sm'
                          : 'border-neutral-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={product.name}
                        onError={(e) => {
                          e.currentTarget.parentElement.style.display = 'none';
                        }}
                        className="w-full h-full object-cover object-top"
                      />
                    </button>
                  ))}
                </div>

                {/* Main Product Image Container (Full image visible with contain) */}
                <div
                  className="order-1 md:order-2 flex-1 w-full relative aspect-[3/4] max-w-[560px] bg-[#F5F5F0] overflow-hidden shadow-sm border border-neutral-200/60 flex items-center justify-center p-2 group"
                  onMouseEnter={() => setIsMainHovered(true)}
                  onMouseLeave={() => setIsMainHovered(false)}
                >
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className={`w-full h-full object-contain object-center transition-all duration-500 ease-out ${
                      selectedImage === gallery[0] && product?.hoverImage && isMainHovered ? 'opacity-0' : 'opacity-100'
                    }`}
                  />
                  {selectedImage === gallery[0] && product?.hoverImage && (
                    <img
                      src={product.hoverImage}
                      alt={`${product.name} alternate view`}
                      className={`absolute inset-0 w-full h-full object-contain object-center p-2 transition-all duration-500 ease-out ${
                        isMainHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
                      }`}
                    />
                  )}
                  {product.tag && (
                    <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm text-brand-dark px-2.5 py-1 text-[9px] font-semibold tracking-widest uppercase border border-black/5">
                      {product.tag}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT SIDE: Product Info Panel (5 Cols) */}
              <div className="lg:col-span-5 flex flex-col text-left space-y-5">
                {/* Title & Brand */}
                <div>
                  <span className="text-[10px] font-serif tracking-[0.3em] uppercase text-neutral-400 block mb-1">
                    HOUSE OF URAAH
                  </span>
                  <h1 className="text-lg sm:text-xl md:text-2xl font-semibold tracking-[0.15em] uppercase text-brand-dark leading-tight pr-8">
                    {product.name}
                  </h1>
                </div>

                {/* Price Section */}
                <div className="border-b border-neutral-200 pb-4">
                  <div className="flex items-baseline gap-3">
                    <span className="text-xl md:text-2xl font-bold tracking-wider text-brand-dark">
                      {formatPrice(product.price)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-neutral-400 line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-neutral-400 font-normal tracking-wide mt-1 block">
                    Inclusive of All Taxes
                  </span>
                </div>

                {/* SIZE Selection */}
                <div>
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="text-xs font-bold tracking-widest uppercase text-brand-dark">
                      SIZE:
                    </span>
                    <button
                      onClick={() => setIsSizeChartOpen(true)}
                      className="inline-flex items-center gap-1.5 text-xs text-brand-dark font-medium underline underline-offset-4 hover:opacity-75 transition-opacity"
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      Size Chart
                    </button>
                  </div>

                  {/* Selectable Size Boxes */}
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setSelectedSize(sz)}
                        className={`w-11 h-11 border flex items-center justify-center text-xs font-semibold tracking-wider uppercase transition-all ${
                          selectedSize === sz
                            ? 'bg-black text-white border-black shadow-md'
                            : 'bg-white text-brand-dark border-neutral-300 hover:border-black'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CTA Buttons: ADD TO CART + Wishlist + Share */}
                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 bg-black text-white py-3.5 px-4 text-xs font-semibold tracking-[0.2em] uppercase hover:bg-neutral-800 transition-colors shadow-md flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {isAdded ? 'ADDED TO BAG ✓' : 'ADD TO CART'}
                  </button>

                  {/* Wishlist Heart Icon Button */}
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className={`w-12 h-12 border flex items-center justify-center transition-all ${
                      isWishlisted
                        ? 'border-red-600 bg-red-50 text-red-600'
                        : 'border-neutral-300 text-brand-dark hover:border-black'
                    }`}
                    aria-label="Wishlist toggle"
                    title="Save to Wishlist"
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-600' : 'stroke-[1.5]'}`} />
                  </button>

                  {/* Share Icon Button */}
                  <button
                    onClick={handleShare}
                    className="w-12 h-12 border border-neutral-300 text-brand-dark flex items-center justify-center hover:border-black transition-all relative"
                    aria-label="Share product"
                    title="Share product link"
                  >
                    <Share2 className="w-4 h-4 stroke-[1.5]" />
                    {copiedToast && (
                      <span className="absolute -top-8 bg-black text-white text-[10px] py-1 px-2 font-mono whitespace-nowrap shadow-lg">
                        Link Copied!
                      </span>
                    )}
                  </button>
                </div>

                {/* AVAILABLE OFFERS Section */}
                <div className="pt-5 border-t border-neutral-200">
                  <span className="text-xs font-bold tracking-widest uppercase text-brand-dark block mb-2.5">
                    AVAILABLE OFFERS
                  </span>

                  {/* Login Banner Button */}
                  <button className="w-full bg-black text-white py-2.5 px-3 text-[11px] tracking-widest uppercase font-semibold text-center hover:bg-neutral-800 transition-colors mb-3">
                    LOGIN TO SEE THE OFFERS ON THIS PRODUCT
                  </button>

                  {/* Horizontally Scrollable Coupon Cards Row (Fixed compact height) */}
                  <div className="flex gap-2.5 items-start overflow-x-auto no-scrollbar pb-1">
                    {coupons.map((coupon, idx) => (
                      <div
                        key={idx}
                        className="h-auto self-start min-w-[240px] max-w-[270px] border border-dashed border-neutral-300 bg-neutral-50/90 p-2.5 flex items-stretch gap-2.5 relative flex-shrink-0"
                      >
                        {/* Vertical Coupon Ticket Stub Badge (Shrinks to card height) */}
                        <div className="w-6 self-stretch bg-neutral-900 text-white text-[8px] font-bold uppercase tracking-widest [writing-mode:vertical-lr] rotate-180 flex items-center justify-center py-1.5 flex-shrink-0">
                          COUPON
                        </div>

                        <div className="flex flex-col text-left flex-1 justify-between gap-2 py-0.5">
                          <p className="text-[10px] font-medium text-neutral-800 leading-snug font-sans">
                            {coupon.title}
                          </p>
                          <button className="text-[9px] font-bold tracking-widest uppercase text-black underline underline-offset-2 hover:opacity-70 transition-opacity text-left">
                            {coupon.btnText}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PINCODE & DELIVERY CHECK */}
                <div className="pt-5 mt-1 border-t border-neutral-200">
                  <span className="text-xs font-bold tracking-widest uppercase text-brand-dark block mb-2">
                    CHECK DELIVERY & SERVICES
                  </span>

                  <div className="flex gap-2 max-w-sm">
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="Enter Pincode"
                      maxLength={6}
                      className="flex-1 border border-neutral-300 px-3 py-2 text-xs font-mono tracking-wider uppercase focus:outline-none focus:border-black"
                    />
                    <button
                      onClick={handleCheckPincode}
                      className="bg-black text-white px-5 py-2 text-xs font-semibold tracking-widest uppercase hover:bg-neutral-800 transition-colors"
                    >
                      Check
                    </button>
                  </div>

                  {/* Delivery Estimate Line */}
                  <div className="flex items-center gap-2 text-xs text-neutral-600 mt-2.5 font-sans">
                    <Truck className="w-4 h-4 text-brand-dark flex-shrink-0" />
                    <span>
                      Delivery between <strong className="text-black font-semibold">{deliveryDate}</strong>
                    </span>
                  </div>
                </div>

                {/* ACCORDION SECTIONS (4 Items, Default Closed) */}
                <div className="pt-4 border-t border-neutral-200 space-y-0.5">
                  {accordionItems.map((item, idx) => (
                    <div key={idx} className="border-b border-neutral-200 pb-2.5 pt-1.5">
                      <button
                        onClick={() => toggleAccordion(idx)}
                        className="w-full flex justify-between items-center text-xs font-bold tracking-[0.2em] uppercase text-brand-dark hover:opacity-75 transition-opacity text-left"
                      >
                        <span>{item.title}</span>
                        {openAccordion === idx ? (
                          <Minus className="w-4 h-4 stroke-[2]" />
                        ) : (
                          <Plus className="w-4 h-4 stroke-[2]" />
                        )}
                      </button>

                      {openAccordion === idx && (
                        <div className="mt-2.5 text-xs text-neutral-600 font-sans leading-relaxed pr-2">
                          {item.content}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* SIZE CHART MODAL OVERLAY */}
        {isSizeChartOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-60 flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full p-6 relative font-serif shadow-2xl border border-neutral-200">
              <button
                onClick={() => setIsSizeChartOpen(false)}
                className="absolute top-3.5 right-3.5 p-1.5 text-neutral-600 hover:text-black transition-colors"
                aria-label="Close size guide"
              >
                <X className="w-5 h-5" />
              </button>

              <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 block mb-1">
                HOUSE OF URAAH
              </span>
              <h2 className="text-base font-bold tracking-[0.2em] uppercase text-brand-dark mb-4 border-b border-neutral-200 pb-2.5">
                SIZE GUIDE (INCHES)
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans border-collapse">
                  <thead>
                    <tr className="border-b border-black bg-neutral-50 font-semibold tracking-wider uppercase text-neutral-700">
                      <th className="p-2">SIZE</th>
                      <th className="p-2">BUST</th>
                      <th className="p-2">WAIST</th>
                      <th className="p-2">HIPS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    <tr>
                      <td className="p-2 font-bold">26 (XS)</td>
                      <td className="p-2">32"</td>
                      <td className="p-2">25"</td>
                      <td className="p-2">35"</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold">28 (S)</td>
                      <td className="p-2">34"</td>
                      <td className="p-2">27"</td>
                      <td className="p-2">37"</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold">30 (M)</td>
                      <td className="p-2">36"</td>
                      <td className="p-2">29"</td>
                      <td className="p-2">39"</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold">32 (L)</td>
                      <td className="p-2">38"</td>
                      <td className="p-2">31"</td>
                      <td className="p-2">41"</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold">34 (XL)</td>
                      <td className="p-2">40"</td>
                      <td className="p-2">33"</td>
                      <td className="p-2">43"</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold">36 (XXL)</td>
                      <td className="p-2">42"</td>
                      <td className="p-2">35"</td>
                      <td className="p-2">45"</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-[10px] text-neutral-500 font-sans mt-3 italic">
                * Measurements are in inches. If between sizes, size up for a relaxed fit.
              </p>

              <button
                onClick={() => setIsSizeChartOpen(false)}
                className="w-full mt-5 bg-black text-white py-2.5 text-xs font-semibold tracking-widest uppercase hover:bg-neutral-800 transition-colors"
              >
                CLOSE SIZE GUIDE
              </button>
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
