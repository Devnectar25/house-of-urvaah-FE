import { apiFetch } from './api';

/**
 * Shiprocket Logistics Frontend Client for House of Urvaah
 * Works seamlessly with Mock mode and Real Shiprocket APIs.
 */
export const shippingApi = {
  // 1. Check Serviceability
  async checkServiceability(pincode, pickupPincode, weight = 0.5, cod = 1) {
    const params = new URLSearchParams({
      pincode: String(pincode).trim(),
      ...(pickupPincode ? { pickupPincode } : {}),
      weight: String(weight),
      cod: String(cod)
    });
    return apiFetch(`/api/shipping/serviceability?${params.toString()}`);
  },

  // 2. Track Forward Shipment
  async trackShipment(awb) {
    return apiFetch(`/api/shipping/track/${encodeURIComponent(awb)}`);
  },

  // 3. Track Return Parcel
  async trackReturnParcel(awb) {
    return apiFetch(`/api/shipping/return/track/${encodeURIComponent(awb)}`);
  },

  // 4. Create Forward Shipment (Admin)
  async createShipment(orderData) {
    return apiFetch('/api/shipping/order/create', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  },

  // 5. Assign AWB (Admin)
  async assignAwb(shipmentId, courierId = null) {
    return apiFetch('/api/shipping/courier/assign-awb', {
      method: 'POST',
      body: JSON.stringify({ shipment_id: shipmentId, courier_id: courierId })
    });
  },

  // 6. Schedule Pickup (Admin)
  async schedulePickup(shipmentIds) {
    return apiFetch('/api/shipping/courier/pickup', {
      method: 'POST',
      body: JSON.stringify({ shipment_ids: Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds] })
    });
  },

  // 7. Generate Label (Admin)
  async generateLabel(shipmentIds) {
    return apiFetch('/api/shipping/label', {
      method: 'POST',
      body: JSON.stringify({ shipment_ids: Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds] })
    });
  },

  // 8. Generate Manifest (Admin)
  async generateManifest(shipmentIds) {
    return apiFetch('/api/shipping/manifest', {
      method: 'POST',
      body: JSON.stringify({ shipment_ids: Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds] })
    });
  },

  // 9. Cancel Shipment (Admin)
  async cancelShipment(orderIds) {
    return apiFetch('/api/shipping/order/cancel', {
      method: 'POST',
      body: JSON.stringify({ order_ids: Array.isArray(orderIds) ? orderIds : [orderIds] })
    });
  },

  // 10. Webhook Status Simulator (Simulates In Transit, Out for Delivery, Delivered, etc.)
  async simulateWebhookStatus(awbOrOrderNumber, currentStatus) {
    return apiFetch('/api/shipping/webhook', {
      method: 'POST',
      body: JSON.stringify({
        awb: awbOrOrderNumber,
        current_status: currentStatus
      })
    });
  },

  // 11. Reverse Logistics (Return Order Creation)
  async createReturnOrder(order, itemsToReturn = [], reason = 'Customer requested return') {
    return apiFetch('/api/shipping/return/create', {
      method: 'POST',
      body: JSON.stringify({
        order,
        items_to_return: itemsToReturn.length ? itemsToReturn : (order.items || []),
        reason
      })
    });
  },

  // 12. Dispatch Replacement Item
  async dispatchReplacement(originalOrder, replacementItems = []) {
    return apiFetch('/api/shipping/replacement/dispatch', {
      method: 'POST',
      body: JSON.stringify({
        original_order: originalOrder,
        replacement_items: replacementItems.length ? replacementItems : (originalOrder.items || [])
      })
    });
  }
};

export default shippingApi;
