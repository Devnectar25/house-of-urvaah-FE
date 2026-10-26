import React, { useRef } from 'react';
import { X, Printer, Truck } from 'lucide-react';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import { printElement } from '../../utils/printHelper';

export const ShippingLabelModal = ({ isOpen, onClose, order }) => {
  useModalScrollLock(isOpen, onClose);
  const printAreaRef = useRef(null);

  if (!isOpen || !order) return null;

  const awb = order.tracking_number || order.trackingNumber || order.awb_code || 'URV109418566IN';
  const courier = order.courier_name || (awb.startsWith('REV') ? 'Delhivery Reverse Logistics' : 'Delhivery Express');
  const orderNumber = order.order_number || `#ORD-${order.id}`;
  const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN');
  const isCod = (order.payment_method || '').toLowerCase() === 'cod' || (order.payment_type || '').toLowerCase() === 'cod';
  const totalAmount = parseFloat(order.total || order.subtotal || 0);

  // Address resolution
  const recipientName = order.shipping_name || order.recipient_name || order.customer_name || order.shippingAddress?.fullName || 'Valued Customer';
  const recipientPhone = order.shipping_phone || order.phone || order.shippingAddress?.phone || '+91 98765 43210';
  const streetAddress = order.shipping_address || order.address || order.shippingAddress?.address || 'Signature Suite, Luxury Boulevard';
  const city = order.shipping_city || order.city || order.shippingAddress?.city || 'Mumbai';
  const state = order.shipping_state || order.state || order.shippingAddress?.state || 'Maharashtra';
  const pincode = order.shipping_pincode || order.pincode || order.postal_code || order.shippingAddress?.pincode || '400001';

  const routingHub = `${city.slice(0, 3).toUpperCase()}/${courier.slice(0, 3).toUpperCase()}/${pincode.slice(0, 3)}`;

  const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [
    { name: 'House of Urvaah Haute Couture Garment', quantity: 1, size: 'M', price: totalAmount }
  ];

  const handlePrint = () => {
    printElement(printAreaRef.current, {
      title: `SHIPPING_LABEL_${awb}_${orderNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
      pageStyle: `
        @page {
          size: 4in 6in;
          margin: 0;
        }
        @media print {
          body {
            display: flex !important;
            justify-content: center !important;
            align-items: flex-start !important;
            padding: 0.1in !important;
            margin: 0 !important;
          }
          #shipping-label-printable {
            width: 3.8in !important;
            max-width: 3.8in !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border: 2px solid #000 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `
    });
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto overscroll-contain animate-in fade-in duration-200"
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
      onWheel={(e) => e.stopPropagation()}
    >
      <style>{`
        @media print {
          html, body, [data-modal-open] {
            overflow: visible !important;
            height: auto !important;
            min-height: 100% !important;
            position: static !important;
            background: #ffffff !important;
          }
          body * {
            visibility: hidden !important;
          }
          #shipping-label-printable, #shipping-label-printable * {
            visibility: visible !important;
          }
          #shipping-label-printable {
            position: absolute !important;
            left: 50% !important;
            top: 20px !important;
            transform: translateX(-50%) !important;
            width: 380px !important;
            max-width: 380px !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border: 2px solid #000 !important;
            background: #ffffff !important;
          }
        }
      `}</style>

      <div
        className="relative w-full max-w-lg bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Action Bar */}
        <div className="px-5 py-3.5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <Truck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold font-mono tracking-wider text-white uppercase">
                Shiprocket Official Courier Label
              </h3>
              <span className="text-[10px] text-neutral-400 font-mono">
                AWB: {awb} • Standard 4x6" Thermal Format
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Label</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose?.();
              }}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 bg-neutral-100 flex justify-center max-h-[82vh] overflow-y-auto">
          {/* Authentic 4x6 Thermal Label Container */}
          <div
            id="shipping-label-printable"
            ref={printAreaRef}
            className="w-full max-w-[420px] bg-white border-2 border-black p-4 text-black font-sans text-xs shadow-lg space-y-3"
          >
            {/* Label Header */}
            <div className="border-b-2 border-black pb-2 flex items-center justify-between">
              <div>
                <h1 className="text-base font-black tracking-widest uppercase font-serif">
                  HOUSE OF URVAAH
                </h1>
                <span className="text-[9px] uppercase tracking-widest text-neutral-600 font-bold block">
                  Haute Couture & Store Express
                </span>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-0.5 bg-black text-white text-[11px] font-mono font-black uppercase tracking-wider">
                  {courier}
                </span>
                <span className="block text-[10px] font-mono font-bold mt-0.5">{routingHub}</span>
              </div>
            </div>

            {/* AWB Barcode Block */}
            <div className="border-b-2 border-black pb-3 text-center">
              {/* CSS/SVG Barcode Simulation */}
              <div className="h-14 flex items-center justify-center gap-0.5 overflow-hidden my-1 bg-white px-2">
                {[4, 2, 6, 2, 8, 3, 5, 2, 7, 3, 4, 2, 6, 3, 8, 2, 4, 3, 7, 2, 5, 3, 8, 4, 3, 2, 6, 3, 8, 4, 2, 6, 3, 7, 2, 5, 3, 8, 4, 2, 6].map((w, i) => (
                  <div
                    key={i}
                    style={{ width: `${w}px` }}
                    className={`h-12 ${i % 2 === 0 ? 'bg-black' : 'bg-transparent'}`}
                  />
                ))}
              </div>
              <span className="font-mono text-sm font-black tracking-widest block">
                {awb}
              </span>
            </div>

            {/* Payment & Order Meta Grid */}
            <div className="grid grid-cols-2 border-b-2 border-black pb-2 text-[11px]">
              <div className="pr-2 border-r border-black">
                <span className="text-[9px] text-neutral-500 uppercase font-bold block">Order No:</span>
                <span className="font-mono font-black text-xs">{orderNumber}</span>
                <span className="text-[9px] text-neutral-500 block mt-1">Date: {orderDate}</span>
              </div>
              <div className="pl-3">
                <span className="text-[9px] text-neutral-500 uppercase font-bold block">Payment Mode:</span>
                {isCod ? (
                  <div>
                    <span className="inline-block px-1.5 py-0.5 bg-black text-white font-mono font-black text-[11px]">
                      COD: COLLECT ₹{totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="inline-block px-1.5 py-0.5 bg-neutral-200 text-black font-mono font-black text-[11px]">
                      PREPAID • DO NOT COLLECT CASH
                    </span>
                  </div>
                )}
                <span className="text-[9px] text-neutral-600 block mt-0.5">Weight: 0.85 KG</span>
              </div>
            </div>

            {/* Consignee (Deliver To) */}
            <div className="border-b-2 border-black pb-2.5">
              <span className="text-[9px] uppercase tracking-wider font-black bg-black text-white px-1.5 py-0.5 inline-block mb-1">
                DELIVER TO (CONSIGNEE):
              </span>
              <p className="font-bold text-sm leading-tight text-neutral-950">
                {recipientName}
              </p>
              <p className="text-[11px] text-neutral-800 leading-snug mt-1">
                {streetAddress}
              </p>
              <p className="text-[11px] font-bold text-neutral-950 mt-0.5">
                {city}, {state} - <span className="font-mono text-sm underline decoration-2">{pincode}</span>
              </p>
              <p className="text-[11px] font-mono font-semibold text-neutral-700 mt-0.5">
                Phone: {recipientPhone}
              </p>
            </div>

            {/* Items Summary */}
            <div className="border-b-2 border-black pb-2">
              <div className="flex justify-between text-[9px] font-bold uppercase text-neutral-500 mb-1 border-b border-neutral-300 pb-0.5">
                <span>Item SKU / Description</span>
                <span>Qty</span>
                <span>Value</span>
              </div>
              <div className="space-y-1">
                {items.slice(0, 3).map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10px]">
                    <span className="truncate max-w-[220px] font-medium">
                      {it.name || it.title || 'Haute Couture Apparel'} {it.size ? `(${it.size})` : ''}
                    </span>
                    <span className="font-mono font-bold">{it.quantity || 1}</span>
                    <span className="font-mono">₹{parseFloat(it.price || totalAmount).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Return Address / Shipper */}
            <div className="text-[10px] text-neutral-700 leading-tight border-b-2 border-black pb-2">
              <span className="text-[8.5px] uppercase tracking-wider font-bold text-neutral-500 block">
                IF UNDELIVERED, RETURN TO:
              </span>
              <p className="font-bold text-black mt-0.5">HOUSE OF URVAAH CENTRAL WAREHOUSE</p>
              <p>Plot 402, Signature Industrial Estate, Kurla East, Mumbai, MH - 400024</p>
              <p className="font-mono text-[9px] mt-0.5">GSTIN: 27AABCH8821F1ZX • Support: concierge@urvaah.com</p>
            </div>

            {/* Routing Footer / Security QR Code representation */}
            <div className="flex items-center justify-between pt-1">
              <div className="text-[9px] text-neutral-500 leading-snug">
                <span>Shiprocket Logistics Network</span><br />
                <span className="font-mono font-bold text-black">URVAAH-DISPATCH-V4</span>
              </div>
              <div className="flex items-center gap-1.5">
                {/* Simulated Mini QR Code */}
                <div className="w-10 h-10 border border-black p-0.5 grid grid-cols-4 gap-0.5 bg-white">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div
                      key={i}
                      className={`${(i % 3 === 0 || i === 5 || i === 10 || i === 15) ? 'bg-black' : 'bg-transparent'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingLabelModal;
