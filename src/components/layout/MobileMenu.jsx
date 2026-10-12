import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Search, Heart, ShoppingBag, ArrowRight, ChevronDown } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { productApi } from '../../services/productApi';
import { Logo } from '../common/Logo';

const TABS = ['WOMAN'];

const WEBSITE_SECTIONS = [
  {
    id: 'discover',
    title: 'DISCOVER THE ATELIER',
    items: [
      { label: 'BEST SELLERS', target: 'best-sellers' },
      { label: 'TRENDING ON THE GRAM', target: 'trending' },
      { label: 'WHAT’S HOT RN', target: 'whats-hot' },
      { label: 'RECOMMENDED FOR YOU', target: 'recommended' },
      { label: 'EDITORIAL & LOOKBOOK', target: 'editorial' }
    ]
  },
  {
    id: 'concierge',
    title: 'CLIENT CONCIERGE & CARE',
    items: [
      { label: 'ABOUT US / ATELIER STORY', isRoute: true, to: '/about' },
      { label: 'CONTACT US / CONCIERGE', isRoute: true, to: '/contact' },
      { label: 'FREQUENTLY ASKED QUESTIONS', isRoute: true, to: '/faqs' },
      { label: 'MY WISHLIST', isRoute: true, to: '/wishlist' },
      { label: 'ACCOUNT & ORDERS', isRoute: true, to: '/account' }
    ]
  }
];

