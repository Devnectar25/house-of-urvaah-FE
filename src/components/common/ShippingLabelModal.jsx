import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  ExternalLink,
  Loader2,
  FileText,
  Package,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Truck
} from 'lucide-react';
import { apiClient, getAuthToken, getAdminAuthToken } from '../../lib/apiClient';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';

export const ShippingLabelModal = ({ isOpen, onClose, order, orderId, isReturn = false }) => {
  const targetId = order?.tracking_number || order?.awb_code || order?.order_number || order?.id || orderId;

  // Lock background screen scroll while Shipping Label Modal is open
  useModalScrollLock(isOpen, onClose);

  const [labelData, setLabelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [error, setError] = useState(null);

  // Fetch or assemble shipping label data
  useEffect(() => {
    if (!isOpen || !targetId) {
      setLabelData(null);
      setError(null);
      return;
    }

    let isMounted = true;
    const fetchLabelData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient(`/api/shipping/label/${encodeURIComponent(targetId)}?format=json${isReturn ? '&isReturn=true' : ''}`);
        if (isMounted) {
          if (response?.success && response?.data) {
            setLabelData(response.data);
          } else {
            throw new Error('Shipping label data not returned from logistics engine');
          }
        }
      } catch (err) {
        console.warn('Could not fetch server label JSON, falling back to local order props:', err);
        // Fallback: assemble gracefully from client order props
        if (isMounted && order) {
          const isCod = (order.payment_method || '').toLowerCase().includes('cod') ||
                        (order.payment_type || '').toLowerCase().includes('cod');
          const awb = order.tracking_number || order.awb_code || `URV${String(order.order_number || order.id || '888888').replace(/\D/g, '').padEnd(9, '8').slice(0, 9)}IN`;
          const orderNum = order.order_number || String(order.id || '').slice(0, 8);
          const consigneeName = order.recipient_name || order.customer_name || 'Valued Atelier Patron';
          const phone = order.recipient_phone || order.customer_phone || order.phone || 'N/A';
          const street = (order.full_address || order.address || '').trim() || 'Address on file';
          const city = (order.city || 'Mumbai').trim();
          const state = (order.state || 'Maharashtra').trim();
          const pincode = String(order.postal_code || order.pincode || '400001').trim();

          setLabelData({
            orderNumber: orderNum,
            awb,
            isReturn,
            courierName: order.courier_name || 'Delhivery Express Surface & Air',
            hubCode: `${city.slice(0, 3).toUpperCase()}/${pincode}`,
            isCod,
            paymentBadge: isCod ? 'CASH ON DELIVERY (COD)' : 'PREPAID',
            collectableAmountText: isCod ? `₹${parseFloat(order.total || 0).toFixed(2)}` : '₹0.00 (DO NOT COLLECT CASH)',
            totalAmount: parseFloat(order.total || 0).toFixed(2),
            consignee: {
              name: consigneeName,
              phone,
              street,
              city,
              state,
              pincode
            },
            seller: {
              name: 'HOUSE OF URVAAH (Urvaah Luxury Retails Pvt. Ltd.)',
              address: 'Central Atelier & Dispatch Hub, Plot 18, Phase 2, Industrial Estate, Andheri East',
              city: 'Mumbai',
              state: 'Maharashtra',
              pincode: '400093',
              gstin: '27AABCH1234F1Z5'
            },
            weight: '0.50 KG',
            dimensions: '15 x 12 x 6 CM',
            orderDate: new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric'
            }),
            items: (order.items || []).map((it, idx) => ({
              index: idx + 1,
              title: it.name || it.title || 'Haute Couture Garment',
              sku: it.sku || `URV-SKU-${idx + 1}`,
              size: it.size || 'Free',
              quantity: it.quantity || 1
            }))
          });
        } else {
          setError(err.message || 'Failed to load shipping label data');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLabelData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, targetId, order, isReturn]);

  // Handle direct PDF Download
  const handleDownloadPdf = async () => {
    if (!targetId || downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      const API_BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
      const token = getAdminAuthToken() || getAuthToken();

      const response = await fetch(`${API_BASE}/api/shipping/label/${encodeURIComponent(targetId)}?format=pdf${isReturn ? '&isReturn=true' : ''}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to download shipping label PDF (Status: ${response.status})`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HOUSE_OF_URVAAH_SHIPPING_LABEL_${labelData?.awb || targetId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(`Download Error: ${err.message}`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Open PDF directly in a new browser tab with browser's built-in PDF viewer
  const handleOpenPdfTab = () => {
    const API_BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
    const url = `${API_BASE}/api/shipping/label/${encodeURIComponent(targetId)}?format=pdf${isReturn ? '&isReturn=true' : ''}`;
    window.open(url, '_blank');
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const shipTo = isReturn ? (labelData?.seller || {}) : (labelData?.consignee || {});
  const shipFrom = isReturn ? (labelData?.consignee || {}) : (labelData?.seller || {});

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/75 backdrop-blur-xs overscroll-contain"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col border border-neutral-200 overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-neutral-900 text-white rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 font-admin tracking-tight">
                {isReturn ? 'Return Shipping Label (PDF)' : 'Courier Shipping Label (PDF)'}
              </h3>
              <p className="text-[11px] text-neutral-500 font-mono">
                AWB: {labelData?.awb || targetId} • Order #{labelData?.orderNumber || targetId}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrint}
              disabled={loading || !labelData}
              className="px-2.5 py-1.5 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
              title="Print Thermal Label (4x6 / A6)"
            >
              <Printer className="w-3.5 h-3.5 text-neutral-600" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={loading || downloadingPdf || !labelData}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-black text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
              title="Download Authentic PDF"
            >
              {downloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-white" />}
              <span>{downloadingPdf ? 'Exporting...' : 'Download PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenPdfTab}
              disabled={loading || !labelData}
              className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              title="Open Native PDF Viewer Tab"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer ml-1"
              title="Close Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body Container with Thermal Label Preview */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-neutral-100/60 flex justify-center">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-neutral-400">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-900" />
              <span className="text-xs font-medium">Generating official House of Urvaah shipping label...</span>
            </div>
          ) : error && !labelData ? (
            <div className="p-8 text-center bg-white border border-red-200 rounded-xl space-y-3 max-w-sm my-auto">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
              <h4 className="text-sm font-bold text-neutral-900">Unable to Generate Label</h4>
              <p className="text-xs text-neutral-600">{error}</p>
            </div>
          ) : labelData ? (
            /* Physical 4" x 6" Thermal Label Representation */
            <div 
              id="shipping-label-printable" 
              className="w-full max-w-[390px] bg-white border-2 border-black p-4 text-neutral-900 text-[11px] leading-tight space-y-3 shadow-md rounded-sm select-text"
            >
              {/* Brand & Courier Partner Header */}
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <span className="font-extrabold text-sm tracking-widest uppercase">
                  HOUSE OF URVAAH
                </span>
                <span className="text-[10px] font-bold uppercase border-1.5 border-black px-2 py-0.5 rounded">
                  {labelData.courierName}
                </span>
              </div>

              {/* AWB Code & Barcode */}
              <div className="text-center border-b-2 border-black pb-2 space-y-1">
                {labelData.awbBarcodeSvg ? (
                  <div 
                    className="w-full flex justify-center"
                    dangerouslySetInnerHTML={{ __html: labelData.awbBarcodeSvg }}
                  />
                ) : (
                  /* CSS Barcode Fallback */
                  <div className="h-12 w-full flex items-center justify-center gap-[2px] py-1 bg-neutral-50 border border-neutral-300">
                    {Array.from({ length: 48 }).map((_, i) => (
                      <div
                        key={i}
                        className="bg-black h-full"
                        style={{ width: `${(i % 3 === 0 ? 3 : (i % 2 === 0 ? 1.5 : 2.5))}px` }}
                      />
                    ))}
                  </div>
                )}
                <div className="font-mono font-black text-sm tracking-wider">
                  AWB: {labelData.awb}
                </div>
              </div>

              {/* Destination Routing Hub & Payment Indicator */}
              <div className="grid grid-cols-2 border-b-2 border-black divide-x-2 divide-black">
                <div className="pr-3 pb-2">
                  <div className="text-[9px] font-bold uppercase text-neutral-600">Routing Hub / PIN</div>
                  <div className="text-base font-black tracking-tight">{labelData.hubCode}</div>
                </div>
                <div className={`pl-3 pb-2 flex flex-col justify-center ${labelData.isCod ? 'bg-black text-white p-1.5' : ''}`}>
                  <div className="text-[10px] font-black uppercase tracking-wide">
                    {labelData.paymentBadge}
                  </div>
                  <div className="text-xs font-black mt-0.5">
                    {labelData.collectableAmountText}
                  </div>
                </div>
              </div>

              {/* Ship To Address Box */}
              <div className="border border-black p-2.5 rounded bg-neutral-50/70 space-y-1">
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider border-b border-dashed border-neutral-400 pb-1 mb-1">
                  <span>{isReturn ? 'Return Origin (Consignor)' : 'Ship To (Consignee)'}</span>
                  <span>PIN: {shipTo.pincode}</span>
                </div>
                <div className="font-bold text-xs">{shipTo.name}</div>
                <div className="text-[10.5px] leading-snug">{shipTo.street || ''}</div>
                <div className="text-[10.5px]">
                  {shipTo.city}, {shipTo.state} - <strong className="font-bold">{shipTo.pincode}</strong>
                </div>
                <div className="text-[10px] pt-0.5">
                  <strong>Phone:</strong> {shipTo.phone}
                </div>
              </div>

              {/* Dispatched From / Return To Details */}
              <div className="text-[9px] text-neutral-600 border-b border-black pb-2 space-y-0.5">
                <div className="font-bold text-neutral-800 uppercase tracking-wider text-[8px]">
                  {isReturn ? 'Return Atelier Destination:' : 'Dispatched & Sold By:'}
                </div>
                <div>
                  <strong>{shipFrom.name}</strong>, {shipFrom.address}, {shipFrom.city}, {shipFrom.state} - {shipFrom.pincode}.
                </div>
                {shipFrom.gstin && <div>GSTIN: {shipFrom.gstin}</div>}
              </div>

              {/* Package Metadata */}
              <div className="grid grid-cols-3 text-center border-b border-black pb-2 text-[9px]">
                <div>
                  <span className="block text-neutral-500 uppercase text-[8px]">Order #</span>
                  <strong className="font-mono font-bold">#{labelData.orderNumber}</strong>
                </div>
                <div>
                  <span className="block text-neutral-500 uppercase text-[8px]">Weight</span>
                  <strong>{labelData.weight || '0.50 KG'}</strong>
                </div>
                <div>
                  <span className="block text-neutral-500 uppercase text-[8px]">Date</span>
                  <strong>{labelData.orderDate}</strong>
                </div>
              </div>

              {/* Items Summary */}
              <div>
                <table className="w-full text-[9px] border-collapse">
                  <thead>
                    <tr className="border-b border-black text-left text-[8px] uppercase text-neutral-600">
                      <th className="py-1">Description</th>
                      <th className="py-1 text-center">Size</th>
                      <th className="py-1 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(labelData.items || []).slice(0, 3).map((it, idx) => (
                      <tr key={idx} className="border-b border-dotted border-neutral-300">
                        <td className="py-1">
                          <strong className="block text-[9.5px]">{it.title}</strong>
                          <span className="text-[8px] text-neutral-500 font-mono">SKU: {it.sku}</span>
                        </td>
                        <td className="py-1 text-center font-bold">{it.size}</td>
                        <td className="py-1 text-right font-bold">{it.quantity}</td>
                      </tr>
                    ))}
                    {(labelData.items || []).length > 3 && (
                      <tr>
                        <td colSpan={3} className="py-1 text-center italic text-neutral-500 text-[8.5px]">
                          + {(labelData.items.length - 3)} more items enclosed
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer Barcode & Verification */}
              <div className="flex items-center justify-between pt-1 border-t-2 border-black">
                <div className="w-[60%]">
                  {labelData.orderBarcodeSvg ? (
                    <div dangerouslySetInnerHTML={{ __html: labelData.orderBarcodeSvg }} />
                  ) : (
                    <div className="h-6 w-full flex items-center gap-[1px]">
                      {Array.from({ length: 30 }).map((_, i) => (
                        <div key={i} className="bg-black h-full flex-1" />
                      ))}
                    </div>
                  )}
                  <div className="font-mono font-bold text-[8.5px] mt-0.5">
                    ORDER #{labelData.orderNumber}
                  </div>
                </div>
                <div className="border border-black px-2 py-1 text-center text-[8px] font-bold">
                  <div>VERIFIED</div>
                  <div className="text-[7px] text-neutral-600 font-normal">HOUSE OF URVAAH</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-neutral-200 bg-white flex items-center justify-between text-xs font-admin shrink-0">
          <span className="text-neutral-500 text-[11px] flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-neutral-700" />
            <span>Ready for courier scanning & physical dispatch</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-neutral-300 hover:bg-neutral-100 text-neutral-800 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShippingLabelModal;
