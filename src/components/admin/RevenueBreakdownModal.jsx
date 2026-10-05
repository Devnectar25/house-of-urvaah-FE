import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

// Number & Currency formatting helpers
function formatCurrency(val) {
  const num = Number(val);
  if (isNaN(num) || num === null || num === undefined) return '0';
  return num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: num % 1 === 0 ? 0 : 2
  });
}

// Date formatting helper (DD/MM/YYYY matching reference screenshot)
function formatDateDDMMYYYY(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch (e) {
    return 'N/A';
  }
}

// Order Status Pill Helper matching Reference Layout & AdminOrders.jsx styling
function getOrderStatusPill(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('delivered') || s.includes('completed')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (s.includes('shipped') || s.includes('dispatched')) {
    return 'bg-sky-50 text-sky-700 border-sky-200';
  }
  if (s.includes('out for delivery')) {
    return 'bg-purple-50 text-purple-700 border-purple-200';
  }
  if (s.includes('processing') || s.includes('confirmed') || s.includes('packed')) {
    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  }
  if (s.includes('pending') || s.includes('placed')) {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  if (s.includes('cancel') || s.includes('refund')) {
    return 'bg-neutral-100 text-neutral-600 border-neutral-200';
  }
  if (s.includes('return')) {
    return 'bg-orange-50 text-orange-700 border-orange-200';
  }
  if (s.includes('exchange')) {
    return 'bg-teal-50 text-teal-700 border-teal-200';
  }
  return 'bg-neutral-100 text-neutral-600 border-neutral-200';
}

export const RevenueBreakdownModal = ({ isOpen, onClose, period = '30d' }) => {
  const [ordersData, setOrdersData] = useState({ grandTotal: 0, orders: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Dynamic Period Subtitle Label
  const periodLabel = useMemo(() => {
    if (period === 'today') return 'Today';
    if (period === '7d') return 'Last 7 Days';
    if (period === '30d') return 'Last 30 Days';
    return 'Selected Period';
  }, [period]);

  // Fetch real database orders & grand total
  const fetchRevenueData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient(`/api/admin/analytics/revenue-breakdown?period=${period}`).catch(() => null);

      if (res && res.success && res.data) {
        setOrdersData({
          grandTotal: res.data.grandTotal || 0,
          orders: res.data.orders || []
        });
      } else {
        throw new Error(res?.message || 'Failed to retrieve revenue breakdown data.');
      }
    } catch (err) {
      console.error('[RevenueBreakdownModal Error]:', err);
      setError(err.message || 'Unable to load revenue breakdown. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  }, [period]);

  // Fetch data whenever modal opens or period changes
  useEffect(() => {
    if (isOpen) {
      fetchRevenueData();
      setCurrentPage(1);
    }
  }, [isOpen, fetchRevenueData]);

  // Pagination slicing
  const allOrders = ordersData.orders || [];
  const totalPages = Math.max(1, Math.ceil(allOrders.length / pageSize));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return allOrders.slice(start, start + pageSize);
  }, [allOrders, currentPage, pageSize]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn font-admin">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[88vh] border border-neutral-200">
        
        {/* Modal Header matching Reference Layout */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between bg-white shrink-0">
          <div>
            <h2 className="text-xl font-bold font-admin text-neutral-900 tracking-tight">
              Revenue Breakdown
            </h2>
            <p className="text-xs text-neutral-500 font-sans mt-1">
              Detailed breakdown of metrics for {periodLabel}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchRevenueData}
              disabled={loading}
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh revenue data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Circular close button matching Reference X icon */}
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

        {/* Inner Card Container holding Table & Grand Total matching Reference Screenshot */}
        <div className="mx-6 mb-6 border border-neutral-200/90 rounded-xl bg-white overflow-hidden flex flex-col flex-1 shadow-2xs">
          
          {/* Scrollable Table Content */}
          <div className="flex-1 overflow-y-auto custom-modal-scrollbar">
            {/* Error State */}
            {error && !loading && (
              <div className="p-8 m-6 bg-rose-50 border border-rose-200 rounded-2xl text-center max-w-md mx-auto">
                <AlertCircle className="w-6 h-6 text-rose-600 mx-auto mb-2" />
                <h3 className="text-xs font-bold font-admin uppercase text-rose-900 mb-1">
                  Unable to load revenue breakdown
                </h3>
                <p className="text-xs text-rose-700 font-sans mb-4">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={fetchRevenueData}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && allOrders.length === 0 && (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <h3 className="text-sm font-bold font-admin text-neutral-900 uppercase tracking-wider mb-1">
                  No orders in this period
                </h3>
                <p className="text-xs text-neutral-500 font-sans max-w-xs">
                  There are no order records placed for {periodLabel}.
                </p>
              </div>
            )}

            {/* Table */}
            {(!error && (loading || allOrders.length > 0)) && (
              <table className="w-full text-left border-collapse table-fixed">
                <thead className="bg-neutral-50/95 sticky top-0 z-10 border-b border-neutral-200 text-[11px] font-bold font-admin text-neutral-700 select-none">
                  <tr>
                    <th className="py-3 px-5 w-[28%]">Order #</th>
                    <th className="py-3 px-5 w-[32%]">Customer</th>
                    <th className="py-3 px-5 w-[18%]">Date</th>
                    <th className="py-3 px-5 w-[12%] text-center">Status</th>
                    <th className="py-3 px-5 w-[10%] text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs font-sans text-neutral-800">
                  {loading ? (
                    // Loading Skeleton Rows
                    Array.from({ length: 6 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="py-3 px-5">
                          <div className="h-3.5 w-28 bg-neutral-200 rounded" />
                        </td>
                        <td className="py-3 px-5">
                          <div className="h-3.5 w-36 bg-neutral-200 rounded" />
                        </td>
                        <td className="py-3 px-5">
                          <div className="h-3.5 w-20 bg-neutral-200 rounded" />
                        </td>
                        <td className="py-3 px-5 text-center">
                          <div className="h-5 w-16 bg-neutral-200 rounded-full mx-auto" />
                        </td>
                        <td className="py-3 px-5 text-right">
                          <div className="h-3.5 w-12 bg-neutral-200 rounded ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : (
                    paginatedOrders.map((o, idx) => {
                      const statusClass = getOrderStatusPill(o.status);
                      const formattedDate = formatDateDDMMYYYY(o.orderDate);
                      const displayOrderId = o.orderId.startsWith('#') ? o.orderId : `#${o.orderId}`;

                      return (
                        <tr key={o.orderId || idx} className="hover:bg-neutral-50/80 transition-colors">
                          {/* ORDER # */}
                          <td className="py-3 px-5 font-bold font-admin text-neutral-900 truncate">
                            {displayOrderId}
                          </td>

                          {/* CUSTOMER */}
                          <td className="py-3 px-5 font-sans text-neutral-600 truncate">
                            {o.customerEmail || 'Guest'}
                          </td>

                          {/* DATE */}
                          <td className="py-3 px-5 font-sans text-neutral-500 whitespace-nowrap">
                            {formattedDate}
                          </td>

                          {/* STATUS PILL */}
                          <td className="py-3 px-5 text-center">
                            <span className={`inline-block text-[11px] font-semibold px-3 py-0.5 rounded-full border ${statusClass}`}>
                              {o.status}
                            </span>
                          </td>

                          {/* TOTAL */}
                          <td className="py-3 px-5 text-right font-bold font-admin text-neutral-950 whitespace-nowrap">
                            ₹{formatCurrency(o.total)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Bottom Grand Total Row matching Reference Layout */}
          <div className="bg-neutral-50/90 border-t border-neutral-200 px-6 py-3.5 flex items-center justify-end gap-6 text-sm font-admin shrink-0 select-none">
            <span className="font-bold text-neutral-900">Grand Total:</span>
            <span className="font-bold text-neutral-950 text-base">₹{formatCurrency(ordersData.grandTotal)}</span>
          </div>

        </div>

        {/* Modal Pagination Footer (Renders when totalPages > 1) */}
        {totalPages > 1 && (
          <div className="px-6 pb-4 pt-1 flex items-center justify-center text-xs text-neutral-500 font-sans shrink-0">
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

      </div>
    </div>
  );
};

export default RevenueBreakdownModal;
