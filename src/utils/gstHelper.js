/**
 * GST Calculation & Breakdown Utility
 * Handles dynamic store tax rates, pro-rata tax allocation per line item,
 * and return/refund financial breakdowns for both customer and admin panels.
 */

export const getOrderGstInfo = (ord) => {
  if (!ord) return { taxRate: 18, totalTax: 0, subtotal: 0, total: 0, taxRatio: 0.18 };
  const subtotal = Number(ord.subtotal || ord.original_total || ord.originalTotal || 0);
  const rawTotal = Number(ord.total || ord.totalPaid || ord.total_amount || 0);
  const discount = Number(ord.discount_amount || ord.discount || 0);
  const shipping = Number(ord.shipping || ord.shipping_cost || ord.shipping_fee || ord.shippingFee || 0);
  let tax = Number(ord.tax || ord.tax_amount || ord.taxAmount || 0);
  let taxRate = Number(ord.tax_rate || ord.taxRate || ord.gst_percentage || 0);

  const netTaxable = Math.max(0, subtotal - discount);

  // If tax is not directly provided, check if rawTotal has tax difference above netTaxable
  if (!tax && rawTotal > netTaxable && netTaxable > 0) {
    tax = Math.max(0, Math.round(rawTotal - netTaxable - shipping));
  }

  // Determine tax rate: fallback to 18% for luxury items > 2500, else 5%
  if (!taxRate) {
    if (tax > 0 && netTaxable > 0) {
      taxRate = Math.round((tax / netTaxable) * 100);
    } else {
      taxRate = netTaxable > 2500 ? 18 : (netTaxable > 0 ? 5 : 18);
    }
  }

  // If tax is still 0 or unrecorded, compute tax from netTaxable using applicable rate
  if (!tax && netTaxable > 0) {
    tax = Math.round(netTaxable * (taxRate / 100));
  }

  const computedTotal = netTaxable + tax + shipping;
  const effectiveTotal = Math.max(rawTotal, computedTotal);
  const taxRatio = netTaxable > 0 && tax > 0 ? (tax / netTaxable) : (taxRate / 100);

  return { taxRate, totalTax: tax, subtotal, total: effectiveTotal, taxRatio };
};

export const getItemGstBreakdown = (item, orderGstInfo, isSingleItem = false) => {
  const unitPrice = Number(item.price || item.unit_price || 0);
  const qty = Number(item.quantity || 1);
  const baseTotal = unitPrice * qty;

  let taxAmount = 0;
  // Give the item the whole order's tax only when it really is the whole order. Callers sometimes pass
  // "one item being returned" as single, which overstated GST on partial / mixed returns.
  const coversWholeOrder = !orderGstInfo.subtotal || Math.abs(baseTotal - orderGstInfo.subtotal) < 1;
  if (isSingleItem && orderGstInfo.totalTax > 0 && coversWholeOrder) {
    taxAmount = orderGstInfo.totalTax;
  } else if (orderGstInfo.totalTax > 0 && orderGstInfo.subtotal > 0) {
    taxAmount = Math.round((baseTotal / orderGstInfo.subtotal) * orderGstInfo.totalTax);
  } else {
    taxAmount = Math.round(baseTotal * orderGstInfo.taxRatio);
  }

  const totalWithTax = baseTotal + taxAmount;
  return {
    unitPrice,
    qty,
    baseTotal,
    taxAmount,
    totalWithTax,
    taxRate: orderGstInfo.taxRate
  };
};

export const getReturnGstBreakdown = (order, customItems = null) => {
  if (!order) {
    return {
      gstInfo: { taxRate: 18, totalTax: 0, subtotal: 0, total: 0, taxRatio: 0.18 },
      targetItems: [],
      returnItems: [],
      isPartial: false,
      baseTotal: 0,
      gstTotal: 0,
      totalRefund: 0,
      taxRate: 18
    };
  }

  const gstInfo = getOrderGstInfo(order);
  const items = Array.isArray(customItems) && customItems.length > 0
    ? customItems
    : (Array.isArray(order.refund_items) && order.refund_items.length > 0
      ? order.refund_items
      : (Array.isArray(order.items) ? order.items : []));

  const returnItems = items.filter(it => {
    const act = (it.return_action || '').toLowerCase();
    const stat = (it.status || '').toLowerCase();
    return act === 'return' || stat.includes('return');
  });

  const targetItems = returnItems.length > 0 ? returnItems : items;
  const isSingle = targetItems.length === 1;

  let baseTotal = 0;
  let gstTotal = 0;

  if (targetItems.length > 0) {
    targetItems.forEach(it => {
      const b = getItemGstBreakdown(it, gstInfo, isSingle);
      baseTotal += b.baseTotal;
      gstTotal += b.taxAmount;
    });
  } else {
    baseTotal = Number(order.subtotal || order.total || 0);
    gstTotal = gstInfo.totalTax;
  }

  // Final total refund value
  let totalRefund = (order.refund_eligible_amount !== undefined && Number(order.refund_eligible_amount) > 0)
    ? Number(order.refund_eligible_amount)
    : (baseTotal + gstTotal > 0 ? (baseTotal + gstTotal) : Number(order.total || 0));

  // If totalRefund is present but tax breakdown ended up 0, compute reverse GST
  if (gstTotal === 0 && gstInfo.taxRate > 0 && totalRefund > 0) {
    baseTotal = Math.round(totalRefund / (1 + (gstInfo.taxRate / 100)));
    gstTotal = totalRefund - baseTotal;
  }

  return {
    gstInfo,
    targetItems,
    returnItems,
    isPartial: returnItems.length > 0 && returnItems.length < items.length,
    baseTotal,
    gstTotal,
    totalRefund,
    taxRate: gstInfo.taxRate
  };
};
