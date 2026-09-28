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
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:opacity-60 transition-opacity text-brand-dark cursor-pointer"
            aria-label="Open navigation drawer"
          >
            <Menu className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.25]" />
          </button>

          {/* Right Side: Search, Wishlist, Bag, Account Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 text-brand-dark">
            {/* Search Icon Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="hidden sm:flex p-1.5 items-center justify-center hover:opacity-60 transition-opacity text-brand-dark cursor-pointer"
              aria-label="Search"
              title="Search products"
            >
              <Search className="w-5.5 h-5.5 sm:w-6 sm:h-6 stroke-[2]" />
            </button>

            {/* Mobile Search Icon */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex sm:hidden p-2 items-center justify-center hover:opacity-60 transition-opacity text-brand-dark cursor-pointer"
              aria-label="Search"
              title="Search"
            >
              <Search className="w-5 h-5 stroke-[2.25]" />
            </button>

            {/* Wishlist Icon + Overlapping Badge */}
            <Link
              to="/wishlist"
              onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
              className="hidden sm:flex relative p-1.5 items-center justify-center hover:opacity-60 transition-opacity text-brand-dark cursor-pointer"
              aria-label="Wishlist"
              title="Wishlist"
            >
              <Heart className="w-5.5 h-5.5 sm:w-6 sm:h-6 stroke-[2]" />
              {wishlistCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-black text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Shopping Bag Icon + Overlapping Badge */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-1.5 flex items-center justify-center hover:opacity-60 transition-opacity text-brand-dark cursor-pointer"
              aria-label="Shopping Bag"
              title="Shopping Bag"
            >
              <ShoppingBag className="w-5.5 h-5.5 sm:w-6 sm:h-6 stroke-[2]" />
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-black text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            </button>

            {/* Account Icon */}
            <button
              onClick={handleAccountClick}
              className="hidden sm:flex p-1.5 items-center justify-center hover:opacity-60 transition-opacity text-brand-dark cursor-pointer"
              aria-label="Account"
              title="Account"
            >
              <User className="w-5.5 h-5.5 sm:w-6 sm:h-6 stroke-[2]" />
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
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:opacity-60 transition-opacity text-brand-dark cursor-pointer"
              aria-label="Open navigation drawer"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
            </button>
          </div>

          {/* Column 2 (Center): house of URVAAH Logo Image */}
          <div className="flex items-center justify-center">
            <Link to="/" aria-label="House of Urvaah Home" data-allow-guest="true" className="inline-flex items-center justify-center">
              <Logo className="h-8 sm:h-12 md:h-16 lg:h-20" />
            </Link>
          </div>

          {/* Column 3 (Right): Search, Wishlist, Bag, Account Icons */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2.5 text-brand-dark">
            {/* Search Icon (First in right group) */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-1.5 flex items-center justify-center hover:opacity-60 transition-opacity text-brand-dark cursor-pointer"
              aria-label="Search"
              title="Search products"
            >
              <Search className="w-5.5 h-5.5 sm:w-6 sm:h-6 stroke-[2]" />
            </button>

            {/* Wishlist Icon + Overlapping Badge */}
            <Link
              to="/wishlist"
              onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
              className="hidden sm:flex relative p-1.5 items-center justify-center hover:opacity-60 transition-opacity text-brand-dark cursor-pointer"
              aria-label="Wishlist"
              title="Wishlist"
            >
              <Heart className="w-5.5 h-5.5 sm:w-6 sm:h-6 stroke-[2]" />
              {wishlistCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-black text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Shopping Bag Icon + Overlapping Badge */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-1.5 flex items-center justify-center hover:opacity-60 transition-opacity text-brand-dark cursor-pointer"
              aria-label="Shopping Bag"
              title="Shopping Bag"
            >
              <ShoppingBag className="w-5.5 h-5.5 sm:w-6 sm:h-6 stroke-[2]" />
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-black text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            </button>

            {/* Account Icon */}
            <button
              onClick={handleAccountClick}
              className="hidden sm:flex p-1.5 items-center justify-center hover:opacity-60 transition-opacity text-brand-dark cursor-pointer"
              aria-label="Account"
              title="Account"
            >
              <User className="w-5.5 h-5.5 sm:w-6 sm:h-6 stroke-[2]" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

