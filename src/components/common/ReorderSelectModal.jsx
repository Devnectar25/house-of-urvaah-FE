import React, { useEffect, useMemo, useState } from 'react';
import { X, Loader2, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { checkReorderItems } from '../../utils/reorder';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import { getSupabaseMediaUrl } from '../../lib/supabase';

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/**
 * Reorder picker for orders with more than one item.
 * Checks live stock for every line, pre-selects everything that can be reordered, and lets
 * the customer choose which pieces go to the bag. Out-of-stock lines are shown (disabled)
 * with the reason instead of silently disappearing.
 *
 * Props:
 *  - order:     the order ({ items, orderNumber | order_number | id }) or null when closed
 *  - onClose(): close without doing anything
 *  - onConfirm(entries): async; entries = [{ product, size, quantity }] for the chosen lines
 */
export const ReorderSelectModal = ({ order, onClose, onConfirm }) => {
  const isOpen = Boolean(order);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [selected, setSelected] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useModalScrollLock(isOpen, () => {
    if (!submitting) onClose();
  });

  useEffect(() => {
    if (!order) return undefined;
    let cancelled = false;
    setLines([]);
    setSelected([]);
    setLoadError(null);
    setLoading(true);
    checkReorderItems(order.items || [])
      .then((checked) => {
        if (cancelled) return;
        setLines(checked);
        setSelected(checked.filter((c) => c.entry).map((c) => c.lineKey));
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not check stock right now. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [order]);

  const selectable = useMemo(() => lines.filter((l) => l.entry), [lines]);
  const chosen = useMemo(() => selectable.filter((l) => selected.includes(l.lineKey)), [selectable, selected]);
  const allSelected = selectable.length > 0 && chosen.length === selectable.length;
  const chosenTotal = chosen.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const chosenPieces = chosen.reduce((sum, l) => sum + l.quantity, 0);

  const toggle = (key) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  const toggleAll = () => setSelected(allSelected ? [] : selectable.map((l) => l.lineKey));

  const handleConfirm = async () => {
    if (chosen.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      await onConfirm(chosen.map((l) => l.entry));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;
  const orderLabel = order.orderNumber || order.order_number || order.id;

  return (
    <div
      className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-[2px] p-0 sm:p-4"
      onClick={() => !submitting && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reorder-select-title"
    >
      <div
        className="bg-white w-full sm:max-w-lg max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-neutral-200 flex items-start justify-between gap-4">
          <div>
            <h2 id="reorder-select-title" className="text-base sm:text-lg font-serif tracking-[0.15em] uppercase text-black font-semibold">
              Reorder Items
            </h2>
            <p className="text-xs text-neutral-500 font-sans mt-1">
              {orderLabel ? `Order ${String(orderLabel).startsWith('#') ? orderLabel : `#${orderLabel}`} · ` : ''}
              Choose the pieces you want to add to your bag.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 -mr-1.5 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 font-sans">
          {loading ? (
            <div className="py-12 flex flex-col items-center gap-3 text-neutral-500">
              <Loader2 className="w-6 h-6 animate-spin text-black" />
              <p className="text-xs">Checking current stock...</p>
            </div>
          ) : loadError ? (
            <div className="py-10 text-center text-sm text-rose-600 flex flex-col items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              {loadError}
            </div>
          ) : (
            <>
              {selectable.length > 1 && (
                <button
                  type="button"
                  onClick={toggleAll}
                  className="mb-3 text-[11px] font-semibold tracking-[0.14em] uppercase text-neutral-700 hover:text-black underline underline-offset-4 cursor-pointer"
                >
                  {allSelected ? 'Deselect all' : 'Select all available'}
                </button>
              )}

              <ul className="divide-y divide-neutral-100">
                {lines.map((l) => {
                  const disabled = !l.entry;
                  const checked = !disabled && selected.includes(l.lineKey);
                  return (
                    <li key={l.lineKey}>
                      <label
                        className={`flex items-center gap-3 sm:gap-4 py-3.5 ${disabled ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggle(l.lineKey)}
                        />
                        <span
                          aria-hidden="true"
                          className={`w-5 h-5 shrink-0 rounded-md border flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-black/30 ${
                            checked ? 'bg-black border-black text-white' : 'bg-white border-neutral-300'
                          }`}
                        >
                          {checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                        </span>

                        <div className="w-14 h-16 shrink-0 rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200">
                          {l.image && (
                            <img src={getSupabaseMediaUrl(l.image)} alt={l.name} className="w-full h-full object-cover" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold uppercase tracking-wide text-black leading-snug line-clamp-2">
                            {l.name}
                          </p>
                          <p className="text-xs text-neutral-500 mt-1">
                            Size: {l.size} · Qty: {l.quantity || l.requestedQty} · <span className="text-black font-semibold">{formatINR(l.price)}</span>
                          </p>
                          {l.reason && (
                            <p className={`text-[11px] font-semibold mt-1 ${disabled ? 'text-rose-600' : 'text-amber-700'}`}>
                              {l.reason}
                            </p>
                          )}
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>

              {selectable.length === 0 && (
                <p className="mt-2 text-sm text-rose-600">
                  Sorry, none of the items from this order are in stock right now.
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-neutral-200 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-neutral-500 font-sans">
            {chosen.length > 0
              ? <>{chosen.length} of {lines.length} item{lines.length > 1 ? 's' : ''} selected · <span className="text-black font-semibold">{formatINR(chosenTotal)}</span></>
              : 'No items selected'}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-neutral-300 hover:border-black text-[11px] font-semibold tracking-[0.14em] uppercase text-neutral-700 hover:text-black transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading || submitting || chosen.length === 0}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              {submitting ? 'Adding...' : `Reorder ${chosenPieces > 0 ? chosenPieces : ''} ${chosenPieces === 1 ? 'Item' : 'Items'}`.replace('  ', ' ')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReorderSelectModal;
