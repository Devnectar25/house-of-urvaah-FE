import { productApi } from '../services/productApi';

/** The home page "Recommended for you" section is shown only with at least this many products */
export const MIN_RECOMMENDED_PRODUCTS = 3;

/**
 * Admin hint: how many products the home page section currently has (the same list the
 * storefront loads: recommended products first, topped up with other active in-stock products).
 */
export const fetchRecommendationStatus = async () => {
  const res = await productApi.getRecommendations({ limit: 10 });
  const count = (Array.isArray(res) ? res : (res?.data || [])).length;
  const missing = Math.max(0, MIN_RECOMMENDED_PRODUCTS - count);
  return {
    count,
    missing,
    text: missing > 0
      ? `Home page "Recommended for you" is hidden: ${count} of ${MIN_RECOMMENDED_PRODUCTS} required products available. Add ${missing} more active, in-stock product${missing > 1 ? 's' : ''} (mark them Recommended to show them first).`
      : `Home page "Recommended for you" is live with ${count} products (minimum ${MIN_RECOMMENDED_PRODUCTS}).`
  };
};