export const MobileMenu = () => {
  const navigate = useNavigate();
  const {
    user,
    session,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    cartCount,
    wishlistCount,
    setIsCartOpen,
    setIsSearchOpen,
    openAuthModal,
    setPdpProduct
  } = useCart();

  const [activeTab, setActiveTab] = useState('WOMAN');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchMenuData = async () => {
      try {
        const [catsRes, prodsRes] = await Promise.all([
          productApi.getCategories().catch(() => []),
          productApi.getProducts({ active: true }).catch(() => [])
        ]);

        if (!isMounted) return;

        const rawCats = Array.isArray(catsRes) ? catsRes : (catsRes?.data || []);
        const activeCats = rawCats.filter(
          (c) => c && c.is_active !== false && c.active !== false
        );

        const rawProds = Array.isArray(prodsRes) ? prodsRes : (prodsRes?.data || []);
        setCategories(activeCats);
        setProducts(rawProds);
      } catch (err) {
        console.warn('[MobileMenu] Error loading categories/products:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchMenuData();

    const handleUpdate = () => fetchMenuData();
    window.addEventListener('urvaah_products_updated', handleUpdate);
    window.addEventListener('urvaah_categories_updated', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('urvaah_products_updated', handleUpdate);
      window.removeEventListener('urvaah_categories_updated', handleUpdate);
    };
  }, []);

  const toggleSection = (key) => {
    setExpandedSection((prev) => (prev === key ? null : key));
  };

  const getCategoryProducts = (cat) => {
    if (!cat || !products.length) return [];
    const catNameLower = (cat.name || '').toLowerCase().trim();
    const catId = String(cat.id || cat.category_id || '');

    return products.filter((p) => {
      const pCatId = String(p.category_id || '');
      const pCatName = (p.category || '').toLowerCase().trim();
      if (catId && pCatId && pCatId === catId) return true;
      if (catNameLower && pCatName && pCatName === catNameLower) return true;
      if (catNameLower.includes('corset') && (p.name || '').toLowerCase().includes('corset')) return true;
      return false;
    });
  };

  const handleProductClick = (product) => {
    setIsMobileMenuOpen(false);
    if (product) {
      setPdpProduct(product);
    }
  };

  const scrollToTarget = (targetId) => {
    let element = document.getElementById(targetId);

    // Fallback for hidden or aliased sections (e.g. steal-deals -> whats-hot / recommended)
    if (!element) {
      if (targetId === 'steal-deals') {
        element = document.getElementById('whats-hot') || document.getElementById('recommended');
      } else if (
        targetId === 'corset-tops' ||
        targetId === 'co-ord-sets' ||
        targetId === 'kurti' ||
        targetId === 'kurtis' ||
        targetId === 'summer-dresses' ||
        targetId === 'party-wear'
      ) {
        element = document.getElementById(targetId) || document.getElementById('whats-hot') || document.getElementById('recommended');
      }
    }

    if (element) {
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  };

  const handleItemClick = (item) => {
    setIsMobileMenuOpen(false);
    if (item.isRoute) return;

    const targetId = (item.target || item.href || '').replace('#', '');
    if (!targetId) return;

    if (window.location.pathname !== '/' && window.location.pathname !== '') {
      navigate('/');
      setTimeout(() => {
        scrollToTarget(targetId);
      }, 200);
      return;
    }

    scrollToTarget(targetId);
  };

  return (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs select-none"
          />

          {/* Zara-Style Side Drawer Navigation Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            style={{ overscrollBehavior: 'contain' }}
            className="fixed top-0 left-0 z-50 h-full w-full max-w-md bg-white text-brand-dark shadow-2xl flex flex-col font-serif select-none border-r border-neutral-200 overscroll-contain"
          >
            {/* 1. TOP BAR: Close (X) on Top-Left; Account, Search, Wishlist, Cart on Top-Right */}
            <div className="p-4 px-5 flex items-center justify-between border-b border-neutral-100 bg-white">
              {/* Top-Left: Close (X) Icon */}
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 -ml-2 text-brand-dark hover:opacity-60 transition-opacity cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 stroke-[1.75]" />
              </button>

              {/* Top-Right: Account, Search, Wishlist, Cart Icon Row (Mobile Only) */}
              <div className="flex sm:hidden items-center gap-1 sm:gap-2 text-brand-dark">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    const activeToken = localStorage.getItem('urvaah_token') || localStorage.getItem('sb-access-token');
                    if (user || session || activeToken) {
                      navigate('/account');
                      window.scrollTo({ top: 0, behavior: 'instant' });
                    } else {
                      openAuthModal('login');
                    }
                  }}
                  className="p-1.5 text-brand-dark hover:opacity-60 transition-opacity cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                  aria-label="Account"
                  title="Account"
                >
                  <User className="w-5 h-5 stroke-[1.5]" />
                </button>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsSearchOpen(true);
                  }}
                  className="p-1.5 text-brand-dark hover:opacity-60 transition-opacity cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                  aria-label="Search"
                  title="Search products"
                >
                  <Search className="w-5 h-5 stroke-[1.5]" />
                </button>

                <Link
                  to="/wishlist"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'instant' });
                  }}
                  className="relative p-1.5 text-brand-dark hover:opacity-60 transition-opacity cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                  aria-label="Wishlist"
                  title="Wishlist"
                >
                  <Heart className="w-5 h-5 stroke-[1.5]" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-0.5 -right-1 min-w-[16px] h-[16px] px-1 bg-black text-white text-[9px] font-mono font-semibold rounded-full flex items-center justify-center border border-white">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsCartOpen(true);
                  }}
                  className="relative p-1.5 text-brand-dark hover:opacity-60 transition-opacity cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                  aria-label="Shopping Bag"
                  title="Shopping Bag"
                >
                  <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-1 min-w-[16px] h-[16px] px-1 bg-black text-white text-[9px] font-mono font-semibold rounded-full flex items-center justify-center border border-white">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* 2. CATEGORY TABS ROW: Horizontal Tabs (WOMAN) */}
            <div className="border-b border-neutral-200 bg-white overflow-x-auto no-scrollbar">
              <div className="flex items-center px-4 gap-6 min-w-max text-xs font-serif tracking-[0.2em] uppercase">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-3.5 transition-all relative cursor-pointer ${
                        isActive
                          ? 'text-black font-semibold'
                          : 'text-neutral-500 hover:text-black font-normal'
                      }`}
                    >
                      {tab}
                      {isActive && (
                        <motion.div
                          layoutId="activeTabUnderline"
                          className="absolute bottom-0 inset-x-0 h-[2px] bg-black"
                          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* SCROLLABLE MENU BODY */}
            <div
              style={{ overscrollBehavior: 'contain' }}
              className="flex-1 overflow-y-auto overscroll-contain no-scrollbar p-5 space-y-4"
            >
              {/* ACCORDION: DATABASE CATEGORIES & WEBSITE SECTIONS */}
              <div className="divide-y divide-neutral-100">
                <div className="pb-2">
                  <span className="text-[10px] tracking-[0.25em] text-neutral-400 uppercase font-serif block">
                    ATELIER COLLECTIONS
                  </span>
                </div>

                {/* DYNAMIC CATEGORIES ACCORDION FROM DATABASE */}
                {categories.map((cat, idx) => {
                  const sectionKey = `cat-${cat.id || idx}`;
                  const isExpanded = expandedSection === sectionKey;
                  const catProducts = getCategoryProducts(cat);

                  return (
                    <div key={sectionKey} className="py-1">
                      {/* Category Header */}
                      <button
                        type="button"
                        onClick={() => toggleSection(sectionKey)}
                        className="w-full py-3.5 flex items-center justify-between text-left group cursor-pointer"
                      >
                        <div className="flex items-center min-w-0 pr-2">
                          <span className="text-xs sm:text-sm font-semibold tracking-[0.18em] uppercase text-neutral-900 group-hover:text-black transition-colors truncate">
                            {cat.name}
                          </span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-neutral-500 transition-transform duration-300 flex-shrink-0 ${
                            isExpanded ? 'rotate-180 text-black' : ''
                          }`}
                        />
                      </button>

                      {/* Expandable Accordion Products */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="overflow-hidden pl-3 pr-1 pb-3 space-y-2"
                          >
                            {catProducts.length > 0 ? (
                              catProducts.map((p) => {
                                const priceStr = p.formattedPrice || (p.price ? `₹ ${Number(p.price).toLocaleString('en-IN')}` : '');
                                const img = p.image_url || (Array.isArray(p.images) ? p.images[0] : null);

                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => handleProductClick(p)}
                                    className="group/prod flex items-center justify-between w-full py-1.5 px-2 rounded-xs hover:bg-neutral-50 text-left transition-colors cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                      {img && (
                                        <img
                                          src={img}
                                          alt={p.name}
                                          className="w-7 h-9 object-cover rounded-xs border border-neutral-200/60 flex-shrink-0"
                                        />
                                      )}
                                      <div className="min-w-0">
                                        <p className="text-xs text-neutral-800 group-hover/prod:text-black font-medium tracking-wide uppercase truncate">
                                          {p.name}
                                        </p>
                                        {priceStr && (
                                          <p className="text-[10px] font-mono text-neutral-500 mt-0.5">
                                            {priceStr}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover/prod:opacity-100 group-hover/prod:translate-x-0 transition-all text-black flex-shrink-0" />
                                  </button>
                                );
                              })
                            ) : (
                              <p className="text-[11px] text-neutral-400 font-serif italic py-1">
                                {cat.description || 'Curated Atelier collection.'}
                              </p>
                            )}

                            {/* View All in this Category */}
                            <button
                              type="button"
                              onClick={() => {
                                setIsMobileMenuOpen(false);
                                const catSlug = (cat.name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
                                navigate(`/category/${catSlug}`);
                                window.scrollTo({ top: 0, behavior: 'instant' });
                              }}
                              className="w-full pt-2.5 mt-1 border-t border-neutral-100 flex items-center justify-between text-[11px] font-mono tracking-widest text-neutral-500 hover:text-black uppercase cursor-pointer"
                            >
                              <span>Explore All {cat.name}</span>
                              <ArrowRight className="w-3 h-3 text-neutral-400 group-hover:text-black" />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {/* WEBSITE SECTIONS ACCORDION (DISCOVER & CONCIERGE) */}
                {WEBSITE_SECTIONS.map((sec) => {
                  const isExpanded = expandedSection === sec.id;
                  return (
                    <div key={sec.id} className="py-1">
                      {/* Section Header */}
                      <button
                        type="button"
                        onClick={() => toggleSection(sec.id)}
                        className="w-full py-3.5 flex items-center justify-between text-left group cursor-pointer"
                      >
                        <div className="flex items-center">
                          <span className="text-xs sm:text-sm font-semibold tracking-[0.18em] uppercase text-neutral-900 group-hover:text-black transition-colors">
                            {sec.title}
                          </span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-neutral-500 transition-transform duration-300 ${
                            isExpanded ? 'rotate-180 text-black' : ''
                          }`}
                        />
                      </button>

                      {/* Expandable Accordion Links */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="overflow-hidden pl-3 pr-2 pb-3 space-y-2.5"
                          >
                            {sec.items.map((sub, sIdx) => {
                              const linkContent = (
                                <span className="text-xs text-neutral-600 hover:text-black tracking-wider uppercase font-medium transition-colors flex items-center justify-between group/sub py-1 cursor-pointer w-full text-left">
                                  {sub.label}
                                  <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover/sub:opacity-100 group-hover/sub:translate-x-0 transition-all text-black" />
                                </span>
                              );

                              return sub.isRoute ? (
                                <Link
                                  key={sIdx}
                                  to={sub.to}
                                  onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    window.scrollTo({ top: 0, behavior: 'instant' });
                                  }}
                                  className="block w-full"
                                >
                                  {linkContent}
                                </Link>
                              ) : (
                                <button
                                  key={sIdx}
                                  type="button"
                                  onClick={() => handleItemClick(sub)}
                                  className="block w-full text-left"
                                >
                                  {linkContent}
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BOTTOM FOOTER INFO */}
            <div className="py-4 px-5 border-t border-neutral-100 bg-[#FAF8F3] text-[11px] text-neutral-500 tracking-widest flex items-center justify-between font-mono">
              <Link
                to="/"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'instant' });
                }}
                className="flex items-center hover:opacity-80 transition-opacity"
                aria-label="House of Urvaah Home"
              >
                <Logo className="h-14 sm:h-16" />
              </Link>
              <span>INDIA (INR ₹)</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;

