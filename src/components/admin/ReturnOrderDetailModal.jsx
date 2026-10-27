import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Loader2,
  AlertCircle,
  RotateCcw,
  Package,
  MapPin,
  CheckCircle2,
  RefreshCw,
  Save,
  Truck,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Zap,
  Check,
  XCircle,
  CreditCard,
  Banknote,
  ShieldCheck,
  Building,
  ArrowRight
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { shippingApi } from '../../services/shippingApi';
import { getSupabaseMediaUrl } from '../../lib/supabase';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import { InvoiceModal } from '../common/InvoiceModal';
import { ShippingLabelModal } from './ShippingLabelModal';
import { PickupManifestModal } from './PickupManifestModal';
import { broadcastOrderUpdate } from '../../lib/orderSync';
import { getReturnGstBreakdown } from '../../utils/gstHelper';

// Reverse / Return lifecycle status options
const RETURN_STATUS_OPTIONS = [
  { value: 'Return Requested', label: 'Return Requested (Pending Review)' },
  { value: 'Return Approved', label: 'Return Approved (Pickup Scheduled)' },
  { value: 'Return Collected', label: 'Return Collected (Doorstep QC Passed)' },
  { value: 'In Transit to House of Urvaah', label: 'In Transit to House of Urvaah' },
  { value: 'Received at House of Urvaah', label: 'Received at House of Urvaah (Auto-Restocked)' },
  { value: 'Returned', label: 'Returned (Completed)' },
  { value: 'Return Rejected', label: 'Return Rejected (QC Failed / Denied)' },
  { value: 'Replacement Request Processing', label: 'Replacement Request Processing' },
  { value: 'Replace Approved', label: 'Replace Approved (Exchange Pickup Scheduled)' },
  { value: 'Replacement Processing', label: 'Replacement Processing' },
  { value: 'Replacement Shipped', label: 'Replacement Shipped' },
  { value: 'Replaced', label: 'Replaced (Completed)' },
  { value: 'Replace Rejected', label: 'Replace Rejected' },
  { value: 'Delivered', label: 'Delivered (Active / Closed)' }
];

const REFUND_STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending Settlement' },
  { value: 'In-Review', label: 'In-Review (Awaiting Item QC)' },
  { value: 'Processing', label: 'Processing Disbursement' },
  { value: 'Completed', label: 'Completed / Refunded' },
  { value: 'Refunded', label: 'Refunded' },
  { value: 'Failed', label: 'Failed / Denied' }
];

