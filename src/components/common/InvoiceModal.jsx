import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  ExternalLink,
  Loader2,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { apiClient, getAuthToken, getAdminAuthToken } from '../../lib/apiClient';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';

export const InvoiceModal = ({ isOpen, onClose, order, orderId }) => {
  const targetId = order?.id || order?.order_number || orderId;

  // Lock background screen scroll while Invoice Modal is open
  useModalScrollLock(isOpen, onClose);

  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [error, setError] = useState(null);

  // Fetch or assemble invoice data
  useEffect(() => {
    if (!isOpen || !targetId) {
      setInvoiceData(null);
      setError(null);
      return;
    }

    let isMounted = true;
    const fetchInvoiceData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient(`/api/orders/${targetId}/invoice?format=json`);
        if (isMounted) {
          if (response?.success && response?.data) {
            setInvoiceData(response.data);
          } else {
            throw new Error('Invoice data not returned');
          }
        }
      } catch (err) {
        console.warn('Could not fetch rich JSON invoice, falling back to order props:', err);
        // Fallback: assemble from existing order props
        if (isMounted && order) {
          const items = (order.items || []).map((it, idx) => ({
            index: idx + 1,
            name: it.name || it.title || 'Haute Couture Ensemble',
            sku: it.product_id ? `URV-HC-${String(it.product_id).padStart(4, '0')}` : `URV-AT-${idx + 1}`,
            size: it.size || it.selectedSize || 'M',
            color: it.color || 'Signature Hue',
            hsn: '6204',
            quantity: it.quantity || 1,
            price: parseFloat(it.price || 0).toFixed(2),
            taxableValue: (parseFloat(it.price || 0) * (it.quantity || 1) / 1.18).toFixed(2),
            total: (parseFloat(it.price || 0) * (it.quantity || 1)).toFixed(2)
          }));

          const subtotal = parseFloat(order.subtotal || order.total || 0);
          const discountAmount = parseFloat(order.discount_amount || 0);
          const total = parseFloat(order.total || subtotal - discountAmount);
          const netTaxable = Math.max(0, subtotal - discountAmount);
          const taxAmount = (netTaxable * 0.18) / 1.18;
          const baseTaxable = netTaxable - taxAmount;

            const streetFallback = (order.full_address || order.address || order.shippingAddress?.address || order.shippingAddress?.street || order.shippingAddress?.addressLine1 || '').trim();
            const cityFallback = (order.city || order.shippingAddress?.city || '').trim();
            const stateFallback = (order.state || order.shippingAddress?.state || '').trim();
            const pincodeFallback = (order.postal_code || order.postalCode || order.shippingAddress?.pincode || order.shippingAddress?.postal_code || '').trim();
            const cityStatePinFallback = [cityFallback, stateFallback, pincodeFallback ? `PIN: ${pincodeFallback}` : ''].filter(Boolean).join(', ');
            const fullAddrFallback = streetFallback && cityStatePinFallback
              ? `${streetFallback}, ${cityStatePinFallback}`
              : (streetFallback || cityStatePinFallback || 'India');

            const customerNameFallback = order.recipient_name 
              || (order.customer_name && !order.customer_name.includes('@') ? order.customer_name : null)
              || order.fullname 
              || (order.shippingAddress ? `${order.shippingAddress.firstName || order.shippingAddress.name || ''} ${order.shippingAddress.lastName || ''}`.trim() : null)
              || (order.user_id && !order.user_id.includes('@') ? order.user_id : 'Valued Client');

            setInvoiceData({
              currencySymbol: '₹',
              invoiceNumber: `URV-INV-${order.order_number || targetId}`,
              orderNumber: order.order_number || targetId,
              orderDate: new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
              }),
              issueDate: new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'long', year: 'numeric'
              }),
              placeOfSupply: order.state || order.shippingAddress?.state || 'Delhi, India',
              stateCode: '07 (Delhi)',
              userName: customerNameFallback,
              userStreet: streetFallback,
              userCityStatePin: cityStatePinFallback,
              userAddress: fullAddrFallback,
              userPhone: order.recipient_phone || order.customer_phone || order.phone || order.shippingAddress?.phone || 'N/A',
              userEmail: order.customer_email || order.email || 'concierge@houseofurvaah.com',
            paymentMethod: String(order.payment_method || 'Online').toUpperCase(),
            paymentStatus: String(order.payment_status || 'Paid').toUpperCase(),
            isPaid: String(order.payment_status || '').toLowerCase() === 'paid',
            paymentReference: order.razorpay_payment_id || `TXN-${String(targetId).slice(0, 8).toUpperCase()}`,
            items,
            totalItemsCount: items.reduce((acc, it) => acc + it.quantity, 0),
            subtotal: subtotal.toFixed(2),
            baseTaxableValue: baseTaxable.toFixed(2),
            shippingFeeText: 'Complimentary White-Glove (₹0.00)',
            hasDiscount: discountAmount > 0,
            couponCode: order.coupon_code || '',
            discountAmount: discountAmount.toFixed(2),
            discountLabel: order.coupon_code ? `Promotional Privilege (${order.coupon_code})` : 'Privilege Savings',
            isInterState: false,
            cgstRate: 9,
            sgstRate: 9,
            cgstAmount: (taxAmount / 2).toFixed(2),
            sgstAmount: (taxAmount / 2).toFixed(2),
            taxAmount: taxAmount.toFixed(2),
            grandTotal: total.toFixed(2),
            amountInWords: `Rupees ${Math.round(total).toLocaleString('en-IN')} Only`,
            authSignatoryDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
          });
        } else {
          setError(err.message || 'Failed to load invoice information');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInvoiceData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, targetId, order]);

  // Handle direct PDF Download
  const handleDownloadPdf = async () => {
    if (!targetId || downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      const API_BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
      const token = getAdminAuthToken() || getAuthToken();

      const response = await fetch(`${API_BASE}/api/orders/${targetId}/invoice`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to download invoice (status: ${response.status})`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `HOUSE_OF_URVAAH_INVOICE_${invoiceData?.orderNumber || targetId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF Download failed:', err);
      // Fallback: open print dialog
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Open HTML invoice in dedicated full tab
  const handleOpenNewWindow = () => {
    const API_BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
    const token = getAdminAuthToken() || getAuthToken();
    const invoiceUrl = `${API_BASE}/api/orders/${targetId}/invoice?format=html${token ? `&token=${token}` : ''}`;
    window.open(invoiceUrl, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto overscroll-contain"
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      {/* Dynamic print-isolation styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #urvaah-invoice-print-area, #urvaah-invoice-print-area * {
            visibility: visible !important;
          }
          #urvaah-invoice-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-4xl bg-neutral-100 rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden my-auto max-h-[92vh] flex flex-col font-sans">
        
        {/* Top Control Bar */}
        <div className="bg-neutral-900 text-white px-5 py-3.5 flex items-center justify-between gap-4 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-serif font-bold text-xs">
              U
            </div>
            <div>
              <h3 className="font-serif text-xs sm:text-sm font-semibold tracking-[0.12em] uppercase text-white truncate">
                House of Urvaah &bull; Official Tax Invoice
              </h3>
              <p className="text-[10px] text-neutral-400 tracking-wider">
                Order #{invoiceData?.orderNumber || targetId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition cursor-pointer border border-neutral-700 disabled:opacity-50"
              title="Print Invoice directly to printer or save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={loading || downloadingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#C5A880] hover:bg-[#b5966c] text-neutral-950 text-xs font-bold transition cursor-pointer disabled:opacity-50 shadow-xs"
              title="Download vector PDF file"
            >
              {downloadingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Download PDF</span>
            </button>

            <button
              type="button"
              onClick={handleOpenNewWindow}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
              title="Open full page invoice"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition ml-1"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-[#f5f4ef] flex justify-center">
          {loading ? (
            <div className="py-24 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-700 mx-auto mb-3" />
              <p className="text-xs uppercase tracking-widest text-neutral-500 font-serif">
                Compiling Haute Couture Tax Invoice...
              </p>
            </div>
          ) : error && !invoiceData ? (
            <div className="py-20 text-center max-w-md">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
              <h4 className="font-serif text-base text-neutral-900 mb-1">Invoice Generation Notice</h4>
              <p className="text-xs text-neutral-600 mb-4">{error}</p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs uppercase tracking-wider font-semibold"
              >
                Close
              </button>
            </div>
          ) : (
            /* Authoritative Haute Couture Printable Invoice Document */
            <div
              id="urvaah-invoice-print-area"
              className="w-full max-w-[780px] bg-white border border-[#e5dfd5] p-6 sm:p-10 rounded-sm shadow-md text-neutral-900 text-xs relative"
              style={{
                boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
              }}
            >
              {/* Inner Gold Filigree Border Accent */}
              <div
                className="absolute inset-1.5 pointer-events-none rounded-xs border border-[#C5A880]/20"
                style={{ zIndex: 1 }}
              />

              {/* Header: Brand & Tax Invoice Title */}
              <div className="flex flex-col sm:flex-row items-start justify-between pb-5 border-b-2 border-neutral-950 gap-4 relative z-10">
                <div className="flex items-center gap-3.5">
                  <img
                    src="/assets/logo.png"
                    alt="House of Urvaah Logo"
                    className="h-14 sm:h-16 w-auto object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div>
                    <h1 className="font-serif text-lg sm:text-2xl font-bold tracking-[0.16em] uppercase text-neutral-950 leading-tight">
                      House of Urvaah
                    </h1>
                    <p className="font-serif text-[8.5px] sm:text-[9.5px] tracking-[0.25em] text-[#8c734b] uppercase font-semibold mt-0.5">
                      Haute Couture &bull; Luxury Pret Atelier
                    </p>
                  </div>
                </div>

                <div className="sm:text-right">
                  <div className="font-serif text-xl sm:text-2xl font-bold tracking-[0.1em] uppercase text-neutral-950 leading-tight">
                    Tax Invoice
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-neutral-500 mt-0.5">
                    Original for Recipient &bull; Rule 48 CGST
                  </div>
                </div>
              </div>

              {/* Metadata Banner Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-[#faf8f5] border border-[#eee8df] rounded-sm p-3 my-5 relative z-10">
                <div>
                  <span className="text-[8.5px] font-semibold uppercase tracking-wider text-[#8a8278] block">
                    Invoice No.
                  </span>
                  <span className="font-bold text-[11px] text-neutral-950 block mt-0.5">
                    {invoiceData?.invoiceNumber}
                  </span>
                </div>
                <div>
                  <span className="text-[8.5px] font-semibold uppercase tracking-wider text-[#8a8278] block">
                    Order Ref
                  </span>
                  <span className="font-bold text-[11px] text-neutral-950 block mt-0.5">
                    #{invoiceData?.orderNumber}
                  </span>
                </div>
                <div>
                  <span className="text-[8.5px] font-semibold uppercase tracking-wider text-[#8a8278] block">
                    Client / Patron
                  </span>
                  <span className="font-bold text-[11px] text-[#8c734b] block mt-0.5 truncate">
                    {invoiceData?.userName || 'Valued Client'}
                  </span>
                </div>
                <div>
                  <span className="text-[8.5px] font-semibold uppercase tracking-wider text-[#8a8278] block">
                    Date of Issue
                  </span>
                  <span className="font-bold text-[11px] text-neutral-950 block mt-0.5">
                    {invoiceData?.issueDate}
                  </span>
                </div>
                <div>
                  <span className="text-[8.5px] font-semibold uppercase tracking-wider text-[#8a8278] block">
                    Place of Supply
                  </span>
                  <span className="font-bold text-[11px] text-neutral-950 block mt-0.5">
                    {invoiceData?.placeOfSupply}
                  </span>
                </div>
              </div>

              {/* Dossier: Atelier Details vs Customer Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 relative z-10">
                <div className="border border-[#eee8df] rounded-sm p-3.5 bg-white">
                  <div className="font-serif text-[9px] font-bold tracking-widest uppercase text-[#8c734b] pb-1.5 mb-2 border-b border-[#f2ede4] flex justify-between">
                    <span>Sold By &bull; Registered Atelier</span>
                    <span>GSTIN / CIN</span>
                  </div>
                  <div className="font-serif text-xs font-bold text-neutral-950 mb-1">
                    House of Urvaah Private Limited
                  </div>
                  <div className="text-[10px] text-neutral-600 leading-relaxed">
                    Ground Floor, Luxury Fashion Enclave, Mehrauli-Gurgaon Road<br />
                    New Delhi, 110030, India<br />
                    <strong>GSTIN:</strong> 07AAECH9988K1Z3 &bull; <strong>State:</strong> 07 (Delhi)<br />
                    <strong>CIN:</strong> U18101DL2024PTC123456<br />
                    <span className="text-neutral-500 pt-1 block">
                      <strong>Concierge:</strong> concierge@houseofurvaah.com
                    </span>
                  </div>
                </div>

                <div className="border border-[#eee8df] rounded-sm p-3.5 bg-white">
                  <div className="font-serif text-[9px] font-bold tracking-widest uppercase text-[#8c734b] pb-1.5 mb-2 border-b border-[#f2ede4] flex justify-between">
                    <span>Billed &amp; Shipped To &bull; Client</span>
                    <span>Order Dispatch</span>
                  </div>
                  <div className="font-serif text-xs font-bold text-neutral-950 mb-1">
                    {invoiceData?.userName || 'Valued Client'}
                  </div>
                  <div className="text-[10px] text-neutral-600 leading-relaxed">
                    {invoiceData?.userStreet ? (
                      <>
                        {invoiceData.userStreet}<br />
                        {invoiceData.userCityStatePin && (
                          <>{invoiceData.userCityStatePin}<br /></>
                        )}
                      </>
                    ) : (
                      <>{invoiceData?.userAddress || 'Address on record'}<br /></>
                    )}
                    <strong>Contact:</strong> {invoiceData?.userPhone || 'N/A'}<br />
                    <strong>Email:</strong> {invoiceData?.userEmail || 'N/A'}<br />
                    <span className="text-neutral-500 pt-1 block">
                      <strong>Payment Mode:</strong> {invoiceData?.paymentMethod || 'Online'} &bull; <strong>Ref:</strong> {invoiceData?.paymentReference || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Garment Line Items Table */}
              <div className="border border-[#eee8df] rounded-sm overflow-hidden mb-5 relative z-10">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-950 text-white font-serif text-[8.5px] tracking-widest uppercase">
                      <th className="py-2.5 px-3 text-center w-8">#</th>
                      <th className="py-2.5 px-3">Couture Item Description</th>
                      <th className="py-2.5 px-3 text-center w-24">Size / Specs</th>
                      <th className="py-2.5 px-3 text-center w-14">Qty</th>
                      <th className="py-2.5 px-3 text-right w-24">Unit Rate</th>
                      <th className="py-2.5 px-3 text-right w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eee8df]">
                    {invoiceData?.items?.map((item) => (
                      <tr key={item.index} className="hover:bg-[#fcfbf9] transition-colors">
                        <td className="py-2.5 px-3 text-center font-bold text-[#8c734b] text-[10px]">
                          {item.index}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-serif font-semibold text-[11px] text-neutral-900 leading-tight">
                            {item.name}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium text-[9.5px]">
                          {item.size}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-neutral-900">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right text-neutral-700">
                          ₹{Number(item.price).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-neutral-950">
                          ₹{Number(item.total).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculations & GST Ledger */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 mb-5 relative z-10">
                {/* Left Column (7 cols): In Words, Tax Analysis, Bank Details */}
                <div className="sm:col-span-7 space-y-3">
                  {/* Amount in words */}
                  <div className="bg-[#faf8f5] border border-[#eee8df] border-l-3 border-l-[#c5a880] rounded-sm p-3">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-[#8c734b] block">
                      Amount Chargeable (in words)
                    </span>
                    <span className="font-serif italic font-semibold text-neutral-950 text-xs mt-0.5 block">
                      {invoiceData?.amountInWords}
                    </span>
                  </div>

                  {/* GST Tax Breakdown */}
                  <div className="border border-[#eee8df] rounded-sm p-3 bg-white text-[9.5px]">
                    <div className="font-serif text-[8.5px] font-bold uppercase tracking-widest text-[#8c734b] pb-1 mb-1.5 border-b border-[#f2ede4]">
                      GST Tax Analysis Breakdown
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-neutral-600">
                        <span>Taxable Value (Net):</span>
                        <span className="font-semibold text-neutral-900">₹{Number(invoiceData?.baseTaxableValue || 0).toLocaleString('en-IN')}</span>
                      </div>
                      {invoiceData?.isInterState ? (
                        <div className="flex justify-between text-neutral-600">
                          <span>Integrated GST (IGST @ 18%):</span>
                          <span className="font-semibold text-neutral-900">₹{Number(invoiceData?.igstAmount || 0).toLocaleString('en-IN')}</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between text-neutral-600">
                            <span>Central GST (CGST @ 9%):</span>
                            <span className="font-semibold text-neutral-900">₹{Number(invoiceData?.cgstAmount || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-neutral-600">
                            <span>State GST (SGST @ 9%):</span>
                            <span className="font-semibold text-neutral-900">₹{Number(invoiceData?.sgstAmount || 0).toLocaleString('en-IN')}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between pt-1 border-t border-[#eee8df] font-bold text-neutral-950">
                        <span>Total Tax Collected:</span>
                        <span>₹{Number(invoiceData?.taxAmount || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="border border-dashed border-[#d9d2c5] rounded-sm p-2.5 bg-[#fbfaf8] text-[9px] text-neutral-600 leading-relaxed">
                    <span className="font-serif font-bold uppercase tracking-widest text-neutral-950 block mb-0.5">
                      Atelier Remittance Reference
                    </span>
                    Beneficiary: <strong>HOUSE OF URVAAH PRIVATE LIMITED</strong> &bull; Bank: HDFC Bank Ltd<br />
                    Account: 50200088923412 &bull; IFSC: HDFC0000123 &bull; Branch: Mehrauli, New Delhi
                  </div>
                </div>

                {/* Right Column (5 cols): Itemized Charges & Grand Total */}
                <div className="sm:col-span-5">
                  <div className="border border-[#eee8df] rounded-sm overflow-hidden bg-white">
                    <div className="divide-y divide-[#f2ede4] text-[10.5px]">
                      <div className="flex justify-between p-2.5 text-neutral-700">
                        <span>Gross Subtotal</span>
                        <span className="font-semibold text-neutral-900">₹{Number(invoiceData?.subtotal || 0).toLocaleString('en-IN')}</span>
                      </div>

                      {invoiceData?.hasDiscount && (
                        <div className="flex justify-between p-2.5 bg-[#fdfaf5] text-amber-900">
                          <div>
                            <span className="font-semibold block">{invoiceData?.discountLabel}</span>
                            <span className="text-[8px] uppercase tracking-wider text-amber-700">Coupon: {invoiceData?.couponCode}</span>
                          </div>
                          <span className="font-bold">-₹{Number(invoiceData?.discountAmount || 0).toLocaleString('en-IN')}</span>
                        </div>
                      )}

                      <div className="flex justify-between p-2.5 text-neutral-700">
                        <span>Insured White-Glove Shipping</span>
                        <span className="font-semibold text-emerald-800">FREE (₹0.00)</span>
                      </div>

                      <div className="flex justify-between p-2.5 text-neutral-700">
                        <span>Applicable GST (18% Incl.)</span>
                        <span className="font-semibold text-neutral-900">₹{Number(invoiceData?.taxAmount || 0).toLocaleString('en-IN')}</span>
                      </div>

                      {/* Grand Total Black Card */}
                      <div className="bg-neutral-950 text-white p-3.5 flex items-center justify-between">
                        <div>
                          <span className="font-serif text-[10px] font-bold uppercase tracking-[0.16em] text-[#e5cfab] block">
                            Grand Total
                          </span>
                          <span className="text-[7.5px] uppercase tracking-wider text-neutral-400 block mt-0.5">
                            Incl. of all taxes
                          </span>
                        </div>
                        <div className="font-serif text-lg sm:text-xl font-bold text-white tracking-wider">
                          ₹{Number(invoiceData?.grandTotal || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Digital Seal & Authorized Signatory Block */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#eee8df] items-center relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-[#c5a880] flex items-center justify-center font-serif font-bold text-[#c5a880] text-sm shrink-0 bg-[#faf8f5]">
                    U
                  </div>
                  <div className="text-[9px] text-neutral-600 leading-snug">
                    <strong className="text-neutral-900 font-serif uppercase tracking-wider block">
                      Digitally Verified Atelier Invoice
                    </strong>
                    Issued under IT Act 2000 &amp; Central Goods and Services Tax Rules. No manual signature required.
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="font-serif text-[8.5px] uppercase tracking-widest text-neutral-500 block mb-0.5">
                    For House of Urvaah Private Limited
                  </span>
                  <div className="font-serif italic text-base sm:text-lg text-neutral-950 leading-tight">
                    House of Urvaah Atelier
                  </div>
                  <span className="text-[8px] uppercase tracking-widest text-neutral-500 font-bold border-t border-[#e0dad0] pt-0.5 inline-block mt-0.5">
                    Authorized Signatory &bull; {invoiceData?.authSignatoryDate}
                  </span>
                </div>
              </div>

              {/* Footer Notice & Registered Address */}
              <div className="mt-5 pt-3 border-t-2 border-neutral-950 text-center text-[8.5px] text-neutral-500 leading-relaxed relative z-10">
                <p className="mb-0.5 text-neutral-600">
                  Each House of Urvaah couture piece is tailored with meticulous atelier craftsmanship. Unworn pieces with intact security tags and original packaging are eligible for return/exchange within 7 days of delivery under our Atelier Care Policy.
                </p>
                <p className="font-serif text-[7.5px] uppercase tracking-widest text-[#8c734b] font-semibold">
                  House of Urvaah &bull; Ground Floor, Luxury Fashion Enclave, Mehrauli-Gurgaon Road, New Delhi, 110030 &bull; www.houseofurvaah.com
                </p>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default InvoiceModal;
