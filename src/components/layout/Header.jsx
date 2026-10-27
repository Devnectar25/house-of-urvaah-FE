import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Menu, Search, User, Heart, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { Logo } from '../common/Logo';

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  // All paths that render the Home page with the Hero Section
  const HOME_PATHS = [
    '/',
    '',
    '/new-in',
    '/clothing',
    '/dresses',
    '/tops',
    '/knitwear',
    '/outerwear',
    '/trousers',
    '/shoes',
    '/accessories',
    '/sale',
    '/login',
  ];
  const isHomePage = HOME_PATHS.includes(location.pathname);
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

    const checkScrollPosition = () => {
      const bestSellersSection = document.getElementById('best-sellers');
      if (bestSellersSection) {
        const rect = bestSellersSection.getBoundingClientRect();
        // Navbar becomes solid/blurry only when Best Sellers reaches top of viewport (80px header height)
        setIsScrolled(rect.top <= 80);
      } else {
        // Fallback: Best sellers is placed after HeroParallaxBlock (~1.5 viewport heights down)
        setIsScrolled(window.scrollY > (window.innerHeight * 1.5));
      }
    };

    window.addEventListener('scroll', checkScrollPosition, { passive: true });
    window.addEventListener('resize', checkScrollPosition, { passive: true });
    
    // Check immediately and on paint/microtask
    checkScrollPosition();
    const rafId = requestAnimationFrame(checkScrollPosition);
    const timer = setTimeout(checkScrollPosition, 100);

    return () => {
      window.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
    };
  }, [isHomePage, location.pathname]);

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
            : 'opacity-0 -translate-y-2 pointer-events-none absolute inset-x-0 top-0 invisible'
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
              className="relative p-1 flex items-center justify-center hover:opacity-60 hover:scale-105 transition-all text-brand-dark cursor-pointer"
              aria-label="Search"
              title="Search products"
            >
              <Search className="w-5 h-5 sm:w-[22px] sm:h-[22px] stroke-[1.5]" />
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

            {/* Account Icon (Right Side) */}
            <button
              onClick={handleAccountClick}
              className="relative p-1 flex items-center justify-center hover:opacity-60 hover:scale-105 transition-all text-brand-dark cursor-pointer"
              aria-label="Account"
              title={user ? 'My Account' : 'Account'}
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
        className={`w-full text-brand-dark py-1 md:py-1.5 transition-all duration-300 ease-in-out ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-sm opacity-100 translate-y-0 pointer-events-auto relative'
            : 'bg-transparent border-transparent opacity-0 -translate-y-2 pointer-events-none absolute inset-x-0 top-0 invisible'
        }`}
      >
        <div className="max-w-[1800px] mx-auto px-3 sm:px-4 md:px-8 relative flex items-center justify-between min-h-[56px] sm:min-h-[64px] md:min-h-[72px]">
          {/* Left Side: Hamburger Icon */}
          <div className="flex items-center z-10">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 min-w-[40px] min-h-[40px] flex items-center justify-center hover:opacity-60 transition-opacity text-brand-dark cursor-pointer"
              aria-label="Open navigation drawer"
            >
              <Menu className="w-5.5 h-5.5 sm:w-6 sm:h-6 stroke-[1.5]" />
            </button>
          </div>

          {/* Center: Brand Logo */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto z-10">
            <Link
              to="/"
              aria-label="House of Urvaah Home"
              data-allow-guest="true"
              onClick={() => {
                sessionStorage.removeItem('urvaah_home_last_section');
                sessionStorage.removeItem('urvaah_home_scroll_y');
                sessionStorage.removeItem('urvaah_home_should_restore');
                window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center justify-center py-1"
            >
              <Logo className="h-10 sm:h-12 md:h-14 lg:h-16" />
            </Link>
          </div>

          {/* Right Side: Search, Wishlist, Bag, Profile Icons */}
          <div className="flex items-center justify-end gap-2.5 sm:gap-4 text-brand-dark z-10">
            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="relative p-1 flex items-center justify-center hover:opacity-60 hover:scale-105 transition-all text-brand-dark cursor-pointer"
              aria-label="Search"
              title="Search products"
            >
              <Search className="w-5 h-5 sm:w-[22px] sm:h-[22px] stroke-[1.5]" />
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

            {/* Account / Profile Icon (Right Side) */}
            <button
              onClick={handleAccountClick}
              className="relative p-1 flex items-center justify-center hover:opacity-60 hover:scale-105 transition-all text-brand-dark cursor-pointer"
              aria-label="Account"
              title={user ? 'My Account' : 'Account'}
            >
              <User className="w-5 h-5 sm:w-[22px] sm:h-[22px] stroke-[1.5]" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

