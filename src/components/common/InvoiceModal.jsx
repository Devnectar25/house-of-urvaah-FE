import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Printer,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { apiClient, getAuthToken, getAdminAuthToken } from '../../lib/apiClient';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import { printElement } from '../../utils/printHelper';

const numberToWords = (num) => {
  if (!num || isNaN(num) || Number(num) <= 0) return 'Rupees Zero Only';
  const amount = Math.round(Number(num));
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const convertChunk = (n) => {
    let str = '';
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '') + ' ';
    } else if (n > 0) {
      str += ones[n] + ' ';
    }
    return str;
  };
  let result = '';
  const crores = Math.floor(amount / 10000000);
  const lakhs = Math.floor((amount % 10000000) / 100000);
  const thousands = Math.floor((amount % 100000) / 1000);
  const hundreds = Math.floor(amount % 1000);
  if (crores > 0) result += convertChunk(crores) + 'Crore ';
  if (lakhs > 0) result += convertChunk(lakhs) + 'Lakh ';
  if (thousands > 0) result += convertChunk(thousands) + 'Thousand ';
  if (hundreds > 0) result += convertChunk(hundreds);
  const formatted = result.replace(/\s+/g, ' ').trim();
  return formatted ? `Rupees ${formatted} Only` : 'Rupees Zero Only';
};

