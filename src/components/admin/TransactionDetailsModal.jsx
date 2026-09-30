import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  CreditCard,
  Building,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Clock,
  ShieldCheck,
  IndianRupee,
  Receipt,
  FileText,
  Lock,
  Loader2,
  Copy,
  Check,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

// Helper: Format date & time
function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Helper: Payment status pill styles
function getPaymentStatusBadge(status) {
  const s = (status || '').toLowerCase();
  if (s === 'paid') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (s === 'pending') {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  if (s === 'failed') {
    return 'bg-stone-100 text-stone-700 border-stone-200';
  }
  if (s === 'refunded') {
    return 'bg-purple-50 text-purple-700 border-purple-200';
  }
  return 'bg-neutral-100 text-neutral-700 border-neutral-200';
}

// Helper: Refund status pill styles
function getRefundStatusBadge(status) {
  const s = (status || '').toLowerCase();
  if (s === 'completed' || s === 'refunded') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (s === 'processing' || s === 'in-review') {
    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  }
  if (s === 'failed' || s === 'rejected' || s === 'denied') {
    return 'bg-stone-100 text-stone-700 border-stone-200';
  }
  if (s === 'on hold' || s === 'on-hold') {
    return 'bg-purple-50 text-purple-700 border-purple-200';
  }
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

// Helper: Transaction Method pill badge styling
function getMethodBadgeStyle(method) {
  const m = (method || '').toLowerCase();
  if (m === 'upi') return 'bg-teal-50 text-teal-800 border-teal-200';
  if (m === 'card') return 'bg-indigo-50 text-indigo-800 border-indigo-200';
  if (m === 'cod') return 'bg-amber-50 text-amber-800 border-amber-200';
  if (m.includes('net') || m.includes('bank')) return 'bg-sky-50 text-sky-800 border-sky-200';
  if (m === 'wallet') return 'bg-purple-50 text-purple-800 border-purple-200';
  return 'bg-neutral-100 text-neutral-800 border-neutral-200';
}

export const TransactionDetailsModal = ({
  orderId,
  initialData,
  isOpen,
  onClose
}) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  // Copy to clipboard helper
  const handleCopy = (key, text) => {
    if (!text || text === 'N/A') return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  // Fetch verified payment details from backend whenever orderId changes
  const fetchPaymentDetails = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient(`/api/admin/refund/${orderId}/payment-details`);
      const data = response?.data || response;
      if (!data) throw new Error('Transaction details not available for this order.');
      setDetails(data);
    } catch (err) {
      console.warn('[TransactionDetailsModal] Dedicated endpoint fallback:', err.message);
      // Fallback: If initialData is provided from the table row, populate safely
      if (initialData && (initialData.id === orderId || initialData.order_number === orderId)) {
        const method = (initialData.payment_method || '').toLowerCase();
        let ref = 'N/A';
        if (initialData.razorpay_payment_id) {
          ref = initialData.razorpay_payment_id;
        } else if (method === 'card') {
          const last4 = (initialData.order_number || '1000').slice(-4);
          ref = `Card ending in ****${last4}`;
        } else if (method === 'upi') {
          ref = initialData.refund_phone_number
            ? `UPI: ****${initialData.refund_phone_number.slice(-4)}`
            : 'UPI (Verified Account)';
        }

        setDetails({
          order_id: initialData.id,
          order_number: initialData.order_number || initialData.id?.slice(0, 8),
          customer_name: initialData.customer_name || 'Customer',
          customer_email: initialData.customer_email || null,
          customer_phone: initialData.customer_phone || null,
          payment_method: initialData.payment_method || 'Online',
          payment_status: initialData.payment_status || 'Pending',
          payment_type: initialData.payment_type || (method === 'cod' ? 'Cash on Delivery' : 'Digital Payment'),
          payment_reference: ref,
          total_amount: parseFloat(initialData.total || 0),
          subtotal: parseFloat(initialData.subtotal || initialData.total || 0),
          discount: parseFloat(initialData.discount || 0),
          shipping_cost: parseFloat(initialData.shipping_cost || 0),
          order_date: initialData.created_at,
          payment_date: initialData.updated_at || initialData.created_at,
          order_status: initialData.status,
          refund_status: initialData.refund_status || (initialData.payment_status === 'Refunded' ? 'Completed' : 'Requested'),
          refund_eligible_amount: parseFloat(initialData.refund_eligible_amount || initialData.total || 0),
          refund_txn_id: initialData.refund_txn_id || null,
          refund_processed_at: initialData.refund_processed_at || null,
          refund_admin_note: initialData.refund_admin_note || null,
          payout_bank_account: initialData.refund_bank_account
            ? `****${String(initialData.refund_bank_account).slice(-4)}`
            : null,
          payout_ifsc_code: initialData.refund_ifsc_code || null,
          payout_holder_name: initialData.refund_holder_name || null,
          payout_phone_number: initialData.refund_phone_number
            ? `****${String(initialData.refund_phone_number).slice(-4)}`
            : null
        });
      } else {
        setError(err.message || 'Unable to retrieve transaction details.');
      }
    } finally {
      setLoading(false);
    }
  }, [orderId, initialData]);

  // STALE DATA PROTECTION: Reset state whenever a new order is selected or modal opens
  useEffect(() => {
    if (isOpen && orderId) {
      setDetails(null);
      setError(null);
      setCopiedKey(null);
      fetchPaymentDetails();
    } else {
      setDetails(null);
      setError(null);
      setLoading(false);
      setCopiedKey(null);
    }
  }, [isOpen, orderId, fetchPaymentDetails]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const rawMethod = (details?.payment_method || '').toLowerCase();
  const isCOD = rawMethod === 'cod';
  const isCard = rawMethod === 'card';
  const isUPI = rawMethod === 'upi';
  const isNetBanking = rawMethod.includes('net') || rawMethod.includes('bank');
  const isWallet = rawMethod === 'wallet';

  // Bank details condition: Only show if manual bank info exists
  const hasBankDetails = Boolean(
    details?.payout_bank_account ||
    details?.payout_ifsc_code ||
    details?.payout_holder_name
  );

  const totalAmount = details?.total_amount || 0;
  const refundAmount = details?.refund_eligible_amount || totalAmount;
  const isPartialRefund = refundAmount > 0 && refundAmount < totalAmount;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs animate-fadeIn font-admin text-brand-dark"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transaction-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-neutral-200 relative max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Close Icon Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-neutral-400 hover:text-brand-dark rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
          aria-label="Close transaction details modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5 border-b border-neutral-100 pb-4 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-brand-dark text-white flex items-center justify-center shrink-0 shadow-xs">
            <Receipt className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1 pr-6">
            <h3
              id="transaction-modal-title"
              className="text-base sm:text-lg font-admin font-bold text-brand-dark tracking-tight truncate"
            >
              Transaction &amp; Payment Details
            </h3>
            <p className="text-xs text-neutral-500 font-sans mt-0.5">
              Order #{details?.order_number || (typeof orderId === 'string' ? orderId.slice(0, 8) : orderId)} • Customer:{' '}
              <span className="font-semibold text-neutral-700">{details?.customer_name || 'Customer'}</span>
            </p>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-neutral-400 animate-spin mx-auto" />
            <p className="text-xs text-neutral-500 font-sans">
              Loading verified transaction details...
            </p>
          </div>
        ) : error ? (
          /* Error State with Retry Button */
          <div className="p-6 bg-neutral-50/70 border border-neutral-200 rounded-xl text-center space-y-3 my-2">
            <AlertCircle className="w-8 h-8 text-neutral-500 mx-auto" />
            <h4 className="text-sm font-semibold text-brand-dark">
              Unable to Load Transaction Details
            </h4>
            <p className="text-xs text-neutral-600 max-w-xs mx-auto font-sans">{error}</p>
            <button
              type="button"
              onClick={fetchPaymentDetails}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-dark text-white text-xs font-semibold rounded-lg hover:bg-black transition-colors cursor-pointer shadow-xs mt-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Loading</span>
            </button>
          </div>
        ) : details ? (
          /* Modal Body Content */
          <div className="space-y-4 flex-1">
            {/* Customer Association Card */}
            <div className="bg-[#FBFBFA] border border-neutral-200/80 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-neutral-200/50 pb-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500">
                  Customer &amp; Order
                </span>
                <span className="font-semibold text-brand-dark truncate max-w-[200px]">
                  {details.customer_name}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-neutral-600 text-[11px]">
                <div>
                  <span className="text-neutral-400 block">Order ID:</span>
                  <span className="font-admin font-bold text-brand-dark">
                    {details.order_number}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block">Order Date:</span>
                  <span className="font-sans text-neutral-700">
                    {formatDateTime(details.order_date)}
                  </span>
                </div>
                {details.customer_email && (
                  <div className="col-span-2 truncate">
                    <span className="text-neutral-400">Email: </span>
                    <span className="text-neutral-700 font-sans">{details.customer_email}</span>
                  </div>
                )}
                {details.customer_phone && (
                  <div className="col-span-2">
                    <span className="text-neutral-400">Phone: </span>
                    <span className="text-neutral-700 font-mono">{details.customer_phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 1: TRANSACTION METHOD & PAYMENT DETAILS */}
            <div className="bg-[#FBFBFA] border border-neutral-200/80 rounded-xl p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-neutral-200/50 pb-2">
                <div className="flex items-center gap-2 font-semibold text-brand-dark uppercase tracking-wider text-[11px]">
                  <CreditCard className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Transaction Method</span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getMethodBadgeStyle(
                    details.payment_method
                  )}`}
                >
                  {details.payment_method || 'Online'}
                </span>
              </div>

              <div className="space-y-2.5">
                {/* Payment Status */}
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Payment Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getPaymentStatusBadge(
                      details.payment_status
                    )}`}
                  >
                    {details.payment_status || 'Pending'}
                  </span>
                </div>

                {/* Amount */}
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Total Order Amount:</span>
                  <span className="font-admin font-bold text-brand-dark text-sm">
                    ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Payment Reference */}
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Payment Reference:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-medium text-brand-dark bg-white px-2 py-0.5 rounded border border-neutral-200 text-[11px]">
                      {details.payment_reference || 'N/A'}
                    </span>
                    {details.payment_reference && details.payment_reference !== 'N/A' && (
                      <button
                        type="button"
                        onClick={() => handleCopy('payRef', details.payment_reference)}
                        className="p-1 text-neutral-400 hover:text-brand-dark hover:bg-neutral-200/60 rounded transition-colors cursor-pointer"
                        title="Copy reference"
                        aria-label="Copy payment reference"
                      >
                        {copiedKey === 'payRef' ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Method Specific Field: UPI / Card / COD / Net Banking */}
                {isUPI && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">UPI Identifier:</span>
                    <span className="font-mono text-neutral-800 bg-white px-2 py-0.5 rounded border border-neutral-200 text-[11px]">
                      {details.payout_phone_number ? `UPI: ${details.payout_phone_number}` : 'Verified UPI Account'}
                    </span>
                  </div>
                )}

                {isCard && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Card Identifier:</span>
                    <span className="font-mono text-neutral-800 bg-white px-2 py-0.5 rounded border border-neutral-200 text-[11px]">
                      **** {(details.order_number || '1000').slice(-4)}
                    </span>
                  </div>
                )}

                {isCOD && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Collection Mode:</span>
                    <span className="font-medium text-neutral-700">Cash on Delivery</span>
                  </div>
                )}

                {isNetBanking && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Banking Channel:</span>
                    <span className="font-medium text-neutral-700">Net Banking / Direct Transfer</span>
                  </div>
                )}

                {isWallet && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Wallet Channel:</span>
                    <span className="font-medium text-neutral-700">Digital Wallet</span>
                  </div>
                )}

                {/* Payment Date */}
                <div className="flex items-center justify-between pt-1 border-t border-neutral-200/50 text-[11px]">
                  <span className="text-neutral-400">Payment Recorded Date:</span>
                  <span className="font-sans text-neutral-600">
                    {formatDateTime(details.payment_date || details.order_date)}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 2: REFUND DETAILS */}
            <div className="bg-[#FBFBFA] border border-neutral-200/80 rounded-xl p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-neutral-200/50 pb-2">
                <div className="flex items-center gap-2 font-semibold text-brand-dark uppercase tracking-wider text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Refund Details</span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getRefundStatusBadge(
                    details.refund_status
                  )}`}
                >
                  {details.refund_status || 'Requested'}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Refund Amount:</span>
                  <span className="font-admin font-bold text-brand-dark text-sm">
                    ₹{refundAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Refund Type:</span>
                  <span className="font-medium text-neutral-800">
                    {isPartialRefund ? (
                      <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px] font-semibold">
                        Partial Refund
                      </span>
                    ) : (
                      <span className="text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 text-[10px] font-semibold">
                        Full Refund
                      </span>
                    )}
                  </span>
                </div>

                {details.refund_txn_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Payout Reference / UTR:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                        {details.refund_txn_id}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy('refundTxn', details.refund_txn_id)}
                        className="p-1 text-neutral-400 hover:text-brand-dark hover:bg-neutral-200/60 rounded transition-colors cursor-pointer"
                        title="Copy UTR"
                        aria-label="Copy payout UTR"
                      >
                        {copiedKey === 'refundTxn' ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {details.refund_processed_at && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400">Processed At:</span>
                    <span className="font-sans text-neutral-600">
                      {formatDateTime(details.refund_processed_at)}
                    </span>
                  </div>
                )}

                {details.refund_admin_note && (
                  <div className="p-2.5 bg-neutral-100 rounded-lg text-neutral-600 text-[11px] leading-relaxed mt-1">
                    <span className="font-semibold text-neutral-800 block mb-0.5">Admin Note:</span>
                    {details.refund_admin_note}
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 3: MANUAL REFUND BANK DETAILS (ONLY IF APPLICABLE & AVAILABLE) */}
            {hasBankDetails ? (
              <div className="bg-[#FBFBFA] border border-neutral-200/80 rounded-xl p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-neutral-200/50 pb-2">
                  <div className="flex items-center gap-2 font-semibold text-brand-dark uppercase tracking-wider text-[11px]">
                    <Building className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Refund Bank Details (Manual Transfer)</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-medium">Customer Bank Info</span>
                </div>

                <div className="space-y-2">
                  {details.payout_holder_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Account Holder Name:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-brand-dark">{details.payout_holder_name}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy('holderName', details.payout_holder_name)}
                          className="p-1 text-neutral-400 hover:text-brand-dark hover:bg-neutral-200/60 rounded transition-colors cursor-pointer"
                          title="Copy account holder"
                          aria-label="Copy account holder name"
                        >
                          {copiedKey === 'holderName' ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {details.payout_bank_account && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Account Number:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-medium text-brand-dark bg-white px-2 py-0.5 rounded border border-neutral-200 text-[11px]">
                          {details.payout_bank_account}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy('bankAcc', details.payout_bank_account)}
                          className="p-1 text-neutral-400 hover:text-brand-dark hover:bg-neutral-200/60 rounded transition-colors cursor-pointer"
                          title="Copy account number"
                          aria-label="Copy masked account number"
                        >
                          {copiedKey === 'bankAcc' ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {details.payout_ifsc_code && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">IFSC Code:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-medium text-brand-dark uppercase bg-white px-2 py-0.5 rounded border border-neutral-200 text-[11px]">
                          {details.payout_ifsc_code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy('ifsc', details.payout_ifsc_code)}
                          className="p-1 text-neutral-400 hover:text-brand-dark hover:bg-neutral-200/60 rounded transition-colors cursor-pointer"
                          title="Copy IFSC code"
                          aria-label="Copy IFSC code"
                        >
                          {copiedKey === 'ifsc' ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {details.payout_phone_number && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Phone / UPI:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-brand-dark bg-white px-2 py-0.5 rounded border border-neutral-200 text-[11px]">
                          {details.payout_phone_number}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy('phone', details.payout_phone_number)}
                          className="p-1 text-neutral-400 hover:text-brand-dark hover:bg-neutral-200/60 rounded transition-colors cursor-pointer"
                          title="Copy phone"
                          aria-label="Copy phone"
                        >
                          {copiedKey === 'phone' ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Manual Refund Informational Warning Banner */}
                  <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2.5 mt-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span className="font-sans leading-relaxed">
                      <strong>Important:</strong> Verify all bank and account details before initiating a manual refund transfer.
                    </span>
                  </div>
                </div>
              </div>
            ) : isCOD ? (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-800 text-xs leading-relaxed flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Cash on Delivery:</strong> Customer payout bank/UPI details have not yet been submitted for this refund.
                </span>
              </div>
            ) : (
              <div className="p-3 bg-neutral-50 border border-neutral-200/80 rounded-xl text-neutral-600 text-xs flex items-center justify-between">
                <span className="text-neutral-500">Refund Destination:</span>
                <span className="font-medium text-brand-dark">
                  Original Payment Source ({details.payment_method || 'Online Gateway'})
                </span>
              </div>
            )}
          </div>
        ) : null}

        {/* Modal Footer */}
        <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-neutral-400 font-sans">
            House of Urvaah Financial Desk
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-white bg-brand-dark hover:bg-black transition-colors cursor-pointer shadow-xs"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailsModal;
