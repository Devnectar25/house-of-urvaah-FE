import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Menu, Search, User, Heart, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { Logo } from '../common/Logo';

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage =
    (location.pathname === '/' || location.pathname === '') &&
    (!location.hash || location.hash === '#' || location.hash === '#/' || location.hash === '');
  const {
    user,
    session,
    cartCount,
    wishlistCount,
    setIsCartOpen,
    setIsSearchOpen,
    setIsMobileMenuOpen,
    openAuthModal,
  } = useCart();

  const handleAccountClick = () => {
    const activeToken = localStorage.getItem('urvaah_token') || localStorage.getItem('sb-access-token');
    if (user || session || activeToken) {
      navigate('/account');
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      openAuthModal('login');
    }
  };

  useEffect(() => {
    if (!isHomePage) {
      setIsScrolled(true);
      return;
    }

    const handleScroll = () => {
      const bestSellersSection = document.getElementById('best-sellers');
      if (bestSellersSection) {
        const rect = bestSellersSection.getBoundingClientRect();
        // Navbar becomes solid as Best Sellers section reaches top of viewport (threshold 100px)
        setIsScrolled(rect.top <= 100);
      } else {
        setIsScrolled(window.scrollY > 400);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isHomePage, location.pathname, location.hash]);

  return (
    <header className="fixed top-0 z-40 w-full font-serif select-none transition-all duration-300 ease-in-out">
      {/* 
        =====================================================
        STATE 1: TRANSPARENT HERO HEADER (BEFORE RECOMMENDED FOR YOU)
        =====================================================
      */}
      <div
        className={`w-full pt-3 sm:pt-5 pb-3 px-3 sm:px-6 md:px-12 text-brand-dark transition-all duration-300 ease-in-out ${
          !isScrolled
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none absolute inset-x-0 top-0'
        }`}
      >
        <div className="max-w-[1800px] mx-auto flex justify-between items-center">
          {/* Top-Left: Hamburger Icon Only */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:opacity-60 transition-opacity text-brand-dark cursor-pointer"
            aria-label="Open navigation drawer"
          >
            <Menu className="w-5.5 h-5.5 sm:w-6 sm:h-6 stroke-[1.5]" />
          </button>

          {/* Right Side: Search, Wishlist, Bag, Account Icons */}
          <div className="flex items-center gap-3 sm:gap-4 text-brand-dark">
            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-1.5 pb-0.5 border-b border-brand-dark/70 hover:opacity-60 transition-opacity text-brand-dark cursor-pointer font-serif mr-1"
              aria-label="Search"
              title="Search products"
            >
              <span className="text-[11px] font-medium tracking-[0.2em] uppercase">SEARCH</span>
            </button>

            {/* Wishlist Icon + Refined Badge */}
            <Link
              to="/wishlist"
              onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
              className="hidden sm:flex relative p-1 items-center justify-center hover:opacity-60 hover:scale-105 transition-all text-brand-dark cursor-pointer"
              aria-label="Wishlist"
              title="Wishlist"
            >
              <Heart className="w-5 h-5 sm:w-[22px] sm:h-[22px] stroke-[1.5]" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-[17px] h-[17px] px-1 bg-black text-white text-[9px] font-mono font-semibold rounded-full flex items-center justify-center border border-white shadow-2xs">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Shopping Bag Icon + Refined Badge */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-1 flex items-center justify-center hover:opacity-60 hover:scale-105 transition-all text-brand-dark cursor-pointer"
              aria-label="Shopping Bag"
              title="Shopping Bag"
            >
              <ShoppingBag className="w-5 h-5 sm:w-[22px] sm:h-[22px] stroke-[1.5]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-[17px] h-[17px] px-1 bg-black text-white text-[9px] font-mono font-semibold rounded-full flex items-center justify-center border border-white shadow-2xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Account Icon */}
            <button
              onClick={handleAccountClick}
              className="hidden sm:flex p-1 items-center justify-center hover:opacity-60 hover:scale-105 transition-all text-brand-dark cursor-pointer"
              aria-label="Account"
              title="Account"
            >
              <User className="w-5 h-5 sm:w-[22px] sm:h-[22px] stroke-[1.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* 
        =====================================================
        STATE 2: SOLID STICKY HEADER (WHEN RECOMMENDED FOR YOU REACHES TOP)
        =====================================================
      */}
      <div
        className={`w-full bg-white/95 backdrop-blur-md border-b border-neutral-200 text-brand-dark shadow-sm py-1 md:py-1.5 transition-all duration-300 ease-in-out ${
          isScrolled
            ? 'opacity-100 translate-y-0 pointer-events-auto relative'
            : 'opacity-0 -translate-y-2 pointer-events-none absolute inset-x-0 top-0'
        }`}
      >
        <div className="max-w-[1800px] mx-auto px-3 sm:px-4 md:px-8 grid grid-cols-3 items-center min-h-[52px] sm:min-h-[60px] md:min-h-[68px]">
          {/* Column 1 (Left): Hamburger Icon Only */}
          <div className="flex items-center justify-start">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:opacity-60 transition-opacity text-brand-dark cursor-pointer"
              aria-label="Open navigation drawer"
            >
              <Menu className="w-5.5 h-5.5 sm:w-6 sm:h-6 stroke-[1.5]" />
            </button>
          </div>

          {/* Column 2 (Center): house of URVAAH Logo Image */}
          <div className="flex items-center justify-center">
            <Link to="/" aria-label="House of Urvaah Home" data-allow-guest="true" className="inline-flex items-center justify-center">
              <Logo className="h-8 sm:h-12 md:h-16 lg:h-20" />
            </Link>
          </div>

          {/* Column 3 (Right): Search, Wishlist, Bag, Account Icons */}
          <div className="flex items-center justify-end gap-3 sm:gap-4 text-brand-dark">
            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-1.5 pb-0.5 border-b border-brand-dark/70 hover:opacity-60 transition-opacity text-brand-dark cursor-pointer font-serif mr-1"
              aria-label="Search"
              title="Search products"
            >
              <span className="text-[11px] font-medium tracking-[0.2em] uppercase">SEARCH</span>
            </button>

            {/* Wishlist Icon + Refined Badge */}
            <Link
              to="/wishlist"
              onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
              className="hidden sm:flex relative p-1 items-center justify-center hover:opacity-60 hover:scale-105 transition-all text-brand-dark cursor-pointer"
              aria-label="Wishlist"
              title="Wishlist"
            >
              <Heart className="w-5 h-5 sm:w-[22px] sm:h-[22px] stroke-[1.5]" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-[17px] h-[17px] px-1 bg-black text-white text-[9px] font-mono font-semibold rounded-full flex items-center justify-center border border-white shadow-2xs">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Shopping Bag Icon + Refined Badge */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-1 flex items-center justify-center hover:opacity-60 hover:scale-105 transition-all text-brand-dark cursor-pointer"
              aria-label="Shopping Bag"
              title="Shopping Bag"
            >
              <ShoppingBag className="w-5 h-5 sm:w-[22px] sm:h-[22px] stroke-[1.5]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-[17px] h-[17px] px-1 bg-black text-white text-[9px] font-mono font-semibold rounded-full flex items-center justify-center border border-white shadow-2xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Account Icon */}
            <button
              onClick={handleAccountClick}
              className="hidden sm:flex p-1 items-center justify-center hover:opacity-60 hover:scale-105 transition-all text-brand-dark cursor-pointer"
              aria-label="Account"
              title="Account"
            >
              <User className="w-5 h-5 sm:w-[22px] sm:h-[22px] stroke-[1.5]" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

