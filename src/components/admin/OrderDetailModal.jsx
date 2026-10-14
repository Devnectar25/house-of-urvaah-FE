import React, { useState, useEffect } from 'react';
import {
  X,
  Loader2,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Package,
  MapPin,
  CheckCircle2,
  RefreshCw,
  Save,
  Lock,
  Image as ImageIcon,
  Truck,
  PackageCheck,
  ArrowUpRight,
  FileText
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { getSupabaseMediaUrl } from '../../lib/supabase';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import { InvoiceModal } from '../common/InvoiceModal';
import { broadcastOrderUpdate } from '../../lib/orderSync';

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
  { value: 'Cancellation Requested', label: 'Cancellation Requested' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Return Requested', label: 'Return Requested' },
  { value: 'Return Approved', label: 'Return Approved' },
  { value: 'Received at House of Urvaah', label: 'Received at House of Urvaah' },
  { value: 'Returned', label: 'Returned' },
  { value: 'Replacement Request Processing', label: 'Replacement Request Processing' },
  { value: 'Replace Approved', label: 'Replace Approved' },
  { value: 'Replacement Processing', label: 'Replacement Processing' },
  { value: 'Replacement Shipped', label: 'Replacement Shipped' },
  { value: 'Replacement Out for Delivery', label: 'Replacement Out for Delivery' },
  { value: 'Replaced', label: 'Replaced' },
  { value: 'Replace Rejected', label: 'Replace Rejected' },
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
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

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
      const isCod = (data.payment_method || '').toLowerCase() === 'cod' ||
                    (data.payment_type || '').toLowerCase() === 'cod' ||
                    (data.payment_method || '').toLowerCase().includes('cash');
      const initStatus = data.status || 'Placed';
      const initPaymentStatus = (initStatus === 'Delivered' && isCod) ? 'Paid' : (data.payment_status || 'Pending');

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

    const isCod = (order?.payment_method || '').toLowerCase() === 'cod' ||
                  (order?.payment_type || '').toLowerCase() === 'cod' ||
                  (order?.payment_method || '').toLowerCase().includes('cash');

    let effectivePaymentStatus = selectedPaymentStatus;
    if (newStatus === 'Delivered' && isCod) {
      effectivePaymentStatus = 'Paid';
      setSelectedPaymentStatus('Paid');
    }

    const isUnsaved =
      newStatus !== confirmedRef.current.status ||
      effectivePaymentStatus !== confirmedRef.current.paymentStatus;

    // Update parent table pill optimistically in local state immediately without API call
    const notifyPreview = onOptimisticPreview || onStatusPreview;
    if (notifyPreview && order) {
      notifyPreview({
        id: order.id,
        status: newStatus,
        payment_status: effectivePaymentStatus,
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
      const isCod = (order?.payment_method || '').toLowerCase() === 'cod' ||
                    (order?.payment_type || '').toLowerCase() === 'cod' ||
                    (order?.payment_method || '').toLowerCase().includes('cash');
      const effectivePaymentStatus = (selectedStatus === 'Delivered' && isCod) ? 'Paid' : selectedPaymentStatus;

      const payload = {
        status: selectedStatus,
        paymentStatus: effectivePaymentStatus
      };

      const response = await apiClient(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      const updatedData = response?.data || response || {
        ...order,
        status: selectedStatus,
        payment_status: effectivePaymentStatus
      };

      const newConfirmedStatus = updatedData.status || selectedStatus;
      const newConfirmedPaymentStatus = updatedData.payment_status || effectivePaymentStatus;

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

      // Broadcast update across all customer sessions and tabs
      broadcastOrderUpdate({
        ...updatedData,
        status: newConfirmedStatus,
        payment_status: newConfirmedPaymentStatus
      });
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

  const handleApproveCancellation = async () => {
    if (!order) return;
    setSavingStatus(true);
    setSaveError(null);
    setSaveSuccessMsg(null);
    try {
      const response = await apiClient(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'Cancelled',
          paymentStatus: (order.payment_method || '').toLowerCase() === 'cod' ? order.payment_status : 'Pending'
        })
      });

      const updatedData = response?.data || response || {
        ...order,
        status: 'Cancelled'
      };

      setOrder(updatedData);
      setConfirmedStatus('Cancelled');
      setSelectedStatus('Cancelled');
      confirmedRef.current.status = 'Cancelled';
      setSaveSuccessMsg('Cancellation approved successfully! Order cancelled and routed to Refund Desk.');
      setTimeout(() => setSaveSuccessMsg(null), 3500);

      const notifyPreview = onOptimisticPreview || onStatusPreview;
      if (notifyPreview && order) {
        notifyPreview({
          id: order.id,
          status: 'Cancelled',
          payment_status: updatedData.payment_status || order.payment_status,
          isPreview: false
        });
      }

      const notifyParent = onStatusUpdated || onOrderUpdated;
      if (notifyParent) {
        notifyParent({
          ...updatedData,
          status: 'Cancelled',
          isPreview: false
        });
      }

      broadcastOrderUpdate({
        ...updatedData,
        status: 'Cancelled'
      });
    } catch (err) {
      console.error('Failed to approve cancellation:', err);
      setSaveError(err.message || 'Failed to approve cancellation.');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleRejectCancellation = async () => {
    if (!order) return;
    setSavingStatus(true);
    setSaveError(null);
    setSaveSuccessMsg(null);
    try {
      const restoredStatus = order.original_status || 'Processing';
      const response = await apiClient(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'Restore',
          cancelReason: 'Cancellation request rejected by Admin'
        })
      });

      const updatedData = response?.data || response || {
        ...order,
        status: restoredStatus
      };

      setOrder(updatedData);
      setConfirmedStatus(restoredStatus);
      setSelectedStatus(restoredStatus);
      confirmedRef.current.status = restoredStatus;
      setSaveSuccessMsg(`Cancellation rejected. Order restored to ${restoredStatus}.`);
      setTimeout(() => setSaveSuccessMsg(null), 3500);

      const notifyPreview = onOptimisticPreview || onStatusPreview;
      if (notifyPreview && order) {
        notifyPreview({
          id: order.id,
          status: restoredStatus,
          payment_status: updatedData.payment_status || order.payment_status,
          isPreview: false
        });
      }

      const notifyParent = onStatusUpdated || onOrderUpdated;
      if (notifyParent) {
        notifyParent({
          ...updatedData,
          status: restoredStatus,
          isPreview: false
        });
      }

      broadcastOrderUpdate({
        ...updatedData,
        status: restoredStatus
      });
    } catch (err) {
      console.error('Failed to reject cancellation:', err);
      setSaveError(err.message || 'Failed to reject cancellation.');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleApproveReturn = async () => {
    if (!order) return;
    setSavingStatus(true);
    setSaveError(null);
    setSaveSuccessMsg(null);
    try {
      const response = await apiClient(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'Return Approved'
        })
      });

      const updatedData = response?.data || response || {
        ...order,
        status: 'Return Approved',
        logistics_status: 'In Transit to House of Urvaah'
      };

      setOrder(updatedData);
      setConfirmedStatus('Return Approved');
      setSelectedStatus('Return Approved');
      confirmedRef.current.status = 'Return Approved';
      setSaveSuccessMsg('Return request approved! Courier reverse pickup initiated in transit to House of Urvaah.');
      setTimeout(() => setSaveSuccessMsg(null), 3500);

      const notifyPreview = onOptimisticPreview || onStatusPreview;
      if (notifyPreview && order) {
        notifyPreview({
          id: order.id,
          status: 'Return Approved',
          payment_status: updatedData.payment_status || order.payment_status,
          isPreview: false
        });
      }

      const notifyParent = onStatusUpdated || onOrderUpdated;
      if (notifyParent) {
        notifyParent({
          ...updatedData,
          status: 'Return Approved',
          isPreview: false
        });
      }
    } catch (err) {
      console.error('Failed to approve return:', err);
      setSaveError(err.message || 'Failed to approve return request.');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleRejectReturn = async () => {
    if (!order) return;
    setSavingStatus(true);
    setSaveError(null);
    setSaveSuccessMsg(null);
    try {
      const response = await apiClient(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'Return Rejected',
          cancelReason: 'Return request rejected by Admin'
        })
      });

      const updatedData = response?.data || response || {
        ...order,
        status: 'Delivered'
      };

      setOrder(updatedData);
      setConfirmedStatus('Delivered');
      setSelectedStatus('Delivered');
      confirmedRef.current.status = 'Delivered';
      setSaveSuccessMsg('Return request rejected. Order restored as Delivered.');
      setTimeout(() => setSaveSuccessMsg(null), 3500);

      const notifyPreview = onOptimisticPreview || onStatusPreview;
      if (notifyPreview && order) {
        notifyPreview({
          id: order.id,
          status: 'Delivered',
          payment_status: updatedData.payment_status || order.payment_status,
          isPreview: false
        });
      }

      const notifyParent = onStatusUpdated || onOrderUpdated;
      if (notifyParent) {
        notifyParent({
          ...updatedData,
          status: 'Delivered',
          isPreview: false
        });
      }
    } catch (err) {
      console.error('Failed to reject return:', err);
      setSaveError(err.message || 'Failed to reject return request.');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleApproveReplacement = async () => {
    if (!order) return;
    setSavingStatus(true);
    setSaveError(null);
    setSaveSuccessMsg(null);
    try {
      const response = await apiClient(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'Replace Approved'
        })
      });

      const updatedData = response?.data || response || {
        ...order,
        status: 'Replace Approved',
        logistics_status: 'Replacement Approved'
      };

      setOrder(updatedData);
      setConfirmedStatus('Replace Approved');
      setSelectedStatus('Replace Approved');
      confirmedRef.current.status = 'Replace Approved';
      setSaveSuccessMsg('Replacement approved! Reverse pickup scheduled and replacement dispatched.');
      setTimeout(() => setSaveSuccessMsg(null), 3500);

      const notifyPreview = onOptimisticPreview || onStatusPreview;
      if (notifyPreview && order) {
        notifyPreview({
          id: order.id,
          status: 'Replace Approved',
          payment_status: updatedData.payment_status || order.payment_status,
          isPreview: false
        });
      }

      const notifyParent = onStatusUpdated || onOrderUpdated;
      if (notifyParent) {
        notifyParent({
          ...updatedData,
          status: 'Replace Approved',
          isPreview: false
        });
      }

      broadcastOrderUpdate({
        ...updatedData,
        status: 'Replace Approved'
      });
    } catch (err) {
      console.error('Failed to approve replacement:', err);
      setSaveError(err.message || 'Failed to approve replacement request.');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleRejectReplacement = async () => {
    if (!order) return;
    setSavingStatus(true);
    setSaveError(null);
    setSaveSuccessMsg(null);
    try {
      const response = await apiClient(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'Replace Rejected',
          cancelReason: 'Replacement request rejected by Admin'
        })
      });

      const updatedData = response?.data || response || {
        ...order,
        status: 'Delivered'
      };

      setOrder(updatedData);
      setConfirmedStatus('Delivered');
      setSelectedStatus('Delivered');
      confirmedRef.current.status = 'Delivered';
      setSaveSuccessMsg('Replacement request rejected. Order remains Delivered.');
      setTimeout(() => setSaveSuccessMsg(null), 3500);

      const notifyPreview = onOptimisticPreview || onStatusPreview;
      if (notifyPreview && order) {
        notifyPreview({
          id: order.id,
          status: 'Delivered',
          payment_status: updatedData.payment_status || order.payment_status,
          isPreview: false
        });
      }

      const notifyParent = onStatusUpdated || onOrderUpdated;
      if (notifyParent) {
        notifyParent({
          ...updatedData,
          status: 'Delivered',
          isPreview: false
        });
      }

      broadcastOrderUpdate({
        ...updatedData,
        status: 'Delivered'
      });
    } catch (err) {
      console.error('Failed to reject replacement:', err);
      setSaveError(err.message || 'Failed to reject replacement request.');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleCompleteReplacement = async () => {
    if (!order) return;
    setSavingStatus(true);
    setSaveError(null);
    setSaveSuccessMsg(null);
    try {
      const response = await apiClient(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'Replaced'
        })
      });

      const updatedData = response?.data || response || {
        ...order,
        status: 'Replaced'
      };

      setOrder(updatedData);
      setConfirmedStatus('Replaced');
      setSelectedStatus('Replaced');
      confirmedRef.current.status = 'Replaced';
      setSaveSuccessMsg('Replacement marked as completed & delivered.');
      setTimeout(() => setSaveSuccessMsg(null), 3500);

      const notifyPreview = onOptimisticPreview || onStatusPreview;
      if (notifyPreview && order) {
        notifyPreview({
          id: order.id,
          status: 'Replaced',
          payment_status: updatedData.payment_status || order.payment_status,
          isPreview: false
        });
      }

      const notifyParent = onStatusUpdated || onOrderUpdated;
      if (notifyParent) {
        notifyParent({
          ...updatedData,
          status: 'Replaced',
          isPreview: false
        });
      }
    } catch (err) {
      console.error('Failed to complete replacement:', err);
      setSaveError(err.message || 'Failed to complete replacement.');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleMarkReceivedAtUrvaah = async () => {
    if (!order) return;
    setSavingStatus(true);
    setSaveError(null);
    setSaveSuccessMsg(null);
    try {
      const response = await apiClient(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'Received at House of Urvaah'
        })
      });

      const updatedData = response?.data || response || {
        ...order,
        status: 'Received at House of Urvaah',
        is_product_received: true,
        refund_status: 'Pending',
        refund_eligible_amount: order.total
      };

      setOrder(updatedData);
      setConfirmedStatus('Received at House of Urvaah');
      setSelectedStatus('Received at House of Urvaah');
      confirmedRef.current.status = 'Received at House of Urvaah';
      setSaveSuccessMsg('Package verified at House of Urvaah! Stock restocked and routed to Refund Desk.');
      setTimeout(() => setSaveSuccessMsg(null), 3500);

      const notifyPreview = onOptimisticPreview || onStatusPreview;
      if (notifyPreview && order) {
        notifyPreview({
          id: order.id,
          status: 'Received at House of Urvaah',
          payment_status: updatedData.payment_status || order.payment_status,
          isPreview: false
        });
      }

      const notifyParent = onStatusUpdated || onOrderUpdated;
      if (notifyParent) {
        notifyParent({
          ...updatedData,
          status: 'Received at House of Urvaah',
          isPreview: false
        });
      }
    } catch (err) {
      console.error('Failed to confirm delivery to House of Urvaah:', err);
      setSaveError(err.message || 'Failed to confirm delivery to House of Urvaah.');
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsInvoiceOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c5a880] bg-[#faf8f5] hover:bg-neutral-900 hover:text-white text-neutral-900 text-xs font-admin font-semibold tracking-wide transition-colors cursor-pointer shadow-2xs"
              title="View or Print Official Tax Invoice"
            >
              <FileText className="w-3.5 h-3.5 text-[#8c734b]" />
              <span>Invoice</span>
            </button>
            <button
              type="button"
              onClick={handleCloseModal}
              className="p-1.5 text-neutral-400 hover:text-brand-dark hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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

              {/* Customer Cancellation Request Review & Approval Card */}
              {((confirmedRef.current.status || confirmedStatus || order?.status || '').toLowerCase() === 'cancellation requested') && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 sm:p-5 space-y-3.5 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0 mt-0.5">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-admin font-bold text-amber-950 uppercase tracking-wide">
                          Customer Cancellation Request Pending Approval
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-900 border border-amber-300 uppercase">
                          Action Required
                        </span>
                      </div>
                      <p className="text-xs text-amber-900/90 leading-relaxed">
                        The customer has requested to cancel this order prior to delivery.
                      </p>

                      {/* Payment & Refund Routing Info */}
                      <div className="mt-2 p-3 bg-white/90 border border-amber-200 rounded-lg text-xs space-y-1.5">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-neutral-500 font-medium">Payment Mode:</span>
                          <span className="font-bold text-brand-dark uppercase">
                            {order.payment_method || 'Online'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-neutral-500 font-medium">Order Total / Refund Value:</span>
                          <span className="font-bold text-brand-dark">
                            ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-600 pt-1 border-t border-neutral-100">
                          {(order.payment_method || '').toLowerCase() === 'cod' ? (
                            <span className="text-neutral-700">
                              ℹ️ <strong>Cash on Delivery (COD)</strong> order: Approving will cancel the order and restock inventory. No payment was collected, so no refund is required.
                            </span>
                          ) : (
                            <span className="text-indigo-900">
                              ⚡ <strong>Online / UPI Payment</strong>: Approving will cancel the order, restock inventory, and <strong>automatically send the order to the Refund Desk</strong> with a full refund of ₹{totalAmount.toLocaleString('en-IN')} ready for disbursement.
                            </span>
                          )}
                        </p>
                      </div>

                      {order.cancel_reason && (
                        <div className="mt-2 p-2.5 bg-amber-100/60 border border-amber-200/80 rounded-lg text-xs">
                          <span className="text-[10px] font-bold text-amber-800 uppercase block">Customer Reason:</span>
                          <p className="text-amber-950 font-medium mt-0.5">{order.cancel_reason}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Approval / Rejection Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-amber-200">
                    <button
                      type="button"
                      disabled={savingStatus}
                      onClick={handleRejectCancellation}
                      className="px-4 py-2 bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-800 text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Reject Request
                    </button>
                    <button
                      type="button"
                      disabled={savingStatus}
                      onClick={handleApproveCancellation}
                      className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {savingStatus ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve Cancellation</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Post-Delivery Return Request Review Banner */}
              {((confirmedRef.current.status || confirmedStatus || order?.status || '').toLowerCase() === 'return requested') && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 sm:p-5 space-y-3.5 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0 mt-0.5">
                      <RotateCcw className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-admin font-bold text-amber-950 uppercase tracking-wide">
                          Customer Return Request (Post-Delivery)
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-900 border border-amber-300 uppercase">
                          Action Required
                        </span>
                      </div>
                      <p className="text-xs text-amber-900/90 leading-relaxed">
                        The customer has requested to return this delivered order. Approving will initiate the courier reverse pickup back to the House of Urvaah atelier.
                      </p>

                      <div className="mt-2 p-3 bg-white/90 border border-amber-200 rounded-lg text-xs space-y-1.5">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-neutral-500 font-medium">Payment Mode:</span>
                          <span className="font-bold text-brand-dark uppercase">
                            {order.payment_method || 'Online'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-neutral-500 font-medium">Order Value:</span>
                          <span className="font-bold text-brand-dark">
                            ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-900 pt-1 border-t border-amber-100">
                          📦 Reverse courier pickup will be initiated. <strong>Refund Desk will begin once the package is delivered back to House of Urvaah and verified.</strong>
                        </p>
                      </div>

                      {(order.cancel_reason || order.return_reason) && (
                        <div className="mt-2 p-2.5 bg-amber-100/60 border border-amber-200/80 rounded-lg text-xs">
                          <span className="text-[10px] font-bold text-amber-800 uppercase block">Return Reason:</span>
                          <p className="text-amber-950 font-medium mt-0.5">{order.cancel_reason || order.return_reason}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Approve / Reject Return Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-amber-200">
                    <button
                      type="button"
                      disabled={savingStatus}
                      onClick={handleRejectReturn}
                      className="px-4 py-2 bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-800 text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Reject Return
                    </button>
                    <button
                      type="button"
                      disabled={savingStatus}
                      onClick={handleApproveReturn}
                      className="px-5 py-2 bg-neutral-950 hover:bg-black text-white text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {savingStatus ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve Return Request</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Customer Replacement Request Review Banner */}
              {(['replacement request processing', 'replace requested', 'replacement requested'].includes(
                (confirmedRef.current.status || confirmedStatus || order?.status || '').toLowerCase()
              )) && (
                <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-4 sm:p-5 space-y-3.5 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-800 shrink-0 mt-0.5">
                      <RefreshCw className="w-5 h-5 text-purple-700" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-admin font-bold text-purple-950 uppercase tracking-wide">
                          Customer Replacement Request (Delivered Order Exchange)
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-200 text-purple-900 border border-purple-300 uppercase">
                          Action Required
                        </span>
                      </div>
                      <p className="text-xs text-purple-900/90 leading-relaxed">
                        The customer has requested an exchange / replacement for this delivered piece. Approving will confirm the requested replacement piece and coordinate reverse pickup of the delivered item.
                      </p>

                      {(order.cancel_reason || order.return_reason) && (
                        <div className="mt-2 p-2.5 bg-purple-100/70 border border-purple-200 rounded-lg text-xs">
                          <span className="text-[10px] font-bold text-purple-800 uppercase block">Exchange Details / Sizing Preference:</span>
                          <p className="text-purple-950 font-medium mt-0.5">{order.cancel_reason || order.return_reason}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Approve / Reject Replacement Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-purple-200">
                    <button
                      type="button"
                      disabled={savingStatus}
                      onClick={handleRejectReplacement}
                      className="px-4 py-2 bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-800 text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Reject Replacement
                    </button>
                    <button
                      type="button"
                      disabled={savingStatus}
                      onClick={handleApproveReplacement}
                      className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {savingStatus ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve Replacement</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Replacement Approved & In Transit Banner */}
              {(['replace approved', 'replacement processing', 'replacement shipped', 'replacement out for delivery'].includes(
                (confirmedRef.current.status || confirmedStatus || order?.status || '').toLowerCase()
              )) && (
                <div className="bg-indigo-50 border-2 border-indigo-300 rounded-xl p-4 sm:p-5 space-y-3.5 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-800 shrink-0 mt-0.5">
                      <Truck className="w-5 h-5 text-indigo-700" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-admin font-bold text-indigo-950 uppercase tracking-wide">
                          Replacement In Progress
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-200 text-indigo-900 border border-indigo-300 uppercase">
                          Replacement In Motion
                        </span>
                      </div>
                      <p className="text-xs text-indigo-900/90 leading-relaxed">
                        Replacement has been authorized. Reverse pickup for the original piece is scheduled, and the replacement piece is prepared for dispatch. When the exchange is delivered, click below to finalize.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-indigo-200">
                    <button
                      type="button"
                      disabled={savingStatus}
                      onClick={handleCompleteReplacement}
                      className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
                    >
                      {savingStatus ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <PackageCheck className="w-4 h-4 text-white" />
                          <span>Mark Replacement Completed & Delivered</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Replacement Completed Banner */}
              {((confirmedRef.current.status || confirmedStatus || order?.status || '').toLowerCase() === 'replaced') && (
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-800 shrink-0 mt-0.5">
                      <PackageCheck className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs sm:text-sm font-admin font-bold text-emerald-950 uppercase tracking-wide">
                        Replacement Order Completed
                      </h4>
                      <p className="text-xs text-emerald-900/90 leading-relaxed">
                        The replacement piece has been delivered to the customer and the exchange cycle is completed.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Return Approved & In Transit to Urvaah House Banner */}
              {((confirmedRef.current.status || confirmedStatus || order?.status || '').toLowerCase() === 'return approved') && (
                <div className="bg-sky-50 border-2 border-sky-300 rounded-xl p-4 sm:p-5 space-y-3.5 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-sky-100 rounded-lg text-sky-800 shrink-0 mt-0.5">
                      <Truck className="w-5 h-5 text-sky-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-admin font-bold text-sky-950 uppercase tracking-wide">
                          Return Flow Started: In Transit to House of Urvaah
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-200 text-sky-900 border border-sky-300 uppercase">
                          Reverse Transit Active
                        </span>
                      </div>
                      <p className="text-xs text-sky-900/90 leading-relaxed">
                        Reverse pickup has been authorized. The package is currently in transit to House of Urvaah. Once delivered to our warehouse, confirm receipt below to automatically restock items and activate the Refund Desk.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-sky-200">
                    <button
                      type="button"
                      disabled={savingStatus}
                      onClick={handleMarkReceivedAtUrvaah}
                      className="px-5 py-2.5 bg-neutral-950 hover:bg-black text-white text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
                    >
                      {savingStatus ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <PackageCheck className="w-4 h-4 text-emerald-400" />
                          <span>Mark Received at House of Urvaah</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Received at House of Urvaah / Refund Desk Active Banner */}
              {(['received at house of urvaah', 'received at homved', 'returned'].includes(
                (confirmedRef.current.status || confirmedStatus || order?.status || '').toLowerCase()
              )) && (
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-xs flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-800 shrink-0 mt-0.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-admin font-bold text-emerald-950 uppercase tracking-wide">
                          Received at House of Urvaah — Refund Desk Active
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900 border border-emerald-300 uppercase">
                          Restocked & In Refund Desk
                        </span>
                      </div>
                      <p className="text-xs text-emerald-900/90 leading-relaxed">
                        Package verified and restocked into warehouse inventory. Order has been routed to the Refund Desk with ₹{(order.refund_eligible_amount || totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} eligible for customer disbursement.
                      </p>
                    </div>
                  </div>

                  <a
                    href="/admin/refund-desk"
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <span>Open Refund Desk</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Cancelled & Refund Desk Status Banner */}
              {((confirmedRef.current.status || confirmedStatus || order?.status || '').toLowerCase() === 'cancelled') && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                  (order.payment_method || '').toLowerCase() === 'cod'
                    ? 'bg-neutral-50 border-neutral-200 text-neutral-800'
                    : (order.refund_status === 'Completed' || order.refund_status === 'Refunded')
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-950'
                }`}>
                  <div className="p-2 rounded-lg bg-white/80 border border-current shrink-0 mt-0.5">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold uppercase tracking-wider">
                        {(order.payment_method || '').toLowerCase() === 'cod'
                          ? 'Cancelled COD Order'
                          : `Refund Desk Status: ${order.refund_status || 'Pending'}`}
                      </span>
                    </div>
                    <p className="leading-relaxed">
                      {(order.payment_method || '').toLowerCase() === 'cod'
                        ? 'Order cancelled prior to delivery. No payment was collected, so no refund is necessary.'
                        : (order.refund_status === 'Completed' || order.refund_status === 'Refunded')
                        ? `Full refund of ₹${(order.refund_eligible_amount || totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} has been disbursed via Refund Desk${order.refund_transaction_id ? ` (UTR: ${order.refund_transaction_id})` : ''}.`
                        : `Full amount ₹${(order.refund_eligible_amount || totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} has been sent to the Refund Desk for customer disbursement.`}
                    </p>
                  </div>
                </div>
              )}

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
                    {['cancelled', 'refunded', 'exchanged'].includes(
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
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                        Payment Status
                      </label>
                      {(() => {
                        const isCod = (order?.payment_method || '').toLowerCase() === 'cod' ||
                                      (order?.payment_type || '').toLowerCase() === 'cod' ||
                                      (order?.payment_method || '').toLowerCase().includes('cash');
                        if (selectedStatus === 'Delivered' && isCod) {
                          return (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              COD Collected on Delivery
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
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

      {/* Official Haute Couture Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        order={order}
        orderId={order?.order_number || order?.id || orderId}
      />
    </div>
  );
};

