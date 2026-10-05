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
  ChevronRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { getStoredUser, setStoredUser, clearAuthSession, apiClient } from '../../lib/apiClient';

import { useCart } from '../../context/CartContext';


const ALL_NAV_ITEMS = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, exact: true, key: 'dashboard' },
  { name: 'Analytics', path: '/admin/analytics', icon: BarChart3, key: 'analytics' },
  { name: 'Products', path: '/admin/products', icon: Package, key: 'products' },
  { name: 'Categories', path: '/admin/categories', icon: FolderTree, key: 'categories' },
  { name: 'Orders', path: '/admin/orders', icon: ShoppingCart, key: 'orders' },
  { name: 'Refund Desk', path: '/admin/refunds', icon: RotateCcw, key: 'refunds' },
  { name: 'Coupons', path: '/admin/coupons', icon: Ticket, key: 'coupons' },
  { name: 'Customers', path: '/admin/customers', icon: Users, key: 'customers' },
  { name: 'Reviews', path: '/admin/reviews', icon: Star, key: 'reviews' },
  { name: 'Settings', path: '/admin/settings', icon: Settings, key: 'settings' },
  { name: 'Sub-Admins', path: '/admin/subadmins', icon: UserCheck, key: 'subadmins', superAdminOnly: true },
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

  // Keep user profile in sync and re-fetch fresh permissions from backend on mount/navigation
  useEffect(() => {
    let isMounted = true;
    const user = getStoredUser();
    if (user) {
      setCurrentUser(user);
    }
    apiClient('/api/auth/me')
      .then((res) => {
        if (!isMounted) return;
        const freshUser = res?.admin || res?.user;
        if (freshUser) {
          setStoredUser(freshUser);
          setCurrentUser(freshUser);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);



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

  const isSuperAdmin = !currentUser?.role || currentUser?.role === 'super_admin' || currentUser?.username === 'Admin';
  const userPermissions = Array.isArray(currentUser?.permissions) ? currentUser.permissions : [];

  const navItems = ALL_NAV_ITEMS.filter((item) => {
    if (item.superAdminOnly) {
      return isSuperAdmin;
    }
    if (isSuperAdmin || item.key === 'dashboard') {
      return true;
    }
    return userPermissions.includes(item.key);
  });

  return (
    <div className="h-screen bg-[#FDFDFD] flex flex-col overflow-hidden antialiased selection:bg-brand-dark selection:text-white font-admin text-brand-dark">
      {/* ========================================================================= */}
      {/* TOP HEADER: Crisp high-contrast top bar with House of Urvaah branding     */}
      {/* ========================================================================= */}
      <header className="h-16 sm:h-18 bg-white border-b border-neutral-200/90 shrink-0 z-30 px-4 sm:px-8 flex items-center justify-between shadow-2xs">
        {/* Left: Mobile hamburger + Urvaah Brand Block */}
        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 -ml-1 text-neutral-700 hover:text-brand-dark hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <Link
            to="/admin/dashboard"
            className="flex items-center gap-3.5 select-none group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark"
            title="House of Urvaah Admin Dashboard"
          >
            <Logo className="h-11 sm:h-13 md:h-14 shrink-0" />
            <span className="font-admin font-bold text-lg sm:text-xl text-neutral-950 tracking-tight group-hover:text-neutral-700 transition-colors">
              Admin Panel
            </span>
          </Link>
        </div>

        {/* Right: Store preview, Admin User info & Logout */}
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 transition-all group"
            title="Open customer storefront in a new tab"
          >
            <span>View Store</span>
            <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-950 transition-colors" />
          </a>

          {/* Admin User & Role Stack */}
          <div className="text-right flex flex-col justify-center">
            <div className="text-sm sm:text-base font-bold text-neutral-950 leading-snug font-admin tracking-tight">
              {adminName}
            </div>
            <div className="text-xs font-medium text-neutral-500 font-admin leading-tight mt-0.5">
              {adminRoleDisplay}
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="inline-flex items-center gap-2.5 px-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl hover:bg-neutral-950 hover:border-neutral-950 transition-all duration-200 cursor-pointer group shadow-2xs"
            title="Sign out of Admin Panel"
          >
            <LogOut className="w-4 h-4 text-neutral-900 stroke-[2] group-hover:text-white transition-colors" />
            <span className="font-admin text-xs sm:text-sm font-bold text-neutral-900 group-hover:text-white tracking-tight transition-colors">
              Logout
            </span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN CONTAINER: FIXED SIDEBAR + SMOOTH INDEPENDENT SCROLLING CONTENT       */}
      {/* ========================================================================= */}
      <div className="flex flex-1 overflow-hidden relative min-h-0">
        {/* Mobile Sidebar Overlay Backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* SIDEBAR (Stuck on position, w-72 width, high contrast text) */}
        <aside
          className={`
            fixed top-16 sm:top-18 bottom-0 left-0 z-50 w-72 bg-white border-r border-neutral-200/90
            flex flex-col transition-transform duration-300 ease-in-out shrink-0 select-none
            lg:relative lg:top-0 lg:bottom-auto lg:h-full lg:z-20 lg:translate-x-0
            ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          {/* Mobile Drawer Header with Close button */}
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between lg:hidden">
            <span className="text-xs uppercase tracking-[0.15em] text-neutral-400 font-bold font-admin">
              Navigation
            </span>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 text-neutral-500 hover:text-neutral-950 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links List */}
          <div className="flex-1 overflow-y-auto px-4 py-5 custom-scrollbar">
            <nav className="space-y-1.5" aria-label="Admin Navigation">
              {navItems.map((item) => {

                const Icon = item.icon;
                const isActive = item.exact
                  ? location.pathname === item.path || location.pathname === '/admin'
                  : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`
                      group flex items-center justify-between px-4 py-3.5 rounded-xl text-[14px] font-semibold transition-all duration-200 cursor-pointer select-none
                      ${
                        isActive
                          ? 'bg-[#F4F1EA] text-neutral-950 border-l-[5px] border-neutral-950 shadow-2xs font-bold'
                          : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100/80 border-l-[5px] border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3.5">
                      <Icon
                        className={`w-5 h-5 transition-colors ${
                          isActive
                            ? 'text-neutral-950 stroke-[2.2]'
                            : 'text-neutral-400 group-hover:text-neutral-900 stroke-[1.8]'
                        }`}
                      />
                      <span className="font-admin tracking-tight">{item.name}</span>
                    </div>

                    {isActive && (
                      <ChevronRight className="w-4 h-4 text-neutral-500 shrink-0" />
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Bottom helper card */}
          <div className="p-4 border-t border-neutral-100 bg-neutral-50/70 shrink-0">
            <div className="px-4 py-3 rounded-xl bg-white border border-neutral-200/80 text-xs font-admin text-neutral-600 flex items-center justify-between shadow-2xs">
              <div>
                <span className="font-bold text-neutral-900 block text-[11px] uppercase tracking-wider">
                  Portal Status
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold">Online • Authenticated</span>
              </div>
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            </div>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* SCROLLABLE RIGHT CONTENT AREA                                             */}
        {/* ========================================================================= */}
        <main className="flex-1 overflow-y-auto h-full p-5 sm:p-7 lg:p-9 w-full max-w-7xl mx-auto scroll-smooth">
          <Outlet />
        </main>
      </div>

      {/* ========================================================================= */}
      {/* LOGOUT CONFIRMATION MODAL (Perfect dimensions & high-contrast styling)    */}
      {/* ========================================================================= */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs animate-fadeIn font-admin"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-dialog-title"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-7 shadow-2xl border border-neutral-200 relative animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-200">
              <LogOut className="w-6 h-6 stroke-[2]" />
            </div>

            <h3
              id="logout-dialog-title"
              className="text-xl font-admin font-bold text-neutral-950 tracking-tight mb-2 uppercase"
            >
              Confirm Sign Out
            </h3>

            <p className="text-xs sm:text-sm text-neutral-600 font-sans leading-relaxed mb-6">
              Are you sure you want to sign out of the House of Urvaah Admin Panel? You will need to log in again to access store operations.
            </p>

            <div className="flex items-center justify-end gap-3 font-admin">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="px-4.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-neutral-700 hover:text-neutral-950 bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmLogout}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-neutral-950 hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black transition-colors cursor-pointer shadow-sm"
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
