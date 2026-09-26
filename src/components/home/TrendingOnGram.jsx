import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ShoppingBag, ShoppingCart, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const GRAM_VIDEOS = [
  {
    id: 'gram-1',
    src: '/assets/video/video6.mp4',
    title: 'CORSET TOPS',
    category: 'STUDIO EDIT',
    handle: '@houseofurvaah',
    link: '#corsets',
    product: {
      id: 'gram-prod-1',
      name: 'CORSET DETAIL JACQUARD TOP',
      price: 4999,
      formattedPrice: '₹ 4,999',
      category: 'CORSET TOPS',
      subcategory: 'Corsets & Bodices',
      tag: 'AS SEEN ON REELS',
      image: '/assets/Images/Corset_Blue1.jpg',
      hoverImage: '/assets/Images/Corset_Blue2.jpg',
      gallery: [
        '/assets/Images/Corset_Blue1.jpg',
        '/assets/Images/Corset_Blue2.jpg',
        '/assets/Images/Corset04.png'
      ],
      colors: ['#7BB3CC', '#F5C6D0'],
      sizes: ['XS', 'S', 'M', 'L'],
      description: 'Artisan embroidered structured corset top featuring contour boning, sweetheart neckline, and delicate floral motifs.',
      specs: {
        color: 'Cornflower Blue & Blush Pink',
        fabric: 'Artisan Cotton Jacquard',
        topTitle: 'Top:',
        top: {
          'Type': 'Corset Bustier',
          'Fit': 'Structured Slim Fit',
          'Length': 'Crop',
          'Neck': 'Sweetheart Neck',
          'Sleeves': 'Sleeveless',
          'Closure': 'Lace-Up Back Tie'
        },
        bottomTitle: 'Skirt:',
        bottom: {
          'Length': '17-18 Inches',
          'Fit': 'A-Line Flared Fit',
          'Waist': 'High Rise',
          'Closure': 'Concealed Side Zip'
        }
      }
    }
  },
  {
    id: 'gram-2',
    src: '/assets/video/Video2.mp4',
    title: 'CO-ORD SETS',
    category: 'RESORT WEAR',
    handle: '@houseofurvaah',
    link: '#coords',
    product: {
      id: 'gram-prod-2',
      name: 'BROWN FLORAL EMBROIDERED CO-ORD SET',
      price: 6999,
      formattedPrice: '₹ 6,999',
      category: 'CO-ORD SETS',
      subcategory: 'Two-Piece Sets',
      tag: 'BEST SELLER',
      image: '/assets/Images/Brown02.png',
      hoverImage: '/assets/Images/Brown_Floral.jpg',
      gallery: [
        '/assets/Images/Brown02.png',
        '/assets/Images/Brown_Floral.jpg',
        '/assets/Images/Brown03.png'
      ],
      colors: ['#4A3B32'],
      sizes: ['XS', 'S', 'M', 'L'],
      description: 'Handcrafted floral co-ord set featuring a backless halter top with matching high-rise tiered mini skirt.',
      specs: {
        color: 'Espresso Brown & Cream Floral',
        fabric: 'Breathable Linen-Cotton',
        topTitle: 'Top:',
        top: {
          'Type': 'Halter Crop Top',
          'Fit': 'Slim Fit',
          'Length': 'Crop',
          'Neck': 'Halter Neck with Back Ties',
          'Sleeves': 'Sleeveless'
        },
        bottomTitle: 'Skirt:',
        bottom: {
          'Length': '18 Inches',
          'Fit': 'Tiered Flared Fit',
          'Waist': 'Mid Rise',
          'Closure': 'Elasticized Waist'
        }
      }
    }
  },
  {
    id: 'gram-3',
    src: '/assets/video/Video3.mp4',
    title: 'SUMMER DRESSES',
    category: 'EDITORIAL CAPSULE',
    handle: '@houseofurvaah',
    link: '#summer-dresses',
    product: {
      id: 'gram-prod-3',
      name: 'BLUE FLORAL HALTER CO-ORD SET',
      price: 3999,
      formattedPrice: '₹ 3,999',
      category: 'SUMMER DRESSES',
      subcategory: 'Printed Ensembles',
      tag: 'VIRAL LOOK',
      image: '/assets/Images/Blue_Halter.jpg',
      hoverImage: '/assets/Images/Blue02.png',
      gallery: [
        '/assets/Images/Blue_Halter.jpg',
        '/assets/Images/Blue02.png',
        '/assets/Images/Blue03.png'
      ],
      colors: ['#5B9BD5', '#E8EFF9'],
      sizes: ['XS', 'S', 'M', 'L'],
      description: 'Airy cyan blue botanical printed halter ensemble with tassel pom-pom trim and tie-back backless detail.',
      specs: {
        color: 'Cyan Floral Multi',
        fabric: 'Fine Cotton Voile',
        topTitle: 'Top:',
        top: {
          'Type': 'Halter Crop Top',
          'Fit': 'Slim Fit',
          'Length': 'Crop',
          'Neck': 'Self-Tie Halter Neck',
          'Sleeves': 'Sleeveless'
        },
        bottomTitle: 'Skirt:',
        bottom: {
          'Length': '17 Inches',
          'Fit': 'Flared with Pom-Pom Hem',
          'Waist': 'High Rise',
          'Closure': 'Elasticized Smocked Waist'
        }
      }
    }
  },
  {
    id: 'gram-4',
    src: '/assets/video/Video4.mp4',
    title: 'PARTY WEAR',
    category: 'EVENING SILHOUETTES',
    handle: '@houseofurvaah',
    link: '#party-wear',
    product: {
      id: 'gram-prod-4',
      name: 'PEACH BROCADE CORSET CO-ORD SET',
      price: 5499,
      formattedPrice: '₹ 5,499',
      category: 'PARTY WEAR',
      subcategory: 'Evening & Festive',
      tag: 'EXCLUSIVE',
      image: '/assets/Images/Peach03.png',
      hoverImage: '/assets/Images/Peach_Floral.jpg',
      gallery: [
        '/assets/Images/Peach03.png',
        '/assets/Images/Peach_Floral.jpg',
        '/assets/Images/Peach01.png'
      ],
      colors: ['#F5D6CE', '#D4AF37'],
      sizes: ['XS', 'S', 'M'],
      description: 'Festive brocade bustier top paired with matching straight-fit skirt embellished with fine zari weaves.',
      specs: {
        color: 'Dusty Rose & Zari Gold',
        fabric: 'Metallic Brocade Silk',
        topTitle: 'Top:',
        top: {
          'Type': 'Structured Bustier Top',
          'Fit': 'Contoured Slim Fit',
          'Length': 'Waist Length',
          'Neck': 'Square Boat Neck',
          'Sleeves': 'Cap Sleeves'
        },
        bottomTitle: 'Skirt:',
        bottom: {
          'Length': '19 Inches',
          'Fit': 'Straight Pencil Fit',
          'Waist': 'High Rise',
          'Closure': 'Concealed Side Zip'
        }
      }
    }
  },
  {
    id: 'gram-5',
    src: '/assets/video/Video5.mp4',
    title: 'SILK & SATIN',
    category: 'TIMELESS LUXURY',
    handle: '@houseofurvaah',
    link: '#silk-collection',
    product: {
      id: 'gram-prod-5',
      name: 'DRAPED MULBERRY SILK MIDI DRESS',
      price: 8999,
      formattedPrice: '₹ 8,999',
      category: 'DRESSES',
      subcategory: 'Silk & Satin Midis',
      tag: 'NEW IN',
      image: '/assets/Images/Corset04.png',
      hoverImage: '/assets/Images/Peach02.png',
      gallery: [
        '/assets/Images/Corset04.png',
        '/assets/Images/Peach02.png',
        '/assets/Images/Blue04.png'
      ],
      colors: ['#EFE8DE', '#111111'],
      sizes: ['S', 'M', 'L'],
      description: 'Pure mulberry silk mid-length silhouette featuring asymmetrical draped cowl neckline and fluid side slit.',
      specs: {
        color: 'Champagne Ivory',
        fabric: '100% Pure Mulberry Silk (22 Momme)',
        topTitle: 'Dress:',
        top: {
          'Type': 'Draped Slip Dress',
          'Fit': 'Fluid Bias-Cut Fit',
          'Length': '46 Inches (Midi)',
          'Neck': 'Asymmetrical Cowl Neck',
          'Sleeves': 'Sleeveless'
        },
        bottomTitle: 'Features:',
        bottom: {
          'Hem': 'High Side Slit',
          'Finish': 'French Seams',
          'Lining': 'Double Layered Bodice'
        }
      }
    }
  },
  {
    id: 'gram-6',
    src: '/assets/video/Video1.mp4',
    title: 'TAILORED BLAZERS',
    category: 'RUNWAY EDIT',
    handle: '@houseofurvaah',
    link: '#runway',
    product: {
      id: 'gram-prod-6',
      name: 'DOUBLE-BREASTED OVERSIZED BLAZER',
      price: 8990,
      formattedPrice: '₹ 8,990',
      category: 'OUTERWEAR',
      subcategory: 'Blazers & Tailoring',
      tag: 'ICONIC',
      image: '/assets/Images/Brown02.png',
      hoverImage: '/assets/Images/Brown01.png',
      gallery: [
        '/assets/Images/Brown02.png',
        '/assets/Images/Brown01.png',
        '/assets/Images/Brown04.png'
      ],
      colors: ['#4A3B32', '#111111'],
      sizes: ['XS', 'S', 'M', 'L'],
      description: 'Architectural oversized tailored blazer with structured shoulders, peak lapels, and horn buttons.',
      specs: {
        color: 'Taupe Umber',
        fabric: 'Wool Blend Suiting Crepe',
        topTitle: 'Blazer:',
        top: {
          'Type': 'Double-Breasted Blazer',
          'Fit': 'Oversized Boyfriend Silhouette',
          'Length': '30 Inches',
          'Lapel': 'Peak Lapel',
          'Sleeves': 'Long Sleeves with Horn Buttons'
        },
        bottomTitle: 'Details:',
        bottom: {
          'Pockets': 'Flap Jet Pockets',
          'Vents': 'Dual Back Vents',
          'Lining': 'Full Viscose Satin'
        }
      }
    }
  }
];

