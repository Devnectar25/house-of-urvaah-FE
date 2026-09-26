import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { FloatingChat } from './components/layout/FloatingChat';
import { CartDrawer } from './components/common/CartDrawer';
import { SearchOverlay } from './components/layout/SearchOverlay';
import { MobileMenu } from './components/layout/MobileMenu';
import { QuickViewModal } from './components/common/QuickViewModal';
import { ProductDetailModal } from './components/common/ProductDetailModal';
import { AuthModal } from './components/common/AuthModal';
import { Home } from './pages/Home';
import { AboutUs } from './pages/AboutUs';
import { ContactUs } from './pages/ContactUs';
import { ProductDetail } from './pages/ProductDetail';
import { Account } from './pages/Account';
import { Wishlist } from './pages/Wishlist';
import { AuthCallback } from './components/auth/AuthCallback';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { ShippingPolicy } from './pages/ShippingPolicy';
import { ReturnRefundPolicy } from './pages/ReturnRefundPolicy';
import { CookiePolicy } from './pages/CookiePolicy';
import { TermsAndConditions } from './pages/TermsAndConditions';

import { useCart } from './context/CartContext';
import { SEOHead } from './components/common/SEOHead';

// Simple placeholder page component for future route stubs
const PlaceholderPage = ({ title }) => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center font-serif">
    <SEOHead
      title={`${title} | House of Urvaah`}
      description={`House of Urvaah ${title} page.`}
      noindex={true}
    />
    <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 font-serif mb-2">
      HOUSE OF URVAAH
    </span>
    <h1 className="text-2xl font-serif tracking-[0.2em] uppercase mb-4 text-brand-dark">
      {title}
    </h1>
    <p className="text-xs text-neutral-500 tracking-wider uppercase mb-6 max-w-md">
      This page is scheduled for release in Phase 2. Explore our Autumn / Winter 2026 Women's Collection.
    </p>
    <a
      href="/"
      className="inline-block bg-brand-dark text-white text-xs font-semibold tracking-widest px-6 py-3 uppercase hover:bg-neutral-800 transition-colors"
    >
      RETURN TO HOMEPAGE
    </a>
  </div>
);

const GlobalLoginWall = ({ children }) => {
  const { user, session, openAuthModal } = useCart();

  React.useEffect(() => {
    // If user is logged in, do not attach global click listener
    const hasToken = localStorage.getItem('urvaah_token') || localStorage.getItem('sb-access-token');
    if (user || session || hasToken) return;

    const ALLOWED_POLICY_PATHS = [
      '/about',
      '/about-us',
      '/contact',
      '/contact-us',
      '/privacy-policy',
      '/shipping-policy',
      '/cookie-policy',
      '/cookie-setting',
      '/cookie-settings',
      '/terms-and-conditions',
      '/terms-of-purchase',
      '/terms',
      '/return-refund-policy',
      '/returns',
      '/returns-exchanges'
    ];

    const handleGlobalClick = (e) => {
      const activeToken = localStorage.getItem('urvaah_token') || localStorage.getItem('sb-access-token');
      if (user || session || activeToken) return;

      // 1. Allow all clicks inside AuthModal or marked with data-allow-guest="true"
      if (
        e.target.closest('[data-auth-modal="true"]') ||
        e.target.closest('[data-allow-guest="true"]')
      ) {
        return;
      }

      // 2. Allow direct navigation to legal & policy pages
      const closestLink = e.target.closest('a');
      if (closestLink) {
        const href = closestLink.getAttribute('href') || '';
        if (ALLOWED_POLICY_PATHS.some((path) => href.endsWith(path))) {
          return;
        }
      }

      // 3. Intercept any other click on interactive elements (links, buttons, inputs, cards)
      const isInteractive = e.target.closest(
        'a, button, input, select, textarea, [role="button"], [onclick], [data-interactive="true"], .cursor-pointer'
      );

      if (isInteractive) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        openAuthModal('login');
      }
    };

    window.addEventListener('click', handleGlobalClick, true);
    return () => {
      window.removeEventListener('click', handleGlobalClick, true);
    };
  }, [user, session, openAuthModal]);

  return children;
};

