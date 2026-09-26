import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Package,
  FolderTree,
  ShoppingCart,
  CheckCircle2,
  Clock,
  RotateCw,
  XCircle,
  Users,
  Ticket,
  Star,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { getStoredUser, apiClient } from '../../lib/apiClient';

// Module-level in-memory cache for Stale-While-Revalidate behavior
let dashboardCache = null;

// Safe number formatting helper with locale-appropriate thousand separators
function formatStatNumber(val) {
  const num = Number(val);
  if (isNaN(num) || num === null || num === undefined) {
    return '0';
  }
  return num.toLocaleString('en-IN');
}

export const AdminDashboard = () => {
  const location = useLocation();
  const currentUser = getStoredUser();

  const isRestrictedAlert =
    location.search.includes('error=restricted') ||
    location.state?.error === 'Access restricted';

  // Initialize state from cache if available (instant render without jumping)
  const [data, setData] = useState(() => dashboardCache || null);
  const [loading, setLoading] = useState(() => !dashboardCache);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [error, setError] = useState(null);

  // Fetch real counts from backend API
  const fetchDashboardData = useCallback(async (isBackground = false) => {
    if (isBackground) {
      setIsRevalidating(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      let summary = null;

      // 1. Try unified dashboard summary endpoint first
      try {
        const res = await apiClient('/api/admin/dashboard-summary');
        if (res && res.success && res.data) {
          summary = res.data;
        }
      } catch (summaryErr) {
        // Fallback to legacy dashboard-stats if summary endpoint is unavailable
        try {
          const statsRes = await apiClient('/api/admin/analytics/dashboard-stats');
          const usersRes = await apiClient('/api/users').catch(() => ({ count: 0 }));

          if (statsRes && statsRes.data) {
            summary = {
              totalProducts: statsRes.data.products,
              totalCategories: statsRes.data.categories,
              totalOrders: statsRes.data.orders,
              deliveredOrders: statsRes.data.delivered,
              pendingOrders: statsRes.data.pending,
              processingOrders: statsRes.data.processing,
              cancelledOrders: statsRes.data.canceled,
              totalCustomers: usersRes?.count || usersRes?.data?.length || 0,
              activeCoupons: 0,
              totalReviews: 0,
            };
          }
        } catch (fallbackErr) {
          throw fallbackErr;
        }
      }

      if (!summary) {
        throw new Error('No dashboard statistics returned from server');
      }

      // Defensively sanitize and coerce every numeric property (no NaN, null, or undefined)
      const sanitized = {
        totalProducts: Number(summary.totalProducts) || 0,
        totalCategories: Number(summary.totalCategories) || 0,
        totalOrders: Number(summary.totalOrders) || 0,
        deliveredOrders: Number(summary.deliveredOrders) || 0,
        pendingOrders: Number(summary.pendingOrders) || 0,
        processingOrders: Number(summary.processingOrders) || 0,
        cancelledOrders: Number(summary.cancelledOrders) || 0,
        totalCustomers: Number(summary.totalCustomers) || 0,
        activeCoupons: Number(summary.activeCoupons) || 0,
        totalReviews: Number(summary.totalReviews) || 0,
      };

      dashboardCache = sanitized;
      setData(sanitized);
    } catch (err) {
      console.error('[AdminDashboard Error]: Failed to fetch dashboard data', err);
      // Only set error state if we have no cached data to display
      if (!dashboardCache) {
        setError(err.message || "Couldn't load dashboard data. Please verify your connection.");
      }
    } finally {
      setLoading(false);
      setIsRevalidating(false);
    }
  }, []);

  useEffect(() => {
    // If cached data is present, fetch in background (Stale-While-Revalidate); otherwise show loading skeleton
    const hasCache = Boolean(dashboardCache);
    fetchDashboardData(hasCache);
  }, [fetchDashboardData]);

  // Stat cards configuration adapted strictly to House of Urvaah's fashion data model
  const statCards = [
    // Row 1: Core Catalog & Total Orders
    {
      id: 'products',
      label: 'Total Products',
      value: data?.totalProducts,
      link: '/admin/products',
      icon: Package,
      badgeColor: 'bg-stone-100 text-stone-800 border-stone-200',
    },
    {
      id: 'categories',
      label: 'Total Categories',
      value: data?.totalCategories,
      link: '/admin/categories',
      icon: FolderTree,
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      id: 'orders',
      label: 'Total Orders',
      value: data?.totalOrders,
      link: '/admin/orders',
      icon: ShoppingCart,
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    {
      id: 'delivered',
      label: 'Delivered',
      value: data?.deliveredOrders,
      link: '/admin/orders?status=delivered',
      icon: CheckCircle2,
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    // Row 2: Status Breakdown & Customers
    {
      id: 'pending',
      label: 'Pending Orders',
      value: data?.pendingOrders,
      link: '/admin/orders?status=pending',
      icon: Clock,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      id: 'processing',
      label: 'Processing',
      value: data?.processingOrders,
      link: '/admin/orders?status=processing',
      icon: RotateCw,
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      id: 'cancelled',
      label: 'Cancelled',
      value: data?.cancelledOrders,
      link: '/admin/orders?status=cancelled',
      icon: XCircle,
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      id: 'customers',
      label: 'Total Customers',
      value: data?.totalCustomers,
      link: '/admin/customers',
      icon: Users,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    // Row 3: Optional backend-supported marketing metrics
    {
      id: 'coupons',
      label: 'Active Coupons',
      value: data?.activeCoupons,
      link: '/admin/coupons',
      icon: Ticket,
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    },
    {
      id: 'reviews',
      label: 'Total Reviews',
      value: data?.totalReviews,
      link: '/admin/reviews',
      icon: Star,
      badgeColor: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    },
  ];

  // Quick action items for House of Urvaah operations
  const quickActions = [
    {
      title: 'Manage Products',
      description: 'Add new products or update existing catalog inventory',
      link: '/admin/products',
      icon: Package,
    },
    {
      title: 'Manage Categories',
      description: 'Keep your collections organized and easy to discover.',
      link: '/admin/categories',
      icon: FolderTree,
    },
    {
      title: 'Manage Orders',
      description: 'View and manage customer orders and shipment tracking',
      link: '/admin/orders',
      icon: ShoppingCart,
    },
    {
      title: 'Manage Coupons',
      description: 'Create and manage promotional discount incentives',
      link: '/admin/coupons',
      icon: Ticket,
    },
    {
      title: 'Manage Customers',
      description: 'Review client account records and shopping profiles',
      link: '/admin/customers',
      icon: Users,
    },
  ];

  const adminName = currentUser?.name || currentUser?.username || 'Administrator';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Role-based restriction alert banner (if navigated from unauthorized sub-route) */}
      {isRestrictedAlert && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="font-sans">
            <h4 className="font-semibold text-xs uppercase tracking-wider font-serif">
              Access Restricted
            </h4>
            <p className="text-xs text-amber-800 mt-0.5">
              You do not have permission to access that specific administrative module. You have been redirected to the dashboard.
            </p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-brand-dark tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-sans mt-1">
            Welcome to House of Urvaah. Manage your products, collections, and store content effortlessly.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {isRevalidating && (
            <span className="inline-flex items-center gap-1 text-[11px] font-sans text-neutral-400 mr-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span className="hidden sm:inline">Syncing...</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => fetchDashboardData(false)}
            disabled={loading || isRevalidating}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-neutral-200 text-neutral-700 rounded-lg text-xs font-medium font-sans hover:bg-neutral-50 hover:border-neutral-300 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRevalidating ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STAT CARDS SECTION                                                        */}
      {/* ========================================================================= */}
      <section aria-label="Dashboard Overview Statistics">
        {/* Error State: Clear inline error banner with Retry action */}
        {error && !loading && (
          <div className="bg-red-50/90 border border-red-200 rounded-2xl p-6 sm:p-8 text-center max-w-lg mx-auto shadow-sm">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-base text-red-900 uppercase tracking-wide mb-1">
              Couldn't load dashboard data
            </h3>
            <p className="text-xs text-red-700 font-sans mb-5 max-w-xs mx-auto">
              {error}
            </p>
            <button
              type="button"
              onClick={() => fetchDashboardData(false)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-dark text-white rounded-lg text-xs font-medium font-sans uppercase tracking-wider hover:bg-neutral-800 transition-colors cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Request</span>
            </button>
          </div>
        )}

        {/* Loading State: Compact Skeleton cards matching the 6-col grid layout */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs animate-pulse flex flex-col justify-between h-28"
              >
                <div className="flex items-center justify-between">
                  <div className="h-2.5 w-16 bg-neutral-200 rounded" />
                  <div className="w-7.5 h-7.5 rounded-lg bg-neutral-200" />
                </div>
                <div className="h-6 w-10 bg-neutral-200 rounded my-1" />
                <div className="h-2.5 w-20 bg-neutral-100 rounded pt-1" />
              </div>
            ))}
          </div>
        )}

        {/* Loaded State: Compact, high-density stat cards matching reference 6-col desktop layout */}
        {!loading && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  className="bg-white border border-neutral-200/90 rounded-xl p-3.5 sm:p-4 shadow-2xs hover:border-neutral-300 hover:shadow-xs transition-all flex flex-col justify-between group"
                >
                  {/* Top row: Label & Soft-tinted Icon Badge */}
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-neutral-500 font-semibold font-sans truncate">
                      {card.label}
                    </span>
                    <div
                      className={`w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center shrink-0 ${card.badgeColor}`}
                    >
                      <Icon className="w-3.5 h-3.5 stroke-[1.8]" />
                    </div>
                  </div>

                  {/* Stat Number (defensively formatted, never undefined or NaN) */}
                  <div className="my-0.5">
                    <span className="text-xl sm:text-2xl font-serif font-bold text-brand-dark tracking-tight">
                      {formatStatNumber(card.value)}
                    </span>
                  </div>

                  {/* Navigation Link */}
                  <div className="pt-2 border-t border-neutral-100/90 mt-1.5">
                    <Link
                      to={card.link}
                      className="text-[10.5px] font-medium text-neutral-500 hover:text-brand-dark transition-colors inline-flex items-center gap-1 group/link font-sans"
                    >
                      <span>Click to manage</span>
                      <ArrowRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* QUICK ACTIONS SECTION                                                     */}
      {/* ========================================================================= */}
      <section aria-label="Administrative Quick Actions" className="pt-2">
        <div className="mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-serif font-bold text-brand-dark uppercase tracking-wider">
            Quick Actions
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Link
                key={idx}
                to={action.link}
                className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-2xs hover:border-brand-dark/50 hover:bg-brand-sand/40 hover:shadow-xs transition-all group flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center shrink-0 group-hover:bg-brand-dark group-hover:text-white transition-colors shadow-2xs">
                  <Icon className="w-5 h-5 stroke-[1.75]" />
                </div>
                <div className="flex-1 min-w-0 font-sans">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs sm:text-[13px] font-bold text-brand-dark font-serif uppercase tracking-wider group-hover:text-brand-dark transition-colors truncate">
                      {action.title}
                    </h3>
                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-brand-dark group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
                    {action.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
