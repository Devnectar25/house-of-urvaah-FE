import { apiFetch } from './api';

/**
 * Product & Category API Service for House of Urvaah
 * Unpacks backend `{ success: true, data: [...] }` envelopes for seamless frontend consumption.
 */
export const productApi = {
  /**
   * Fetch all products (optional filters: category, search, page, limit)
   */
  async getProducts(params = {}) {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.active !== undefined) query.append('active', params.active);

    const queryString = query.toString();
    const endpoint = `/api/products${queryString ? `?${queryString}` : ''}`;
    const res = await apiFetch(endpoint);
    return res?.data || res || [];
  },

  /**
   * Fetch featured / best seller products
   */
  async getFeaturedProducts() {
    const res = await apiFetch('/api/products/featured');
    return res?.data || res || [];
  },

  /**
   * Fetch single product by ID or style code
   */
  async getProductById(id) {
    const res = await apiFetch(`/api/products/${id}`);
    return res?.data || res || null;
  },

  /**
   * Fetch product categories
   */
  async getCategories() {
    const res = await apiFetch('/api/categories');
    return res?.data || res || [];
  },

  /**
   * Fetch related products
   */
  async getRelatedProducts(id, category = '') {
    const endpoint = `/api/products/${id}/related${category ? `?category=${encodeURIComponent(category)}` : ''}`;
    const res = await apiFetch(endpoint);
    return res?.data || res || [];
  }
};

export default productApi;
