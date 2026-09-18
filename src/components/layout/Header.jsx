import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, Search, User, Heart, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { Logo } from '../common/Logo';

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const isHomePage =
    (location.pathname === '/' || location.pathname === '') &&
    (!location.hash || location.hash === '#' || location.hash === '#/' || location.hash === '');
  const {
    cartCount,
    wishlistCount,
    setIsCartOpen,
    setIsSearchOpen,
    setIsMobileMenuOpen,
    openAuthModal,
  } = useCart();

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
        <div className="max-w-[1800px] mx-auto flex justify-between items-start">
          {/* Top-Left: Hamburger Icon Only */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:opacity-60 transition-opacity text-brand-dark cursor-pointer"
            aria-label="Open navigation drawer"
          >
            <Menu className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.25]" />
          </button>

          {/* Right Side: Search, Account/Log In, Wishlist, Bag Icons + Help */}
          <div className="flex items-center gap-0 sm:gap-1 md:gap-1.5 text-brand-dark">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="hidden sm:flex p-1 sm:p-1.5 items-center justify-center hover:opacity-60 transition-opacity text-brand-dark cursor-pointer"
              aria-label="Search"
              title="Search"
            >
              <Search className="w-5 h-5 md:w-6 md:h-6 stroke-[2.25]" />
            </button>

            <button
              onClick={() => openAuthModal('login')}
              className="hidden sm:flex p-1 sm:p-1.5 items-center justify-center hover:opacity-60 transition-opacity text-brand-dark cursor-pointer"
              aria-label="Log In / Sign Up"
              title="Log In / Sign Up"
            >
              <User className="w-5 h-5 md:w-6 md:h-6 stroke-[2.25]" />
            </button>

            <Link
              to="/wishlist"
              onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
              className="hidden sm:flex p-1 sm:p-1.5 items-center justify-center hover:opacity-60 transition-opacity text-brand-dark gap-1 cursor-pointer"
              aria-label="Wishlist"
              title="Wishlist"
            >
              <Heart className="w-5 h-5 md:w-6 md:h-6 stroke-[2.25]" />
              {wishlistCount > 0 && (
                <span className="text-xs font-bold tracking-wider font-mono">
                  [{wishlistCount}]
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsCartOpen(true)}
              className="p-1 sm:p-1.5 flex items-center justify-center hover:opacity-60 transition-opacity text-brand-dark gap-1 cursor-pointer"
              aria-label="Shopping Bag"
              title="Shopping Bag"
            >
              <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 stroke-[2.25]" />
              <span className="text-xs font-bold tracking-wider font-mono">
                [{cartCount}]
              </span>
            </button>

            <Link
              to="/contact"
              onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
              className="hidden sm:flex text-xs sm:text-sm md:text-base font-bold tracking-[0.15em] uppercase text-brand-dark hover:opacity-60 transition-opacity items-center min-h-[44px] px-1 leading-none ml-0.5"
            >
              HELP
            </Link>
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
            <Link to="/" aria-label="House of Urvaah Home" className="inline-flex items-center justify-center">
              <Logo className="h-8 sm:h-12 md:h-16 lg:h-20" />
            </Link>
          </div>

          {/* Column 3 (Right): Search, Account, Wishlist, Bag Icons */}
          <div className="flex items-center justify-end gap-0 sm:gap-1 md:gap-1.5 text-brand-dark">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="hidden sm:flex p-1 sm:p-1.5 items-center justify-center hover:opacity-60 transition-opacity text-brand-dark cursor-pointer"
              aria-label="Search"
              title="Search"
            >
              <Search className="w-5 h-5 md:w-6 md:h-6 stroke-[2]" />
            </button>

            <button
              onClick={() => openAuthModal('login')}
              className="hidden sm:flex p-1 sm:p-1.5 items-center justify-center hover:opacity-60 transition-opacity text-brand-dark cursor-pointer"
              aria-label="Account"
              title="Account"
            >
              <User className="w-5 h-5 md:w-6 md:h-6 stroke-[2]" />
            </button>

            <Link
              to="/wishlist"
              onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
              className="hidden sm:flex p-1 sm:p-1.5 items-center justify-center hover:opacity-60 transition-opacity text-brand-dark gap-1 cursor-pointer"
              aria-label="Wishlist"
              title="Wishlist"
            >
              <Heart className="w-5 h-5 md:w-6 md:h-6 stroke-[2]" />
              {wishlistCount > 0 && (
                <span className="text-xs font-semibold tracking-wider font-mono">
                  [{wishlistCount}]
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsCartOpen(true)}
              className="p-1 sm:p-1.5 flex items-center justify-center hover:opacity-60 transition-opacity text-brand-dark gap-1 cursor-pointer"
              aria-label="Shopping Bag"
              title="Shopping Bag"
            >
              <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 stroke-[2]" />
              <span className="text-xs font-semibold tracking-wider font-mono">
                [{cartCount}]
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