const InstagramIcon = () => (
  <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const VideoCard = ({ item, onOpenLook }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.defaultMuted = true;
      videoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <div
      onClick={onOpenLook}
      className="group relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-neutral-900 select-none transition-all duration-300 cursor-pointer hover:shadow-xl"
    >
      {/* Autoplaying Loop Video */}
      <video
        ref={(el) => {
          videoRef.current = el;
          if (el) {
            el.muted = true;
            el.defaultMuted = true;
          }
        }}
        src={item.src}
        autoPlay
        muted
        defaultMuted
        loop
        playsInline
        onPlay={(e) => {
          if (e.currentTarget) {
            e.currentTarget.muted = true;
          }
        }}
        onLoadedMetadata={(e) => {
          if (e.currentTarget) {
            e.currentTarget.muted = true;
          }
        }}
        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />

      {/* Top Bar Overlay: Brand Tag */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white/95 text-[10px] tracking-wider uppercase font-sans">
          <InstagramIcon />
          <span>{item.handle}</span>
        </div>
      </div>

      {/* Bottom Editorial Content Scrim Overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-4 sm:p-5 pt-16 flex flex-col justify-end text-left z-10">
        <span className="text-[10px] tracking-[0.25em] text-white/75 uppercase font-sans mb-1">
          {item.category}
        </span>
        <h3 className="text-base sm:text-lg font-serif tracking-[0.15em] text-white font-normal uppercase leading-tight">
          {item.title}
        </h3>
        <div className="mt-2.5 pt-1">
          <span className="inline-flex items-center gap-1 text-[10px] tracking-[0.2em] uppercase text-white/90 font-sans border-b border-white/40 group-hover:border-white transition-colors">
            SHOP THE LOOK
          </span>
        </div>
      </div>
    </div>
  );
};

// Shop The Look Modal (Matching the uploaded reference layout)
const ShopTheLookModal = ({ look, currentIndex, totalLooks, onClose, onPrev, onNext }) => {
  const modalVideoRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(look.product.image);
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const { addToCart, setPdpProduct, setIsCartOpen } = useCart();

  useEffect(() => {
    setSelectedImage(look.product.image);
    setSelectedImgIndex(0);
    setIsExpanded(true);
    if (modalVideoRef.current) {
      modalVideoRef.current.muted = true;
      modalVideoRef.current.defaultMuted = true;
      modalVideoRef.current.currentTime = 0;
      modalVideoRef.current.play().catch(() => {});
    }
  }, [look]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext]);

  const handleThumbnailClick = (img, index) => {
    setSelectedImage(img);
    setSelectedImgIndex(index);
  };

  const handlePrevImg = () => {
    const gallery = look.product.gallery;
    const nextIdx = (selectedImgIndex - 1 + gallery.length) % gallery.length;
    setSelectedImgIndex(nextIdx);
    setSelectedImage(gallery[nextIdx]);
  };

  const handleNextImg = () => {
    const gallery = look.product.gallery;
    const nextIdx = (selectedImgIndex + 1) % gallery.length;
    setSelectedImgIndex(nextIdx);
    setSelectedImage(gallery[nextIdx]);
  };

  const handleAddToCart = () => {
    addToCart(look.product, 'M');
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  const navigate = useNavigate();

  const handleMoreInfo = () => {
    if (look.product?.id) {
      navigate(`/product/${look.product.id}`);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    onClose();
  };

  const handleOpenCart = () => {
    setIsCartOpen(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none">
      {/* Darkened Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Close Button on Top Right */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 w-10 h-10 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-white flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-lg border border-neutral-700/50"
        aria-label="Close modal"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Prev Look Navigation Arrow */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        className="fixed left-2 sm:left-6 md:left-10 top-1/2 -translate-y-1/2 z-50 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-white flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-xl border border-neutral-700/50"
        aria-label="Previous look"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Next Look Navigation Arrow */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        className="fixed right-2 sm:right-6 md:right-10 top-1/2 -translate-y-1/2 z-50 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-white flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-xl border border-neutral-700/50"
        aria-label="Next look"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Center Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative z-40 w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-neutral-200/60 max-h-[92vh] md:h-[640px]"
      >
        {/* Left Side: Vertical Fashion Video */}
        <div className="relative w-full md:w-[48%] h-[320px] sm:h-[400px] md:h-full bg-neutral-950 flex-shrink-0 overflow-hidden">
          <video
            ref={(el) => {
              modalVideoRef.current = el;
              if (el) {
                el.muted = true;
                el.defaultMuted = true;
              }
            }}
            key={look.src}
            src={look.src}
            autoPlay
            muted
            defaultMuted
            loop
            playsInline
            onPlay={(e) => {
              if (e.currentTarget) {
                e.currentTarget.muted = true;
              }
            }}
            onLoadedMetadata={(e) => {
              if (e.currentTarget) {
                e.currentTarget.muted = true;
              }
            }}
            className="w-full h-full object-cover"
          />

          {/* Reel Tag Badge */}
          <div className="absolute top-3.5 left-3.5 z-30 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white/95 text-[10px] tracking-wider uppercase font-sans">
            <InstagramIcon />
            <span>{look.handle}</span>
          </div>
        </div>

        {/* Right Side: Product Details & Shoppable Panel (Scrollable) */}
        <div className="w-full md:w-[52%] flex flex-col h-full overflow-hidden bg-white text-neutral-900 font-sans">
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 md:p-7 space-y-4">
            {/* Main Product Image Viewer with Carousel Controls */}
            <div className="relative w-full h-[230px] sm:h-[260px] md:h-[280px] rounded-xl overflow-hidden bg-neutral-100 group shadow-xs flex items-center justify-center">
              <img
                src={selectedImage}
                alt={look.product.name}
                className="w-full h-full object-contain object-center transition-all duration-300 p-1"
              />

              {look.product.gallery.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImg}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/85 hover:bg-white text-neutral-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextImg}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/85 hover:bg-white text-neutral-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  {/* Indicator dots */}
                  <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1">
                    {look.product.gallery.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 rounded-full transition-all ${
                          i === selectedImgIndex ? 'w-4 bg-neutral-800' : 'w-1.5 bg-neutral-400/60'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Product Title & Formatted Price */}
            <div>
              <h3 className="font-serif text-base sm:text-lg md:text-xl font-normal tracking-[0.04em] uppercase text-neutral-900 leading-snug">
                {look.product.name}
              </h3>
              <p className="text-sm sm:text-base font-semibold text-neutral-900 mt-1 font-sans">
                {look.product.formattedPrice}
              </p>
            </div>

            {/* Selected Product Section with Thumbnails */}
            <div className="pt-2 border-t border-neutral-100">
              <span className="text-[11px] font-semibold text-neutral-800 uppercase tracking-wider block mb-2 font-sans">
                Selected Product
              </span>
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                {look.product.gallery.map((img, idx) => {
                  const isSelected = selectedImage === img;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleThumbnailClick(img, idx)}
                      className={`relative w-14 h-16 sm:w-16 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100 transition-all cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? 'border-2 border-red-500 ring-2 ring-red-500/30'
                          : 'border border-neutral-200 hover:border-neutral-400 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt={look.product.name}
                        onError={(e) => {
                          e.currentTarget.parentElement.style.display = 'none';
                        }}
                        className="w-full h-full object-contain object-center p-0.5"
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description & Structured Details Section (Matching Screenshot) */}
            {look.product.specs && (
              <div className="pt-3 border-t border-neutral-100 text-[13px] text-neutral-800 space-y-3 font-sans">
                <h4 className="font-bold text-sm text-neutral-950 tracking-tight">Description</h4>

                <div className="space-y-1 text-neutral-800 leading-relaxed">
                  <p>
                    <span className="font-semibold text-neutral-900">Color:</span> {look.product.specs.color}
                  </p>
                  <p>
                    <span className="font-semibold text-neutral-900">Fabric:</span> {look.product.specs.fabric}
                  </p>
                </div>

                {/* Collapsible Details */}
                {isExpanded && (
                  <div className="space-y-3 pt-1">
                    {look.product.specs.top && (
                      <div className="space-y-1">
                        <p className="font-bold text-neutral-950 text-[13px]">{look.product.specs.topTitle || 'Top:'}</p>
                        {Object.entries(look.product.specs.top).map(([key, val]) => (
                          <p key={key} className="text-neutral-700">
                            <span className="font-medium text-neutral-900">{key}:</span> {val}
                          </p>
                        ))}
                      </div>
                    )}

                    {look.product.specs.bottom && (
                      <div className="space-y-1">
                        <p className="font-bold text-neutral-950 text-[13px]">{look.product.specs.bottomTitle || 'Skirt:'}</p>
                        {Object.entries(look.product.specs.bottom).map(([key, val]) => (
                          <p key={key} className="text-neutral-700">
                            <span className="font-medium text-neutral-900">{key}:</span> {val}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <p className="text-[11px] text-neutral-500 leading-relaxed pt-1">
                  Product color may slightly vary due to photographic lighting sources or your monitor settings.
                </p>

                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="font-bold text-neutral-950 text-[12px] hover:underline cursor-pointer block mt-1"
                >
                  {isExpanded ? 'Read less' : 'Read more'}
                </button>
              </div>
            )}
          </div>

          {/* Sticky Action Buttons Bar at the Bottom */}
          <div className="p-4 sm:px-6 md:px-7 bg-white border-t border-neutral-100 flex items-center gap-2 sm:gap-3 flex-shrink-0 z-10 shadow-xs">
            {/* More info button */}
            <button
              type="button"
              onClick={handleMoreInfo}
              className="flex-1 py-2.5 px-3 border border-neutral-300 hover:border-black rounded-lg text-[11px] sm:text-xs tracking-wider uppercase font-semibold text-neutral-800 hover:text-black transition-colors text-center cursor-pointer"
            >
              More info
            </button>

            {/* Add to Cart button */}
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-[2] py-2.5 px-4 bg-neutral-950 hover:bg-black text-white rounded-lg text-[11px] sm:text-xs tracking-wider uppercase font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Added</span>
                </>
              ) : (
                <span>Add to cart</span>
              )}
            </button>

            {/* View Cart Icon button */}
            <button
              type="button"
              onClick={handleOpenCart}
              className="p-2.5 border border-neutral-300 hover:border-black rounded-lg text-neutral-800 hover:text-black transition-colors flex items-center justify-center cursor-pointer"
              aria-label="Open Shopping Bag"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const TrendingOnGram = () => {
  const [activeModalIndex, setActiveModalIndex] = useState(null);

  const handleOpenModal = (index) => {
    setActiveModalIndex(index);
  };

  const handleCloseModal = () => {
    setActiveModalIndex(null);
  };

  const handlePrevLook = () => {
    setActiveModalIndex((prev) => (prev - 1 + GRAM_VIDEOS.length) % GRAM_VIDEOS.length);
  };

  const handleNextLook = () => {
    setActiveModalIndex((prev) => (prev + 1) % GRAM_VIDEOS.length);
  };

  return (
    <section className="py-12 md:py-16 px-4 md:px-8 max-w-[1800px] mx-auto bg-white font-serif">
      {/* Section Heading matching BestSellers typography and left alignment */}
      <div className="mb-10 md:mb-14 border-b border-neutral-200 pb-6 md:pb-7 text-left">
        <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 font-serif block mb-1">
          AS SEEN ON INSTAGRAM
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl text-black flex items-baseline">
          <span className="font-parfumerie capitalize inline-block mr-2">Trending</span>
          <span className="font-le-jour">ON THE GRAM</span>
        </h2>
      </div>

      {/* Responsive Video Cards:
          - Desktop (lg): 4-column horizontal layout showing exactly the 4 primary videos
          - Mobile / Tablet (< lg): Smooth horizontal scroll carousel showing 1-2 cards at a time
      */}
      <div className="flex lg:grid lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 overflow-x-auto lg:overflow-visible snap-x snap-mandatory pb-4 lg:pb-0 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 scrollbar-none">
        {GRAM_VIDEOS.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.08 }}
            className={`snap-center flex-shrink-0 w-[72vw] sm:w-[46vw] md:w-[36vw] lg:w-auto ${
              idx >= 4 ? 'lg:hidden' : ''
            }`}
          >
            <VideoCard
              item={item}
              onOpenLook={() => handleOpenModal(idx)}
            />
          </motion.div>
        ))}
      </div>

      {/* Shop The Look Modal */}
      <AnimatePresence>
        {activeModalIndex !== null && (
          <ShopTheLookModal
            look={GRAM_VIDEOS[activeModalIndex]}
            currentIndex={activeModalIndex}
            totalLooks={GRAM_VIDEOS.length}
            onClose={handleCloseModal}
            onPrev={handlePrevLook}
            onNext={handleNextLook}
          />
        )}
      </AnimatePresence>
    </section>
  );
};
