import { apiFetch } from './api';

/**
 * Delivery API Service for House of Urvaah
 */
export const deliveryApi = {
  /**
   * Check delivery availability & calculated dates for a given PIN code
   * @param {string} pincode - 6 digit numeric PIN code
   * @returns {Promise<{success: boolean, available: boolean, pincode: string, estimatedDelivery?: object, message?: string}>}
   */
  async checkPincode(pincode) {
    const cleanPin = String(pincode || '').trim();
    if (!cleanPin || !/^\d{6}$/.test(cleanPin)) {
      return {
        success: false,
        available: false,
        message: 'Please enter a valid 6-digit PIN code.'
      };
    }

    try {
      const data = await apiFetch(`/api/delivery/check?pincode=${cleanPin}`);
      return data;
    } catch (error) {
      console.error('Delivery API check failed:', error);
      return {
        success: false,
        available: false,
        message: 'Unable to check delivery availability. Please try again.'
      };
    }
  }
};

export default deliveryApi;
