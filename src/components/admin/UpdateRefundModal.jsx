import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  IndianRupee,
  CreditCard,
  Building,
  Smartphone,
  Package,
  Check,
  Copy,
  ChevronDown,
  Image as ImageIcon
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { getSupabaseMediaUrl } from '../../lib/supabase';

// Supported refund stages / statuses matching backend schema
const REFUND_STATUS_OPTIONS = [
  {
    value: 'Requested',
    label: 'Requested',
    description: 'Customer requested a refund / cancellation',
    dotColor: 'bg-amber-500'
  },
  {
    value: 'Processing',
    label: 'Processing',
    description: 'Refund is actively being reviewed or processed',
    dotColor: 'bg-indigo-500'
  },
  {
    value: 'Completed',
    label: 'Completed / Paid',
    description: 'Refund has been successfully disbursed to the customer',
    dotColor: 'bg-emerald-500'
  },
  {
    value: 'On Hold',
    label: 'On Hold',
    description: 'Refund is paused pending customer response or verification',
    dotColor: 'bg-purple-500'
  },
  {
    value: 'Failed',
    label: 'Failed / Rejected',
    description: 'Refund request was declined or payment failed',
    dotColor: 'bg-stone-500'
  }
];

// Helper: Normalize incoming status
function normalizeStatus(status) {
  const s = (status || '').toLowerCase();
  if (s === 'completed' || s === 'refunded') return 'Completed';
  if (s === 'processing' || s === 'in-review') return 'Processing';
  if (s === 'failed' || s === 'rejected' || s === 'denied') return 'Failed';
  if (s === 'on hold' || s === 'on-hold') return 'On Hold';
  return 'Requested';
}

// Helper: Format date & time (e.g. 10 Jun 2026, 11:25 PM)
function formatDateTime(dateStr) {
  if (!dateStr) return 'Not available';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Not available';
  
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  const time = date.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  
  return `${day} ${month} ${year}, ${time}`;
}

