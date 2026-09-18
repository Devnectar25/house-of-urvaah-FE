import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Search, Heart, ShoppingBag, ChevronDown, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { getSupabaseMediaUrl } from '../../lib/supabase';

const TABS = ['WOMAN'];

const FEATURED_PREVIEWS = [
  { label: 'THE NEW', image: getSupabaseMediaUrl('/assets/Images/Brown01.png'), href: '#recommended' },
  { label: 'DRESSES', image: getSupabaseMediaUrl('/assets/Images/Corset01.png'), href: '#whats-hot' },
  { label: 'TAILORED', image: getSupabaseMediaUrl('/assets/Images/Brown02.png'), href: '#best-sellers' },
  { label: 'CO-ORDS', image: getSupabaseMediaUrl('/assets/Images/Blue02.png'), href: '#steal-deals' },
  { label: 'OUTERWEAR', image: getSupabaseMediaUrl('/assets/Images/Brown04.png'), href: '#editorial' },
  { label: 'KNITWEAR', image: getSupabaseMediaUrl('/assets/Images/Peach03.png'), href: '#trending' }
];

const MENU_SECTIONS = [
  {
    num: '01',
    title: 'NEW IN & WEEKLY DROPS',
    items: [
      { label: 'Weekly Drop #34 / W26', href: '#recommended' },
      { label: 'Studio Capsule Edit', href: '#whats-hot' },
      { label: 'Monochrome Outerwear', href: '#editorial' },
      { label: 'Silk & Satin Collection', href: '#recommended' }
    ]
  },
  {
    num: '02',
    title: 'BEST SELLERS',
    items: [
      { label: 'Oversized Tailored Blazer', href: '#best-sellers' },
      { label: 'Dark Blue Wide Leg Set', href: '#best-sellers' },
      { label: 'Peach Bloom Corset Set', href: '#best-sellers' },
      { label: 'Minimalist Ribbed Silk Top', href: '#best-sellers' }
    ]
  },
  {
    num: '03',
    title: 'COLLECTION & CATEGORIES',
    items: [
      { label: 'Dresses & Jumpsuits', href: '#whats-hot' },
      { label: 'Outerwear & Coats', href: '#editorial' },
      { label: 'Co-ord Sets & Tailoring', href: '#steal-deals' },
      { label: 'Tops & Shirts', href: '#recommended' },
      { label: 'Knitwear & Sweaters', href: '#trending' },
      { label: 'Trousers & Skirts', href: '#best-sellers' }
    ]
  },
  {
    num: '04',
    title: 'EDITORIAL & STORIES',
    items: [
      { label: 'Autumn / Winter 2026 Runway', href: '#editorial' },
      { label: 'Trending on the Gram', href: '#trending' },
      { label: 'Steal Deals Edit', href: '#steal-deals' },
      { label: 'House of Urvaah Journal', isRoute: true, to: '/about' }
    ]
  },
  {
    num: '05',
    title: 'HELP & CONCIERGE',
    items: [
      { label: 'About Us / Our Story', isRoute: true, to: '/about' },
      { label: 'Contact Us / Customer Concierge', isRoute: true, to: '/contact' },
      { label: 'Boutique Locator & Stores', href: '#footer' }
    ]
  }
];