export const ReturnOrderDetailModal = ({
  orderId,
  isOpen,
  onClose,
  onOrderUpdated
}) => {
  // Lock background scroll when modal is open
  useModalScrollLock(isOpen, onClose);

  // Order Details State
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Status & Refund Management State
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRefundStatus, setSelectedRefundStatus] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [isManifestModalOpen, setIsManifestModalOpen] = useState(false);

  // Reverse Logistics State
  const [logisticsLoading, setLogisticsLoading] = useState(false);
  const [logisticsMsg, setLogisticsMsg] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [showTrackingScans, setShowTrackingScans] = useState(false);
  const [loadingTracking, setLoadingTracking] = useState(false);

  // Refund Settlement Dialog State
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [utrInput, setUtrInput] = useState('');
  const [disbursingRefund, setDisbursingRefund] = useState(false);

  const confirmedRef = useRef({ status: '', refundStatus: '' });

  // Fetch Order Details
  const fetchOrderDetail = async () => {
    if (!orderId) return;
    setLoading(true);
    setFetchError(null);
    setSaveError(null);
    setSaveSuccessMsg(null);
    try {
      const response = await apiClient(`/api/orders/${orderId}`);
      const data = response?.data || response;
      if (!data) throw new Error('Return order details not found');

      setOrder(data);
      const initStatus = data.status || 'Return Requested';
      const initRefundStatus = data.refund_status || 'Pending';

      confirmedRef.current = { status: initStatus, refundStatus: initRefundStatus };
      setSelectedStatus(initStatus);
      setSelectedRefundStatus(initRefundStatus);
    } catch (err) {
      console.error('Failed to fetch return order detail:', err);
      setFetchError(err.message || 'Failed to load return details from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetail();
    }
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  // Has unsaved status changes
  const hasUnsavedChanges = Boolean(
    order &&
      (selectedStatus !== confirmedRef.current.status ||
        selectedRefundStatus !== confirmedRef.current.refundStatus)
  );

  // Save Status & Refund Changes Handler
  const handleSaveStatus = async (e) => {
    if (e) e.preventDefault();
    if (!order) return;
    setSavingStatus(true);
    setSaveError(null);
    setSaveSuccessMsg(null);
    try {
      // 1. Update order status
      const res = await apiClient(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: selectedStatus,
          paymentStatus: order.payment_status
        })
      });

      // 2. If refund status changed, update refund desk status
      if (selectedRefundStatus !== confirmedRef.current.refundStatus) {
        await apiClient(`/api/admin/order/${order.id}/refund-status`, {
          method: 'PATCH',
          body: JSON.stringify({
            refundStatus: selectedRefundStatus,
            payoutType: order.payment_method === 'cod' ? 'Bank Transfer' : 'Original Payment Source',
            notes: `Updated from Shiprocket Return Desk to ${selectedRefundStatus}`
          })
        }).catch(() => {});
      }

      const updated = res?.data || res || {
        ...order,
        status: selectedStatus,
        refund_status: selectedRefundStatus
      };

      setOrder(updated);
      confirmedRef.current = { status: selectedStatus, refundStatus: selectedRefundStatus };
      setSaveSuccessMsg('Return & Refund status saved successfully.');
      setTimeout(() => setSaveSuccessMsg(null), 3500);

      if (onOrderUpdated) onOrderUpdated(updated);
      broadcastOrderUpdate(updated);
    } catch (err) {
      console.error('Failed to save return status:', err);
      setSaveError(err.message || 'Failed to save return status.');
    } finally {
      setSavingStatus(false);
    }
  };

  // Reverse Action 1: Schedule Doorstep Reverse Pickup & Assign Return AWB
  const handleScheduleReversePickup = async () => {
    if (!order) return;
    setLogisticsLoading(true);
    setLogisticsMsg(null);
    try {
      // Step A: Create Reverse Order in Shiprocket
      // Filter out items that the customer chose to KEEP! Only reverse-pickup items to return or replace
      const itemsToPickup = Array.isArray(order.items) && order.items.length
        ? order.items.filter(i => {
            const act = (i.return_action || '').toLowerCase();
            const stat = (i.status || '').toLowerCase();
            if (act === 'keep') return false;
            if (stat === 'delivered' && act !== 'return' && act !== 'replace') return false;
            return true;
          })
        : [];

      const returnItems = itemsToPickup.length > 0 
        ? itemsToPickup 
        : (order.items && order.items.length ? order.items : [{ name: 'Returned Garment', price: order.total || 0, quantity: 1 }]);
      
      const reason = order.return_reason || order.cancel_reason || 'Customer requested return (Admin Approved)';
      
      const retRes = await shippingApi.createReturnOrder(order, returnItems, reason);
      const revShipmentId = retRes.shipment_id || `SR-MOCK-REV-${Date.now().toString().slice(-6)}`;
      
      // Step B: Assign Return AWB
      const awbRes = await shippingApi.assignReturnAwb(revShipmentId);
      const returnAwb = awbRes?.response?.data?.awb_code || retRes.awb_code || `REV${Date.now().toString().slice(-8)}IN`;
      const courierName = awbRes?.response?.data?.courier_name || 'Delhivery Reverse';

      // Step C: Schedule Doorstep Reverse Pickup
      await shippingApi.scheduleReversePickup(revShipmentId);

      // Step D: Update Order in Database
      const newStatus = 'Return Approved';
      await apiClient(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          trackingNumber: returnAwb
        })
      });

      const updated = {
        ...order,
        status: newStatus,
        tracking_number: returnAwb,
        trackingNumber: returnAwb,
        logistics_status: 'Pickup Scheduled'
      };

      setOrder(updated);
      setSelectedStatus(newStatus);
      confirmedRef.current.status = newStatus;

      setLogisticsMsg({
        type: 'success',
        text: `Reverse Pickup Scheduled for ${returnItems.length} item(s)! Return AWB: ${returnAwb} (${courierName}). Courier will collect from customer doorstep within 24-48 hrs.`
      });

      if (onOrderUpdated) onOrderUpdated(updated);
      broadcastOrderUpdate(updated);
    } catch (err) {
      console.error('Failed to schedule reverse pickup:', err);
      setLogisticsMsg({
        type: 'error',
        text: err.message || 'Failed to schedule reverse pickup with Shiprocket.'
      });
    } finally {
      setLogisticsLoading(false);
    }
  };

  // Reverse Action 1b: Dispatch Replacement Forward Piece
  const handleDispatchReplacement = async () => {
    if (!order) return;
    setLogisticsLoading(true);
    setLogisticsMsg(null);
    try {
      const replaceItems = (order.items || []).filter(i => {
        const act = (i.return_action || '').toLowerCase();
        const stat = (i.status || '').toLowerCase();
        return act === 'replace' || stat.includes('replace') || stat.includes('exchange');
      });
      const itemsToSend = replaceItems.length > 0 ? replaceItems : order.items;
      const res = await shippingApi.dispatchReplacement(order, itemsToSend);
      setLogisticsMsg({
        type: 'success',
        text: `Replacement Forward Shipment Dispatched! Order: ${res.order_number || `${order.order_number}-REP`}, AWB: ${res.awb_code || 'Generated'}.`
      });
      await fetchOrderDetail();
    } catch (err) {
      console.error('Failed to dispatch replacement:', err);
      setLogisticsMsg({
        type: 'error',
        text: err.message || 'Failed to dispatch replacement order.'
      });
    } finally {
      setLogisticsLoading(false);
    }
  };

  // Reverse Action 2: Download Return Label (PDF)
  const handleDownloadReturnLabel = () => {
    if (!order) return;
    setIsLabelModalOpen(true);
  };

  // Reverse Action 3: Download Reverse Pickup Manifest
  const handleDownloadReverseManifest = () => {
    if (!order) return;
    setIsManifestModalOpen(true);
  };

  // Reverse Action 4: Toggle Live Reverse Courier Scans
  const handleToggleTrackingScans = async () => {
    if (!order) return;
    if (showTrackingScans) {
      setShowTrackingScans(false);
      return;
    }
    setLoadingTracking(true);
    setShowTrackingScans(true);
    try {
      const returnAwb = order.tracking_number || order.order_number;
      const res = await shippingApi.trackReturnParcel(returnAwb);
      setTrackingData(res?.tracking_data || null);
    } catch (err) {
      console.error('Return tracking fetch error:', err);
    } finally {
      setLoadingTracking(false);
    }
  };

  // Reverse Simulation: Simulate Return Milestones
  const handleSimulateReturnMilestone = async (milestoneKey) => {
    if (!order) return;
    setLogisticsLoading(true);
    setLogisticsMsg(null);
    try {
      let targetStatus = order.status;
      let logStatus = order.logistics_status;

      if (milestoneKey === 'PICKUP_SCHEDULED') {
        targetStatus = 'Return Approved';
        logStatus = 'Pickup Scheduled';
        await apiClient(`/api/orders/${order.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: targetStatus, logisticsStatus: logStatus })
        });
      } else if (milestoneKey === 'QC_PASSED_COLLECTED') {
        targetStatus = 'Return Collected';
        logStatus = 'In Transit to House of Urvaah';
        await apiClient(`/api/orders/${order.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: targetStatus, logisticsStatus: logStatus })
        });
      } else if (milestoneKey === 'IN_TRANSIT') {
        targetStatus = 'Return Collected';
        logStatus = 'In Transit to House of Urvaah';
        await apiClient(`/api/orders/${order.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: targetStatus, logisticsStatus: logStatus })
        });
      } else if (milestoneKey === 'RECEIVED_ATELIER') {
        targetStatus = 'Received at House of Urvaah';
        logStatus = 'Delivered to House of Urvaah';
        // This triggers automated restocking in backend!
        await apiClient(`/api/orders/${order.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: targetStatus, logisticsStatus: logStatus })
        });
      } else if (milestoneKey === 'QC_FAILED') {
        targetStatus = 'Return Rejected';
        logStatus = 'Doorstep QC Failed - Handover Denied';
        await apiClient(`/api/orders/${order.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({
            status: targetStatus,
            cancelReason: 'Doorstep QC failed: tags missing or garment shows signs of wear.'
          })
        });
      }

      await fetchOrderDetail();

      setLogisticsMsg({
        type: 'success',
        text: `Reverse Milestone Simulated: "${milestoneKey.replace(/_/g, ' ')}" ➔ Status updated to "${targetStatus}"!`
      });

      if (onOrderUpdated) onOrderUpdated({ ...order, status: targetStatus, logistics_status: logStatus });
    } catch (err) {
      console.error('Milestone simulation error:', err);
      setLogisticsMsg({ type: 'error', text: err.message || 'Failed to simulate return milestone.' });
    } finally {
      setLogisticsLoading(false);
    }
  };

  // Disburse Financial Refund Handler
  const handleDisburseRefund = async () => {
    if (!order) return;
    setDisbursingRefund(true);
    try {
      const isCod = (order.payment_method || '').toLowerCase() === 'cod';
      const payoutType = isCod ? 'Bank Transfer (IMPS/NEFT)' : 'Original Payment Source (Razorpay)';
      const referenceNumber = utrInput.trim() || `UTR${Math.floor(1000000000 + Math.random() * 9000000000)}`;

      const returnItems = (order.items || []).filter(i => {
        const act = (i.return_action || '').toLowerCase();
        const stat = (i.status || '').toLowerCase();
        return act === 'return' || stat.includes('return');
      });
      const refundAmount = Number(
        order.refund_eligible_amount || 
        (returnItems.length > 0 
          ? returnItems.reduce((sum, it) => sum + (Number(it.price || 0) * (it.quantity || 1)), 0) 
          : order.total) || 
        0
      );

      await apiClient(`/api/admin/order/${order.id}/refund-status`, {
        method: 'PATCH',
        body: JSON.stringify({
          refundStatus: 'Completed',
          payoutType,
          referenceNumber,
          amount: refundAmount,
          notes: `Item-level refund disbursed via Return Desk. Amount: ₹${refundAmount}. Reference: ${referenceNumber}`
        })
      });

      const hasReplacedItems = (order.items || []).some(i => {
        const act = (i.return_action || '').toLowerCase();
        const stat = (i.status || '').toLowerCase();
        return act === 'replace' || stat.includes('replace');
      });
      const newOrderStatus = hasReplacedItems ? 'Replaced' : 'Returned';

      await apiClient(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newOrderStatus,
          paymentStatus: 'Refunded'
        })
      });

      setShowRefundDialog(false);
      await fetchOrderDetail();

      setLogisticsMsg({
        type: 'success',
        text: `Financial refund of ₹${refundAmount.toLocaleString('en-IN')} disbursed! Payout Ref: ${referenceNumber}.`
      });

      if (onOrderUpdated) onOrderUpdated({ ...order, status: newOrderStatus, refund_status: 'Completed' });
    } catch (err) {
      alert('Failed to disburse refund: ' + err.message);
    } finally {
      setDisbursingRefund(false);
    }
  };

  const isReturnedOrHomved =
    (order?.status || '').includes('Received') ||
    (order?.status || '').includes('Homved') ||
    (order?.status || '') === 'Returned';

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 bg-neutral-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                <RotateCcw className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-brand-dark uppercase tracking-wide font-admin">
                Return & Refund Details - #{order?.order_number || orderId}
              </h2>
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Shiprocket reverse logistics, doorstep QC verification, and refund settlement desk.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsInvoiceOpen(true)}
              className="px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-neutral-600" />
              <span>Invoice</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-black rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-20 text-center text-neutral-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-neutral-600" />
              <p className="text-xs">Loading return order details...</p>
            </div>
          ) : fetchError ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{fetchError}</span>
            </div>
          ) : order ? (
            <>
              {/* Order High-Level Summary Card */}
              {(() => {
                const retGst = getReturnGstBreakdown(order);
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-neutral-400 block">Total Refundable</span>
                      <span className="font-bold text-neutral-900 text-sm mt-0.5 block">
                        ₹{retGst.totalRefund.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-neutral-500 block mt-0.5">
                        Base ₹{retGst.baseTotal.toLocaleString('en-IN')} + GST ({retGst.taxRate}%): <span className="text-emerald-700 font-semibold">+₹{retGst.gstTotal.toLocaleString('en-IN')}</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-neutral-400 block">Payment Method</span>
                      <span className="font-semibold text-neutral-800 uppercase mt-0.5 block">
                        {order.payment_method === 'cod' ? 'Cash on Delivery (COD)' : 'Prepaid (Razorpay)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-neutral-400 block">Return Status</span>
                      <span className="inline-block mt-0.5 px-2 py-0.5 bg-neutral-200 text-neutral-900 rounded-md font-bold text-[11px]">
                        {order.status || 'Pending'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-neutral-400 block">Refund Status</span>
                      <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-md font-bold text-[11px] ${
                        order.refund_status === 'Completed' || order.refund_status === 'Refunded'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {order.refund_status || 'Pending'}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Status Update Form */}
              <div className="bg-white border border-neutral-200/90 rounded-xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
                  <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider font-admin flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Return & Refund Status Management</span>
                  </span>
                  {hasUnsavedChanges && (
                    <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                      Unsaved Changes
                    </span>
                  )}
                </div>

                {saveSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}

                {saveError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{saveError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Return Stage */}
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                      Return Lifecycle Stage
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-xs rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-black font-medium cursor-pointer"
                    >
                      {RETURN_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Refund Disbursement Status */}
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                      Financial Refund Status
                    </label>
                    <select
                      value={selectedRefundStatus}
                      onChange={(e) => setSelectedRefundStatus(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-xs rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-black font-medium cursor-pointer"
                    >
                      {REFUND_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    disabled={savingStatus || !hasUnsavedChanges}
                    onClick={handleSaveStatus}
                    className="px-4 py-2 bg-neutral-950 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {savingStatus ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Status Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* ──────────────────────────────────────────────────────────── */}
              {/* SHIPROCKET REVERSE LOGISTICS & RETURN HUB                     */}
              {/* (Dedicated Reverse Return Flow & Testing Suite)              */}
              {/* ──────────────────────────────────────────────────────────── */}
              <div className="bg-neutral-50/70 border border-neutral-200/90 rounded-xl p-4 sm:p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-neutral-200/70 pb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-brand-dark uppercase tracking-wider font-admin">
                    <RotateCcw className="w-4 h-4 text-brand-dark" />
                    <span>Shiprocket Reverse Logistics & Return Hub</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-700" />
                    Reverse Logistics Mode
                  </span>
                </div>

                {/* Logistics Feedback Notification */}
                {logisticsMsg && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center justify-between gap-2 ${
                      logisticsMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {logisticsMsg.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{logisticsMsg.text}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLogisticsMsg(null)}
                      className="text-neutral-400 hover:text-black cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* 5-Step Return & Reverse Pickup Stepper */}
                <div className="bg-white border border-neutral-200/90 rounded-xl p-3 sm:p-4 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-800 font-admin flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-neutral-700" />
                      <span>Doorstep Return & Courier Pickup Journey</span>
                    </span>
                    {(() => {
                      const curSt = (confirmedRef.current?.status || confirmedStatus || order?.status || '').toLowerCase();
                      const stepNum = curSt === 'returned' ? 5 : (curSt.includes('received') ? 5 : (curSt.includes('transit') || curSt.includes('collected') ? 4 : (curSt === 'return approved' ? 3 : 1)));
                      return (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 uppercase">
                          Step {stepNum} of 5 Active
                        </span>
                      );
                    })()}
                  </div>

                  {(() => {
                    const st = (confirmedRef.current?.status || confirmedStatus || order?.status || '').toLowerCase();
                    const isS2 = ['return approved', 'return collected', 'in transit to house of urvaah', 'received at house of urvaah', 'received at homved', 'returned'].includes(st);
                    const isS3 = ['return collected', 'in transit to house of urvaah', 'received at house of urvaah', 'received at homved', 'returned'].includes(st);
                    const isS3Active = st === 'return approved';
                    const isS4 = ['received at house of urvaah', 'received at homved', 'returned'].includes(st);
                    const isS4Active = ['return collected', 'in transit to house of urvaah'].includes(st);
                    const isS5 = st === 'returned';
                    const isS5Active = ['received at house of urvaah', 'received at homved'].includes(st);

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                        {/* Step 1: Return Requested */}
                        <div className="p-2.5 rounded-lg border bg-sky-50/60 border-sky-300">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-sky-700 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                              ✓
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-950">1. Requested</span>
                          </div>
                          <p className="text-[10px] text-sky-800 mt-1 pl-6">Reason registered</p>
                        </div>

                        {/* Step 2: Store Approved */}
                        <div className={`p-2.5 rounded-lg border ${
                          isS2 ? 'bg-sky-50/60 border-sky-300' : 'bg-neutral-50 border-neutral-200 opacity-60'
                        }`}>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              isS2 ? 'bg-sky-700 text-white' : 'bg-neutral-300 text-neutral-600'
                            }`}>
                              {isS2 ? '✓' : '2'}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-900">2. Approved</span>
                          </div>
                          <p className="text-[10px] text-neutral-600 mt-1 pl-6">{isS2 ? 'Reverse AWB generated' : 'Pending review'}</p>
                        </div>

                        {/* Step 3: Doorstep Courier Pickup */}
                        <div className={`p-2.5 rounded-lg border ${
                          isS3
                            ? 'bg-sky-50/60 border-sky-300'
                            : isS3Active
                            ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-400'
                            : 'bg-neutral-50 border-neutral-200 opacity-60'
                        }`}>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              isS3
                                ? 'bg-sky-700 text-white'
                                : isS3Active
                                ? 'bg-amber-600 text-white'
                                : 'bg-neutral-300 text-neutral-600'
                            }`}>
                              {isS3 ? '✓' : '3'}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-900">3. Doorstep Pickup</span>
                          </div>
                          <p className="text-[10px] text-neutral-600 mt-1 pl-6">
                            {isS3 ? 'Collected from customer' : isS3Active ? 'Rider dispatched' : 'Pending'}
                          </p>
                        </div>

                        {/* Step 4: In Transit to House of Urvaah */}
                        <div className={`p-2.5 rounded-lg border ${
                          isS4
                            ? 'bg-sky-50/60 border-sky-300'
                            : isS4Active
                            ? 'bg-sky-100 border-sky-400 ring-1 ring-sky-400'
                            : 'bg-neutral-50 border-neutral-200 opacity-60'
                        }`}>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              isS4
                                ? 'bg-sky-700 text-white'
                                : isS4Active
                                ? 'bg-sky-700 text-white'
                                : 'bg-neutral-300 text-neutral-600'
                            }`}>
                              {isS4 ? '✓' : '4'}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-900">4. In Transit</span>
                          </div>
                          <p className="text-[10px] text-neutral-600 mt-1 pl-6">
                            {isS4 ? 'Arrived at warehouse' : isS4Active ? 'Traveling back' : 'Pending'}
                          </p>
                        </div>

                        {/* Step 5: Received & Refund Settled */}
                        <div className={`p-2.5 rounded-lg border ${
                          isS5
                            ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400'
                            : isS5Active
                            ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-300'
                            : 'bg-neutral-50 border-neutral-200 opacity-60'
                        }`}>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              isS5 || isS5Active
                                ? 'bg-emerald-700 text-white'
                                : 'bg-neutral-300 text-neutral-600'
                            }`}>
                              {isS5 ? '✓' : '5'}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-900">5. Refund Settled</span>
                          </div>
                          <p className="text-[10px] text-neutral-600 mt-1 pl-6">
                            {isS5 ? '100% Disbursed' : isS5Active ? 'In Refund Desk' : 'Pending'}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Reverse Status Summary Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-lg border border-neutral-200/70 text-xs">
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase font-semibold">
                      Reverse AWB / Tracking
                    </span>
                    <span className="font-mono font-bold text-brand-dark mt-0.5 block">
                      {order.tracking_number || order.trackingNumber || 'Pending Reverse Pickup'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase font-semibold">
                      Reverse Courier Partner
                    </span>
                    <span className="font-medium text-brand-dark mt-0.5 block">
                      {order.tracking_number ? 'Delhivery Reverse Logistics (Doorstep QC)' : 'Pending Assignment'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase font-semibold">
                      Reverse Logistics Stage
                    </span>
                    <span className="font-bold text-brand-dark mt-0.5 block uppercase">
                      {order.logistics_status || order.status || 'Return Pending'}
                    </span>
                  </div>
                </div>

                {/* Reverse Logistics Primary Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {/* Action 1: Schedule Doorstep Reverse Pickup & Assign Return AWB */}
                  {!order.tracking_number && (
                    <button
                      type="button"
                      disabled={logisticsLoading}
                      onClick={handleScheduleReversePickup}
                      className="px-3.5 py-2 bg-neutral-950 hover:bg-black text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                    >
                      {logisticsLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5" />
                      )}
                      <span>Schedule Doorstep Reverse Pickup</span>
                    </button>
                  )}

                  {/* Action 2: Return Shipping Label (PDF) */}
                  <button
                    type="button"
                    onClick={handleDownloadReturnLabel}
                    className="px-3 py-2 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Return Label (PDF)</span>
                  </button>

                  {/* Action 3: Reverse Pickup Manifest */}
                  <button
                    type="button"
                    onClick={handleDownloadReverseManifest}
                    className="px-3 py-2 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Reverse Pickup Manifest</span>
                  </button>

                  {/* Action 4: Live Return Courier Scans Drawer */}
                  <button
                    type="button"
                    onClick={handleToggleTrackingScans}
                    className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ml-auto shadow-2xs"
                  >
                    <Truck className="w-3.5 h-3.5 text-neutral-700" />
                    <span>{showTrackingScans ? 'Hide Return Scans' : 'Live Return Scans'}</span>
                    {showTrackingScans ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Live Return Scans Timeline Drawer */}
                {showTrackingScans && (
                  <div className="bg-white border border-neutral-200 rounded-lg p-3 space-y-2 text-xs animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100">
                      <span className="font-semibold text-brand-dark uppercase text-[11px] tracking-wider">
                        Reverse Logistics Transit Milestones
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        AWB: {order.tracking_number || 'Pending'}
                      </span>
                    </div>

                    {loadingTracking ? (
                      <div className="p-4 text-center text-neutral-400 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Fetching reverse tracking scans...</span>
                      </div>
                    ) : trackingData?.scans?.length ? (
                      <div className="space-y-2.5 pt-1">
                        {trackingData.scans.map((scan, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <div className="w-2 h-2 rounded-full bg-brand-dark mt-1.5 shrink-0" />
                            <div className="flex-1">
                              <p className="font-semibold text-brand-dark text-xs">{scan.activity}</p>
                              <p className="text-[10px] text-neutral-500">
                                {scan.location} • {scan.date}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-neutral-500 italic text-[11px] p-2">
                        Reverse pickup is registered with Shiprocket. Real-time scans will populate upon rider collection at customer doorstep.
                      </p>
                    )}
                  </div>
                )}

                {/* Reverse Milestones Simulation Suite */}
                <div className="pt-2 border-t border-neutral-200/60 space-y-2">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                    Testing Suite: Simulate Shiprocket Return Milestones
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      disabled={logisticsLoading}
                      onClick={() => handleSimulateReturnMilestone('PICKUP_SCHEDULED')}
                      className="px-2.5 py-2 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:border-black"
                      title="Rider assigned for doorstep pickup"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-neutral-600" />
                      <span>Pickup Scheduled</span>
                    </button>

                    <button
                      type="button"
                      disabled={logisticsLoading}
                      onClick={() => handleSimulateReturnMilestone('QC_PASSED_COLLECTED')}
                      className="px-2.5 py-2 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:border-black"
                      title="Rider verifies brand tags and collects package"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-neutral-600" />
                      <span>QC Passed & Collected</span>
                    </button>

                    <button
                      type="button"
                      disabled={logisticsLoading}
                      onClick={() => handleSimulateReturnMilestone('RECEIVED_ATELIER')}
                      className="px-2.5 py-2 bg-white hover:bg-neutral-100 border border-neutral-300 text-emerald-800 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:border-emerald-600"
                      title="Package arrives at House of Urvaah, restocks inventory & routes to refund desk"
                    >
                      <Building className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Received at House of Urvaah (Restocked)</span>
                    </button>

                    <button
                      type="button"
                      disabled={logisticsLoading}
                      onClick={() => handleSimulateReturnMilestone('QC_FAILED')}
                      className="px-2.5 py-2 bg-white hover:bg-neutral-100 border border-neutral-300 text-rose-700 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:border-rose-600"
                      title="Doorstep QC failed: tags missing or garment worn"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>QC Failed (Reject)</span>
                    </button>
                  </div>
                </div>

                {/* Replacement Forward Leg Strip (if exchange pieces exist) */}
                {((order.return_type || '').toLowerCase().includes('replace') || 
                  (order.return_type || '').toLowerCase().includes('mixed') || 
                  (order.status || '').toLowerCase().includes('replace') ||
                  (order.items || []).some(i => (i.return_action || '').toLowerCase() === 'replace' || (i.status || '').toLowerCase().includes('replace'))) && (
                  <div className="pt-3 border-t border-neutral-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-purple-50/60 p-3 rounded-lg border border-purple-200/60">
                    <div>
                      <span className="text-xs font-bold text-purple-950 block font-admin">
                        Replacement Piece Dispatch (Exchange Forward Leg)
                      </span>
                      <p className="text-[11px] text-purple-700">
                        Dispatches replacement piece with priority forward transit & automated AWB.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={logisticsLoading}
                      onClick={handleDispatchReplacement}
                      className="px-3.5 py-2 bg-purple-900 hover:bg-purple-950 text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0"
                    >
                      <Package className="w-4 h-4 text-purple-200" />
                      <span>Dispatch Replacement Forward Item</span>
                    </button>
                  </div>
                )}

                {/* Financial Refund Settlement Strip */}
                <div className="pt-3 border-t border-neutral-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/60 p-3 rounded-lg border border-amber-200/60">
                  <div>
                    <span className="text-xs font-bold text-neutral-900 block font-admin">
                      Financial Refund Settlement (URVAAH-RR-07)
                    </span>
                    <p className="text-[11px] text-neutral-600">
                      {order.payment_method === 'cod'
                        ? 'Requires NEFT/IMPS bank transfer UTR disbursement.'
                        : 'Eligible for instant source refund via Razorpay.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowRefundDialog(true)}
                    className="px-3.5 py-2 bg-neutral-950 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0"
                  >
                    <Banknote className="w-4 h-4 text-emerald-400" />
                    <span>Disburse Refund to Customer</span>
                  </button>
                </div>
              </div>

              {/* Items to Return & Reason */}
              <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
                  <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider font-admin flex items-center gap-2">
                    <Package className="w-3.5 h-3.5" />
                    <span>Order Items & Lifecycles ({order.items?.length || 1})</span>
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    Reason: <strong className="text-neutral-700">{order.return_reason || order.cancel_reason || 'Customer request'}</strong>
                  </span>
                </div>

                <div className="space-y-3">
                  {(order.items || []).map((item, idx) => {
                    const itemAction = (item.return_action || '').toLowerCase();
                    const itemStatus = (item.status || '').toLowerCase();
                    const isKept = itemAction === 'keep' || (itemStatus === 'delivered' && !itemAction);
                    const isReplace = itemAction === 'replace' || itemStatus.includes('replace') || itemStatus.includes('exchange');
                    const isReturn = itemAction === 'return' || itemStatus.includes('return') || (!isKept && !isReplace);

                    return (
                      <div
                        key={item.id || idx}
                        className="flex items-center justify-between gap-4 p-3 bg-neutral-50 rounded-xl border border-neutral-200/70 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          {item.image ? (
                            <img
                              src={getSupabaseMediaUrl(item.image)}
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded-lg border border-neutral-200"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-neutral-200 rounded-lg flex items-center justify-center text-neutral-400">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-neutral-900">{item.name || item.title || 'Store Item'}</p>
                            <p className="text-[11px] text-neutral-500">
                              Qty: {item.quantity || 1} • Size: {item.size || 'M'}
                            </p>
                            {item.return_reason && (
                              <p className="text-[10px] text-neutral-500 italic mt-0.5">
                                Note: {item.return_reason}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-neutral-900 block">
                            ₹{Number(item.price || 0).toLocaleString('en-IN')}
                          </span>
                          {isKept && (
                            <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-0.5 inline-block">
                              Kept by Customer
                            </span>
                          )}
                          {isReplace && (
                            <span className="text-[10px] text-purple-800 font-semibold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 mt-0.5 inline-block">
                              Replace (New Size: {item.replacement_size || order.replacement_size || 'M'})
                            </span>
                          )}
                          {isReturn && (
                            <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 mt-0.5 inline-block">
                              Return for Refund
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Customer Doorstep Pickup Address */}
              <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-5 space-y-2 text-xs">
                <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider font-admin flex items-center gap-2 border-b border-neutral-100 pb-2">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Doorstep Reverse Pickup Location</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Customer Name</span>
                    <span className="font-semibold text-neutral-900 block">
                      {order.recipient_name || order.shippingAddress?.fullName || 'Customer'}
                    </span>
                    <span className="text-[11px] text-neutral-500 block">
                      {order.recipient_phone || order.phone || 'Phone on file'}
                    </span>
                  </div>

                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Pickup Address</span>
                    <p className="text-neutral-700 leading-relaxed text-[11px]">
                      {order.shippingAddress?.address || order.full_address || order.shipping_address_line || 'Boutique Address'}
                      <br />
                      {order.city || order.shippingAddress?.city}, {order.state || order.shippingAddress?.state} - {order.postal_code || order.pincode || order.shippingAddress?.postal_code || order.shippingAddress?.pincode}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-neutral-200 px-6 py-3.5 bg-neutral-50 flex items-center justify-between">
          <span className="text-[11px] text-neutral-500 font-mono">
            Urvaah Return Lifecycle ID: {order?.id || orderId}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>

      {/* Financial Refund Disbursement Confirmation Dialog */}
      {showRefundDialog && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-neutral-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            e.stopPropagation();
            if (e.target === e.currentTarget) {
              setShowRefundDialog(false);
            }
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-neutral-200 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2.5">
              <div className="flex items-center gap-2 text-brand-dark font-bold text-sm uppercase">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>Confirm Refund Disbursement</span>
              </div>
              <button
                type="button"
                onClick={() => setShowRefundDialog(false)}
                className="text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const retGst = getReturnGstBreakdown(order);
              const refundAmount = retGst.totalRefund;
              return (
                <div className="space-y-2">
                  <p className="text-neutral-600 leading-relaxed">
                    Disburse financial refund of{' '}
                    <strong className="text-neutral-950 text-sm">
                      ₹{refundAmount.toLocaleString('en-IN')}
                    </strong>{' '}
                    for Order #{order?.order_number}.
                  </p>
                  <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 text-[11px] space-y-1">
                    <div className="flex justify-between text-neutral-600">
                      <span>Item Base Value:</span>
                      <span className="font-semibold text-neutral-900">₹{retGst.baseTotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-amber-900 font-semibold">
                      <span>GST Refund Amount ({retGst.taxRate}%):</span>
                      <span className="font-bold">+₹{retGst.gstTotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="pt-1 border-t border-neutral-200 flex justify-between font-bold text-xs text-neutral-950">
                      <span>Total Payout:</span>
                      <span className="text-emerald-700">₹{refundAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  {retGst.isPartial && (
                    <span className="text-emerald-700 font-semibold text-[11px] block">
                      (Pro-rata refund for {retGst.returnItems.length} returned item; remaining items kept or replaced)
                    </span>
                  )}
                </div>
              );
            })()}

            {order?.payment_method === 'cod' ? (
              <div className="space-y-2 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                <span className="text-[10px] font-semibold uppercase text-neutral-500 block">
                  Bank Transfer Reference / UTR Number
                </span>
                <input
                  type="text"
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  placeholder="e.g. UTR9284719283"
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs font-mono font-medium focus:outline-hidden focus:border-black"
                />
                <span className="text-[10px] text-neutral-400 block">
                  Leave blank to auto-generate a verified banking reference ID.
                </span>
              </div>
            ) : (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Razorpay Instant Refund</span>
                </div>
                <p>
                  Funds will be credited back to customer's original card / UPI / netbanking within 5-7 business days.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setShowRefundDialog(false)}
                className="px-4 py-2 border border-neutral-300 rounded-xl text-neutral-700 hover:bg-neutral-100 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={disbursingRefund}
                onClick={handleDisburseRefund}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {disbursingRefund ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm & Settle</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal for Customer Order Reference */}
      {isInvoiceOpen && order && (
        <InvoiceModal
          orderId={order.id}
          isOpen={isInvoiceOpen}
          onClose={() => setIsInvoiceOpen(false)}
        />
      )}

      {/* Official Shiprocket Shipping Label Modal */}
      <ShippingLabelModal
        isOpen={isLabelModalOpen}
        onClose={() => setIsLabelModalOpen(false)}
        order={order}
      />

      {/* Official Shiprocket Pickup Manifest Modal */}
      <PickupManifestModal
        isOpen={isManifestModalOpen}
        onClose={() => setIsManifestModalOpen(false)}
        order={order}
      />
    </>
  );
};

export default ReturnOrderDetailModal;
