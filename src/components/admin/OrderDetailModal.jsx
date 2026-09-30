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
  Image as ImageIcon
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { getSupabaseMediaUrl } from '../../lib/supabase';

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

  const subtotal = parseFloat(order?.subtotal || order?.original_total || 0);
  const shippingCost = parseFloat(order?.shipping_cost || order?.shipping || 0);
  const discountAmount = parseFloat(order?.discount_amount || order?.discount || 0);
  const totalAmount = parseFloat(order?.total || 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200 font-admin"
      onClick={handleCloseModal}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-neutral-200 my-8 transition-all max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50 flex-shrink-0">
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
                      {order.fullname || order.customer_name || order.user_id || 'Customer'}
                    </p>
                    {order.customer_email && (
                      <p className="text-neutral-500 text-[11px]">{order.customer_email}</p>
                    )}
                    {order.customer_phone && (
                      <p className="text-neutral-500 text-[11px]">Ph: {order.customer_phone}</p>
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
                      className="px-4 py-2 bg-brand-dark text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="px-6 py-4 border-t border-neutral-100 flex items-center justify-end bg-neutral-50/30 flex-shrink-0">
          <button
            type="button"
            onClick={handleCloseModal}
            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-xl text-xs font-semibold text-brand-dark transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

