import React, { useState, useEffect } from 'react';
import {
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  IndianRupee,
  CreditCard,
  FileText
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

export const ProcessRefundModal = ({
  isOpen,
  onClose,
  refundOrder,
  targetStatus,
  onSuccess
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [txnId, setTxnId] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [notifyCustomer, setNotifyCustomer] = useState(true);

  // Initialize fields whenever modal opens with a refundOrder
  useEffect(() => {
    if (refundOrder) {
      const defaultAmount = parseFloat(refundOrder.refund_eligible_amount || refundOrder.total || 0);
      setAmountPaid(defaultAmount > 0 ? String(defaultAmount) : '');
      setAdminNote('');
      setTxnId(refundOrder.refund_txn_id || '');
      setErrorMsg(null);
      setNotifyCustomer(true);
    }
  }, [refundOrder, targetStatus, isOpen]);

  if (!isOpen || !refundOrder) return null;

  const orderNumber = refundOrder.order_number || refundOrder.id?.slice(0, 8);
  const customerName = refundOrder.customer_name || refundOrder.user_id || 'Customer';
  const eligibleAmount = parseFloat(refundOrder.refund_eligible_amount || refundOrder.total || 0);
  const totalOrderAmount = parseFloat(refundOrder.total || 0);

  const isTransitioningToCompleted = targetStatus === 'Completed' || targetStatus === 'Refunded';
  const isTransitioningToFailed = targetStatus === 'Failed' || targetStatus === 'Rejected';
  const isTransitioningToHold = targetStatus === 'On Hold';
  const isTransitioningToProcessing = targetStatus === 'Processing';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate Completed status
    if (isTransitioningToCompleted) {
      const parsedAmount = parseFloat(amountPaid);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setErrorMsg('Please enter a valid positive payout amount.');
        return;
      }
      if (totalOrderAmount > 0 && parsedAmount > totalOrderAmount * 1.5) {
        setErrorMsg(`Payout amount (₹${parsedAmount.toLocaleString('en-IN')}) cannot exceed total order value.`);
        return;
      }
    }

    // Validate Failed / On Hold reasons
    if ((isTransitioningToFailed || isTransitioningToHold) && !adminNote.trim()) {
      setErrorMsg(`A note/reason is required to mark this refund as ${targetStatus}.`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        refundStatus: targetStatus,
        adminNote: adminNote.trim() || undefined,
        txnId: txnId.trim() || undefined,
        amountPaid: isTransitioningToCompleted && amountPaid ? parseFloat(amountPaid) : undefined,
        notifyCustomer: notifyCustomer
      };

      const response = await apiClient(`/api/admin/refund/${refundOrder.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      const updated = response?.data || response;
      if (onSuccess) {
        onSuccess(updated || { ...refundOrder, refund_status: targetStatus, refund_txn_id: txnId.trim() });
      }
      onClose();
    } catch (err) {
      console.error('[ProcessRefundModal] Update failed:', err);
      setErrorMsg(err.message || 'Failed to update refund status. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs animate-fadeIn font-admin"
      role="dialog"
      aria-modal="true"
      aria-labelledby="refund-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-neutral-200 relative max-h-[85vh] sm:max-h-[88vh] overflow-hidden flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="absolute right-4 top-4 p-1.5 text-neutral-400 hover:text-brand-dark rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-neutral-100 shrink-0 pr-6">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
              isTransitioningToCompleted
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : isTransitioningToFailed
                ? 'bg-rose-50 text-rose-600 border-rose-200'
                : isTransitioningToHold
                ? 'bg-purple-50 text-purple-600 border-purple-200'
                : 'bg-indigo-50 text-indigo-600 border-indigo-200'
            }`}
          >
            {isTransitioningToCompleted ? (
              <ShieldCheck className="w-5 h-5" />
            ) : isTransitioningToFailed ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <RotateCcw className="w-5 h-5" />
            )}
          </div>

          <div>
            <h3
              id="refund-modal-title"
              className="text-base sm:text-lg font-admin font-bold text-brand-dark uppercase tracking-wide"
            >
              {isTransitioningToCompleted
                ? 'Confirm Refund Completion'
                : isTransitioningToProcessing
                ? 'Start Processing Refund'
                : isTransitioningToFailed
                ? 'Mark Refund as Failed'
                : isTransitioningToHold
                ? 'Put Refund On Hold'
                : `Update Status to ${targetStatus}`}
            </h3>
            <p className="text-xs text-neutral-500 font-sans">
              Order #{orderNumber} • {customerName}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto custom-modal-scrollbar pr-1 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Order & Payout Context Summary Box */}
            <div className="bg-neutral-50 rounded-xl p-3.5 border border-neutral-200/80 space-y-2 text-xs">
              <div className="flex justify-between items-center text-neutral-600">
                <span>Customer:</span>
                <span className="font-semibold text-brand-dark">{customerName}</span>
              </div>
              <div className="flex justify-between items-center text-neutral-600">
                <span>Order Number:</span>
                <span className="font-mono font-medium text-brand-dark">{orderNumber}</span>
              </div>
              <div className="flex justify-between items-center text-neutral-600">
                <span>Original Payment Method:</span>
                <span className="font-medium text-brand-dark uppercase">
                  {refundOrder.payment_method || 'Online'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-neutral-200">
                <span className="font-semibold text-neutral-700">Eligible Refund Amount:</span>
                <span className="font-admin font-bold text-brand-dark text-sm">
                  ₹{eligibleAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Amount Paid Field (Mandatory verification for Completed) */}
            {isTransitioningToCompleted && (
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 uppercase tracking-wider mb-1">
                  Confirmed Amount Paid (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <IndianRupee className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="e.g. 4200.00"
                    className="w-full pl-8 pr-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-brand-dark font-admin font-semibold focus:outline-none focus:ring-1 focus:ring-brand-dark"
                  />
                </div>
                <p className="text-[10px] text-neutral-400 mt-1">
                  Confirm this matches the actual funds transferred to the customer.
                </p>
              </div>
            )}

            {/* Transaction Reference / Payout ID */}
            {isTransitioningToCompleted && (
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 uppercase tracking-wider mb-1">
                  Payout Transaction Reference / UTR (Optional)
                </label>
                <div className="relative">
                  <CreditCard className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={txnId}
                    onChange={(e) => setTxnId(e.target.value)}
                    placeholder="e.g. UTR-20260929-9872 or leave blank for Auto"
                    className="w-full pl-8 pr-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-brand-dark placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-brand-dark"
                  />
                </div>
              </div>
            )}

            {/* Admin Note / Reason */}
            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 uppercase tracking-wider mb-1">
                {(isTransitioningToFailed || isTransitioningToHold) ? (
                  <>
                    Reason / Internal Note <span className="text-rose-500">*</span>
                  </>
                ) : (
                  'Admin Note (Optional)'
                )}
              </label>
              <textarea
                rows={2}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder={
                  isTransitioningToFailed
                    ? 'State why this refund failed (e.g., invalid bank account, customer dispute)...'
                    : isTransitioningToHold
                    ? 'State why this case is placed on hold...'
                    : 'Add any relevant audit notes for this refund...'
                }
                className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-brand-dark placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-brand-dark resize-none"
              />
            </div>

            {/* Notify Customer Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="notify-customer-check"
                checked={notifyCustomer}
                onChange={(e) => setNotifyCustomer(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-300 text-brand-dark focus:ring-brand-dark cursor-pointer"
              />
              <label
                htmlFor="notify-customer-check"
                className="text-xs text-neutral-600 select-none cursor-pointer"
              >
                Send status update email notification to customer
              </label>
            </div>

            {/* Confirmation Warning text */}
            <p className="text-[11px] text-neutral-500 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200/60 leading-relaxed">
              {isTransitioningToCompleted
                ? `You are about to mark ₹${parseFloat(amountPaid || eligibleAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} as Completed for #${orderNumber}. This will finalize the refund.`
                : isTransitioningToProcessing
                ? `Move #${orderNumber} (${customerName}) to Processing to begin payout verification?`
                : isTransitioningToFailed
                ? `Mark #${orderNumber} refund as Failed? The customer can be contacted to provide updated payment info.`
                : `Update status for Order #${orderNumber} to ${targetStatus}?`}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200/80 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 h-10 border border-neutral-300 text-neutral-700 hover:bg-neutral-100 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className={`px-6 py-2.5 h-10 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 ${
                isTransitioningToFailed
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : isTransitioningToCompleted
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-neutral-950 hover:bg-black'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <span>
                    {isTransitioningToCompleted
                      ? 'Confirm & Mark Paid'
                      : isTransitioningToProcessing
                      ? 'Start Processing'
                      : isTransitioningToFailed
                      ? 'Confirm Failed'
                      : 'Confirm Status'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProcessRefundModal;
