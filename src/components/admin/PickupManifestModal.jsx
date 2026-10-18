import React, { useRef } from 'react';
import { X, Printer, FileText, UserCheck } from 'lucide-react';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import { printElement } from '../../utils/printHelper';

export const PickupManifestModal = ({ isOpen, onClose, order }) => {
  useModalScrollLock(isOpen, onClose);
  const printAreaRef = useRef(null);

  if (!isOpen || !order) return null;

  const awb = order.tracking_number || order.trackingNumber || order.awb_code || 'URV109418566IN';
  const isReturn = awb.startsWith('REV') || (order.status || '').toLowerCase().includes('return');
  const courier = order.courier_name || (isReturn ? 'Delhivery Reverse Logistics' : 'Delhivery Express');
  const orderNumber = order.order_number || `#ORD-${order.id}`;
  const manifestToken = order.pickup_token || `MNF-${Date.now().toString().slice(-8)}`;
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const recipientName = order.shipping_name || order.recipient_name || order.customer_name || order.shippingAddress?.fullName || 'Customer';
  const city = order.shipping_city || order.city || order.shippingAddress?.city || 'Mumbai';
  const pincode = order.shipping_pincode || order.pincode || order.postal_code || order.shippingAddress?.pincode || '400001';

  const handlePrint = () => {
    printElement(printAreaRef.current, {
      title: `COURIER_PICKUP_MANIFEST_${manifestToken}_${awb}`,
      pageStyle: `
        @page {
          size: A4 portrait;
          margin: 8mm 10mm;
        }
        @media print {
          html, body {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            box-sizing: border-box !important;
          }
          #pickup-manifest-printable {
            position: relative !important;
            left: 0 !important;
            right: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            margin: 0 auto !important;
            padding: 14px 16px !important;
            box-shadow: none !important;
            border: 1.5px solid #000 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            background: #ffffff !important;
          }
          .overflow-x-auto {
            overflow: visible !important;
            box-sizing: border-box !important;
          }
          table {
            width: 100% !important;
            max-width: 100% !important;
            table-layout: auto !important;
            box-sizing: border-box !important;
          }
          thead {
            display: table-header-group !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .manifest-exec-grid {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
      `
    });
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto overscroll-contain animate-in fade-in duration-200"
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
            box-sizing: border-box !important;
          }
          body * {
            visibility: hidden !important;
          }
          #pickup-manifest-printable, #pickup-manifest-printable * {
            visibility: visible !important;
          }
          #pickup-manifest-printable {
            position: absolute !important;
            left: 0 !important;
            right: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 14px 16px !important;
            box-sizing: border-box !important;
            box-shadow: none !important;
            border: 1.5px solid #000 !important;
            background: #ffffff !important;
          }
          .overflow-x-auto {
            overflow: visible !important;
          }
          table {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .manifest-exec-grid {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Top Action Bar */}
        <div className="px-5 py-3.5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <FileText className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold font-mono tracking-wider text-white uppercase">
                Shiprocket Official Courier Pickup Manifest
              </h3>
              <span className="text-[10px] text-neutral-400 font-mono">
                Token: {manifestToken} • Handover Sheet
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Manifest</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 bg-neutral-100 flex justify-center max-h-[82vh] overflow-y-auto">
          {/* Authentic Courier Manifest Container */}
          <div
            id="pickup-manifest-printable"
            ref={printAreaRef}
            className="w-full box-border bg-white border border-neutral-300 p-6 text-black font-sans text-xs shadow-lg space-y-4"
          >
            {/* Header */}
            <div className="border-b-2 border-black pb-3 flex items-start justify-between">
              <div>
                <h1 className="text-base font-black uppercase tracking-wider font-serif">
                  HOUSE OF URVAAH
                </h1>
                <p className="text-[10px] text-neutral-600 uppercase font-semibold">
                  Official Courier Dispatch Handover Manifest
                </p>
                <p className="text-[10px] text-neutral-500 mt-0.5">
                  Atelier Warehouse: Kurla East Hub, Mumbai 400024
                </p>
              </div>

              <div className="text-right">
                <span className="font-mono text-sm font-black block text-neutral-950">
                  {manifestToken}
                </span>
                <span className="text-[10px] text-neutral-600 block mt-0.5">
                  Date: {dateStr} • {timeStr}
                </span>
                <span className="inline-block mt-1 px-2 py-0.5 bg-neutral-900 text-white text-[10px] font-bold uppercase font-mono">
                  {courier}
                </span>
              </div>
            </div>

            {/* Manifest Summary Metadata */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-neutral-50 border border-neutral-200 rounded text-[11px]">
              <div>
                <span className="text-[9px] uppercase font-bold text-neutral-400 block">Total Shipments:</span>
                <span className="font-mono font-bold text-sm">1 Parcel</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-neutral-400 block">Logistics Partner:</span>
                <span className="font-semibold text-neutral-900">{courier}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-neutral-400 block">Manifest Type:</span>
                <span className="font-semibold text-neutral-900">
                  {isReturn ? 'Reverse Doorstep Return' : 'Forward Outbound Dispatch'}
                </span>
              </div>
            </div>

            {/* Handover Table */}
            <div className="w-full overflow-hidden border border-black box-border">
              <table className="w-full text-left text-[11px] border-collapse table-auto">
                <thead>
                  <tr className="bg-black text-white font-bold text-[10px] uppercase">
                    <th className="py-2 px-2 border-r border-neutral-700">#</th>
                    <th className="py-2 px-2.5 border-r border-neutral-700">AWB Number</th>
                    <th className="py-2 px-2.5 border-r border-neutral-700">Order ID</th>
                    <th className="py-2 px-2.5 border-r border-neutral-700">Consignee</th>
                    <th className="py-2 px-2 border-r border-neutral-700">Dest. PIN</th>
                    <th className="py-2 px-2 border-r border-neutral-700">Weight</th>
                    <th className="py-2 px-2.5">Driver Check</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-300">
                  <tr className="hover:bg-neutral-50">
                    <td className="py-3 px-2 font-mono font-bold border-r border-neutral-300">1</td>
                    <td className="py-3 px-2.5 font-mono font-bold border-r border-neutral-300 text-neutral-950">
                      {awb}
                    </td>
                    <td className="py-3 px-2.5 font-mono border-r border-neutral-300">
                      {orderNumber}
                    </td>
                    <td className="py-3 px-2.5 border-r border-neutral-300">
                      <strong className="block text-neutral-900">{recipientName}</strong>
                      <span className="text-[10px] text-neutral-500">{city}</span>
                    </td>
                    <td className="py-3 px-2 font-mono font-bold border-r border-neutral-300">
                      {pincode}
                    </td>
                    <td className="py-3 px-2 font-mono border-r border-neutral-300">
                      0.85 kg
                    </td>
                    <td className="py-3 px-2.5 text-center">
                      <div className="w-4 h-4 border-2 border-black inline-block" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Driver Acknowledgment & Handover Section */}
            <div className="border border-black p-4 space-y-3 bg-neutral-50/70">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-950 border-b border-neutral-200 pb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-neutral-700" />
                <span>Courier Pickup Executive Handover Verification</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 manifest-exec-grid gap-3 text-[10px]">
                <div>
                  <span className="text-neutral-500 uppercase font-semibold block">Pickup Executive:</span>
                  <div className="h-6 border-b border-black mt-2" />
                </div>
                <div>
                  <span className="text-neutral-500 uppercase font-semibold block">Executive Mobile:</span>
                  <div className="h-6 border-b border-black mt-2" />
                </div>
                <div>
                  <span className="text-neutral-500 uppercase font-semibold block">Vehicle Number:</span>
                  <div className="h-6 border-b border-black mt-2" />
                </div>
                <div>
                  <span className="text-neutral-500 uppercase font-semibold block">Executive Signature:</span>
                  <div className="h-6 border-b border-black mt-2" />
                </div>
              </div>

              <p className="text-[9.5px] text-neutral-500 italic pt-1 leading-snug">
                I hereby acknowledge receipt of <strong>1 (One)</strong> sealed package(s) from House of Urvaah in tamper-evident packaging with security barcoding intact.
              </p>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center text-[9px] text-neutral-500 pt-2 border-t border-neutral-200">
              <span>House of Urvaah Enterprise Logistics System • Shiprocket Integration</span>
              <span className="font-mono">PAGE 1 OF 1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PickupManifestModal;
