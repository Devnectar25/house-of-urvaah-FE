import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Building2,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

export const CustomerBankDetailsModal = ({
  orderId,
  initialData,
  isOpen,
  onClose,
  onToast
}) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  // Lock background scrolling when modal is active
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

  // Copy to clipboard with visual feedback & optional toast
  const handleCopy = (key, text) => {
    if (!text || text === 'Not Available' || text === 'N/A') return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
      if (onToast) {
        onToast({
          type: 'success',
          text: 'Copied successfully'
        });
      }
    }
  };

  // Fetch verified bank & refund payment details from backend
  const fetchBankDetails = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient(`/api/admin/refund/${orderId}/payment-details`);
      const data = response?.data || response;
      if (!data) throw new Error('Customer bank details not available for this order.');
      setDetails(data);
    } catch (err) {
      console.warn('[CustomerBankDetailsModal] API fallback to row data:', err.message);
      // Fallback: If initialData is available on row, extract safe bank properties
      if (initialData && (initialData.id === orderId || initialData.order_number === orderId)) {
        setDetails({
          order_id: initialData.id,
          order_number: initialData.order_number || initialData.id?.slice(0, 8),
          customer_name: initialData.customer_name || 'Customer',
          payout_holder_name: initialData.refund_holder_name || null,
          payout_bank_account: initialData.refund_bank_account
            ? `******${String(initialData.refund_bank_account).slice(-4)}`
            : null,
          payout_ifsc_code: initialData.refund_ifsc_code || null,
          payment_method: initialData.payment_method || 'Online'
        });
      } else {
        setError(err.message || 'Unable to load customer bank details.');
      }
    } finally {
      setLoading(false);
    }
  }, [orderId, initialData]);

  // STALE DATA PROTECTION: Reset state on order switch or modal open
  useEffect(() => {
    if (isOpen && orderId) {
      setDetails(null);
      setError(null);
      setCopiedKey(null);
      fetchBankDetails();
    } else {
      setDetails(null);
      setError(null);
      setLoading(false);
      setCopiedKey(null);
    }
  }, [isOpen, orderId, fetchBankDetails]);

  // ESC key to close
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

  const orderNumber = details?.order_number || (typeof orderId === 'string' ? orderId.slice(0, 8) : orderId) || 'N/A';
  
  // Format bank details safely
  const rawHolder = details?.payout_holder_name || details?.refund_holder_name;
  const holderName = rawHolder && rawHolder.trim().length > 0 ? rawHolder.trim() : (details?.customer_name || 'Not Available');

  const rawAcc = details?.payout_bank_account || details?.refund_bank_account;
  const accountNumber = rawAcc
    ? (String(rawAcc).startsWith('*') ? String(rawAcc) : `******${String(rawAcc).slice(-4)}`)
    : 'Not Available';

  const rawIfsc = details?.payout_ifsc_code || details?.refund_ifsc_code;
  const ifscCode = rawIfsc && rawIfsc.trim().length > 0 ? rawIfsc.trim().toUpperCase() : 'Not Available';

  const hasAnyBankData = (rawHolder && rawHolder.trim().length > 0) || rawAcc || (rawIfsc && rawIfsc.trim().length > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs animate-fadeIn font-admin text-brand-dark"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-bank-details-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-[420px] w-full p-6 shadow-2xl border border-neutral-200 relative max-h-[85vh] sm:max-h-[88vh] overflow-hidden flex flex-col">
        {/* Close (X) Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-neutral-400 hover:text-brand-dark rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-dark"
          aria-label="Close customer bank details"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header: Icon + Title + Order Reference */}
        <div className="flex items-start gap-3 mb-4.5 border-b border-neutral-100 pb-3.5 shrink-0 pr-6">
          <div className="w-9 h-9 rounded-xl bg-brand-dark text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
            <Building2 className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3
              id="customer-bank-details-title"
              className="text-lg sm:text-[19px] font-admin font-bold text-brand-dark tracking-tight leading-tight truncate"
            >
              Customer Bank Details
            </h3>
            <p className="text-xs text-neutral-500 font-sans mt-1 leading-snug">
              Provided for manual refund processing of order{' '}
              <span className="font-bold text-brand-dark font-admin">#{orderNumber}</span>
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-10 text-center space-y-3 shrink-0">
            <Loader2 className="w-7 h-7 text-neutral-400 animate-spin mx-auto" />
            <p className="text-xs text-neutral-500 font-sans">
              Loading customer bank details...
            </p>
          </div>
        ) : error ? (
          /* Error State with Retry */
          <div className="p-5 bg-neutral-50/80 border border-neutral-200 rounded-xl text-center space-y-3 my-2 shrink-0">
            <AlertCircle className="w-7 h-7 text-neutral-500 mx-auto" />
            <h4 className="text-xs font-semibold text-brand-dark">
              Unable to load customer bank details
            </h4>
            <p className="text-xs text-neutral-600 max-w-xs mx-auto font-sans">{error}</p>
            <button
              type="button"
              onClick={fetchBankDetails}
              className="inline-flex items-center gap-1.5 px-4 py-2 h-10 bg-brand-dark text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-black transition-colors cursor-pointer shadow-xs mt-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : (
          /* Main Bank Details Content Cards */
          <div className="space-y-3 flex-1 overflow-y-auto custom-modal-scrollbar pr-1">
            {/* 1. Account Holder Name Card */}
            <div className="bg-[#FBFBFA] border border-neutral-200/80 rounded-xl p-3 sm:px-3.5 sm:py-3 flex items-center justify-between gap-3 shadow-2xs min-h-[64px]">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider font-admin block leading-tight mb-1">
                  ACCOUNT HOLDER NAME
                </span>
                <span className="text-xs sm:text-[13px] font-bold text-brand-dark font-admin truncate block">
                  {holderName}
                </span>
              </div>
              {holderName !== 'Not Available' && (
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

            {/* 2. Account Number Card */}
            <div className="bg-[#FBFBFA] border border-neutral-200/80 rounded-xl p-3 sm:px-3.5 sm:py-3 flex items-center justify-between gap-3 shadow-2xs min-h-[64px]">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider font-admin block leading-tight mb-1">
                  ACCOUNT NUMBER
                </span>
                <span className="text-xs sm:text-[13px] font-bold text-brand-dark font-mono tracking-wider truncate block">
                  {accountNumber}
                </span>
              </div>
              {accountNumber !== 'Not Available' && (
                <button
                  type="button"
                  onClick={() => handleCopy('account', accountNumber)}
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

            {/* 3. IFSC Code Card */}
            <div className="bg-[#FBFBFA] border border-neutral-200/80 rounded-xl p-3 sm:px-3.5 sm:py-3 flex items-center justify-between gap-3 shadow-2xs min-h-[64px]">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider font-admin block leading-tight mb-1">
                  IFSC CODE
                </span>
                <span className="text-xs sm:text-[13px] font-bold text-brand-dark font-mono tracking-wider truncate block">
                  {ifscCode}
                </span>
              </div>
              {ifscCode !== 'Not Available' && (
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

            {/* If no bank data recorded at all for this refund, show helpful note */}
            {!hasAnyBankData && (
              <div className="p-2.5 bg-neutral-50 border border-neutral-200/80 rounded-xl text-neutral-600 text-[11px] font-sans">
                <span className="font-semibold text-brand-dark block mb-0.5">
                  Bank Details Not Available
                </span>
                Customer bank details have not been submitted for this order.
              </div>
            )}

            {/* Information / Warning Box */}
            <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-950 flex items-start gap-2.5 mt-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="font-sans leading-relaxed text-[11px] text-amber-900">
                Verify all details manually before initiating transfer. House of Urvaah is not liable for incorrect details provided by users.
              </p>
            </div>
          </div>
        )}

        {/* Modal Footer: Full Width "Got it" Button */}
        <div className="mt-5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-10 px-4 bg-brand-dark hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark flex items-center justify-center"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerBankDetailsModal;
