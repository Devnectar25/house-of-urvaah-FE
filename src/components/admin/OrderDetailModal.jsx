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
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Zap,
  Check,
  XCircle,
  Calendar,
  Building,
  PackagePlus,
  Sparkles,
  Banknote
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { shippingApi } from '../../services/shippingApi';
import { getSupabaseMediaUrl } from '../../lib/supabase';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import { InvoiceModal } from '../common/InvoiceModal';
import { ShippingLabelModal } from './ShippingLabelModal';
import { PickupManifestModal } from './PickupManifestModal';
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
  { value: 'Return Approved', label: 'Return Approved (Pickup Scheduled)' },
  { value: 'In Transit to House of Urvaah', label: 'In Transit to House of Urvaah (Return In Transit)' },
  { value: 'Received at House of Urvaah', label: 'Received at House of Urvaah (Atelier Restocked)' },
  { value: 'Returned', label: 'Returned (Refund Completed)' },
  { value: 'Return Rejected', label: 'Return Rejected' },
  { value: 'Replacement Request Processing', label: 'Replacement Request Processing' },
  { value: 'Replace Approved', label: 'Replace Approved' },
  { value: 'Replacement Processing', label: 'Replacement Processing' },
  { value: 'Replacement Shipped', label: 'Replacement Shipped' },
  { value: 'Replacement Out for Delivery', label: 'Replacement Out for Delivery' },
  { value: 'Replaced', label: 'Replaced' },
  { value: 'Replace Rejected', label: 'Replace Rejected' },
  { value: 'Exchanged', label: 'Exchanged' },
  { value: 'Return & Replacement Processing', label: 'Return & Replacement Processing' },
  { value: 'Return & Replacement Approved', label: 'Return & Replacement Approved (Pickup Scheduled)' },
  { value: 'Returned & Replaced', label: 'Returned & Replaced (Completed)' }
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'Paid', label: 'Paid' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Failed', label: 'Failed' },
  { value: 'Refunded', label: 'Refunded' }
];

const getRequestedReplacementSize = (ord) => {
  if (!ord) return 'M';
  if (ord.replacement_size) return ord.replacement_size;
  if (Array.isArray(ord.items)) {
    const repItem = ord.items.find(it => it.replacement_size || (it.return_action || '').toLowerCase() === 'replace');
    if (repItem && repItem.replacement_size) return repItem.replacement_size;
  }
  const combined = `${ord.cancel_reason || ''} ${ord.return_reason || ''}`;
  const match = combined.match(/Preferred Size:\s*([A-Za-z0-9]+)/i) || 
                combined.match(/Size:\s*([A-Za-z0-9]+)/i);
  if (match && match[1]) return match[1].trim();
  if (ord.items && ord.items[0] && ord.items[0].size) return ord.items[0].size;
  return 'M';
};

