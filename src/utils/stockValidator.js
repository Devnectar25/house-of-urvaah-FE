/**
 * Stock validation utility for House of Urvaah e-commerce.
 * Authoritatively determines stock status for cart items with overall or size-specific inventory.
 */

export const checkItemStockStatus = (item, liveProductData = null) => {
  if (!item) {
    return {
      isOutOfStock: false,
      availableStock: 99,
      insufficientStock: false,
      reason: ''
    };
  }

  const prod = liveProductData || item.product || {};
  const selectedSize = String(item.selectedSize || item.size || '').trim();
  const requestedQty = Math.max(1, parseInt(item.quantity, 10) || 1);
  const prodName = prod.name || prod.title || item.name || 'Selected product';

  // 1. Check if product is active
  const isActive = prod.is_active !== false && prod.active !== false;
  if (!isActive) {
    return {
      isOutOfStock: true,
      availableStock: 0,
      insufficientStock: false,
      reason: `Product "${prodName}" is currently unavailable.`
    };
  }

  // 2. Check explicit out-of-stock flags
  const explicitOutOfStock = (
    prod.inStock === false ||
    prod.instock === false ||
    prod.isOutOfStock === true ||
    prod.status === 'out_of_stock' ||
    prod.status === 'Out of Stock'
  );

  // 3. Size-specific stock
  const sizeStock = prod.sizeStock || prod.size_stock;
  let sizeSpecificStock = null;
  if (sizeStock && typeof sizeStock === 'object' && Object.keys(sizeStock).length > 0 && selectedSize) {
    const matchedKey = Object.keys(sizeStock).find(
      (k) => k.trim().toUpperCase() === selectedSize.toUpperCase()
    );
    if (matchedKey !== undefined) {
      sizeSpecificStock = Math.max(0, parseInt(sizeStock[matchedKey], 10) || 0);
    }
  }

  // 4. Overall stock
  const overallStockRaw = prod.stockQuantity ?? prod.stock_quantity ?? prod.quantity ?? prod.stock;
  let overallStock = (overallStockRaw !== null && overallStockRaw !== undefined)
    ? parseInt(overallStockRaw, 10)
    : null;

  // If size_stock is present and has configured sizes, compute total from size_stock as well
  if (sizeStock && typeof sizeStock === 'object' && Object.keys(sizeStock).length > 0) {
    const sumSizeStock = Object.values(sizeStock).reduce((acc, v) => acc + (parseInt(v, 10) || 0), 0);
    if (sumSizeStock > 0 && (overallStock === null || overallStock <= 0)) {
      overallStock = sumSizeStock;
    }
  }

  // If explicit out-of-stock and overall stock is 0
  if (explicitOutOfStock && (overallStock === null || overallStock <= 0)) {
    return {
      isOutOfStock: true,
      availableStock: 0,
      insufficientStock: false,
      reason: `Product "${prodName}" is currently out of stock.`
    };
  }

  // Evaluate size-specific stock first if configured
  if (sizeSpecificStock !== null) {
    if (sizeSpecificStock <= 0) {
      return {
        isOutOfStock: true,
        availableStock: 0,
        insufficientStock: false,
        reason: `Size "${selectedSize}" for "${prodName}" is out of stock.`
      };
    }
    if (requestedQty > sizeSpecificStock) {
      return {
        isOutOfStock: true,
        availableStock: sizeSpecificStock,
        insufficientStock: true,
        reason: `Only ${sizeSpecificStock} unit(s) available in size "${selectedSize}".`
      };
    }
    return {
      isOutOfStock: false,
      availableStock: sizeSpecificStock,
      insufficientStock: false,
      reason: ''
    };
  }

  // Evaluate overall stock if no size-specific stock was matched
  if (overallStock !== null && !isNaN(overallStock)) {
    if (overallStock <= 0) {
      return {
        isOutOfStock: true,
        availableStock: 0,
        insufficientStock: false,
        reason: `Product "${prodName}" is currently out of stock.`
      };
    }
    if (requestedQty > overallStock) {
      return {
        isOutOfStock: true,
        availableStock: overallStock,
        insufficientStock: true,
        reason: `Only ${overallStock} unit(s) available for "${prodName}".`
      };
    }
    return {
      isOutOfStock: false,
      availableStock: overallStock,
      insufficientStock: false,
      reason: ''
    };
  }

  // If explicitly flagged out-of-stock
  if (explicitOutOfStock) {
    return {
      isOutOfStock: true,
      availableStock: 0,
      insufficientStock: false,
      reason: `Product "${prodName}" is currently out of stock.`
    };
  }

  return {
    isOutOfStock: false,
    availableStock: 99,
    insufficientStock: false,
    reason: ''
  };
};
