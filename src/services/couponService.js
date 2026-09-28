import { apiClient } from '../lib/apiClient';

/**
 * Coupon Management API Service for House of Urvaah Admin Panel
 */
export const couponService = {
  /**
   * Fetch all coupons
   */
  async getCoupons(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.visibility) query.append('visibility', params.visibility);

    const queryString = query.toString();
    const endpoint = `/api/admin/coupons${queryString ? `?${queryString}` : ''}`;
    const res = await apiClient(endpoint);
    return Array.isArray(res) ? res : (res?.data || []);
  },

  /**
   * Fetch single coupon by ID
   */
  async getCouponById(id) {
    const coupons = await this.getCoupons();
    return coupons.find((c) => String(c.id) === String(id)) || null;
  },

  /**
   * Create a new coupon
   */
  async createCoupon(data) {
    const res = await apiClient('/api/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res?.data || res?.coupon || res;
  },

  /**
   * Update an existing coupon
   */
  async updateCoupon(id, data) {
    const res = await apiClient(`/api/admin/coupons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res?.data || res?.coupon || res;
  },

  /**
   * Delete a coupon
   */
  async deleteCoupon(id) {
    const res = await apiClient(`/api/admin/coupons/${id}`, {
      method: 'DELETE'
    });
    return res;
  },

  /**
   * Toggle active status of a coupon
   */
  async toggleCouponStatus(id) {
    const res = await apiClient(`/api/admin/coupons/${id}/toggle-status`, {
      method: 'PATCH'
    });
    return res?.data || res;
  },

  /**
   * Fetch customer assignments for a private coupon
   */
  async getCouponAssignments(id) {
    const res = await apiClient(`/api/admin/coupons/${id}/assignments`);
    return Array.isArray(res) ? res : (res?.data || []);
  },

  /**
   * Assign coupon to user(s)
   */
  async assignCoupon(couponId, userIds) {
    const payload = typeof couponId === 'object' ? couponId : { couponId, userIds };
    const res = await apiClient('/api/admin/targeting/assign-coupon', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res;
  },

  /**
   * Revoke user assignment from private coupon
   */
  async revokeAssignment(couponId, userId) {
    const res = await apiClient(`/api/admin/coupons/${couponId}/assignments/${userId}`, {
      method: 'PATCH'
    });
    return res?.data || res;
  },

  /**
   * Fetch users for customer targeting (All Users)
   */
  async getAvailableTargetUsers(couponId = '') {
    const res = await apiClient(`/api/admin/targeting/users${couponId ? `?couponId=${couponId}` : ''}`);
    return Array.isArray(res) ? res : (res?.data || []);
  },

  /**
   * Fetch top customers by spending/order metrics
   */
  async getTopCustomers(limit = 50) {
    const res = await apiClient(`/api/admin/targeting/top-customers?limit=${limit}`);
    return Array.isArray(res) ? res : (res?.data || []);
  },

  /**
   * Fetch active users by recent activity
   */
  async getActiveUsers(limit = 50) {
    const res = await apiClient(`/api/admin/targeting/active-users?limit=${limit}`);
    return Array.isArray(res) ? res : (res?.data || []);
  },

  /**
   * Fetch users who used a specific coupon
   */
  async getUsedUsers(id) {
    const res = await apiClient(`/api/admin/coupons/${id}/used-users`);
    return Array.isArray(res) ? res : (res?.data || []);
  }
};

export default couponService;