export const InvoiceModal = ({ isOpen, onClose, order, orderId }) => {
  const targetId = order?.id || order?.order_number || orderId;
  const printAreaRef = useRef(null);

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

      // End users / customers may only access invoices once delivered
      const isAdmin = Boolean(getAdminAuthToken());
      const orderStatusStr = String(order?.status || '').toLowerCase();
      const origStatusStr = String(order?.original_status || '').toLowerCase();
      const isDelivered = orderStatusStr.includes('delivered') || origStatusStr.includes('delivered') || Boolean(order?.delivered_at || order?.deliveredAt);

      if (order && !isAdmin && !isDelivered) {
        if (isMounted) {
          setError('Official tax invoice is only accessible once your order or replacement piece has been delivered.');
          setLoading(false);
        }
        return;
      }

      try {
        const response = await apiClient(`/api/orders/${targetId}/invoice?format=json`);
        if (isMounted) {
          if (response?.success && response?.data) {
            const data = { ...response.data };
            if (data.invoiceNumber) {
              const stripped = data.invoiceNumber.replace(/^HOU-/, '');
              const fyMatch = stripped.match(/^(\d{2})?(\d{2})-(\d{2})(\d{2})(\d+)$/);
              if (fyMatch) {
                const sYr2 = fyMatch[2];
                const eYr2 = fyMatch[3];
                const moStr = fyMatch[4];
                const seq = fyMatch[5];
                data.invoiceNumber = `${sYr2}${eYr2}${moStr}${seq.length === 1 ? '0' + seq : seq}`;
              } else {
                const match = stripped.match(/^(\d{4})(\d{2})(\d+)$/);
                if (match) {
                  const rawYr = parseInt(match[1], 10);
                  const rawMo = parseInt(match[2], 10);
                  const rawSeq = parseInt(match[3], 10);
                  const rawSYr = rawMo >= 4 ? rawYr : rawYr - 1;
                  const rawEYr = rawMo >= 4 ? rawYr + 1 : rawYr;
                  const sYr2 = String(rawSYr % 100).padStart(2, '0');
                  const eYr2 = String(rawEYr % 100).padStart(2, '0');
                  data.invoiceNumber = `${sYr2}${eYr2}${String(rawMo).padStart(2, '0')}${String(rawSeq).padStart(2, '0')}`;
                } else {
                  data.invoiceNumber = stripped;
                }
              }
            }
            data.placeOfSupply = 'Mumbai, India';
            data.orderNumber = data.orderNumber || data.orderId || order?.order_number || targetId;
            setInvoiceData(data);
          } else {
            throw new Error('Invoice data not returned');
          }
        }
      } catch (err) {
        // The API decides invoice eligibility: a refusal must never be bypassed by the local fallback
        if (err.status === 401 || err.status === 403 || (err.message && err.message.toLowerCase().includes('delivered'))) {
          if (isMounted) {
            setError(err.message);
            setLoading(false);
          }
          return;
        }
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
            taxableValue: (parseFloat(it.price || 0) * (it.quantity || 1)).toFixed(2),
            total: (parseFloat(it.price || 0) * (it.quantity || 1)).toFixed(2)
          }));

          const subtotal = parseFloat(order.subtotal || order.total || 0);
          const discountAmount = parseFloat(order.discount_amount || 0);
          const netTaxable = Math.max(0, subtotal - discountAmount);
          const taxAmount = netTaxable * 0.18;
          const baseTaxable = netTaxable;
          const total = baseTaxable + taxAmount;

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

            const orderDateObj = new Date(order.created_at || Date.now());
            const year = orderDateObj.getFullYear();
            const month = orderDateObj.getMonth() + 1;
            const sYr = month >= 4 ? year : year - 1;
            const eYr = month >= 4 ? year + 1 : year;
            const sYr2 = String(sYr % 100).padStart(2, '0');
            const eYr2 = String(eYr % 100).padStart(2, '0');
            const fallbackFy = `${sYr2}${eYr2}`;
            const fallbackMo = String(month).padStart(2, '0');
            const fallbackDigits = String(order.id || order.order_number || targetId || '').replace(/\D/g, '');
            const fallbackSeq = fallbackDigits ? parseInt(fallbackDigits.slice(-2), 10) || 1 : 1;
            const fallbackSeqStr = String(fallbackSeq).padStart(2, '0');

            let resolvedInvoiceNumber = order.invoice_number;
            if (resolvedInvoiceNumber) {
              const stripped = resolvedInvoiceNumber.replace(/^HOU-/, '');
              const fyMatch = stripped.match(/^(\d{2})?(\d{2})-(\d{2})(\d{2})(\d+)$/);
              if (fyMatch) {
                const sYr2m = fyMatch[2];
                const eYr2m = fyMatch[3];
                const moStrm = fyMatch[4];
                const seqm = fyMatch[5];
                resolvedInvoiceNumber = `${sYr2m}${eYr2m}${moStrm}${seqm.length === 1 ? '0' + seqm : seqm}`;
              } else {
                const match = stripped.match(/^(\d{4})(\d{2})(\d+)$/);
                if (match) {
                  const rawYr = parseInt(match[1], 10);
                  const rawMo = parseInt(match[2], 10);
                  const rawSeq = parseInt(match[3], 10);
                  const rawSYr = rawMo >= 4 ? rawYr : rawYr - 1;
                  const rawEYr = rawMo >= 4 ? rawYr + 1 : rawYr;
                  const s2 = String(rawSYr % 100).padStart(2, '0');
                  const e2 = String(rawEYr % 100).padStart(2, '0');
                  resolvedInvoiceNumber = `${s2}${e2}${String(rawMo).padStart(2, '0')}${String(rawSeq).padStart(2, '0')}`;
                } else if (/^\d{8,}$/.test(stripped)) {
                  resolvedInvoiceNumber = stripped;
                } else {
                  resolvedInvoiceNumber = `${fallbackFy}${fallbackMo}${fallbackSeqStr}`;
                }
              }
            } else {
              resolvedInvoiceNumber = `${fallbackFy}${fallbackMo}${fallbackSeqStr}`;
            }

            setInvoiceData({
              currencySymbol: '₹',
              invoiceNumber: resolvedInvoiceNumber,
              orderNumber: order.order_number || targetId,
              orderDate: new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
              }),
              issueDate: new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'long', year: 'numeric'
              }),
              placeOfSupply: 'Mumbai, India',
              stateCode: '27 (Maharashtra)',
              userName: customerNameFallback,
              userStreet: streetFallback,
              userCityStatePin: cityStatePinFallback,
              userAddress: fullAddrFallback,
              userPhone: order.recipient_phone || order.customer_phone || order.phone || order.shippingAddress?.phone || 'N/A',
              userEmail: order.customer_email || order.email || 'houseofurvaah@gmail.com',
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
            amountInWords: numberToWords(total),
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

  // Dedicated reliable print handler using isolated iframe
  const handlePrint = () => {
    if (!printAreaRef.current) {
      window.print();
      return;
    }

    const invNum = (invoiceData?.invoiceNumber || targetId || 'INVOICE').replace(/[^a-zA-Z0-9_-]/g, '_');

    printElement(printAreaRef.current, {
      title: `TAX_INVOICE_${invNum}`,
      pageStyle: `
        @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,500;0,700;0,900;1,300;1,400;1,500;1,700&display=swap');

        @page {
          size: A4 portrait;
          margin: 10mm 12mm;
        }

        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
          box-sizing: border-box !important;
        }

        html, body {
          width: 100% !important;
          height: auto !important;
          min-height: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          overflow: visible !important;
          font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif !important;
        }

        #urvaah-invoice-print-area {
          position: relative !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 auto !important;
          padding: 20px 24px !important;
          box-shadow: none !important;
          border: 1px solid #dfd7cb !important;
          background: #ffffff !important;
          visibility: visible !important;
          page-break-inside: auto !important;
        }

        #urvaah-invoice-print-area * {
          visibility: visible !important;
          font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif !important;
        }

        .invoice-gold-border {
          display: none !important;
        }

        .invoice-header-strip {
          display: flex !important;
          flex-direction: row !important;
          justify-content: space-between !important;
          align-items: flex-start !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        .invoice-meta-banner {
          display: grid !important;
          grid-template-columns: repeat(5, 1fr) !important;
          gap: 6px !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        .invoice-dossier-grid {
          display: grid !important;
          grid-template-columns: repeat(2, 1fr) !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        .invoice-items-table {
          page-break-inside: auto !important;
          break-inside: auto !important;
        }

        .invoice-totals-grid {
          display: grid !important;
          grid-template-columns: 7fr 5fr !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        .invoice-signature-block {
          display: grid !important;
          grid-template-columns: repeat(2, 1fr) !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        table {
          width: 100% !important;
          table-layout: auto !important;
          page-break-inside: auto !important;
        }

        thead {
          display: table-header-group !important;
        }

        tr {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
      `
    });
  };

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
      link.download = `HOUSE_OF_URVAAH_INVOICE_${invoiceData?.invoiceNumber || targetId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF Download failed:', err);
      // Fallback: open isolated print dialog
      handlePrint();
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
      className="invoice-modal-overlay fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto overscroll-contain no-scrollbar scrollbar-none"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      {/* Dynamic print-isolation and Roboto font styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,500;0,700;0,900;1,300;1,400;1,500;1,700&display=swap');

        .invoice-font-roboto,
        .invoice-font-roboto *,
        #urvaah-invoice-print-area,
        #urvaah-invoice-print-area * {
          font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif !important;
        }

        .invoice-modal-overlay,
        .invoice-modal-scroll {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }

        .invoice-modal-overlay::-webkit-scrollbar,
        .invoice-modal-scroll::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          background: transparent !important;
        }

        @media print {
          html, body {
            overflow: visible !important;
            height: auto !important;
            min-height: auto !important;
            position: static !important;
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          body * {
            visibility: hidden !important;
          }

          .invoice-modal-overlay,
          .invoice-modal-dialog,
          .invoice-modal-scroll {
            position: static !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            transform: none !important;
          }

          .invoice-modal-control-bar {
            display: none !important;
          }

          #urvaah-invoice-print-area,
          #urvaah-invoice-print-area * {
            visibility: visible !important;
            font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          #urvaah-invoice-print-area {
            position: relative !important;
            left: auto !important;
            top: auto !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 20px 24px !important;
            box-shadow: none !important;
            border: 1px solid #dfd7cb !important;
            background: #ffffff !important;
          }

          .invoice-gold-border {
            display: none !important;
          }

          .invoice-header-strip {
            display: flex !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: flex-start !important;
          }

          .invoice-meta-banner {
            display: grid !important;
            grid-template-columns: repeat(5, 1fr) !important;
            gap: 6px !important;
          }

          .invoice-dossier-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
          }

          .invoice-totals-grid {
            display: grid !important;
            grid-template-columns: 7fr 5fr !important;
          }

          .invoice-signature-block {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
          }

          table {
            page-break-inside: auto !important;
          }

          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      <div
        className="invoice-modal-dialog relative w-full max-w-4xl bg-neutral-100 rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden my-auto max-h-[92vh] flex flex-col invoice-font-roboto"
        style={{ fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Control Bar */}
        <div className="invoice-modal-control-bar bg-neutral-900 text-white px-5 py-3.5 flex items-center justify-between gap-4 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold text-xs">
              U
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-semibold tracking-[0.12em] uppercase text-white truncate">
                House of Urvaah &bull; Official Tax Invoice
              </h3>
              <p className="text-[10px] text-neutral-400 tracking-wider">
                {invoiceData?.invoiceNumber
                  ? `Invoice #${invoiceData.invoiceNumber} • Order #${invoiceData?.orderNumber || targetId}`
                  : `Order #${invoiceData?.orderNumber || targetId}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
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
              onClick={(e) => {
                e.stopPropagation();
                onClose?.();
              }}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition ml-1"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div
          className="invoice-modal-scroll overflow-y-auto no-scrollbar scrollbar-none p-4 sm:p-8 bg-[#f5f4ef] flex justify-center"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {loading ? (
            <div className="py-24 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-700 mx-auto mb-3" />
              <p className="text-xs uppercase tracking-widest text-neutral-500 font-medium">
                Compiling Haute Couture Tax Invoice...
              </p>
            </div>
          ) : error && !invoiceData ? (
            <div className="py-20 text-center max-w-md">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
              <h4 className="text-base font-semibold text-neutral-900 mb-1">Invoice Generation Notice</h4>
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
              ref={printAreaRef}
              className="w-full max-w-[840px] bg-white border border-[#dfd7cb] p-6 sm:p-12 rounded-sm shadow-xl text-neutral-900 text-xs relative"
              style={{
                fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
                boxShadow: '0 12px 40px rgba(0,0,0,0.06)'
              }}
            >
              {/* Inner Gold Filigree Border Accent */}
              <div
                className="invoice-gold-border absolute inset-2 pointer-events-none rounded-xs border border-[#C5A880]/30"
                style={{ zIndex: 1 }}
              />

              {/* Header: Brand Logo & Tax Invoice Title */}
              <div className="invoice-header-strip flex flex-col sm:flex-row items-start justify-between pb-6 border-b-2 border-[#141414] gap-4 relative z-10">
                <div className="flex flex-col items-start gap-1.5">
                  <img
                    src="/assets/logo.png"
                    alt="House of Urvaah"
                    className="h-14 sm:h-18 w-auto object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <p className="text-[9px] sm:text-[10px] tracking-[0.28em] text-[#8c734b] uppercase font-semibold">
                    Haute Couture &bull; Luxury Pret Store &bull; New Delhi
                  </p>
                </div>

                <div className="sm:text-right pt-[20px]" style={{ paddingTop: '20px' }}>
                  <div className="text-2xl sm:text-3xl font-bold tracking-[0.14em] uppercase text-neutral-950 leading-tight">
                    Tax Invoice
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-neutral-500 mt-1">
                    Original for Recipient
                  </div>
                </div>
              </div>

              {/* Metadata Banner Strip */}
              <div className="invoice-meta-banner grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 bg-[#faf8f5] border border-[#eae3d8] rounded-md p-4 my-6 relative z-10">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#8c734b] block">
                    Invoice No.
                  </span>
                  <span className="font-bold text-xs sm:text-[13px] text-neutral-950 block mt-1">
                    {invoiceData?.invoiceNumber}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#8c734b] block">
                    Order Number
                  </span>
                  <span className="font-bold text-xs sm:text-[13px] text-neutral-950 block mt-1">
                    {invoiceData?.orderNumber || targetId}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#8c734b] block">
                    Client / Patron
                  </span>
                  <span className="font-bold text-xs sm:text-[13px] text-[#8c734b] block mt-1 truncate">
                    {invoiceData?.userName || 'Valued Client'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#8c734b] block">
                    Date of Issue
                  </span>
                  <span className="font-bold text-xs sm:text-[13px] text-neutral-950 block mt-1">
                    {invoiceData?.issueDate}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#8c734b] block">
                    Place of Supply
                  </span>
                  <span className="font-bold text-xs sm:text-[13px] text-neutral-950 block mt-1">
                    {invoiceData?.placeOfSupply}
                  </span>
                </div>
              </div>

              {/* Dossier: Store Details vs Customer Details */}
              <div className="invoice-dossier-grid grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6 relative z-10">
                <div className="border border-[#eae3d8] rounded-md p-4 sm:p-5 bg-[#fcfbfa]">
                  <div className="text-[9.5px] font-bold tracking-widest uppercase text-[#8c734b] pb-2 mb-2.5 border-b border-[#efe8df] flex justify-between">
                    <span>Sold By &bull; Registered Store</span>
                    <span>Customer Care</span>
                  </div>
                  <div className="text-[13px] font-bold text-neutral-950 mb-1.5">
                    House of Urvaah Private Limited
                  </div>
                  <div className="text-[10.5px] text-neutral-600 leading-relaxed">
                    Mumbai 400070, Maharashtra, India<br />
                    <strong>Email:</strong> houseofurvaah@gmail.com
                  </div>
                </div>

                <div className="border border-[#eae3d8] rounded-md p-4 sm:p-5 bg-[#fcfbfa]">
                  <div className="text-[9.5px] font-bold tracking-widest uppercase text-[#8c734b] pb-2 mb-2.5 border-b border-[#efe8df] flex justify-between">
                    <span>Billed &amp; Shipped To &bull; Client</span>
                    <span>Order Dispatch</span>
                  </div>
                  <div className="text-[13px] font-bold text-neutral-950 mb-1.5">
                    {invoiceData?.userName || 'Valued Client'}
                  </div>
                  <div className="text-[10.5px] text-neutral-600 leading-relaxed">
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
                    <span className="text-neutral-500 pt-1.5 block">
                      <strong>Order No:</strong> {invoiceData?.orderNumber || targetId} &bull; <strong>Payment Mode:</strong> {invoiceData?.paymentMethod || 'Online'} &bull; <strong>Ref:</strong> {invoiceData?.paymentReference || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Garment Line Items Table */}
              <div className="invoice-items-table border border-[#141414] rounded-md overflow-hidden mb-6 relative z-10 shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#141414] text-[#f7f4ee] text-[9.5px] tracking-widest uppercase font-bold">
                      <th className="py-3 px-4 text-center w-10">#</th>
                      <th className="py-3 px-4">Couture Item Description</th>
                      <th className="py-3 px-4 text-center w-28">Size / Specs</th>
                      <th className="py-3 px-4 text-center w-16">Qty</th>
                      <th className="py-3 px-4 text-right w-28">Unit Rate</th>
                      <th className="py-3 px-4 text-right w-32">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eae3d8] text-xs">
                    {invoiceData?.items?.map((item, idx) => (
                      <tr key={item.index} className={idx % 2 === 1 ? 'bg-[#faf8f5]' : 'bg-white'}>
                        <td className="py-3.5 px-4 text-center font-bold text-[#8c734b]">
                          {item.index}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-xs sm:text-[12.5px] text-neutral-950 leading-snug">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-neutral-500 mt-1">
                            Order No: <strong className="text-neutral-800">{invoiceData?.orderNumber || targetId}</strong>
                            {item.sku && (
                              <span> &bull; SKU: <strong className="text-neutral-800">{item.sku}</strong></span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-medium text-neutral-700">
                          {item.size}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-neutral-900">
                          {item.quantity}
                        </td>
                        <td className="py-3.5 px-4 text-right text-neutral-700">
                          ₹{Number(item.price).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-neutral-950">
                          ₹{Number(item.total).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculations & GST Ledger */}
              <div className="invoice-totals-grid grid grid-cols-1 sm:grid-cols-12 gap-6 mb-6 relative z-10">
                {/* Left Column (7 cols): In Words & Bank Details */}
                <div className="sm:col-span-7 space-y-4">
                  {/* Amount in words */}
                  <div className="bg-[#faf8f5] border border-[#eae3d8] border-l-4 border-l-[#c5a880] rounded-md p-4">
                    <span className="text-[8.5px] font-bold uppercase tracking-widest text-[#8c734b] block mb-1">
                      Amount Chargeable (in words)
                    </span>
                    <span className="italic font-semibold text-neutral-950 text-xs sm:text-[13px] leading-relaxed block">
                      {invoiceData?.amountInWords}
                    </span>
                  </div>

                  {/* Bank Details */}
                  <div className="border border-dashed border-[#ded6cb] rounded-md p-3.5 bg-[#fcfbfa] text-[10px] text-neutral-600 leading-relaxed">
                    <span className="font-bold uppercase tracking-widest text-[#8c734b] block mb-1">
                      Store Remittance &amp; Audit Reference
                    </span>
                    Beneficiary: <strong>HOUSE OF URVAAH PRIVATE LIMITED</strong> &bull; Bank: HDFC Bank Ltd<br />
                    Account: 50200088923412 &bull; IFSC: HDFC0000123 &bull; Branch: Kurla East, Mumbai
                  </div>
                </div>

                {/* Right Column (5 cols): Itemized Charges & Grand Total */}
                <div className="sm:col-span-5">
                  <div className="border border-[#eae3d8] rounded-md overflow-hidden bg-white shadow-xs">
                    <div className="divide-y divide-[#f2ede5] text-xs">
                      <div className="flex justify-between p-3 text-neutral-700">
                        <span>Gross Subtotal</span>
                        <span className="font-bold text-neutral-900">₹{Number(invoiceData?.subtotal || 0).toLocaleString('en-IN')}</span>
                      </div>

                      {invoiceData?.hasDiscount && (
                        <div className="flex justify-between p-3 bg-[#fdfaf5] text-amber-900">
                          <div>
                            <span className="font-bold block">{invoiceData?.discountLabel}</span>
                            <span className="text-[8.5px] uppercase tracking-wider text-amber-700">Coupon: {invoiceData?.couponCode}</span>
                          </div>
                          <span className="font-bold">-₹{Number(invoiceData?.discountAmount || 0).toLocaleString('en-IN')}</span>
                        </div>
                      )}

                      <div className="flex justify-between p-3 text-neutral-700">
                        <span>Insured White-Glove Shipping</span>
                        <span className="font-bold text-emerald-800">FREE (₹0.00)</span>
                      </div>

                      <div className="flex justify-between p-3 text-neutral-700">
                        <span>Applicable GST ({invoiceData?.taxRate || 18}%)</span>
                        <span className="font-bold text-neutral-900">₹{Number(invoiceData?.taxAmount || 0).toLocaleString('en-IN')}</span>
                      </div>

                      {/* Grand Total Luxury Obsidian Card */}
                      <div className="bg-[#141414] text-white p-4 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#e5cfab] block">
                            Grand Total
                          </span>
                          <span className="text-[8px] uppercase tracking-wider text-neutral-400 block mt-0.5">
                            Total Payable (Incl. {invoiceData?.taxRate || 18}% GST)
                          </span>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-white tracking-wider">
                          ₹{Number(invoiceData?.grandTotal || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Digital Seal & Authorized Signatory Block */}
              <div className="invoice-signature-block grid grid-cols-1 sm:grid-cols-2 gap-5 pt-6 border-t border-[#eae3d8] items-center relative z-10">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full border-2 border-[#c5a880] flex items-center justify-center font-bold text-[#8c734b] text-base shrink-0 bg-[#faf8f5] shadow-xs">
                    U
                  </div>
                  <div className="text-[10px] text-neutral-600 leading-snug">
                    <strong className="text-neutral-950 uppercase tracking-wider block text-[10.5px] font-bold">
                      Digitally Verified Store Invoice
                    </strong>
                    Issued under IT Act 2000 &amp; Central Goods and Services Tax Rules. No manual signature required.
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="text-[9px] uppercase tracking-widest text-[#8c734b] font-semibold block mb-0.5">
                    For House of Urvaah Private Limited
                  </span>
                  <div className="italic font-semibold text-lg sm:text-xl text-neutral-950 leading-tight">
                    House of Urvaah
                  </div>
                  <span className="text-[8.5px] uppercase tracking-widest text-neutral-500 font-bold border-t border-[#ded6cb] pt-1 inline-block mt-1">
                    Authorized Signatory &bull; {invoiceData?.authSignatoryDate}
                  </span>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default InvoiceModal;
