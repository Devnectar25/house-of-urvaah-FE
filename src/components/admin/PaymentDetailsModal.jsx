import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  CreditCard,
  Building2,
  Smartphone,
  AlertCircle,
  RefreshCw,
  Check,
  Copy,
  Receipt,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

export const PaymentDetailsModal = ({
  orderId,
  initialData,
  isOpen,
  onClose
}) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  // Copy to clipboard with visual feedback
  const handleCopy = (key, text) => {
    if (!text || text === 'Not Available' || text === 'N/A' || text.includes('unavailable')) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  // Fetch verified payment details from backend
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
        
        let ref = null;
        if (initialData.razorpay_payment_id) {
          ref = initialData.razorpay_payment_id;
        } else if (initialData.refund_phone_number) {
          ref = initialData.refund_phone_number;
        }

        setDetails({
          order_id: initialData.id,
          order_number: initialData.order_number || (initialData.id ? String(initialData.id).slice(0, 8) : 'N/A'),
          customer_name: initialData.customer_name || 'Customer',
          customer_email: initialData.customer_email || null,
          customer_phone: initialData.customer_phone || null,
          payment_method: initialData.payment_method || 'Online',
          payment_status: initialData.payment_status || 'Pending',
          payment_type: initialData.payment_type || (method === 'cod' ? 'Cash on Delivery' : 'Digital Payment'),
          payment_reference: ref,
          total_amount: parseFloat(initialData.total || 0),
          refund_eligible_amount: parseFloat(initialData.refund_eligible_amount || initialData.total || 0),
          refund_txn_id: initialData.refund_txn_id || null,
          payout_bank_account: initialData.refund_bank_account
            ? (String(initialData.refund_bank_account).startsWith('*')
                ? String(initialData.refund_bank_account)
                : `******${String(initialData.refund_bank_account).slice(-4)}`)
            : null,
          raw_payout_bank_account: initialData.refund_bank_account || null,
          payout_ifsc_code: initialData.refund_ifsc_code ? String(initialData.refund_ifsc_code).toUpperCase() : null,
          payout_holder_name: initialData.refund_holder_name || null,
          payout_phone_number: initialData.refund_phone_number || null,
          razorpay_payment_id: initialData.razorpay_payment_id || null
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

  const orderNumber =
    details?.order_number ||
    (typeof orderId === 'string' ? orderId.slice(0, 8) : orderId) ||
    'N/A';

  const method = (details?.payment_method || initialData?.payment_method || 'Online').toLowerCase();
  const isUPI = method.includes('upi') || method.includes('gpay') || method.includes('phonepe') || method.includes('paytm');
  const isCard = method.includes('card') || method.includes('visa') || method.includes('master');

  // Customer / Holder Name
  const rawHolder = details?.payout_holder_name || details?.refund_holder_name || initialData?.refund_holder_name;
  const holderName = rawHolder && rawHolder.trim().length > 0
    ? rawHolder.trim()
    : details?.customer_name || initialData?.customer_name || 'Customer';

  // Bank Account Number (Real / Masked - NEVER order ID)
  const rawAcc = details?.raw_payout_bank_account || details?.payout_bank_account || details?.refund_bank_account || initialData?.refund_bank_account;
  const accountNumber = rawAcc && String(rawAcc).trim().length > 0
    ? String(rawAcc).startsWith('*')
      ? String(rawAcc)
      : `******${String(rawAcc).slice(-4)}`
    : null;
  const rawAccountToCopy = rawAcc ? String(rawAcc).trim() : null;

  // IFSC Code
  const rawIfsc = details?.payout_ifsc_code || details?.refund_ifsc_code || initialData?.refund_ifsc_code;
  const ifscCode = rawIfsc && String(rawIfsc).trim().length > 0 ? String(rawIfsc).trim().toUpperCase() : null;

  // UPI ID / Phone
  const rawUpi = details?.payout_phone_number || details?.raw_payout_phone || details?.refund_phone_number || initialData?.refund_phone_number;
  const upiId = rawUpi && String(rawUpi).trim().length > 0 ? String(rawUpi).trim() : null;

  // Razorpay / Payment Transaction Reference
  const rawPaymentRef = details?.razorpay_payment_id || details?.payment_reference || initialData?.razorpay_payment_id;
  const paymentReference = rawPaymentRef && String(rawPaymentRef).trim().length > 0 ? String(rawPaymentRef).trim() : null;

  const hasBankData = (rawHolder && rawHolder.trim().length > 0) || accountNumber || ifscCode;
  const hasUpiData = upiId !== null;
  const hasCardOrOnlineData = paymentReference !== null || isCard || isUPI;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs animate-fadeIn font-admin text-brand-dark"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-neutral-200 relative max-h-[85vh] sm:max-h-[88vh] overflow-hidden flex flex-col">
        {/* Close Icon Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-neutral-400 hover:text-brand-dark rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-dark"
          aria-label="Close payment details modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3 mb-5 border-b border-neutral-100 pb-4 shrink-0 pr-6">
          <div className="w-10 h-10 rounded-xl bg-brand-dark text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
            {isUPI ? (
              <Smartphone className="w-5 h-5 text-white" />
            ) : hasBankData ? (
              <Building2 className="w-5 h-5 text-white" />
            ) : (
              <CreditCard className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3
              id="payment-modal-title"
              className="text-base sm:text-lg font-admin font-bold text-brand-dark tracking-tight leading-tight truncate"
            >
              {hasBankData ? 'Customer Bank Details' : isUPI ? 'Customer UPI Details' : 'Customer Payment Details'}
            </h3>
            <p className="text-xs text-neutral-500 font-sans mt-1 leading-snug">
              For order <span className="font-semibold text-brand-dark font-admin">#{orderNumber}</span>
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-12 text-center space-y-3 shrink-0">
            <Loader2 className="w-8 h-8 text-neutral-400 animate-spin mx-auto" />
            <p className="text-xs text-neutral-500 font-sans">
              Retrieving customer payment details...
            </p>
          </div>
        ) : error ? (
          /* Error State with Retry Button */
          <div className="p-6 bg-neutral-50/70 border border-neutral-200 rounded-xl text-center space-y-3 my-2 shrink-0">
            <AlertCircle className="w-8 h-8 text-neutral-500 mx-auto" />
            <h4 className="text-sm font-semibold text-brand-dark">
              Unable to Load Payment Details
            </h4>
            <p className="text-xs text-neutral-600 max-w-xs mx-auto font-sans">{error}</p>
            <button
              type="button"
              onClick={fetchPaymentDetails}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 h-10 bg-neutral-950 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-black transition-colors cursor-pointer shadow-xs mt-1 font-admin"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : (
          /* Main Payment & Bank Cards */
          <div className="space-y-3 flex-1 overflow-y-auto custom-modal-scrollbar pr-1">
            {/* 1. BANK DETAILS (If bank data is present or manual refund) */}
            {hasBankData ? (
              <>
                {/* Account Holder Name */}
                <div className="bg-[#FBFBFA] border border-neutral-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider font-admin block leading-tight mb-1">
                      ACCOUNT HOLDER NAME
                    </span>
                    <span className="text-xs sm:text-[13px] font-bold text-brand-dark font-admin truncate block">
                      {holderName}
                    </span>
                  </div>
                  {holderName && holderName !== 'Not Available' && (
                    <button
                      type="button"
                      onClick={() => handleCopy('holder', holderName)}
                      className="p-1.5 text-neutral-400 hover:text-brand-dark hover:bg-neutral-200/60 rounded-lg transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-dark"
                      title="Copy account holder name"
                      aria-label="Copy account holder name"
                    >
                      {copiedKey === 'holder' ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>

                {/* Account Number */}
                <div className="bg-[#FBFBFA] border border-neutral-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider font-admin block leading-tight mb-1">
                      ACCOUNT NUMBER
                    </span>
                    <span className="text-xs sm:text-[13px] font-bold text-brand-dark font-mono tracking-wider truncate block">
                      {accountNumber || 'Account details unavailable'}
                    </span>
                  </div>
                  {rawAccountToCopy && (
                    <button
                      type="button"
                      onClick={() => handleCopy('account', rawAccountToCopy)}
                      className="p-1.5 text-neutral-400 hover:text-brand-dark hover:bg-neutral-200/60 rounded-lg transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-dark"
                      title="Copy account number"
                      aria-label="Copy account number"
                    >
                      {copiedKey === 'account' ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>

                {/* IFSC Code */}
                <div className="bg-[#FBFBFA] border border-neutral-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider font-admin block leading-tight mb-1">
                      IFSC CODE
                    </span>
                    <span className="text-xs sm:text-[13px] font-bold text-brand-dark font-mono tracking-wider truncate block">
                      {ifscCode || 'Not Available'}
                    </span>
                  </div>
                  {ifscCode && ifscCode !== 'Not Available' && (
                    <button
                      type="button"
                      onClick={() => handleCopy('ifsc', ifscCode)}
                      className="p-1.5 text-neutral-400 hover:text-brand-dark hover:bg-neutral-200/60 rounded-lg transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-dark"
                      title="Copy IFSC code"
                      aria-label="Copy IFSC code"
                    >
                      {copiedKey === 'ifsc' ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </>
            ) : isUPI || hasUpiData ? (
              /* 2. UPI DETAILS */
              <>
                {/* Account Holder */}
                <div className="bg-[#FBFBFA] border border-neutral-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider font-admin block leading-tight mb-1">
                      ACCOUNT HOLDER / CUSTOMER
                    </span>
                    <span className="text-xs sm:text-[13px] font-bold text-brand-dark font-admin truncate block">
                      {holderName}
                    </span>
                  </div>
                </div>

                {/* UPI ID / Phone */}
                <div className="bg-[#FBFBFA] border border-neutral-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider font-admin block leading-tight mb-1">
                      UPI ID / PHONE
                    </span>
                    <span className="text-xs sm:text-[13px] font-bold text-brand-dark font-mono tracking-wider truncate block">
                      {upiId || 'UPI details unavailable'}
                    </span>
                  </div>
                  {upiId && (
                    <button
                      type="button"
                      onClick={() => handleCopy('upi', upiId)}
                      className="p-1.5 text-neutral-400 hover:text-brand-dark hover:bg-neutral-200/60 rounded-lg transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-dark"
                      title="Copy UPI ID"
                      aria-label="Copy UPI ID"
                    >
                      {copiedKey === 'upi' ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </>
            ) : (
              /* 3. CARD / ONLINE PAYMENT GATEWAY DETAILS */
              <>
                {/* Card / Customer Name */}
                <div className="bg-[#FBFBFA] border border-neutral-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider font-admin block leading-tight mb-1">
                      CARD / ACCOUNT HOLDER
                    </span>
                    <span className="text-xs sm:text-[13px] font-bold text-brand-dark font-admin truncate block">
                      {holderName}
                    </span>
                  </div>
                </div>

                {/* Payment Reference / Razorpay ID */}
                <div className="bg-[#FBFBFA] border border-neutral-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider font-admin block leading-tight mb-1">
                      PAYMENT / TRANSACTION ID
                    </span>
                    <span className="text-xs sm:text-[13px] font-bold text-brand-dark font-mono tracking-wider truncate block">
                      {paymentReference || 'Payment details unavailable'}
                    </span>
                  </div>
                  {paymentReference && (
                    <button
                      type="button"
                      onClick={() => handleCopy('payref', paymentReference)}
                      className="p-1.5 text-neutral-400 hover:text-brand-dark hover:bg-neutral-200/60 rounded-lg transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-dark"
                      title="Copy transaction ID"
                      aria-label="Copy transaction ID"
                    >
                      {copiedKey === 'payref' ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>

                {/* Method & Status */}
                <div className="bg-[#FBFBFA] border border-neutral-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider font-admin block leading-tight mb-1">
                      METHOD / STATUS
                    </span>
                    <span className="text-xs sm:text-[13px] font-bold text-brand-dark font-admin truncate block uppercase">
                      {details?.payment_method || initialData?.payment_method || 'Online'} • {details?.payment_status || 'Paid'}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* If no payment or bank data exists at all */}
            {!hasBankData && !hasUpiData && !hasCardOrOnlineData && (
              <div className="p-3 bg-neutral-50 border border-neutral-200/80 rounded-xl text-neutral-600 text-xs font-sans text-center">
                Payment details unavailable for this record.
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="mt-5 pt-3.5 border-t border-neutral-100 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 h-10 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-neutral-950 hover:bg-black transition-colors cursor-pointer shadow-xs font-admin flex items-center justify-center"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsModal;
