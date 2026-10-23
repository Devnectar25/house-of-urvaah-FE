import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  ShoppingBag,
  Clock,
  CheckCheck,
  PackageCheck,
  Truck,
  MapPin,
  CheckCircle2,
  XCircle,
  RotateCcw,
  RefreshCw,
  CreditCard,
  Search,
  Filter,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  User,
  Hash,
  ArrowDown,
  ArrowUp
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { OrderDetailModal } from '../../components/admin/OrderDetailModal';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { subscribeToOrderUpdates, broadcastOrderUpdate } from '../../lib/orderSync';
import { ShiprocketOrderDeskView } from '../../components/admin/ShiprocketOrderDeskView';

const checkStatusMatches = (orderStatus, filterStatus, order = null) => {
  if (!filterStatus || filterStatus === 'all') return true;
  const o = (orderStatus || '').toLowerCase();
  const f = filterStatus.toLowerCase();
  const isChildRep = Boolean(order?.original_order_number) || (order?.order_number || '').includes('-REP');
  const isRep = !isChildRep && Boolean(
    (order?.return_type || '').toLowerCase().includes('replace') ||
    (order?.return_type || '').toLowerCase().includes('exchange') ||
    Boolean(order?.replacement_size) ||
    Boolean(order?.replacement_order_number) ||
    (order?.return_reason || '').toLowerCase().includes('exchange') ||
    (order?.return_reason || '').toLowerCase().includes('replace')
  );

  if (f === 'confirmed') {
    return o === 'confirmed';
  }
  if (f === 'processing' || f === 'packed') {
    return o === 'processing' || o === 'packed';
  }
  if (f === 'pending' || f === 'placed') {
    return o === 'pending' || o === 'placed';
  }
  if (f === 'shipped' || f === 'dispatched') {
    return o === 'shipped' || o === 'dispatched';
  }
  if (f === 'out for delivery') {
    return o === 'out for delivery';
  }
  if (f === 'delivered') {
    return o === 'delivered';
  }
  if (f === 'cancelled' || f === 'canceled') {
    return o === 'cancelled' || o === 'canceled' || o === 'cancellation requested' || o === 'refunded';
  }
  if (f === 'returned' || f === 'return' || f === 'returns') {
    if (isRep) return false;
    return o.startsWith('return') || (o.includes('house of urvaah') && !isRep);
  }
  if (f === 'return requested' || f === 'return request processing' || f === 'return request' || f === 'return requests') {
    if (isRep) return false;
    return o === 'return requested' || o === 'return request processing' || o.startsWith('return request');
  }
  if (f === 'return approved') {
    if (isRep) return false;
    return o === 'return approved';
  }
  if (f === 'received at house of urvaah') {
    return o === 'received at house of urvaah' || o === 'received at homved';
  }
  if (f === 'exchanged' || f === 'exchange' || f === 'exchanges') {
    return isRep || o.startsWith('exchange') || o.startsWith('replace') || o.includes('replacement');
  }
  if (f === 'replacement request processing' || f === 'replace requested' || f === 'replacement requested') {
    return o === 'replacement request processing' || o === 'replace requested' || o === 'replacement requested';
  }
  if (f === 'replace approved' || f === 'replacement approved') {
    return o === 'replace approved' || o === 'replacement approved';
  }
  if (f === 'replaced') {
    return o === 'replaced';
  }
  return o === f;
};

const checkPaymentStatusMatches = (orderPaymentStatus, filterPaymentStatus, order = null) => {
  if (!filterPaymentStatus || filterPaymentStatus === 'all') return true;
  let effectiveStatus = orderPaymentStatus;
  if (order) {
    const isCod = (order.payment_method || '').toLowerCase() === 'cod' ||
                  (order.payment_type || '').toLowerCase() === 'cod' ||
                  (order.payment_method || '').toLowerCase().includes('cash');
    if ((order.status || '').toLowerCase() === 'delivered' && isCod) {
      effectiveStatus = 'Paid';
    }
  }
  const o = (effectiveStatus || '').toLowerCase();
  const f = filterPaymentStatus.toLowerCase();
  if (f === 'pending') {
    return o === 'pending' || o === 'failed';
  }
  return o === f;
};

const ORDER_STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Processing', label: 'Processing' },
  { value: 'Packed', label: 'Packed' },
  { value: 'Shipped', label: 'Shipped' },
  { value: 'Out for Delivery', label: 'Out for Delivery' },
  { value: 'Delivered', label: 'Delivered' },
  { value: 'Cancellation Requested', label: 'Cancellation Requested' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Return Requested', label: 'Return Requested' },
  { value: 'Return Request Processing', label: 'Return Request Processing' },
  { value: 'Return Approved', label: 'Return Approved' },
  { value: 'In Transit to House of Urvaah', label: 'In Transit to House of Urvaah' },
  { value: 'Received at House of Urvaah', label: 'Received at House of Urvaah' },
  { value: 'Returned', label: 'Returned' },
  { value: 'Replacement Request Processing', label: 'Replacement Requested' },
  { value: 'Replace Approved', label: 'Replacement Approved' },
  { value: 'Replaced', label: 'Replaced' },
  { value: 'Exchanged', label: 'Exchanged' }
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'all', label: 'All Payment Statuses' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Failed', label: 'Failed' },
  { value: 'Refunded', label: 'Refunded' }
];

