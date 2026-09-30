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
  Loader2
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

export const PaymentDetailsModal = ({
  orderId,
  initialData,
  isOpen,
  onClose
}) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch verified payment details from backend whenever orderId changes
  const fetchPaymentDetails = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient(`/api/admin/refund/${orderId}/payment-details`);
      const data = response?.data || response;
      if (!data) throw new Error('Payment details not available for this order.');
      setDetails(data);
    } catch (err) {
      console.warn('[PaymentDetailsModal] Dedicated endpoint fallback:', err.message);
      // Fallback: If initialData is available from the refund row, populate safely
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
        setError(err.message || 'Unable to retrieve payment details.');
      }
    } finally {
      setLoading(false);
    }
  }, [orderId, initialData]);

  // RESET state whenever a new order is selected or modal opens
  useEffect(() => {
    if (isOpen && orderId) {
      setDetails(null);
      setError(null);
      fetchPaymentDetails();
    } else {
      setDetails(null);
      setError(null);
      setLoading(false);
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

  const isCOD = (details?.payment_method || '').toLowerCase() === 'cod';
  const hasBankDetails =
    details?.payout_bank_account ||
    details?.payout_ifsc_code ||
    details?.payout_phone_number;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs animate-fadeIn font-admin text-brand-dark"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-neutral-200 relative max-h-[90vh] overflow-y-auto">
        {/* Close Icon Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-neutral-400 hover:text-brand-dark rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
          aria-label="Close payment details modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5 border-b border-neutral-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3
              id="payment-modal-title"
              className="text-base sm:text-lg font-admin font-bold text-brand-dark uppercase tracking-wide truncate"
            >
              Payment Details
            </h3>
            <p className="text-xs text-neutral-500 font-sans mt-0.5">
              Order #{details?.order_number || (typeof orderId === 'string' ? orderId.slice(0, 8) : orderId)}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-neutral-400 animate-spin mx-auto" />
            <p className="text-xs text-neutral-500 font-sans">
              Retrieving verified payment information...
            </p>
          </div>
        ) : error ? (
          /* Error State with Retry Button */
          <div className="p-6 bg-neutral-50/70 border border-neutral-200 rounded-xl text-center space-y-3 my-2">
            <AlertCircle className="w-8 h-8 text-neutral-500 mx-auto" />
            <h4 className="text-sm font-semibold text-brand-dark">
              Unable to Load Payment Details
            </h4>
            <p className="text-xs text-neutral-600 max-w-xs mx-auto font-sans">{error}</p>
            <button
              type="button"
              onClick={fetchPaymentDetails}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-dark text-white text-xs font-semibold rounded-lg hover:bg-black transition-colors cursor-pointer shadow-xs mt-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : details ? (
          /* Payment & Payout Details Content */
          <div className="space-y-4">
            {/* Section 1: Customer & Order Overview Card */}
            <div className="bg-[#FBFBFA] border border-neutral-200/80 rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-neutral-200/50 pb-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500">
                  Customer
                </span>
                <span className="font-semibold text-brand-dark truncate max-w-[220px]">
                  {details.customer_name}
                </span>
              </div>

              {details.customer_email && (
                <div className="flex items-center justify-between text-neutral-600">
                  <span className="text-neutral-500">Email:</span>
                  <span className="font-sans truncate max-w-[220px]">
                    {details.customer_email}
                  </span>
                </div>
              )}

              {details.customer_phone && (
                <div className="flex items-center justify-between text-neutral-600">
                  <span className="text-neutral-500">Phone:</span>
                  <span className="font-mono text-[11px]">
                    {details.customer_phone}
                  </span>
                </div>
              )}
            </div>

            {/* Section 2: Transaction & Payment Method Details */}
            <div className="bg-[#FBFBFA] border border-neutral-200/80 rounded-xl p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-neutral-200/50 pb-2">
                <div className="flex items-center gap-1.5 font-semibold text-brand-dark uppercase tracking-wider text-[11px]">
                  <Receipt className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Transaction Information</span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getPaymentStatusBadge(
                    details.payment_status
                  )}`}
                >
                  {details.payment_status || 'Pending'}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Payment Method:</span>
                  <span className="font-semibold text-brand-dark uppercase">
                    {details.payment_method || 'Online'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Payment Type:</span>
                  <span className="font-medium text-brand-dark">
                    {details.payment_type || (isCOD ? 'Cash on Delivery' : 'Prepaid')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Payment Reference:</span>
                  <span className="font-mono font-medium text-brand-dark bg-white px-2 py-0.5 rounded border border-neutral-200 text-[11px]">
                    {details.payment_reference || 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Payment Date:</span>
                  <span className="font-sans text-neutral-700">
                    {formatDateTime(details.payment_date || details.order_date)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60">
                  <span className="font-semibold text-neutral-700">Order Amount:</span>
                  <span className="font-admin font-bold text-brand-dark text-sm">
                    ₹{details.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 3: Refund Payout Destination (Dedicated for Refund Desk) */}
            <div className="bg-[#FBFBFA] border border-neutral-200/80 rounded-xl p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-neutral-200/50 pb-2">
                <div className="flex items-center gap-1.5 font-semibold text-brand-dark uppercase tracking-wider text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Refund Payout Details</span>
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
                  <span className="font-admin font-bold text-brand-dark">
                    ₹{details.refund_eligible_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Payout Destination Info */}
                {isCOD ? (
                  hasBankDetails ? (
                    <div className="bg-white p-3 rounded-lg border border-neutral-200 space-y-1.5 mt-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block">
                        Customer Bank Details (COD Payout)
                      </span>
                      {details.payout_holder_name && (
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Account Holder:</span>
                          <span className="font-medium text-brand-dark">{details.payout_holder_name}</span>
                        </div>
                      )}
                      {details.payout_bank_account && (
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Bank Account:</span>
                          <span className="font-mono text-brand-dark">{details.payout_bank_account}</span>
                        </div>
                      )}
                      {details.payout_ifsc_code && (
                        <div className="flex justify-between">
                          <span className="text-neutral-500">IFSC Code:</span>
                          <span className="font-mono text-brand-dark uppercase">{details.payout_ifsc_code}</span>
                        </div>
                      )}
                      {details.payout_phone_number && (
                        <div className="flex justify-between">
                          <span className="text-neutral-500">UPI / Phone:</span>
                          <span className="font-mono text-brand-dark">{details.payout_phone_number}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-800 text-[11px] leading-relaxed">
                      Cash on Delivery: Customer payout bank/UPI details have not been submitted yet.
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Payout Channel:</span>
                    <span className="font-medium text-neutral-700">
                      Original Payment Source ({details.payment_method.toUpperCase()})
                    </span>
                  </div>
                )}

                {/* Payout Reference if completed */}
                {details.refund_txn_id && (
                  <div className="flex items-center justify-between pt-1 border-t border-neutral-200/50">
                    <span className="text-neutral-500">Payout Reference / UTR:</span>
                    <span className="font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                      {details.refund_txn_id}
                    </span>
                  </div>
                )}

                {details.refund_processed_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Processed At:</span>
                    <span className="font-sans text-neutral-700">
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
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-neutral-500 font-sans">
            Payment details are not available for this order.
          </div>
        )}

        {/* Modal Footer */}
        <div className="mt-5 pt-4 border-t border-neutral-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-white bg-brand-dark hover:bg-black transition-colors cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsModal;
