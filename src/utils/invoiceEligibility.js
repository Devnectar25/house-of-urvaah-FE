/**
 * Customer invoice eligibility (item level). Mirrors house-of-urvaah-api/src/services/invoiceEligibility.js,
 * which is the authority: this only decides whether to show the Invoice button.
 * An order is invoiceable once delivery is verified and at least one item is still with the customer
 * (not cancelled and not returned / in an approved return).
 * Items where return QC was rejected remain invoiceable because no refund was given.
 */

const HIDDEN_ITEM_STATUSES = [
  'cancelled', 'cancellation requested', 'cancel_requested', 'cancel_approved',
  'return requested', 'return request processing', 'return approved', 'return processing',
  'return collected', 'in transit to house of urvaah', 'received at house of urvaah',
  'received at homved', 'returned', 'refunded', 'restocked'
];

const UNDELIVERED_ORDER_STATUSES = [
  'pending', 'placed', 'confirmed', 'processing', 'dispatched', 'shipped', 'in transit',
  'out for delivery', 'cancelled', 'canceled', 'cancellation requested', 'cancel_requested',
  'replacement processing', 'replacement shipped', 'replacement out for delivery'
];

const lower = (v) => String(v || '').trim().toLowerCase();

export const isCustomerInvoiceEligible = (order) => {
  if (!order) return false;
  const st = lower(order.status);
  if (UNDELIVERED_ORDER_STATUSES.includes(st)) return false;
  const isQCRejected = st === 'return qc rejected' || st === 'return rejected' || st === 'replace rejected' ||
    lower(order.return_qc_status || order.returnQcStatus) === 'rejected';
  const delivered = isQCRejected || Boolean(order.delivered_at || order.deliveredAt) || st === 'delivered' ||
    lower(order.original_status || order.originalStatus) === 'delivered';
  if (!delivered) return false;
  if (lower(order.payment_status || order.paymentStatus) === 'failed') return false;
  const items = Array.isArray(order.items) ? order.items : [];
  if (isQCRejected && items.length > 0) return true;
  return items.some(it => {
    const itemSt = lower(it.status);
    if (itemSt === 'return qc rejected' || itemSt === 'return rejected' || itemSt === 'replace rejected') return true;
    return !HIDDEN_ITEM_STATUSES.includes(itemSt) && (isQCRejected || lower(it.return_action) !== 'return');
  });
};

export default isCustomerInvoiceEligible;