// Helper: Format date only (e.g. 10 Jun 2026)
function formatDateOnly(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'N/A';
  
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

// Helper: Get source / request type label
function getRequestType(order) {
  if (order.return_type === 'exchange' || order.status === 'Exchanged') {
    return 'Exchange Refund';
  }
  if (order.return_type === 'return' || order.is_returned_order || (order.status || '').toLowerCase().includes('return')) {
    return 'Return (Refund)';
  }
  return 'Order Cancellation';
}

// Helper: Render icon corresponding to payment method
function renderPaymentIcon(method) {
  const m = (method || '').toLowerCase();
  if (m.includes('upi') || m.includes('gpay') || m.includes('phonepe') || m.includes('paytm')) {
    return <Smartphone className="w-3.5 h-3.5 text-neutral-700 shrink-0" />;
  }
  if (m.includes('card') || m.includes('visa') || m.includes('master')) {
    return <CreditCard className="w-3.5 h-3.5 text-neutral-700 shrink-0" />;
  }
  if (m.includes('bank') || m.includes('netbanking')) {
    return <Building className="w-3.5 h-3.5 text-neutral-700 shrink-0" />;
  }
  return <IndianRupee className="w-3.5 h-3.5 text-neutral-700 shrink-0" />;
}

// Helper: Determine received status badge label for an item
function getItemReceivedStatus(item, order) {
  const status = (item.status || order.status || '').toLowerCase();
  if (status.includes('received') || status.includes('restocked') || order.is_product_received) {
    return 'RECEIVED AT HOUSE OF URVAAH';
  }
  if (status.includes('returned') || status.includes('refunded')) {
    return 'RECEIVED';
  }
  if (status.includes('return approved') || status.includes('approved')) {
    return 'RETURN APPROVED';
  }
  if (status.includes('cancelled')) {
    return 'CANCELLED';
  }
  if (status.includes('processing')) {
    return 'IN PROCESSING';
  }
  return 'REQUESTED';
}

export const UpdateRefundModal = ({
  isOpen,
  onClose,
  refundOrder,
  initialTargetStatus,
  onSuccess
}) => {
  // Editable form state fields
  const [selectedStatus, setSelectedStatus] = useState('Requested');
  const [adminNote, setAdminNote] = useState('');
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [txnId, setTxnId] = useState('');
  const [refundAmountInput, setRefundAmountInput] = useState('');
  const [customerReasonInput, setCustomerReasonInput] = useState('');

  // Async data state
  const [fetchedItems, setFetchedItems] = useState(null);
  const [loadingItems, setLoadingItems] = useState(false);
  const [payoutInfo, setPayoutInfo] = useState(null);
  const [loadingPayout, setLoadingPayout] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  // Initial confirmed values to track unsaved edits
  const initialRef = useRef({
    status: 'Requested',
    note: '',
    notify: true,
    txnId: '',
    amount: '',
    reason: ''
  });

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Copy to clipboard with visual feedback & fallback
  const handleCopy = (key, text) => {
    if (text === undefined || text === null) return;
    const cleanText = String(text).trim();
    if (!cleanText) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(cleanText)
        .then(() => {
          setCopiedKey(key);
          setTimeout(() => setCopiedKey(null), 2000);
        })
        .catch(() => {
          copyFallback(cleanText);
          setCopiedKey(key);
          setTimeout(() => setCopiedKey(null), 2000);
        });
    } else {
      copyFallback(cleanText);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const copyFallback = (text) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    } catch (err) {
      console.warn('Clipboard fallback failed:', err);
    }
  };

  // Populate state when modal opens or refundOrder changes
  useEffect(() => {
    if (isOpen && refundOrder) {
      const initStatus = initialTargetStatus || normalizeStatus(refundOrder.refund_status);
      const initNote = refundOrder.refund_admin_note || refundOrder.rejection_reason || '';
      const initTxn = refundOrder.refund_txn_id || '';
      const initNotify = true;

      const totalVal = parseFloat(refundOrder.total || 0);
      const initAmt = parseFloat(
        refundOrder.refund_eligible_amount !== undefined && refundOrder.refund_eligible_amount > 0
          ? refundOrder.refund_eligible_amount
          : refundOrder.total || 0
      );
      const initAmtStr = initAmt > 0 ? initAmt.toString() : (totalVal > 0 ? totalVal.toString() : '');

      const initReason =
        refundOrder.cancel_reason ||
        refundOrder.return_reason ||
        refundOrder.cancellation_reason ||
        refundOrder.reason ||
        '';

      setSelectedStatus(initStatus);
      setAdminNote(initNote);
      setTxnId(initTxn);
      setNotifyCustomer(initNotify);
      setRefundAmountInput(initAmtStr);
      setCustomerReasonInput(initReason);

      setErrorMsg(null);
      setShowDiscardConfirm(false);
      setFetchedItems(null);
      setPayoutInfo(null);
      setCopiedKey(null);

      initialRef.current = {
        status: initStatus,
        note: initNote,
        notify: initNotify,
        txnId: initTxn,
        amount: initAmtStr,
        reason: initReason
      };

      // 1. Fetch line items if not already populated on refundOrder
      const existingItems =
        Array.isArray(refundOrder.refund_items) && refundOrder.refund_items.length > 0
          ? refundOrder.refund_items
          : Array.isArray(refundOrder.items) && refundOrder.items.length > 0
          ? refundOrder.items
          : null;

      if (!existingItems && refundOrder.id) {
        setLoadingItems(true);
        apiClient(`/api/orders/${refundOrder.id}`)
          .then((res) => {
            const data = res?.data || res;
            if (data && Array.isArray(data.items)) {
              setFetchedItems(data.items);
            }
          })
          .catch((err) => {
            console.warn('[UpdateRefundModal] Failed to fetch items for order:', err);
          })
          .finally(() => {
            setLoadingItems(false);
          });
      }

      // 2. Fetch fresh payout/payment details from API
      if (refundOrder.id) {
        setLoadingPayout(true);
        apiClient(`/api/admin/refund/${refundOrder.id}/payment-details`)
          .then((res) => {
            const data = res?.data || res;
            if (data) {
              setPayoutInfo(data);
            }
          })
          .catch((err) => {
            console.warn('[UpdateRefundModal] Fallback to order payout fields:', err.message);
          })
          .finally(() => {
            setLoadingPayout(false);
          });
      }
    }
  }, [isOpen, refundOrder, initialTargetStatus]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !submitting) {
        handleAttemptClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, adminNote, selectedStatus, notifyCustomer, txnId, refundAmountInput, customerReasonInput]);

  if (!isOpen || !refundOrder) return null;

  const orderNumber =
    refundOrder.order_number || (refundOrder.id ? String(refundOrder.id).slice(0, 8) : 'N/A');
  const requestDate =
    refundOrder.return_request_at ||
    refundOrder.cancelled_at ||
    refundOrder.updated_at ||
    refundOrder.created_at;
  const requestType = getRequestType(refundOrder);

  const totalOrderAmount = parseFloat(refundOrder.total || 0);
  const currentEligibleAmount = parseFloat(refundAmountInput) || 0;
  const isPartial = currentEligibleAmount > 0 && currentEligibleAmount < totalOrderAmount;

  const paymentMethod = (
    payoutInfo?.payment_method ||
    refundOrder.payment_method ||
    'Online'
  ).toUpperCase();

  // Determine items list
  const hasSpecificRefundItems =
    Array.isArray(refundOrder.refund_items) && refundOrder.refund_items.length > 0;
  const itemsList = hasSpecificRefundItems
    ? refundOrder.refund_items
    : fetchedItems && fetchedItems.length > 0
    ? fetchedItems
    : Array.isArray(refundOrder.items) && refundOrder.items.length > 0
    ? refundOrder.items
    : [];

  // Read-only Payout / Bank details
  const holderName =
    payoutInfo?.payout_holder_name ||
    payoutInfo?.refund_holder_name ||
    refundOrder.refund_holder_name ||
    payoutInfo?.customer_name ||
    refundOrder.customer_name ||
    'Not Available';

  const rawAccountNumber =
    payoutInfo?.raw_payout_bank_account ||
    payoutInfo?.payout_bank_account ||
    payoutInfo?.refund_bank_account ||
    refundOrder.refund_bank_account ||
    '';

  const accountNumber = rawAccountNumber || 'Not Available';

  const ifscCode =
    payoutInfo?.payout_ifsc_code ||
    payoutInfo?.refund_ifsc_code ||
    refundOrder.refund_ifsc_code ||
    'Not Available';

  const hasBankData =
    (holderName && holderName !== 'Not Available') ||
    (accountNumber && accountNumber !== 'Not Available') ||
    (ifscCode && ifscCode !== 'Not Available');

  // Check if form has unsaved modifications
  const hasUnsavedChanges =
    selectedStatus !== initialRef.current.status ||
    adminNote.trim() !== initialRef.current.note.trim() ||
    notifyCustomer !== initialRef.current.notify ||
    txnId.trim() !== initialRef.current.txnId.trim() ||
    refundAmountInput.trim() !== initialRef.current.amount.trim() ||
    customerReasonInput.trim() !== initialRef.current.reason.trim();

  const handleAttemptClose = () => {
    if (hasUnsavedChanges) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  // Form submission & backend persistence
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMsg(null);

    // Validation: Amount check
    const numAmount = parseFloat(refundAmountInput);
    if (isNaN(numAmount) || numAmount < 0) {
      setErrorMsg('Please enter a valid non-negative refund amount.');
      return;
    }
    if (totalOrderAmount > 0 && numAmount > totalOrderAmount * 1.5) {
      setErrorMsg(`Refund amount cannot exceed order total (₹${totalOrderAmount.toLocaleString('en-IN')}).`);
      return;
    }

    // Validation: Admin notes / rejection reason mandatory if Failed or On Hold
    if ((selectedStatus === 'Failed' || selectedStatus === 'On Hold') && !adminNote.trim()) {
      setErrorMsg(
        selectedStatus === 'Failed'
          ? 'Please provide an admin note / rejection reason before marking this refund as Failed/Rejected.'
          : 'Please provide a note explaining why this refund is being placed On Hold.'
      );
      return;
    }

    // Status transition safety check
    const currentNorm = normalizeStatus(refundOrder.refund_status);
    if (currentNorm === 'Completed' && selectedStatus === 'Requested') {
      setErrorMsg(
        'This refund has already been completed and paid. It cannot be reverted back to Requested.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        refundStatus: selectedStatus,
        adminNote: adminNote.trim() || undefined,
        txnId: txnId.trim() || undefined,
        notifyCustomer: notifyCustomer,
        refundAmount: numAmount,
        customerReason: customerReasonInput.trim() || undefined
      };

      const response = await apiClient(`/api/admin/refund/${refundOrder.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      const updated = response?.data || response;
      if (onSuccess) {
        onSuccess(
          updated || {
            ...refundOrder,
            refund_status: selectedStatus,
            refund_eligible_amount: numAmount,
            refund_admin_note: adminNote.trim(),
            refund_txn_id: txnId.trim() || refundOrder.refund_txn_id,
            cancel_reason: customerReasonInput.trim() || refundOrder.cancel_reason
          }
        );
      }
      onClose();
    } catch (err) {
      console.error('[UpdateRefundModal] Save failed:', err);
      setErrorMsg(err.message || 'Unable to update refund details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/60 backdrop-blur-xs animate-fadeIn font-admin text-brand-dark"
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-refund-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) {
          handleAttemptClose();
        }
      }}
    >
      <div
        className="bg-white rounded-2xl max-w-[900px] w-[calc(100%-32px)] shadow-2xl border border-neutral-200/90 relative max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================================= */}
        {/* FIXED HEADER                                                              */}
        {/* ========================================================================= */}
        <div className="px-6 py-4.5 sm:px-7 sm:py-5 border-b border-neutral-100 flex items-start justify-between bg-white shrink-0">
          <div className="flex items-start gap-3.5 min-w-0 pr-4">
            <div className="w-10 h-10 rounded-xl bg-brand-dark text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <RotateCcw className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  id="update-refund-modal-title"
                  className="text-lg sm:text-xl font-admin font-bold text-brand-dark tracking-tight leading-tight truncate"
                >
                  Update Order #{orderNumber}
                </h3>
                <button
                  type="button"
                  onClick={() => handleCopy('header_order', orderNumber)}
                  className="p-1 text-neutral-400 hover:text-brand-dark hover:bg-neutral-100 rounded-md transition-colors cursor-pointer shrink-0"
                  title="Copy Order #"
                  aria-label="Copy Order #"
                >
                  {copiedKey === 'header_order' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <p className="text-xs sm:text-[13px] text-neutral-500 font-sans mt-0.5 leading-snug">
                Review details and update refund status. Ensure bank info is verified before completing.
              </p>
            </div>
          </div>

          {/* Close (X) Icon */}
          <button
            type="button"
            onClick={handleAttemptClose}
            disabled={submitting}
            className="p-1.5 text-neutral-400 hover:text-brand-dark hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-dark shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SCROLLABLE CONTENT AREA                                                   */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-7 sm:py-6 space-y-5 bg-white font-sans text-xs">
          
          {/* Unsaved Changes Confirmation Banner */}
          {showDiscardConfirm && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-2.5 animate-fadeIn shrink-0">
              <div className="flex items-center gap-2 text-amber-900 font-semibold font-admin">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>You have unsaved changes. Are you sure you want to discard them?</span>
              </div>
              <div className="flex items-center gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowDiscardConfirm(false)}
                  className="px-3.5 py-1.5 bg-white border border-amber-300 text-amber-900 rounded-lg font-semibold hover:bg-amber-100/50 cursor-pointer font-admin transition-colors"
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 cursor-pointer font-admin transition-colors"
                >
                  Discard Changes
                </button>
              </div>
            </div>
          )}

          {/* Error Alert Message */}
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5 shrink-0 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-sans leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* SECTION 1 — REFUND SUMMARY (Amount Editable)                            */}
          {/* ======================================================================= */}
          <div className="bg-[#FBFBFA] border border-neutral-200/80 rounded-xl p-4 sm:p-5 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* Left Column: Editable Amount To Refund */}
              <div className="space-y-1.5">
                <label
                  htmlFor="refund-amount-input"
                  className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider font-admin block"
                >
                  AMOUNT TO REFUND
                </label>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="relative inline-flex items-center">
                    <span className="absolute left-3 text-brand-dark font-bold font-admin text-base sm:text-lg pointer-events-none">
                      ₹
                    </span>
                    <input
                      id="refund-amount-input"
                      type="number"
                      step="0.01"
                      min="0"
                      max={totalOrderAmount > 0 ? totalOrderAmount * 2 : 999999}
                      value={refundAmountInput}
                      onChange={(e) => setRefundAmountInput(e.target.value)}
                      className="pl-7 pr-3 py-1.5 bg-white border border-neutral-200 rounded-xl text-base sm:text-lg font-bold font-admin text-brand-dark w-36 sm:w-44 focus:outline-none focus:ring-1 focus:ring-brand-dark shadow-2xs transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  {isPartial ? (
                    <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-50 text-amber-700 border border-amber-200 font-admin">
                      PARTIAL REFUND
                    </span>
                  ) : (
                    <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-neutral-100 text-neutral-700 border border-neutral-200 font-admin">
                      FULL REFUND
                    </span>
                  )}
                </div>
              </div>

              {/* Right Column: Original Method (Read-Only with Copy) */}
              <div className="sm:text-right space-y-1.5">
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider font-admin block sm:text-right">
                  ORIGINAL METHOD
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('orig_method', paymentMethod)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-neutral-50 border border-neutral-200/90 rounded-lg text-xs font-semibold text-brand-dark shadow-2xs font-admin cursor-pointer transition-colors"
                  title="Click to copy Original Method"
                >
                  {renderPaymentIcon(paymentMethod)}
                  <span>{paymentMethod}</span>
                  {copiedKey === 'orig_method' ? (
                    <Check className="w-3 h-3 text-emerald-600 ml-0.5" />
                  ) : (
                    <Copy className="w-3 h-3 text-neutral-400 opacity-60 ml-0.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* SECTION 2 — RETURN REQUEST DETAILS & ITEMS REQUESTED                    */}
          {/* ======================================================================= */}
          <div className="bg-[#FBFBFA] border border-neutral-200/80 rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
            {/* Header: RETURN REQUEST DETAILS */}
            <div className="text-xs font-semibold text-brand-dark uppercase tracking-wider font-admin border-b border-neutral-200/60 pb-2.5 flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
              <span>RETURN REQUEST DETAILS</span>
            </div>

            {/* Metadata Grid: Request Type (Read-Only) | Requested On (Read-Only) | Customer Reason (Editable) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs items-start">
              {/* Request Type (Read-Only with Copy) */}
              <div>
                <span className="text-neutral-400 text-[10px] font-semibold uppercase tracking-wider font-admin block mb-1">
                  REQUEST TYPE
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('req_type', requestType)}
                  className="font-semibold text-brand-dark text-xs font-admin py-1 inline-flex items-center gap-1.5 hover:underline cursor-pointer"
                  title="Click to copy Request Type"
                >
                  <span>{requestType}</span>
                  {copiedKey === 'req_type' ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3 text-neutral-400 opacity-60 hover:opacity-100" />
                  )}
                </button>
              </div>

              {/* Requested On (Read-Only with Copy) */}
              <div>
                <span className="text-neutral-400 text-[10px] font-semibold uppercase tracking-wider font-admin block mb-1">
                  REQUESTED ON
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('req_on', formatDateTime(requestDate))}
                  className="text-neutral-700 text-xs py-1 font-sans inline-flex items-center gap-1.5 hover:underline cursor-pointer"
                  title="Click to copy Requested Date & Time"
                >
                  <span>{formatDateTime(requestDate)}</span>
                  {copiedKey === 'req_on' ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3 text-neutral-400 opacity-60 hover:opacity-100" />
                  )}
                </button>
              </div>

              {/* Customer Reason (Editable) */}
              <div>
                <label
                  htmlFor="customer-reason-input"
                  className="text-neutral-400 text-[10px] font-semibold uppercase tracking-wider font-admin block mb-1"
                >
                  CUSTOMER REASON
                </label>
                <input
                  id="customer-reason-input"
                  type="text"
                  value={customerReasonInput}
                  onChange={(e) => setCustomerReasonInput(e.target.value)}
                  placeholder="Reason for return/refund"
                  className="w-full bg-white border border-neutral-200/90 rounded-lg px-2.5 py-1.5 text-xs text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark shadow-2xs font-sans transition-all"
                />
              </div>
            </div>

            {/* Nested Section: ITEMS REQUESTED (Read-Only) */}
            <div className="border border-neutral-200/80 rounded-xl overflow-hidden bg-white shadow-2xs mt-3">
              <div className="px-4 py-2.5 bg-neutral-50/90 border-b border-neutral-200/80 text-xs font-semibold text-brand-dark uppercase tracking-wider font-admin flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-neutral-500" />
                  <span>ITEMS REQUESTED {itemsList.length > 0 ? `(${itemsList.length})` : ''}</span>
                </div>
                {loadingItems && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-400 font-sans font-normal">
                    <Loader2 className="w-3 h-3 animate-spin" /> Loading items...
                  </span>
                )}
              </div>

              <div className="divide-y divide-neutral-200/60 max-h-60 overflow-y-auto">
                {loadingItems ? (
                  <div className="p-4 space-y-3 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-neutral-200 rounded-lg shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3.5 bg-neutral-200 rounded w-3/4" />
                        <div className="h-3 bg-neutral-200 rounded w-1/3" />
                      </div>
                    </div>
                  </div>
                ) : itemsList.length > 0 ? (
                  itemsList.map((item, idx) => {
                    const rawImg =
                      item.image ||
                      item.image_url ||
                      (Array.isArray(item.images) ? item.images[0] : item.images) ||
                      item.category_image;
                    const imgUrl = rawImg ? getSupabaseMediaUrl(rawImg) : '';
                    const unitPrice = parseFloat(item.price) || 0;
                    const qty = parseInt(item.quantity, 10) || 1;
                    const itemTotal = unitPrice * qty;
                    const itemReceivedState = getItemReceivedStatus(item, refundOrder);

                    return (
                      <div
                        key={item.id || idx}
                        className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-neutral-50/50 transition-colors"
                      >
                        {/* Left: Product Thumbnail + Title + Qty/Price (Read-Only) */}
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div className="w-12 h-12 rounded-lg border border-neutral-200 bg-neutral-50 overflow-hidden shrink-0 flex items-center justify-center">
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
                            <h4 className="font-admin font-bold text-brand-dark text-xs sm:text-[13px] truncate">
                              {item.name || item.title || `Product #${item.product_id || idx + 1}`}
                            </h4>
                            <p className="text-[11px] text-neutral-500 mt-0.5">
                              Qty: <strong className="text-brand-dark font-semibold">{qty}</strong>{' '}
                              × ₹{unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>

                        {/* Right: Item Total + Return Status Badge (Read-Only) */}
                        <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 shrink-0">
                          <span className="font-admin font-bold text-brand-dark text-xs sm:text-[13px]">
                            ₹{itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-neutral-100 text-neutral-700 border border-neutral-200 font-admin">
                            {itemReceivedState}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-neutral-400 italic text-xs space-y-1">
                    <Package className="w-6 h-6 text-neutral-300 mx-auto mb-1" />
                    <p className="font-semibold text-neutral-600 not-italic">No Products Requested</p>
                    <p className="text-[11px]">No line items found for this refund record.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* SECTION 3 — PAYOUT DETAILS (Read-Only with Copy Options)                */}
          {/* ======================================================================= */}
          <div className="bg-[#FBFBFA] border border-neutral-200/80 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3.5">
            {/* Payout Header Bar: Title + Order Reference + Method + Date + Verify Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200/60 pb-2.5">
              <div className="flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-neutral-500" />
                <span className="text-xs font-semibold text-brand-dark uppercase tracking-wider font-admin">
                  PAYOUT DETAILS
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs">
                {/* 1. Order Number (Click to copy) */}
                <button
                  type="button"
                  onClick={() => handleCopy('order_ref', orderNumber)}
                  className="font-admin font-bold text-brand-dark hover:text-black hover:underline cursor-pointer inline-flex items-center gap-1 focus-visible:outline-none py-0.5 px-1 rounded hover:bg-neutral-100 transition-colors"
                  title="Click to copy Order #"
                >
                  <span>#{orderNumber}</span>
                  {copiedKey === 'order_ref' ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3 text-neutral-400 opacity-60 hover:opacity-100" />
                  )}
                </button>

                <span className="text-neutral-300">•</span>

                {/* 2. Payment Method (Click to copy) */}
                <button
                  type="button"
                  onClick={() => handleCopy('pay_method', paymentMethod)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 font-semibold text-[10px] uppercase font-admin cursor-pointer transition-colors"
                  title="Click to copy Payment Method"
                >
                  <span>{paymentMethod}</span>
                  {copiedKey === 'pay_method' ? (
                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-2.5 h-2.5 text-neutral-400 opacity-60" />
                  )}
                </button>

                <span className="text-neutral-300">•</span>

                {/* 3. Request Date (Click to copy) */}
                <button
                  type="button"
                  onClick={() => handleCopy('req_date', formatDateOnly(requestDate))}
                  className="text-neutral-500 hover:text-brand-dark text-[11px] cursor-pointer inline-flex items-center gap-1 py-0.5 px-1 rounded hover:bg-neutral-100 transition-colors"
                  title="Click to copy Date"
                >
                  <span>{formatDateOnly(requestDate)}</span>
                  {copiedKey === 'req_date' ? (
                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-2.5 h-2.5 text-neutral-400 opacity-60 hover:opacity-100" />
                  )}
                </button>

                {hasBankData && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold font-admin">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>VERIFIED</span>
                  </span>
                )}
              </div>
            </div>

            {/* Payout Data Grid: Account Holder / Acc No / IFSC (All Cards Always Copyable with Visible Copy Button) */}
            {loadingPayout ? (
              <div className="py-4 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading payout details...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* 1. Account Holder (Always Copyable with Button) */}
                <div
                  onClick={() => handleCopy('holder', holderName)}
                  className={`bg-white border rounded-lg p-3 shadow-2xs flex items-center justify-between gap-2 transition-all cursor-pointer select-none ${
                    copiedKey === 'holder'
                      ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/20'
                      : 'border-neutral-200/80 hover:border-neutral-300 hover:bg-neutral-50/50'
                  }`}
                  title="Click to copy Account Holder"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider font-admin block leading-tight">
                        ACCOUNT HOLDER
                      </span>
                      {copiedKey === 'holder' && (
                        <span className="text-[9px] font-bold text-emerald-600 uppercase font-admin tracking-wider animate-fadeIn">
                          • COPIED
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-brand-dark font-admin truncate block">
                      {holderName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy('holder', holderName);
                    }}
                    className="p-1.5 text-neutral-400 hover:text-brand-dark hover:bg-neutral-100 rounded-md transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-dark"
                    title="Copy Account Holder"
                    aria-label="Copy Account Holder"
                  >
                    {copiedKey === 'holder' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* 2. Account Number (Always Copyable with Button) */}
                <div
                  onClick={() => handleCopy('acc', rawAccountNumber || accountNumber)}
                  className={`bg-white border rounded-lg p-3 shadow-2xs flex items-center justify-between gap-2 transition-all cursor-pointer select-none ${
                    copiedKey === 'acc'
                      ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/20'
                      : 'border-neutral-200/80 hover:border-neutral-300 hover:bg-neutral-50/50'
                  }`}
                  title="Click to copy Account Number"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider font-admin block leading-tight">
                        ACC NO.
                      </span>
                      {copiedKey === 'acc' && (
                        <span className="text-[9px] font-bold text-emerald-600 uppercase font-admin tracking-wider animate-fadeIn">
                          • COPIED
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-brand-dark font-mono tracking-wider truncate block">
                      {accountNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy('acc', rawAccountNumber || accountNumber);
                    }}
                    className="p-1.5 text-neutral-400 hover:text-brand-dark hover:bg-neutral-100 rounded-md transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-dark"
                    title="Copy Account Number"
                    aria-label="Copy Account Number"
                  >
                    {copiedKey === 'acc' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* 3. IFSC Code (Always Copyable with Button) */}
                <div
                  onClick={() => handleCopy('ifsc', ifscCode)}
                  className={`bg-white border rounded-lg p-3 shadow-2xs flex items-center justify-between gap-2 transition-all cursor-pointer select-none ${
                    copiedKey === 'ifsc'
                      ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/20'
                      : 'border-neutral-200/80 hover:border-neutral-300 hover:bg-neutral-50/50'
                  }`}
                  title="Click to copy IFSC Code"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider font-admin block leading-tight">
                        IFSC
                      </span>
                      {copiedKey === 'ifsc' && (
                        <span className="text-[9px] font-bold text-emerald-600 uppercase font-admin tracking-wider animate-fadeIn">
                          • COPIED
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-brand-dark font-mono uppercase tracking-wider truncate block">
                      {ifscCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy('ifsc', ifscCode);
                    }}
                    className="p-1.5 text-neutral-400 hover:text-brand-dark hover:bg-neutral-100 rounded-md transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-dark"
                    title="Copy IFSC Code"
                    aria-label="Copy IFSC Code"
                  >
                    {copiedKey === 'ifsc' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================================= */}
          {/* SECTION 4 — REFUND STAGE (Editable Dropdown)                            */}
          {/* ======================================================================= */}
          <div className="space-y-1.5">
            <label
              htmlFor="refund-stage-select"
              className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider font-admin"
            >
              REFUND STAGE
            </label>
            <div className="relative">
              <select
                id="refund-stage-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-brand-dark font-medium focus:outline-none focus:ring-1 focus:ring-brand-dark focus:bg-white transition-all cursor-pointer appearance-none font-admin shadow-2xs"
              >
                {REFUND_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    ● {opt.label} — {opt.description}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* ======================================================================= */}
          {/* SECTION 5 — ADMIN NOTES / REJECTION REASON (Editable Textarea)          */}
          {/* ======================================================================= */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="admin-notes-textarea"
                className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider font-admin"
              >
                ADMIN NOTES / REJECTION REASON
              </label>
              {(selectedStatus === 'Failed' || selectedStatus === 'On Hold') && (
                <span className="text-[10px] text-rose-700 font-semibold font-admin">
                  * Required for {selectedStatus}
                </span>
              )}
            </div>
            <textarea
              id="admin-notes-textarea"
              rows={3}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Details about this refund decision..."
              className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-brand-dark placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-brand-dark focus:bg-white transition-all resize-none font-sans shadow-2xs"
            />
          </div>

          {/* Optional Txn Reference (shown if completed/processing) */}
          {(selectedStatus === 'Completed' || selectedStatus === 'Processing') && (
            <div className="space-y-1.5 animate-fadeIn">
              <label
                htmlFor="txn-id-input"
                className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider font-admin"
              >
                PAYOUT REFERENCE / UTR NUMBER (OPTIONAL)
              </label>
              <input
                id="txn-id-input"
                type="text"
                value={txnId}
                onChange={(e) => setTxnId(e.target.value)}
                placeholder="e.g. UTR12345678 or Razorpay Refund ID"
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-brand-dark font-mono placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-brand-dark focus:bg-white transition-all shadow-2xs"
              />
            </div>
          )}

          {/* ======================================================================= */}
          {/* SECTION 6 — NOTIFY CUSTOMER (Editable Checkbox)                         */}
          {/* ======================================================================= */}
          <div className="p-3.5 bg-[#FBFBFA] border border-neutral-200/80 rounded-xl flex items-start gap-3">
            <input
              type="checkbox"
              id="notify-customer-checkbox"
              checked={notifyCustomer}
              onChange={(e) => setNotifyCustomer(e.target.checked)}
              className="mt-0.5 rounded border-neutral-300 text-brand-dark focus:ring-brand-dark cursor-pointer"
            />
            <label htmlFor="notify-customer-checkbox" className="text-xs select-none cursor-pointer">
              <span className="font-semibold text-brand-dark block font-admin">
                NOTIFY CUSTOMER
              </span>
              <span className="text-neutral-500 text-[11px] block mt-0.5 font-sans">
                Send automated refund receipt and status update.
              </span>
            </label>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* FIXED FOOTER (Single Cancel & Save Changes)                               */}
        {/* ========================================================================= */}
        <div className="px-6 py-4 sm:px-7 border-t border-neutral-200/80 bg-white sm:bg-neutral-50/60 flex items-center justify-end gap-3 shrink-0">
          {/* 1. Cancel Button */}
          <button
            type="button"
            onClick={handleAttemptClose}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-[13px] font-semibold text-neutral-700 bg-white hover:bg-neutral-100 hover:text-brand-dark border border-neutral-200 hover:border-neutral-300 transition-all duration-150 cursor-pointer disabled:opacity-50 font-admin shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-dark"
          >
            Cancel
          </button>

          {/* 2. Save Changes Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-[13px] font-semibold uppercase tracking-wider text-white bg-brand-dark hover:bg-black active:scale-[0.99] transition-all duration-150 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed font-admin min-w-[140px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateRefundModal;