import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminRouteGuard } from './components/admin/AdminRouteGuard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminPlaceholderPage } from './pages/admin/AdminPlaceholderPage';
import { AdminProducts } from './pages/admin/AdminProducts';

export function StorefrontLayout() {
  return (
    <GlobalLoginWall>
      <div className="min-h-screen flex flex-col bg-white text-brand-dark antialiased font-serif selection:bg-brand-dark selection:text-white relative w-full max-w-full overflow-x-hidden">
        {/* 4.2 Header / Nav */}
        <Header />

        {/* Dynamic Route View */}
        <div className="flex-1 w-full max-w-full overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/shipping-policy" element={<ShippingPolicy />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
            <Route path="/cookie-setting" element={<CookiePolicy />} />
            <Route path="/cookie-settings" element={<CookiePolicy />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/terms-of-purchase" element={<TermsAndConditions />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/return-refund-policy" element={<ReturnRefundPolicy />} />
            <Route path="/returns" element={<ReturnRefundPolicy />} />
            <Route path="/returns-exchanges" element={<ReturnRefundPolicy />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/new-in" element={<Home />} />
            <Route path="/clothing" element={<Home />} />
            <Route path="/dresses" element={<Home />} />
            <Route path="/tops" element={<Home />} />
            <Route path="/knitwear" element={<Home />} />
            <Route path="/outerwear" element={<Home />} />
            <Route path="/trousers" element={<Home />} />
            <Route path="/shoes" element={<Home />} />
            <Route path="/accessories" element={<Home />} />
            <Route path="/sale" element={<Home />} />
            <Route path="/cart" element={<PlaceholderPage title="SHOPPING BAG" />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/account" element={<Account />} />
            <Route path="/account-details" element={<Account />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/login" element={<Home />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </div>

        {/* 4.10 Footer */}
        <Footer />

        {/* Global Overlays, Floating Chat & Modals */}
        <FloatingChat />
        <CartDrawer />
        <SearchOverlay />
        <MobileMenu />
        <QuickViewModal />
        <ProductDetailModal />
        <AuthModal />
      </div>
    </GlobalLoginWall>
  );
}

export function AppContent() {
  React.useEffect(() => {
    // Explicitly override browser scroll restoration to prevent restoring scroll position on refresh
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Force page scroll to top on initial mount / page refresh
    window.scrollTo(0, 0);
  }, []);

  return (
    <Routes>
      {/* Admin Portal Authentication Route */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Admin Portal Guarded Layout & Routes */}
      <Route
        path="/admin"
        element={
          <AdminRouteGuard>
            <AdminLayout />
          </AdminRouteGuard>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/new" element={<AdminPlaceholderPage />} />
        <Route path="products/:id/edit" element={<AdminPlaceholderPage />} />
        <Route path="categories" element={<AdminPlaceholderPage />} />
        <Route path="orders" element={<AdminPlaceholderPage />} />
        <Route path="coupons" element={<AdminPlaceholderPage />} />
        <Route path="customers" element={<AdminPlaceholderPage />} />
        <Route path="refunds" element={<AdminPlaceholderPage />} />
        <Route path="reviews" element={<AdminPlaceholderPage />} />
        <Route path="analytics" element={<AdminPlaceholderPage />} />
        <Route path="settings" element={<AdminPlaceholderPage />} />
        <Route path="*" element={<AdminDashboard />} />
      </Route>

      {/* Customer Storefront Routes */}
      <Route path="/*" element={<StorefrontLayout />} />
    </Routes>
  );
}

export function App() {
  return (
    <CartProvider>
      <AppContent />
    </CartProvider>
  );
}

export default App;
