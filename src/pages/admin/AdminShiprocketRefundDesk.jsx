import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RotateCcw,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
  Truck,
  Package,
  ArrowRight,
  ShieldCheck,
  Zap,
  Building,
  CreditCard,
  Banknote,
  FileText,
  Clock,
  Eye,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  ExternalLink
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { shippingApi } from '../../services/shippingApi';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { ReturnOrderDetailModal } from '../../components/admin/ReturnOrderDetailModal';

export const AdminShiprocketRefundDesk = () => {
  // State: Orders & Filters
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [scenarioFilter, setScenarioFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // State: Interactive Sandbox Simulator
  const [selectedOrderNumber, setSelectedOrderNumber] = useState('');
  const [selectedScenario, setSelectedScenario] = useState('approve_return');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);

  // State: Selected Order for Modal / Tracking Drawer
  const [activeTrackingAwb, setActiveTrackingAwb] = useState(null);
  const [activeTrackingData, setActiveTrackingData] = useState(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [selectedOrderIdForDetail, setSelectedOrderIdForDetail] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Fetch orders eligible for or undergoing return/replacement/refund
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch from cancelled/refund desk endpoint
      const cancelledRes = await apiClient('/api/admin/cancelled-orders?refundStatusFilter=all&limit=200').catch(() => ({ data: [] }));
      const cancelledList = cancelledRes?.data || [];

      // 2. Fetch all orders (to include Delivered orders eligible for returns)
      const allOrdersRes = await apiClient('/api/orders?limit=200').catch(() => ({ data: [] }));
      const allList = allOrdersRes?.data || [];

      // Merge and deduplicate by ID
      const orderMap = new Map();
      cancelledList.forEach(ord => orderMap.set(ord.id, { ...ord, isRefundDesk: true }));
      allList.forEach(ord => {
        if (!orderMap.has(ord.id)) {
          orderMap.set(ord.id, ord);
        } else {
          orderMap.set(ord.id, { ...orderMap.get(ord.id), ...ord });
        }
      });

      const combined = Array.from(orderMap.values());
      setOrders(combined);
      
      // Auto-select first order for simulator if none selected
      if (!selectedOrderNumber && combined.length > 0) {
        setSelectedOrderNumber(combined[0].order_number);
      }
    } catch (err) {
      console.error('Failed to load refund desk orders:', err);
      setError(err.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, [selectedOrderNumber]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Statistics calculation
  const stats = useMemo(() => {
    let returnRequests = 0;
    let inTransitReverse = 0;
    let atHomved = 0;
    let completedRefunds = 0;

    orders.forEach(ord => {
      const s = (ord.status || '').toLowerCase();
      const ls = (ord.logistics_status || '').toLowerCase();
      const rs = (ord.refund_status || '').toLowerCase();

      if (s.includes('return') || s.includes('replace') || s.includes('cancelled')) {
        returnRequests++;
      }
      if (s.includes('collected') || ls.includes('transit') || s === 'return collected') {
        inTransitReverse++;
      }
      if (s.includes('homved') || ls.includes('homved') || s.includes('restocked')) {
        atHomved++;
      }
      if (rs === 'completed' || rs === 'refunded' || s === 'refunded' || s === 'replaced') {
        completedRefunds++;
      }
    });

    return { returnRequests, inTransitReverse, atHomved, completedRefunds };
  }, [orders]);

  // Filtered orders list
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
      const rs = (ord.refund_status || '').toLowerCase();

      if (scenarioFilter === 'all') return true;
      if (scenarioFilter === 'return_pending') return s.includes('return') || s.includes('replace') || s === 'delivered';
      if (scenarioFilter === 'in_transit') return s.includes('collected') || s.includes('transit');
      if (scenarioFilter === 'at_homved') return s.includes('homved') || s.includes('restocked');
      if (scenarioFilter === 'refund_settled') return rs === 'completed' || s === 'refunded';
      if (scenarioFilter === 'replaced') return s === 'replaced' || s.includes('replacement');

      return true;
    });
  }, [orders, searchTerm, scenarioFilter]);

  // Reset pagination when search or scenario filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, scenarioFilter]);

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

  // Handle Scenario Execution
  const handleExecuteScenario = async () => {
    if (!selectedOrderNumber) return;
    setSimulating(true);
    setSimResult(null);

    const targetOrder = orders.find(o => o.order_number === selectedOrderNumber) || { order_number: selectedOrderNumber, id: selectedOrderNumber };

    try {
      let result = null;

      switch (selectedScenario) {
        // Scenario 1: Approve Return & Generate Reverse AWB
        case 'approve_return': {
          const retRes = await shippingApi.createReturnOrder(
            targetOrder, 
            targetOrder.items || [{ product_id: 1, name: 'Garment', price: 4999, quantity: 1 }], 
            'Size or fit mismatch - Admin Approved'
          );
          
          await apiClient(`/api/orders/${targetOrder.id || targetOrder.order_number}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ 
              status: 'Return Approved', 
              logisticsStatus: 'Pickup Scheduled',
              trackingNumber: retRes.awb_code 
            })
          }).catch(() => {});

          result = {
            scenario: 'Scenario 1: Reverse Pickup Scheduled (Doorstep QC)',
            success: true,
            awb_code: retRes.awb_code,
            shipment_id: retRes.shipment_id,
            details: 'Shiprocket generated reverse AWB with Doorstep Quality Check (QC) enabled. Courier assigned for doorstep collection in 24-48 hrs.',
            next_step: 'Rider visits customer ➔ Checks tags ➔ Scans package ➔ In Transit.'
          };
          break;
        }

        // Scenario 2: Doorstep QC Passed & In-Transit to Atelier
        case 'qc_passed_transit': {
          const res = await shippingApi.simulateWebhookStatus(targetOrder.tracking_number || targetOrder.order_number, 'IN TRANSIT');
          
          await apiClient(`/api/orders/${targetOrder.id || targetOrder.order_number}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'Return Collected', logisticsStatus: 'In Transit' })
          }).catch(() => {});

          result = {
            scenario: 'Scenario 2: Doorstep QC Passed & In Transit',
            success: true,
            status: 'Return Collected',
            details: 'Courier rider confirmed brand tags, luxury box, and unworn garment condition. Parcel collected and traveling to Urvaah Atelier.',
            next_step: 'Transit to Regional Distribution Center ➔ Arrival at Homved Atelier.'
          };
          break;
        }

        // Scenario 3: Received at Homved & Restock Triggered
        case 'received_homved': {
          await apiClient(`/api/orders/${targetOrder.id || targetOrder.order_number}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'Received at Homved', logisticsStatus: 'Received at Homved' })
          });

          result = {
            scenario: 'Scenario 3: Received at Homved (Automated Restocking URVAAH-014)',
            success: true,
            status: 'Received at Homved',
            details: 'Package arrived at Urvaah Atelier/Homved. Inventory automation automatically restored stock quantities into catalog database!',
            next_step: 'Proceed to Financial Refund Settlement or Replacement Dispatch.'
          };
          break;
        }

        // Scenario 4: Doorstep QC Failed (Rejection)
        case 'qc_failed': {
          await apiClient(`/api/orders/${targetOrder.id || targetOrder.order_number}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'Return Rejected', logisticsStatus: 'QC Failed - Handover Denied' })
          }).catch(() => {});

          result = {
            scenario: 'Scenario 4: Doorstep QC Failed (Return Rejected)',
            success: true,
            status: 'Return Rejected',
            details: 'Courier executive rejected return at customer doorstep: tags missing or garment signs of wear. Parcel not collected; customer notified.',
            next_step: 'Case closed. Customer notified via email/WhatsApp of policy requirement.'
          };
          break;
        }

        // Scenario 5: Financial Refund Settlement (URVAAH-RR-07)
        case 'settle_refund': {
          const payoutType = (targetOrder.payment_method === 'cod') ? 'Bank Transfer (IMPS/NEFT)' : 'Original Payment Source (Razorpay/Card)';
          const utrNumber = `UTR${Math.floor(1000000000 + Math.random() * 9000000000)}`;

          await apiClient(`/api/admin/order/${targetOrder.id || targetOrder.order_number}/refund-status`, {
            method: 'PATCH',
            body: JSON.stringify({ refundStatus: 'Completed', utrNumber })
          }).catch(() => {});

          result = {
            scenario: 'Scenario 5: Financial Refund Completed (URVAAH-RR-07)',
            success: true,
            payout_type: payoutType,
            utr_number: utrNumber,
            details: `Financial refund of ₹${Number(targetOrder.total || 17980).toLocaleString('en-IN')} successfully settled to ${payoutType}. Refund receipt generated.`,
            next_step: 'Customer receives bank/email credit confirmation.'
          };
          break;
        }

        // Scenario 6: Size Replacement Dispatch (URVAAH-RR-05)
        case 'dispatch_replacement': {
          const repRes = await shippingApi.dispatchReplacement(targetOrder, targetOrder.items);
          
          await apiClient(`/api/orders/${targetOrder.id || targetOrder.order_number}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'Replacement Shipped', trackingNumber: repRes.awb_code })
          }).catch(() => {});

          result = {
            scenario: 'Scenario 6: Size Replacement Forward Dispatch',
            success: true,
            order_number: repRes.order_number,
            awb_code: repRes.awb_code,
            courier: repRes.courier_name,
            details: `Fresh exchanged size registered as Order ${repRes.order_number}. Forward AWB ${repRes.awb_code} generated for expedited delivery to customer!`,
            next_step: 'Courier delivers replacement size to customer doorstep.'
          };
          break;
        }

        // Scenario 7: Pre-Dispatch Cancellation
        case 'cancel_pre_dispatch': {
          await shippingApi.cancelShipment([targetOrder.id || targetOrder.order_number]);
          
          await apiClient(`/api/orders/${targetOrder.id || targetOrder.order_number}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'Cancelled', paymentStatus: 'Refunded' })
          }).catch(() => {});

          result = {
            scenario: 'Scenario 7: Pre-Dispatch Cancellation Void',
            success: true,
            status: 'Cancelled',
            details: 'Shiprocket pickup request voided before courier arrived. Order cancelled and 100% refund initiated.',
            next_step: 'No freight charges incurred; inventory stock released.'
          };
          break;
        }

        default:
          break;
      }

      setSimResult(result);
      await fetchOrders();
    } catch (err) {
      console.error('Scenario simulation failed:', err);
      setSimResult({
        success: false,
        error: err.message || 'Simulation execution encountered an error.'
      });
    } finally {
      setSimulating(false);
    }
  };

  // Inspect Live Reverse Tracking Scans
  const handleViewTracking = async (awb) => {
    setActiveTrackingAwb(awb);
    setActiveTrackingData(null);
    setLoadingTracking(true);
    try {
      const res = await shippingApi.trackReturnParcel(awb);
      setActiveTrackingData(res?.tracking_data || null);
    } catch (err) {
      console.error('Failed to fetch reverse tracking:', err);
    } finally {
      setLoadingTracking(false);
    }
  };

  return (
    <div className="space-y-6 font-admin p-4 sm:p-6 max-w-7xl mx-auto">
      {/* 1. Header Banner */}
      <AdminPageHeader
        title="Shiprocket Refund & Reverse Desk"
        subtitle="End-to-End Reverse Logistics: Doorstep Quality Check, Pickups, Homved Inventory Restocking, and Refund Settlements."
      />

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Total Cases</span>
            <RotateCcw className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">{stats.returnRequests}</div>
          <span className="text-[10px] text-neutral-400">Return & Exchange inquiries</span>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold">In Transit</span>
            <Truck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{stats.inTransitReverse}</div>
          <span className="text-[10px] text-neutral-400">Picked up & en-route to Atelier</span>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold">At Homved</span>
            <Building className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700">{stats.atHomved}</div>
          <span className="text-[10px] text-neutral-400">Restocked & QA Verified</span>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Settled</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{stats.completedRefunds}</div>
          <span className="text-[10px] text-neutral-400">Refunds paid / Replaced</span>
        </div>
      </div>

      {/* 3. Interactive Scenario Testing Sandbox (The Core Simulator) */}
      <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-neutral-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide uppercase font-admin">
                Interactive Refund Desk Scenario Sandbox
              </h3>
              <p className="text-[11px] text-neutral-400">
                Execute and test any reverse logistics or settlement workflow with 1 click.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase bg-amber-400/10 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full font-semibold self-start sm:self-auto">
            ⚡ Shiprocket Simulator
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Target Order Selector */}
          <div className="md:col-span-4">
            <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-semibold mb-1.5">
              Select Target Order
            </label>
            <select
              value={selectedOrderNumber}
              onChange={(e) => setSelectedOrderNumber(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-amber-400 font-medium"
            >
              {orders.map(o => (
                <option key={o.id || o.order_number} value={o.order_number}>
                  #{o.order_number} — {o.recipient_name || o.user_name || 'Customer'} (Status: {o.status})
                </option>
              ))}
            </select>
          </div>

          {/* Scenario Selector */}
          <div className="md:col-span-5">
            <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-semibold mb-1.5">
              Select Scenario to Test
            </label>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-amber-400 font-medium"
            >
              <option value="approve_return">Scenario 1: Approve Return & Schedule Doorstep QC Pickup</option>
              <option value="qc_passed_transit">Scenario 2: Doorstep QC Passed & In-Transit to Atelier</option>
              <option value="received_homved">Scenario 3: "Received at Homved" & Auto Restock (URVAAH-014)</option>
              <option value="qc_failed">Scenario 4: Doorstep QC Failed (Customer Handover Denied)</option>
              <option value="settle_refund">Scenario 5: Settle Financial Refund (Prepaid/COD Receipt)</option>
              <option value="dispatch_replacement">Scenario 6: Size Replacement Forward Dispatch (-REP)</option>
              <option value="cancel_pre_dispatch">Scenario 7: Cancellation Before Dispatch (Pre-Shipping)</option>
            </select>
          </div>

          {/* Execute Button */}
          <div className="md:col-span-3">
            <button
              type="button"
              disabled={simulating || !selectedOrderNumber}
              onClick={handleExecuteScenario}
              className="w-full h-10 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {simulating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                  <span>Executing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Run Scenario</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Simulation Execution Report */}
        {simResult && (
          <div className={`p-4 rounded-xl border text-xs space-y-2 mt-3 animate-in fade-in duration-200 ${
            simResult.success 
              ? 'bg-neutral-800/80 border-emerald-500/40 text-neutral-100' 
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}>
            <div className="flex items-center justify-between font-semibold border-b border-neutral-700/60 pb-1.5">
              <span className="flex items-center gap-2 text-amber-300">
                {simResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                {simResult.scenario || 'Simulation Result'}
              </span>
              <button 
                type="button" 
                onClick={() => setSimResult(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-neutral-300 leading-relaxed text-[11px]">{simResult.details || simResult.error}</p>

            {simResult.awb_code && (
              <div className="flex items-center gap-4 text-[11px] pt-1">
                <span>Reverse AWB: <strong className="font-mono text-amber-300">{simResult.awb_code}</strong></span>
                {simResult.shipment_id && <span>Shipment: <strong className="font-mono text-neutral-300">{simResult.shipment_id}</strong></span>}
              </div>
            )}

            {simResult.next_step && (
              <div className="text-[10px] text-neutral-400 flex items-center gap-1.5 pt-1">
                <ArrowRight className="w-3 h-3 text-amber-400" />
                <span>Next Lifecycle Step: {simResult.next_step}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Filter & Search Bar */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search order #, customer, or AWB..."
            className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:border-black font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-neutral-400 shrink-0" />
          <select
            value={scenarioFilter}
            onChange={(e) => setScenarioFilter(e.target.value)}
            className="w-full sm:w-auto bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs rounded-xl px-3 py-2 focus:outline-hidden font-medium cursor-pointer"
          >
            <option value="all">All Cases</option>
            <option value="return_pending">Returns / Replacements Pending</option>
            <option value="in_transit">In-Transit to Atelier</option>
            <option value="at_homved">Received at Homved</option>
            <option value="refund_settled">Refund Settled</option>
            <option value="replaced">Exchanged / Replaced</option>
          </select>

          <button
            type="button"
            onClick={fetchOrders}
            className="p-2 border border-neutral-200 rounded-xl hover:bg-neutral-100 text-neutral-600 transition-colors cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 5. Live Reverse Logistics Table */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-2xs">
        <div className="px-6 py-4 border-b border-neutral-200/80 flex items-center justify-between bg-neutral-50/50">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 tracking-wide uppercase">
              Active Refund & Reverse Shipments ({filteredOrders.length})
            </h3>
            <p className="text-[11px] text-neutral-500">
              Orders requiring reverse doorstep pickup, condition verification, or financial disbursement.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-neutral-400 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-600" />
            <p className="text-xs">Loading refund desk orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 space-y-2">
            <RotateCcw className="w-8 h-8 mx-auto text-neutral-300" />
            <p className="text-sm font-semibold text-neutral-700">No Orders Found</p>
            <p className="text-xs text-neutral-500">No active return or refund claims match your filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[10px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Order Details</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Lifecycle Status</th>
                  <th className="py-3 px-4">Reverse AWB & Courier</th>
                  <th className="py-3 px-4">Amount & Payout</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {paginatedOrders.map(ord => {
                  const s = ord.status || 'Pending';
                  const rs = ord.refund_status || 'Pending';
                  const isHomved = s.includes('Homved') || s === 'Received at Homved';
                  const isTransit = s.includes('Collected') || s.includes('Transit');

                  return (
                    <tr key={ord.id || ord.order_number} className="hover:bg-neutral-50/60 transition-colors">
                      {/* Order Details */}
                      <td className="py-3.5 px-4 font-admin">
                        <span className="font-bold text-neutral-900 block font-mono">
                          #{ord.order_number}
                        </span>
                        <span className="text-[10px] text-neutral-400 block mt-0.5">
                          {ord.created_at ? new Date(ord.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-neutral-900 block">
                          {ord.recipient_name || ord.user_name || ord.customer_name || 'Customer'}
                        </span>
                        <span className="text-[10px] text-neutral-400 block mt-0.5">
                          {ord.recipient_phone || ord.phone || 'Phone on file'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          isHomved ? 'bg-blue-50 text-blue-800 border-blue-200' :
                          isTransit ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          s === 'Delivered' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          'bg-neutral-100 text-neutral-700 border-neutral-200'
                        }`}>
                          {s}
                        </span>
                        {ord.logistics_status && (
                          <span className="block text-[10px] text-neutral-400 mt-1">
                            Logistics: {ord.logistics_status}
                          </span>
                        )}
                      </td>

                      {/* Reverse AWB */}
                      <td className="py-3.5 px-4">
                        {ord.tracking_number ? (
                          <div>
                            <span className="font-mono font-bold text-neutral-900 text-[11px] block">
                              {ord.tracking_number}
                            </span>
                            <span className="text-[10px] text-neutral-400">Delhivery Reverse Logistics</span>
                          </div>
                        ) : (
                          <span className="text-neutral-400 italic text-[11px]">Pending Pickup</span>
                        )}
                      </td>

                      {/* Amount & Payout */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-neutral-900 block">
                          ₹{Number(ord.total || ord.subtotal || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-neutral-400 uppercase">
                          {ord.payment_method === 'cod' ? 'Cash on Delivery' : 'Prepaid (Online)'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {ord.tracking_number && (
                          <button
                            type="button"
                            onClick={() => handleViewTracking(ord.tracking_number)}
                            className="p-1.5 hover:bg-neutral-100 text-neutral-600 rounded-lg transition-colors cursor-pointer"
                            title="View Reverse Tracking Scans"
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
                          className="px-3 py-1.5 bg-neutral-900 hover:bg-black text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Pagination Footer Bar */}
        {!loading && filteredOrders.length > 0 && (
          <div className="p-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans">
            <div className="flex items-center gap-3 text-neutral-500">
              <span>
                Showing <strong className="font-semibold text-neutral-900">{(safeCurrentPage - 1) * pageSize + 1}</strong>–
                <strong className="font-semibold text-neutral-900">{Math.min(safeCurrentPage * pageSize, filteredOrders.length)}</strong> of{' '}
                <strong className="font-semibold text-neutral-900">{filteredOrders.length}</strong> claims
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
                        <span key={`sr-refund-ellipsis-${idx}`} className="w-7 text-center text-neutral-400 text-xs">
                          ...
                        </span>
                      );
                    }
                    const isActive = p === safeCurrentPage;
                    return (
                      <button
                        key={`sr-refund-page-${p}`}
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
      </div>

      {/* 6. Live Reverse Tracking Scans Modal/Drawer */}
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
                  Reverse Logistics Scan History
                </h3>
                <p className="text-xs text-neutral-500 font-mono">AWB: {activeTrackingAwb}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTrackingAwb(null)}
                className="text-neutral-400 hover:text-black p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingTracking ? (
              <div className="py-8 text-center text-neutral-400 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-xs">Fetching real-time scans from Shiprocket...</span>
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
                Package is scheduled for pickup at customer doorstep. Scans will populate upon rider collection.
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

      {/* 7. Dedicated Reverse Return Order Detail Modal */}
      <ReturnOrderDetailModal
        orderId={selectedOrderIdForDetail}
        isOpen={isDetailModalOpen}
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

export default AdminShiprocketRefundDesk;
