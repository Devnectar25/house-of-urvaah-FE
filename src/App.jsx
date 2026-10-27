import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import { ScrollToTop } from './components/common/ScrollToTop';
import { Home } from './pages/Home';
import { AboutUs } from './pages/AboutUs';
import { ContactUs } from './pages/ContactUs';
import { ProductDetail } from './pages/ProductDetail';
import { Account } from './pages/Account';
import { Wishlist } from './pages/Wishlist';
import { Checkout } from './pages/Checkout';
import { AuthCallback } from './components/auth/AuthCallback';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { ShippingPolicy } from './pages/ShippingPolicy';
import { ReturnRefundPolicy } from './pages/ReturnRefundPolicy';
import { CookiePolicy } from './pages/CookiePolicy';
import { TermsAndConditions } from './pages/TermsAndConditions';
import { Sitemap } from './pages/Sitemap';
import { CategoryPage } from './pages/CategoryPage';
import { ExploreFabricsBlog } from './pages/ExploreFabricsBlog';
import { TrueToFabricPage } from './pages/TrueToFabricPage';

import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminRouteGuard } from './components/admin/AdminRouteGuard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminShiprocketOrderDesk } from './pages/admin/AdminShiprocketOrderDesk';
import { AdminCancellationFlowDemo } from './pages/admin/AdminCancellationFlowDemo';
import { AdminCoupons } from './pages/admin/AdminCoupons';
import { AdminRefundDesk } from './pages/admin/AdminRefundDesk';
import { AdminShiprocketRefundDesk } from './pages/admin/AdminShiprocketRefundDesk';
import { AdminCustomers } from './pages/admin/AdminCustomers';
import { AdminLeads } from './pages/admin/AdminLeads';
import { AdminReviews } from './pages/admin/AdminReviews';
import { AdminFaqs } from './pages/admin/AdminFaqs';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminSubAdmins } from './pages/admin/AdminSubAdmins';
import { AdminHeroSection } from './pages/admin/modify-ui/AdminHeroSection';
import { AdminDualCampaign } from './pages/admin/modify-ui/AdminDualCampaign';
import { AdminTrendingGram } from './pages/admin/modify-ui/AdminTrendingGram';
import { AdminFabricVideo } from './pages/admin/modify-ui/AdminFabricVideo';
import { AdminBoutiquesConcierge } from './pages/admin/modify-ui/AdminBoutiquesConcierge';
import { AdminStockNotifications } from './pages/admin/AdminStockNotifications';
import { AdminErrorMonitoring } from './pages/admin/AdminErrorMonitoring';
import { AdminEmailNotifications } from './pages/admin/AdminEmailNotifications';
import { StockUnsubscribe } from './pages/StockUnsubscribe';
import { getAdminStoredUser, getStoredUser } from './lib/apiClient';

function PermissionGuard({ moduleKey, children }) {
  const user = getAdminStoredUser() || getStoredUser();
  const isSuperAdmin = !user?.role || user?.role === 'super_admin' || user?.username === 'Admin';
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];

  // Sub-admins only reach modules explicitly granted to them (Sub-Admin Management permissions)
  const hasAccess =
    isSuperAdmin ||
    permissions.includes(moduleKey) ||
    (moduleKey === 'refunds' && permissions.includes('refund-desk'));

  if (hasAccess) {
    return children;
  }

  return <Navigate to="/admin/dashboard?error=restricted" replace />;
}



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

export function StorefrontLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-brand-dark antialiased font-serif selection:bg-brand-dark selection:text-white relative w-full max-w-full">
      <ScrollToTop />
      {/* 4.2 Header / Nav */}
      <Header />

      {/* Dynamic Route View */}
      <div className="flex-1 w-full max-w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/true-to-fabric" element={<TrueToFabricPage />} />
          <Route path="/true-to-fabric/:fabricSlug" element={<TrueToFabricPage />} />
          <Route path="/explore-fabrics" element={<ExploreFabricsBlog />} />
          <Route path="/blog/explore-fabrics" element={<ExploreFabricsBlog />} />
          <Route path="/fabric-guide" element={<ExploreFabricsBlog />} />
          <Route path="/fabrics" element={<ExploreFabricsBlog />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/sitemap" element={<Sitemap />} />
          <Route path="/sidemap" element={<Sitemap />} />
          <Route path="/faqs" element={<ContactUs />} />
          <Route path="/faq" element={<ContactUs />} />
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
          <Route path="/stock-notifications/unsubscribe" element={<StockUnsubscribe />} />
          <Route path="/product/:id/:slug" element={<ProductDetail />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/category" element={<CategoryPage defaultCategory="all" />} />
          <Route path="/collection/:slug" element={<CategoryPage />} />
          <Route path="/collections" element={<CategoryPage defaultCategory="all" />} />
          <Route path="/new-arrivals" element={<CategoryPage defaultCategory="new-arrivals" />} />
          <Route path="/co-ord-sets" element={<CategoryPage defaultCategory="co-ord-sets" />} />
          <Route path="/festive-wear" element={<CategoryPage defaultCategory="festive-wear" />} />
          <Route path="/kurtis-and-dresses" element={<CategoryPage defaultCategory="kurtis-and-dresses" />} />
          <Route path="/corset-tops" element={<CategoryPage defaultCategory="corset-tops" />} />
          <Route path="/new-in" element={<Home />} />
          <Route path="/clothing" element={<CategoryPage defaultCategory="clothing" />} />
          <Route path="/dresses" element={<CategoryPage defaultCategory="party-wear" />} />
          <Route path="/tops" element={<CategoryPage defaultCategory="corset" />} />
          <Route path="/knitwear" element={<Home />} />
          <Route path="/outerwear" element={<CategoryPage defaultCategory="party-wear" />} />
          <Route path="/trousers" element={<Home />} />
          <Route path="/shoes" element={<Home />} />
          <Route path="/accessories" element={<Home />} />
          <Route path="/sale" element={<Home />} />
          <Route path="/cart" element={<PlaceholderPage title="SHOPPING BAG" />} />
          <Route path="/checkout" element={<Checkout />} />
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
  );
}

