import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Tag,
  Percent,
  Check,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Mail,
  Copy,
  Bell,
  Star
} from 'lucide-react';
import { BEST_SELLERS_PRODUCTS, MOCK_PRODUCTS } from '../data/mockProducts';
import { useCart } from '../context/CartContext';
import { productApi } from '../services/productApi';
import { deliveryApi } from '../services/deliveryApi';
import { SEOHead } from '../components/common/SEOHead';
import { ProductReviews } from '../components/common/ProductReviews';
import { RelatedProducts } from '../components/product/RelatedProducts';
import { DeliveryReminderWidget } from '../components/product/DeliveryReminderWidget';
import { StockNotificationModal } from '../components/product/StockNotificationModal';
import { useModalScrollLock } from '../hooks/useModalScrollLock';

const ALL_CATALOG_PRODUCTS = [...BEST_SELLERS_PRODUCTS, ...MOCK_PRODUCTS];

const PRODUCT_COUPONS = [
  {
    code: 'URVAAH10',
    title: '10% OFF ON ORDERS ABOVE ₹2,999',
    description: 'Use code URVAAH10 at checkout for instant 10% discount.',
    badge: '10% OFF'
  },
  {
    code: 'FLAT500',
    title: 'FLAT ₹500 OFF ON LUXURY WEAR',
    description: 'Applicable on orders above ₹4,999.',
    badge: 'FLAT ₹500'
  }
];

