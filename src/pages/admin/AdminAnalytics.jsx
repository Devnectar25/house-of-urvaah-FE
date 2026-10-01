import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingBag,
  CreditCard,
  RefreshCw,
  AlertCircle,
  Eye,
  ShoppingCart,
  CheckCircle2,
  Package,
  FolderTree,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

export const AdminAnalytics = () => {
  const [period, setPeriod] = useState('7d'); // today, 7d, 30d

  const [summaryData, setSummaryData] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [topUsers, setTopUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnalyticsData = useCallback(async (isBackground = false) => {
    if (isBackground) {
      setIsRevalidating(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [sumRes, prodRes, catRes, userRes] = await Promise.all([
        apiClient(`/api/admin/analytics/summary?period=${period}`).catch(() => null),
        apiClient(`/api/admin/analytics/top-products?period=${period}&limit=5`).catch(() => null),
        apiClient(`/api/admin/analytics/top-categories?period=${period}&limit=5`).catch(() => null),
        apiClient(`/api/admin/analytics/top-users?period=${period}&limit=5`).catch(() => null)
      ]);

      if (sumRes?.data) setSummaryData(sumRes.data);
      if (prodRes?.data) setTopProducts(prodRes.data);
      if (catRes?.data) setTopCategories(catRes.data);
      if (userRes?.data) setTopUsers(userRes.data);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
      setError(err.message || 'Failed to fetch analytics metrics');
    } finally {
      setLoading(false);
      setIsRevalidating(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalyticsData(false);

    // Auto-refresh real-time analytics every 30 seconds
    const timer = setInterval(() => {
      fetchAnalyticsData(true);
    }, 30000);

    return () => clearInterval(timer);
  }, [fetchAnalyticsData]);

  // Derived KPI metrics
  const totalRevenueVal = summaryData?.totalRevenue?.value || 0;
  const totalRevenueTrend = summaryData?.totalRevenue?.trend;

  const totalOrdersVal = summaryData?.totalOrders?.value || 0;
  const totalOrdersTrend = summaryData?.totalOrders?.trend;

  const activeUsersVal = summaryData?.activeUsers?.value || 0;
  const activeUsersTrend = summaryData?.activeUsers?.trend;

  const convRateVal = summaryData?.conversionRate?.value || 0;
  const convRateTrend = summaryData?.conversionRate?.trend;

  const aovVal = summaryData?.averageOrderValue?.value || 0;
  const aovTrend = summaryData?.averageOrderValue?.trend;

  const funnel = summaryData?.funnel || {
    viewItem: 0,
    addToCart: 0,
    beginCheckout: 0,
    purchase: 0,
    dropOffs: {}
  };

  const renderTrendBadge = (trend) => {
    if (trend === null || trend === undefined) return null;
    const isPos = trend >= 0;
    return (
      <span
        className={`inline-flex items-center text-[10.5px] font-semibold px-2 py-0.5 rounded-md border ${
          isPos
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}
      >
        {isPos ? (
          <ArrowUpRight className="w-3 h-3 mr-0.5" />
        ) : (
          <ArrowDownRight className="w-3 h-3 mr-0.5" />
        )}
        {Math.abs(trend)}%
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-admin font-bold text-brand-dark tracking-tight">
            Realtime Analytics & Insights
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-sans mt-1">
            Store performance metrics, customer conversion funnel, and top revenue drivers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="inline-flex bg-neutral-100 p-1 rounded-lg border border-neutral-200 text-xs font-medium">
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                period === 'today' ? 'bg-white text-brand-dark font-bold shadow-2xs' : 'text-neutral-600 hover:text-brand-dark'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setPeriod('7d')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                period === '7d' ? 'bg-white text-brand-dark font-bold shadow-2xs' : 'text-neutral-600 hover:text-brand-dark'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setPeriod('30d')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                period === '30d' ? 'bg-white text-brand-dark font-bold shadow-2xs' : 'text-neutral-600 hover:text-brand-dark'
              }`}
            >
              30 Days
            </button>
          </div>

          <button
            type="button"
            onClick={() => fetchAnalyticsData(false)}
            disabled={loading || isRevalidating}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-neutral-200 text-neutral-700 rounded-lg text-xs font-medium hover:bg-neutral-50 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRevalidating ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && !loading && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-rose-900 mb-1">Analytics Service Error</h4>
          <p className="text-xs text-rose-700 mb-4">{error}</p>
          <button
            onClick={() => fetchAnalyticsData(false)}
            className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Revenue */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">Total Revenue</span>
            {renderTrendBadge(totalRevenueTrend)}
          </div>
          <div className="my-2">
            <span className="text-2xl font-admin font-bold text-brand-dark">
              ₹{Number(totalRevenueVal).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-[10px] text-neutral-400 font-mono">Confirmed sales</div>
        </div>

        {/* Total Orders */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">Total Orders</span>
            {renderTrendBadge(totalOrdersTrend)}
          </div>
          <div className="my-2">
            <span className="text-2xl font-admin font-bold text-brand-dark">
              {totalOrdersVal}
            </span>
          </div>
          <div className="text-[10px] text-neutral-400 font-mono">Completed orders</div>
        </div>

        {/* Active Visitors */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">Active Visitors</span>
            {renderTrendBadge(activeUsersTrend)}
          </div>
          <div className="my-2">
            <span className="text-2xl font-admin font-bold text-brand-dark">
              {activeUsersVal}
            </span>
          </div>
          <div className="text-[10px] text-neutral-400 font-mono">Unique user sessions</div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">Conversion Rate</span>
            {renderTrendBadge(convRateTrend)}
          </div>
          <div className="my-2">
            <span className="text-2xl font-admin font-bold text-brand-dark">
              {convRateVal}%
            </span>
          </div>
          <div className="text-[10px] text-neutral-400 font-mono">Visitors to buyers</div>
        </div>

        {/* Avg Order Value */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">Avg Order Value</span>
            {renderTrendBadge(aovTrend)}
          </div>
          <div className="my-2">
            <span className="text-2xl font-admin font-bold text-brand-dark">
              ₹{Number(aovVal).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-[10px] text-neutral-400 font-mono">Average basket total</div>
        </div>
      </div>

      {/* Customer Conversion Funnel */}
      <div className="bg-white border border-neutral-200/90 rounded-xl p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-admin font-bold text-brand-dark uppercase tracking-wide">
              E-Commerce Conversion Funnel
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Track customer progression from product discovery to final purchase.
            </p>
          </div>
          <span className="text-xs text-neutral-400 font-mono">Live Realtime Data</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Step 1: Product Views */}
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/70 relative">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold">1. Product Views</span>
              <Eye className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold font-admin text-brand-dark">{funnel.viewItem}</div>
            <div className="text-[11px] text-neutral-400 mt-1">Total product pages viewed</div>
          </div>

          {/* Step 2: Add to Cart */}
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/70 relative">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold">2. Added to Cart</span>
              <ShoppingCart className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-2xl font-bold font-admin text-brand-dark">{funnel.addToCart}</div>
            <div className="text-[11px] text-rose-600 font-semibold mt-1">
              Drop-off: {funnel.dropOffs?.viewToCart || 0}%
            </div>
          </div>

          {/* Step 3: Checkout Initiated */}
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/70 relative">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold">3. Checkout Started</span>
              <CreditCard className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold font-admin text-brand-dark">{funnel.beginCheckout}</div>
            <div className="text-[11px] text-rose-600 font-semibold mt-1">
              Drop-off: {funnel.dropOffs?.cartToCheckout || 0}%
            </div>
          </div>

          {/* Step 4: Purchased */}
          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 relative">
            <div className="flex items-center justify-between text-emerald-800 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold">4. Purchased</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-admin text-emerald-900">{funnel.purchase}</div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-1">
              Success Rate: {convRateVal}%
            </div>
          </div>
        </div>
      </div>

      {/* Top Products & Top Categories Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-3">
            <h3 className="text-sm font-admin font-bold text-brand-dark uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-neutral-500" />
              <span>Top Revenue Products</span>
            </h3>
            <span className="text-[11px] text-neutral-400 font-mono">Top 5</span>
          </div>

          <div className="divide-y divide-neutral-100">
            {topProducts.length === 0 ? (
              <p className="text-xs text-neutral-400 py-6 text-center italic">No product sales data for this period.</p>
            ) : (
              topProducts.map((prod, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-brand-dark">{prod.productName}</div>
                    <div className="text-[11px] text-neutral-400">
                      Category: {prod.categoryName || 'General'} • Sold: {prod.totalOrders} items
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-brand-dark">₹{Number(prod.totalRevenue || 0).toLocaleString('en-IN')}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Performing Categories */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-3">
            <h3 className="text-sm font-admin font-bold text-brand-dark uppercase tracking-wider flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-neutral-500" />
              <span>Top Revenue Collections</span>
            </h3>
            <span className="text-[11px] text-neutral-400 font-mono">Top 5</span>
          </div>

          <div className="divide-y divide-neutral-100">
            {topCategories.length === 0 ? (
              <p className="text-xs text-neutral-400 py-6 text-center italic">No category sales data for this period.</p>
            ) : (
              topCategories.map((cat, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-brand-dark uppercase tracking-wider">{cat.categoryName}</div>
                    <div className="text-[11px] text-neutral-400">Total Volume: {cat.totalOrders} units</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-brand-dark">₹{Number(cat.totalRevenue || 0).toLocaleString('en-IN')}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top Active Customers Table */}
      <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-3">
          <h3 className="text-sm font-admin font-bold text-brand-dark uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-neutral-500" />
            <span>Top Active Customers</span>
          </h3>
          <span className="text-[11px] text-neutral-400 font-mono">Ranked by Lifetime Revenue</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50 text-[11px] font-semibold text-neutral-500 uppercase border-b border-neutral-200">
                <th className="py-2.5 px-3">Customer Name</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Orders</th>
                <th className="py-2.5 px-3">Total Spend</th>
                <th className="py-2.5 px-3 text-right">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {topUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-400 italic">
                    No active user data available.
                  </td>
                </tr>
              ) : (
                topUsers.map((u, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50">
                    <td className="py-3 px-3 font-semibold text-brand-dark">{u.displayName || u.name || u.userId}</td>
                    <td className="py-3 px-3 text-neutral-600">{u.userEmail || u.email || 'N/A'}</td>
                    <td className="py-3 px-3 font-medium text-brand-dark">{u.totalOrders || u.purchases || 0}</td>
                    <td className="py-3 px-3 font-bold text-brand-dark">₹{Number(u.totalRevenue || u.revenue || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 text-right text-neutral-400 font-mono text-[11px]">{u.lastActiveDate || 'Recently'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
