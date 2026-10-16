import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Mail,
  Phone,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Package,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Play,
  Send,
  Zap
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import Swal from 'sweetalert2';

export const AdminStockNotifications = () => {
  const [metrics, setMetrics] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toast, setToast] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Test Restock Modal State
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testProductId, setTestProductId] = useState('');
  const [testSize, setTestSize] = useState('');
  const [testNewStock, setTestNewStock] = useState('5');
  const [testSubmitting, setTestSubmitting] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch KPI metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const res = await apiClient('/api/stock-notifications/admin/metrics');
      if (res?.success && res?.data) {
        setMetrics(res.data);
      }
    } catch (err) {
      console.error('Failed to load stock notification metrics:', err);
    }
  }, []);

  // Fetch subscriptions
  const fetchSubscriptions = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (channelFilter !== 'all') params.append('channel', channelFilter);
      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());

      const res = await apiClient(`/api/stock-notifications/admin/subscriptions?${params.toString()}`);
      if (res?.success) {
        setSubscriptions(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } else {
        setError(res?.message || 'Failed to load stock notification requests.');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to stock notification service.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pagination.limit, statusFilter, channelFilter, debouncedSearch]);

  // Initial load & when filters change
  useEffect(() => {
    fetchMetrics();
    fetchSubscriptions(pagination.page);
  }, [fetchMetrics, fetchSubscriptions, pagination.page]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMetrics();
    fetchSubscriptions(pagination.page);
  };

  // Retry failed delivery job
  const handleRetryJob = async (jobId) => {
    if (!jobId) return;
    setActionLoadingId(`retry-${jobId}`);
    try {
      const res = await apiClient(`/api/stock-notifications/admin/jobs/${jobId}/retry`, {
        method: 'POST'
      });
      if (res?.success) {
        showToast('Notification delivery job re-queued successfully.');
        fetchMetrics();
        fetchSubscriptions(pagination.page);
      } else {
        showToast(res?.message || 'Failed to re-queue job.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to re-queue delivery job.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Directly dispatch notification to user and remove from waitlist
  const handleDirectNotify = async (sub) => {
    const confirmResult = await Swal.fire({
      title: 'Dispatch Stock Alert?',
      text: `Send back-in-stock notification email to ${sub.contactEmail} and remove them from the waitlist?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#171717',
      cancelButtonColor: '#737373',
      confirmButtonText: 'Yes, Send Alert',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-2xl shadow-2xl font-admin border border-neutral-200',
        title: 'text-base font-bold text-neutral-900',
        confirmButton: 'rounded-xl text-xs font-bold uppercase tracking-wider px-5 py-2.5 shadow-sm',
        cancelButton: 'rounded-xl text-xs font-semibold px-4 py-2.5'
      }
    });

    if (!confirmResult.isConfirmed) return;

    setActionLoadingId(`notify-${sub.id}`);
    try {
      const res = await apiClient(`/api/stock-notifications/admin/subscriptions/${sub.id}/notify`, {
        method: 'POST'
      });
      if (res?.success) {
        showToast(`Stock alert sent to ${sub.contactEmail}. User removed from waitlist.`);
        fetchMetrics();
        fetchSubscriptions(pagination.page);
      } else {
        showToast(res?.message || 'Failed to dispatch notification.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to send notification email.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Check all and notify anyone whose stock is available
  const [scanningStock, setScanningStock] = useState(false);
  const handleCheckInStockNow = async () => {
    setScanningStock(true);
    try {
      const res = await apiClient('/api/stock-notifications/admin/check-in-stock', {
        method: 'POST'
      });
      if (res?.success) {
        const count = res.result?.triggered || 0;
        showToast(
          count > 0
            ? `Dispatched notifications to ${count} patrons. Their waitlist entries were removed.`
            : 'Inventory scanned: No active patrons have available stock right now.'
        );
        fetchMetrics();
        fetchSubscriptions(pagination.page);
      } else {
        showToast(res?.message || 'Failed to scan inventory.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error processing in-stock notifications.', 'error');
    } finally {
      setScanningStock(false);
    }
  };

  // Cancel subscription
  const handleCancelSubscription = async (id) => {
    const confirmResult = await Swal.fire({
      title: 'Cancel Waitlist Alert?',
      text: 'Are you sure you want to cancel this customer restock alert request?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#737373',
      confirmButtonText: 'Yes, Cancel Alert',
      cancelButtonText: 'Keep Active',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-2xl shadow-2xl font-admin border border-neutral-200',
        title: 'text-base font-bold text-neutral-900',
        confirmButton: 'rounded-xl text-xs font-bold uppercase tracking-wider px-5 py-2.5 shadow-sm',
        cancelButton: 'rounded-xl text-xs font-semibold px-4 py-2.5'
      }
    });

    if (!confirmResult.isConfirmed) return;

    setActionLoadingId(`cancel-${id}`);
    try {
      const res = await apiClient(`/api/stock-notifications/admin/subscriptions/${id}/cancel`, {
        method: 'PATCH'
      });
      if (res?.success) {
        showToast('Subscription cancelled successfully.');
        fetchMetrics();
        fetchSubscriptions(pagination.page);
      } else {
        showToast(res?.message || 'Failed to cancel subscription.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to cancel subscription.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Trigger test restock
  const handleTriggerTestRestock = async (e) => {
    e.preventDefault();
    if (!testProductId) {
      alert('Please enter a Product ID');
      return;
    }
    setTestSubmitting(true);
    try {
      const res = await apiClient('/api/stock-notifications/admin/test-restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: parseInt(testProductId),
          size: testSize.trim() || null,
          newStock: parseInt(testNewStock) || 5
        })
      });

      if (res?.success) {
        showToast(res.message || 'Restock test dispatched!');
        setIsTestModalOpen(false);
        setTestProductId('');
        setTestSize('');
        fetchMetrics();
        fetchSubscriptions(1);
      } else {
        showToast(res?.message || 'Failed to trigger test restock.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error triggering restock test.', 'error');
    } finally {
      setTestSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-2 ${
            toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <AdminPageHeader
        title="Stock Notifications"
        subtitle="Monitor back-in-stock customer alerts, restock triggers, queue delivery health, and waitlist demand."
        icon={Bell}
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-900 text-white tracking-widest uppercase">
            <Sparkles className="w-3 h-3 text-amber-300" />
            BACK-IN-STOCK ATELIER ENGINE
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleCheckInStockNow}
              disabled={scanningStock}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              title="Scan all products and automatically email & remove any waitlisted patrons whose stock is available"
            >
              <Zap className={`w-3.5 h-3.5 ${scanningStock ? 'animate-bounce' : ''}`} />
              <span>{scanningStock ? 'Scanning...' : 'Check & Notify In-Stock'}</span>
            </button>
            <button
              onClick={() => setIsTestModalOpen(true)}
              className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-xl border border-neutral-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Simulate Restock Event to test alerts"
            >
              <Play className="w-3.5 h-3.5 text-neutral-700" />
              <span>Simulate Restock Test</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3.5 py-2 bg-black text-white hover:bg-neutral-800 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Subscriptions */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase">Total Waitlist</span>
            <Bell className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold font-serif text-neutral-900">
            {metrics ? metrics.totalSubscriptions.toLocaleString() : '—'}
          </div>
          <span className="text-[10px] text-neutral-400 block mt-1">All time registrations</span>
        </div>

        {/* Card 2: Active Waitlist */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase">Awaiting Stock</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-serif text-emerald-700">
            {metrics ? metrics.activeSubscriptions.toLocaleString() : '—'}
          </div>
          <span className="text-[10px] text-emerald-600/80 block mt-1">Active subscribers waiting</span>
        </div>

        {/* Card 3: Notifications Sent */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-blue-700 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase">Alerts Dispatched</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-serif text-blue-700">
            {metrics ? (metrics.jobsSent || metrics.notifiedSubscriptions).toLocaleString() : '—'}
          </div>
          <span className="text-[10px] text-blue-600/80 block mt-1">Successfully sent via Brevo</span>
        </div>

        {/* Card 4: Failed Jobs */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase">Failed Deliveries</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-serif text-rose-700">
            {metrics ? metrics.jobsFailed.toLocaleString() : '—'}
          </div>
          <span className="text-[10px] text-rose-600/80 block mt-1">Provider delivery errors</span>
        </div>

        {/* Card 5: Highest Demand Item */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase">Top Desired Piece</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-sm font-bold text-neutral-900 truncate" title={metrics?.topDemandProducts?.[0]?.title || 'None'}>
            {metrics?.topDemandProducts?.[0]?.title || 'None'}
          </div>
          <span className="text-[10px] text-amber-600/90 block mt-1 font-semibold">
            {metrics?.topDemandProducts?.[0] ? `${metrics.topDemandProducts[0].subscriberCount} patrons waiting` : 'No waitlist'}
          </span>
        </div>
      </div>

      {/* Top Demand Garments Bar */}
      {metrics?.topDemandProducts?.length > 0 && (
        <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold tracking-wider uppercase text-neutral-800 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-neutral-600" />
              Highest Demand Out-of-Stock Pieces
            </span>
            <span className="text-[11px] text-neutral-500">Priority replenishment candidates</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {metrics.topDemandProducts.map((p) => (
              <div
                key={p.productId}
                className="bg-white border border-neutral-200 rounded-xl p-2.5 flex items-center gap-2.5 shadow-2xs"
              >
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.title}
                    className="w-10 h-12 object-cover rounded-md border border-neutral-200 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-12 bg-neutral-100 rounded-md flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-neutral-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-neutral-900 truncate" title={p.title}>
                    {p.title}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 mt-1">
                    <span>Stock: <strong className={p.stockQuantity > 0 ? 'text-emerald-600' : 'text-rose-600'}>{p.stockQuantity}</strong></span>
                    <span className="font-bold text-black bg-neutral-100 px-1.5 py-0.2 rounded">
                      {p.subscriberCount} waiting
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product title, email, or phone..."
            className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded-xl text-xs focus:border-black focus:outline-hidden bg-white text-neutral-900"
          />
        </div>

        {/* Status & Channel Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-neutral-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="border border-neutral-300 rounded-xl px-3 py-1.5 text-xs bg-white text-neutral-900 focus:border-black focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active (Waiting)</option>
              <option value="notified">Notified (Sent)</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-neutral-500 font-medium">Channel:</span>
            <select
              value={channelFilter}
              onChange={(e) => {
                setChannelFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="border border-neutral-300 rounded-xl px-3 py-1.5 text-xs bg-white text-neutral-900 focus:border-black focus:outline-hidden"
            >
              <option value="all">All Channels</option>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="both">Both</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 text-neutral-500 animate-spin" />
            <p className="text-xs text-neutral-500 font-sans tracking-wide">Loading stock notification requests...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-rose-600 px-4">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            <p className="text-sm font-semibold">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-3 px-4 py-1.5 bg-neutral-900 text-white text-xs rounded-xl hover:bg-black"
            >
              Try Again
            </button>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="py-20 text-center text-neutral-500 px-4">
            <Bell className="w-10 h-10 mx-auto mb-2 text-neutral-300 stroke-[1.5]" />
            <h3 className="text-sm font-semibold text-neutral-800">No stock notifications found</h3>
            <p className="text-xs text-neutral-500 mt-1">
              {debouncedSearch || statusFilter !== 'all' || channelFilter !== 'all'
                ? 'Try adjusting your filters or search keywords.'
                : 'Customer alert requests will appear here when items go out of stock.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-bold tracking-wider uppercase text-neutral-600">
                  <th className="py-3 px-3.5 w-[20%]">Garment / Piece</th>
                  <th className="py-3 px-3 w-[10%]">Variant</th>
                  <th className="py-3 px-3 w-[18%]">Contact</th>
                  <th className="py-3 px-2.5 w-[8%] text-center">Channel</th>
                  <th className="py-3 px-3 w-[11%]">Requested On</th>
                  <th className="py-3 px-3 w-[12%]">Status</th>
                  <th className="py-3 px-3 w-[11%]">Delivery</th>
                  <th className="py-3 px-3.5 w-[10%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {subscriptions.map((sub) => {
                  const isActioning = actionLoadingId === `retry-${sub.job?.id}` || actionLoadingId === `cancel-${sub.id}`;
                  return (
                    <tr key={sub.id} className="hover:bg-neutral-50/80 transition-colors">
                      {/* Product details */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2.5">
                          {sub.imageUrl ? (
                            <img
                              src={sub.imageUrl}
                              alt={sub.productTitle}
                              className="w-9 h-11 object-cover rounded-md border border-neutral-200 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-11 bg-neutral-100 rounded-md flex items-center justify-center shrink-0">
                              <Package className="w-4 h-4 text-neutral-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-semibold text-neutral-900 block truncate max-w-[150px]" title={sub.productTitle}>
                              {sub.productTitle}
                            </span>
                            <span className="text-[10px] text-neutral-400 block">ID: #{sub.productId}</span>
                          </div>
                        </div>
                      </td>

                      {/* Variant */}
                      <td className="py-3 px-3 font-medium text-neutral-700">
                        {sub.size ? (
                          <span className="inline-block bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                            Size: {sub.size}
                          </span>
                        ) : (
                          <span className="text-neutral-400">All Sizes</span>
                        )}
                        {sub.color && sub.color !== 'Default' && (
                          <span className="block text-[10px] text-neutral-500 mt-0.5">Color: {sub.color}</span>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-3">
                        {sub.contactEmail && (
                          <div className="flex items-center gap-1.5 text-neutral-900 font-medium">
                            <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span className="truncate max-w-[160px]" title={sub.contactEmail}>{sub.contactEmail}</span>
                          </div>
                        )}
                        {sub.contactPhone && (
                          <div className="flex items-center gap-1.5 text-neutral-600 text-[11px] mt-0.5">
                            <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                            <span>{sub.contactPhone}</span>
                          </div>
                        )}
                      </td>

                      {/* Channel */}
                      <td className="py-3 px-2.5 text-center">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-neutral-100 text-neutral-700 border border-neutral-200">
                          {sub.channel === 'both' ? 'Email+WA' : sub.channel}
                        </span>
                      </td>

                      {/* Created date */}
                      <td className="py-3 px-3 text-neutral-500 text-[11px] whitespace-nowrap">
                        {new Date(sub.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {sub.isCurrentlyInStock && sub.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Stock Ready ({sub.currentVariantStock || sub.stockQuantity} avail)
                          </span>
                        ) : sub.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Awaiting Restock
                          </span>
                        ) : sub.status === 'notified' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Notified
                          </span>
                        ) : sub.status === 'cancelled' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200">
                            <XCircle className="w-3 h-3" />
                            Cancelled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200">
                            {sub.status}
                          </span>
                        )}
                      </td>

                      {/* Job Status & Delivery Details */}
                      <td className="py-3 px-3">
                        {sub.job ? (
                          <div>
                            <span
                              className={`inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                                sub.job.status === 'sent'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : sub.job.status === 'failed'
                                  ? 'bg-rose-100 text-rose-800'
                                  : sub.job.status === 'processing'
                                  ? 'bg-amber-100 text-amber-800 animate-pulse'
                                  : 'bg-neutral-100 text-neutral-700'
                              }`}
                            >
                              Job: {sub.job.status}
                            </span>
                            {sub.job.lastError && (
                              <p className="text-[10px] text-rose-600 mt-1 max-w-[130px] truncate" title={sub.job.lastError}>
                                {sub.job.lastError}
                              </p>
                            )}
                          </div>
                        ) : sub.notifiedAt ? (
                          <span className="text-[11px] text-neutral-500 whitespace-nowrap">
                            Notified {new Date(sub.notifiedAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-neutral-400 text-[11px] whitespace-nowrap">Pending Restock</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {sub.status === 'active' && (
                          <button
                            onClick={() => handleDirectNotify(sub)}
                            disabled={actionLoadingId === `notify-${sub.id}`}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs ${
                              sub.isCurrentlyInStock
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-neutral-900 hover:bg-black text-white'
                            }`}
                            title="Send back-in-stock email and remove from waitlist"
                          >
                            {actionLoadingId === `notify-${sub.id}` ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                            <span>{sub.isCurrentlyInStock ? 'Notify & Clear' : 'Send Email & Remove'}</span>
                          </button>
                        )}

                        {sub.job?.status === 'failed' && (
                          <button
                            onClick={() => handleRetryJob(sub.job.id)}
                            disabled={isActioning}
                            className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Retry failed email/WhatsApp job"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Retry</span>
                          </button>
                        )}

                        {sub.status === 'active' && (
                          <button
                            onClick={() => handleCancelSubscription(sub.id)}
                            disabled={isActioning}
                            className="px-2 py-1 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg text-[11px] transition-colors cursor-pointer"
                            title="Cancel subscription"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs text-neutral-600">
            <span>
              Showing {subscriptions.length} of {pagination.total} requests
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page <= 1}
                className="p-1.5 border border-neutral-300 rounded-lg hover:bg-white disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 border border-neutral-300 rounded-lg hover:bg-white disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Test Restock Modal */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-600" />
                Simulate Restock Event
              </h3>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="text-neutral-400 hover:text-black p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
              This triggers a simulated stock transition (from 0 to positive stock) for the given Product ID and size. Any active subscribers for this product will receive their back-in-stock alert email immediately.
            </p>

            <form onSubmit={handleTriggerTestRestock} className="space-y-3.5 text-xs text-left">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Product ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={testProductId}
                  onChange={(e) => setTestProductId(e.target.value)}
                  placeholder="e.g. 101 or 105"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:border-black focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Variant Size (Optional)
                </label>
                <input
                  type="text"
                  value={testSize}
                  onChange={(e) => setTestSize(e.target.value)}
                  placeholder="e.g. M, L, or leave empty for all"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:border-black focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  New Restock Quantity
                </label>
                <input
                  type="number"
                  value={testNewStock}
                  onChange={(e) => setTestNewStock(e.target.value)}
                  placeholder="5"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:border-black focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={testSubmitting}
                  className="px-4 py-2 bg-black text-white hover:bg-neutral-800 rounded-xl font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {testSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  <span>Trigger Alert Event</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStockNotifications;
