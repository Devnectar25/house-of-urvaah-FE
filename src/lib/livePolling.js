// Background refresh for storefront sections that show admin-managed content.
//
// Sections previously polled every 3s, even in hidden tabs, which put ~2 requests/second per
// open homepage on the API and exhausted the DB connection pool under concurrent visitors.
// Instant updates still arrive through each section's existing custom events / storage listeners
// (fired when an admin saves in the same browser); this only covers other visitors.
export const LIVE_REFRESH_MS = 60000;

/**
 * Calls `fn` every `intervalMs` while the tab is visible, and immediately when the shopper
 * returns to the tab. Returns a cleanup function (use in place of clearInterval).
 */
export const startVisiblePolling = (fn, intervalMs = LIVE_REFRESH_MS) => {
  if (typeof document === 'undefined') return () => {};
  const runIfVisible = () => {
    if (document.visibilityState === 'visible') fn();
  };
  const id = setInterval(runIfVisible, intervalMs);
  document.addEventListener('visibilitychange', runIfVisible);
  return () => {
    clearInterval(id);
    document.removeEventListener('visibilitychange', runIfVisible);
  };
};
