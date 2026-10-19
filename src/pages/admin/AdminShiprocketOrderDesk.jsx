import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Truck,
  Package,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  FileText,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  Building,
  Check,
  XCircle,
  ShieldCheck,
  Eye,
  MapPin,
  Calendar,
  Send,
  Sliders,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { shippingApi } from '../../services/shippingApi';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { OrderDetailModal } from '../../components/admin/OrderDetailModal';

export const AdminShiprocketOrderDesk = () => {
  // State: Orders & Filters
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // State: Live Pincode Serviceability Inspector
  const [inspectPincode, setInspectPincode] = useState('110001');
  const [inspectWeight, setInspectWeight] = useState('0.5');
  const [inspectCod, setInspectCod] = useState(true);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectResult, setInspectResult] = useState(null);

  // State: Live Tracking Scans Drawer & Modal
  const [activeTrackingAwb, setActiveTrackingAwb] = useState(null);
  const [activeTrackingData, setActiveTrackingData] = useState(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [selectedOrderIdForDetail, setSelectedOrderIdForDetail] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Fetch Forward Orders from API
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient('/api/orders?limit=500').catch(() => ({ data: [] }));
      const orderList = Array.isArray(res?.data) ? res.data : (res?.orders || []);
      setOrders(orderList);
    } catch (err) {
      console.error('Failed to load orders for Shiprocket Order Desk:', err);
      setError(err.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Run Serviceability Check for Inspector Widget
  const handleCheckServiceability = async () => {
    if (!inspectPincode || !/^\d{6}$/.test(String(inspectPincode).trim())) {
      setInspectResult({ success: false, message: 'Please enter a valid 6-digit PIN code.' });
      return;
    }
    setInspectLoading(true);
    setInspectResult(null);
    try {
      const data = await shippingApi.checkServiceability(
        inspectPincode,
        '411001',
        parseFloat(inspectWeight) || 0.5,
        inspectCod ? 1 : 0
      );
      setInspectResult(data);
    } catch (err) {
      setInspectResult({ success: false, message: err.message || 'Serviceability check failed.' });
    } finally {
      setInspectLoading(false);
    }
  };



  // Filtered Orders for Table
  const filteredOrders = useMemo(() => {
    return orders.filter(ord => {
      const ordNum = (ord.order_number || '').toLowerCase();
      const customer = (ord.recipient_name || ord.user_name || ord.customer_name || '').toLowerCase();
      const awb = (ord.tracking_number || '').toLowerCase();
      const matchesSearch = ordNum.includes(searchTerm.toLowerCase()) || 
                            customer.includes(searchTerm.toLowerCase()) ||
                            awb.includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      const s = (ord.status || '').toLowerCase();
      const hasAwb = Boolean(ord.tracking_number);

      if (stageFilter === 'all') return true;
      if (stageFilter === 'pending_awb') return !hasAwb && !['delivered', 'cancelled'].includes(s);
      if (stageFilter === 'awb_assigned') return hasAwb && ['pending', 'confirmed', 'processing'].includes(s);
      if (stageFilter === 'in_transit') return s === 'shipped' || s === 'dispatched' || s.includes('transit');
      if (stageFilter === 'out_for_delivery') return s === 'out for delivery';
      if (stageFilter === 'delivered') return s === 'delivered';
      if (stageFilter === 'cancelled') return s === 'cancelled';

      return true;
    });
  }, [orders, searchTerm, stageFilter]);

  // Reset page when search or stage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, stageFilter]);

  // Pagination Calculations
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedOrders = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, safeCurrentPage, pageSize]);

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    pages.push(1);
    if (safeCurrentPage > 3) {
      pages.push('...');
    }
    const start = Math.max(2, safeCurrentPage - 1);
    const end = Math.min(totalPages - 1, safeCurrentPage + 1);
    for (let p = start; p <= end; p++) {
      pages.push(p);
    }
    if (safeCurrentPage < totalPages - 2) {
      pages.push('...');
    }
    pages.push(totalPages);
    return pages;
  };

  // Inspect Live Scans
  const handleViewTracking = async (awb) => {
    setActiveTrackingAwb(awb);
    setActiveTrackingData(null);
    setLoadingTracking(true);
    try {
      const res = await shippingApi.trackShipment(awb);
      setActiveTrackingData(res?.tracking_data || null);
    } catch (err) {
      console.error('Failed to fetch tracking scans:', err);
    } finally {
      setLoadingTracking(false);
    }
  };

  return (
    <div className="space-y-6 font-admin p-4 sm:p-6 max-w-7xl mx-auto">
      {/* 1. Header Banner */}
      <AdminPageHeader
        title="Shiprocket Order Desk"
        subtitle="End-to-End Forward Order Lifecycle: Pincode Check ➔ Shipment Creation ➔ AWB Allocation ➔ Label & Manifest ➔ Courier Pickup ➔ Final Delivery."
      />



      {/* 4. Live Pincode Serviceability Inspector Widget */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-dark" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 font-admin">
              Pre-Checkout Pincode & Courier Rate Inspector
            </h3>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">Simulates /api/delivery/check</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[10px] uppercase font-semibold text-neutral-400 mb-1">
              Destination Pincode
            </label>
            <input
              type="text"
              value={inspectPincode}
              onChange={(e) => setInspectPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="e.g. 110001"
              maxLength={6}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono font-medium focus:outline-hidden focus:border-black"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-neutral-400 mb-1">
              Weight (KG)
            </label>
            <input
              type="number"
              step="0.1"
              value={inspectWeight}
              onChange={(e) => setInspectWeight(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-hidden focus:border-black"
            />
          </div>

          <div className="flex items-center gap-2 h-10">
            <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
              <input
                type="checkbox"
                checked={inspectCod}
                onChange={(e) => setInspectCod(e.target.checked)}
                className="rounded border-neutral-300 text-black focus:ring-black"
              />
              <span className="font-semibold text-[11px] uppercase">Cash on Delivery (COD)</span>
            </label>
          </div>

          <div>
            <button
              type="button"
              disabled={inspectLoading}
              onClick={handleCheckServiceability}
              className="w-full h-10 bg-neutral-950 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {inspectLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Inspect Rates & EDD</span>
            </button>
          </div>
        </div>

        {/* Inspection Result Preview */}
        {inspectResult && (
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/80 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-900">
                Pincode {inspectPincode}: {inspectResult.available ? '✓ Serviceable' : '✕ Unserviceable'}
              </span>
              {inspectResult.available && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                  EDD: {inspectResult.minDays || 2} - {inspectResult.maxDays || 3} Days
                </span>
              )}
            </div>

            {inspectResult.data?.available_courier_companies?.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                {inspectResult.data.available_courier_companies.map((c, i) => (
                  <div key={i} className="bg-white p-2.5 rounded-lg border border-neutral-200 text-neutral-700">
                    <span className="font-bold text-neutral-900 block text-xs">{c.courier_name}</span>
                    <span className="text-[10px] text-neutral-500 block">Transit: {c.estimated_delivery_days} days • Rate: ₹{c.rate}</span>
                    <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">COD: {c.cod ? 'Supported' : 'Prepaid Only'}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* 5. Active Forward Orders Management Table */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-2xs space-y-3 p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-neutral-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 tracking-wide uppercase">
              Forward Fulfillment Orders ({filteredOrders.length})
            </h3>
            <p className="text-[11px] text-neutral-500">
              Live orders being processed, dispatched, or delivered through the Shiprocket forward logistics pipeline.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search order #, customer, AWB..."
                className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:border-black font-medium"
              />
            </div>

            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs rounded-xl px-2.5 py-1.5 focus:outline-hidden font-medium cursor-pointer"
            >
              <option value="all">All Stages</option>
              <option value="pending_awb">Pending AWB</option>
              <option value="awb_assigned">AWB Allocated</option>
              <option value="in_transit">In Transit</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
            </select>

            <button
              type="button"
              onClick={fetchOrders}
              className="p-1.5 border border-neutral-200 rounded-xl hover:bg-neutral-100 text-neutral-600 transition-colors"
              title="Refresh Orders"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-neutral-400 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-600" />
            <p className="text-xs">Loading forward orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-10 text-center text-neutral-400 space-y-2">
            <Package className="w-8 h-8 mx-auto text-neutral-300" />
            <p className="text-sm font-semibold text-neutral-700">No Orders Found</p>
            <p className="text-xs text-neutral-500">No forward shipments match your filter criteria.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[10px] font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Order #</th>
                  <th className="py-2.5 px-3">Customer & Destination</th>
                  <th className="py-2.5 px-3">Current Stage</th>
                  <th className="py-2.5 px-3">Courier AWB</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {paginatedOrders.map(ord => {
                  const s = ord.status || 'Placed';
                  const isDelivered = s === 'Delivered';
                  const isOFD = s === 'Out for Delivery';
                  const isShipped = s === 'Shipped' || s === 'Dispatched';

                  return (
                    <tr key={ord.id || ord.order_number} className="hover:bg-neutral-50/60 transition-colors">
                      {/* Order # */}
                      <td className="py-3 px-3 font-mono font-bold text-neutral-900">
                        #{ord.order_number}
                      </td>

                      {/* Customer & City */}
                      <td className="py-3 px-3">
                        <span className="font-semibold text-neutral-900 block">
                          {ord.recipient_name || ord.user_name || 'Customer'}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {[
                            ord.city || ord.shipping_address?.city,
                            ord.postal_code || ord.pincode || ord.shipping_address?.postal_code || ord.shipping_address?.pincode
                          ].filter(Boolean).join(', ') || 'Address on file'}
                        </span>
                      </td>

                      {/* Stage Pill */}
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                          isDelivered ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          isOFD ? 'bg-purple-50 text-purple-800 border-purple-200' :
                          (ord.logistics_status === 'Pickup Scheduled' || ord.shipment_status === 'Pickup Scheduled') ? 'bg-teal-50 text-teal-800 border-teal-200' :
                          isShipped ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          'bg-neutral-100 text-neutral-700 border-neutral-200'
                        }`}>
                          {(ord.logistics_status === 'Pickup Scheduled' || ord.shipment_status === 'Pickup Scheduled') && !isDelivered && !isOFD
                            ? 'Pickup Scheduled'
                            : s}
                        </span>
                      </td>

                      {/* AWB Code */}
                      <td className="py-3 px-3">
                        {ord.tracking_number ? (
                          <div>
                            <span className="font-mono font-bold text-neutral-900 text-[11px] block">
                              {ord.tracking_number}
                            </span>
                            <span className="text-[10px] text-neutral-400">Delhivery Express</span>
                          </div>
                        ) : (
                          <span className="text-neutral-400 italic text-[11px]">Unassigned</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3 font-bold text-neutral-900">
                        ₹{Number(ord.total || ord.subtotal || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right space-x-2">
                        {ord.tracking_number && (
                          <button
                            type="button"
                            onClick={() => handleViewTracking(ord.tracking_number)}
                            className="p-1.5 hover:bg-neutral-100 text-neutral-600 rounded-lg transition-colors cursor-pointer"
                            title="View Courier Milestone Scans"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrderIdForDetail(ord.id);
                            setIsDetailModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-neutral-900 hover:bg-black text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          {!loading && filteredOrders.length > 0 && (
            <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans">
              <div className="flex items-center gap-3 text-neutral-500">
                <span>
                  Showing <strong className="font-semibold text-neutral-900">{(safeCurrentPage - 1) * pageSize + 1}</strong>–
                  <strong className="font-semibold text-neutral-900">{Math.min(safeCurrentPage * pageSize, filteredOrders.length)}</strong> of{' '}
                  <strong className="font-semibold text-neutral-900">{filteredOrders.length}</strong> shipments
                </span>
                <span className="text-neutral-300">|</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-neutral-400">Rows:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-neutral-50 border border-neutral-200 text-neutral-800 text-[11px] rounded-lg px-2 py-1 focus:outline-hidden font-semibold cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={safeCurrentPage === 1}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition-colors text-[11px] font-semibold"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Prev</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((p, idx) => {
                      if (p === '...') {
                        return (
                          <span key={`sr-desk-ellipsis-${idx}`} className="w-7 text-center text-neutral-400 text-xs">
                            ...
                          </span>
                        );
                      }
                      const isActive = p === safeCurrentPage;
                      return (
                        <button
                          key={`sr-desk-page-${p}`}
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`min-w-7 h-7 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-neutral-900 text-white shadow-xs'
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
                    disabled={safeCurrentPage >= totalPages}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition-colors text-[11px] font-semibold"
                    title="Next Page"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>

      {/* 6. Live Tracking Scans Drawer Modal */}
      {activeTrackingAwb && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setActiveTrackingAwb(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-neutral-200 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wide">
                  Live Courier Milestone History
                </h3>
                <p className="text-xs text-neutral-500 font-mono">AWB: {activeTrackingAwb}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTrackingAwb(null)}
                className="text-neutral-400 hover:text-black p-1 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {loadingTracking ? (
              <div className="py-8 text-center text-neutral-400 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-xs">Fetching real-time scans...</span>
              </div>
            ) : activeTrackingData?.scans?.length ? (
              <div className="space-y-3 py-2">
                {activeTrackingData.scans.map((scan, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-dark mt-1 shrink-0" />
                    <div className="flex-1">
                      <p className="font-bold text-xs text-brand-dark">{scan.activity}</p>
                      <p className="text-[11px] text-neutral-500">{scan.location} • {scan.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-neutral-500 italic">
                No scans recorded yet. Package is awaiting courier pickup.
              </div>
            )}

            <div className="pt-2 border-t border-neutral-100 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveTrackingAwb(null)}
                className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-black transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Order Details Modal Integration */}
      <OrderDetailModal
        orderId={selectedOrderIdForDetail}
        isOpen={isDetailModalOpen}
        hideStatusManagement={true}
        isShiprocketDesk={true}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedOrderIdForDetail(null);
          fetchOrders();
        }}
        onOrderUpdated={fetchOrders}
      />
    </div>
  );
};

export default AdminShiprocketOrderDesk;
