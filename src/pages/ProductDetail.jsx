import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Bookmark,
  ShoppingBag,
  ArrowLeft,
  ChevronRight,
  Share2
} from 'lucide-react';
import { BEST_SELLERS_PRODUCTS, MOCK_PRODUCTS } from '../data/mockProducts';
import { useCart } from '../context/CartContext';
import { productApi } from '../services/productApi';
import { SEOHead } from '../components/common/SEOHead';

export const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist, setIsCartOpen } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // UI States
  const [isAdded, setIsAdded] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    let isMounted = true;
    setLoading(true);

    if (id) {
      productApi
        .getProductById(id)
        .then((data) => {
          if (isMounted && data) {
            setProduct(data);
          } else if (isMounted) {
            fallbackProduct(id);
          }
        })
        .catch(() => {
          if (isMounted) {
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
      BEST_SELLERS_PRODUCTS.find((p) => p.id === productId) ||
      MOCK_PRODUCTS.find((p) => p.id === productId) ||
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
            '/assets/Images/Brown03.png'
          ]
      ).filter(Boolean)
    )
  ).slice(0, 4);

  if (loading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center bg-white font-serif">
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center font-serif">
        <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 mb-2">
          HOUSE OF URVAAH
        </span>
        <h1 className="text-2xl tracking-[0.2em] uppercase mb-4 text-brand-dark">
          PRODUCT NOT FOUND
        </h1>
        <Link
          to="/"
          className="inline-block bg-black text-white text-xs font-semibold tracking-widest px-6 py-3 uppercase hover:bg-neutral-800 transition-colors"
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
      selectedSize: 'M'
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

  const formatPrice = (val) => {
    if (!val) return '₹ 0';
    return '₹ ' + Number(val).toLocaleString('en-IN');
  };

  // Variant reference code generator
  const getReferenceCode = (prod) => {
    if (prod.referenceCode) return prod.referenceCode;
    if (prod.id === 'bs-102') return 'NAVY BLUE | 1255/717/401';
    if (prod.id === 'bs-101') return 'TAUPE BROWN | 8421/305/702';
    if (prod.id === 'bs-103') return 'BLUSH PEACH | 5109/248/119';
    if (prod.id === 'bs-104') return 'ROSE DUST | 3901/412/084';
    return `${(prod.category || 'CLASSIC').toUpperCase()} | ${prod.id.toUpperCase()}/2026`;
  };

  return (
    <div className="w-full bg-white font-serif text-brand-dark min-h-screen py-6 md:py-10">
      <SEOHead
        title={`${product.name} | House of Urvaah`}
        description={product.description || `Shop ${product.name} at House of Urvaah. High-fashion luxury silhouette crafted from premium virgin fabrics with architectural tailoring.`}
        keywords={`${product.name}, ${product.category || 'Luxury Fashion'}, ${product.subcategory || ''}, House of Urvaah apparel`}
        ogImage={product.image || (gallery && gallery[0])}
        ogType="product"
      />
      {/* Breadcrumb & Navigation Bar */}
      <div className="max-w-[1500px] mx-auto px-4 md:px-8 mb-6 flex items-center justify-between border-b border-neutral-100 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-brand-dark hover:opacity-70 transition-opacity cursor-pointer font-sans"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK</span>
        </button>

        <nav className="hidden sm:flex items-center gap-2 text-[11px] font-sans tracking-widest uppercase text-neutral-400">
          <Link to="/" className="hover:text-black transition-colors">
            HOME
          </Link>
          <ChevronRight className="w-3 h-3 text-neutral-300" />
          <span>HERO COLLECTION</span>
          <ChevronRight className="w-3 h-3 text-neutral-300" />
          <span className="text-black font-medium line-clamp-1">{product.name}</span>
        </nav>
      </div>

      {/* Main Zara-Style Two-Column Product Layout Container */}
      <div className="max-w-[1500px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
          
          {/* ===================================================
              LEFT SIDE: Large Vertical Scrollable Product Images
              =================================================== */}
          <div className="lg:col-span-7 flex flex-col gap-6 sm:gap-8">
            {gallery.map((imgUrl, idx) => (
              <div
                key={idx}
                className="w-full aspect-[3/4] sm:aspect-[4/5] bg-[#F5F5F0] overflow-hidden shadow-xs border border-neutral-200/50 relative flex items-center justify-center p-2 group"
              >
                <img
                  src={imgUrl}
                  alt={`${product.name} editorial view ${idx + 1}`}
                  className="w-full h-full object-contain object-center transition-all duration-500 ease-out"
                />

                {/* Toast for Copying Link (shown on first image) */}
                {idx === 0 && copiedToast && (
                  <div className="absolute top-4 left-4 bg-black text-white text-[10px] py-1.5 px-3 font-mono tracking-wider uppercase shadow-lg z-20">
                    Link Copied!
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ===================================================
              RIGHT SIDE: Zara-Style Product Details Panel (Sticky)
              =================================================== */}
          <div className="lg:col-span-5 flex flex-col text-left space-y-5 lg:sticky lg:top-24 pt-[280px]">
            
            {/* 1. NEW label + Top-Right Bookmark/Save Icon Row */}
            <div className="flex justify-between items-start pt-1">
              <span className="text-[11px] font-sans tracking-[0.25em] text-neutral-400 font-semibold uppercase block">
                NEW
              </span>

              {/* Bookmark / Save Icon Aligned Top-Right */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="p-1.5 text-neutral-500 hover:text-black transition-colors cursor-pointer"
                  title="Share link"
                  aria-label="Share product"
                >
                  <Share2 className="w-4 h-4 stroke-[1.5]" />
                </button>
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`p-1.5 transition-colors cursor-pointer ${
                    isWishlisted ? 'text-red-600' : 'text-neutral-700 hover:text-black'
                  }`}
                  title={isWishlisted ? 'Saved to Wishlist' : 'Save to Wishlist'}
                  aria-label="Bookmark toggle"
                >
                  <Bookmark className={`w-5 h-5 ${isWishlisted ? 'fill-red-600 stroke-red-600' : 'stroke-[1.5]'}`} />
                </button>
              </div>
            </div>

            {/* 2. Product Name (Bold, Uppercase Heading) */}
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-[0.1em] uppercase text-brand-dark leading-snug">
                {product.name}
              </h1>
            </div>

            {/* 3. Price & Tax Info */}
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-bold tracking-wider text-brand-dark font-sans">
                {formatPrice(product.price)}
              </div>
              <span className="text-[10px] font-sans tracking-[0.2em] text-neutral-400 uppercase font-medium block">
                MRP INCL. OF ALL TAXES
              </span>
            </div>

            {/* 4. Horizontal Divider Line */}
            <hr className="border-t border-neutral-200 my-2" />

            {/* 5. Color/Variant Name with Reference Code */}
            <div className="text-xs font-sans tracking-widest text-neutral-700 uppercase font-medium">
              {getReferenceCode(product)}
            </div>

            {/* 6. "ADD" Button (Bordered, Full-Width, Uppercase Text) */}
            <div className="pt-2">
              <button
                onClick={handleAddToCart}
                className="w-full border-2 border-black bg-black text-white hover:bg-neutral-800 py-3.5 px-6 text-xs font-sans font-bold tracking-[0.25em] uppercase transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                {isAdded ? 'ADDED TO BAG ✓' : 'ADD'}
              </button>
            </div>

            {/* 7. Product Description Paragraph */}
            <div className="pt-2">
              <p className="text-xs sm:text-sm text-neutral-600 font-sans leading-relaxed font-light">
                {product.description ||
                  'High-fashion silhouette crafted from premium virgin fabrics with meticulous architectural tailoring details and hand-finished seams.'}
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