export const OrderDetailModal = ({ orderId, isOpen, onClose, onOptimisticPreview, onStatusPreview, onStatusUpdated, onOrderUpdated, hideStatusManagement = false, isShiprocketDesk = false }) => {
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
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [isManifestModalOpen, setIsManifestModalOpen] = useState(false);
  const [customReplacementSize, setCustomReplacementSize] = useState('M');

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
      setCustomReplacementSize(getRequestedReplacementSize(data));
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

  const handleApproveMixedReturnReplace = async () => {
    if (!order) return;
    setSavingStatus(true);
    setSaveError(null);
    setSaveSuccessMsg(null);
    try {
      const response = await apiClient(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'Return & Replacement Approved'
        })
      });

      const updatedData = response?.data || response || {
        ...order,
        status: 'Return & Replacement Approved',
        logistics_status: 'Pickup Scheduled'
      };

      setOrder(updatedData);
      setConfirmedStatus('Return & Replacement Approved');
      setSelectedStatus('Return & Replacement Approved');
      confirmedRef.current.status = 'Return & Replacement Approved';
      setSaveSuccessMsg('Return & Replacement approved! Doorstep reverse pickup scheduled with Delhivery.');
      setTimeout(() => setSaveSuccessMsg(null), 3500);

      const notifyPreview = onOptimisticPreview || onStatusPreview;
      if (notifyPreview && order) {
        notifyPreview({
          id: order.id,
          status: 'Return & Replacement Approved',
          payment_status: updatedData.payment_status || order.payment_status,
          isPreview: false
        });
      }

      const notifyParent = onStatusUpdated || onOrderUpdated;
      if (notifyParent) {
        notifyParent({
          ...updatedData,
          status: 'Return & Replacement Approved',
          isPreview: false
        });
      }

      broadcastOrderUpdate({
        ...updatedData,
        status: 'Return & Replacement Approved'
      });
    } catch (err) {
      console.error('Failed to approve return & replacement:', err);
      setSaveError(err.message || 'Failed to approve return & replacement request.');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleRejectMixedReturnReplace = async () => {
    if (!order) return;
    setSavingStatus(true);
    setSaveError(null);
    setSaveSuccessMsg(null);
    try {
      const response = await apiClient(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'Return & Replacement Rejected',
          cancelReason: 'Return & Replacement request rejected by Admin'
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
      setSaveSuccessMsg('Return & replacement request rejected. Order remains Delivered.');
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
      console.error('Failed to reject return & replacement:', err);
      setSaveError(err.message || 'Failed to reject return & replacement request.');
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

  const handleMarkReplacementCollected = async () => {
    if (!order) return;
    setSavingStatus(true);
    setSaveError(null);
    try {
      const response = await apiClient(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'In Transit to House of Urvaah',
          logisticsStatus: 'In Reverse Transit'
        })
      });

      const updatedData = response?.data || response || {
        ...order,
        status: 'In Transit to House of Urvaah',
        logistics_status: 'In Reverse Transit'
      };

      setOrder(updatedData);
      setConfirmedStatus('In Transit to House of Urvaah');
      setSelectedStatus('In Transit to House of Urvaah');
      confirmedRef.current.status = 'In Transit to House of Urvaah';
      setSaveSuccessMsg('Parcel collected from customer! Piece is now in reverse transit to House of Urvaah atelier.');
      setTimeout(() => setSaveSuccessMsg(null), 3500);

      const notifyParent = onStatusUpdated || onOrderUpdated;
      if (notifyParent) notifyParent(updatedData);
      broadcastOrderUpdate(updatedData);
    } catch (err) {
      console.error('Failed to mark replacement collected:', err);
      setSaveError(err.message || 'Failed to update pickup status.');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleConfirmReplacementQCReceived = async () => {
    if (!order) return;
    setSavingStatus(true);
    setSaveError(null);
    try {
      const response = await apiClient(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'Received at House of Urvaah',
          logisticsStatus: 'Delivered to House of Urvaah'
        })
      });

      const updatedData = response?.data || response || {
        ...order,
        status: 'Received at House of Urvaah',
        logistics_status: 'Delivered to House of Urvaah',
        is_product_received: true
      };

      setOrder(updatedData);
      setConfirmedStatus('Received at House of Urvaah');
      setSelectedStatus('Received at House of Urvaah');
      confirmedRef.current.status = 'Received at House of Urvaah';
      setSaveSuccessMsg('Original piece received & verified at atelier (QC Passed)! Ready to generate replacement dispatch order.');
      setTimeout(() => setSaveSuccessMsg(null), 3500);

      const notifyParent = onStatusUpdated || onOrderUpdated;
      if (notifyParent) notifyParent(updatedData);
      broadcastOrderUpdate(updatedData);
    } catch (err) {
      console.error('Failed to confirm replacement arrival at atelier:', err);
      setSaveError(err.message || 'Failed to confirm arrival at atelier.');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleGenerateReplacementOrder = async (targetSize) => {
    if (!order) return;
    setSavingStatus(true);
    setSaveError(null);
    try {
      const sizeToUse = targetSize || customReplacementSize || getRequestedReplacementSize(order);
      const repItemsOnly = Array.isArray(order.items)
        ? order.items.filter(it => (it.return_action || '').toLowerCase() === 'replace' || (it.status || '').toLowerCase().includes('replace'))
        : [];
      const itemsToDispatch = repItemsOnly.length > 0 ? repItemsOnly : (order.items || []);

      const res = await shippingApi.dispatchReplacement(order, itemsToDispatch, {
        replacement_size: sizeToUse
      });

      if (res && (res.replacement_order_number || res.order_number)) {
        const newOrderNum = res.replacement_order_number || res.order_number;
        const newOrderId = res.replacement_order_id;

        const isMixed = Boolean(
          (order?.return_type || '').toLowerCase().includes('mixed') ||
          (order?.status || '').toLowerCase().includes('& replacement')
        );
        const nextStatus = isMixed ? (order.refund_status === 'Completed' ? 'Returned & Replaced' : order.status) : 'Replaced';

        const updatedData = {
          ...order,
          status: nextStatus,
          logistics_status: 'Replacement Order Dispatched',
          replacement_order_id: newOrderId,
          replacement_order_number: newOrderNum,
          replacement_size: sizeToUse
        };

        setOrder(updatedData);
        setConfirmedStatus('Replaced');
        setSelectedStatus('Replaced');
        confirmedRef.current.status = 'Replaced';
        setSaveSuccessMsg(`Replacement Order #${newOrderNum} generated and dispatched! Customer can now track their new order.`);
        setTimeout(() => setSaveSuccessMsg(null), 4000);

        const notifyParent = onStatusUpdated || onOrderUpdated;
        if (notifyParent) notifyParent({ ...updatedData, isPreview: false });
        broadcastOrderUpdate({
          ...updatedData,
          status: 'Replaced',
          replacement_order_number: newOrderNum
        });
      } else {
        throw new Error(res?.message || 'Could not generate replacement order.');
      }
    } catch (err) {
      console.error('Failed to generate replacement order:', err);
      setSaveError(err.message || 'Failed to generate replacement order.');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleOpenReplacementOrder = async (repNum) => {
    if (!repNum) return;
    setLoading(true);
    setSaveError(null);
    try {
      const res = await apiClient(`/api/orders/${encodeURIComponent(repNum)}`);
      const newOrd = res.data || res.order;
      if (newOrd) {
        setOrder(newOrd);
        setConfirmedStatus(newOrd.status || 'Confirmed');
        setSelectedStatus(newOrd.status || 'Confirmed');
        confirmedRef.current.status = newOrd.status || 'Confirmed';
        setSaveSuccessMsg(`Switched to Replacement Order #${repNum}`);
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error('Failed to open replacement order:', err);
      setSaveError('Could not open replacement order.');
    } finally {
      setLoading(false);
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

  const handleSimulateDoorstepHandover = async () => {
    if (!order) return;
    setSavingStatus(true);
    setSaveError(null);
    try {
      const response = await apiClient(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'In Transit to House of Urvaah',
          logisticsStatus: 'In Transit'
        })
      });

      const updatedData = response?.data || response || {
        ...order,
        status: 'In Transit to House of Urvaah',
        logistics_status: 'In Transit'
      };

      setOrder(updatedData);
      setConfirmedStatus('In Transit to House of Urvaah');
      setSelectedStatus('In Transit to House of Urvaah');
      confirmedRef.current.status = 'In Transit to House of Urvaah';
      setSaveSuccessMsg('Doorstep pickup verified! Parcel collected by courier and in transit back to Urvaah atelier.');
      setTimeout(() => setSaveSuccessMsg(null), 3500);

      const notifyParent = onStatusUpdated || onOrderUpdated;
      if (notifyParent) {
        notifyParent(updatedData);
      }
      broadcastOrderUpdate(updatedData);
    } catch (err) {
      console.error('Failed to simulate reverse pickup handover:', err);
      setSaveError(err.message || 'Failed to update pickup status.');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleDisburseRefund = async () => {
    if (!order) return;
    setSavingStatus(true);
    setSaveError(null);
    setSaveSuccessMsg(null);
    try {
      const response = await apiClient(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'Returned',
          paymentStatus: 'Refunded',
          refundStatus: 'Completed'
        })
      });

      const updatedData = response?.data || response || {
        ...order,
        status: 'Returned',
        payment_status: 'Refunded',
        refund_status: 'Completed',
        is_product_received: true
      };

      setOrder(updatedData);
      setConfirmedStatus('Returned');
      setSelectedStatus('Returned');
      setSelectedPaymentStatus('Refunded');
      confirmedRef.current.status = 'Returned';
      confirmedRef.current.paymentStatus = 'Refunded';
      setSaveSuccessMsg('Refund disbursed & return completed successfully!');
      setTimeout(() => setSaveSuccessMsg(null), 3500);

      const notifyPreview = onOptimisticPreview || onStatusPreview;
      if (notifyPreview && order) {
        notifyPreview({
          id: order.id,
          status: 'Returned',
          payment_status: 'Refunded',
          isPreview: false
        });
      }

      const notifyParent = onStatusUpdated || onOrderUpdated;
      if (notifyParent) {
        notifyParent({
          ...updatedData,
          status: 'Returned',
          payment_status: 'Refunded',
          isPreview: false
        });
      }
      broadcastOrderUpdate(updatedData);
    } catch (err) {
      console.error('Failed to complete refund:', err);
      setSaveError(err.message || 'Failed to complete refund.');
    } finally {
      setSavingStatus(false);
    }
  };
  const hasUnsavedChanges = Boolean(
    order &&
      (selectedStatus !== confirmedRef.current.status ||
        selectedPaymentStatus !== confirmedRef.current.paymentStatus)
  );

  // Logistics Action 1: Generate AWB & Allocate Courier
  const handleGenerateAwb = async () => {
    if (!order) return;
    setLogisticsLoading(true);
    setLogisticsMsg(null);
    try {
      const shipRes = await shippingApi.createShipment(order);
      const shipmentId = shipRes.shipment_id || order.shipment_id || `SR-MOCK-SHP-${Date.now().toString().slice(-6)}`;
      
      const awbRes = await shippingApi.assignAwb(shipmentId, null, order.id, order.order_number);
      const awbCode = awbRes?.response?.data?.awb_code || awbRes?.awb_code || `URV${Date.now().toString().slice(-8)}IN`;
      const courierName = awbRes?.response?.data?.courier_name || awbRes?.courier_name || 'Delhivery Express';
      
      const newStatus = (order.status === 'Pending' || order.status === 'Placed') ? 'Processing' : order.status;
      await apiClient(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          status: newStatus, 
          trackingNumber: awbCode,
          logisticsStatus: 'AWB Assigned'
        })
      });

      const updated = { 
        ...order, 
        status: newStatus, 
        tracking_number: awbCode, 
        trackingNumber: awbCode,
        courier_name: courierName,
        logistics_status: 'AWB Assigned'
      };
      setOrder(updated);
      setSelectedStatus(newStatus);
      confirmedRef.current.status = newStatus;
      setConfirmedStatus(newStatus);

      setLogisticsMsg({
        type: 'success',
        text: `AWB Allocated: ${awbCode} (${courierName}). Ready for Label Printing & Pickup Schedule.`
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
  const handleDownloadLabel = () => {
    if (!order) return;
    setIsLabelModalOpen(true);
  };

  // Logistics Action 5: Download Manifest
  const handleDownloadManifest = () => {
    if (!order) return;
    setIsManifestModalOpen(true);
  };

  // Logistics Action 5b: Schedule Atelier Warehouse Courier Pickup
  const handleSchedulePickup = async () => {
    if (!order) return;
    setLogisticsLoading(true);
    setLogisticsMsg(null);
    try {
      const targetId = order.tracking_number || order.id;
      const pickRes = await shippingApi.schedulePickup([targetId]);
      const token = pickRes?.response?.pickup_token_number || pickRes?.pickup_token_number || 'PKP-CONFIRMED';
      const pickupDate = pickRes?.response?.pickup_scheduled_date || 'Tomorrow 11:00 AM';

      const updatedOrder = {
        ...order,
        logistics_status: 'Pickup Scheduled',
        shipment_status: 'Pickup Scheduled',
        pickup_token: token,
        pickup_scheduled_date: pickupDate
      };
      setOrder(updatedOrder);

      setLogisticsMsg({
        type: 'success',
        text: `Courier Pickup Scheduled! Token: ${token} (${pickupDate}). Courier driver dispatched to House of Urvaah atelier.`
      });

      if (onOrderUpdated || onStatusUpdated) {
        (onOrderUpdated || onStatusUpdated)(updatedOrder);
      }
    } catch (err) {
      console.error('Failed to schedule pickup:', err);
      setLogisticsMsg({
        type: 'error',
        text: err.message || 'Failed to schedule courier pickup with Shiprocket.'
      });
    } finally {
      setLogisticsLoading(false);
    }
  };

  // Logistics Action 6: Reverse Pickup for Return/Exchange
  const handleCreateReversePickup = async () => {
    if (!order) return;
    setLogisticsLoading(true);
    setLogisticsMsg(null);
    try {
      const itemsToPickup = Array.isArray(order.items) && order.items.length
        ? order.items.filter(i => {
            const act = (i.return_action || '').toLowerCase();
            const stat = (i.status || '').toLowerCase();
            if (act === 'keep') return false;
            if (stat === 'delivered' && act !== 'return' && act !== 'replace') return false;
            return true;
          })
        : [];
      const itemsToSend = itemsToPickup.length > 0 ? itemsToPickup : order.items;
      const res = await shippingApi.createReturnOrder(order, itemsToSend, 'Customer return approved by admin');
      const updated = {
        ...order,
        tracking_number: res.awb_code,
        trackingNumber: res.awb_code,
        courier_name: res.courier_name || 'Delhivery Reverse Logistics',
        logistics_status: 'Return Pickup Scheduled',
        shipment_status: 'Return Pickup Scheduled'
      };
      setOrder(updated);
      setLogisticsMsg({
        type: 'success',
        text: `Reverse Pickup Scheduled for ${itemsToSend.length} item(s)! AWB: ${res.awb_code} (Pickup from customer within 24-48 hrs).`
      });
      if (onStatusUpdated || onOrderUpdated) {
        (onStatusUpdated || onOrderUpdated)(updated);
      }
      broadcastOrderUpdate(updated);
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
      const replaceItems = (order.items || []).filter(i => {
        const act = (i.return_action || '').toLowerCase();
        const stat = (i.status || '').toLowerCase();
        return act === 'replace' || stat.includes('replace') || stat.includes('exchange');
      });
      const itemsToSend = replaceItems.length > 0 ? replaceItems : order.items;
      const res = await shippingApi.dispatchReplacement(order, itemsToSend);
      setLogisticsMsg({
        type: 'success',
        text: `Replacement Dispatched for ${itemsToSend.length} item(s)! Order: ${res.order_number}, AWB: ${res.awb_code} (${res.courier_name}).`
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
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/70 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-200 font-admin overscroll-contain"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleCloseModal();
          }
        }}
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
                      {(order.city || order.state || order.postal_code || order.pincode || order.shipping_address?.postal_code || order.shipping_address?.pincode) && (
                        <p className="text-neutral-500 text-[11px] mt-0.5">
                          {[
                            order.city || order.shipping_address?.city, 
                            order.state || order.shipping_address?.state, 
                            (order.postal_code || order.pincode || order.shipping_address?.postal_code || order.shipping_address?.pincode)
                          ].filter(Boolean).join(', ')}
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
              {(['return requested', 'return request processing', 'return processing'].includes(
                (confirmedRef.current.status || confirmedStatus || order?.status || '').toLowerCase()
              )) && (
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

              {/* Customer Mixed Return & Replacement Review Banner */}
              {Boolean(
                (order?.return_type || '').toLowerCase().includes('mixed') ||
                (confirmedRef.current.status || confirmedStatus || order?.status || '').toLowerCase().includes('& replacement') ||
                (
                  Array.isArray(order?.items) &&
                  order.items.some(it => (it.return_action || '').toLowerCase() === 'return' || (it.status || '').toLowerCase().includes('return')) &&
                  order.items.some(it => (it.return_action || '').toLowerCase() === 'replace' || (it.status || '').toLowerCase().includes('replace'))
                )
              ) && (['return & replacement processing', 'return and replacement processing', 'return & replacement requested'].includes(
                (confirmedRef.current.status || confirmedStatus || order?.status || '').toLowerCase()
              )) && (
                <div className="bg-gradient-to-r from-purple-50 via-sky-50 to-indigo-50 border-2 border-indigo-300 rounded-xl p-4 sm:p-5 space-y-3.5 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-800 shrink-0 mt-0.5">
                      <RefreshCw className="w-5 h-5 text-indigo-700" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-admin font-bold text-indigo-950 uppercase tracking-wide flex items-center gap-2">
                          <span>Customer Mixed Return & Replacement Request (Simultaneous)</span>
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-200 text-indigo-900 border border-indigo-300 uppercase">
                          Action Required
                        </span>
                      </div>
                      <p className="text-xs text-indigo-900/90 leading-relaxed">
                        The customer has requested to return 1 or more items for a refund and exchange 1 or more items for a different size simultaneously. Approving will confirm both actions and coordinate a single reverse pickup with Delhivery for the customer doorstep.
                      </p>

                      {/* Itemised Breakdown Card */}
                      <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {/* Exchange Item(s) */}
                        <div className="p-2.5 bg-purple-50/80 border border-purple-200 rounded-lg">
                          <span className="text-[10px] font-bold text-purple-900 uppercase block mb-1">
                            🔄 Replacement Item(s)
                          </span>
                          {Array.isArray(order.items) && order.items.filter(it => (it.return_action || '').toLowerCase() === 'replace' || (it.status || '').toLowerCase().includes('replace')).map((it, idx) => (
                            <div key={idx} className="font-medium text-neutral-900 text-[11px] leading-tight">
                              {it.name || `Product #${it.product_id}`} <span className="font-bold text-purple-800">(Replace with Size: {it.replacement_size || customReplacementSize || 'L'})</span>
                            </div>
                          ))}
                        </div>

                        {/* Return Item(s) */}
                        <div className="p-2.5 bg-sky-50/80 border border-sky-200 rounded-lg">
                          <span className="text-[10px] font-bold text-sky-900 uppercase block mb-1">
                            ↩️ Return & Refund Item(s)
                          </span>
                          {Array.isArray(order.items) && order.items.filter(it => (it.return_action || '').toLowerCase() === 'return' || (it.status || '').toLowerCase().includes('return')).map((it, idx) => (
                            <div key={idx} className="font-medium text-neutral-900 text-[11px] leading-tight flex justify-between items-center">
                              <span>{it.name || `Product #${it.product_id}`}</span>
                              <span className="font-bold text-emerald-800">Refund: ₹{Number(order.refund_eligible_amount || it.price || 0).toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {(order.cancel_reason || order.return_reason) && (
                        <div className="mt-2 p-2.5 bg-white/80 border border-indigo-200/80 rounded-lg text-xs">
                          <span className="text-[10px] font-bold text-indigo-900 uppercase block">Customer Notes & Fit Reason:</span>
                          <p className="text-neutral-800 font-medium mt-0.5">{order.cancel_reason || order.return_reason}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-indigo-200">
                    <button
                      type="button"
                      disabled={savingStatus}
                      onClick={handleRejectMixedReturnReplace}
                      className="px-4 py-2 bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-800 text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Reject Request
                    </button>
                    <button
                      type="button"
                      disabled={savingStatus}
                      onClick={handleApproveMixedReturnReplace}
                      className="px-5 py-2 bg-indigo-900 hover:bg-black text-white text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {savingStatus ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-200" />
                          <span>Approve Return & Replacement (Schedule Pickup)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* COMPREHENSIVE SIMULTANEOUS RETURN & REPLACEMENT (MIXED LIFECYCLE) HUB */}
              {(() => {
                const isMixed = Boolean(
                  (order?.return_type || '').toLowerCase().includes('mixed') ||
                  (confirmedRef.current.status || confirmedStatus || order?.status || '').toLowerCase().includes('& replacement') ||
                  (confirmedRef.current.status || confirmedStatus || order?.status || '').toLowerCase().includes('returned & replaced') ||
                  (
                    Array.isArray(order?.items) &&
                    order.items.some(it => (it.return_action || '').toLowerCase() === 'return' || (it.status || '').toLowerCase().includes('return')) &&
                    order.items.some(it => (it.return_action || '').toLowerCase() === 'replace' || (it.status || '').toLowerCase().includes('replace'))
                  )
                );
                if (!isMixed) return null;

                const curSt = (confirmedRef.current.status || confirmedStatus || order?.status || '').toLowerCase();
                const curLog = (order?.logistics_status || '').toLowerCase();
                const repOrderNum = order?.replacement_order_number;

                const isS2 = ['return & replacement approved', 'replace approved', 'return approved', 'in transit to house of urvaah', 'received at house of urvaah', 'replaced', 'returned', 'returned & replaced'].includes(curSt) || Boolean(repOrderNum) || (curLog.includes('reverse') && (curLog.includes('pickup') || curLog.includes('awb')));
                const isS3 = ['in transit to house of urvaah', 'received at house of urvaah', 'replaced', 'returned', 'returned & replaced'].includes(curSt) || Boolean(repOrderNum);
                const isS3Active = (['return & replacement approved', 'replace approved', 'return approved'].includes(curSt) || (curLog.includes('reverse') && curLog.includes('pickup scheduled'))) && !isS3;
                const isS4 = ['received at house of urvaah', 'replaced', 'returned', 'returned & replaced'].includes(curSt) || Boolean(repOrderNum);
                const isS4Active = (['in transit to house of urvaah'].includes(curSt) || curLog.includes('transit')) && !isS4;
                const isS5 = Boolean(repOrderNum) && (order?.refund_status === 'Completed' || curSt === 'returned & replaced');
                const isS5Active = ['received at house of urvaah'].includes(curSt) && !isS5;
                const stepNum = isS5 ? 5 : isS5Active ? 5 : isS4 || isS4Active ? 4 : isS3 ? 3 : isS3Active ? 3 : isS2 ? 2 : 1;

                const reqSize = customReplacementSize || getRequestedReplacementSize(order);
                const refundAmount = Number(order.refund_eligible_amount || 0);

                return (
                  <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/70 to-sky-50/70 border-2 border-indigo-300 rounded-xl p-4 sm:p-5 space-y-4 shadow-xs">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-indigo-200/80 pb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold font-admin text-indigo-950 uppercase tracking-wider">
                        <RefreshCw className="w-4 h-4 text-indigo-700" />
                        <span>Simultaneous Return & Replacement Journey</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-200 text-indigo-900 border border-indigo-300 uppercase">
                          Step {stepNum} of 5 Active
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-900 border border-purple-200 uppercase">
                          Mixed Lifecycle
                        </span>
                      </div>
                    </div>

                    {/* 5-Step Stepper */}
                    <div className="bg-white border border-indigo-200/90 rounded-xl p-3 sm:p-4 shadow-2xs">
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                        {/* Step 1: Requested */}
                        <div className="p-2.5 rounded-lg border bg-indigo-50/60 border-indigo-300">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-indigo-700 text-white flex items-center justify-center text-[10px] font-bold shrink-0">✓</div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-950">1. Requested</span>
                          </div>
                          <p className="text-[10px] text-indigo-800 mt-1 pl-6">Mixed: Return + Replace</p>
                        </div>

                        {/* Step 2: Approved */}
                        <div className={`p-2.5 rounded-lg border ${isS2 ? 'bg-indigo-50/60 border-indigo-300' : 'bg-neutral-50 border-neutral-200 opacity-60'}`}>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isS2 ? 'bg-indigo-700 text-white' : 'bg-neutral-300 text-neutral-600'}`}>{isS2 ? '✓' : '2'}</div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-900">2. Approved</span>
                          </div>
                          <p className="text-[10px] text-neutral-600 mt-1 pl-6">{isS2 ? 'Reverse Pickup Scheduled' : 'Pending Review'}</p>
                        </div>

                        {/* Step 3: Courier Pickup */}
                        <div className={`p-2.5 rounded-lg border ${isS3 ? 'bg-indigo-50/60 border-indigo-300' : isS3Active ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-400' : 'bg-neutral-50 border-neutral-200 opacity-60'}`}>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isS3 ? 'bg-indigo-700 text-white' : isS3Active ? 'bg-amber-600 text-white animate-pulse' : 'bg-neutral-300 text-neutral-600'}`}>{isS3 ? '✓' : '3'}</div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-900">3. Handover</span>
                          </div>
                          <p className="text-[10px] text-neutral-600 mt-1 pl-6">{isS3 ? 'Collected & In Transit' : isS3Active ? 'Rider Assigned' : 'Doorstep Pickup'}</p>
                        </div>

                        {/* Step 4: Atelier QC */}
                        <div className={`p-2.5 rounded-lg border ${isS4 ? 'bg-indigo-50/60 border-indigo-300' : isS4Active ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-400' : 'bg-neutral-50 border-neutral-200 opacity-60'}`}>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isS4 ? 'bg-indigo-700 text-white' : isS4Active ? 'bg-blue-600 text-white animate-pulse' : 'bg-neutral-300 text-neutral-600'}`}>{isS4 ? '✓' : '4'}</div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-900">4. Atelier QC</span>
                          </div>
                          <p className="text-[10px] text-neutral-600 mt-1 pl-6">{isS4 ? 'Both Pieces Verified' : isS4Active ? 'In Transit' : 'Arrival & QC'}</p>
                        </div>

                        {/* Step 5: Completed */}
                        <div className={`p-2.5 rounded-lg border ${isS5 ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400' : isS5Active ? 'bg-purple-100 border-purple-300 ring-1 ring-purple-400' : 'bg-neutral-50 border-neutral-200 opacity-60'}`}>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isS5 ? 'bg-emerald-700 text-white' : isS5Active ? 'bg-indigo-700 text-white animate-pulse' : 'bg-neutral-300 text-neutral-600'}`}>{isS5 ? '✓' : '5'}</div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-900">5. Settle & Dispatch</span>
                          </div>
                          <p className="text-[10px] text-neutral-600 mt-1 pl-6">{isS5 ? 'Both Completed' : isS5Active ? 'Ready to Fulfill' : 'Refund & Exchange'}</p>
                        </div>
                      </div>
                    </div>

                    {/* ACTION PANELS ACCORDING TO STAGES */}
                    {/* 1. If Awaiting Pickup / Approved (Step 2 or 3 Active) */}
                    {(['return & replacement approved', 'replace approved', 'return approved'].includes(curSt) || isS3Active) && !isS3 && (
                      <div className="bg-white border border-indigo-200 rounded-xl p-4 space-y-3">
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold font-admin text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
                            <Truck className="w-4 h-4 text-indigo-700" />
                            <span>Doorstep Reverse Collection Scheduled</span>
                          </h5>
                          <p className="text-xs text-neutral-600 leading-relaxed">
                            Delhivery reverse courier has been scheduled. The rider will collect both original pieces from the customer address. When the customer hands over the package, confirm below:
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                          <button
                            type="button"
                            onClick={() => setIsLabelModalOpen(true)}
                            className="px-3 py-2 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                          >
                            <FileText className="w-3.5 h-3.5 text-neutral-600" />
                            <span>Return Label (PDF)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsManifestModalOpen(true)}
                            className="px-3 py-2 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                          >
                            <FileText className="w-3.5 h-3.5 text-neutral-600" />
                            <span>Pickup Manifest</span>
                          </button>
                          <button
                            type="button"
                            disabled={savingStatus}
                            onClick={handleMarkReplacementCollected}
                            className="px-4 py-2 bg-indigo-900 hover:bg-black text-white text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <PackageCheck className="w-4 h-4 text-emerald-400" />
                            <span>Confirm Doorstep Pickup ➔ In Reverse Transit (Step 4)</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 2. If Parcel In Reverse Transit (Step 4 Active) */}
                    {(curSt === 'in transit to house of urvaah' || isS4Active) && !isS4 && (
                      <div className="bg-white border border-blue-200 rounded-xl p-4 space-y-3">
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold font-admin text-blue-950 uppercase tracking-wide flex items-center gap-1.5">
                            <Building className="w-4 h-4 text-blue-700" />
                            <span>Parcel In Reverse Transit to House of Urvaah Atelier</span>
                          </h5>
                          <p className="text-xs text-neutral-600 leading-relaxed">
                            Courier collected both pieces from customer. Once the parcel physically arrives at the atelier and passes quality inspection (QC), confirm receipt below:
                          </p>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                          <button
                            type="button"
                            disabled={savingStatus}
                            onClick={handleConfirmReplacementQCReceived}
                            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4 text-white" />
                            <span>Confirm Both Pieces Received at Atelier & Restocked (QC Passed)</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 3. If Received at Atelier (Step 5 Active) - Dual Settlement Panel */}
                    {(curSt === 'received at house of urvaah' || curSt === 'received at homved' || isS5Active || isS5) && (
                      <div className="space-y-3">
                        {/* Dual Fulfillment Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* A. Exchange Piece Fulfillment */}
                          <div className="bg-white border-2 border-purple-300 rounded-xl p-4 space-y-3 shadow-2xs">
                            <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                              <span className="text-xs font-bold uppercase text-purple-950 flex items-center gap-1.5">
                                <RefreshCw className="w-4 h-4 text-purple-700" />
                                <span>1. Exchange Piece Dispatch</span>
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${repOrderNum ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-purple-100 text-purple-800 border-purple-200'}`}>
                                {repOrderNum ? 'Order Dispatched' : 'Ready to Dispatch'}
                              </span>
                            </div>

                            {repOrderNum ? (
                              <div className="space-y-2">
                                <p className="text-xs text-emerald-900 font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  <span>Replacement Order Live: #{repOrderNum}</span>
                                </p>
                                <button
                                  type="button"
                                  onClick={() => handleOpenReplacementOrder(repOrderNum)}
                                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>Open Replacement Order #{repOrderNum}</span>
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <p className="text-xs text-neutral-600">
                                  QC passed for original item. Confirm replacement size and generate the forward exchange order with 100% credit (₹0 balance).
                                </p>
                                <div>
                                  <span className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">
                                    Garment Size for Replacement:
                                  </span>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                                      <button
                                        key={sz}
                                        type="button"
                                        onClick={() => setCustomReplacementSize(sz)}
                                        className={`px-2.5 py-1 text-xs font-bold rounded-md border transition-all cursor-pointer ${
                                          customReplacementSize === sz
                                            ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                                            : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400'
                                        }`}
                                      >
                                        {sz}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  disabled={savingStatus}
                                  onClick={() => handleGenerateReplacementOrder(customReplacementSize)}
                                  className="w-full py-2.5 bg-neutral-950 hover:bg-black text-white text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                  {savingStatus ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <PackagePlus className="w-4 h-4 text-purple-300" />
                                      <span>Generate & Dispatch Size {customReplacementSize || reqSize}</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>

                          {/* B. Return Item Refund Settlement */}
                          <div className="bg-white border-2 border-sky-300 rounded-xl p-4 space-y-3 shadow-2xs">
                            <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                              <span className="text-xs font-bold uppercase text-sky-950 flex items-center gap-1.5">
                                <Banknote className="w-4 h-4 text-sky-700" />
                                <span>2. Return Item Refund Settlement</span>
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${order.refund_status === 'Completed' || order.refund_status === 'Refunded' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                                {order.refund_status === 'Completed' || order.refund_status === 'Refunded' ? 'Refund Settled' : 'Ready for Payout'}
                              </span>
                            </div>

                            <div className="space-y-2">
                              <p className="text-xs text-neutral-600">
                                Customer is eligible for refund on the returned item. Settlement is disbursed via Refund Desk directly to customer's account.
                              </p>
                              <div className="p-2.5 bg-sky-50 rounded-lg text-xs space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-neutral-500">Refund Amount:</span>
                                  <span className="font-bold text-emerald-700 text-sm">₹{refundAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-[11px]">
                                  <span className="text-neutral-500">Refund Desk Status:</span>
                                  <span className="font-semibold text-neutral-800">{order.refund_status || 'Pending'}</span>
                                </div>
                              </div>
                              <a
                                href={`/admin/refund-desk?search=${encodeURIComponent(order.order_number || order.id)}`}
                                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                              >
                                <Banknote className="w-4 h-4 text-emerald-200" />
                                <span>Open in Refund Desk (Disburse ₹{refundAmount.toLocaleString('en-IN')})</span>
                                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-300" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* COMPREHENSIVE REPLACEMENT & EXCHANGE LIFECYCLE SECTION */}
              {(() => {
                const isMixed = Boolean(
                  (order?.return_type || '').toLowerCase().includes('mixed') ||
                  (confirmedRef.current.status || confirmedStatus || order?.status || '').toLowerCase().includes('& replacement') ||
                  (confirmedRef.current.status || confirmedStatus || order?.status || '').toLowerCase().includes('returned & replaced') ||
                  (
                    Array.isArray(order?.items) &&
                    order.items.some(it => (it.return_action || '').toLowerCase() === 'return' || (it.status || '').toLowerCase().includes('return')) &&
                    order.items.some(it => (it.return_action || '').toLowerCase() === 'replace' || (it.status || '').toLowerCase().includes('replace'))
                  )
                );
                if (isMixed) return null;

                const curSt = (confirmedRef.current.status || confirmedStatus || order?.status || '').toLowerCase();
                const curLog = (order?.logistics_status || '').toLowerCase();
                const returnType = (order?.return_type || '').toLowerCase();

                // Only show Exchange Journey when the order is explicitly in an exchange/replacement lifecycle
                const isReplacementRelated = (
                  returnType === 'replacement' ||
                  returnType === 'exchange' ||
                  [
                    'replacement request processing',
                    'replace requested',
                    'replacement requested',
                    'replace approved',
                    'replacement processing',
                    'replacement shipped',
                    'replacement out for delivery',
                    'replaced',
                    'exchanged'
                  ].includes(curSt) ||
                  Boolean(order?.replacement_order_number || order?.replacement_order_id) ||
                  (Boolean(order?.replacement_size) && (curSt.includes('replace') || curSt === 'exchanged'))
                ) && returnType !== 'return' && !curSt.includes('return') && curSt !== 'cancelled' && curSt !== 'refunded';

                if (!isReplacementRelated) return null;

                const repOrderNum = order?.replacement_order_number;
                const isS2 = ['replace approved', 'in transit to house of urvaah', 'received at house of urvaah', 'replaced'].includes(curSt) || Boolean(repOrderNum) || (curLog.includes('reverse') && curLog.includes('pickup'));
                const isS3 = ['in transit to house of urvaah', 'received at house of urvaah', 'replaced'].includes(curSt) || Boolean(repOrderNum);
                const isS3Active = (curSt === 'replace approved' || (curLog.includes('reverse') && curLog.includes('pickup scheduled'))) && !isS3;
                const isS4 = ['received at house of urvaah', 'replaced'].includes(curSt) || Boolean(repOrderNum);
                const isS4Active = (['in transit to house of urvaah'].includes(curSt)) && !isS4;
                const isS5 = Boolean(repOrderNum) || curSt === 'replaced';
                const isS5Active = ['received at house of urvaah'].includes(curSt) && !isS5;
                const stepNum = isS5 ? 5 : isS5Active ? 4 : isS4 || isS4Active ? 4 : isS3 ? 3 : isS3Active ? 3 : isS2 ? 2 : 1;

                const reqSize = customReplacementSize || getRequestedReplacementSize(order);

                return (
                  <div className="bg-purple-50/70 border-2 border-purple-300 rounded-xl p-4 sm:p-5 space-y-4 shadow-xs">
                    {/* Header with Step Tracker */}
                    <div className="flex items-center justify-between border-b border-purple-200/80 pb-3">
                      <div className="flex items-center gap-2 text-xs font-bold font-admin text-purple-950 uppercase tracking-wider">
                        <RefreshCw className="w-4 h-4 text-purple-700" />
                        <span>Exchange & Doorstep Reverse Pickup Journey</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-200 text-purple-900 border border-purple-300 uppercase">
                        Step {stepNum} of 5 Active
                      </span>
                    </div>

                    {/* 5-Step Visual Stepper */}
                    <div className="bg-white border border-purple-200/90 rounded-xl p-3 sm:p-4 shadow-2xs">
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                        {/* Step 1: Requested */}
                        <div className="p-2.5 rounded-lg border bg-purple-50/60 border-purple-300">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-purple-700 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                              ✓
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-950">1. Requested</span>
                          </div>
                          <p className="text-[10px] text-purple-800 mt-1 pl-6">Size: {reqSize}</p>
                        </div>

                        {/* Step 2: Approved */}
                        <div className={`p-2.5 rounded-lg border ${isS2 ? 'bg-purple-50/60 border-purple-300' : 'bg-neutral-50 border-neutral-200 opacity-60'}`}>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isS2 ? 'bg-purple-700 text-white' : 'bg-neutral-300 text-neutral-600'}`}>
                              {isS2 ? '✓' : '2'}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-900">2. Approved</span>
                          </div>
                          <p className="text-[10px] text-neutral-600 mt-1 pl-6">{isS2 ? 'Pickup Scheduled' : 'Pending Review'}</p>
                        </div>

                        {/* Step 3: Courier Pickup */}
                        <div className={`p-2.5 rounded-lg border ${isS3 ? 'bg-purple-50/60 border-purple-300' : isS3Active ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-400' : 'bg-neutral-50 border-neutral-200 opacity-60'}`}>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isS3 ? 'bg-purple-700 text-white' : isS3Active ? 'bg-amber-600 text-white animate-pulse' : 'bg-neutral-300 text-neutral-600'}`}>
                              {isS3 ? '✓' : '3'}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-900">3. Handover</span>
                          </div>
                          <p className="text-[10px] text-neutral-600 mt-1 pl-6">{isS3 ? 'Collected & In Transit' : isS3Active ? 'Awaiting Rider' : 'Doorstep Pickup'}</p>
                        </div>

                        {/* Step 4: Atelier QC */}
                        <div className={`p-2.5 rounded-lg border ${isS4 ? 'bg-purple-50/60 border-purple-300' : isS4Active ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-400' : 'bg-neutral-50 border-neutral-200 opacity-60'}`}>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isS4 ? 'bg-purple-700 text-white' : isS4Active ? 'bg-blue-600 text-white animate-pulse' : 'bg-neutral-300 text-neutral-600'}`}>
                              {isS4 ? '✓' : '4'}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-900">4. Atelier QC</span>
                          </div>
                          <p className="text-[10px] text-neutral-600 mt-1 pl-6">{isS4 ? 'Piece Verified' : isS4Active ? 'In Transit' : 'Arrival & QC'}</p>
                        </div>

                        {/* Step 5: Replacement Dispatched */}
                        <div className={`p-2.5 rounded-lg border ${isS5 ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400' : isS5Active ? 'bg-purple-100 border-purple-300 ring-1 ring-purple-400' : 'bg-neutral-50 border-neutral-200 opacity-60'}`}>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isS5 ? 'bg-emerald-700 text-white' : isS5Active ? 'bg-purple-700 text-white animate-pulse' : 'bg-neutral-300 text-neutral-600'}`}>
                              {isS5 ? '✓' : '5'}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-900">5. Dispatched</span>
                          </div>
                          <p className="text-[10px] text-neutral-600 mt-1 pl-6">{isS5 ? (repOrderNum || 'New Order Active') : isS5Active ? 'Ready to Dispatch' : 'New Order'}</p>
                        </div>
                      </div>
                    </div>

                    {/* ACTION PANEL BASED ON CURRENT STEP */}
                    {/* A. If Pickup Scheduled (Step 3 Active) */}
                    {(curSt === 'replace approved' || isS3Active) && !isS3 && !repOrderNum && (
                      <div className="bg-white border border-purple-200 rounded-xl p-4 space-y-3">
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold font-admin text-purple-950 uppercase tracking-wide flex items-center gap-1.5">
                            <Truck className="w-4 h-4 text-purple-700" />
                            <span>Doorstep Reverse Pickup Assigned</span>
                          </h5>
                          <p className="text-xs text-neutral-600 leading-relaxed">
                            Delhivery reverse courier has been scheduled for customer address. Rider will arrive to collect the original item. When the customer hands over the parcel to the rider, click below:
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                          <button
                            type="button"
                            disabled={savingStatus}
                            onClick={() => handleGenerateReplacementOrder(reqSize)}
                            className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                            title="Generate and dispatch replacement order immediately without waiting for return delivery"
                          >
                            <Zap className="w-3.5 h-3.5 text-purple-700" />
                            <span>Express: Dispatch Replacement Now</span>
                          </button>
                          <button
                            type="button"
                            disabled={savingStatus}
                            onClick={handleMarkReplacementCollected}
                            className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <PackageCheck className="w-4 h-4 text-emerald-400" />
                            <span>Mark Parcel Collected from Customer</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* B. If Parcel in Transit to Atelier (Step 4 Active) */}
                    {(curSt === 'in transit to house of urvaah' || isS4Active) && !isS4 && !repOrderNum && (
                      <div className="bg-white border border-blue-200 rounded-xl p-4 space-y-3">
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold font-admin text-blue-950 uppercase tracking-wide flex items-center gap-1.5">
                            <Building className="w-4 h-4 text-blue-700" />
                            <span>Parcel In Reverse Transit to Urvaah Atelier</span>
                          </h5>
                          <p className="text-xs text-neutral-600 leading-relaxed">
                            Courier has collected the original piece from the customer doorstep. Once the parcel physically arrives at the atelier and passes quality inspection (QC), confirm receipt below:
                          </p>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                          <button
                            type="button"
                            disabled={savingStatus}
                            onClick={handleConfirmReplacementQCReceived}
                            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4 text-white" />
                            <span>Confirm Parcel Received at Atelier & Verified (QC Passed)</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* C. If Piece Received at Atelier & Ready for Dispatch (Step 5 Active) */}
                    {((curSt === 'received at house of urvaah' || curSt === 'received at homved' || isS5Active) && !repOrderNum) && (
                      <div className="bg-white border border-purple-300 rounded-xl p-4 space-y-4">
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold font-admin text-purple-950 uppercase tracking-wide flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Original Piece Verified at Atelier • Ready to Dispatch Replacement Order</span>
                          </h5>
                          <p className="text-xs text-neutral-600 leading-relaxed">
                            The returned piece has passed inspection. Generate the new replacement order below. This will create a linked forward order in the customer's account so they can track the full forward lifecycle!
                          </p>
                        </div>

                        {/* Size Selection & Confirmation Box */}
                        <div className="p-3.5 bg-purple-50/80 border border-purple-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                              Replacement Garment Size:
                            </span>
                            <div className="flex items-center gap-2">
                              {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                                <button
                                  key={sz}
                                  type="button"
                                  onClick={() => setCustomReplacementSize(sz)}
                                  className={`px-3 py-1 text-xs font-bold rounded-md border transition-all cursor-pointer ${
                                    customReplacementSize === sz
                                      ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                                      : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400'
                                  }`}
                                >
                                  {sz}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                              Order Total:
                            </span>
                            <span className="font-bold text-emerald-700 text-sm">
                              ₹0 (100% Exchange Credit)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                          <button
                            type="button"
                            disabled={savingStatus}
                            onClick={() => handleGenerateReplacementOrder(customReplacementSize)}
                            className="px-5 py-2.5 bg-neutral-950 hover:bg-black text-white text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-2"
                          >
                            {savingStatus ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Generating Order...</span>
                              </>
                            ) : (
                              <>
                                <PackagePlus className="w-4 h-4 text-purple-300" />
                                <span>Generate & Dispatch Replacement Order</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* D. If Replacement Order has been Generated */}
                    {(repOrderNum || curSt === 'replaced') && (
                      <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-emerald-100 rounded-lg text-emerald-800 shrink-0 mt-0.5">
                            <PackageCheck className="w-5 h-5 text-emerald-700" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-xs sm:text-sm font-admin font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-2">
                              <span>Replacement Order Generated: #{repOrderNum || `${order?.order_number}-REP`}</span>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-200 text-emerald-900 border border-emerald-300">
                                ACTIVE
                              </span>
                            </h4>
                            <p className="text-xs text-emerald-900/90 leading-relaxed">
                              New forward exchange order is live in the system (Size: {reqSize}). The customer can track the forward fulfillment live from their account.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenReplacementOrder(repOrderNum || `${order?.order_number}-REP`)}
                            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open Replacement Order</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Pre-Delivery Cancelled & Refunded Banner */}
              {(() => {
                const curSt = (confirmedRef.current.status || confirmedStatus || order?.status || '').toLowerCase();
                const isProductEverDelivered = Boolean(order?.delivered_at) || 
                  (order?.original_status || '').toLowerCase() === 'delivered' || 
                  Boolean(order?.is_product_received);
                const isPreDeliveryCancellation = !isProductEverDelivered && (
                  curSt === 'cancelled' || curSt === 'refunded' || curSt.includes('cancel') || Boolean(order?.cancel_reason)
                );
                if (!isPreDeliveryCancellation) return null;
                const isRefundCompleted = (order?.refund_status && ['completed', 'refunded', 'success'].includes(String(order.refund_status).toLowerCase())) || 
                  curSt === 'refunded' || 
                  ((order?.payment_status || '').toLowerCase() === 'refunded');

                return (
                  <div className="bg-emerald-50/90 border-2 border-emerald-300 rounded-xl p-4 sm:p-5 flex items-start gap-3.5 shadow-xs">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-800 shrink-0 mt-0.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-admin font-bold text-emerald-950 uppercase tracking-wide">
                          {isRefundCompleted ? 'Order Cancelled Prior to Dispatch & Full Refund Settled' : 'Order Cancelled Prior to Dispatch'}
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900 border border-emerald-300 uppercase">
                          {isRefundCompleted ? 'Cancelled & Refunded' : 'Cancelled'}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-900/90 leading-relaxed">
                        This order was cancelled before courier dispatch. Shiprocket courier pickup was voided with ₹0 freight charge.
                        {isRefundCompleted && ` Full 100% refund of ₹${Number(order.total || 0).toLocaleString('en-IN')} has been disbursed.`}
                        {order.refund_txn_id && ` Transaction Reference / UTR: ${order.refund_txn_id}`}
                      </p>
                      {order.cancel_reason && (
                        <p className="text-[11px] text-emerald-800 pt-1">
                          <span className="font-semibold uppercase tracking-wider text-[10px]">Cancellation Reason:</span> {order.cancel_reason}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Return & Doorstep Reverse Pickup Journey (5-Step Visual Hub) */}
              {(() => {
                const curSt = (confirmedRef.current.status || confirmedStatus || order?.status || '').toLowerCase();
                const curLog = (order?.logistics_status || '').toLowerCase();
                const returnType = (order?.return_type || '').toLowerCase();

                const isMixed = Boolean(
                  (order?.return_type || '').toLowerCase().includes('mixed') ||
                  curSt.includes('& replacement') ||
                  curSt.includes('returned & replaced') ||
                  (
                    Array.isArray(order?.items) &&
                    order.items.some(it => (it.return_action || '').toLowerCase() === 'return' || (it.status || '').toLowerCase().includes('return')) &&
                    order.items.some(it => (it.return_action || '').toLowerCase() === 'replace' || (it.status || '').toLowerCase().includes('replace'))
                  )
                );
                if (isMixed) return null;

                // Mutually exclusive: If Exchange Journey is active or order is in replacement lifecycle, never show Return Journey
                const isReplacementRelated = (
                  returnType === 'replacement' ||
                  returnType === 'exchange' ||
                  [
                    'replacement request processing',
                    'replace requested',
                    'replacement requested',
                    'replace approved',
                    'replacement processing',
                    'replacement shipped',
                    'replacement out for delivery',
                    'replaced',
                    'exchanged'
                  ].includes(curSt) ||
                  Boolean(order?.replacement_order_number || order?.replacement_order_id) ||
                  (Boolean(order?.replacement_size) && (curSt.includes('replace') || curSt === 'exchanged'))
                ) && returnType !== 'return' && !curSt.includes('return') && curSt !== 'cancelled' && curSt !== 'refunded';
                if (isReplacementRelated) return null;

                const isProductEverDelivered = Boolean(order?.delivered_at) || 
                  (order?.original_status || '').toLowerCase() === 'delivered' || 
                  Boolean(order?.is_product_received);
                const isPreDeliveryCancellation = !isProductEverDelivered && (
                  curSt === 'cancelled' || curSt === 'refunded' || curSt.includes('cancel') || Boolean(order?.cancel_reason)
                );
                if (isPreDeliveryCancellation) return null;

                // Explicit Return & Refund Lifecycle check (never triggered by generic forward pickup or forward AWB)
                const isReturnRelated = (
                  returnType === 'return' ||
                  order?.is_returned_order === true ||
                  [
                    'return requested',
                    'return request processing',
                    'return approved',
                    'return collected',
                    'in transit to house of urvaah',
                    'received at house of urvaah',
                    'received at homved',
                    'returned',
                    'return rejected'
                  ].includes(curSt)
                ) && curSt !== 'cancelled' && curSt !== 'refunded' && !curSt.includes('replace');

                if (!isReturnRelated) return null;

                const isS2 = ['return approved', 'return collected', 'in transit to house of urvaah', 'received at house of urvaah', 'received at homved', 'returned'].includes(curSt) || (curLog.includes('reverse') && (curLog.includes('pickup') || curLog.includes('awb')));
                const isS3 = ['return collected', 'in transit to house of urvaah', 'received at house of urvaah', 'received at homved', 'returned'].includes(curSt) || (curLog.includes('reverse') && curLog.includes('collected'));
                const isS3Active = (curSt === 'return approved' || (curLog.includes('reverse') && curLog.includes('pickup scheduled'))) && !isS3;
                const isS4 = ['received at house of urvaah', 'received at homved', 'returned'].includes(curSt) || (curLog.includes('reverse') && curLog.includes('delivered to'));
                const isS4Active = (['return collected', 'in transit to house of urvaah'].includes(curSt) || (curLog.includes('reverse') && curLog.includes('transit'))) && !isS4;
                const isS5 = curSt === 'returned';
                const isS5Active = ['received at house of urvaah', 'received at homved'].includes(curSt) && !isS5;
                const stepNum = isS5 ? 5 : isS5Active ? 5 : isS4 || isS4Active ? 4 : isS3 ? 3 : isS3Active ? 3 : isS2 ? 2 : 1;

                return (
                  <div className="bg-sky-50/70 border-2 border-sky-300 rounded-xl p-4 sm:p-5 space-y-4 shadow-xs">
                    {/* Card Title & Step Indicator */}
                    <div className="flex items-center justify-between border-b border-sky-200/80 pb-3">
                      <div className="flex items-center gap-2 text-xs font-bold font-admin text-sky-950 uppercase tracking-wider">
                        <RotateCcw className="w-4 h-4 text-sky-700" />
                        <span>Return & Doorstep Reverse Pickup Journey</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-200 text-sky-900 border border-sky-300 uppercase">
                        Step {stepNum} of 5 Active
                      </span>
                    </div>

                    {/* 5-Step Visual Stepper */}
                    <div className="bg-white border border-sky-200/90 rounded-xl p-3 sm:p-4 shadow-2xs">
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                          {/* Step 1: Return Requested */}
                          <div className="p-2.5 rounded-lg border bg-sky-50/60 border-sky-300">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-sky-700 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                ✓
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-950">1. Requested</span>
                            </div>
                            <p className="text-[10px] text-sky-800 mt-1 pl-6">Customer initiated</p>
                          </div>

                          {/* Step 2: Atelier Approved */}
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

                          {/* Step 4: In Transit to Atelier */}
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
                      </div>

                    {/* Reverse Courier & Doorstep Pickup Metadata Card */}
                    <div className="bg-white border border-sky-200/90 rounded-xl p-4 space-y-3 shadow-2xs text-xs">
                      <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-neutral-100">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-sky-700" />
                          <span className="font-bold text-sky-950 uppercase tracking-wide">
                            Doorstep Courier Collection Details
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isS2 ? (
                            <>
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Reverse AWB Assigned
                              </span>
                              {(order.reverse_tracking_number || order.reverse_awb || order.tracking_number || order.awb_code) && (
                                <span className="font-mono font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                                  {order.reverse_tracking_number || order.reverse_awb || order.tracking_number || order.awb_code}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                              Awaiting Review & Approval
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Reverse Courier</span>
                          <span className="font-medium text-neutral-900 mt-0.5 block">
                            {order.courier_name || 'Delhivery Reverse Logistics (Doorstep QC)'}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Customer Contact</span>
                          <span className="font-medium text-neutral-900 mt-0.5 block">
                            {order.shipping_name || order.recipient_name || order.customer_name || 'Customer'}
                          </span>
                          <span className="text-[11px] text-neutral-500">
                            {order.shipping_phone || order.phone || 'Phone on file'}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Doorstep Pickup Address</span>
                          <span className="font-medium text-neutral-800 mt-0.5 block leading-tight text-[11px]">
                            {order.shipping_address || order.address || 'Customer Delivery Address'}
                            {order.shipping_city ? `, ${order.shipping_city}` : ''}
                            {order.shipping_pincode || order.pincode ? ` - ${order.shipping_pincode || order.pincode}` : ''}
                          </span>
                        </div>
                      </div>

                      {/* Explanatory Journey Status Text */}
                      <div className="p-2.5 bg-sky-50 rounded-lg text-sky-900 text-[11px] leading-relaxed border border-sky-200/70">
                        {(() => {
                          const s = (confirmedRef.current.status || confirmedStatus || order?.status || '').toLowerCase();
                          if (s === 'returned') return '100% full refund has been settled to the customer. Return and reverse courier journey complete.';
                          if (s.includes('received')) return 'Package has arrived at House of Urvaah atelier, verified by QC team and auto-restocked. Ready for refund disbursement.';
                          if (s.includes('transit') || s.includes('collected')) return 'Courier rider has collected the parcel from customer doorstep! Parcel is currently in transit to House of Urvaah atelier.';
                          if (s === 'return approved') return 'Return request approved and reverse AWB allocated! Delhivery courier is dispatched to customer doorstep for collection within 24-48 hours.';
                          return 'Customer has requested a return. Review and approve the request to dispatch reverse courier pickup.';
                        })()}
                      </div>

                      {/* Action Bar inside Return Hub with Sequential Advance Options */}
                      <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-sky-100">
                        {/* Step 1 Actions: If Return Requested or Processing */}
                        {['return requested', 'return request processing', 'return processing'].includes(curSt) && (
                          <>
                            <button
                              type="button"
                              disabled={savingStatus}
                              onClick={handleRejectReturn}
                              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject Return</span>
                            </button>
                            <button
                              type="button"
                              disabled={savingStatus}
                              onClick={handleApproveReturn}
                              className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-sky-200" />
                              <span>Approve Return & Schedule Pickup (Step 2/3)</span>
                            </button>
                          </>
                        )}

                        {/* Step 3 Actions: If Return Approved (Awaiting Doorstep Handover) */}
                        {(curSt === 'return approved' || isS3Active) && (
                          <>
                            <button
                              type="button"
                              onClick={() => setIsLabelModalOpen(true)}
                              className="px-3 py-2 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                            >
                              <FileText className="w-3.5 h-3.5 text-neutral-600" />
                              <span>Return Label (PDF)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsManifestModalOpen(true)}
                              className="px-3 py-2 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                            >
                              <FileText className="w-3.5 h-3.5 text-neutral-600" />
                              <span>Pickup Manifest</span>
                            </button>
                            <button
                              type="button"
                              disabled={savingStatus}
                              onClick={handleSimulateDoorstepHandover}
                              className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                              title="Advance to Step 4: Courier collected item at doorstep"
                            >
                              {savingStatus ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Truck className="w-3.5 h-3.5 text-sky-200" />
                              )}
                              <span>Confirm Doorstep Pickup ➔ In Transit (Step 4)</span>
                            </button>
                          </>
                        )}

                        {/* Step 4 Actions: If In Transit */}
                        {(curSt.includes('transit') || curSt.includes('collected') || isS4Active) && (
                          <button
                            type="button"
                            disabled={savingStatus}
                            onClick={handleMarkReceivedAtUrvaah}
                            className="px-5 py-2.5 bg-neutral-950 hover:bg-black text-white text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
                            title="Advance to Step 5: Item delivered back to atelier and restocked"
                          >
                            {savingStatus ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Updating...</span>
                              </>
                            ) : (
                              <>
                                <PackageCheck className="w-4 h-4 text-emerald-400" />
                                <span>Mark Received at Atelier & Restock (Step 5)</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Step 5 Actions: If Received at Atelier - Process exclusively via Refund Desk */}
                        {(['received at house of urvaah', 'received at homved'].includes(curSt) || isS5Active) && (
                          <a
                            href={`/admin/refund-desk?search=${encodeURIComponent(order.order_number || order.id)}`}
                            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                            title="Open Refund Desk to settle payout"
                          >
                            <Banknote className="w-4 h-4 text-emerald-200" />
                            <span>Process in Refund Desk (₹{(order.refund_eligible_amount || order.total || 0).toLocaleString('en-IN')})</span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-300" />
                          </a>
                        )}

                        {/* Completed State: If Returned */}
                        {isS5 && (
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>✓ Return & 100% Refund Completed</span>
                            </span>
                            <a
                              href={`/admin/refund-desk?search=${encodeURIComponent(order.order_number || order.id)}`}
                              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold flex items-center gap-1"
                            >
                              <span>View Refund Record</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </a>
                          </div>
                        )}

                        {/* Reverse Scans Toggle */}
                        <button
                          type="button"
                          onClick={handleFetchTracking}
                          className="px-3 py-2 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs ml-auto"
                        >
                          <Truck className="w-3.5 h-3.5 text-neutral-600" />
                          <span>{showTrackingScans ? 'Hide Reverse Scans' : 'Live Reverse Scans'}</span>
                          {showTrackingScans ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

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
                    {(order.payment_method || '').toLowerCase() !== 'cod' && (
                      <div className="pt-1">
                        <a
                          href={`/admin/refund-desk?search=${encodeURIComponent(order.order_number || order.id)}`}
                          className="inline-flex items-center gap-1 font-semibold text-[11px] text-indigo-700 hover:text-indigo-900 underline"
                        >
                          <span>Open this order in Refund Desk</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status Management Section */}
              {!hideStatusManagement && (
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
              )}

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
                      {order.courier_name || (order.tracking_number ? 'Delhivery Express (Air)' : 'Pending Assignment')}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Fulfillment Stage</span>
                    <span className={`font-bold mt-0.5 block uppercase ${
                      order.logistics_status === 'Pickup Scheduled' || order.shipment_status === 'Pickup Scheduled'
                        ? 'text-emerald-700'
                        : 'text-brand-dark'
                    }`}>
                      {order.logistics_status === 'Pickup Scheduled' || order.shipment_status === 'Pickup Scheduled'
                        ? 'Pickup Scheduled'
                        : (order.logistics_status ? order.logistics_status.replace(/_/g, ' ') : (order.status || 'Pending'))}
                    </span>
                  </div>
                </div>

                {/* Dedicated Pickup Scheduled Status Banner */}
                {(order.pickup_token || order.logistics_status === 'Pickup Scheduled' || order.shipment_status === 'Pickup Scheduled') && (
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-emerald-50 border border-emerald-200/90 rounded-lg text-xs text-emerald-950">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-semibold text-emerald-950">Courier Pickup Confirmed: </span>
                        <span>Token </span>
                        <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-300 text-emerald-800">
                          {order.pickup_token || 'PKP-CONFIRMED'}
                        </span>
                        <span className="text-emerald-700 ml-1.5 text-[11px]">
                          {order.pickup_scheduled_date ? `• Scheduled: ${order.pickup_scheduled_date}` : '• Courier driver dispatched to House of Urvaah atelier'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-200/80 text-emerald-900 rounded-full">
                      Ready for Handover
                    </span>
                  </div>
                )}

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
                    disabled={logisticsLoading || (!order.tracking_number && !order.trackingNumber)}
                    onClick={handleSchedulePickup}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs ${
                      order.pickup_token || order.logistics_status === 'Pickup Scheduled' || order.shipment_status === 'Pickup Scheduled'
                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                        : 'bg-neutral-900 hover:bg-black text-white'
                    }`}
                    title={(!order.tracking_number && !order.trackingNumber) ? "Generate AWB first before scheduling pickup" : (order.pickup_token ? `Pickup Scheduled (Token: ${order.pickup_token})` : "Request courier rider to pick up shipment")}
                  >
                    {logisticsLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (order.pickup_token || order.logistics_status === 'Pickup Scheduled' || order.shipment_status === 'Pickup Scheduled') ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                    ) : (
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>
                      {(order.pickup_token || order.logistics_status === 'Pickup Scheduled' || order.shipment_status === 'Pickup Scheduled')
                        ? `Pickup Scheduled${order.pickup_token ? ` (${order.pickup_token})` : ''}`
                        : 'Schedule Courier Pickup'}
                    </span>
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

                {/* 1-Click Milestone Testing Strip (Shiprocket Forward Desk Only) */}
                {isShiprocketDesk && (
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
                )}

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
                                {(() => {
                                  const act = (item.return_action || '').toLowerCase();
                                  const stat = (item.status || '').toLowerCase();
                                  if (act === 'keep') {
                                    return (
                                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                        Kept by Customer
                                      </span>
                                    );
                                  }
                                  if (act === 'replace' || stat.includes('replace') || stat.includes('exchange')) {
                                    return (
                                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-900 border border-purple-200">
                                        Replace (Size: {item.replacement_size || 'M'})
                                      </span>
                                    );
                                  }
                                  if (act === 'return' || stat.includes('return')) {
                                    return (
                                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                        Return Requested
                                      </span>
                                    );
                                  }
                                  if (stat.includes('cancel')) {
                                    return (
                                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                                        Cancelled
                                      </span>
                                    );
                                  }
                                  if (item.status) {
                                    return (
                                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200">
                                        {item.status}
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                              <p className="text-[11px] text-neutral-500 mt-0.5">
                                Qty: <span className="font-medium text-brand-dark">{qty}</span> × ₹{unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                {item.size && <span className="ml-2">• Size: {item.size}</span>}
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

      {/* Official Haute Couture Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        order={order}
        orderId={order?.order_number || order?.id || orderId}
      />

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

