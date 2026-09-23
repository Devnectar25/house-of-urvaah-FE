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
import { AuthCallback } from './components/auth/AuthCallback';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { ShippingPolicy } from './pages/ShippingPolicy';
import { ReturnRefundPolicy } from './pages/ReturnRefundPolicy';
import { CookiePolicy } from './pages/CookiePolicy';
import { TermsAndConditions } from './pages/TermsAndConditions';

// Simple placeholder page component for future route stubs
const PlaceholderPage = ({ title }) => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center font-serif">
    <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 font-serif mb-2">
      HOUSE OF URAAH
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

export function App() {
  React.useEffect(() => {
    // Explicitly override browser scroll restoration to prevent restoring scroll position on refresh
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Force page scroll to top on initial mount / page refresh
    window.scrollTo(0, 0);
  }, []);

  return (
    <CartProvider>
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
            <Route path="/wishlist" element={<PlaceholderPage title="WISHLIST" />} />
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
    </CartProvider>
  );
}

export default App;
