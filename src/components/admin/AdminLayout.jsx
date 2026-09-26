import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Ticket,
  Users,
  RotateCcw,
  Star,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { getStoredUser, clearAuthSession } from '../../lib/apiClient';
import { useCart } from '../../context/CartContext';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, exact: true },
  { name: 'Products', path: '/admin/products', icon: Package },
  { name: 'Categories', path: '/admin/categories', icon: FolderTree },
  { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
  { name: 'Coupons', path: '/admin/coupons', icon: Ticket },
  { name: 'Customers', path: '/admin/customers', icon: Users },
  { name: 'Refunds', path: '/admin/refunds', icon: RotateCcw },
  { name: 'Reviews', path: '/admin/reviews', icon: Star },
  { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
];

function formatRoleName(role) {
  if (!role) return 'Super Admin';
  const lower = String(role).toLowerCase();
  if (lower === 'super_admin' || lower === 'admin' || lower === 'administrator') return 'Super Admin';
  if (lower === 'sub_admin' || lower === 'subadmin') return 'Sub-Admin';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logoutUser } = useCart();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Keep user profile in sync
  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  // Prevent background scrolling when mobile sidebar is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Current page title derived from active route
  const currentNavItem = NAV_ITEMS.find((item) =>
    item.exact
      ? location.pathname === item.path || location.pathname === '/admin'
      : location.pathname.startsWith(item.path)
  );
  const pageTitle = currentNavItem ? currentNavItem.name : 'Dashboard';

  // Confirmed logout handler
  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    clearAuthSession();
    if (typeof logoutUser === 'function') {
      logoutUser();
    }
    navigate('/admin/login', { replace: true });
  };

  const rawName = currentUser?.name || currentUser?.username;
  const adminName = (!rawName || rawName === 'Atelier Member') ? 'Admin' : rawName;
  const adminRoleDisplay = formatRoleName(currentUser?.role);

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col antialiased selection:bg-brand-dark selection:text-white font-serif text-brand-dark">
      {/* ========================================================================= */}
      {/* TOP HEADER: Full-width Homved layout with House of Urvaah theme & tokens  */}
      {/* ========================================================================= */}
      <header className="h-16 bg-white border-b border-neutral-200 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Mobile hamburger + Urvaah Brand Block + Section context */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-1.5 -ml-1 text-neutral-600 hover:text-brand-dark hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Brand Lockup: Logo Mark + Admin Panel in brand Playfair Serif */}
          <Link
            to="/admin/dashboard"
            className="flex items-center gap-2.5 sm:gap-3 select-none group"
            title="House of Urvaah Admin Dashboard"
          >
            <Logo className="h-9 sm:h-10" />
            <span className="font-serif font-bold text-base sm:text-lg text-brand-dark group-hover:text-brand-accent transition-colors tracking-wide">
              Admin Panel
            </span>
          </Link>
        </div>

        {/* Right: Admin details + [-> Logout] button */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* Customer storefront preview link */}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-sans font-medium text-neutral-500 hover:text-brand-accent transition-colors group"
            title="Open customer storefront in a new tab"
          >
            <span>View Store</span>
            <ExternalLink className="w-3 h-3 text-neutral-400 group-hover:text-brand-accent transition-colors" />
          </a>

          {/* Admin User & Role Stack */}
          <div className="text-right flex flex-col justify-center">
            <div className="text-[15px] font-semibold text-[#0F172A] leading-snug font-sans tracking-tight">
              {adminName}
            </div>
            <div className="text-xs font-normal text-[#64748B] font-sans leading-tight mt-0.5">
              {adminRoleDisplay}
            </div>
          </div>

          {/* Logout Button (Exact replica of reference image: soft tint pill, slate border, dark navy text & icon) */}
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="inline-flex items-center gap-3 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[14px] hover:bg-[#F1F5F9] hover:border-[#CBD5E1] transition-all cursor-pointer group"
            title="Sign out of Admin Panel"
          >
            <LogOut className="w-4 h-4 text-[#0F172A] stroke-[2] group-hover:text-black transition-colors" />
            <span className="font-sans text-sm font-semibold text-[#0F172A] group-hover:text-black tracking-tight">
              Logout
            </span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN CONTAINER: SIDEBAR + CONTENT AREA                                    */}
      {/* ========================================================================= */}
      <div className="flex flex-1 relative min-h-[calc(100vh-4rem)]">
        {/* Mobile Sidebar Overlay Backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* SIDEBAR */}
        <aside
          className={`
            fixed top-16 bottom-0 left-0 z-50 w-64 bg-white border-r border-neutral-200
            flex flex-col transition-transform duration-300 ease-in-out
            lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:z-20 lg:translate-x-0
            ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          {/* Mobile Drawer Header with Close button */}
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between lg:hidden">
            <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold font-sans">
              Navigation
            </span>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 text-neutral-400 hover:text-brand-dark rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
              aria-label="Close navigation menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links List */}
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <nav className="space-y-1" aria-label="Admin Navigation">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? location.pathname === item.path || location.pathname === '/admin'
                  : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`
                      group flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer
                      ${
                        isActive
                          ? 'bg-brand-sand text-brand-dark font-semibold border-l-4 border-brand-dark shadow-xs'
                          : 'text-neutral-600 hover:text-brand-dark hover:bg-brand-sand/60 border-l-4 border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive
                            ? 'text-brand-dark stroke-[2.25]'
                            : 'text-neutral-400 group-hover:text-brand-dark stroke-[1.75]'
                        }`}
                      />
                      <span className="font-sans">{item.name}</span>
                    </div>

                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Bottom helper card */}
          <div className="p-3 border-t border-neutral-100 bg-neutral-50/60">
            <div className="px-3 py-2 rounded-lg bg-white border border-neutral-200/80 text-[11px] font-sans text-neutral-500">
              <span className="font-semibold text-neutral-800 block text-[10px] uppercase tracking-wider mb-0.5">
                Portal Status
              </span>
              <span>Online • Authenticated</span>
            </div>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* CONTENT AREA                                                              */}
        {/* ========================================================================= */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* ========================================================================= */}
      {/* LOGOUT CONFIRMATION MODAL                                                 */}
      {/* ========================================================================= */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-dialog-title"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-neutral-200 relative">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-200">
              <LogOut className="w-6 h-6" />
            </div>

            <h3
              id="logout-dialog-title"
              className="text-lg sm:text-xl font-serif font-bold text-brand-dark tracking-tight mb-2 uppercase"
            >
              Confirm Sign Out
            </h3>

            <p className="text-xs sm:text-sm text-neutral-500 font-sans leading-relaxed mb-6">
              Are you sure you want to sign out of the House of Urvaah Admin Panel? You will need to sign in again to access administrative tools and settings.
            </p>

            <div className="flex items-center justify-end gap-3 font-sans">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmLogout}
                className="px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-white bg-brand-accent hover:bg-red-800 transition-colors cursor-pointer shadow-xs"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
