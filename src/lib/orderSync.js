import { supabase } from './supabase';

const CHANNEL_NAME = 'urvaah_orders_sync';
const STORAGE_KEY = 'urvaah_order_sync_event';

let broadcastChannel = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch (e) {
  console.warn('[orderSync] BroadcastChannel not available:', e);
}

/**
 * Broadcast an order update to all components in the current tab,
 * other open tabs (via BroadcastChannel & storage event), and triggers real-time listeners.
 */
export const broadcastOrderUpdate = (orderData) => {
  if (!orderData) return;

  const payload = {
    id: orderData.id || orderData._id,
    order_number: orderData.order_number || orderData.orderNumber,
    orderNumber: orderData.orderNumber || orderData.order_number,
    status: orderData.status,
    payment_status: orderData.payment_status || orderData.paymentStatus,
    paymentStatus: orderData.paymentStatus || orderData.payment_status,
    cancel_reason: orderData.cancel_reason || orderData.cancelReason,
    cancelReason: orderData.cancelReason || orderData.cancel_reason,
    total: orderData.total || orderData.total_amount,
    user_id: orderData.user_id || orderData.userId,
    updated_at: orderData.updated_at || new Date().toISOString(),
    _source: 'client_broadcast',
    _ts: Date.now()
  };

  // 1. Same-tab DOM CustomEvent
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('urvaah:order_updated', { detail: payload }));
    } catch (e) {
      console.warn('[orderSync] CustomEvent error:', e);
    }

    // 2. Cross-tab BroadcastChannel
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage(payload);
      } catch (e) {
        console.warn('[orderSync] BroadcastChannel postMessage error:', e);
      }
    }

    // 3. Cross-tab Storage fallback
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      // Storage quota or privacy mode error
    }
  }
};

/**
 * Subscribe to real-time order updates across:
 * - Same tab CustomEvents
 * - Cross tab BroadcastChannel
 * - Cross tab Storage event
 * - Supabase Realtime Postgres Changes (Database CDC)
 *
 * @param {Function} onUpdate - callback receiving updated order payload
 * @returns {Function} unsubscribe cleanup function
 */
export const subscribeToOrderUpdates = (onUpdate) => {
  if (typeof window === 'undefined' || typeof onUpdate !== 'function') {
    return () => {};
  }

  // 1. Same-tab CustomEvent listener
  const handleCustomEvent = (e) => {
    if (e?.detail) {
      onUpdate(e.detail);
    }
  };
  window.addEventListener('urvaah:order_updated', handleCustomEvent);

  // 2. Cross-tab BroadcastChannel listener
  const handleBcMessage = (event) => {
    if (event?.data) {
      onUpdate(event.data);
    }
  };
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBcMessage);
  }

  // 3. Cross-tab Storage event listener
  const handleStorageEvent = (event) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        if (parsed) {
          onUpdate(parsed);
        }
      } catch (e) {}
    }
  };
  window.addEventListener('storage', handleStorageEvent);

  // 4. Supabase Realtime Postgres CDC Subscription
  let supabaseChannel = null;
  try {
    if (supabase && typeof supabase.channel === 'function') {
      supabaseChannel = supabase
        .channel(`public:orders:${Math.random().toString(36).substring(7)}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => {
            const row = payload.new || payload.record;
            if (row) {
              onUpdate({
                id: row.id,
                order_number: row.order_number,
                orderNumber: row.order_number,
                status: row.status,
                payment_status: row.payment_status,
                paymentStatus: row.payment_status,
                cancel_reason: row.cancel_reason,
                cancelReason: row.cancel_reason,
                total: row.total,
                user_id: row.user_id,
                updated_at: row.updated_at,
                _source: 'supabase_cdc',
                _ts: Date.now()
              });
            }
          }
        )
        .subscribe((status, err) => {
          if (err) {
            console.warn('[orderSync] Supabase realtime error:', err);
          }
        });
    }
  } catch (err) {
    console.warn('[orderSync] Supabase subscription failed:', err);
  }

  // Return unsubscribe cleanup function
  return () => {
    window.removeEventListener('urvaah:order_updated', handleCustomEvent);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBcMessage);
    }
    window.removeEventListener('storage', handleStorageEvent);
    if (supabaseChannel && typeof supabaseChannel.unsubscribe === 'function') {
      try {
        supabaseChannel.unsubscribe();
      } catch (e) {}
    }
  };
};
