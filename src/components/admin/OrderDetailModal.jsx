import React, { useState, useEffect } from 'react';
import {
  X,
  Loader2,
  AlertCircle,
  Package,
  MapPin,
  CheckCircle2,
  RefreshCw,
  Save,
  Lock,
  Image as ImageIcon,
  Truck,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Zap,
  RotateCcw,
  Check,
  XCircle
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { shippingApi } from '../../services/shippingApi';
import { getSupabaseMediaUrl } from '../../lib/supabase';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';

// Status options matching House of Urvaah lifecycle and policy values
const ORDER_STATUS_OPTIONS = [
  { value: 'Placed', label: 'Placed' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Processing', label: 'Processing' },
  { value: 'Packed', label: 'Packed' },
  { value: 'Dispatched', label: 'Dispatched' },
  { value: 'Shipped', label: 'Shipped' },
  { value: 'Out for Delivery', label: 'Out for Delivery' },
  { value: 'Delivered', label: 'Delivered' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Returned', label: 'Returned' },
  { value: 'Exchanged', label: 'Exchanged' }
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'Paid', label: 'Paid' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Failed', label: 'Failed' },
  { value: 'Refunded', label: 'Refunded' }
];

export const OrderDetailModal = ({ orderId, isOpen, onClose, onOptimisticPreview, onStatusPreview, onStatusUpdated, onOrderUpdated }) => {
  // Lock background scrolling on body and admin container when modal is open
  useModalScrollLock(isOpen, onClose);

  // Order Detail Fetch State (Hooks MUST be called unconditionally at top level!)
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Confirmed State vs Optimistic Selection State
  const [confirmedStatus, setConfirmedStatus] = useState('');
  const [confirmedPaymentStatus, setConfirmedPaymentStatus] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);

  // Logistics & Shiprocket Testing Suite State
  const [logisticsLoading, setLogisticsLoading] = useState(false);
  const [logisticsMsg, setLogisticsMsg] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [showTrackingScans, setShowTrackingScans] = useState(false);
  const [loadingTracking, setLoadingTracking] = useState(false);

  // Synchronous Ref tracking confirmed status & payment status across async saves & modal closes
  const confirmedRef = React.useRef({ status: '', paymentStatus: '' });

  // Fetch Full Order Details on Mount / Order ID change
  const fetchOrderDetail = async () => {
    if (!orderId) return;
    setLoading(true);
    setFetchError(null);
    setSaveError(null);
    setSaveSuccessMsg(null);
    try {
      const response = await apiClient(`/api/orders/${orderId}`);
      const data = response?.data || response;
      if (!data) throw new Error('Order details not found');

      setOrder(data);
      const initStatus = data.status || 'Placed';
      const initPaymentStatus = data.payment_status || 'Pending';

      confirmedRef.current = { status: initStatus, paymentStatus: initPaymentStatus };
      setConfirmedStatus(initStatus);
      setConfirmedPaymentStatus(initPaymentStatus);
      setSelectedStatus(initStatus);
      setSelectedPaymentStatus(initPaymentStatus);
    } catch (err) {
      console.error('Failed to fetch order detail:', err);
      setFetchError(err.message || 'Failed to load order details from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetail();
    }
  }, [isOpen, orderId]);

  // Handle Close Modal Action — revert any unpersisted optimistic preview in parent table
  const handleCloseModal = () => {
    const isUnsaved =
      selectedStatus !== confirmedRef.current.status ||
      selectedPaymentStatus !== confirmedRef.current.paymentStatus;

    if (isUnsaved && order) {
      const notifyPreview = onOptimisticPreview || onStatusPreview;
      if (notifyPreview) {
        notifyPreview({
          id: order.id,
          status: confirmedRef.current.status,
          payment_status: confirmedRef.current.paymentStatus,
          isPreview: false
        });
      }
      // Reset selected status back to confirmed state
      setSelectedStatus(confirmedRef.current.status);
      setSelectedPaymentStatus(confirmedRef.current.paymentStatus);
    }
    if (onClose) {
      onClose();
    }
  };

  // Optimistic Order Status Change Handler
  const handleOrderStatusChange = (newStatus) => {
    setSelectedStatus(newStatus);
    setSaveError(null);
    setSaveSuccessMsg(null);

    const isUnsaved =
      newStatus !== confirmedRef.current.status ||
      selectedPaymentStatus !== confirmedRef.current.paymentStatus;

    // Update parent table pill optimistically in local state immediately without API call
    const notifyPreview = onOptimisticPreview || onStatusPreview;
    if (notifyPreview && order) {
      notifyPreview({
        id: order.id,
        status: newStatus,
        payment_status: selectedPaymentStatus,
        isPreview: isUnsaved
      });
    }
  };

  // Optimistic Payment Status Change Handler
  const handlePaymentStatusChange = (newPaymentStatus) => {
    setSelectedPaymentStatus(newPaymentStatus);
    setSaveError(null);
    setSaveSuccessMsg(null);

    const isUnsaved =
      selectedStatus !== confirmedRef.current.status ||
      newPaymentStatus !== confirmedRef.current.paymentStatus;

    // Update parent table pill optimistically in local state immediately without API call
    const notifyPreview = onOptimisticPreview || onStatusPreview;
    if (notifyPreview && order) {
      notifyPreview({
        id: order.id,
        status: selectedStatus,
        payment_status: newPaymentStatus,
        isPreview: isUnsaved
      });
    }
  };

  // Early return guard AFTER all hooks are called unconditionally
  if (!isOpen || !orderId) return null;

  // Handle Save Status Action (Explicit Submit — persists to backend)
  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!order || savingStatus) return;

    if (!selectedStatus) {
      setSaveError('Please select a valid order status before saving.');
      return;
    }

    setSavingStatus(true);
    setSaveError(null);
    setSaveSuccessMsg(null);

    try {
      const payload = {
        status: selectedStatus,
        paymentStatus: selectedPaymentStatus
      };

      const response = await apiClient(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      const updatedData = response?.data || response || {
        ...order,
        status: selectedStatus,
        payment_status: selectedPaymentStatus
      };

      const newConfirmedStatus = updatedData.status || selectedStatus;
      const newConfirmedPaymentStatus = updatedData.payment_status || selectedPaymentStatus;

      // Update confirmed ref synchronously FIRST before state dispatch
      confirmedRef.current = {
        status: newConfirmedStatus,
        paymentStatus: newConfirmedPaymentStatus
      };

      // Update confirmed state in modal
      setOrder(updatedData);
      setConfirmedStatus(newConfirmedStatus);
      setConfirmedPaymentStatus(newConfirmedPaymentStatus);
      setSelectedStatus(newConfirmedStatus);
      setSelectedPaymentStatus(newConfirmedPaymentStatus);
      setSaveSuccessMsg('Order status updated successfully!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);

      // Explicitly clear preview indicator in parent table preview handler
      const notifyPreview = onOptimisticPreview || onStatusPreview;
      if (notifyPreview && order) {
        notifyPreview({
          id: order.id,
          status: newConfirmedStatus,
          payment_status: newConfirmedPaymentStatus,
          isPreview: false
        });
      }

      // Notify parent list to commit change permanently and apply active filter rules
      const notifyParent = onStatusUpdated || onOrderUpdated;
      if (notifyParent) {
        notifyParent({
          ...updatedData,
          status: newConfirmedStatus,
          payment_status: newConfirmedPaymentStatus,
          isPreview: false
        });
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
      setSaveError(err.message || 'Failed to update order status. Please try again.');

      // On save failure: revert parent table row back to confirmed values
      const notifyPreview = onOptimisticPreview || onStatusPreview;
      if (notifyPreview && order) {
        notifyPreview({
          id: order.id,
          status: confirmedRef.current.status,
          payment_status: confirmedRef.current.paymentStatus,
          isPreview: false
        });
      }
    } finally {
      setSavingStatus(false);
    }
  };

  // Check if status has unsaved changes compared to last confirmed state
  const hasUnsavedChanges = Boolean(
    order &&
      (selectedStatus !== confirmedRef.current.status ||
        selectedPaymentStatus !== confirmedRef.current.paymentStatus)
  );

  // Logistics Action 1: Generate AWB & Dispatch Order
  const handleGenerateAwb = async () => {
    if (!order) return;
    setLogisticsLoading(true);
    setLogisticsMsg(null);
    try {
      const shipRes = await shippingApi.createShipment(order);
      const shipmentId = shipRes.shipment_id || `SR-MOCK-SHP-${Date.now().toString().slice(-6)}`;
      
      const awbRes = await shippingApi.assignAwb(shipmentId);
      const awbCode = awbRes?.response?.data?.awb_code || `URV${Date.now().toString().slice(-8)}IN`;
      const courierName = awbRes?.response?.data?.courier_name || 'Delhivery Express';
      
      const newStatus = 'Shipped';
      await apiClient(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, trackingNumber: awbCode })
      });

      const updated = { ...order, status: newStatus, tracking_number: awbCode, trackingNumber: awbCode };
      setOrder(updated);
      setSelectedStatus(newStatus);
      confirmedRef.current.status = newStatus;
      setConfirmedStatus(newStatus);

      setLogisticsMsg({
        type: 'success',
        text: `AWB Generated: ${awbCode} (${courierName}). Order marked as Shipped!`
      });
      
      if (onStatusUpdated || onOrderUpdated) {
        (onStatusUpdated || onOrderUpdated)(updated);
      }
    } catch (err) {
      console.error('Failed to generate AWB:', err);
      setLogisticsMsg({ type: 'error', text: err.message || 'Failed to generate AWB with Shiprocket.' });
    } finally {
      setLogisticsLoading(false);
    }
  };

  // Logistics Action 2: Simulate Milestones via Webhook
  const handleSimulateMilestone = async (milestoneStatus) => {
    if (!order) return;
    setLogisticsLoading(true);
    setLogisticsMsg(null);
    try {
      const identifier = order.tracking_number || order.order_number || order.id;
      const res = await shippingApi.simulateWebhookStatus(identifier, milestoneStatus);
      
      const newStatus = res.mapped_urvaah_status || (
        milestoneStatus === 'IN TRANSIT' ? 'Shipped' :
        milestoneStatus === 'OUT FOR DELIVERY' ? 'Out for Delivery' :
        milestoneStatus === 'DELIVERED' ? 'Delivered' : 'Cancelled'
      );

      // Reload fresh order details
      await fetchOrderDetail();

      setLogisticsMsg({
        type: 'success',
        text: `Milestone Simulated: "${milestoneStatus}" ➔ Order status synced to "${newStatus}"!`
      });

      if (onStatusUpdated || onOrderUpdated) {
        (onStatusUpdated || onOrderUpdated)({ ...order, status: newStatus });
      }
    } catch (err) {
      console.error('Simulation error:', err);
      setLogisticsMsg({ type: 'error', text: err.message || 'Failed to simulate milestone.' });
    } finally {
      setLogisticsLoading(false);
    }
  };

  // Logistics Action 3: Live Tracking Scans Toggle
  const handleFetchTracking = async () => {
    if (!order) return;
    if (showTrackingScans) {
      setShowTrackingScans(false);
      return;
    }
    setLoadingTracking(true);
    setShowTrackingScans(true);
    try {
      const awb = order.tracking_number || order.order_number;
      const res = await shippingApi.trackShipment(awb);
      setTrackingData(res?.tracking_data || null);
    } catch (err) {
      console.error('Tracking fetch error:', err);
    } finally {
      setLoadingTracking(false);
    }
  };

  // Logistics Action 4: Download PDF Label
  const handleDownloadLabel = async () => {
    if (!order) return;
    try {
      const targetId = order.tracking_number || order.id;
      const res = await shippingApi.generateLabel([targetId]);
      if (res?.label_url) {
        window.open(res.label_url, '_blank');
      } else {
        alert('Shipping label generated: ' + (res?.message || 'Ready'));
      }
    } catch (err) {
      alert('Label generation failed: ' + err.message);
    }
  };

  // Logistics Action 5: Download Manifest
  const handleDownloadManifest = async () => {
    if (!order) return;
    try {
      const targetId = order.tracking_number || order.id;
      const res = await shippingApi.generateManifest([targetId]);
      if (res?.manifest_url) {
        window.open(res.manifest_url, '_blank');
      } else {
        alert('Courier manifest generated: ' + (res?.message || 'Ready'));
      }
    } catch (err) {
      alert('Manifest generation failed: ' + err.message);
    }
  };

  // Logistics Action 6: Reverse Pickup for Return/Exchange
  const handleCreateReversePickup = async () => {
    if (!order) return;
    setLogisticsLoading(true);
    setLogisticsMsg(null);
    try {
      const res = await shippingApi.createReturnOrder(order, order.items, 'Customer return approved by admin');
      setLogisticsMsg({
        type: 'success',
        text: `Reverse Pickup Scheduled! AWB: ${res.awb_code} (Pickup from customer within 24-48 hrs).`
      });
    } catch (err) {
      setLogisticsMsg({ type: 'error', text: err.message || 'Failed to schedule reverse pickup.' });
    } finally {
      setLogisticsLoading(false);
    }
  };

  // Logistics Action 7: Dispatch Replacement Forward Item
  const handleDispatchReplacement = async () => {
    if (!order) return;
    setLogisticsLoading(true);
    setLogisticsMsg(null);
    try {
      const res = await shippingApi.dispatchReplacement(order, order.items);
      setLogisticsMsg({
        type: 'success',
        text: `Replacement Dispatched! Order: ${res.order_number}, AWB: ${res.awb_code} (${res.courier_name}).`
      });
    } catch (err) {
      setLogisticsMsg({ type: 'error', text: err.message || 'Failed to dispatch replacement.' });
    } finally {
      setLogisticsLoading(false);
    }
  };

  const subtotal = parseFloat(order?.subtotal || order?.original_total || 0);
  const shippingCost = parseFloat(order?.shipping_cost || order?.shipping || 0);
  const discountAmount = parseFloat(order?.discount_amount || order?.discount || 0);
  const totalAmount = parseFloat(order?.total || 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/70 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-200 font-admin overscroll-contain"
      onClick={handleCloseModal}
      onWheel={(e) => {
        if (e.target === e.currentTarget) {
          e.stopPropagation();
        }
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-neutral-200 my-auto transition-all max-h-[85vh] sm:max-h-[88vh] flex flex-col overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-admin font-bold text-brand-dark tracking-tight">
              Order Details - {order?.order_number || order?.id?.slice(0, 8) || orderId}
            </h2>
            <p className="text-xs text-neutral-500 font-admin mt-0.5">
              View customer details, shipping address, line items, and manage status.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCloseModal}
            className="p-1.5 text-neutral-400 hover:text-brand-dark hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Loading Skeleton Layout */}
          {loading ? (
            <div className="space-y-6 animate-pulse">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="h-40 bg-neutral-100 rounded-xl" />
                <div className="h-40 bg-neutral-100 rounded-xl" />
              </div>
              <div className="h-32 bg-neutral-100 rounded-xl" />
              <div className="h-48 bg-neutral-100 rounded-xl" />
            </div>
          ) : fetchError ? (
            /* Error State with Retry Button inside Modal */
            <div className="p-8 text-center bg-neutral-50/70 border border-neutral-200 rounded-xl space-y-3">
              <AlertCircle className="w-10 h-10 text-neutral-500 mx-auto" />
              <h3 className="text-sm font-semibold text-brand-dark">Failed to Load Order Details</h3>
              <p className="text-xs text-neutral-600 max-w-sm mx-auto">{fetchError}</p>
              <button
                type="button"
                onClick={fetchOrderDetail}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-dark text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Loading</span>
              </button>
            </div>
          ) : order ? (
            <>
              {/* 2-Column Top Section: Order Information + Shipping Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Card 1: Order Information */}
                <div className="bg-neutral-50/50 border border-neutral-200/80 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 border-b border-neutral-200/60 pb-2 text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    <Package className="w-4 h-4 text-neutral-500" />
                    <span>Order Information</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Order Number:</span>
                      <span className="font-admin font-bold text-brand-dark">{order.order_number || order.id}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-neutral-500">Order Date:</span>
                      <span className="font-medium text-brand-dark">
                        {order.created_at
                          ? new Date(order.created_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'N/A'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-neutral-500">Tracking Number:</span>
                      <span className="font-medium text-brand-dark font-mono text-[11px]">
                        {order.tracking_number || order.trackingNumber || 'N/A'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-neutral-500">Payment Method:</span>
                      <span className="font-medium text-brand-dark uppercase">{order.payment_method || 'N/A'}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-neutral-500">Payment Type:</span>
                      <span className="font-medium text-brand-dark">{order.payment_type || (order.payment_method === 'cod' ? 'COD' : 'Online')}</span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Shipping Address */}
                <div className="bg-neutral-50/50 border border-neutral-200/80 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 border-b border-neutral-200/60 pb-2 text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    <MapPin className="w-4 h-4 text-neutral-500" />
                    <span>Shipping Address</span>
                  </div>

                  <div className="space-y-1.5 text-xs text-brand-dark">
                    <p className="font-semibold text-brand-dark">
                      {order.recipient_name || order.fullname || order.customer_name || order.user_id || 'Customer'}
                    </p>
                    {order.customer_email && (
                      <p className="text-neutral-500 text-[11px]">{order.customer_email}</p>
                    )}
                    {(order.recipient_phone || order.phone || order.customer_phone) && (
                      <p className="text-neutral-500 text-[11px]">Ph: {order.recipient_phone || order.phone || order.customer_phone}</p>
                    )}
                    <div className="pt-1.5 text-neutral-600 leading-relaxed border-t border-neutral-200/50">
                      <p className="font-medium text-brand-dark text-[11px]">
                        {order.address_label ? `${order.address_label}: ` : ''}
                        {order.full_address || order.address || 'Address registered on user profile'}
                      </p>
                      {(order.city || order.state || order.postal_code) && (
                        <p className="text-neutral-500 text-[11px] mt-0.5">
                          {[order.city, order.state, order.postal_code].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Management Section */}
              <div className="bg-neutral-50/50 border border-neutral-200/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-200/60 pb-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    <RefreshCw className="w-4 h-4 text-neutral-500" />
                    <span>Status Management</span>
                  </div>

                  {/* Unsaved indicator */}
                  {hasUnsavedChanges && (
                    <span className="text-[11px] text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full font-semibold border border-amber-200 animate-pulse">
                      Unsaved Preview
                    </span>
                  )}
                </div>

                {/* Save Feedback Messages */}
                {saveError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{saveError}</span>
                  </div>
                )}
                {saveSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSaveStatus} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end pt-1">
                  {/* Order Status Dropdown / Locked Stage Badge */}
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                      Order Status
                    </label>
                    {['delivered', 'cancelled', 'returned', 'exchanged'].includes(
                      (confirmedRef.current.status || confirmedStatus || order?.status || '').toLowerCase()
                    ) ? (
                      <div className="w-full bg-neutral-100 border border-neutral-200/80 text-brand-dark text-xs rounded-xl px-3 py-2.5 font-semibold flex items-center justify-between">
                        <span>{confirmedRef.current.status || confirmedStatus || order.status}</span>
                        <span className="text-[10px] text-neutral-500 font-medium flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded-md border border-neutral-200">
                          <Lock className="w-3 h-3 text-neutral-400" /> Locked Stage
                        </span>
                      </div>
                    ) : (
                      <select
                        value={selectedStatus}
                        onChange={(e) => handleOrderStatusChange(e.target.value)}
                        className="w-full bg-white border border-neutral-200 text-brand-dark text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-brand-dark font-medium cursor-pointer"
                      >
                        {ORDER_STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Payment Status Dropdown */}
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                      Payment Status
                    </label>
                    <select
                      value={selectedPaymentStatus}
                      onChange={(e) => handlePaymentStatusChange(e.target.value)}
                      className="w-full bg-white border border-neutral-200 text-brand-dark text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-brand-dark font-medium cursor-pointer"
                    >
                      {PAYMENT_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Explicit Save Button (Does not auto-save on select!) */}
                  <div className="sm:col-span-2 flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={savingStatus || !hasUnsavedChanges}
                      className="px-5 py-2.5 h-10 bg-neutral-950 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingStatus ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Status...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Status Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Shiprocket Logistics & Testing Hub */}
              <div className="bg-neutral-50/70 border border-neutral-200/90 rounded-xl p-4 sm:p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-neutral-200/70 pb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-brand-dark uppercase tracking-wider font-admin">
                    <Truck className="w-4 h-4 text-brand-dark" />
                    <span>Shiprocket Logistics & Testing Hub</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-amber-100/90 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-700" />
                    Simulation Mode
                  </span>
                </div>

                {/* Feedback Notification Message */}
                {logisticsMsg && (
                  <div className={`p-3 rounded-lg text-xs flex items-center justify-between gap-2 ${
                    logisticsMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {logisticsMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                      <span>{logisticsMsg.text}</span>
                    </div>
                    <button type="button" onClick={() => setLogisticsMsg(null)} className="text-neutral-400 hover:text-black">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Current Logistics Status Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-neutral-200/70 text-xs">
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase font-semibold">AWB / Tracking Number</span>
                    <span className="font-mono font-bold text-brand-dark mt-0.5 block">
                      {order.tracking_number || order.trackingNumber || 'Not Generated Yet'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Courier Partner</span>
                    <span className="font-medium text-brand-dark mt-0.5 block">
                      {order.tracking_number ? 'Delhivery Express (Air)' : 'Pending Assignment'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Fulfillment Stage</span>
                    <span className="font-bold text-brand-dark mt-0.5 block uppercase">
                      {order.status || 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Forward Logistics Actions */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {(!order.tracking_number && !order.trackingNumber) || ['placed', 'confirmed', 'pending', 'processing'].includes((order.status || '').toLowerCase()) ? (
                    <button
                      type="button"
                      disabled={logisticsLoading}
                      onClick={handleGenerateAwb}
                      className="px-3.5 py-2 bg-neutral-950 hover:bg-black text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                    >
                      {logisticsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Package className="w-3.5 h-3.5" />}
                      <span>Generate AWB & Mark Shipped</span>
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleDownloadLabel}
                    className="px-3 py-2 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Shipping Label (PDF)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadManifest}
                    className="px-3 py-2 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Pickup Manifest</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFetchTracking}
                    className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ml-auto shadow-2xs"
                  >
                    <Truck className="w-3.5 h-3.5 text-neutral-700" />
                    <span>{showTrackingScans ? 'Hide Scans' : 'Live Courier Scans'}</span>
                    {showTrackingScans ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Live Scans Timeline Drawer */}
                {showTrackingScans && (
                  <div className="bg-white border border-neutral-200 rounded-lg p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100">
                      <span className="font-semibold text-brand-dark uppercase text-[11px] tracking-wider">Courier Transit Milestones</span>
                      <span className="text-[10px] text-neutral-400 font-mono">Simulated Scans (Real-Time)</span>
                    </div>
                    {loadingTracking ? (
                      <div className="p-4 text-center text-neutral-400 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Fetching tracking scans...</span>
                      </div>
                    ) : trackingData?.scans?.length ? (
                      <div className="space-y-2.5 pt-1">
                        {trackingData.scans.map((scan, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <div className="w-2 h-2 rounded-full bg-brand-dark mt-1.5 shrink-0" />
                            <div className="flex-1">
                              <p className="font-semibold text-brand-dark text-xs">{scan.activity}</p>
                              <p className="text-[10px] text-neutral-500">{scan.location} • {scan.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-neutral-500 italic text-[11px]">No scans recorded yet. Package is awaiting courier pickup.</p>
                    )}
                  </div>
                )}

                {/* 1-Click Milestone Testing Strip */}
                <div className="pt-2 border-t border-neutral-200/60">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-2">
                    Testing Suite: Simulate Shiprocket Webhook Milestones
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      disabled={logisticsLoading}
                      onClick={() => handleSimulateMilestone('IN TRANSIT')}
                      className="px-2.5 py-2 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:border-black"
                      title="Simulates package reaching transit hub"
                    >
                      <Package className="w-3.5 h-3.5 text-neutral-600" />
                      <span>In Transit (Shipped)</span>
                    </button>

                    <button
                      type="button"
                      disabled={logisticsLoading}
                      onClick={() => handleSimulateMilestone('OUT FOR DELIVERY')}
                      className="px-2.5 py-2 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:border-black"
                      title="Simulates local rider out for delivery"
                    >
                      <Truck className="w-3.5 h-3.5 text-neutral-600" />
                      <span>Out for Delivery</span>
                    </button>

                    <button
                      type="button"
                      disabled={logisticsLoading}
                      onClick={() => handleSimulateMilestone('DELIVERED')}
                      className="px-2.5 py-2 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:border-emerald-600"
                      title="Simulates customer doorstep handover"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Mark Delivered</span>
                    </button>

                    <button
                      type="button"
                      disabled={logisticsLoading}
                      onClick={() => handleSimulateMilestone('CANCELLED')}
                      className="px-2.5 py-2 bg-white hover:bg-rose-50 border border-rose-300 text-rose-800 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:border-rose-600"
                      title="Simulates shipment cancellation"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Void / Cancel</span>
                    </button>
                  </div>
                </div>

                {/* Reverse Logistics Actions (Returns & Exchanges) */}
                {['delivered', 'returned', 'exchanged', 'return approved', 'replace approved'].includes((order.status || '').toLowerCase()) && (
                  <div className="pt-2 border-t border-neutral-200/60 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block w-full mb-1">
                      Reverse Logistics (URVAAH-RR-05 Returns & Exchanges)
                    </span>
                    <button
                      type="button"
                      disabled={logisticsLoading}
                      onClick={handleCreateReversePickup}
                      className="px-3 py-1.5 bg-neutral-900 text-white hover:bg-black text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Schedule Reverse Pickup</span>
                    </button>
                    <button
                      type="button"
                      disabled={logisticsLoading}
                      onClick={handleDispatchReplacement}
                      className="px-3 py-1.5 bg-white border border-neutral-300 text-neutral-900 hover:bg-neutral-100 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Dispatch Replacement</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Order Items Section */}
              <div className="border border-neutral-200/80 rounded-xl overflow-hidden bg-white">
                <div className="px-4 py-3 bg-neutral-50/80 border-b border-neutral-200/80 text-xs font-semibold text-brand-dark uppercase tracking-wider flex items-center justify-between">
                  <span>Order Items ({Array.isArray(order.items) ? order.items.length : 0})</span>
                </div>

                <div className="divide-y divide-neutral-200/60 max-h-64 overflow-y-auto">
                  {Array.isArray(order.items) && order.items.length > 0 ? (
                    order.items.map((item, idx) => {
                      const rawImg = item.image || item.image_url || (Array.isArray(item.images) ? item.images[0] : item.images) || item.category_image;
                      const imgUrl = rawImg ? getSupabaseMediaUrl(rawImg) : '';
                      const unitPrice = parseFloat(item.price) || 0;
                      const qty = parseInt(item.quantity, 10) || 1;
                      const itemTotal = unitPrice * qty;

                      return (
                        <div key={item.id || idx} className="p-4 flex items-center justify-between gap-4 text-xs hover:bg-neutral-50/50 transition-colors">
                          {/* Thumbnail + Title */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-12 h-12 rounded-lg border border-neutral-200 bg-neutral-50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {imgUrl ? (
                                <img
                                  src={imgUrl}
                                  alt={item.name || item.title || 'Product'}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/assets/Images/Corset01.png';
                                  }}
                                />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-neutral-300" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-admin font-bold text-brand-dark truncate">
                                  {item.name || item.title || `Product #${item.product_id}`}
                                </span>
                                {item.status && (
                                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200">
                                    {item.status}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-neutral-500 mt-0.5">
                                Qty: <span className="font-medium text-brand-dark">{qty}</span> × ₹{unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>

                          {/* Item Line Total */}
                          <div className="font-admin font-bold text-brand-dark text-right flex-shrink-0">
                            ₹{itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-xs text-neutral-500 italic space-y-1">
                      <Package className="w-6 h-6 text-neutral-300 mx-auto mb-1" />
                      <p className="font-semibold text-neutral-600 not-italic">No Order Items Available</p>
                      <p className="text-[11px]">No order line items are recorded for this order.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Breakdown Section */}
              <div className="bg-neutral-50/50 border border-neutral-200/80 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between text-neutral-600">
                  <span>Shipping Cost</span>
                  <span>{shippingCost > 0 ? `₹${shippingCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'FREE'}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount</span>
                    <span>-₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="pt-2.5 border-t border-neutral-200 flex justify-between items-center text-sm font-admin font-bold">
                  <span className="text-brand-dark tracking-wide">TOTAL AMOUNT</span>
                  <span className="text-brand-dark text-base sm:text-lg">
                    ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-end bg-neutral-50/90 shrink-0 font-admin">
          <button
            type="button"
            onClick={handleCloseModal}
            className="px-5 py-2.5 h-10 border border-neutral-300 text-neutral-700 hover:bg-neutral-100 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

