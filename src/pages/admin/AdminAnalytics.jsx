import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  CreditCard,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  Eye,
  CheckCircle2,
  Package,
  FolderTree,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Award,
  ArrowRight,
  Info,
  Check,
  Filter,
  BarChart3,
  Search,
  Globe,
  Share2,
  MousePointer,
  ExternalLink
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { RegisteredUsersModal } from '../../components/admin/RegisteredUsersModal';
import { ActiveCustomersModal } from '../../components/admin/ActiveCustomersModal';
import { RevenueBreakdownModal } from '../../components/admin/RevenueBreakdownModal';
import { TopCustomersModal } from '../../components/admin/TopCustomersModal';

// Number formatting helpers
function formatNumber(val) {
  const num = Number(val);
  if (isNaN(num) || num === null || num === undefined) return '0';
  return num.toLocaleString('en-IN');
}

function formatCurrency(val) {
  const num = Number(val);
  if (isNaN(num) || num === null || num === undefined) return '0';
  return num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: num % 1 === 0 ? 0 : 2
  });
}

export const AdminAnalytics = () => {
  const [period, setPeriod] = useState('7d'); // 'today' | '7d' | '30d'
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [isActiveUsersModalOpen, setIsActiveUsersModalOpen] = useState(false);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [isTopCustomersModalOpen, setIsTopCustomersModalOpen] = useState(false);

  // Primary data states
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [topUsers, setTopUsers] = useState([]);

  // Table sorting states
  const [productSortBy, setProductSortBy] = useState('revenue'); // 'revenue' | 'orders'
  const [categorySortBy, setCategorySortBy] = useState('revenue'); // 'revenue' | 'orders'

  // Funnel bar hover state
  const [hoveredStage, setHoveredStage] = useState(null);

  // Loading & Error states
  const [loading, setLoading] = useState(true);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all analytics datasets concurrently
  const fetchAnalyticsData = useCallback(async (isBackground = false) => {
    if (isBackground) {
      setIsRevalidating(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [sumRes, prodRes, catRes, usersRes] = await Promise.all([
        apiClient(`/api/admin/analytics/summary?period=${period}`).catch(err => {
          console.error('Summary API Error:', err);
          return null;
        }),
        apiClient(`/api/admin/analytics/top-products?period=${period}&limit=10&sortBy=revenue`).catch(err => {
          console.error('Products API Error:', err);
          return null;
        }),
        apiClient(`/api/admin/analytics/top-categories?period=${period}&limit=10&sortBy=revenue`).catch(err => {
          console.error('Categories API Error:', err);
          return null;
        }),
        apiClient(`/api/admin/analytics/top-users?period=${period}&limit=10`).catch(err => {
          console.error('Top Users API Error:', err);
          return null;
        })
      ]);

      if (sumRes?.data) setSummary(sumRes.data);
      if (prodRes?.data) setProducts(prodRes.data);
      if (catRes?.data) setCategories(catRes.data);
      if (usersRes?.data) setTopUsers(usersRes.data);

      if (!sumRes && !prodRes && !catRes && !usersRes) {
        throw new Error('Could not connect to analytics service. Please verify backend connection.');
      }
    } catch (err) {
      console.error('[AdminAnalytics Error]:', err);
      setError(err.message || 'Failed to fetch analytics metrics.');
    } finally {
      setLoading(false);
      setIsRevalidating(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalyticsData(false);

    // Auto-refresh data every 30 seconds
    const intervalTimer = setInterval(() => {
      fetchAnalyticsData(true);
    }, 30000);

    return () => clearInterval(intervalTimer);
  }, [fetchAnalyticsData]);

  // Client-side sort for Top Products table
  const sortedProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];
    return [...products].sort((a, b) => {
      if (productSortBy === 'revenue') {
        return (Number(b.totalRevenue) || 0) - (Number(a.totalRevenue) || 0);
      }
      return (Number(b.totalOrders) || 0) - (Number(a.totalOrders) || 0);
    });
  }, [products, productSortBy]);

  // Client-side sort for Top Categories table
  const sortedCategories = useMemo(() => {
    if (!categories || !Array.isArray(categories)) return [];
    return [...categories].sort((a, b) => {
      if (categorySortBy === 'revenue') {
        return (Number(b.totalRevenue) || 0) - (Number(a.totalRevenue) || 0);
      }
      return (Number(b.totalOrders) || 0) - (Number(a.totalOrders) || 0);
    });
  }, [categories, categorySortBy]);

  // Total spend by confirmed top customers
  const topUsersTotalSpend = useMemo(() => {
    if (!topUsers || !Array.isArray(topUsers)) return 0;
    return topUsers.reduce((sum, u) => sum + (Number(u.totalRevenue) || 0), 0);
  }, [topUsers]);

  // Trend indicator component (badge style)
  const renderTrendBadge = (trend) => {
    if (trend === null || trend === undefined) return null;
    const isPos = trend >= 0;
    return (
      <span
        className={`inline-flex items-center text-[11px] font-semibold font-admin px-2 py-0.5 rounded-md border ${
          isPos
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}
        title={`Comparison with prior ${period === 'today' ? 'day' : period === '30d' ? '30-day period' : '7-day period'}`}
      >
        {isPos ? (
          <ArrowUpRight className="w-3.5 h-3.5 mr-0.5 stroke-[2.2]" />
        ) : (
          <ArrowDownRight className="w-3.5 h-3.5 mr-0.5 stroke-[2.2]" />
        )}
        {Math.abs(trend)}%
      </span>
    );
  };

  // Inline trend line helper matching Screenshot 2 design
  const renderTrendLine = (trend) => {
    if (trend === null || trend === undefined) return null;
    const isPos = trend >= 0;
    return (
      <div
        className={`flex items-center gap-1 text-xs font-semibold mt-1.5 ${
          isPos ? 'text-emerald-600' : 'text-rose-600'
        }`}
        title={`Comparison with prior ${period === 'today' ? 'day' : period === '30d' ? '30-day period' : '7-day period'}`}
      >
        {isPos ? (
          <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
        ) : (
          <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
        )}
        <span>{isPos ? '▲' : '▼'} {Math.abs(trend)}%</span>
      </div>
    );
  };

  // Safe fallback metrics
  const totalUsersVal = summary?.totalUsers?.value ?? 0;
  const totalUsersTrend = summary?.totalUsers?.trend;

  const activeUsersVal = summary?.activeUsers?.value ?? 0;
  const activeUsersTrend = summary?.activeUsers?.trend;

  const totalRevenueVal = summary?.totalRevenue?.value ?? 0;
  const totalRevenueTrend = summary?.totalRevenue?.trend;

  const aovVal = summary?.averageOrderValue?.value ?? 0;
  const aovTrend = summary?.averageOrderValue?.trend;

  const totalOrdersVal = summary?.totalOrders?.value ?? 0;
  const totalOrdersTrend = summary?.totalOrders?.trend;
  const ordersCod = summary?.totalOrders?.breakdown?.cod ?? 0;
  const ordersOnline = summary?.totalOrders?.breakdown?.online ?? 0;

  const conversionRateVal = summary?.conversionRate?.value ?? 0;
  const conversionRateTrend = summary?.conversionRate?.trend;

  const potentialUsersVal = summary?.potentialUsers?.value ?? 0;

  const funnel = summary?.funnel || {
    viewItem: 0,
    viewItemAvailable: false,
    addToCart: 0,
    addToCartAvailable: false,
    beginCheckout: 0,
    purchase: 0,
    checkoutSuccessRate: 0
  };

  const periodLabel = period === 'today' ? 'Today' : period === '30d' ? '30 Days' : '7 Days';

  return (
    <div className="space-y-7 pb-12 font-admin text-brand-dark animate-fadeIn">
      {/* ========================================================================= */}
      {/* 1. PAGE HEADER & DATE-RANGE SELECTOR                                      */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-admin font-bold text-brand-dark tracking-tight">
            Analytics
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-sans mt-1">
            Customer activity and product performance overview.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Date-Range Toggle Pill */}
          <div className="inline-flex bg-neutral-100 p-1 rounded-xl border border-neutral-200/90 text-xs font-semibold select-none shadow-2xs">
            <button
              type="button"
              onClick={() => setPeriod('today')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === 'today'
                  ? 'bg-white text-neutral-950 font-bold shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-950'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setPeriod('7d')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === '7d'
                  ? 'bg-white text-neutral-950 font-bold shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-950'
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => setPeriod('30d')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === '30d'
                  ? 'bg-white text-neutral-950 font-bold shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-950'
              }`}
            >
              30 Days
            </button>
          </div>

          {/* Sync / Refresh Button */}
          <button
            type="button"
            onClick={() => fetchAnalyticsData(false)}
            disabled={loading || isRevalidating}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-neutral-200 text-neutral-800 rounded-xl text-xs font-semibold hover:bg-neutral-50 hover:border-neutral-300 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRevalidating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Global Error Banner if API Fails */}
      {error && !loading && (
        <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900 font-admin">
                Analytics Service Connection Error
              </h4>
              <p className="text-xs text-rose-700 mt-0.5 font-sans">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchAnalyticsData(false)}
            className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-colors uppercase tracking-wider shadow-xs cursor-pointer shrink-0"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CORE PERFORMANCE KPI CARDS (2-Row Grid matching Screenshot 2)         */}
      {/* ========================================================================= */}
      <section aria-label="Core Performance KPIs">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="col-span-1 bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-2xs animate-pulse h-36 flex flex-col justify-between" />
            <div className="col-span-1 bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-2xs animate-pulse h-36 flex flex-col justify-between" />
            <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-2xs animate-pulse h-36 flex flex-col justify-between" />
            <div className="col-span-1 md:col-span-1 lg:col-span-2 bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-2xs animate-pulse h-36 flex flex-col justify-between" />
            <div className="col-span-1 md:col-span-1 lg:col-span-2 bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-2xs animate-pulse h-36 flex flex-col justify-between" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Row 1, Card 1: Total Users (1 col) */}
            <div
              onClick={() => setIsUsersModalOpen(true)}
              className="col-span-1 bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-2xs hover:border-neutral-300 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-neutral-600 font-sans group-hover:text-neutral-900 transition-colors">
                  Total Users
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Users className="w-4 h-4 stroke-[2]" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-admin font-bold text-neutral-950 tracking-tight">
                  {formatNumber(totalUsersVal)}
                </div>
                {renderTrendLine(totalUsersTrend)}
              </div>
            </div>

            {/* Row 1, Card 2: Active Users (1 col) */}
            <div
              onClick={() => setIsActiveUsersModalOpen(true)}
              className="col-span-1 bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-2xs hover:border-neutral-300 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-neutral-600 font-sans group-hover:text-neutral-900 transition-colors">
                  Active Users
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <UserCheck className="w-4 h-4 stroke-[2]" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-admin font-bold text-neutral-950 tracking-tight">
                  {formatNumber(activeUsersVal)}
                </div>
                {renderTrendLine(activeUsersTrend)}
              </div>
            </div>

            {/* Row 1, Card 3: Total Revenue (2 cols) */}
            <div
              onClick={() => setIsRevenueModalOpen(true)}
              className="col-span-1 md:col-span-2 lg:col-span-2 bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-2xs hover:border-neutral-300 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-neutral-600 font-sans group-hover:text-neutral-900 transition-colors">
                  Total Revenue
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <CreditCard className="w-4 h-4 stroke-[2]" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-admin font-bold text-neutral-950 tracking-tight">
                  ₹{formatCurrency(totalRevenueVal)}
                </div>
                {renderTrendLine(totalRevenueTrend)}
              </div>
            </div>

            {/* Row 2, Card 4: Top Customers (Top 15) (2 cols) */}
            <div
              onClick={() => setIsTopCustomersModalOpen(true)}
              className="col-span-1 md:col-span-1 lg:col-span-2 bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-2xs hover:border-neutral-300 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-neutral-600 font-sans group-hover:text-neutral-900 transition-colors">
                  Top Customers (Top 15)
                </span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Users className="w-4 h-4 stroke-[2]" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-admin font-bold text-neutral-950 tracking-tight">
                  Top {topUsers.length || 15}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-sans mt-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-neutral-400 stroke-[2]" />
                  <span>Users with purchases in selected period</span>
                </div>
              </div>
            </div>

            {/* Row 2, Card 5: Average Order Value (2 cols) */}
            <div
              className="col-span-1 md:col-span-1 lg:col-span-2 bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-2xs hover:border-neutral-300 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-neutral-600 font-sans group-hover:text-neutral-900 transition-colors">
                  Average Order Value
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <ShoppingBag className="w-4 h-4 stroke-[2]" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-admin font-bold text-neutral-950 tracking-tight">
                  ₹{formatCurrency(aovVal)}
                </div>
                {renderTrendLine(aovTrend)}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 4. CONVERSION FUNNEL & RIGHT COLUMN OF STAT CARDS                          */}
      {/* ========================================================================= */}
      <section aria-label="Conversion Journey & Order Breakdown" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLS: Funnel Bar Chart Card (Graph look & feel matching Screenshot 2) */}
        {(() => {
          // Dynamic Y-axis scaling & ticks calculation
          const rawMaxVal = Math.max(
            funnel.viewItem || 0,
            funnel.addToCart || 0,
            funnel.beginCheckout || 0,
            funnel.purchase || 0,
            10
          );

          let maxYValue = 10;
          if (rawMaxVal <= 10) maxYValue = 10;
          else if (rawMaxVal <= 20) maxYValue = 20;
          else if (rawMaxVal <= 50) maxYValue = 50;
          else if (rawMaxVal <= 100) maxYValue = 100;
          else if (rawMaxVal <= 250) maxYValue = 250;
          else if (rawMaxVal <= 500) maxYValue = 500;
          else if (rawMaxVal <= 1000) maxYValue = 1000;
          else {
            const pow = Math.pow(10, Math.floor(Math.log10(rawMaxVal)));
            maxYValue = Math.ceil(rawMaxVal / pow) * pow;
          }

          const yStep = maxYValue / 4;
          const yAxisTicks = [
            maxYValue,
            Math.round(maxYValue - yStep),
            Math.round(maxYValue - yStep * 2),
            Math.round(maxYValue - yStep * 3),
            0
          ];

          // Stage conversion rates
          const viewToCartRate = funnel.viewItemAvailable && funnel.viewItem > 0
            ? `${((funnel.addToCart / funnel.viewItem) * 100).toFixed(1)}%`
            : (funnel.addToCart > 0 ? '100.0%' : '100.0%');

          const cartToCheckoutRate = funnel.addToCartAvailable && funnel.addToCart > 0
            ? `${((funnel.beginCheckout / funnel.addToCart) * 100).toFixed(1)}%`
            : (funnel.beginCheckout > 0 ? '100.0%' : '100.0%');

          const checkoutToPurchaseRate = `${Number(funnel.checkoutSuccessRate || 0).toFixed(1)}%`;

          const funnelStages = [
            {
              id: 'views',
              name: 'Views',
              value: funnel.viewItem,
              available: funnel.viewItemAvailable,
              unit: 'Views'
            },
            {
              id: 'cart',
              name: 'Add to Cart',
              value: funnel.addToCart,
              available: funnel.addToCartAvailable,
              unit: 'Cart Additions'
            },
            {
              id: 'checkout',
              name: 'Checkout',
              value: funnel.beginCheckout,
              available: true,
              unit: 'Checkouts'
            },
            {
              id: 'purchase',
              name: 'Purchase',
              value: funnel.purchase,
              available: true,
              unit: 'Orders'
            }
          ];

          return (
            <div className="lg:col-span-2 bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                {/* Header matching provided reference layout */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4 mb-6">
                  <div>
                    <h2 className="text-lg font-admin font-bold text-neutral-900 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-neutral-900" />
                      <span>Graph</span>
                    </h2>
                    <p className="text-xs text-neutral-500 font-sans mt-0.5">
                      User journey from product view to purchase
                    </p>
                  </div>

                  {!funnel.viewItemAvailable && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide uppercase px-3 py-1 bg-amber-50/90 text-amber-800 border border-amber-300 rounded-full shadow-2xs self-start sm:self-auto">
                      <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>GA4 REQUIRED FOR VIEWS & CART</span>
                    </span>
                  )}
                </div>

                {/* Main Graph Plot Area */}
                <div className="relative my-4">
                  <div className="flex items-stretch h-64 sm:h-72">
                    {/* Left Y-Axis */}
                    <div className="w-12 sm:w-16 flex flex-col justify-between text-right pr-2.5 select-none border-r border-neutral-400 relative py-1">
                      {yAxisTicks.map((tickVal, idx) => (
                        <div key={idx} className="relative flex items-center justify-end h-0">
                          <span className="text-[11px] font-sans font-medium text-neutral-500 -translate-y-1/2 pr-2">
                            {tickVal}
                          </span>
                          {/* Y-axis tick mark */}
                          <div className="absolute right-0 top-0 w-2 h-[1px] bg-neutral-400" />
                        </div>
                      ))}
                    </div>

                    {/* Bars Container */}
                    <div className="flex-1 flex items-end justify-around px-4 sm:px-10 relative border-b border-neutral-400 pb-0">
                      {/* Horizontal Grid Background Lines */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-0 pt-1">
                        {yAxisTicks.slice(0, -1).map((_, idx) => (
                          <div key={idx} className="border-b border-neutral-200 border-dashed w-full h-0" />
                        ))}
                      </div>

                      {/* Stage Bars */}
                      {funnelStages.map((stage) => {
                        const isHovered = hoveredStage === stage.id;
                        const heightPercent = maxYValue > 0 ? (stage.value / maxYValue) * 100 : 0;

                        return (
                          <div
                            key={stage.id}
                            onMouseEnter={() => setHoveredStage(stage.id)}
                            onMouseLeave={() => setHoveredStage(null)}
                            onFocus={() => setHoveredStage(stage.id)}
                            onBlur={() => setHoveredStage(null)}
                            tabIndex={0}
                            className="relative flex-1 max-w-[100px] sm:max-w-[130px] h-full flex flex-col justify-end items-center group cursor-pointer z-10 px-2 outline-none"
                          >
                            {/* Hover Tooltip */}
                            {isHovered && (
                              <div
                                className="absolute z-30 pointer-events-none animate-fadeIn"
                                style={{ bottom: `calc(${Math.max(heightPercent, 5)}% + 12px)` }}
                              >
                                <div className="bg-neutral-900 text-white text-[11px] font-sans font-semibold py-1.5 px-3 rounded-lg shadow-xl border border-neutral-800 whitespace-nowrap text-center">
                                  <div className="font-bold font-admin tracking-tight">
                                    {stage.name}
                                  </div>
                                  <div className="text-[10.5px] text-neutral-300 font-normal">
                                    {stage.available ? (
                                      <span>{formatNumber(stage.value)} {stage.unit}</span>
                                    ) : (
                                      <span className="text-amber-300">Requires GA4 API</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Solid Primary Dark Bar matching Theme Palette */}
                            <div
                              className="w-full bg-neutral-900 hover:bg-neutral-700 transition-all duration-300 rounded-t-md shadow-2xs"
                              style={{
                                height: `${Math.max(heightPercent, stage.value > 0 ? 2 : 0.8)}%`,
                                minHeight: stage.value > 0 ? '4px' : '2px'
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* X-Axis Stage Labels */}
                  <div className="flex items-center justify-around pl-12 sm:pl-16 pt-3 select-none">
                    {funnelStages.map((stage) => (
                      <div key={stage.id} className="flex-1 max-w-[100px] sm:max-w-[130px] text-center">
                        <span className="text-xs sm:text-sm font-sans font-bold text-neutral-800 block truncate">
                          {stage.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Conversion Metrics Row matching Reference Screenshot */}
                <div className="border-t border-neutral-200/80 pt-6 mt-8 grid grid-cols-3 gap-3 sm:gap-6 text-center">
                  {/* VIEW TO CART */}
                  <div>
                    <span className="text-[10.5px] sm:text-[11px] font-bold font-admin uppercase tracking-wider text-neutral-400 block">
                      VIEW TO CART
                    </span>
                    <div className="text-2xl sm:text-3xl font-bold font-admin text-neutral-950 my-1">
                      {viewToCartRate}
                    </div>
                    <span className="text-[11px] sm:text-xs text-neutral-400 font-medium font-sans block">
                      Success Rate
                    </span>
                  </div>

                  {/* CART TO CHECKOUT */}
                  <div>
                    <span className="text-[10.5px] sm:text-[11px] font-bold font-admin uppercase tracking-wider text-neutral-400 block">
                      CART TO CHECKOUT
                    </span>
                    <div className="text-2xl sm:text-3xl font-bold font-admin text-neutral-950 my-1">
                      {cartToCheckoutRate}
                    </div>
                    <span className="text-[11px] sm:text-xs text-neutral-400 font-medium font-sans block">
                      Success Rate
                    </span>
                  </div>

                  {/* CHECKOUT TO PURCHASE */}
                  <div>
                    <span className="text-[10.5px] sm:text-[11px] font-bold font-admin uppercase tracking-wider text-neutral-400 block">
                      CHECKOUT TO PURCHASE
                    </span>
                    <div className="text-2xl sm:text-3xl font-bold font-admin text-neutral-950 my-1">
                      {checkoutToPurchaseRate}
                    </div>
                    <span className="text-[11px] sm:text-xs text-neutral-400 font-medium font-sans block">
                      Success Rate
                    </span>
                  </div>
                </div>
              </div>

              {/* Note matching Reference Screenshot */}
              <p className="text-[11px] text-neutral-400 font-sans mt-5 pt-3 border-t border-neutral-100 leading-relaxed">
                Note: "Checkout" and "Purchase" counts are computed from database order records. Full tracking from page views requires GA4 Data API credentials.
              </p>
            </div>
          );
        })()}

        {/* RIGHT 1 COL: Total Orders, Conversion Rate, Potential Users */}
        <div className="space-y-4">
          {/* Right Card 1: Total Orders */}
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-2xs hover:border-neutral-300 hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] uppercase tracking-[0.14em] text-neutral-500 font-bold font-admin">
                Total Orders
              </span>
              {renderTrendBadge(totalOrdersTrend)}
            </div>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-admin font-bold text-neutral-950 tracking-tight">
                {formatNumber(totalOrdersVal)}
              </span>
            </div>
            <div className="text-[11px] text-neutral-500 font-sans flex items-center gap-1.5 pt-2 border-t border-neutral-100">
              <span className="font-bold text-neutral-900">{ordersOnline}</span> Online Paid
              <span className="text-neutral-300">•</span>
              <span className="font-bold text-neutral-900">{ordersCod}</span> COD Placed
            </div>
          </div>

          {/* Right Card 2: Conversion Rate */}
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-2xs hover:border-neutral-300 hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] uppercase tracking-[0.14em] text-neutral-500 font-bold font-admin">
                Conversion Rate
              </span>
              {renderTrendBadge(conversionRateTrend)}
            </div>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-admin font-bold text-neutral-950 tracking-tight">
                {conversionRateVal}%
              </span>
            </div>
            <div className="text-[11px] text-neutral-500 font-sans pt-2 border-t border-neutral-100">
              Checkout to completed order conversion rate
            </div>
          </div>

          {/* Right Card 3: Potential / Abandoned Users */}
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-2xs hover:border-neutral-300 hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] uppercase tracking-[0.14em] text-neutral-500 font-bold font-admin">
                Potential / Abandoned
              </span>
              <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5 stroke-[2]" />
              </div>
            </div>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-admin font-bold text-neutral-950 tracking-tight">
                {formatNumber(potentialUsersVal)}
              </span>
            </div>
          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 5. BOTTOM SECTION: Top Products & Top Categories Tables                   */}
      {/* ========================================================================= */}
      <section aria-label="Catalog Performance Tables" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table 1: Top Products */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-sm font-admin font-bold text-neutral-950 uppercase tracking-wider">
                    Top Products
                  </h3>
                  <span className="text-[11px] text-neutral-400 font-sans">
                    {sortedProducts.length} {sortedProducts.length === 1 ? 'item' : 'items'} sold in {periodLabel.toLowerCase()}
                  </span>
                </div>
              </div>

              {/* Sort Toggle Pill */}
              <div className="inline-flex bg-neutral-100 p-0.5 rounded-lg border border-neutral-200 text-xs font-semibold select-none self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setProductSortBy('revenue')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    productSortBy === 'revenue'
                      ? 'bg-white text-neutral-950 font-bold shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-950'
                  }`}
                >
                  Revenue
                </button>
                <button
                  type="button"
                  onClick={() => setProductSortBy('orders')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    productSortBy === 'orders'
                      ? 'bg-white text-neutral-950 font-bold shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-950'
                  }`}
                >
                  Orders
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-50 text-[10.5px] font-bold text-neutral-500 uppercase tracking-wider border-y border-neutral-200">
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3 text-center">Orders</th>
                    <th className="py-2.5 px-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="py-3 px-3"><div className="h-3 w-32 bg-neutral-200 rounded" /></td>
                        <td className="py-3 px-3 text-center"><div className="h-3 w-8 bg-neutral-200 rounded mx-auto" /></td>
                        <td className="py-3 px-3 text-right"><div className="h-3 w-16 bg-neutral-200 rounded ml-auto" /></td>
                      </tr>
                    ))
                  ) : sortedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-neutral-400 font-sans text-xs italic">
                        No product sales recorded for this period.
                      </td>
                    </tr>
                  ) : (
                    sortedProducts.map((prod, idx) => (
                      <tr key={idx} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-3 px-3 font-sans">
                          <div className="font-bold text-neutral-900 font-admin truncate max-w-xs">
                            {prod.productName}
                          </div>
                          <div className="text-[10.5px] text-neutral-400 mt-0.5">
                            {prod.categoryName} • Stock: {prod.stock}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-bold font-admin text-neutral-800">
                          {formatNumber(prod.totalOrders)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold font-admin text-neutral-950">
                          ₹{formatCurrency(prod.totalRevenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-neutral-100 text-right">
            <Link
              to="/admin/products"
              className="text-[11.5px] font-semibold text-neutral-600 hover:text-neutral-950 transition-colors inline-flex items-center gap-1.5 font-admin group"
            >
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-950 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </div>

        {/* Table 2: Top Categories */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center shrink-0">
                  <FolderTree className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-sm font-admin font-bold text-neutral-950 uppercase tracking-wider">
                    Top Categories
                  </h3>
                  <span className="text-[11px] text-neutral-400 font-sans">
                    {sortedCategories.length} {sortedCategories.length === 1 ? 'collection' : 'collections'} active in {periodLabel.toLowerCase()}
                  </span>
                </div>
              </div>

              {/* Sort Toggle Pill */}
              <div className="inline-flex bg-neutral-100 p-0.5 rounded-lg border border-neutral-200 text-xs font-semibold select-none self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setCategorySortBy('revenue')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    categorySortBy === 'revenue'
                      ? 'bg-white text-neutral-950 font-bold shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-950'
                  }`}
                >
                  Revenue
                </button>
                <button
                  type="button"
                  onClick={() => setCategorySortBy('orders')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    categorySortBy === 'orders'
                      ? 'bg-white text-neutral-950 font-bold shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-950'
                  }`}
                >
                  Orders
                </button>
              </div>
            </div>

            {/* Categories Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-50 text-[10.5px] font-bold text-neutral-500 uppercase tracking-wider border-y border-neutral-200">
                    <th className="py-2.5 px-3">Category Name</th>
                    <th className="py-2.5 px-3 text-center">Orders</th>
                    <th className="py-2.5 px-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="py-3 px-3"><div className="h-3 w-32 bg-neutral-200 rounded" /></td>
                        <td className="py-3 px-3 text-center"><div className="h-3 w-8 bg-neutral-200 rounded mx-auto" /></td>
                        <td className="py-3 px-3 text-right"><div className="h-3 w-16 bg-neutral-200 rounded ml-auto" /></td>
                      </tr>
                    ))
                  ) : sortedCategories.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-neutral-400 font-sans text-xs italic">
                        No category sales recorded for this period.
                      </td>
                    </tr>
                  ) : (
                    sortedCategories.map((cat, idx) => (
                      <tr key={idx} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-3 px-3 font-sans">
                          <div className="font-bold text-neutral-900 font-admin truncate">
                            {cat.categoryName}
                          </div>
                          <div className="text-[10.5px] text-neutral-400 mt-0.5">
                            Collection Catalog
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-bold font-admin text-neutral-800">
                          {formatNumber(cat.totalOrders)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold font-admin text-neutral-950">
                          ₹{formatCurrency(cat.totalRevenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-neutral-100 text-right">
            <Link
              to="/admin/categories"
              className="text-[11.5px] font-semibold text-neutral-600 hover:text-neutral-950 transition-colors inline-flex items-center gap-1.5 font-admin group"
            >
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-950 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. TOP ACTIVE CUSTOMERS TABLE SECTION                                     */}
      {/* ========================================================================= */}
      <section aria-label="Customer Spend Leaders">
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-sm font-admin font-bold text-neutral-950 uppercase tracking-wider">
                  Top Active Customers
                </h3>
                <span className="text-[11px] text-neutral-400 font-sans">
                  Ranked by confirmed order spend in {periodLabel.toLowerCase()}
                </span>
              </div>
            </div>

            <Link
              to="/admin/customers"
              className="text-[11.5px] font-semibold text-neutral-600 hover:text-neutral-950 transition-colors inline-flex items-center gap-1.5 font-admin group self-start sm:self-auto"
            >
              <span>Manage all customers</span>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-950 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-50 text-[10.5px] font-bold text-neutral-500 uppercase tracking-wider border-y border-neutral-200">
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Contact Email</th>
                  <th className="py-2.5 px-3 text-center">Orders</th>
                  <th className="py-2.5 px-3 text-right">Total Spend</th>
                  <th className="py-2.5 px-3 text-right">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-3 px-3"><div className="h-3 w-28 bg-neutral-200 rounded" /></td>
                      <td className="py-3 px-3"><div className="h-3 w-36 bg-neutral-200 rounded" /></td>
                      <td className="py-3 px-3 text-center"><div className="h-3 w-8 bg-neutral-200 rounded mx-auto" /></td>
                      <td className="py-3 px-3 text-right"><div className="h-3 w-16 bg-neutral-200 rounded ml-auto" /></td>
                      <td className="py-3 px-3 text-right"><div className="h-3 w-20 bg-neutral-200 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : topUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-neutral-400 font-sans text-xs italic">
                      No customer purchases recorded for this period.
                    </td>
                  </tr>
                ) : (
                  topUsers.map((user, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3 px-3 font-semibold font-admin text-neutral-900">
                        {user.displayName || user.name || user.userId}
                      </td>
                      <td className="py-3 px-3 text-neutral-600 font-sans">
                        {user.email || 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-center font-bold font-admin text-neutral-800">
                        {formatNumber(user.totalOrders)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold font-admin text-neutral-950">
                        ₹{formatCurrency(user.totalRevenue)}
                      </td>
                      <td className="py-3 px-3 text-right text-neutral-400 font-sans text-[11px]">
                        {user.lastActiveDate || 'Recent'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* All Registered Users Modal */}
      <RegisteredUsersModal
        isOpen={isUsersModalOpen}
        onClose={() => setIsUsersModalOpen(false)}
        period={period}
      />

      {/* Active Customers Modal */}
      <ActiveCustomersModal
        isOpen={isActiveUsersModalOpen}
        onClose={() => setIsActiveUsersModalOpen(false)}
        period={period}
      />

      {/* Revenue Breakdown Modal */}
      <RevenueBreakdownModal
        isOpen={isRevenueModalOpen}
        onClose={() => setIsRevenueModalOpen(false)}
        period={period}
      />

      {/* Top Customers Modal */}
      <TopCustomersModal
        isOpen={isTopCustomersModalOpen}
        onClose={() => setIsTopCustomersModalOpen(false)}
        period={period}
      />
    </div>
  );
};

export default AdminAnalytics;
