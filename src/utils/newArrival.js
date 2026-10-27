/**
 * New Arrivals rule: a product is new for NEW_ARRIVAL_DAYS after it was created, unless the admin
 * set it to "Always show" (new_arrival = true) or "Don't show" (new_arrival = false).
 */
export const NEW_ARRIVAL_DAYS = 90; // ~3 months

const createdMs = (p) => {
  const t = new Date(p?.created_at || p?.createdAt || 0).getTime();
  return Number.isFinite(t) ? t : 0;
};

export const isNewArrival = (p, now = Date.now()) => {
  if (!p) return false;
  if (p.new_arrival === false) return false;
  if (p.new_arrival === true) return true;
  const t = createdMs(p);
  return t > 0 && now - t <= NEW_ARRIVAL_DAYS * 24 * 60 * 60 * 1000;
};

/** Newest product first */
export const compareNewestFirst = (a, b) => createdMs(b) - createdMs(a);

/** Admin form value <-> API value */
export const newArrivalToOption = (v) => (v === true ? 'always' : v === false ? 'hide' : 'auto');