const findLocalProduct = (id) => {
  if (!id) return null;
  const strId = String(id).trim();
  const numId = strId.replace(/\D/g, '');

  if (strId === '109' || strId === 'bs-109' || strId === 'prod-109') {
    return ALL_CATALOG_PRODUCTS.find((p) => p.id === 'bs-105') || null;
  }
  if (strId === '108' || strId === 'bs-108') {
    return ALL_CATALOG_PRODUCTS.find((p) => p.id === 'prod-105') || null;
  }
  if (strId === '107' || strId === 'bs-107') {
    return ALL_CATALOG_PRODUCTS.find((p) => p.id === 'prod-103') || null;
  }
  if (strId === '106' || strId === 'bs-106') {
    return ALL_CATALOG_PRODUCTS.find((p) => p.id === 'bs-103' || p.id === 'prod-102') || null;
  }
  if (strId === '105') {
    return ALL_CATALOG_PRODUCTS.find((p) => p.id === 'bs-101' || p.id === 'prod-101') || null;
  }

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

  // Gallery & Image Viewer / Zoom States
  const [selectedImage, setSelectedImage] = useState('');
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomCoords, setZoomCoords] = useState({ x: 50, y: 50 });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxPan, setLightboxPan] = useState({ x: 0, y: 0 });
  const [isDraggingLightbox, setIsDraggingLightbox] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Size Selection State
  const [selectedSize, setSelectedSize] = useState('M');
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);

  // Interactive UI States
  const [copiedToast, setCopiedToast] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState('');
  const [isCouponsModalOpen, setIsCouponsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState(null);
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [openAccordion, setOpenAccordion] = useState('desc');

  const fallbackProduct = (productId) => {
    const found =
      findLocalProduct(productId) ||
      BEST_SELLERS_PRODUCTS.find((p) => p.id === 'bs-101') ||
      BEST_SELLERS_PRODUCTS[0];
    setProduct(found);
  };

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
            const isCorsetSet = String(id) === '106' || String(id) === '103' || String(id) === 'bs-103' || String(id) === 'prod-102' || (data.name && data.name.includes('CORSET')) || (data.title && data.title.includes('ASYMMETRICAL'));
            const corsetGallery = [
              '/assets/Images/Corset01.png',
              '/assets/Images/Corset02.png',
              '/assets/Images/Corset03.png',
              '/assets/Images/Corset04.png'
            ];

            setProduct((prev) => ({
              ...prev,
              ...data,
              id: String(data.id || id),
              name: isCorsetSet ? 'GILDED MIST CORSET' : (data.name || data.title || prev?.name),
              price: parseFloat(data.price) || prev?.price || 12990,
              originalPrice: parseFloat(data.originalPrice || data.originalprice) || prev?.originalPrice,
              image: isCorsetSet ? corsetGallery[0] : (data.image || prev?.image),
              hoverImage: isCorsetSet ? corsetGallery[1] : (data.hoverImage || prev?.hoverImage || data.image),
              gallery: isCorsetSet ? corsetGallery : (data.gallery && data.gallery.length > 0 ? data.gallery : (prev?.gallery || [data.image])),
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

  const mobileScrollRef = useRef(null);
  const [mobileSlideIndex, setMobileSlideIndex] = useState(0);

  // Dynamic Image Height Measurement for Right-Side Panel
  const desktopImageContainerRef = useRef(null);
  const desktopGalleryRef = useRef(null);
  const rightPanelRef = useRef(null);
  const [desktopImageHeight, setDesktopImageHeight] = useState(null);

  useLayoutEffect(() => {
    const measureHeight = () => {
      if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
        const target = desktopImageContainerRef.current || desktopGalleryRef.current;
        if (target) {
          const h = target.offsetHeight;
          if (h > 0) {
            setDesktopImageHeight(h);
          }
        }
      } else {
        setDesktopImageHeight(null);
      }
    };

    measureHeight();
    const rafId = requestAnimationFrame(measureHeight);

    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        measureHeight();
      });
      if (desktopImageContainerRef.current) {
        resizeObserver.observe(desktopImageContainerRef.current);
      }
      if (desktopGalleryRef.current) {
        resizeObserver.observe(desktopGalleryRef.current);
      }
    }

    window.addEventListener('resize', measureHeight);

    return () => {
      cancelAnimationFrame(rafId);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', measureHeight);
    };
  }, [loading, selectedImage, product?.id]);

  // Reset scroll position of right details panel on product navigation
  useEffect(() => {
    if (rightPanelRef.current) {
      rightPanelRef.current.scrollTop = 0;
    }
  }, [id]);

  const handleMobileScroll = () => {
    if (!mobileScrollRef.current) return;
    const { scrollLeft, clientWidth } = mobileScrollRef.current;
    if (clientWidth > 0) {
      const idx = Math.round(scrollLeft / clientWidth);
      setMobileSlideIndex(idx);
    }
  };

  const scrollToMobileSlide = (index) => {
    if (!mobileScrollRef.current) return;
    const clientWidth = mobileScrollRef.current.clientWidth;
    mobileScrollRef.current.scrollTo({
      left: index * clientWidth,
      behavior: 'smooth'
    });
    setMobileSlideIndex(index);
  };

  const handlePrevMobileSlide = () => {
    const nextIdx = Math.max(0, mobileSlideIndex - 1);
    scrollToMobileSlide(nextIdx);
  };

  const handleNextMobileSlide = () => {
    const nextIdx = Math.min(gallery.length - 1, mobileSlideIndex + 1);
    scrollToMobileSlide(nextIdx);
  };

  const handleMainImageClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(Math.max(0, ((e.clientX - rect.left) / rect.width) * 100), 100);
    const y = Math.min(Math.max(0, ((e.clientY - rect.top) / rect.height) * 100), 100);
    setZoomCoords({ x, y });
    setIsZoomed((prev) => !prev);
  };

  const handleMainMouseMove = (e) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(Math.max(0, ((e.clientX - rect.left) / rect.width) * 100), 100);
    const y = Math.min(Math.max(0, ((e.clientY - rect.top) / rect.height) * 100), 100);
    setZoomCoords({ x, y });
  };

  const handleMainMouseLeave = () => {
    setIsZoomed(false);
  };

  const openLightbox = (imgUrl) => {
    if (imgUrl) setSelectedImage(imgUrl);
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
    setIsDraggingLightbox(false);
  };

  const handleZoomIn = () => {
    setLightboxZoom((prev) => Math.min(Number((prev + 0.5).toFixed(2)), 3.5));
  };

  const handleZoomOut = () => {
    setLightboxZoom((prev) => {
      const next = Math.max(Number((prev - 0.5).toFixed(2)), 1);
      if (next === 1) setLightboxPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
  };

  const currentLightboxIndex = Math.max(0, gallery.indexOf(selectedImage || gallery[0]));

  const handlePrevLightboxImage = () => {
    if (gallery.length <= 1) return;
    const prevIdx = (currentLightboxIndex - 1 + gallery.length) % gallery.length;
    setSelectedImage(gallery[prevIdx]);
    setLightboxPan({ x: 0, y: 0 });
  };

  const handleNextLightboxImage = () => {
    if (gallery.length <= 1) return;
    const nextIdx = (currentLightboxIndex + 1) % gallery.length;
    setSelectedImage(gallery[nextIdx]);
    setLightboxPan({ x: 0, y: 0 });
  };

  const handleLightboxMouseDown = (e) => {
    if (lightboxZoom <= 1) return;
    setIsDraggingLightbox(true);
    dragStartRef.current = {
      x: e.clientX - lightboxPan.x,
      y: e.clientY - lightboxPan.y
    };
  };

  const handleLightboxMouseMove = (e) => {
    if (!isDraggingLightbox || lightboxZoom <= 1) return;
    setLightboxPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleLightboxMouseUp = () => {
    setIsDraggingLightbox(false);
  };

  const handleLightboxDoubleClick = () => {
    if (lightboxZoom > 1) {
      handleResetZoom();
    } else {
      setLightboxZoom(2);
    }
  };

  // Lock background scrolling on lightbox zoom modal
  useModalScrollLock(isLightboxOpen, closeLightbox);

  // Keyboard controls for Lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePrevLightboxImage();
      } else if (e.key === 'ArrowRight') {
        handleNextLightboxImage();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen, currentLightboxIndex, gallery, lightboxZoom]);

  // Lock background scrolling and enable ESC key close for Size Chart, Coupons, Share, and Stock Notification modals
  const isAnyDetailModalOpen = isSizeChartOpen || isCouponsModalOpen || isShareModalOpen || isStockModalOpen;
  useModalScrollLock(isAnyDetailModalOpen, () => {
    setIsSizeChartOpen(false);
    setIsCouponsModalOpen(false);
    setIsShareModalOpen(false);
    setIsStockModalOpen(false);
  });

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

  const handleOpenShare = () => {
    setIsShareModalOpen(true);
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name || 'House of Urvaah',
          text: `Discover ${product?.name} at House of Urvaah`,
          url: window.location.href
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = product?.name ? `Discover ${product.name} on House of Urvaah` : 'House of Urvaah Luxury Wear';
  const shareImage = product?.image || '';

  const shareChannels = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: (
        <svg className="w-5 h-5 fill-current text-[#25D366]" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.276-.1-.477-.15-.678.15-.2.301-.778.98-.954 1.18-.176.2-.352.226-.653.075-.301-.15-1.272-.469-2.423-1.496-.896-.799-1.501-1.786-1.677-2.087-.176-.301-.019-.464.132-.614.136-.135.301-.352.452-.527.15-.175.2-.301.301-.502.1-.2.05-.376-.025-.526-.075-.15-.678-1.634-.929-2.238-.244-.589-.493-.509-.678-.519-.176-.01-.376-.01-.577-.01-.201 0-.527.075-.803.376s-1.054 1.03-1.054 2.511 1.08 2.912 1.23 3.113c.15.2 2.125 3.245 5.148 4.551.719.311 1.28.497 1.719.636.723.23 1.381.197 1.901.12.579-.087 1.78-.727 2.031-1.43.251-.703.251-1.305.176-1.43-.076-.126-.276-.201-.577-.352zM12 2C6.477 2 2 6.477 2 12c0 1.891.526 3.662 1.442 5.177L2.163 21.84l4.801-1.258A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2c-1.637 0-3.159-.494-4.428-1.341l-.317-.214-2.85.747.76-2.778-.235-.374A8.167 8.167 0 013.8 12c0-4.522 3.678-8.2 8.2-8.2s8.2 3.678 8.2 8.2-3.678 8.2-8.2 8.2z"/>
        </svg>
      ),
      action: () => {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareTitle} - ${shareUrl}`)}`, '_blank');
      }
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: (
        <svg className="w-5 h-5 fill-current text-[#1877F2]" viewBox="0 0 24 24">
          <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.583 9 4.615V8z"/>
        </svg>
      ),
      action: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
      }
    },
    {
      id: 'pinterest',
      name: 'Pinterest',
      icon: (
        <svg className="w-5 h-5 fill-current text-[#E60023]" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.627 0 12-5.373 12-12C24 5.372 18.627 0 12 0z"/>
        </svg>
      ),
      action: () => {
        window.open(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&media=${encodeURIComponent(shareImage)}&description=${encodeURIComponent(shareTitle)}`, '_blank');
      }
    },
    {
      id: 'twitter',
      name: 'X (Twitter)',
      icon: (
        <svg className="w-4 h-4 fill-current text-black" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      action: () => {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
      }
    },
    {
      id: 'email',
      name: 'Email',
      icon: <Mail className="w-5 h-5 stroke-[1.75] text-neutral-700" />,
      action: () => {
        window.open(`mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareTitle}\n\nView piece online:\n${shareUrl}`)}`);
      }
    }
  ];

  const getDeliveryDateObject = (offset1 = 5, offset2 = 6) => {
    const today = new Date();
    const d1 = new Date(today);
    d1.setDate(today.getDate() + offset1);
    const d2 = new Date(today);
    d2.setDate(today.getDate() + offset2);

    const getOrd = (n) => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return s[(v - 20) % 10] || s[v] || s[0];
    };

    return {
      day1: d1.getDate(),
      ord1: getOrd(d1.getDate()),
      day2: d2.getDate(),
      ord2: getOrd(d2.getDate()),
      month: d1.toLocaleString('default', { month: 'short' })
    };
  };

  const handleCheckPincode = async (e) => {
    if (e) e.preventDefault();
    const rawInput = pincode || '';
    const cleanPin = rawInput.trim();

    // 1. Validation Rules (Do not call backend if invalid)
    if (!cleanPin) {
      setPincodeResult({
        status: 'invalid',
        message: 'Please enter your PIN code.'
      });
      return;
    }

    if (!/^\d+$/.test(cleanPin)) {
      setPincodeResult({
        status: 'invalid',
        message: 'Please enter a valid PIN code.'
      });
      return;
    }

    if (cleanPin.length !== 6) {
      setPincodeResult({
        status: 'invalid',
        message: 'Please enter a valid 6-digit PIN code.'
      });
      return;
    }

    // 2. Call Express REST Backend API via deliveryApi
    setCheckingPincode(true);
    setPincodeResult(null);

    try {
      const data = await deliveryApi.checkPincode(cleanPin);

      if (data.available) {
        setPincodeResult({
          status: 'success',
          pincode: cleanPin,
          zone: data.zone,
          city: data.city,
          dateObj: data.estimatedDelivery || {
            day1: 8,
            ord1: 'th',
            day2: 9,
            ord2: 'th',
            month: 'Oct'
          }
        });
      } else {
        setPincodeResult({
          status: 'unserviceable',
          pincode: cleanPin,
          message: data.message || 'Sorry, delivery is currently unavailable for this PIN code.'
        });
      }
    } catch (err) {
      console.error('[ProductDetail] Pincode check error:', err);
      setPincodeResult({
        status: 'error',
        message: 'Unable to check delivery availability. Please try again.'
      });
    } finally {
      setCheckingPincode(false);
    }
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
        </div>

        {/* Main Product Layout Container (Left Gallery 55% + Right Product Details 45%, 30px Gap) */}
        <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-[30px]">
          
          {/* LEFT SIDE: Image Gallery (~55% Desktop Width) */}
          <div className="w-full lg:w-[55%] flex flex-col items-start shrink-0">
            {/* MOBILE VIEW (< md): Horizontal side-scrolling carousel slider matching reference */}
            <div className="relative md:hidden w-full group">
              <div
                ref={mobileScrollRef}
                onScroll={handleMobileScroll}
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none w-full touch-pan-x"
              >
                {gallery.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => openLightbox(imgUrl)}
                    className="w-full flex-shrink-0 snap-center relative bg-[#F5F5F0] border border-neutral-200/60 overflow-hidden p-2 flex items-center justify-center aspect-[3/4] cursor-pointer"
                  >
                    <img
                      src={imgUrl}
                      alt={`${product.name} view ${idx + 1}`}
                      className="w-full h-full object-contain object-center"
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

              {/* Mobile Zoom Trigger Badge */}
              <button
                type="button"
                onClick={() => openLightbox(gallery[mobileSlideIndex] || gallery[0])}
                className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1.5 bg-black/80 hover:bg-black text-white text-[10px] font-sans font-medium tracking-wider uppercase rounded shadow-md backdrop-blur-sm transition-all active:scale-95 cursor-pointer"
                aria-label="Zoom image"
              >
                <ZoomIn className="w-3.5 h-3.5 text-[#E6C687]" />
                <span>Zoom</span>
              </button>

              {/* Side Navigation Arrows (Matching second reference screenshot) */}
              {gallery.length > 1 && (
                <>
                  {mobileSlideIndex > 0 && (
                    <button
                      type="button"
                      onClick={handlePrevMobileSlide}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-black flex items-center justify-center shadow-md border border-neutral-200/80 cursor-pointer"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}
                  {mobileSlideIndex < gallery.length - 1 && (
                    <button
                      type="button"
                      onClick={handleNextMobileSlide}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-black flex items-center justify-center shadow-md border border-neutral-200/80 cursor-pointer"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}

                  {/* Indicator Dots at Bottom - REMOVED per user request */}
                </>
              )}
            </div>

            {/* DESKTOP VIEW (>= md): Side-by-Side Vertical Thumbnails + Main Product Viewer */}
            <div ref={desktopGalleryRef} className="hidden md:flex md:flex-row gap-5 items-start flex-1 w-full">
              {/* Vertical Thumbnail Strip */}
              <div className="flex flex-col gap-2.5 max-h-[560px] overflow-y-auto no-scrollbar scroll-smooth p-0.5">
                {gallery.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedImage(imgUrl);
                      setIsZoomed(false);
                    }}
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

              {/* Main Product Image Container with Interactive Click-to-Zoom */}
              <div
                ref={desktopImageContainerRef}
                className={`flex-1 w-full relative aspect-[3/4] max-w-[620px] bg-[#F5F5F0] overflow-hidden shadow-xs border border-neutral-200/60 flex items-center justify-center p-2 group transition-colors ${
                  isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
                }`}
                onMouseMove={handleMainMouseMove}
                onMouseLeave={handleMainMouseLeave}
                onClick={handleMainImageClick}
                title={isZoomed ? 'Click to zoom out' : 'Click image to zoom in'}
              >
                <img
                  src={selectedImage || gallery[0]}
                  alt={product.name}
                  className="w-full h-full object-contain object-center select-none pointer-events-none will-change-transform"
                  style={{
                    transformOrigin: `${zoomCoords.x}% ${zoomCoords.y}%`,
                    transform: isZoomed ? 'scale(2.4)' : 'scale(1)',
                    transition: isZoomed
                      ? 'transform 0.12s ease-out'
                      : 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)'
                  }}
                />

                {/* Tag Badge */}
                {product.tag && (
                  <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm text-brand-dark px-2.5 py-1 text-[9px] font-semibold tracking-widest uppercase border border-black/5 pointer-events-none">
                    {product.tag}
                  </div>
                )}

                {/* Fullscreen Expand Action Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openLightbox(selectedImage || gallery[0]);
                  }}
                  className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5 bg-white/90 hover:bg-white text-black text-[10px] font-sans font-medium tracking-wider uppercase rounded shadow-md backdrop-blur-sm transition-all hover:scale-105 cursor-pointer border border-black/10"
                  title="Fullscreen view"
                  aria-label="Fullscreen view"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-neutral-800" />
                  <span>Fullscreen</span>
                </button>

                {/* Floating Zoom Action Badge */}
                <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5 bg-black/85 text-white text-[10px] font-sans font-medium tracking-wider uppercase rounded shadow-md backdrop-blur-sm transition-all pointer-events-none">
                  {isZoomed ? (
                    <>
                      <ZoomOut className="w-3.5 h-3.5 text-[#E6C687]" />
                      <span>Click to Zoom Out</span>
                    </>
                  ) : (
                    <>
                      <ZoomIn className="w-3.5 h-3.5 text-[#E6C687]" />
                      <span>Click to Zoom</span>
                    </>
                  )}
                </div>

                {/* Magnification Level Indicator */}
                {isZoomed && (
                  <div className="absolute top-3 right-3 z-10 bg-black/80 text-[#E6C687] text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur-sm pointer-events-none tracking-widest border border-white/10">
                    2.4X ZOOM
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Product Info & Actions Panel (~45% Desktop Width) */}
          <div
            ref={rightPanelRef}
            className="w-full lg:flex-1 flex flex-col text-left space-y-4 sm:space-y-5 pt-0 min-w-0 lg:overflow-y-auto no-scrollbar lg:pb-6"
            style={desktopImageHeight ? { height: `${desktopImageHeight}px`, maxHeight: `${desktopImageHeight}px` } : undefined}
          >
            {/* 1. PRODUCT TITLE & BRAND */}
            <div>
              <span className="text-xs font-serif tracking-[0.25em] uppercase text-neutral-400 block mb-1 font-medium">
                HOUSE OF URVAAH
              </span>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-normal tracking-[0.06em] uppercase text-brand-dark leading-tight">
                {product.name}
              </h1>


              {product.shortDescription && (
                <p className="text-xs sm:text-sm text-neutral-500 font-sans mt-1.5 leading-relaxed">
                  {product.shortDescription}
                </p>
              )}


              {/* NAME OPTIONS (Rendered dynamically if available) */}
              {Array.isArray(product.nameOptions || product.name_options) &&
                (product.nameOptions || product.name_options).filter(Boolean).length > 0 && (
                  <div className="mt-3 pt-2 border-t border-neutral-100">
                    <span className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-800 block mb-1 font-serif">
                      NAME OPTIONS
                    </span>
                    <ul className="space-y-1 font-sans text-xs text-neutral-600">
                      {(product.nameOptions || product.name_options)
                        .filter(Boolean)
                        .map((optName, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-800 shrink-0" />
                            <span>{optName}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
            </div>

            {/* 2 & 3. PRICE & TAX TEXT */}
            <div className="border-b border-neutral-200 pb-3.5">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-normal tracking-wider text-brand-dark font-sans">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="text-sm sm:text-base text-neutral-400 line-through font-sans">
                      {formatPrice(product.originalPrice)}
                    </span>
                    <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-sans tracking-wide">
                      {product.discount || Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>
              <span className="text-xs text-neutral-400 font-normal tracking-wide block font-sans mt-1">
                Inclusive of All Taxes
              </span>
            </div>



            {/* 5 & 6. SIZE SECTION & SIZE CHART */}
            <div className="space-y-2">
              <span className="text-xs font-bold tracking-wider uppercase text-brand-dark block font-sans">
                SIZE: <span className="font-semibold text-black">{selectedSize}</span>
              </span>

              {/* Selectable Size Boxes */}
              <div className="flex flex-wrap gap-2 font-sans">
                {availableSizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`w-11 h-11 sm:w-12 sm:h-12 border flex items-center justify-center text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all cursor-pointer ${
                      selectedSize === sz
                        ? 'bg-black text-white border-black shadow-sm scale-105'
                        : 'bg-white text-brand-dark border-neutral-300 hover:border-black'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>

              {/* Size Chart Button (Positioned directly below size buttons) */}
              <div className="pt-1.5">
                <button
                  onClick={() => setIsSizeChartOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-brand-dark font-medium underline underline-offset-4 hover:opacity-70 transition-opacity cursor-pointer font-sans"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Size Chart</span>
                </button>
              </div>
            </div>

            {/* 7. ACTION BUTTON ROW: ADD TO CART OR NOTIFY ME + WISHLIST + SHARE */}
            {product.inStock === false || (product.stockQuantity !== undefined && product.stockQuantity <= 0) ? (
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsStockModalOpen(true)}
                  className="flex-1 h-11 sm:h-12.5 px-4 bg-neutral-900 text-white hover:bg-black text-xs sm:text-sm font-bold tracking-[0.18em] uppercase transition-all shadow-sm flex items-center justify-center gap-2.5 font-sans cursor-pointer group"
                >
                  <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-300 group-hover:scale-110 transition-transform" />
                  <span>NOTIFY ME WHEN AVAILABLE</span>
                </button>

                {/* Wishlist Heart Icon Button */}
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`w-11 h-11 sm:w-12.5 sm:h-12.5 border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                    isWishlisted
                      ? 'border-red-600 bg-red-50 text-red-600'
                      : 'border-neutral-300 text-brand-dark hover:border-black'
                  }`}
                  aria-label="Wishlist toggle"
                  title="Save to Wishlist"
                >
                  <Heart className={`w-4.5 h-4.5 ${isWishlisted ? 'fill-red-600 text-red-600' : 'stroke-[1.5]'}`} />
                </button>

                {/* Share Icon Button */}
                <button
                  onClick={handleOpenShare}
                  className="w-11 h-11 sm:w-12.5 sm:h-12.5 border border-neutral-300 text-brand-dark flex items-center justify-center hover:border-black hover:bg-neutral-50 transition-all relative cursor-pointer shrink-0"
                  aria-label="Share product"
                  title="Share product with friends"
                >
                  <Share2 className="w-4.5 h-4.5 stroke-[1.5]" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 h-11 sm:h-12.5 px-5 text-xs sm:text-sm font-bold tracking-[0.2em] uppercase transition-all shadow-sm flex items-center justify-center gap-2.5 font-sans cursor-pointer bg-black text-white hover:bg-neutral-800"
                >
                  <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  {isAdded ? 'ADDED TO BAG ✓' : 'ADD TO BAG'}
                </button>

                {/* Wishlist Heart Icon Button */}
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`w-11 h-11 sm:w-12.5 sm:h-12.5 border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                    isWishlisted
                      ? 'border-red-600 bg-red-50 text-red-600'
                      : 'border-neutral-300 text-brand-dark hover:border-black'
                  }`}
                  aria-label="Wishlist toggle"
                  title="Save to Wishlist"
                >
                  <Heart className={`w-4.5 h-4.5 ${isWishlisted ? 'fill-red-600 text-red-600' : 'stroke-[1.5]'}`} />
                </button>

                {/* Share Icon Button */}
                <button
                  onClick={handleOpenShare}
                  className="w-11 h-11 sm:w-12.5 sm:h-12.5 border border-neutral-300 text-brand-dark flex items-center justify-center hover:border-black hover:bg-neutral-50 transition-all relative cursor-pointer shrink-0"
                  aria-label="Share product"
                  title="Share product with friends"
                >
                  <Share2 className="w-4.5 h-4.5 stroke-[1.5]" />
                </button>
              </div>
            )}

            {/* ACCORDION SECTIONS */}
            <div className="pt-3 border-t border-neutral-200 space-y-1">
              {/* Product Description */}
              {product.description && (
                <div className="border-b border-neutral-200/80 pb-2.5 pt-1">
                  <button
                    onClick={() => toggleAccordion('desc')}
                    className="w-full flex justify-between items-center text-xs sm:text-sm font-bold tracking-widest uppercase text-brand-dark hover:opacity-75 transition-opacity text-left cursor-pointer"
                  >
                    <span>PRODUCT DESCRIPTION</span>
                    {openAccordion === 'desc' ? <Minus className="w-4 h-4 stroke-[2]" /> : <Plus className="w-4 h-4 stroke-[2]" />}
                  </button>
                  {openAccordion === 'desc' && (
                    <div className="mt-2 text-xs sm:text-sm text-neutral-600 font-sans leading-relaxed pr-2 whitespace-pre-line">
                      {product.description}
                    </div>
                  )}
                </div>
              )}

              {/* Size Details */}
              <div className="border-b border-neutral-200/80 pb-2.5 pt-1">
                <button
                  onClick={() => toggleAccordion('sizedetails')}
                  className="w-full flex justify-between items-center text-xs sm:text-sm font-bold tracking-widest uppercase text-brand-dark hover:opacity-75 transition-opacity text-left cursor-pointer"
                >
                  <span>SIZE DETAILS</span>
                  {openAccordion === 'sizedetails' ? <Minus className="w-4 h-4 stroke-[2]" /> : <Plus className="w-4 h-4 stroke-[2]" />}
                </button>
                {openAccordion === 'sizedetails' && (
                  <div className="mt-2 text-xs sm:text-sm text-neutral-600 font-sans leading-relaxed pr-2 space-y-1.5">
                    {product.sizeDetailsText ? (
                      <div className="whitespace-pre-line">{product.sizeDetailsText}</div>
                    ) : (
                      <>
                        <div>26: Waist: 66.04 cm, Length: 74.30 cm</div>
                        <div>28: Waist: 71.12 cm, Length: 74.30 cm</div>
                        <div>30: Waist: 76.20 cm, Length: 74.30 cm</div>
                        <div>32: Waist: 81.28 cm, Length: 74.30 cm</div>
                        <div>34: Waist: 86.36 cm, Length: 74.30 cm</div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Additional Information Accordion */}
              <div className="border-b border-neutral-200/80 pb-2.5 pt-1">
                <button
                  onClick={() => toggleAccordion('info')}
                  className="w-full flex justify-between items-center text-xs sm:text-sm font-bold tracking-widest uppercase text-brand-dark hover:opacity-75 transition-opacity text-left cursor-pointer"
                >
                  <span>ADDITIONAL INFORMATION</span>
                  {openAccordion === 'info' ? <Minus className="w-4 h-4 stroke-[2]" /> : <Plus className="w-4 h-4 stroke-[2]" />}
                </button>
                {openAccordion === 'info' && (
                  <div className="mt-2 text-xs sm:text-sm text-neutral-600 font-sans leading-relaxed pr-2 space-y-1.5">
                    {product.additionalInfoText || product.additionalInfo ? (
                      <div className="whitespace-pre-line">{product.additionalInfoText || product.additionalInfo}</div>
                    ) : (
                      <>
                        <div>Fabric: Embroidered fabric with sequin detailing</div>
                        <div>Skirt hem: Hand-finished potli trim</div>
                        <div>Closure: Adjustable tie-back (top), side zip on left of skirt</div>
                        <div>Lining: Fully lined (top and skirt)</div>
                        <div>Top: Lightly Padded</div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* 8.5 COMBINED 3-5 DAY DELIVERY & PINCODE CHECK CARD (After Size Details & Additional Information) */}
              <div className="pt-3 pb-2">
                <DeliveryReminderWidget
                  pincode={pincode}
                  setPincode={setPincode}
                  handleCheckPincode={handleCheckPincode}
                  checkingPincode={checkingPincode}
                  pincodeResult={pincodeResult}
                  setPincodeResult={setPincodeResult}
                />
              </div>

              {/* Product Details (Dynamic Bullet Points) */}
              {Array.isArray(product.productDetails || product.product_details) &&
                (product.productDetails || product.product_details).filter(d => (d.label && d.label.trim()) || (d.value && d.value.trim())).length > 0 && (
                  <div className="border-b border-neutral-200 pb-2.5 pt-1">
                    <button
                      onClick={() => toggleAccordion('pdetails')}
                      className="w-full flex justify-between items-center text-xs sm:text-sm font-bold tracking-widest uppercase text-brand-dark hover:opacity-75 transition-opacity text-left cursor-pointer"
                    >
                      <span>PRODUCT DETAILS</span>
                      {openAccordion === 'pdetails' ? <Minus className="w-4 h-4 stroke-[2]" /> : <Plus className="w-4 h-4 stroke-[2]" />}
                    </button>
                    {openAccordion === 'pdetails' && (
                      <div className="mt-2 text-xs sm:text-sm text-neutral-600 font-sans leading-relaxed pr-2">
                        <ul className="space-y-1.5">
                          {(product.productDetails || product.product_details)
                            .filter(d => (d.label && d.label.trim()) || (d.value && d.value.trim()))
                            .map((detail, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-neutral-800 shrink-0 mt-1.5" />
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
                <div className="border-b border-neutral-200/80 pb-2.5 pt-1">
                  <button
                    onClick={() => toggleAccordion('specs')}
                    className="w-full flex justify-between items-center text-xs sm:text-sm font-bold tracking-widest uppercase text-brand-dark hover:opacity-75 transition-opacity text-left cursor-pointer"
                  >
                    <span>SPECIFICATIONS</span>
                    {openAccordion === 'specs' ? <Minus className="w-4 h-4 stroke-[2]" /> : <Plus className="w-4 h-4 stroke-[2]" />}
                  </button>
                  {openAccordion === 'specs' && (
                    <div className="mt-2 text-xs sm:text-sm text-neutral-600 font-sans leading-relaxed pr-2 space-y-1.5">
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
                <div className="border-b border-neutral-200/80 pb-2.5 pt-1">
                  <button
                    onClick={() => toggleAccordion('care')}
                    className="w-full flex justify-between items-center text-xs sm:text-sm font-bold tracking-widest uppercase text-brand-dark hover:opacity-75 transition-opacity text-left cursor-pointer"
                  >
                    <span>CARE INSTRUCTIONS</span>
                    {openAccordion === 'care' ? <Minus className="w-4 h-4 stroke-[2]" /> : <Plus className="w-4 h-4 stroke-[2]" />}
                  </button>
                  {openAccordion === 'care' && (
                    <div className="mt-2 text-xs sm:text-sm text-neutral-600 font-sans leading-relaxed pr-2 space-y-1.5">
                      {product.careInstructions || product.care_instructions}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CUSTOMER REVIEWS & RATINGS SECTION */}
        <ProductReviews productId={product.id} productName={product.name} />

        {/* RELATED PRODUCTS SECTION */}
        <RelatedProducts currentProduct={product} />
      </div>

      {/* SIZE CHART MODAL OVERLAY */}
      {isSizeChartOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto overscroll-contain select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSizeChartOpen(false);
          }}
          onWheel={(e) => e.stopPropagation()}
        >
          <div
            className="bg-white max-w-md w-full p-6 relative font-serif shadow-2xl border border-neutral-200 my-auto overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
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

      {/* ALL COUPONS MODAL OVERLAY */}
      {isCouponsModalOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto overscroll-contain select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCouponsModalOpen(false);
          }}
          onWheel={(e) => e.stopPropagation()}
        >
          <div
            className="bg-white max-w-lg w-full p-6 relative font-serif shadow-2xl border border-neutral-200 max-h-[85vh] overflow-y-auto my-auto overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsCouponsModalOpen(false)}
              className="absolute top-3.5 right-3.5 p-1.5 text-neutral-600 hover:text-black transition-colors cursor-pointer"
              aria-label="Close coupons modal"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 block mb-1 font-sans">
              HOUSE OF URVAAH OFFERS
            </span>
            <h2 className="text-base font-bold tracking-[0.2em] uppercase text-brand-dark mb-4 border-b border-neutral-200 pb-2.5 font-sans">
              AVAILABLE COUPONS & OFFERS
            </h2>

            <div className="space-y-3 font-sans">
              {PRODUCT_COUPONS.map((cp) => (
                <div
                  key={cp.code}
                  className="p-3 bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-black text-white text-[10px] font-sans font-semibold tracking-[0.16em] px-2 py-0.5 uppercase">
                        {cp.code}
                      </span>
                      <span className="text-[10px] font-semibold text-rose-700 tracking-wide uppercase">
                        {cp.badge}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-brand-dark uppercase">
                      {cp.title}
                    </p>
                    <p className="text-[11px] text-neutral-500 leading-snug">
                      {cp.description}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(cp.code);
                        setCopiedCoupon(cp.code);
                        setTimeout(() => setCopiedCoupon(''), 2000);
                      }
                    }}
                    className="px-3 py-1.5 text-[10px] font-bold font-sans tracking-[0.16em] border border-black uppercase hover:bg-black hover:text-white transition-colors cursor-pointer shrink-0"
                  >
                    {copiedCoupon === cp.code ? 'COPIED ✓' : 'COPY CODE'}
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsCouponsModalOpen(false)}
              className="w-full mt-6 bg-black text-white py-2.5 text-xs font-semibold tracking-widest uppercase hover:bg-neutral-800 transition-colors cursor-pointer font-sans"
            >
              CLOSE OFFERS
            </button>
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX ZOOM MODAL */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeLightbox();
          }}
        >
          {/* Top Bar: Title, Zoom Controls, Close Button */}
          <div className="w-full px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-white/10 bg-black/60 backdrop-blur-sm z-20">
            {/* Left: Product Title & View Counter */}
            <div className="flex items-center gap-3">
              <span className="text-white/90 font-serif text-xs sm:text-sm tracking-widest uppercase truncate max-w-[180px] sm:max-w-xs">
                {product.name}
              </span>
              <span className="text-[11px] font-mono text-[#E6C687] bg-white/10 px-2 py-0.5 rounded tracking-wider">
                {currentLightboxIndex + 1} / {gallery.length}
              </span>
            </div>

            {/* Center: Zoom Controls Toolbar */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-neutral-900/90 border border-white/15 rounded-full px-2 sm:px-3 py-1">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={lightboxZoom <= 1}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Zoom Out (-)"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <span className="text-[11px] font-mono text-white/90 min-w-[42px] text-center select-none font-medium">
                {Math.round(lightboxZoom * 100)}%
              </span>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={lightboxZoom >= 3.5}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Zoom In (+)"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              <div className="w-px h-4 bg-white/20 mx-0.5" />

              <button
                type="button"
                onClick={handleResetZoom}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Reset Zoom (1:1)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Right: Close button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeLightbox}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-sans font-medium tracking-wider uppercase rounded-full transition-colors cursor-pointer"
                aria-label="Close zoom viewer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline text-[10px] text-white/60">ESC</span>
              </button>
            </div>
          </div>

          {/* Center Main Zoom Stage */}
          <div
            className={`relative flex-1 w-full overflow-hidden flex items-center justify-center p-4 ${
              lightboxZoom > 1 ? (isDraggingLightbox ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
            }`}
            onMouseDown={handleLightboxMouseDown}
            onMouseMove={handleLightboxMouseMove}
            onMouseUp={handleLightboxMouseUp}
            onDoubleClick={handleLightboxDoubleClick}
          >
            {/* Gallery Left Arrow */}
            {gallery.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevLightboxImage();
                }}
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 transition-all hover:scale-105 cursor-pointer backdrop-blur-sm"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Zoomable Image Container */}
            <div
              className="max-w-[85vw] max-h-[75vh] flex items-center justify-center transition-transform select-none"
              style={{
                transform: `translate(${lightboxPan.x}px, ${lightboxPan.y}px) scale(${lightboxZoom})`,
                transition: isDraggingLightbox ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)'
              }}
            >
              <img
                src={selectedImage || gallery[0]}
                alt={product.name}
                draggable={false}
                className="max-w-full max-h-[75vh] object-contain drop-shadow-2xl pointer-events-none select-none"
              />
            </div>

            {/* Gallery Right Arrow */}
            {gallery.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextLightboxImage();
                }}
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 transition-all hover:scale-105 cursor-pointer backdrop-blur-sm"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {/* Drag Hint Pill when Zoomed In */}
            {lightboxZoom > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-black/75 border border-white/20 text-[#E6C687] text-[11px] font-sans px-3 py-1 rounded-full backdrop-blur-sm pointer-events-none tracking-wide animate-pulse">
                Click & drag to explore fabric details
              </div>
            )}
          </div>

          {/* Bottom Thumbnails Strip */}
          <div className="w-full py-3 px-4 border-t border-white/10 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-2.5 z-20">
            {gallery.map((imgUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(imgUrl);
                  setLightboxPan({ x: 0, y: 0 });
                }}
                className={`w-12 h-14 sm:w-14 sm:h-16 overflow-hidden rounded border transition-all cursor-pointer ${
                  (selectedImage || gallery[0]) === imgUrl
                    ? 'border-[#E6C687] ring-2 ring-[#E6C687]/40 scale-105 opacity-100'
                    : 'border-white/20 opacity-50 hover:opacity-100 hover:border-white/50'
                }`}
              >
                <img
                  src={imgUrl}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover object-top pointer-events-none"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* LUXURY PRODUCT SHARE MODAL */}
      {isShareModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in duration-200 overflow-y-auto overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsShareModalOpen(false);
          }}
          onWheel={(e) => e.stopPropagation()}
        >
          <div
            className="bg-white text-brand-dark w-full max-w-md border border-neutral-200 shadow-2xl p-6 sm:p-7 relative font-serif animate-in zoom-in-95 duration-200 my-auto overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-black transition-colors p-1.5 cursor-pointer"
              aria-label="Close share dialog"
            >
              <X className="w-5 h-5 stroke-[1.75]" />
            </button>

            {/* Header with Product Preview */}
            <div className="flex items-center gap-3.5 pb-5 border-b border-neutral-100">
              <div className="w-14 h-18 bg-[#F5F5F0] overflow-hidden border border-neutral-200/80 shrink-0 flex items-center justify-center">
                <img
                  src={selectedImage || product?.image || gallery[0]}
                  alt={product?.name}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="min-w-0 pr-6">
                <span className="text-[10px] font-sans font-semibold tracking-[0.2em] uppercase text-neutral-400 block mb-0.5">
                  SHARE THIS PIECE
                </span>
                <h3 className="text-sm sm:text-base font-semibold tracking-wide uppercase truncate text-brand-dark">
                  {product?.name}
                </h3>
                <span className="text-xs font-sans text-neutral-600 font-semibold block mt-1">
                  ₹{Number(product?.price || 10990).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Social Share Channels Grid */}
            <div className="py-5">
              <span className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-neutral-400 block mb-3.5">
                SHARE VIA
              </span>
              <div className="grid grid-cols-5 gap-2 text-center">
                {shareChannels.map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={ch.action}
                    className="flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-neutral-200 bg-neutral-50 group-hover:bg-neutral-100 group-hover:border-neutral-400 flex items-center justify-center group-hover:scale-105 transition-all shadow-2xs">
                      {ch.icon}
                    </div>
                    <span className="text-[10px] font-sans font-medium text-neutral-600 tracking-wider truncate w-full group-hover:text-black">
                      {ch.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Copy Link Section */}
            <div className="pt-2 pb-1">
              <span className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-neutral-400 block mb-2">
                OR COPY LINK
              </span>
              <div className="flex items-center gap-2 border border-neutral-300 p-1.5 bg-[#FAF8F5]">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="w-full text-xs font-mono text-neutral-600 bg-transparent px-2 outline-none select-all truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3.5 py-1.5 bg-black text-white text-[11px] font-sans font-bold tracking-[0.16em] uppercase hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
                >
                  {shareCopied ? 'COPIED! ✓' : 'COPY'}
                </button>
              </div>
            </div>

            {/* Native Device Share Sheet */}
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full mt-4 py-2.5 border border-black text-black hover:bg-black hover:text-white transition-colors text-xs font-sans font-semibold tracking-[0.2em] uppercase flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4 stroke-[1.75]" />
                <span>DEVICE SHARE OPTIONS</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stock Notification / Notify Me Modal */}
      <StockNotificationModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        product={product}
        selectedSize={selectedSize}
        selectedColor="Default"
        user={user}
      />
    </div>
  );
};

export default ProductDetail;
