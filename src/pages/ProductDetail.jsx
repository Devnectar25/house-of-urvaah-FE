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
  const [openAccordion, setOpenAccordion] = useState('desc');

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
              sizes: data.sizes || prev?.sizes || ['XS', 'S', 'M', 'L', 'XL'],
              nameOptions: data.nameOptions || data.name_options || prev?.nameOptions || [],
              productDetails: data.productDetails || data.product_details || prev?.productDetails || [],
              careInstructions: data.careInstructions || data.care_instructions || prev?.careInstructions || ''
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
              <div className="flex flex-col gap-2.5 max-h-[560px] overflow-y-auto no-scrollbar scroll-smooth p-0.5">
                {gallery.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(imgUrl)}
                    className={`w-16 h-20 flex-shrink-0 bg-neutral-100 overflow-hidden transition-all relative ${
                      selectedImage === imgUrl
                        ? 'ring-1.5 ring-black ring-offset-1 opacity-100 shadow-sm'
                        : 'border border-neutral-200 opacity-60 hover:opacity-100 hover:border-neutral-400'
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

          {/* RIGHT SIDE: Product Info & Actions Panel (Compact & Proportionate) */}
          <div className="lg:col-span-5 flex flex-col text-left space-y-2.5 sm:space-y-3 max-w-md pt-[70px]">
            {/* Title & Brand */}
            <div>
              <span className="text-[9px] sm:text-[9.5px] font-serif tracking-[0.25em] uppercase text-neutral-400 block mb-0.5">
                HOUSE OF URVAAH
              </span>
              <h1 className="text-base sm:text-lg font-semibold tracking-[0.08em] uppercase text-brand-dark leading-tight">
                {product.name}
              </h1>
              {product.shortDescription && (
                <p className="text-[11px] text-neutral-500 font-sans mt-0.5 leading-snug">
                  {product.shortDescription}
                </p>
              )}

              {/* NAME OPTIONS (Rendered dynamically if available) */}
              {Array.isArray(product.nameOptions || product.name_options) &&
                (product.nameOptions || product.name_options).filter(Boolean).length > 0 && (
                  <div className="mt-2 pt-1.5 border-t border-neutral-100/80">
                    <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-neutral-800 block mb-0.5 font-serif">
                      NAME OPTIONS
                    </span>
                    <ul className="space-y-0.5 font-sans text-[11px] text-neutral-600">
                      {(product.nameOptions || product.name_options)
                        .filter(Boolean)
                        .map((optName, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-neutral-800 shrink-0" />
                            <span>{optName}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
            </div>

            {/* Price Section */}
            <div className="border-b border-neutral-200/80 pb-2">
              <div className="flex items-baseline gap-2">
                <span className="text-lg sm:text-xl font-bold tracking-wider text-brand-dark font-sans">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="text-xs text-neutral-400 line-through font-sans">
                      {formatPrice(product.originalPrice)}
                    </span>
                    <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-sans tracking-wide">
                      {product.discount || Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>
              <span className="text-[10px] text-neutral-400 font-normal tracking-wide block font-sans">
                Inclusive of All Taxes
              </span>
            </div>

            {/* COLORS Selection */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-brand-dark block mb-1">
                  COLOR: <span className="font-normal text-neutral-600">{product.colors.join(', ')}</span>
                </span>
                <div className="flex flex-wrap gap-1 font-sans">
                  {product.colors.map((col, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 border border-neutral-300 text-[10px] font-medium bg-neutral-50 text-brand-dark rounded-xs"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* SIZE Selection */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold tracking-wider uppercase text-brand-dark">
                  SIZE:
                </span>
                <button
                  onClick={() => setIsSizeChartOpen(true)}
                  className="inline-flex items-center gap-1 text-[10px] text-brand-dark font-medium underline underline-offset-2 hover:opacity-75 transition-opacity cursor-pointer font-sans"
                >
                  <Ruler className="w-3 h-3" />
                  Size Chart
                </button>
              </div>

              {/* Selectable Size Boxes */}
              <div className="flex flex-wrap gap-1.5 font-sans">
                {availableSizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`w-8 h-8 sm:w-8.5 sm:h-8.5 border flex items-center justify-center text-[11px] font-semibold tracking-wider uppercase transition-all cursor-pointer ${
                      selectedSize === sz
                        ? 'bg-black text-white border-black shadow-xs'
                        : 'bg-white text-brand-dark border-neutral-300 hover:border-black'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA Buttons: ADD TO CART + Wishlist + Share */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <button
                onClick={handleAddToCart}
                disabled={product.inStock === false || (product.stockQuantity !== undefined && product.stockQuantity <= 0)}
                className={`flex-1 h-9 sm:h-9.5 px-3 text-[10.5px] font-semibold tracking-[0.15em] uppercase transition-colors shadow-xs flex items-center justify-center gap-1.5 font-sans cursor-pointer ${
                  product.inStock === false || (product.stockQuantity !== undefined && product.stockQuantity <= 0)
                    ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-neutral-800'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                {product.inStock === false || (product.stockQuantity !== undefined && product.stockQuantity <= 0)
                  ? 'OUT OF STOCK'
                  : (isAdded ? 'ADDED TO BAG ✓' : 'ADD TO BAG')}
              </button>

              {/* Wishlist Heart Icon Button */}
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`w-9 h-9 sm:w-9.5 sm:h-9.5 border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  isWishlisted
                    ? 'border-red-600 bg-red-50 text-red-600'
                    : 'border-neutral-300 text-brand-dark hover:border-black'
                }`}
                aria-label="Wishlist toggle"
                title="Save to Wishlist"
              >
                <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-red-600 text-red-600' : 'stroke-[1.5]'}`} />
              </button>

              {/* Share Icon Button */}
              <button
                onClick={handleShare}
                className="w-9 h-9 sm:w-9.5 sm:h-9.5 border border-neutral-300 text-brand-dark flex items-center justify-center hover:border-black transition-all relative cursor-pointer shrink-0"
                aria-label="Share product"
                title="Share product link"
              >
                <Share2 className="w-3.5 h-3.5 stroke-[1.5]" />
                {copiedToast && (
                  <span className="absolute -top-7 bg-black text-white text-[9px] py-0.5 px-1.5 font-mono whitespace-nowrap shadow-lg">
                    Link Copied!
                  </span>
                )}
              </button>
            </div>

            {/* PINCODE & DELIVERY CHECK */}
            <div className="pt-2 border-t border-neutral-200">
              <span className="text-[10px] font-bold tracking-wider uppercase text-brand-dark block mb-1">
                CHECK DELIVERY & SERVICES
              </span>

              <div className="flex gap-1.5 max-w-xs font-sans">
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="ENTER PINCODE"
                  maxLength={6}
                  className="flex-1 border border-neutral-300 px-2.5 py-1 text-[11px] font-mono tracking-wider uppercase focus:outline-none focus:border-black h-8"
                />
                <button
                  onClick={handleCheckPincode}
                  className="bg-black text-white px-3 py-1 text-[10.5px] font-semibold tracking-wider uppercase hover:bg-neutral-800 transition-colors cursor-pointer h-8"
                >
                  CHECK
                </button>
              </div>

              {/* Delivery Estimate Line */}
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-600 mt-1 font-sans">
                <Truck className="w-3 h-3 text-brand-dark flex-shrink-0" />
                <span>
                  Delivery between <strong className="text-black font-semibold">{deliveryDate}</strong>
                </span>
              </div>
            </div>

            {/* ACCORDION SECTIONS */}
            <div className="pt-2 border-t border-neutral-200 space-y-0.5">
              {/* Product Description */}
              {product.description && (
                <div className="border-b border-neutral-200/80 pb-1.5 pt-0.5">
                  <button
                    onClick={() => toggleAccordion('desc')}
                    className="w-full flex justify-between items-center text-[10px] font-bold tracking-wider uppercase text-brand-dark hover:opacity-75 transition-opacity text-left cursor-pointer"
                  >
                    <span>PRODUCT DESCRIPTION</span>
                    {openAccordion === 'desc' ? <Minus className="w-3 h-3 stroke-[2]" /> : <Plus className="w-3 h-3 stroke-[2]" />}
                  </button>
                  {openAccordion === 'desc' && (
                    <div className="mt-1 text-[11px] text-neutral-600 font-sans leading-relaxed pr-2 whitespace-pre-line">
                      {product.description}
                    </div>
                  )}
                </div>
              )}

              {/* Product Details (Dynamic Bullet Points) */}
              {Array.isArray(product.productDetails || product.product_details) &&
                (product.productDetails || product.product_details).filter(d => (d.label && d.label.trim()) || (d.value && d.value.trim())).length > 0 && (
                  <div className="border-b border-neutral-200 pb-1.5 pt-1">
                    <button
                      onClick={() => toggleAccordion('pdetails')}
                      className="w-full flex justify-between items-center text-[10px] font-bold tracking-wider uppercase text-brand-dark hover:opacity-75 transition-opacity text-left cursor-pointer"
                    >
                      <span>PRODUCT DETAILS</span>
                      {openAccordion === 'pdetails' ? <Minus className="w-3 h-3 stroke-[2]" /> : <Plus className="w-3 h-3 stroke-[2]" />}
                    </button>
                    {openAccordion === 'pdetails' && (
                      <div className="mt-1 text-[11px] text-neutral-600 font-sans leading-relaxed pr-2">
                        <ul className="space-y-1">
                          {(product.productDetails || product.product_details)
                            .filter(d => (d.label && d.label.trim()) || (d.value && d.value.trim()))
                            .map((detail, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-neutral-800 shrink-0 mt-1.5" />
                                <div>
                                  {detail.label && detail.label.trim() && (
                                    <strong className="font-semibold text-neutral-900">{detail.label.trim()}: </strong>
                                  )}
                                  <span>{detail.value}</span>
                                </div>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

              {/* Specifications Accordion */}
              {Array.isArray(product.specifications) && product.specifications.length > 0 && (
                <div className="border-b border-neutral-200 pb-1.5 pt-1">
                  <button
                    onClick={() => toggleAccordion('specs')}
                    className="w-full flex justify-between items-center text-[10px] font-bold tracking-wider uppercase text-brand-dark hover:opacity-75 transition-opacity text-left cursor-pointer"
                  >
                    <span>SPECIFICATIONS</span>
                    {openAccordion === 'specs' ? <Minus className="w-3 h-3 stroke-[2]" /> : <Plus className="w-3 h-3 stroke-[2]" />}
                  </button>
                  {openAccordion === 'specs' && (
                    <div className="mt-1 text-[11px] text-neutral-600 font-sans leading-relaxed pr-2 space-y-1">
                      {product.specifications.map((sp, idx) => (
                        <div key={idx} className="flex items-center justify-between border-b border-neutral-100 pb-0.5">
                          <span className="font-semibold text-neutral-700">{sp.label}:</span>
                          <span className="text-neutral-600">{sp.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Care Instructions Accordion */}
              {(product.careInstructions || product.care_instructions) && (
                <div className="border-b border-neutral-200 pb-1.5 pt-1">
                  <button
                    onClick={() => toggleAccordion('care')}
                    className="w-full flex justify-between items-center text-[10px] font-bold tracking-wider uppercase text-brand-dark hover:opacity-75 transition-opacity text-left cursor-pointer"
                  >
                    <span>CARE INSTRUCTIONS</span>
                    {openAccordion === 'care' ? <Minus className="w-3 h-3 stroke-[2]" /> : <Plus className="w-3 h-3 stroke-[2]" />}
                  </button>
                  {openAccordion === 'care' && (
                    <div className="mt-1 text-[11px] text-neutral-600 font-sans leading-relaxed pr-2">
                      {product.careInstructions || product.care_instructions}
                    </div>
                  )}
                </div>
              )}

              {/* Additional Information Accordion */}
              {product.additionalInfo && (
                <div className="border-b border-neutral-200 pb-1.5 pt-1">
                  <button
                    onClick={() => toggleAccordion('info')}
                    className="w-full flex justify-between items-center text-[10px] font-bold tracking-wider uppercase text-brand-dark hover:opacity-75 transition-opacity text-left cursor-pointer"
                  >
                    <span>ADDITIONAL INFORMATION</span>
                    {openAccordion === 'info' ? <Minus className="w-3 h-3 stroke-[2]" /> : <Plus className="w-3 h-3 stroke-[2]" />}
                  </button>
                  {openAccordion === 'info' && (
                    <div className="mt-1 text-[11px] text-neutral-600 font-sans leading-relaxed pr-2">
                      {product.additionalInfo}
                    </div>
                  )}
                </div>
              )}
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
