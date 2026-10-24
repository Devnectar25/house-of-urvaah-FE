import apiClient from '../lib/apiClient';
import { checkItemStockStatus } from './stockValidator';

/**
 * Builds the cart entries for "Reorder" using LIVE product stock.
 * Items that are out of stock (or can't be verified) are skipped; quantities are clamped
 * to what's available, so reorder can never push unavailable stock into checkout.
 *
 * @returns {Promise<{ available: Array<{ product, size, quantity }>, unavailable: string[] }>}
 */
export const buildReorderItems = async (orderItems = []) => {
  const available = [];
  const unavailable = [];

  for (const item of orderItems) {
    // Prefer the product reference; item.id on an order line is the order_items row id
    const productId = item.product?.id || item.productId || item.product_id || item.id;
    const name = item.product?.name || item.name || item.title || 'Product';
    const size = String(item.selectedSize || item.size || 'M').trim();
    const requestedQty = Math.max(1, Number(item.quantity || 1));

    let live = null;
    if (productId) {
      try {
        const res = await apiClient(`/api/products/${encodeURIComponent(String(productId))}`);
        live = res?.success ? res.data : null;
      } catch (err) {
        live = null;
      }
    }

    if (!live) {
      unavailable.push(name);
      continue;
    }

    const status = checkItemStockStatus(
      { product: live, selectedSize: size, quantity: requestedQty },
      live
    );
    const quantity = status.insufficientStock ? status.availableStock : requestedQty;

    if (quantity <= 0 || (status.isOutOfStock && !status.insufficientStock)) {
      unavailable.push(`${name} (Size ${size})`);
      continue;
    }

    available.push({
      product: {
        ...(item.product || {}),
        ...live,
        id: String(live.id || productId),
        name: live.name || live.title || name,
        title: live.title || live.name || name,
        price: Number(live.price || item.price || 0),
        image: live.image || item.image || item.product?.image
      },
      size,
      quantity
    });
  }

  return { available, unavailable };
};
