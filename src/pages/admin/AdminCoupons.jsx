import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  Tag,
  LayoutGrid,
  List,
  CheckCircle2,
  XCircle,
  Edit3,
  Trash2,
  UserCheck,
  Calendar,
  Lock,
  Loader2,
  Users,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import couponService from '../../services/couponService';
import { CouponModal } from '../../components/admin/CouponModal';
import { AssignCustomersModal } from '../../components/admin/AssignCustomersModal';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';

export const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [categoriesMap, setCategoriesMap] = useState({});
  const [productsMap, setProductsMap] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // View Mode: 'grid' (default) or 'list' persisted in localStorage
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('admin_coupons_view_mode') || 'grid';
    } catch {
      return 'grid';
    }
  });

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('admin_coupons_view_mode', mode);
    } catch {
      // Ignore storage errors
    }
  };

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, ending_soon, expired, inactive, used_up
  const [visibilityFilter, setVisibilityFilter] = useState('all'); // all, public, private

  // Sorting: default newest first ('created_at' desc)
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [selectedCouponForEdit, setSelectedCouponForEdit] = useState(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedCouponForAssign, setSelectedCouponForAssign] = useState(null);

  const [deleteTargetCoupon, setDeleteTargetCoupon] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Auto-dismiss toast after 4s
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch Coupons, Categories, Products
  const fetchCouponsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [couponsRes, catRes, prodRes] = await Promise.all([
        couponService.getCoupons(),
        apiClient('/api/categories').catch(() => []),
        apiClient('/api/products?limit=200').catch(() => ({ data: [] }))
      ]);

      const couponList = Array.isArray(couponsRes) ? couponsRes : (couponsRes?.data || []);
      const catList = Array.isArray(catRes) ? catRes : (catRes?.data || []);
      const prodList = Array.isArray(prodRes) ? prodRes : (prodRes?.data || prodRes?.products || []);

      // Build lookup maps for categories & products
      const cMap = {};
      catList.forEach((c) => {
        cMap[c.id || c.category_id] = c.name;
      });

      const pMap = {};
      prodList.forEach((p) => {
        pMap[p.id] = p.title || p.productname || p.name;
      });

      setCoupons(couponList);
      setCategoriesMap(cMap);
      setProductsMap(pMap);
    } catch (err) {
      console.error('Failed to load coupons:', err);
      setError("Couldn't load coupons. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCouponsData();
  }, [fetchCouponsData]);

  // ── Helper: Shared Status Evaluator ────────────────────────────────────────
  const getCouponStatusDetails = useCallback((cpn) => {
    const isInactive = !cpn.active;
    const now = new Date();
    const rawExpiry = cpn.expires_at || cpn.expiry_date;
    const isExpired = rawExpiry && new Date(rawExpiry) <= now;

    const rawStart = cpn.starts_at;
    const isScheduled = rawStart && new Date(rawStart) > now;

    const timesUsed = parseInt(cpn.times_used || cpn.used_count || 0, 10);
    const usageLimit = cpn.usage_limit ? parseInt(cpn.usage_limit, 10) : null;
    const isUsedUp = Boolean(usageLimit && usageLimit > 0 && timesUsed >= usageLimit);

    if (isExpired) {
      return {
        key: 'expired',
        label: 'Expired',
        badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
        accentBorder: 'border-l-rose-500',
        canToggle: false,
        disabledReason: 'This coupon has expired. Extend the end date to reactivate.'
      };
    }
    if (isUsedUp) {
      return {
        key: 'used_up',
        label: 'Used Up',
        badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
        accentBorder: 'border-l-rose-500',
        canToggle: true,
        disabledReason: null
      };
    }
    if (isScheduled) {
      return {
        key: 'scheduled',
        label: 'Scheduled',
        badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
        accentBorder: 'border-l-blue-500',
        canToggle: true,
        disabledReason: null
      };
    }
    if (isInactive) {
      return {
        key: 'inactive',
        label: 'Inactive',
        badgeBg: 'bg-neutral-100 text-neutral-600 border-neutral-200',
        accentBorder: 'border-l-neutral-400',
        canToggle: true,
        disabledReason: null
      };
    }

    // Check if ending within 7 days
    if (rawExpiry) {
      const daysLeft = Math.ceil((new Date(rawExpiry) - now) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 7 && daysLeft > 0) {
        return {
          key: 'ending_soon',
          label: 'Ends Soon',
          badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
          accentBorder: 'border-l-amber-500',
          canToggle: true,
          disabledReason: null
        };
      }
    }

    return {
      key: 'active',
      label: 'Active',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      accentBorder: 'border-l-brand-dark',
      canToggle: true,
      disabledReason: null
    };
  }, []);

  // Check if any filter is active
  const isFilterActive = useMemo(() => {
    return Boolean(searchQuery.trim()) || statusFilter !== 'all' || visibilityFilter !== 'all';
  }, [searchQuery, statusFilter, visibilityFilter]);

  // Reset Filters Action
  const handleClearFilters = () => {
    if (!isFilterActive) return;
    setSearchQuery('');
    setStatusFilter('all');
    setVisibilityFilter('all');
    setCurrentPage(1);
  };

  // Filter & Sort Coupons List
  const filteredCoupons = useMemo(() => {
    let list = coupons.filter((cpn) => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchCode = (cpn.code || '').toLowerCase().includes(q);
        const matchDesc = (cpn.description || '').toLowerCase().includes(q);
        if (!matchCode && !matchDesc) return false;
      }

      // 2. Visibility Filter
      if (visibilityFilter === 'public' && cpn.is_restricted) return false;
      if (visibilityFilter === 'private' && !cpn.is_restricted) return false;

      // 3. Status Filter
      if (statusFilter !== 'all') {
        const st = getCouponStatusDetails(cpn).key;
        if (statusFilter === 'active' && st !== 'active' && st !== 'ending_soon') return false;
        if (statusFilter === 'ending_soon' && st !== 'ending_soon') return false;
        if (statusFilter === 'expired' && st !== 'expired') return false;
        if (statusFilter === 'inactive' && st !== 'inactive') return false;
        if (statusFilter === 'used_up' && st !== 'used_up') return false;
      }

      return true;
    });

    // Apply Sorting
    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'code') {
        valA = (a.code || '').toUpperCase();
        valB = (b.code || '').toUpperCase();
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      if (sortField === 'value') {
        valA = parseFloat(a.discount_value) || 0;
        valB = parseFloat(b.discount_value) || 0;
      } else if (sortField === 'expiry') {
        valA = new Date(a.expires_at || a.expiry_date || 0).getTime();
        valB = new Date(b.expires_at || b.expiry_date || 0).getTime();
      } else if (sortField === 'usage') {
        valA = parseInt(a.times_used || a.used_count || 0, 10);
        valB = parseInt(b.times_used || b.used_count || 0, 10);
      } else if (sortField === 'status') {
        valA = getCouponStatusDetails(a).key;
        valB = getCouponStatusDetails(b).key;
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (sortField === 'created_at') {
        valA = new Date(a.created_at || 0).getTime();
        valB = new Date(b.created_at || 0).getTime();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [coupons, searchQuery, statusFilter, visibilityFilter, sortField, sortOrder, getCouponStatusDetails]);

  // Handle Sort Header Click
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Pagination Calculations
  const totalPages = Math.max(1, Math.ceil(filteredCoupons.length / pageSize));
  const paginatedCoupons = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCoupons.slice(start, start + pageSize);
  }, [filteredCoupons, currentPage, pageSize]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, visibilityFilter]);

  // Summary Strip Stats
  const stats = useMemo(() => {
    const total = coupons.length;
    let active = 0;
    let restricted = 0;
    let expiredOrEnded = 0;

    coupons.forEach((c) => {
      const st = getCouponStatusDetails(c).key;
      if (st === 'active' || st === 'ending_soon') active++;
      if (c.is_restricted) restricted++;
      if (st === 'expired' || st === 'used_up') expiredOrEnded++;
    });

    return { total, active, restricted, expiredOrEnded };
  }, [coupons, getCouponStatusDetails]);

  // Toggle Active Status Action
  const handleToggleStatus = async (e, cpn) => {
    e.stopPropagation();
    const st = getCouponStatusDetails(cpn);
    if (!st.canToggle) return;
    if (togglingId === cpn.id) return;

    setTogglingId(cpn.id);

    // Optimistic UI update
    setCoupons((prev) =>
      prev.map((c) => (c.id === cpn.id ? { ...c, active: !c.active } : c))
    );

    try {
      const res = await couponService.toggleCouponStatus(cpn.id);
      const updated = res?.data || res;
      setCoupons((prev) =>
        prev.map((c) => (c.id === cpn.id ? { ...c, active: Boolean(updated.active) } : c))
      );
      setToast({ type: 'success', message: `Coupon ${cpn.code} status updated successfully.` });
    } catch (err) {
      console.error('Toggle status failed:', err);
      // Revert optimistic update
      setCoupons((prev) =>
        prev.map((c) => (c.id === cpn.id ? { ...c, active: !c.active } : c))
      );
      setToast({ type: 'error', message: err.message || 'Failed to update coupon status.' });
    } finally {
      setTogglingId(null);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setSelectedCouponForEdit(null);
    setIsCouponModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (cpn) => {
    setSelectedCouponForEdit(cpn);
    setIsCouponModalOpen(true);
  };

  // Callback when Coupon Saved (Create or Edit)
  const handleCouponSaved = (savedCoupon, isEdit) => {
    if (isEdit) {
      setCoupons((prev) =>
        prev.map((c) => (c.id === savedCoupon.id ? { ...c, ...savedCoupon } : c))
      );
      setToast({ type: 'success', message: `Coupon ${savedCoupon.code} updated successfully.` });
    } else {
      setCoupons((prev) => [savedCoupon, ...prev]);
      setToast({ type: 'success', message: `Coupon ${savedCoupon.code} created successfully.` });
      // Step 2: Open Assign Coupon popup immediately after coupon creation
      setSelectedCouponForAssign(savedCoupon);
      setIsAssignModalOpen(true);
    }
    fetchCouponsData(); // Sync stats & relations
  };

  // Open Assign Modal
  const handleOpenAssignModal = (e, cpn) => {
    e.stopPropagation();
    setSelectedCouponForAssign(cpn);
    setIsAssignModalOpen(true);
  };

  // Callback when Assignment Updated
  const handleAssignmentUpdated = (couponId, newCount) => {
    setCoupons((prev) =>
      prev.map((c) => (c.id === couponId ? { ...c, assigned_count: newCount } : c))
    );
  };

  // Confirm Delete Action
  const handleConfirmDelete = async () => {
    if (!deleteTargetCoupon) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await couponService.deleteCoupon(deleteTargetCoupon.id);

      setCoupons((prev) => prev.filter((c) => c.id !== deleteTargetCoupon.id));
      setToast({ type: 'success', message: `Coupon ${deleteTargetCoupon.code} deleted successfully.` });
      setDeleteTargetCoupon(null);
    } catch (err) {
      console.error('Delete failed:', err);
      setDeleteError(err.message || 'Failed to delete coupon from server.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper: Format Type Display
  const renderTypeDisplay = (cpn) => {
    if (cpn.discount_type === 'percentage') return 'Percentage';
    if (cpn.discount_type === 'fixed') return 'Fixed Amount';
    if (cpn.discount_type === 'bogo') return 'BOGO';
    return cpn.discount_type || 'Percentage';
  };

  // Helper: Format Scope Pill & Hover Tooltip
  const renderScopeCell = (cpn) => {
    const scope = cpn.applies_to || cpn.apply_to || 'all';

    if (scope === 'categories' || scope === 'category') {
      const ids = Array.isArray(cpn.category_ids) ? cpn.category_ids : (cpn.category_id ? [cpn.category_id] : []);
      if (ids.length === 0) {
        return (
          <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-800 border-amber-200 font-sans">
            No eligible items
          </span>
        );
      }

      const names = ids.map((id) => categoriesMap[id] || `Category #${id}`);
      const first5 = names.slice(0, 5).join(', ');
      const extraCount = names.length > 5 ? ` +${names.length - 5} more` : '';
      const tooltipText = `Eligible Categories: ${first5}${extraCount}`;

      return (
        <span
          title={tooltipText}
          className="inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full border bg-neutral-100 text-neutral-700 border-neutral-200 cursor-help font-sans"
        >
          Categories ({ids.length})
        </span>
      );
    }

    if (scope === 'products' || scope === 'product') {
      const ids = Array.isArray(cpn.product_ids) ? cpn.product_ids : (cpn.product_id ? [cpn.product_id] : []);
      if (ids.length === 0) {
        return (
          <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-800 border-amber-200 font-sans">
            No eligible items
          </span>
        );
      }

      const names = ids.map((id) => productsMap[id] || `Product #${id}`);
      const first5 = names.slice(0, 5).join(', ');
      const extraCount = names.length > 5 ? ` +${names.length - 5} more` : '';
      const tooltipText = `Eligible Products: ${first5}${extraCount}`;

      return (
        <span
          title={tooltipText}
          className="inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full border bg-neutral-100 text-neutral-700 border-neutral-200 cursor-help font-sans"
        >
          Products ({ids.length})
        </span>
      );
    }

    return (
      <span className="inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full border bg-neutral-100 text-neutral-700 border-neutral-200 font-sans">
        All Products
      </span>
    );
  };

  // Helper: Format Discount Value & Subtext
  const renderValueCell = (cpn) => {
    let mainValStr = '';
    if (cpn.discount_type === 'percentage') {
      mainValStr = `${parseFloat(cpn.discount_value)}%`;
    } else if (cpn.discount_type === 'fixed') {
      mainValStr = `₹${parseFloat(cpn.discount_value).toLocaleString('en-IN')}`;
    } else if (cpn.discount_type === 'bogo') {
      mainValStr = 'BUY 1 GET 1';
    } else {
      mainValStr = `${cpn.discount_value}`;
    }

    const hasMaxCap = cpn.discount_type === 'percentage' && cpn.max_discount && parseFloat(cpn.max_discount) > 0;
    const hasMinOrder = cpn.min_order_value && parseFloat(cpn.min_order_value) > 0;

    return (
      <div>
        <div className="font-bold text-brand-dark text-xs">{mainValStr}</div>
        {(hasMaxCap || hasMinOrder) && (
          <div className="text-[10.5px] text-neutral-400 font-sans space-y-0.2 mt-0.5">
            {hasMaxCap && <div>Max ₹{parseFloat(cpn.max_discount).toLocaleString('en-IN')}</div>}
            {hasMinOrder && <div>Min order ₹{parseFloat(cpn.min_order_value).toLocaleString('en-IN')}</div>}
          </div>
        )}
      </div>
    );
  };

  // Helper: Format Expiry Date & Subtext + Tooltip
  const renderExpiryCell = (cpn) => {
    const rawStart = cpn.starts_at;
    const rawExpiry = cpn.expires_at || cpn.expiry_date;

    const formatIST = (dateStr) => {
      if (!dateStr) return 'N/A';
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return 'N/A';
        return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST';
      } catch {
        return String(dateStr);
      }
    };

    const tooltipText = `Starts: ${formatIST(rawStart)}\nExpires: ${formatIST(rawExpiry)}`;

    const dateDisplay = rawExpiry ? new Date(rawExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No Expiry';

    // Relative subtext calculation
    let relativeSubtext = null;
    if (rawExpiry) {
      const now = new Date();
      const expDate = new Date(rawExpiry);
      const diffMs = expDate - now;
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffMs < 0) {
        const pastDays = Math.abs(diffDays);
        relativeSubtext = `Expired ${pastDays} day${pastDays === 1 ? '' : 's'} ago`;
      } else if (diffDays <= 7) {
        relativeSubtext = `Ends in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
      }
    }

    return (
      <div title={tooltipText} className="cursor-help font-sans">
        <div className="font-semibold text-brand-dark text-xs">{dateDisplay}</div>
        {relativeSubtext && (
          <div className="text-[10.5px] text-neutral-400 mt-0.5">{relativeSubtext}</div>
        )}
      </div>
    );
  };

  // Helper: Render Usage Bar
  const renderUsageCell = (cpn) => {
    const timesUsed = parseInt(cpn.times_used || cpn.used_count || 0, 10);
    const usageLimit = cpn.usage_limit ? parseInt(cpn.usage_limit, 10) : null;

    if (!usageLimit) {
      return <div className="font-sans text-xs text-neutral-700">{timesUsed} / ∞</div>;
    }

    const pct = Math.min(100, Math.round((timesUsed / usageLimit) * 100));
    let barColor = 'bg-brand-dark';
    if (pct >= 100) barColor = 'bg-rose-500';
    else if (pct >= 80) barColor = 'bg-amber-500';

    return (
      <div className="space-y-1 font-sans">
        <div className="text-xs font-semibold text-brand-dark">
          {timesUsed} / {usageLimit}
        </div>
        <div className="w-20 h-1 bg-neutral-100 rounded-full overflow-hidden">
          <div className={`h-full transition-all duration-300 ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12 font-admin">
      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-xs font-admin border transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
            toast.type === 'success'
              ? 'bg-brand-dark text-white border-neutral-800'
              : 'bg-brand-dark text-rose-100 border-rose-950'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-brand-gold shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="font-admin tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* Shared Create / Edit Coupon Modal */}
      <CouponModal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        coupon={selectedCouponForEdit}
        onCouponSaved={handleCouponSaved}
      />

      {/* Shared Assign Customers Modal */}
      <AssignCustomersModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        coupon={selectedCouponForAssign}
        onAssignmentUpdated={handleAssignmentUpdated}
      />

      {/* Delete Confirmation Modal */}
      {deleteTargetCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200 font-admin">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-neutral-200 p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-brand-dark">
                Delete Coupon — <span className="font-mono">{deleteTargetCoupon.code}</span>
              </h3>
              <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed">
                Are you sure you want to delete this coupon? This action cannot be undone.
              </p>
              {(deleteTargetCoupon.times_used > 0 || deleteTargetCoupon.used_count > 0) && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 text-left flex items-start gap-2 font-sans">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Notice:</strong> This coupon has been used in <strong>{deleteTargetCoupon.times_used || deleteTargetCoupon.used_count} orders</strong>. Deleting it may alter past transaction audit logs. Consider deactivating it instead.
                  </span>
                </div>
              )}
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 text-left font-sans">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2 font-sans">
              <button
                type="button"
                onClick={() => {
                  setDeleteTargetCoupon(null);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2.5 border border-neutral-200 text-neutral-600 rounded-xl text-xs font-semibold hover:bg-neutral-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-colors flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Confirm Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. PAGE HEADER BANNER                                                     */}
      {/* ========================================================================= */}
      <AdminPageHeader
        title="Coupons Management"
        subtitle="Manage discount codes, promotional campaigns and targeted customer access."
        actions={
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 bg-brand-dark text-white hover:bg-black text-xs font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-sm shrink-0 cursor-pointer text-center"
          >
            <Plus className="w-4 h-4" />
            <span>Create Coupon</span>
          </button>
        }
      />

      {/* ========================================================================= */}
      {/* 2. SUMMARY STRIP (COMPACT STAT CARDS)                                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 font-sans">
        <div className="bg-white border border-neutral-200/80 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
            Total Coupons
          </div>
          <div className="text-xl sm:text-2xl font-bold text-brand-dark mt-1 font-admin">
            {stats.total}
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center justify-between">
            <span>Active</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1 font-admin">
            {stats.active}
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center justify-between">
            <span>Private</span>
            <Lock className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-brand-dark mt-1 font-admin">
            {stats.restricted}
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center justify-between">
            <span>Expired / Ended</span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-700 mt-1 font-admin">
            {stats.expiredOrEnded}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TOOLBAR ROW (SEARCH, FILTERS, VIEW TOGGLE & CLEAR FILTERS)             */}
      {/* ========================================================================= */}
      <div className="bg-white border border-neutral-200/80 rounded-xl p-4 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 font-sans">
        {/* Search & Select Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by coupon code or description..."
              className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-brand-dark placeholder-neutral-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-dark transition-all font-admin"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-neutral-50 border border-neutral-200 text-brand-dark text-xs rounded-xl px-3 py-2 focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-dark transition-all font-medium cursor-pointer font-admin"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="ending_soon">Ending Soon</option>
            <option value="expired">Expired</option>
            <option value="inactive">Inactive</option>
            <option value="used_up">Used Up</option>
          </select>

          {/* Visibility Filter */}
          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value)}
            className="bg-neutral-50 border border-neutral-200 text-brand-dark text-xs rounded-xl px-3 py-2 focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-dark transition-all font-medium cursor-pointer font-admin"
          >
            <option value="all">All Visibilities</option>
            <option value="public">Public Only</option>
            <option value="private">Private Only</option>
          </select>

          {/* Clear Filters Button (Always Visible, Red X Icon when Active) */}
          <button
            type="button"
            onClick={handleClearFilters}
            aria-label="Clear filters"
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-1 transition-all cursor-pointer shadow-2xs"
            title={isFilterActive ? 'Reset all search and filters' : 'Clear filters'}
          >
            <X className={`w-3.5 h-3.5 transition-colors duration-200 ${isFilterActive ? 'text-rose-600' : 'text-neutral-500'}`} />
            <span>Clear Filters</span>
          </button>
        </div>

        {/* View Mode Toggle Switch */}
        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl shrink-0 self-end lg:self-auto border border-neutral-200/60 font-admin">
          <button
            type="button"
            onClick={() => handleSetViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white text-brand-dark shadow-2xs font-semibold'
                : 'text-neutral-500 hover:text-brand-dark'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Grid</span>
          </button>

          <button
            type="button"
            onClick={() => handleSetViewMode('list')}
            className={`p-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white text-brand-dark shadow-2xs font-semibold'
                : 'text-neutral-500 hover:text-brand-dark'
            }`}
            title="List View"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">List</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MAIN CONTENT AREA (GRID OR LIST)                                       */}
      {/* ========================================================================= */}

      {/* Error State Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-800 font-sans">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchCouponsData}
            className="px-3.5 py-1.5 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-2xs space-y-4 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="h-5 w-24 bg-neutral-200 rounded" />
                  <div className="h-4 w-16 bg-neutral-200 rounded-full" />
                </div>
                <div className="h-7 w-32 bg-neutral-200 rounded" />
                <div className="h-4 w-40 bg-neutral-100 rounded" />
                <div className="pt-3 border-t border-neutral-100 flex justify-between items-center">
                  <div className="h-4 w-20 bg-neutral-100 rounded" />
                  <div className="h-6 w-16 bg-neutral-200 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-neutral-200/80 rounded-xl shadow-sm overflow-hidden font-admin">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="bg-neutral-50/80 text-[11px] font-semibold tracking-wider text-neutral-500 uppercase border-b border-neutral-200/80 font-admin">
                    <th className="py-3.5 px-4">Code</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Scope</th>
                    <th className="py-3.5 px-4">Value</th>
                    <th className="py-3.5 px-4">Expiry</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-center">Assign</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200/60">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3.5 px-4">
                        <div className="h-4 bg-neutral-200 rounded w-24" />
                        <div className="h-3 bg-neutral-100 rounded w-32 mt-1" />
                      </td>
                      <td className="py-3.5 px-4"><div className="h-4 bg-neutral-200 rounded w-16" /></td>
                      <td className="py-3.5 px-4"><div className="h-5 bg-neutral-200 rounded-full w-20" /></td>
                      <td className="py-3.5 px-4"><div className="h-4 bg-neutral-200 rounded w-14" /></td>
                      <td className="py-3.5 px-4"><div className="h-4 bg-neutral-200 rounded w-20" /></td>
                      <td className="py-3.5 px-4"><div className="h-5 bg-neutral-200 rounded-full w-20" /></td>
                      <td className="py-3.5 px-4 text-center"><div className="h-6 w-12 bg-neutral-200 rounded-lg mx-auto" /></td>
                      <td className="py-3.5 px-4 text-right"><div className="h-6 w-14 bg-neutral-200 rounded-lg ml-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : filteredCoupons.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-neutral-200 rounded-2xl p-10 text-center space-y-3 shadow-2xs font-sans">
          <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
            <Tag className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider font-admin">
            {isFilterActive ? 'No coupons match your filters' : 'No coupons created yet'}
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {isFilterActive
              ? 'Try changing your search terms or resetting status/visibility filters.'
              : 'Create promotional discount codes and coupons to incentivize orders.'}
          </p>
          {isFilterActive ? (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center justify-center gap-2 px-7 sm:px-8 py-2.5 min-w-[210px] bg-brand-dark text-white hover:bg-black text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-sm text-center"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Coupon</span>
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* ── GRID VIEW CARDS ───────────────────────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedCoupons.map((cpn) => {
            const st = getCouponStatusDetails(cpn);
            const timesUsed = parseInt(cpn.times_used || cpn.used_count || 0, 10);
            const assignedStr = cpn.is_restricted ? (cpn.assigned_count || 0) : 'All Users';

            return (
              <div
                key={cpn.id}
                onClick={() => handleOpenEditModal(cpn)}
                className={`bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-neutral-300 transition-all cursor-pointer flex flex-col justify-between group relative border-l-4 ${st.accentBorder}`}
              >
                {/* ── CARD HEADER: Icon + Code + Scope on Left | Status Badge + Toggle on Right ── */}
                <div className="flex items-start justify-between gap-3 pb-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-neutral-100 text-brand-dark border border-neutral-200 shrink-0 mt-0.5">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-base text-brand-dark tracking-wide truncate">
                          {cpn.code}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${
                            cpn.is_restricted
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {cpn.is_restricted ? 'Private' : 'Public'}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-500 font-medium mt-1 font-sans">
                        {renderScopeCell(cpn)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border tracking-wide uppercase font-sans ${st.badgeBg}`}>
                      {st.label}
                    </span>

                    {/* Active Toggle Switch */}
                    {togglingId === cpn.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-neutral-500 shrink-0" />
                    ) : (
                      <label
                        className="relative inline-flex items-center cursor-pointer shrink-0"
                        title={st.disabledReason || (cpn.active ? 'Deactivate coupon' : 'Activate coupon')}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(cpn.active)}
                          disabled={!st.canToggle}
                          onChange={(e) => handleToggleStatus(e, cpn)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-dark peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                      </label>
                    )}
                  </div>
                </div>

                {/* ── CARD BODY: Discount Display on Left | Expiry Date on Right ── */}
                <div className="py-2.5 border-t border-neutral-100 flex items-baseline justify-between gap-3">
                  <div>
                    {renderValueCell(cpn)}
                    {cpn.description && (
                      <div className="text-[11px] text-neutral-500 font-sans mt-1 line-clamp-1 italic">
                        {cpn.description}
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    {renderExpiryCell(cpn)}
                  </div>
                </div>

                {/* ── CARD FOOTER: Assigned & Used Count on Left | Actions on Right ── */}
                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2 text-xs font-sans">
                  <div className="text-neutral-600 font-medium text-[11px] truncate">
                    <span>Assigned: <strong className="text-brand-dark">{assignedStr}</strong></span>
                    <span className="mx-1.5 text-neutral-300">•</span>
                    <span>Used: <strong className="text-brand-dark">{timesUsed}</strong></span>
                  </div>

                  {/* Quick Card Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {cpn.is_restricted && (
                      <button
                        type="button"
                        onClick={(e) => handleOpenAssignModal(e, cpn)}
                        aria-label={`Assign customers to ${cpn.code}`}
                        className="px-2.5 py-1 rounded-lg text-brand-dark bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                        title="Assign customers to private coupon"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-neutral-600" />
                        <span>Assign</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(cpn)}
                      aria-label={`Edit coupon ${cpn.code}`}
                      className="p-1 rounded-lg text-neutral-400 hover:text-brand-dark transition-colors cursor-pointer"
                      title="Edit coupon"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTargetCoupon(cpn)}
                      aria-label={`Delete coupon ${cpn.code}`}
                      className="p-1 rounded-lg text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete coupon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── LIST VIEW TABLE (RESHAPED TO EXACT 8 COLUMNS) ─────────────────── */
        <div className="bg-white border border-neutral-200/80 rounded-xl shadow-sm overflow-hidden font-admin">
          {/* Table Header Count Bar */}
          <div className="px-6 py-3.5 border-b border-neutral-200/80 flex items-center justify-between bg-neutral-50/50">
            <h2 className="text-xs font-semibold tracking-wider text-brand-dark uppercase">
              Coupons List <span className="ml-1 px-2 py-0.5 bg-neutral-200/60 rounded-full text-neutral-700 text-[11px]">{filteredCoupons.length}</span>
            </h2>
            {isFilterActive && (
              <span className="text-[11px] text-neutral-500 font-sans">
                Filtered view
              </span>
            )}
          </div>

          <div className="overflow-x-auto relative">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-neutral-50/80 text-[11px] font-semibold tracking-wider text-neutral-500 uppercase border-b border-neutral-200/80 font-admin">
                  
                  {/* Column 1: Code (Sortable, Sticky Left) */}
                  <th
                    scope="col"
                    aria-sort={sortField === 'code' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className="py-3.5 px-4 sticky left-0 bg-neutral-50/95 z-20 shadow-2xs min-w-[170px]"
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('code')}
                      className="flex items-center gap-1.5 hover:text-brand-dark cursor-pointer text-left font-semibold"
                    >
                      <span>Code</span>
                      {sortField === 'code' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-brand-dark" /> : <ArrowDown className="w-3.5 h-3.5 text-brand-dark" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                      )}
                    </button>
                  </th>

                  {/* Column 2: Type */}
                  <th scope="col" className="py-3.5 px-4 min-w-[110px]">Type</th>

                  {/* Column 3: Scope */}
                  <th scope="col" className="py-3.5 px-4 min-w-[140px]">Scope</th>

                  {/* Column 4: Value (Sortable) */}
                  <th
                    scope="col"
                    aria-sort={sortField === 'value' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className="py-3.5 px-4 min-w-[130px]"
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('value')}
                      className="flex items-center gap-1.5 hover:text-brand-dark cursor-pointer text-left font-semibold"
                    >
                      <span>Value</span>
                      {sortField === 'value' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-brand-dark" /> : <ArrowDown className="w-3.5 h-3.5 text-brand-dark" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                      )}
                    </button>
                  </th>

                  {/* Column 5: Expiry (Sortable) */}
                  <th
                    scope="col"
                    aria-sort={sortField === 'expiry' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className="py-3.5 px-4 min-w-[140px]"
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('expiry')}
                      className="flex items-center gap-1.5 hover:text-brand-dark cursor-pointer text-left font-semibold"
                    >
                      <span>Expiry</span>
                      {sortField === 'expiry' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-brand-dark" /> : <ArrowDown className="w-3.5 h-3.5 text-brand-dark" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                      )}
                    </button>
                  </th>

                  {/* Column 6: Status (Sortable) */}
                  <th
                    scope="col"
                    aria-sort={sortField === 'status' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className="py-3.5 px-4 min-w-[140px]"
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('status')}
                      className="flex items-center gap-1.5 hover:text-brand-dark cursor-pointer text-left font-semibold"
                    >
                      <span>Status</span>
                      {sortField === 'status' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-brand-dark" /> : <ArrowDown className="w-3.5 h-3.5 text-brand-dark" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                      )}
                    </button>
                  </th>

                  {/* Column 7: Assign */}
                  <th scope="col" className="py-3.5 px-4 min-w-[120px] text-center">Assign</th>

                  {/* Column 8: Actions */}
                  <th scope="col" className="py-3.5 px-4 min-w-[100px] text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-200/60 text-xs text-brand-dark">
                {paginatedCoupons.map((cpn) => {
                  const st = getCouponStatusDetails(cpn);
                  const isPrivate = Boolean(cpn.is_restricted || cpn.is_private);
                  const visText = isPrivate ? 'Private' : 'Public';

                  const timesUsed = parseInt(cpn.times_used || cpn.used_count || 0, 10);
                  const usageLimit = cpn.usage_limit ? parseInt(cpn.usage_limit, 10) : null;
                  const usageText = usageLimit ? `Used ${timesUsed} / ${usageLimit}` : `Used ${timesUsed}`;
                  const codeSubtext = `${visText} · ${usageText}`;

                  return (
                    <tr
                      key={cpn.id}
                      onClick={() => handleOpenEditModal(cpn)}
                      className="hover:bg-neutral-50/80 transition-colors group cursor-pointer"
                    >
                      {/* Column 1: Code (Bold Uppercase + Visibility & Usage Subtext + Description Tooltip) */}
                      <td className="py-3.5 px-4 sticky left-0 bg-white group-hover:bg-neutral-50/90 z-10 shadow-2xs">
                        <div title={cpn.description || undefined} className="min-w-0 cursor-help">
                          <div className="font-mono font-bold text-brand-dark text-xs tracking-wide uppercase">
                            {cpn.code}
                          </div>
                          <div className="text-[11px] text-neutral-500 font-sans mt-0.5 whitespace-nowrap">
                            {codeSubtext}
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Type ("Percentage" or "Fixed") */}
                      <td className="py-3.5 px-4 text-neutral-700 font-medium font-sans">
                        {renderTypeDisplay(cpn)}
                      </td>

                      {/* Column 3: Scope ("All Products", "Category (N)", or "Product (N)") */}
                      <td className="py-3.5 px-4">
                        {renderScopeCell(cpn)}
                      </td>

                      {/* Column 4: Value (Bold Value + Max Cap / Min Order Subtext) */}
                      <td className="py-3.5 px-4">
                        {renderValueCell(cpn)}
                      </td>

                      {/* Column 5: Expiry (Formatted Date + IST Tooltip) */}
                      <td className="py-3.5 px-4">
                        {renderExpiryCell(cpn)}
                      </td>

                      {/* Column 6: Status (Toggle + Label Pill) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5 font-sans">
                          {togglingId === cpn.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-neutral-500 shrink-0" />
                          ) : (
                            <label
                              className="relative inline-flex items-center cursor-pointer shrink-0"
                              title={st.disabledReason || (cpn.active ? 'Deactivate coupon' : 'Activate coupon')}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={Boolean(cpn.active)}
                                disabled={!st.canToggle}
                                onChange={(e) => handleToggleStatus(e, cpn)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-dark peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                            </label>
                          )}

                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border tracking-wide uppercase shrink-0 ${st.badgeBg}`}>
                            {st.label}
                          </span>
                        </div>
                      </td>

                      {/* Column 7: Assign (Private: Icon Button with Count | Public: "All customers") */}
                      <td className="py-3.5 px-4 text-center font-sans">
                        {isPrivate ? (
                          <button
                            type="button"
                            onClick={(e) => handleOpenAssignModal(e, cpn)}
                            aria-label={`Assign customers to coupon ${cpn.code}`}
                            title="Assign customers to private coupon"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-brand-dark bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 transition-colors cursor-pointer text-xs font-semibold"
                          >
                            <Users className="w-3.5 h-3.5 text-neutral-600" />
                            <span>{cpn.assigned_count || 0}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-neutral-400 font-medium">All customers</span>
                        )}
                      </td>

                      {/* Column 8: Actions (Edit Pencil & Delete Trash Icon Buttons) */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2 font-sans justify-end" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(cpn)}
                            aria-label={`Edit coupon ${cpn.code}`}
                            title="Edit coupon"
                            className="p-1 rounded-lg text-neutral-400 hover:text-brand-dark transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTargetCoupon(cpn)}
                            aria-label={`Delete coupon ${cpn.code}`}
                            title="Delete coupon"
                            className="p-1 rounded-lg text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SHARED PAGINATION FOOTER                                               */}
      {/* ========================================================================= */}
      {!loading && filteredCoupons.length > 0 && totalPages > 1 && (
        <div className="bg-white border border-neutral-200/80 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 font-sans">
          <div className="text-xs text-neutral-500">
            Showing <strong className="text-brand-dark">{Math.min(filteredCoupons.length, (currentPage - 1) * pageSize + 1)}</strong> to{' '}
            <strong className="text-brand-dark">{Math.min(filteredCoupons.length, currentPage * pageSize)}</strong> of{' '}
            <strong className="text-brand-dark">{filteredCoupons.length}</strong> coupons
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-semibold text-brand-dark px-2">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
