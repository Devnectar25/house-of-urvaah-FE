import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Heart,
  ShoppingBag,
  Share2,
  Ruler,
  Truck,
  Plus,
  Minus,
  X,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { BEST_SELLERS_PRODUCTS, MOCK_PRODUCTS } from '../data/mockProducts';
import { useCart } from '../context/CartContext';
import { productApi } from '../services/productApi';
import { SEOHead } from '../components/common/SEOHead';

const ALL_CATALOG_PRODUCTS = [...BEST_SELLERS_PRODUCTS, ...MOCK_PRODUCTS];

const findLocalProduct = (id) => {
  if (!id) return null;
  const strId = String(id).trim();
  const numId = strId.replace(/\D/g, '');

  return ALL_CATALOG_PRODUCTS.find((p) => {
    const pStrId = String(p.id).trim();
    const pNumId = pStrId.replace(/\D/g, '');
    if (pStrId === strId) return true;
    if (numId && pNumId && numId === pNumId) return true;
    return false;
  });
};

export const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist, setIsCartOpen, openAuthModal, user } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Gallery & Image Viewer States
  const [selectedImage, setSelectedImage] = useState('');
  const [isMainHovered, setIsMainHovered] = useState(false);

  // Size Selection State
  const [selectedSize, setSelectedSize] = useState('M');
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);

  // Interactive UI States
  const [copiedToast, setCopiedToast] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [pincode, setPincode] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('8th and 9th Sep');
  const [openAccordion, setOpenAccordion] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    let isMounted = true;
    setLoading(true);

    if (id) {
      // 1. Try local catalog first for instant response
      const local = findLocalProduct(id);
      if (local) {
        setProduct(local);
        setLoading(false);
      }

      // 2. Fetch from backend API to ensure authoritative product data
      productApi
        .getProductById(id)
        .then((data) => {
          if (isMounted && data && (data.name || data.title)) {
            setProduct((prev) => ({
              ...prev,
              ...data,
              id: String(data.id || id),
              name: data.name || data.title || prev?.name,
              price: parseFloat(data.price) || prev?.price || 8990,
              originalPrice: parseFloat(data.originalPrice || data.originalprice) || prev?.originalPrice,
              image: data.image || prev?.image,
              hoverImage: data.hoverImage || prev?.hoverImage || data.image,
              gallery: data.gallery && data.gallery.length > 0 ? data.gallery : (prev?.gallery || [data.image]),
              sizes: data.sizes || prev?.sizes || ['XS', 'S', 'M', 'L', 'XL']
            }));
          } else if (isMounted && !local) {
            fallbackProduct(id);
          }
        })
        .catch(() => {
          if (isMounted && !local) {
            fallbackProduct(id);
          }
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  const fallbackProduct = (productId) => {
    const found =
      findLocalProduct(productId) ||
      BEST_SELLERS_PRODUCTS.find((p) => p.id === 'bs-101') ||
      BEST_SELLERS_PRODUCTS[0];
    setProduct(found);
  };

  const gallery = Array.from(
    new Set(
      (product?.gallery && product.gallery.length > 0
        ? product.gallery
        : [
            product?.image,
            product?.hoverImage,
            '/assets/Images/Brown02.png',
            '/assets/Images/Brown03.png',
            '/assets/Images/Brown04.png',
            '/assets/Images/Brown01.png'
          ]
      ).filter(Boolean)
    )
  ).slice(0, 4);

  const availableSizes = product?.sizes || ['XS', 'S', 'M', 'L', 'XL'];

  useEffect(() => {
    if (product) {
      if (gallery && gallery.length > 0) {
        setSelectedImage(gallery[0]);
      }
      if (availableSizes && availableSizes.length > 0) {
        setSelectedSize(availableSizes[1] || availableSizes[0]);
      }
    }
  }, [product?.id]);

  if (loading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center bg-white font-serif pt-28">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <span className="text-[11px] tracking-[0.25em] text-neutral-400 uppercase font-sans">
            LOADING GARMENT...
          </span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 pt-32 text-center font-serif">
        <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 mb-2">
          HOUSE OF URVAAH
        </span>
        <h1 className="text-2xl tracking-[0.2em] uppercase mb-4 text-brand-dark font-normal">
          PRODUCT NOT FOUND
        </h1>
        <Link
          to="/"
          className="inline-block bg-black text-white text-xs font-semibold tracking-widest px-8 py-3.5 uppercase hover:bg-neutral-800 transition-colors"
        >
          RETURN TO HOMEPAGE
        </Link>
      </div>
    );
  }

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
        'Available in select House of Urvaah flagships across Mumbai, New Delhi, and Bengaluru. Contact boutique concierge for private styling appointments.'
    }
  ];

  return (
    <div className="w-full bg-white font-serif text-brand-dark min-h-screen pt-24 sm:pt-28 pb-20 selection:bg-brand-dark selection:text-white">
      <SEOHead
        title={`${product.name} | House of Urvaah`}
        description={product.description || `Shop ${product.name} at House of Urvaah. High-fashion luxury silhouette crafted from premium virgin fabrics.`}
        keywords={`${product.name}, ${product.category || 'Luxury Fashion'}, House of Urvaah apparel`}
        ogImage={product.image || (gallery && gallery[0])}
        ogType="product"
      />

      <div className="max-w-[1360px] mx-auto px-4 sm:px-8 md:px-10 lg:px-12">
        {/* Breadcrumb Navigation Row */}
        <div className="mb-6 md:mb-8 pb-4 border-b border-neutral-100 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-sans font-semibold tracking-[0.2em] uppercase text-brand-dark hover:opacity-70 transition-opacity cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK</span>
          </button>

          <nav className="hidden sm:flex items-center gap-2 text-[11px] font-sans tracking-widest uppercase text-neutral-400">
            <Link to="/" className="hover:text-black transition-colors">
              HOME
            </Link>
            <ChevronRight className="w-3 h-3 text-neutral-300" />
            <span>COLLECTION</span>
            <ChevronRight className="w-3 h-3 text-neutral-300" />
            <span className="text-black font-medium line-clamp-1">{product.name}</span>
          </nav>
        </div>

        {/* Main Product Layout Container (Left Gallery + Right Product Details) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-10 items-start">
          
          {/* LEFT SIDE: Image Gallery (Mobile Stacked Uncropped Gallery + Desktop Side-by-Side Viewer) */}
          <div className="lg:col-span-7 flex flex-col items-start w-full">
            {/* MOBILE VIEW (< md): Single-column stacked gallery with 100% full uncropped photos */}
            <div className="flex md:hidden flex-col gap-4 w-full">
              {gallery.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="w-full relative bg-[#F5F5F0] border border-neutral-200/60 overflow-hidden shadow-xs p-2 flex items-center justify-center"
                >
                  <img
                    src={imgUrl}
                    alt={`${product.name} view ${idx + 1}`}
                    className="w-full h-auto max-h-[85vh] object-contain object-center"
                    onError={(e) => {
                      e.currentTarget.parentElement.style.display = 'none';
                    }}
                  />
                  {idx === 0 && product.tag && (
                    <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm text-brand-dark px-2.5 py-1 text-[9px] font-semibold tracking-widest uppercase border border-black/5">
                      {product.tag}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* DESKTOP VIEW (>= md): Side-by-Side Vertical Thumbnails + Main Product Viewer */}
            <div className="hidden md:flex md:flex-row gap-5 items-start flex-1 w-full">
              {/* Vertical Thumbnail Strip */}
              <div className="flex flex-col gap-3 max-h-[560px] overflow-y-auto no-scrollbar scroll-smooth p-0.5">
                {gallery.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(imgUrl)}
                    className={`w-20 h-26 flex-shrink-0 bg-neutral-100 overflow-hidden transition-all border ${
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
                      className="w-full h-full object-contain object-center p-1"
                    />
                  </button>
                ))}
              </div>

              {/* Main Product Image Container */}
              <div
                className="flex-1 w-full relative aspect-[3/4] max-w-[620px] bg-[#F5F5F0] overflow-hidden shadow-xs border border-neutral-200/60 flex items-center justify-center p-2 group"
                onMouseEnter={() => setIsMainHovered(true)}
                onMouseLeave={() => setIsMainHovered(false)}
              >
                <img
                  src={selectedImage || gallery[0]}
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
          </div>

          {/* RIGHT SIDE: Product Info & Actions Panel */}
          <div className="lg:col-span-5 flex flex-col text-left space-y-4">
            {/* Title & Brand */}
            <div>
              <span className="text-[10px] font-serif tracking-[0.3em] uppercase text-neutral-400 block mb-1">
                HOUSE OF URVAAH
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-[0.15em] uppercase text-brand-dark leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Price Section */}
            <div className="border-b border-neutral-200 pb-3">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl md:text-3xl font-bold tracking-wider text-brand-dark font-sans">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-neutral-400 line-through font-sans">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
              <span className="text-xs text-neutral-400 font-normal tracking-wide mt-1 block font-sans">
                Inclusive of All Taxes
              </span>
            </div>

            {/* SIZE Selection */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold tracking-widest uppercase text-brand-dark">
                  SIZE:
                </span>
                <button
                  onClick={() => setIsSizeChartOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-brand-dark font-medium underline underline-offset-4 hover:opacity-75 transition-opacity cursor-pointer font-sans"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  Size Chart
                </button>
              </div>

              {/* Selectable Size Boxes */}
              <div className="flex flex-wrap gap-2 font-sans">
                {availableSizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`w-11 h-11 border flex items-center justify-center text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer ${
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
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-black text-white py-3.5 sm:py-4 px-4 text-xs font-semibold tracking-[0.2em] uppercase hover:bg-neutral-800 transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer font-sans"
              >
                <ShoppingBag className="w-4 h-4" />
                {isAdded ? 'ADDED TO BAG ✓' : 'ADD TO BAG'}
              </button>

              {/* Wishlist Heart Icon Button */}
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`w-12 h-12 border flex items-center justify-center transition-all cursor-pointer ${
                  isWishlisted
                    ? 'border-red-600 bg-red-50 text-red-600'
                    : 'border-neutral-300 text-brand-dark hover:border-black'
                }`}
                aria-label="Wishlist toggle"
                title="Save to Wishlist"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-600 text-red-600' : 'stroke-[1.5]'}`} />
              </button>

              {/* Share Icon Button */}
              <button
                onClick={handleShare}
                className="w-12 h-12 border border-neutral-300 text-brand-dark flex items-center justify-center hover:border-black transition-all relative cursor-pointer"
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
            <div className="pt-3.5 border-t border-neutral-200">
              <span className="text-xs font-bold tracking-widest uppercase text-brand-dark block mb-2">
                AVAILABLE OFFERS
              </span>

              {/* Login Banner Button */}
              <button
                onClick={() => !user && openAuthModal('login')}
                className="w-full bg-black text-white py-2.5 px-3 text-[11px] tracking-widest uppercase font-semibold text-center hover:bg-neutral-800 transition-colors mb-2.5 cursor-pointer font-sans"
              >
                {user ? 'MEMBERS-ONLY OFFERS UNLOCKED' : 'LOGIN TO SEE THE OFFERS ON THIS PRODUCT'}
              </button>

              {/* Horizontally Scrollable Coupon Cards Row */}
              <div className="flex gap-2.5 items-start overflow-x-auto no-scrollbar pb-0.5">
                {coupons.map((coupon, idx) => (
                  <div
                    key={idx}
                    className="h-auto self-start min-w-[240px] max-w-[270px] border border-dashed border-neutral-300 bg-neutral-50/90 p-2.5 flex items-stretch gap-2.5 relative flex-shrink-0"
                  >
                    <div className="w-6 self-stretch bg-neutral-900 text-white text-[8px] font-bold uppercase tracking-widest [writing-mode:vertical-lr] rotate-180 flex items-center justify-center py-1.5 flex-shrink-0">
                      COUPON
                    </div>

                    <div className="flex flex-col text-left flex-1 justify-between gap-2 py-0.5 font-sans">
                      <p className="text-[10px] font-medium text-neutral-800 leading-snug">
                        {coupon.title}
                      </p>
                      <button className="text-[9px] font-bold tracking-widest uppercase text-black underline underline-offset-2 hover:opacity-70 transition-opacity text-left cursor-pointer">
                        {coupon.btnText}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PINCODE & DELIVERY CHECK */}
            <div className="pt-3.5 border-t border-neutral-200">
              <span className="text-xs font-bold tracking-widest uppercase text-brand-dark block mb-2">
                CHECK DELIVERY & SERVICES
              </span>

              <div className="flex gap-2 max-w-sm font-sans">
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
                  className="bg-black text-white px-5 py-2 text-xs font-semibold tracking-widest uppercase hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Check
                </button>
              </div>

              {/* Delivery Estimate Line */}
              <div className="flex items-center gap-2 text-xs text-neutral-600 mt-2 font-sans">
                <Truck className="w-4 h-4 text-brand-dark flex-shrink-0" />
                <span>
                  Delivery between <strong className="text-black font-semibold">{deliveryDate}</strong>
                </span>
              </div>
            </div>

            {/* ACCORDION SECTIONS */}
            <div className="pt-3 border-t border-neutral-200 space-y-0.5">
              {accordionItems.map((item, idx) => (
                <div key={idx} className="border-b border-neutral-200 pb-2.5 pt-1.5">
                  <button
                    onClick={() => toggleAccordion(idx)}
                    className="w-full flex justify-between items-center text-xs font-bold tracking-[0.2em] uppercase text-brand-dark hover:opacity-75 transition-opacity text-left cursor-pointer"
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

      {/* SIZE CHART MODAL OVERLAY */}
      {isSizeChartOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 relative font-serif shadow-2xl border border-neutral-200">
            <button
              onClick={() => setIsSizeChartOpen(false)}
              className="absolute top-3.5 right-3.5 p-1.5 text-neutral-600 hover:text-black transition-colors cursor-pointer"
              aria-label="Close size guide"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 block mb-1">
              HOUSE OF URVAAH
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
              className="w-full mt-5 bg-black text-white py-2.5 text-xs font-semibold tracking-widest uppercase hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              CLOSE SIZE GUIDE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