const PAYMENT_TYPE_OPTIONS = [
  { value: 'all', label: 'All Payment Types' },
  { value: 'Card', label: 'Card' },
  { value: 'UPI', label: 'UPI' },
  { value: 'COD', label: 'Cash on Delivery (COD)' },
  { value: 'Online', label: 'Online' }
];

const formatOrderDateTime = (dateStr) => {
  if (!dateStr) return { date: '-', time: '', isRecent: false, relative: '' };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { date: '-', time: '', isRecent: false, relative: '' };

  const date = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const time = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const diffMs = Date.now() - d.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);

  let relative = '';
  let isRecent = false;

  if (diffMinutes >= 0 && diffMinutes < 2) {
    relative = 'Just now';
    isRecent = true;
  } else if (diffMinutes >= 2 && diffMinutes < 60) {
    relative = `${diffMinutes}m ago`;
    isRecent = true;
  } else if (diffHours >= 1 && diffHours < 24) {
    relative = `${diffHours}h ago`;
    isRecent = true;
  }

  return { date, time, isRecent, relative };
};

export const AdminOrders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active View Tab: 'orders' (default store order desk) vs 'shiprocket' (live forward fulfillment)
  const activeViewTab = searchParams.get('view') === 'shiprocket' ? 'shiprocket' : 'orders';

  const handleTabChange = (tab) => {
    const nextParams = new URLSearchParams(searchParams);
    if (tab === 'shiprocket') {
      nextParams.set('view', 'shiprocket');
    } else {
      nextParams.delete('view');
    }
    setSearchParams(nextParams);
  };

  // Stat Cards State
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // Filters State
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');
  const [selectedPaymentType, setSelectedPaymentType] = useState('all');
  const [orderIdInput, setOrderIdInput] = useState('');
  const [customerInput, setCustomerInput] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Debounced search terms
  const [debouncedOrderId, setDebouncedOrderId] = useState('');
  const [debouncedCustomer, setDebouncedCustomer] = useState('');

  // Order Detail Modal State
  const [selectedOrderIdForDetail, setSelectedOrderIdForDetail] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Pagination & Orders List State
  const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' = newest first, 'asc' = oldest first

  // Dynamic Sliding Window for Pagination (shows at most 7 page pills with ellipses)
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      pages.push('...');
      pages.push(currentPage - 1);
      pages.push(currentPage);
      pages.push(currentPage + 1);
      pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);

  // Debounce search inputs
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedOrderId(orderIdInput.trim());
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [orderIdInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCustomer(customerInput.trim());
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [customerInput]);

  // Date range validation check
  const dateError = useMemo(() => {
    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      return 'From Date must be before or equal to To Date';
    }
    return null;
  }, [fromDate, toDate]);

  // Order ID format validation check (allows partial typing like "HOU-", digits, or letters/digits/hyphens; flags invalid special characters or bad prefix)
  const orderIdError = useMemo(() => {
    const val = orderIdInput.trim();
    if (!val) return null;

    // Disallow disallowed special characters (only letters, numbers, and hyphens permitted)
    if (!/^[a-zA-Z0-9-]+$/.test(val)) {
      return 'Only letters, numbers, and hyphens (-) allowed';
    }

    // If starts with letters followed by hyphen or partial prefix, check consistency
    const upper = val.toUpperCase();
    if (upper.length >= 3 && !upper.startsWith('HOU') && !/^\d+$/.test(val)) {
      return 'Order ID must start with "HOU-" or contain numbers';
    }

    return null;
  }, [orderIdInput]);

  // Active filters check
  const isFilterActive = useMemo(() => {
    return (
      selectedStatus !== 'all' ||
      selectedPaymentStatus !== 'all' ||
      selectedPaymentType !== 'all' ||
      Boolean(orderIdInput.trim()) ||
      Boolean(customerInput.trim()) ||
      Boolean(fromDate) ||
      Boolean(toDate)
    );
  }, [selectedStatus, selectedPaymentStatus, selectedPaymentType, orderIdInput, customerInput, fromDate, toDate]);

  // Sync state with URL search parameters on mount or navigation change
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const statusParam = searchParams.get('status');
    const paymentStatusParam = searchParams.get('paymentStatus') || searchParams.get('payment_status');

    if (statusParam) {
      const match = ORDER_STATUS_OPTIONS.find(
        (opt) => opt.value.toLowerCase() === statusParam.toLowerCase()
      );
      if (match) {
        setSelectedStatus(match.value);
      }
    } else {
      setSelectedStatus('all');
    }

    if (paymentStatusParam) {
      const match = PAYMENT_STATUS_OPTIONS.find(
        (opt) => opt.value.toLowerCase() === paymentStatusParam.toLowerCase()
      );
      if (match) {
        setSelectedPaymentStatus(match.value);
      }
    } else {
      setSelectedPaymentStatus('all');
    }
    setCurrentPage(1);
  }, [location.search]);

  // Fetch Stat Cards Counts (supports silent background sync without UI flicker)
  const fetchStats = useCallback(async (silent = false) => {
    if (!silent) {
      setStatsLoading(true);
      setStatsError(null);
    }
    try {
      const response = await apiClient(`/api/orders/stats?_t=${Date.now()}`);
      const data = response?.data || response || {};
      setStats(data);
    } catch (err) {
      console.error('Failed to load order stats:', err);
      if (!silent) {
        setStatsError(err.message || 'Failed to load order metrics');
      }
    } finally {
      if (!silent) {
        setStatsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Open Order Detail Modal
  const handleOpenOrderDetail = (orderId) => {
    setSelectedOrderIdForDetail(orderId);
    setIsDetailModalOpen(true);
  };

  // Handle Optimistic Preview update from modal without calling API
  const handleOptimisticPreview = useCallback((previewOrder) => {
    if (!previewOrder || !previewOrder.id) return;

    setOrders((prevOrders) => {
      const existingOrder = prevOrders.find((o) => o.id === previewOrder.id);
      if (!existingOrder) return prevOrders;

      const mergedOrder = { ...existingOrder, ...previewOrder };
      return prevOrders.map((o) => (o.id === previewOrder.id ? mergedOrder : o));
    });
  }, []);

  // Fetch Filtered Orders List (supports silent background sync without UI flicker)
  const fetchOrders = useCallback(async (silent = false) => {
    // If date range is invalid, do not send query
    if (dateError) return;

    if (!silent) {
      setOrdersLoading(true);
      setOrdersError(null);
    }

    try {
      const params = new URLSearchParams();
      params.set('page', currentPage);
      params.set('limit', limit);
      params.set('type', 'all');
      params.set('_t', Date.now());

      if (selectedStatus && selectedStatus !== 'all') {
        params.set('status', selectedStatus);
      }
      if (selectedPaymentStatus && selectedPaymentStatus !== 'all') {
        params.set('paymentStatus', selectedPaymentStatus);
      }
      if (selectedPaymentType && selectedPaymentType !== 'all') {
        params.set('paymentType', selectedPaymentType);
      }
      if (debouncedOrderId) {
        params.set('orderNumber', debouncedOrderId);
      }
      if (debouncedCustomer) {
        params.set('userName', debouncedCustomer);
      }

      const response = await apiClient(`/api/orders?${params.toString()}`);
      const rawOrders = response?.data || response?.orders || [];
      const pagination = response?.pagination || {};

      // Local client filtering for date range if backend returns array
      let list = Array.isArray(rawOrders) ? rawOrders : [];
      if (fromDate) {
        const fromTs = new Date(fromDate).getTime();
        list = list.filter((o) => new Date(o.created_at).getTime() >= fromTs);
      }
      if (toDate) {
        const toTs = new Date(toDate).setHours(23, 59, 59, 999);
        list = list.filter((o) => new Date(o.created_at).getTime() <= toTs);
      }

      // Guarantee recent orders appear at the top by default (created_at DESC)
      list.sort((a, b) => {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      });

      setOrders(list);
      setTotalOrders(pagination.totalOrders ?? list.length);
      setTotalPages(pagination.totalPages || Math.ceil((pagination.totalOrders || list.length || 1) / limit));
    } catch (err) {
      console.error('Failed to load orders:', err);
      if (!silent) {
        setOrdersError(err.message || 'Failed to load orders from server. Please try again.');
      }
    } finally {
      if (!silent) {
        setOrdersLoading(false);
      }
    }
  }, [currentPage, limit, selectedStatus, selectedPaymentStatus, selectedPaymentType, debouncedOrderId, debouncedCustomer, fromDate, toDate, dateError, sortOrder]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Combined refresh handler for both orders and stat counts
  const handleRefreshAll = useCallback((silent = false) => {
    fetchOrders(silent);
    fetchStats(silent);
  }, [fetchOrders, fetchStats]);

  // Update order in state when modal saves changes
  const handleOrderUpdatedInList = useCallback((updatedOrder) => {
    if (!updatedOrder || !updatedOrder.id) return;

    // Broadcast change so user's customer UI and other admin sessions update dynamically
    broadcastOrderUpdate(updatedOrder);

    // Re-fetch both orders table and stat counts immediately so the list and counts update accurately
    fetchOrders(true);
    fetchStats(true);
  }, [fetchOrders, fetchStats]);

  // Real-time synchronization listener for order updates across all tabs / devices
  useEffect(() => {
    const unsubscribe = subscribeToOrderUpdates((payload) => {
      if (!payload || (!payload.id && !payload.order_number)) return;

      // Update both orders table and stat cards dynamically and silently without skeleton flicker
      fetchOrders(true);
      fetchStats(true);
    });

    return () => unsubscribe();
  }, [fetchOrders, fetchStats]);

  // Window focus listener for silent real-time sync
  useEffect(() => {
    const handleFocus = () => {
      fetchOrders(true);
      fetchStats(true);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchOrders, fetchStats]);

  // Auto periodic background poll (every 8s) to ensure live real-time sync for counts & orders
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(true);
      fetchStats(true);
    }, 8000);

    return () => clearInterval(interval);
  }, [fetchOrders, fetchStats]);

  // Toggle Date sorting between newest first and oldest first
  const handleToggleSortOrder = () => {
    const nextOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(nextOrder);
    setOrders((prev) =>
      [...prev].sort((a, b) => {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return nextOrder === 'asc' ? timeA - timeB : timeB - timeA;
      })
    );
  };

  // Reset all filters in a single action and clear URL
  const handleClearFilters = () => {
    if (ordersLoading || !isFilterActive) return;
    setSelectedStatus('all');
    setSelectedPaymentStatus('all');
    setSelectedPaymentType('all');
    setOrderIdInput('');
    setCustomerInput('');
    setDebouncedOrderId('');
    setDebouncedCustomer('');
    setFromDate('');
    setToDate('');
    setCurrentPage(1);
    navigate('/admin/orders', { replace: true });
    fetchStats(true);
  };

  // Click Stat Card to pre-filter and update URL (with click-to-toggle support)
  const handleStatCardClick = (statusValue, paymentStatusValue = null) => {
    const isCurrentlyActive =
      (statusValue && statusValue !== 'all' && (
        selectedStatus.toLowerCase() === statusValue.toLowerCase() ||
        (statusValue.toLowerCase() === 'processing' && (selectedStatus.toLowerCase() === 'processing' || selectedStatus.toLowerCase() === 'packed'))
      )) ||
      (paymentStatusValue && paymentStatusValue !== 'all' && selectedPaymentStatus.toLowerCase() === paymentStatusValue.toLowerCase());

    const targetStatus = isCurrentlyActive ? 'all' : (statusValue || 'all');
    const targetPaymentStatus = isCurrentlyActive ? 'all' : (paymentStatusValue || 'all');

    setSelectedStatus(targetStatus);
    setSelectedPaymentStatus(targetPaymentStatus);
    setCurrentPage(1);

    const params = new URLSearchParams(location.search);
    if (targetStatus !== 'all') {
      params.set('status', targetStatus);
    } else {
      params.delete('status');
    }
    if (targetPaymentStatus !== 'all') {
      params.set('paymentStatus', targetPaymentStatus);
    } else {
      params.delete('paymentStatus');
    }

    const searchStr = params.toString();
    navigate(searchStr ? `/admin/orders?${searchStr}` : '/admin/orders', { replace: true });

    // Scroll smoothly to orders table section at the top of the page
    const element = document.getElementById('orders-table-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };


  // Format status for short display in table pills
  const formatOrderStatusDisplay = (status) => {
    if (!status) return 'Pending';
    const s = String(status).toLowerCase();
    if (s.includes('received at house of urvaah') || s.includes('received at homved')) {
      return 'Received at HOU';
    }
    if (s.includes('in transit to house of urvaah')) {
      return 'In Transit to HOU';
    }
    if (s.includes('replacement request processing') || s.includes('replace requested') || s.includes('replacement requested')) {
      return 'Replacement Req.';
    }
    if (s.includes('return request processing')) {
      return 'Return Req.';
    }
    if (s.includes('cancellation requested') || s.includes('cancel_requested')) {
      return 'Cancel Req.';
    }
    return status;
  };

  // Helper for Order Status Pill Styling
  const getOrderStatusPill = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('delivered')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (s.includes('shipped') || s.includes('dispatched')) {
      return 'bg-sky-50 text-sky-700 border-sky-200';
    }
    if (s.includes('out for delivery')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (s.includes('confirmed')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (s.includes('processing') || s.includes('packed')) {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
    if (s.includes('pending') || s.includes('placed')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (s.includes('cancellation requested') || s.includes('cancel_requested')) {
      return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
    }
    if (s.includes('cancel')) {
      return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
    if (s.includes('return requested') || s.includes('return request processing')) {
      return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
    }
    if (s.includes('return approved')) {
      return 'bg-sky-50 text-sky-800 border-sky-300 font-bold';
    }
    if (s.includes('received at house of urvaah') || s.includes('received at homved')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
    }
    if (s.includes('return')) {
      return 'bg-orange-50 text-orange-700 border-orange-200';
    }
    if (s.includes('replacement request processing') || s.includes('replace requested') || s.includes('replacement requested')) {
      return 'bg-purple-100 text-purple-900 border-purple-300 font-bold';
    }
    if (s.includes('replace approved') || s.includes('replacement approved')) {
      return 'bg-indigo-50 text-indigo-800 border-indigo-300 font-bold';
    }
    if (s.includes('replacement processing') || s.includes('replacement shipped') || s.includes('replacement out for delivery')) {
      return 'bg-sky-50 text-sky-800 border-sky-300 font-bold';
    }
    if (s === 'replaced') {
      return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
    }
    if (s.includes('replace rejected')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (s.includes('exchange') || s.includes('replace')) {
      return 'bg-teal-50 text-teal-700 border-teal-200';
    }
    return 'bg-neutral-100 text-neutral-700 border-neutral-200';
  };

  // Helper for Payment Status Pill Styling
  const getPaymentStatusPill = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'paid') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (s === 'pending') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (s === 'failed') {
      return 'bg-stone-100 text-stone-700 border-stone-200';
    }
    if (s === 'refunded') {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    return 'bg-neutral-100 text-neutral-700 border-neutral-200';
  };

  // Definition of 10 Stat Cards matching House of Urvaah lifecycle
  const STAT_CARDS_DEF = [
    {
      key: 'total',
      label: 'Total Orders',
      count: stats?.total ?? 0,
      icon: ShoppingBag,
      colorClass: 'bg-neutral-100 text-neutral-900 border border-neutral-200/80',
      badgeBg: 'bg-neutral-200/80 text-brand-dark',
      statusFilter: 'all'
    },
    {
      key: 'pending',
      label: 'Pending',
      count: stats?.pending ?? 0,
      icon: Clock,
      colorClass: 'bg-amber-50 text-amber-600 border-amber-200',
      badgeBg: 'bg-amber-100 text-amber-800',
      statusFilter: 'Pending'
    },
    {
      key: 'confirmed',
      label: 'Confirmed',
      count: stats?.confirmed ?? 0,
      icon: CheckCheck,
      colorClass: 'bg-blue-50 text-blue-600 border-blue-200',
      badgeBg: 'bg-blue-100 text-blue-800',
      statusFilter: 'Confirmed'
    },
    {
      key: 'shipped',
      label: 'Shipped',
      count: stats?.shipped ?? 0,
      icon: Truck,
      colorClass: 'bg-sky-50 text-sky-600 border-sky-200',
      badgeBg: 'bg-sky-100 text-sky-800',
      statusFilter: 'Shipped'
    },
    {
      key: 'outForDelivery',
      label: 'Out for Delivery',
      count: stats?.outForDelivery ?? 0,
      icon: MapPin,
      colorClass: 'bg-purple-50 text-purple-600 border-purple-200',
      badgeBg: 'bg-purple-100 text-purple-800',
      statusFilter: 'Out for Delivery'
    },
    {
      key: 'delivered',
      label: 'Delivered',
      count: stats?.delivered ?? 0,
      icon: CheckCircle2,
      colorClass: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      statusFilter: 'Delivered'
    },
    {
      key: 'cancellationRequested',
      label: 'Cancel Requests',
      count: stats?.cancellationRequested ?? 0,
      icon: AlertCircle,
      colorClass: 'bg-amber-50 text-amber-700 border-amber-300',
      badgeBg: 'bg-amber-200 text-amber-900',
      statusFilter: 'Cancellation Requested'
    },
    {
      key: 'returnRequested',
      label: 'Return Requests',
      count: stats?.returnRequested ?? stats?.return_requested ?? 0,
      icon: RotateCcw,
      colorClass: 'bg-rose-50 text-rose-700 border-rose-300',
      badgeBg: 'bg-rose-200 text-rose-900',
      statusFilter: 'Return Requested'
    },
    {
      key: 'cancelled',
      label: 'Cancelled',
      count: stats?.cancelled ?? stats?.canceled ?? 0,
      icon: XCircle,
      colorClass: 'bg-stone-50 text-stone-700 border-stone-200',
      badgeBg: 'bg-stone-100 text-stone-800',
      statusFilter: 'Cancelled'
    },
    {
      key: 'returns',
      label: 'Returns',
      count: stats?.returns ?? 0,
      icon: RotateCcw,
      colorClass: 'bg-orange-50 text-orange-600 border-orange-200',
      badgeBg: 'bg-orange-100 text-orange-800',
      statusFilter: 'Returned'
    },
    {
      key: 'exchanges',
      label: 'Exchanges',
      count: stats?.exchanges ?? 0,
      icon: RefreshCw,
      colorClass: 'bg-teal-50 text-teal-600 border-teal-200',
      badgeBg: 'bg-teal-100 text-teal-800',
      statusFilter: 'Exchanged'
    },
    {
      key: 'pendingPayment',
      label: 'Pending Payment',
      count: stats?.pendingPayment ?? 0,
      icon: CreditCard,
      colorClass: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      badgeBg: 'bg-yellow-100 text-yellow-800',
      statusFilter: 'all',
      paymentStatusFilter: 'Pending'
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header Banner */}
      <AdminPageHeader
        title={activeViewTab === 'shiprocket' ? 'Order Fulfillment & Shiprocket Desk' : 'Order Management'}
        subtitle={
          activeViewTab === 'shiprocket'
            ? 'Real-time courier allocation, AWB generation, shipping labels, and live transit tracking via Shiprocket.'
            : 'Track, filter, and manage store orders, dispatch status, and customer payments.'
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleRefreshAll(false)}
              disabled={ordersLoading || statsLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-neutral-200/90 text-neutral-800 rounded-xl text-xs font-semibold hover:bg-neutral-50 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
              title="Refresh order data & metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${ordersLoading || statsLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Orders</span>
            </button>
          </div>
        }
      />

      {/* View Switcher: Store Orders vs Shiprocket Forward Desk */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200/90 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleTabChange('orders')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeViewTab === 'orders'
                ? 'bg-brand-dark text-white shadow-xs ring-1 ring-brand-dark'
                : 'bg-white text-neutral-600 hover:text-brand-dark hover:bg-neutral-50 border border-neutral-200/80'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Store Orders & Processing</span>
            {stats?.total !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeViewTab === 'orders' ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-700'
              }`}>
                {stats.total}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('shiprocket')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeViewTab === 'shiprocket'
                ? 'bg-brand-dark text-white shadow-xs ring-1 ring-brand-dark'
                : 'bg-white text-neutral-600 hover:text-brand-dark hover:bg-neutral-50 border border-neutral-200/80'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Shiprocket Forward Desk</span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
              Live Fulfillment
            </span>
          </button>
        </div>

        <div className="text-[11px] text-neutral-500 font-medium">
          {activeViewTab === 'orders'
            ? 'Managing store orders, payment records, and lifecycle statuses'
            : 'Live AWB generation, courier allocation, label printing, and tracking'}
        </div>
      </div>

      {activeViewTab === 'shiprocket' ? (
        <ShiprocketOrderDeskView onSelectOrder={handleOpenOrderDetail} />
      ) : (
        <>
          {/* ========================================================================= */}
          {/* 1. STAT CARDS / STATUS METRICS BREAKDOWN SECTION (ABOVE FILTERS)          */}
          {/* ========================================================================= */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold tracking-wider text-neutral-500 uppercase font-admin">
            Order Status Breakdown
          </h3>
          <span className="text-[11px] text-neutral-400 hidden sm:inline">
            Click any metric card to filter the orders table below
          </span>
        </div>

        {statsError ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>Failed to load order statistics: {statsError}</span>
            </div>
            <button
              onClick={fetchStats}
              className="px-3 py-1 bg-brand-dark text-white rounded-lg font-semibold hover:bg-black transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {STAT_CARDS_DEF.map((card) => {
              const IconComp = card.icon;
              const isActive =
                card.key === 'total'
                  ? selectedStatus === 'all' && selectedPaymentStatus === 'all'
                  : card.key === 'pendingPayment'
                  ? selectedPaymentStatus.toLowerCase() === 'pending'
                  : card.key === 'processing'
                  ? selectedStatus.toLowerCase() === 'processing' || selectedStatus.toLowerCase() === 'packed'
                  : Boolean(
                      selectedStatus &&
                      card.statusFilter &&
                      selectedStatus.toLowerCase() === card.statusFilter.toLowerCase()
                    );

              return (
                <div
                  key={card.key}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleStatCardClick(card.statusFilter, card.paymentStatusFilter)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleStatCardClick(card.statusFilter, card.paymentStatusFilter);
                    }
                  }}
                  className={`border rounded-xl p-4 shadow-sm transition-all flex flex-col justify-between space-y-3 group cursor-pointer select-none ${
                    isActive
                      ? 'border-brand-dark ring-2 ring-brand-dark/20 shadow-md bg-neutral-50/90'
                      : 'bg-white border-neutral-200/80 hover:shadow-md hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg border ${card.colorClass}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    {statsLoading ? (
                      <div className="h-5 w-8 bg-neutral-200 rounded animate-pulse" />
                    ) : (
                      <span className={`text-xs font-admin font-bold px-2 py-0.5 rounded-full ${card.badgeBg}`}>
                        {card.count}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      {card.label}
                    </h3>
                    {statsLoading ? (
                      <div className="h-6 w-14 bg-neutral-200 rounded mt-1 animate-pulse" />
                    ) : (
                      <p className="text-lg font-admin font-bold text-brand-dark mt-0.5">
                        {card.count}
                      </p>
                    )}
                  </div>

                  <div
                    className={`text-[11px] font-medium flex items-center gap-1 transition-colors pt-1 border-t ${
                      isActive
                        ? 'text-brand-dark font-semibold border-neutral-100'
                        : 'text-neutral-400 group-hover:text-brand-dark border-neutral-100'
                    }`}
                  >
                    <span>{isActive ? 'Filtered view' : 'Click to filter'}</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. DETAILED SEARCH & FILTERS PANEL (BELOW METRIC CARDS)                   */}
      {/* ========================================================================= */}
      <div id="orders-filters-section" className="bg-white border border-neutral-200/80 rounded-xl p-5 shadow-sm space-y-4">
        {/* Filters Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2 text-brand-dark font-semibold text-sm tracking-tight font-admin">
            <Filter className="w-4 h-4 text-neutral-500" />
            <span>Search & Filter Parameters</span>
          </div>


          <button
            type="button"
            onClick={handleClearFilters}
            disabled={ordersLoading}
            aria-label="Clear filters"
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-1 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
            title={isFilterActive ? 'Reset all search and status filters to default' : 'Clear filters'}
          >
            <X className={`w-3.5 h-3.5 transition-colors duration-200 ${isFilterActive ? 'text-brand-dark' : 'text-neutral-500'}`} />
            <span>Clear Filters</span>
          </button>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Order Status */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
              Order Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedStatus(val);
                setCurrentPage(1);
                const params = new URLSearchParams(location.search);
                if (val && val !== 'all') {
                  params.set('status', val);
                } else {
                  params.delete('status');
                }
                const searchStr = params.toString();
                navigate(searchStr ? `/admin/orders?${searchStr}` : '/admin/orders', { replace: true });
              }}
              className="w-full bg-neutral-50 border border-neutral-200 text-brand-dark text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-dark focus:bg-white transition-all font-medium"
            >
              {ORDER_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
              Payment Status
            </label>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedPaymentStatus(val);
                setCurrentPage(1);
                const params = new URLSearchParams(location.search);
                if (val && val !== 'all') {
                  params.set('paymentStatus', val);
                } else {
                  params.delete('paymentStatus');
                }
                const searchStr = params.toString();
                navigate(searchStr ? `/admin/orders?${searchStr}` : '/admin/orders', { replace: true });
              }}
              className="w-full bg-neutral-50 border border-neutral-200 text-brand-dark text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-dark focus:bg-white transition-all font-medium"
            >
              {PAYMENT_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
              Payment Type
            </label>
            <select
              value={selectedPaymentType}
              onChange={(e) => {
                setSelectedPaymentType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-neutral-50 border border-neutral-200 text-brand-dark text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-dark focus:bg-white transition-all font-medium"
            >
              {PAYMENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Order ID Search */}
          <div className="relative">
            <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
              Order ID
            </label>
            <div className="relative">
              <Hash className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                placeholder="e.g. HOU-924856"
                className={`w-full pl-8 pr-7 py-2 bg-neutral-50 border rounded-xl text-xs text-brand-dark placeholder-neutral-400 focus:outline-none focus:bg-white transition-all ${
                  orderIdError
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-neutral-200 focus:ring-1 focus:ring-brand-dark'
                }`}
              />
              {orderIdInput && (
                <button
                  type="button"
                  onClick={() => setOrderIdInput('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-brand-dark text-xs p-0.5 cursor-pointer"
                  title="Clear Order ID"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {orderIdError && (
              <p className="text-[10px] text-rose-500 mt-1 font-medium flex items-center gap-1">
                <span className="inline-block w-1 h-1 rounded-full bg-rose-500"></span>
                {orderIdError}
              </p>
            )}
          </div>
        </div>

        {/* Filter Row 2: Customer Search & Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Customer Search */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
              Customer Name / Email
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={customerInput}
                onChange={(e) => setCustomerInput(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-8 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-brand-dark placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-brand-dark focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* From Date */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
            />
          </div>
        </div>

        {/* Date Validation Error Message */}
        {dateError && (
          <p className="text-xs text-rose-600 font-medium flex items-center gap-1 pt-1">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{dateError}</span>
          </p>
        )}
      </div>


      {/* ========================================================================= */}
      {/* 3. ORDERS TABLE CONTAINER (RECENT ORDERS ON TOP)                          */}
      {/* ========================================================================= */}
      <div id="orders-table-section" className="bg-white border border-neutral-200/80 rounded-xl shadow-sm overflow-hidden">
        {/* Table Subheader Count, Quick Controls & Recency Indicator */}
        <div className="px-6 py-4 border-b border-neutral-200/80 flex flex-wrap items-center justify-between gap-3 bg-neutral-50/50">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base font-semibold tracking-wider text-brand-dark uppercase flex items-center gap-2 font-admin">
              <span>Orders List</span>
              <span className="px-2.5 py-0.5 bg-neutral-200/80 rounded-full text-neutral-800 text-xs font-semibold">
                {totalOrders}
              </span>
            </h2>

            {isFilterActive && (
              <span className="text-xs text-neutral-500 font-medium">
                • Filtered View
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick search input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                placeholder="Search Order ID..."
                className={`pl-8 pr-6 py-1.5 bg-white border rounded-lg text-xs text-brand-dark placeholder-neutral-400 focus:outline-none w-36 sm:w-48 shadow-2xs transition-all ${
                  orderIdError
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-neutral-200 focus:ring-1 focus:ring-brand-dark'
                }`}
              />
              {orderIdInput && (
                <button
                  type="button"
                  onClick={() => setOrderIdInput('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Jump to Advanced Filters button */}
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('orders-filters-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors cursor-pointer shadow-2xs"
              title="Jump to advanced search & filters"
            >
              <Filter className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline">Advanced Filters</span>
              <span className="sm:hidden">Filters</span>
            </button>

            {isFilterActive && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs"
                title="Reset all active filters"
              >
                <X className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleRefreshAll(false)}
              disabled={ordersLoading || statsLoading}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
              title="Refresh order list & metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${ordersLoading || statsLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Orders Fetch Error State */}
        {ordersError && !ordersLoading && (
          <div className="p-6 bg-neutral-50/70 border-b border-neutral-200 text-center">
            <AlertCircle className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-brand-dark mb-1">Failed to Load Orders</h4>
            <p className="text-xs text-neutral-600 mb-4">{ordersError}</p>
            <button
              onClick={() => handleRefreshAll(false)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-dark text-white text-xs font-semibold rounded-lg hover:bg-black transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Request
            </button>
          </div>
        )}

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-neutral-50/80 text-[11px] font-semibold tracking-wider text-neutral-500 uppercase border-b border-neutral-200/80">
                <th className="py-3 px-4 w-44">Order ID</th>
                <th className="py-3 px-4 w-64">Customer</th>
                <th
                  onClick={handleToggleSortOrder}
                  className="py-3 px-4 w-44 cursor-pointer select-none group hover:bg-neutral-100/70 transition-colors"
                  title={`Sort by Date & Time (Currently: ${sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}). Click to toggle.`}
                >
                  <div className="flex items-center gap-1.5 text-neutral-700 group-hover:text-brand-dark">
                    <span>Date & Time</span>
                    {sortOrder === 'desc' ? (
                      <ArrowDown className="w-3.5 h-3.5 text-brand-dark" />
                    ) : (
                      <ArrowUp className="w-3.5 h-3.5 text-brand-dark" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 w-24">Items</th>
                <th className="py-3 px-4 w-32">Total</th>
                <th className="py-3 px-4 text-center w-36">Status</th>
                <th className="py-3 px-4 text-center w-32">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/60 text-xs text-brand-dark">
              {/* Skeleton Loader State */}
              {ordersLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3.5 px-4">
                      <div className="h-4 bg-neutral-200 rounded w-28" />
                    </td>
                    <td className="py-3.5 px-4 space-y-1">
                      <div className="h-4 bg-neutral-200 rounded w-36" />
                      <div className="h-3 bg-neutral-200 rounded w-48" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 bg-neutral-200 rounded w-28" />
                      <div className="h-3 bg-neutral-100 rounded w-16 mt-1" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 bg-neutral-200 rounded w-16" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 bg-neutral-200 rounded w-20" />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="h-6 w-24 bg-neutral-200 rounded-full mx-auto" />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="h-6 w-20 bg-neutral-200 rounded-full mx-auto" />
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 && !ordersError ? (
                /* Empty State */
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-brand-dark mb-1">
                      {isFilterActive ? 'No orders found matching your filters' : 'No orders recorded yet'}
                    </h3>
                    <p className="text-xs text-neutral-500 max-w-xs mx-auto mb-4">
                      {isFilterActive
                        ? 'Try clearing or changing your search criteria, status, or date parameters.'
                        : 'New customer orders will appear here once placed in the storefront.'}
                    </p>
                    {isFilterActive && (
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-dark bg-neutral-100 hover:bg-neutral-200 px-4 py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Clear Filters</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                /* Data Rows */
                orders.map((ord) => {
                  const itemsList = Array.isArray(ord.items) ? ord.items : [];
                  const itemCount = itemsList.length || 1;
                  const dateTimeInfo = formatOrderDateTime(ord.created_at);
                  const formattedTotal = ord.total
                    ? `₹${parseFloat(ord.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                    : '₹0.00';

                  return (
                    <tr
                      key={ord.id}
                      onClick={() => handleOpenOrderDetail(ord.id)}
                      className="hover:bg-neutral-50/80 transition-colors group cursor-pointer"
                    >
                      {/* Order ID */}
                      <td className="py-3 px-4 font-admin font-bold text-xs text-brand-dark tracking-wide">
                        <div className="flex flex-col items-start gap-1">
                          <span>{ord.order_number || ord.id?.slice(0, 8)}</span>
                          {(Boolean(ord.original_order_number) || (ord.order_number || '').includes('-REP')) && (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-900 border border-purple-200 uppercase font-sans leading-none tracking-tight">
                              Forward Replacement
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3 px-4 w-64">
                        <div className="font-semibold text-brand-dark truncate max-w-xs">
                          {ord.user_id || ord.customer_email || 'Guest Customer'}
                        </div>
                        <div className="text-[11px] text-neutral-500 truncate max-w-xs">
                          {ord.customer_email || ord.user_id || '-'}
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-4 text-neutral-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-brand-dark">{dateTimeInfo.date}</span>
                          {dateTimeInfo.isRecent && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                              {dateTimeInfo.relative}
                            </span>
                          )}
                        </div>
                        {dateTimeInfo.time && (
                          <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                            {dateTimeInfo.time}
                          </div>
                        )}
                      </td>

                      {/* Items */}
                      <td className="py-3 px-4 text-neutral-600">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 rounded-md text-[11px] font-medium">
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-4 font-admin font-bold text-xs text-brand-dark">
                        {formattedTotal}
                      </td>

                      {/* Order Status Pill */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap ${getOrderStatusPill(
                              ord.status
                            )}`}
                          >
                            {formatOrderStatusDisplay(ord.status)}
                          </span>
                          {ord.isPreview && (
                            <span
                              className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0"
                              title="Unsaved Preview — Click Save Status Changes in Modal to persist"
                            />
                          )}
                        </div>
                      </td>

                      {/* Payment Status Pill */}
                      <td className="py-3 px-4 text-center">
                        {(() => {
                          const isCod = (ord.payment_method || '').toLowerCase() === 'cod' ||
                                        (ord.payment_type || '').toLowerCase() === 'cod' ||
                                        (ord.payment_method || '').toLowerCase().includes('cash');
                          const isCancelled = (ord.status || '').toLowerCase() === 'cancelled' || (ord.status || '').toLowerCase() === 'canceled';
                          const isPaid = ((ord.status || '').toLowerCase() === 'delivered' && isCod) || (ord.payment_status || '').toLowerCase() === 'paid';

                          if (isCancelled && isCod && !isPaid) {
                            return <span className="text-neutral-400 text-xs font-mono">—</span>;
                          }

                          const displayPaymentStatus = isPaid
                            ? 'Paid'
                            : (ord.payment_status || 'Pending');

                          return (
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getPaymentStatusPill(
                                displayPaymentStatus
                              )}`}
                            >
                              {displayPaymentStatus}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {!ordersLoading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-neutral-50/50 text-xs font-sans">
            <div className="flex items-center gap-3 text-neutral-500">
              <span>
                Showing <strong className="font-semibold text-neutral-900">{(currentPage - 1) * limit + 1}</strong>–
                <strong className="font-semibold text-neutral-900">{Math.min(currentPage * limit, totalOrders)}</strong> of{' '}
                <strong className="font-semibold text-neutral-900">{totalOrders}</strong> orders (Page {currentPage} of {totalPages})
              </span>
              <span className="text-neutral-300">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-neutral-400">Rows:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-neutral-200 text-neutral-800 text-[11px] rounded-lg px-2 py-1 focus:outline-hidden font-semibold cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-neutral-200 rounded-lg text-neutral-600 hover:bg-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors font-semibold uppercase tracking-wider text-[11px]"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((p, idx) => {
                  if (p === '...') {
                    return (
                      <span
                        key={`admin-order-ellipsis-${idx}`}
                        className="w-7 text-center text-neutral-400 font-bold text-xs select-none"
                      >
                        ...
                      </span>
                    );
                  }
                  const isActive = p === currentPage;
                  return (
                    <button
                      key={`admin-order-page-${p}`}
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      className={`min-w-8 h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-brand-dark text-white shadow-xs'
                          : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100 hover:text-black'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-neutral-200 rounded-lg text-neutral-600 hover:bg-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors font-semibold uppercase tracking-wider text-[11px]"
                title="Next Page"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
      </>
      )}

      {/* Order Details Modal */}
      <OrderDetailModal
        orderId={selectedOrderIdForDetail}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onOptimisticPreview={handleOptimisticPreview}
        onStatusUpdated={handleOrderUpdatedInList}
        onOrderUpdated={handleOrderUpdatedInList}
        isShiprocketDesk={activeViewTab === 'shiprocket'}
        isRefundDesk={false}
        onSwitchToShiprocketDesk={() => {
          setIsDetailModalOpen(false);
          handleTabChange('shiprocket');
        }}
      />
    </div>
  );
};
