import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Search, Award, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, Tag, Check, Send } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

// Number & Currency formatting helpers
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

// Date formatting helper
function formatDateTime(dateStr, fallbackStr) {
  if (fallbackStr && fallbackStr !== 'N/A') return fallbackStr;
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return fallbackStr || 'N/A';
    const dateFormatted = d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const timeFormatted = d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).toLowerCase();
    return `${dateFormatted}, ${timeFormatted}`;
  } catch (e) {
    return fallbackStr || 'N/A';
  }
}

export const TopCustomersModal = ({ isOpen, onClose, period = '30d' }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Coupon Assignment Secondary Step State
  const [targetCustomer, setTargetCustomer] = useState(null); // customer object being sent a coupon
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [couponError, setCouponError] = useState(null);
  const [selectedCouponId, setSelectedCouponId] = useState(null);
  const [sendingCoupon, setSendingCoupon] = useState(false);
  const [successToast, setSuccessToast] = useState(null);

  // Dynamic Period Subtitle Label
  const periodLabel = useMemo(() => {
    if (period === 'today') return 'Today';
    if (period === '7d') return 'Last 7 Days';
    if (period === '30d') return 'Last 30 Days';
    return 'Selected Period';
  }, [period]);

  // Fetch real Top Customers from database
  const fetchTopCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient(`/api/admin/analytics/top-users?period=${period}&limit=15`).catch(() => null);

      if (res && (res.success || Array.isArray(res.data) || Array.isArray(res))) {
        const userList = res.data || (Array.isArray(res) ? res : []);
        setUsers(userList);
      } else {
        throw new Error(res?.message || 'Failed to retrieve top customers.');
      }
    } catch (err) {
      console.error('[TopCustomersModal Error]:', err);
      setError(err.message || 'Unable to load top customers. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  }, [period]);

  // Fetch all store coupons for Send Coupon flow
  const fetchCoupons = useCallback(async () => {
    setLoadingCoupons(true);
    setCouponError(null);
    try {
      const res = await apiClient('/api/admin/coupons').catch(() => null);
      if (res && res.success && Array.isArray(res.data)) {
        setAvailableCoupons(res.data);
      } else if (Array.isArray(res)) {
        setAvailableCoupons(res);
      } else {
        throw new Error('Failed to load store coupons.');
      }
    } catch (err) {
      console.error('[FetchCoupons Error]:', err);
      setCouponError('Unable to load available coupons.');
    } finally {
      setLoadingCoupons(false);
    }
  }, []);

  // Open Coupon Assignment Flow for a Customer
  const handleOpenSendCoupon = (customer) => {
    setTargetCustomer(customer);
    setSelectedCouponId(null);
    setCouponError(null);
    fetchCoupons();
  };

  // Close Coupon Assignment Flow
  const handleCloseSendCoupon = () => {
    setTargetCustomer(null);
    setSelectedCouponId(null);
    setCouponError(null);
  };

  // Fetch data whenever main modal opens or period changes
  useEffect(() => {
    if (isOpen) {
      fetchTopCustomers();
      setSearchQuery('');
      setCurrentPage(1);
      setTargetCustomer(null);
      setSuccessToast(null);
    }
  }, [isOpen, fetchTopCustomers]);

  // Filtered top customers based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase().trim();
    return users.filter(u => {
      const name = (u.name || u.displayName || u.userId || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const phone = (u.phone || '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [users, searchQuery]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Pagination slicing
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Filter valid assignable coupons (active, private, not expired, usage limit not reached)
  const validAssignableCoupons = useMemo(() => {
    const now = new Date();
    return availableCoupons.filter(c => {
      // Must be active
      if (c.is_active === false || c.active === false) return false;
      // Must be private (restricted)
      if (!c.is_private && !c.is_restricted) return false;
      // Must not be expired
      const expDate = c.expires_at || c.expiry_date;
      if (expDate) {
        const d = new Date(expDate);
        if (!isNaN(d.getTime()) && d < now) return false;
      }
      // Must not be usage limit exhausted
      if (c.usage_limit && (c.times_used || c.used_count || 0) >= c.usage_limit) return false;
      return true;
    });
  }, [availableCoupons]);

  // Check if coupon is already assigned to current target customer
  const isCouponAssigned = (coupon, customer) => {
    if (!customer) return false;
    const customerId = (customer.userId || customer.id || customer.email || '').toLowerCase().trim();
    const assignedIds = (coupon.customer_ids || []).map(id => String(id).toLowerCase().trim());
    return assignedIds.includes(customerId);
  };

  // Submit Coupon Assignment
  const handleConfirmSendCoupon = async () => {
    if (!selectedCouponId) {
      setCouponError('Please select a coupon to assign.');
      return;
    }
    if (!targetCustomer) return;

    const chosenCoupon = availableCoupons.find(c => c.id === selectedCouponId);
    if (!chosenCoupon) {
      setCouponError('Selected coupon is no longer available.');
      return;
    }

    if (isCouponAssigned(chosenCoupon, targetCustomer)) {
      setCouponError(`"${chosenCoupon.code}" is already assigned to this customer.`);
      return;
    }

    setSendingCoupon(true);
    setCouponError(null);

    const userIdToAssign = targetCustomer.userId || targetCustomer.id || targetCustomer.username || targetCustomer.email;

    try {
      const res = await apiClient('/api/admin/targeting/assign-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couponId: chosenCoupon.id,
          userIds: [userIdToAssign]
        })
      });

      if (res && res.success) {
        const custName = targetCustomer.displayName || targetCustomer.name || 'Customer';
        setSuccessToast(`Coupon "${chosenCoupon.code}" successfully assigned to ${custName}!`);
        setTimeout(() => setSuccessToast(null), 4000);
        handleCloseSendCoupon();
        // Refresh users/coupons to update assignment state
        fetchTopCustomers();
      } else {
        throw new Error(res?.message || 'Failed to assign coupon.');
      }
    } catch (err) {
      console.error('[AssignCoupon Error]:', err);
      setCouponError(err.message || 'Failed to assign coupon. Please try again.');
    } finally {
      setSendingCoupon(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn font-admin">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[88vh] border border-neutral-200">
        
        {/* Success Toast Notification */}
        {successToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl border border-neutral-700 flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Modal Header matching Reference Layout */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between bg-white shrink-0 border-b border-neutral-100">
          <div>
            <h2 className="text-xl font-bold font-admin text-neutral-900 tracking-tight flex items-center gap-2">
              <span>Top Customers</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                Top {users.length}
              </span>
            </h2>
            <p className="text-xs text-neutral-500 font-sans mt-1">
              Top {users.length} customers by total revenue for {periodLabel}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchTopCustomers}
              disabled={loading}
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh top customers"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Circular close button matching House of Urvaah theme outline */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-neutral-300 hover:border-neutral-900 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Close modal"
            >
              <X className="w-4 h-4 stroke-[2]" />
            </button>
          </div>
        </div>

        {/* SECONDARY MODAL STEP: Send Coupon Selection Panel */}
        {targetCustomer ? (
          <div className="p-6 bg-neutral-50/50 flex-1 overflow-y-auto custom-modal-scrollbar">
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm max-w-2xl mx-auto space-y-5">
              
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-admin text-neutral-900">
                      Send Private Coupon
                    </h3>
                    <p className="text-xs text-neutral-500 font-sans">
                      Target customer: <strong className="text-neutral-900">{targetCustomer.displayName || targetCustomer.name}</strong> ({targetCustomer.email || 'No email'})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseSendCoupon}
                  className="text-neutral-400 hover:text-neutral-700 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>

              {/* Error Alert inside Send Coupon Step */}
              {couponError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{couponError}</span>
                </div>
              )}

              {/* Coupon Selection List */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-admin block">
                  Select an Active Private Coupon:
                </label>

                {loadingCoupons ? (
                  <div className="p-6 text-center text-xs text-neutral-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-neutral-400" />
                    Loading available store coupons...
                  </div>
                ) : validAssignableCoupons.length === 0 ? (
                  <div className="p-5 border border-dashed border-neutral-300 rounded-xl text-center text-xs text-neutral-500">
                    No active private coupons available. Create a private coupon on the Coupons page first.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto custom-modal-scrollbar pr-1">
                    {validAssignableCoupons.map((coupon) => {
                      const isAssigned = isCouponAssigned(coupon, targetCustomer);
                      const isSelected = selectedCouponId === coupon.id;

                      return (
                        <div
                          key={coupon.id}
                          onClick={() => {
                            if (!isAssigned) {
                              setSelectedCouponId(coupon.id);
                              setCouponError(null);
                            }
                          }}
                          className={`p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                            isAssigned
                              ? 'bg-neutral-100/70 border-neutral-200 opacity-60 cursor-not-allowed'
                              : isSelected
                              ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                              : 'bg-white border-neutral-200 hover:border-neutral-400 text-neutral-900'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-white bg-white text-neutral-900' : 'border-neutral-400'
                            }`}>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-neutral-900" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`font-bold font-admin tracking-wider text-xs ${isSelected ? 'text-white' : 'text-neutral-900'}`}>
                                  {coupon.code}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase ${
                                  isSelected ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-600'
                                }`}>
                                  {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
                                </span>
                              </div>
                              {coupon.description && (
                                <p className={`text-[11px] font-sans mt-0.5 ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                                  {coupon.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {isAssigned && (
                            <span className="text-[10.5px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                              Already assigned
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseSendCoupon}
                  className="px-4 py-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSendCoupon}
                  disabled={!selectedCouponId || sendingCoupon}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
                >
                  {sendingCoupon ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Confirm & Send</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        ) : (
          /* PRIMARY STEP: Top Customers Table Content */
          <>
            {/* Modal Toolbar: Search & Count Summary */}
            <div className="px-6 py-3 border-b border-neutral-200/80 bg-neutral-50/60 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by customer name, email, phone..."
                  className="w-full pl-9 pr-8 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-sans text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="text-xs text-neutral-500 font-sans self-end sm:self-center">
                Showing <strong className="text-neutral-900 font-semibold">{filteredUsers.length}</strong> top customers ({periodLabel})
              </div>
            </div>

            {/* Modal Body / Table Content */}
            <div className="flex-1 overflow-y-auto custom-modal-scrollbar">
              {/* Error State */}
              {error && !loading && (
                <div className="p-8 m-6 bg-rose-50 border border-rose-200 rounded-2xl text-center max-w-md mx-auto">
                  <AlertCircle className="w-6 h-6 text-rose-600 mx-auto mb-2" />
                  <h3 className="text-xs font-bold font-admin uppercase text-rose-900 mb-1">
                    Unable to load top customers
                  </h3>
                  <p className="text-xs text-rose-700 font-sans mb-4">
                    {error}
                  </p>
                  <button
                    type="button"
                    onClick={fetchTopCustomers}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry</span>
                  </button>
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && filteredUsers.length === 0 && (
                <div className="p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mb-3">
                    <Award className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold font-admin text-neutral-900 uppercase tracking-wider mb-1">
                    No customer activity in this period
                  </h3>
                  <p className="text-xs text-neutral-500 font-sans max-w-xs">
                    {searchQuery
                      ? `No customer records matched "${searchQuery}". Try a different search term.`
                      : `There are no customer purchases recorded for ${periodLabel}.`}
                  </p>
                </div>
              )}

              {/* Top Customers Table */}
              {(!error && (loading || filteredUsers.length > 0)) && (
                <table className="w-full text-left border-collapse table-fixed">
                  <thead className="bg-neutral-50/95 sticky top-0 z-10 border-b border-neutral-200 text-[10.5px] font-bold font-admin uppercase tracking-wider text-neutral-500 select-none shadow-2xs">
                    <tr>
                      <th className="py-2.5 px-4 w-[24%]">User</th>
                      <th className="py-2.5 px-4 w-[15%]">Phone</th>
                      <th className="py-2.5 px-4 w-[10%] text-center">Orders</th>
                      <th className="py-2.5 px-4 w-[16%] text-right">Revenue</th>
                      <th className="py-2.5 px-4 w-[17%] text-right">Last Active</th>
                      <th className="py-2.5 px-4 w-[18%] text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-xs font-sans text-neutral-800">
                    {loading ? (
                      // Loading Skeleton Rows
                      Array.from({ length: 6 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td className="py-3 px-4 space-y-1">
                            <div className="h-3.5 w-28 bg-neutral-200 rounded" />
                            <div className="h-3 w-36 bg-neutral-100 rounded" />
                          </td>
                          <td className="py-3 px-4">
                            <div className="h-3.5 w-24 bg-neutral-200 rounded" />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="h-3.5 w-8 bg-neutral-200 rounded mx-auto" />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="h-3.5 w-16 bg-neutral-200 rounded ml-auto" />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="h-3.5 w-20 bg-neutral-200 rounded ml-auto" />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="h-7 w-24 bg-neutral-200 rounded-lg mx-auto" />
                          </td>
                        </tr>
                      ))
                    ) : (
                      paginatedUsers.map((u, idx) => {
                        const displayName = u.displayName || u.name || u.userId || 'Customer';
                        const email = u.email || '';
                        
                        // Phone sanitization: render '-' if missing
                        const rawPhone = u.phone;
                        const cleanPhone = (rawPhone && rawPhone !== 'N/A' && rawPhone !== 'null' && rawPhone !== 'undefined' && String(rawPhone).trim())
                          ? String(rawPhone).trim()
                          : '-';

                        const lastActiveText = formatDateTime(u.lastActiveDate, u.lastActiveFormatted);

                        return (
                          <tr key={u.userId || idx} className="hover:bg-neutral-50/80 transition-colors">
                            {/* USER (Name stacked with email underneath) */}
                            <td className="py-3 px-4 font-medium text-neutral-900 font-admin">
                              <div className="truncate">
                                <span className="font-semibold text-neutral-900 block truncate">{displayName}</span>
                                {email && (
                                  <span className="text-[11px] text-neutral-500 font-sans font-normal block truncate mt-0.5">
                                    {email}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* PHONE */}
                            <td className="py-3 px-4 font-sans text-neutral-600 text-xs truncate">
                              {cleanPhone}
                            </td>

                            {/* ORDERS COUNT */}
                            <td className="py-3 px-4 text-center font-bold font-admin text-neutral-800">
                              {formatNumber(u.totalOrders)}
                            </td>

                            {/* REVENUE */}
                            <td className="py-3 px-4 text-right font-bold font-admin text-emerald-700 whitespace-nowrap">
                              ₹{formatCurrency(u.totalRevenue)}
                            </td>

                            {/* LAST ACTIVE */}
                            <td className="py-3 px-4 text-right text-neutral-600 font-sans text-xs whitespace-nowrap">
                              {lastActiveText}
                            </td>

                            {/* ACTION: SEND COUPON */}
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleOpenSendCoupon(u)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
                              >
                                <Tag className="w-3 h-3" />
                                <span>Send Coupon</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer: Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50/90 flex items-center justify-center text-xs text-neutral-500 font-sans shrink-0">
                <div className="flex items-center gap-2">
                  <span className="mr-2 text-neutral-600 text-[11px]">
                    Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 disabled:opacity-40 transition-colors cursor-pointer"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4 text-neutral-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 disabled:opacity-40 transition-colors cursor-pointer"
                    title="Next page"
                  >
                    <ChevronRight className="w-4 h-4 text-neutral-700" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default TopCustomersModal;