export const MobileMenu = () => {
  const {
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    cartCount,
    wishlistCount,
    setIsCartOpen,
    setIsSearchOpen,
    openAuthModal
  } = useCart();

  const [activeTab, setActiveTab] = useState('WOMAN');
  const [expandedSection, setExpandedSection] = useState('01');

  const toggleSection = (num) => {
    setExpandedSection(expandedSection === num ? null : num);
  };

  const handleItemClick = (e, item) => {
    setIsMobileMenuOpen(false);
    if (item.isRoute) return;

    if (item.href) {
      e.preventDefault();
      const href = item.href;

      if (window.location.pathname !== '/' && window.location.pathname !== '') {
        window.location.href = `/${href}`;
        return;
      }

      const targetId = href.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      } else {
        window.location.hash = href;
      }
    }
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
            className="fixed top-0 left-0 z-50 h-full w-full max-w-md bg-white text-brand-dark shadow-2xl flex flex-col font-serif select-none border-r border-neutral-200"
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
                    openAuthModal('login');
                  }}
                  className="p-2 text-brand-dark hover:opacity-60 transition-opacity cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
                  aria-label="Account"
                  title="Account"
                >
                  <User className="w-5 h-5 stroke-[1.75]" />
                </button>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsSearchOpen(true);
                  }}
                  className="p-2 text-brand-dark hover:opacity-60 transition-opacity cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
                  aria-label="Search"
                  title="Search"
                >
                  <Search className="w-5 h-5 stroke-[1.75]" />
                </button>

                <Link
                  to="/wishlist"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'instant' });
                  }}
                  className="p-2 text-brand-dark hover:opacity-60 transition-opacity cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center gap-0.5"
                  aria-label="Wishlist"
                  title="Wishlist"
                >
                  <Heart className="w-5 h-5 stroke-[1.75]" />
                  {wishlistCount > 0 && (
                    <span className="text-xs font-bold font-mono tracking-wider">
                      [{wishlistCount}]
                    </span>
                  )}
                </Link>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsCartOpen(true);
                  }}
                  className="p-2 text-brand-dark hover:opacity-60 transition-opacity cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center gap-0.5"
                  aria-label="Shopping Bag"
                  title="Shopping Bag"
                >
                  <ShoppingBag className="w-5 h-5 stroke-[1.75]" />
                  <span className="text-xs font-bold font-mono tracking-wider">
                    [{cartCount}]
                  </span>
                </button>
              </div>
            </div>

            {/* 2. CATEGORY TABS ROW: Horizontal Tabs (WOMAN, MAN, KIDS, PERFUMES & BEAUTY) */}
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
            <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-6">
              {/* 3. FEATURED PREVIEWS ROW: Horizontally Scrollable Category Cards */}
              <div>
                <span className="text-[10px] tracking-[0.25em] text-neutral-400 uppercase font-serif block mb-3">
                  FEATURED CATEGORIES
                </span>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {FEATURED_PREVIEWS.map((cat, idx) => (
                    <a
                      key={idx}
                      href={cat.href}
                      onClick={(e) => handleItemClick(e, cat)}
                      className="flex-shrink-0 w-24 group flex flex-col items-center cursor-pointer"
                    >
                      <div className="w-24 h-32 bg-neutral-100 overflow-hidden mb-1.5 border border-neutral-200/60 shadow-xs group-hover:border-black transition-colors">
                        <img
                          src={cat.image}
                          alt={cat.label}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <span className="text-[10px] font-semibold tracking-widest text-center text-neutral-900 group-hover:text-black uppercase">
                        {cat.label}
                      </span>
                    </a>
                  ))}
                </div>
              </div>

              {/* 4. EXPANDABLE NUMBERED MENU LIST (01 | NEW IN, 02 | BEST SELLERS, ETC.) */}
              <div className="pt-2 border-t border-neutral-100 divide-y divide-neutral-100">
                {MENU_SECTIONS.map((sec) => {
                  const isExpanded = expandedSection === sec.num;
                  return (
                    <div key={sec.num} className="py-1">
                      {/* Section Header */}
                      <button
                        onClick={() => toggleSection(sec.num)}
                        className="w-full py-3.5 flex items-center justify-between text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-neutral-400 group-hover:text-black transition-colors">
                            {sec.num}
                          </span>
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
                            className="overflow-hidden pl-7 pr-2 pb-3 space-y-2.5"
                          >
                            {sec.items.map((sub, sIdx) => {
                              const linkContent = (
                                <span className="text-xs text-neutral-600 hover:text-black tracking-wider uppercase font-medium transition-colors flex items-center justify-between group/sub py-1 cursor-pointer">
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
                                >
                                  {linkContent}
                                </Link>
                              ) : (
                                <a
                                  key={sIdx}
                                  href={sub.href}
                                  onClick={(e) => handleItemClick(e, sub)}
                                >
                                  {linkContent}
                                </a>
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
            <div className="p-4 px-5 border-t border-neutral-100 bg-[#FAF8F3] text-[10px] text-neutral-500 tracking-widest flex items-center justify-between font-mono">
              <span className="text-brand-dark font-semibold">HOUSE OF URVAAH</span>
              <span>INDIA (INR ₹)</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