export function AppContent() {
  React.useEffect(() => {
    // Explicitly override browser scroll restoration to prevent restoring scroll position on refresh
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Global listener: Prevents background scrolling whenever SweetAlert2 or any modal is active
    const handleWheelOrTouch = (e) => {
      const isSwalShown = document.body.classList.contains('swal2-shown') || document.documentElement.classList.contains('swal2-shown');
      const isModalOpen = document.body.getAttribute('data-modal-open') === 'true';

      if (!isSwalShown && !isModalOpen) return;

      if (isSwalShown) {
        const swalContainer = document.querySelector('.swal2-container');
        if (swalContainer) {
          const popup = swalContainer.querySelector('.swal2-popup');
          // If event is on backdrop or popup doesn't have scrollable height, stop background scroll
          if (!popup || !popup.contains(e.target) || popup.scrollHeight <= popup.clientHeight) {
            e.preventDefault();
            return;
          }
          // If target is inside popup, prevent scroll bleed at top or bottom boundary
          if (e.deltaY) {
            const isScrollingDown = e.deltaY > 0;
            const isScrollingUp = e.deltaY < 0;
            const atTop = popup.scrollTop <= 0;
            const atBottom = Math.ceil(popup.scrollTop + popup.clientHeight) >= popup.scrollHeight;
            if ((isScrollingDown && atBottom) || (isScrollingUp && atTop)) {
              e.preventDefault();
            }
          }
        }
      }
    };

    window.addEventListener('wheel', handleWheelOrTouch, { passive: false });
    window.addEventListener('touchmove', handleWheelOrTouch, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheelOrTouch);
      window.removeEventListener('touchmove', handleWheelOrTouch);
    };
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
        <Route path="products" element={<PermissionGuard moduleKey="products"><AdminProducts /></PermissionGuard>} />
        <Route path="products/new" element={<PermissionGuard moduleKey="products"><AdminProducts /></PermissionGuard>} />
        <Route path="products/:id/edit" element={<PermissionGuard moduleKey="products"><AdminProducts /></PermissionGuard>} />

        <Route path="categories" element={<PermissionGuard moduleKey="categories"><AdminCategories /></PermissionGuard>} />
        <Route path="orders" element={<PermissionGuard moduleKey="orders"><AdminOrders /></PermissionGuard>} />
        <Route path="shiprocket-order-desk" element={<Navigate to="/admin/orders?view=shiprocket" replace />} />
        <Route path="cancellation-flow" element={<PermissionGuard moduleKey="orders"><AdminCancellationFlowDemo /></PermissionGuard>} />
        {/* <Route path="coupons" element={<PermissionGuard moduleKey="coupons"><AdminCoupons /></PermissionGuard>} /> */}
        <Route path="customers" element={<PermissionGuard moduleKey="customers"><AdminCustomers /></PermissionGuard>} />
        <Route path="leads" element={<PermissionGuard moduleKey="leads"><AdminLeads /></PermissionGuard>} />
        <Route path="refunds" element={<PermissionGuard moduleKey="refunds"><AdminRefundDesk /></PermissionGuard>} />
        <Route path="refund-desk" element={<PermissionGuard moduleKey="refunds"><AdminRefundDesk /></PermissionGuard>} />
        <Route path="shiprocket-refund-desk" element={<Navigate to="/admin/refunds?view=shiprocket" replace />} />
        <Route path="email-notifications" element={<PermissionGuard moduleKey="email-notifications"><AdminEmailNotifications /></PermissionGuard>} />
        <Route path="stock-notifications" element={<PermissionGuard moduleKey="stock-notifications"><AdminStockNotifications /></PermissionGuard>} />
        <Route path="reviews" element={<PermissionGuard moduleKey="reviews"><AdminReviews /></PermissionGuard>} />
        <Route path="faqs" element={<PermissionGuard moduleKey="faqs"><AdminFaqs /></PermissionGuard>} />
        <Route path="error-monitoring" element={<PermissionGuard moduleKey="error-monitoring"><AdminErrorMonitoring /></PermissionGuard>} />
        <Route path="analytics" element={<PermissionGuard moduleKey="analytics"><AdminAnalytics /></PermissionGuard>} />
        <Route path="settings" element={<PermissionGuard moduleKey="settings"><AdminSettings /></PermissionGuard>} />
        <Route path="subadmins" element={<PermissionGuard moduleKey="subadmins"><AdminSubAdmins /></PermissionGuard>} />

        {/* Edit Home page Admin Routes */}
        <Route path="modify-ui" element={<PermissionGuard moduleKey="modify-ui"><AdminHeroSection /></PermissionGuard>} />
        <Route path="modify-ui/hero" element={<PermissionGuard moduleKey="modify-ui"><AdminHeroSection /></PermissionGuard>} />
        <Route path="modify-ui/dual-campaign" element={<PermissionGuard moduleKey="modify-ui"><AdminDualCampaign /></PermissionGuard>} />
        <Route path="modify-ui/trending-gram" element={<PermissionGuard moduleKey="modify-ui"><AdminTrendingGram /></PermissionGuard>} />
        <Route path="modify-ui/fabric-video" element={<PermissionGuard moduleKey="modify-ui"><AdminFabricVideo /></PermissionGuard>} />
        <Route path="modify-ui/boutiques-concierge" element={<PermissionGuard moduleKey="modify-ui"><AdminBoutiquesConcierge /></PermissionGuard>} />

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
