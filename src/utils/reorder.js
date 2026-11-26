import apiClient from '../lib/apiClient';
import { checkItemStockStatus } from './stockValidator';

/**
 * Checks every order line against LIVE product stock (one request per product, in parallel).
 *
 * @returns {Promise<Array<{
 *   lineKey: string,          // stable key for the order line (selection in the reorder picker)
 *   name: string, size: string, image: string, price: number,
 *   requestedQty: number,     // quantity in the original order
 *   quantity: number,         // quantity that can be reordered now (0 when unavailable)
 *   status: 'available' | 'limited' | 'unavailable',
 *   reason: string,           // shown to the customer when not fully available
 *   entry: { product, size, quantity } | null   // ready for addToCart; null when unavailable
 * }>>}
 */
export const checkReorderItems = async (orderItems = []) => {
  const lines = (Array.isArray(orderItems) ? orderItems : []).map((item, index) => {
    // Prefer the product reference; item.id on an order line is the order_items row id
    const productId = item.product?.id || item.productId || item.product_id || item.id;
    const size = String(item.selectedSize || item.size || 'M').trim().toUpperCase();
    return {
      item,
      index,
      productId: productId ? String(productId) : '',
      name: item.product?.name || item.name || item.title || 'Product',
      size,
      requestedQty: Math.max(1, Number(item.quantity || 1)),
      image: item.image || item.product?.image || '',
      price: Number(item.price || item.product?.price || 0)
    };
  });

  // Fetch each distinct product once
  const uniqueIds = [...new Set(lines.map((l) => l.productId).filter(Boolean))];
  const liveById = {};
  await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        const res = await apiClient(`/api/products/${encodeURIComponent(id)}`);
        liveById[id] = res?.success ? res.data : null;
      } catch (err) {
        liveById[id] = null;
      }
    })
  );

  return lines.map((l) => {
    const base = {
      lineKey: `${l.index}_${l.productId}_${l.size}`,
      name: l.name,
      size: l.size,
      image: l.image,
      price: l.price,
      requestedQty: l.requestedQty
    };
    const live = l.productId ? liveById[l.productId] : null;

    if (!live) {
      return { ...base, quantity: 0, status: 'unavailable', reason: 'No longer available', entry: null };
    }

    const status = checkItemStockStatus(
      { product: live, selectedSize: l.size, quantity: l.requestedQty },
      live
    );
    const quantity = status.insufficientStock ? status.availableStock : l.requestedQty;

    if (quantity <= 0 || (status.isOutOfStock && !status.insufficientStock)) {
      return { ...base, quantity: 0, status: 'unavailable', reason: `Size ${l.size} is out of stock`, entry: null };
    }

    return {
      ...base,
      image: base.image || live.image || '',
      price: Number(live.price || base.price || 0),
      quantity,
      status: quantity < l.requestedQty ? 'limited' : 'available',
      reason: quantity < l.requestedQty ? `Only ${quantity} left in size ${l.size}` : '',
      entry: {
        product: {
          ...(l.item.product || {}),
          ...live,
          id: String(live.id || l.productId),
          name: live.name || live.title || l.name,
          title: live.title || live.name || l.name,
          price: Number(live.price || l.price || 0),
          image: live.image || l.item.image || l.item.product?.image
        },
        size: l.size,
        quantity
      }
    };
  });
};

/**
 * Builds the cart entries for "Reorder" using LIVE product stock.
 * Items that are out of stock (or can't be verified) are skipped; quantities are clamped
 * to what's available, so reorder can never push unavailable stock into checkout.
 *
 * @returns {Promise<{ available: Array<{ product, size, quantity }>, unavailable: string[] }>}
 */
export const buildReorderItems = async (orderItems = []) => {
  const checked = await checkReorderItems(orderItems);
  return {
    available: checked.filter((c) => c.entry).map((c) => c.entry),
    unavailable: checked.filter((c) => !c.entry).map((c) => `${c.name} (Size ${c.size})`)
  };
};

/**
 * Adds reorder entries to the bag (setting, not stacking, quantities) and selects exactly
 * those lines for checkout. Returns the cart keys that were selected.
 */
export const addReorderEntriesToCart = async (entries, { addToCart, setSelectedCartItemKeys }) => {
  const targetKeys = [];
  for (const { product, size, quantity } of entries) {
    const key = `${String(product.id).trim()}_${String(size).trim().toUpperCase()}`;
    if (addToCart) {
      const added = await addToCart(product, size, {
        quantity,
        setQuantity: true, // repeated reorders must not stack quantities
        selectOnlyThis: false,
        openDrawer: false
      });
      if (added === false) continue;
    }
    targetKeys.push(key);
  }
  if (setSelectedCartItemKeys && targetKeys.length > 0) {
    setSelectedCartItemKeys(targetKeys);
  }
  return targetKeys;
};
