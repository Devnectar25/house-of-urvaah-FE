/**
 * Storefront collection filters (Filters panel on category pages) and how a product is assigned
 * to them from the admin product form. Assignments are stored in the product's `tags` list; the
 * occasion text field is kept in sync for anything that reads it directly.
 */
export const OCCASION_OPTIONS = [
  'Beach and Vacation',
  'Night Out',
  'College and Office',
  'Festive and Wedding'
];

export const FABRIC_OPTIONS = [
  'Cora Cotton',
  'Tissue Silk'
];

export const WEAR_TWO_WAYS_TAG = 'Wear it two ways';

const lower = (v) => String(v || '').trim().toLowerCase();
const tagList = (product) => (Array.isArray(product?.tags) ? product.tags.map((t) => String(t).trim()).filter(Boolean) : []);

/** True when the product is assigned to this occasion (tag, or the legacy occasion text) */
export const productHasOccasion = (product, occasion) => {
  const occ = lower(occasion);
  if (tagList(product).some((t) => lower(t) === occ)) return true;
  const pOccasion = lower(product?.occasion);
  return Boolean(pOccasion) && (pOccasion.includes(occ) || occ.includes(pOccasion));
};

/** True when the product is assigned to this fabric (tag, or the fabric named in its texts) */
export const productHasFabric = (product, fabric) => {
  const fab = lower(fabric);
  if (tagList(product).some((t) => lower(t) === fab)) return true;
  return [product?.fabric, product?.description, product?.additional_info || product?.additionalInfo]
    .some((text) => lower(text).includes(fab));
};

export const productIsWearTwoWays = (product) =>
  tagList(product).some((t) => lower(t).includes('two ways')) ||
  (typeof product?.tag === 'string' && lower(product.tag).includes('two ways')) ||
  lower(product?.description).includes('wear it two ways');

/** Admin form state from a product: explicit filter assignments + any other tags to keep */
export const readProductFilters = (product) => {
  const tags = tagList(product);
  const isOption = (list) => (t) => list.some((o) => lower(o) === lower(t));
  const occasionText = String(product?.occasion || '').split(',').map((o) => o.trim()).filter(Boolean);
  const occasions = OCCASION_OPTIONS.filter((o) =>
    tags.some((t) => lower(t) === lower(o)) || occasionText.some((t) => lower(t) === lower(o)));
  return {
    occasions,
    fabrics: FABRIC_OPTIONS.filter((f) => tags.some((t) => lower(t) === lower(f))),
    wearTwoWays: tags.some((t) => lower(t).includes('two ways')),
    otherTags: tags.filter((t) => !isOption(OCCASION_OPTIONS)(t) && !isOption(FABRIC_OPTIONS)(t) && !lower(t).includes('two ways'))
  };
};

/** API payload fields for the admin's filter selection */
export const buildFilterPayload = (filters) => {
  const f = filters || readProductFilters(null);
  return {
    tags: [...(f.otherTags || []), ...f.occasions, ...f.fabrics, ...(f.wearTwoWays ? [WEAR_TWO_WAYS_TAG] : [])],
    occasion: f.occasions.join(', ')
  };
};
