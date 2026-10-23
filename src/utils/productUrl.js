/**
 * Technical SEO Product URL & Canonical Architecture
 * Provides deterministic mapping and dynamic resolution for SEO-friendly product URLs.
 */

export const SEO_PRODUCT_MAPPINGS = {
  'bs-101': {
    id: 'bs-101',
    slug: 'mocha-brown-embroidered-co-ord-set',
    url: '/product/bs-101/mocha-brown-embroidered-co-ord-set',
    canonicalUrl: 'https://houseofurvaah.com/product/bs-101/mocha-brown-embroidered-co-ord-set',
    title: 'Mocha Brown Embroidered Co-Ord Set | House of Urvaah',
    description: 'Shop the Mocha Brown Embroidered Co-Ord Set at House of Urvaah. Handcrafted with intricate floral sequin embroidery, low tie-back silhouette, and potli trim.',
    keywords: 'mocha brown embroidered co-ord set, luxury co-ord sets, designer matching sets, house of urvaah, party wear'
  },
  'bs-102': {
    id: 'bs-102',
    slug: 'teal-embroidered-floral-co-ord-set',
    url: '/product/bs-102/teal-embroidered-floral-co-ord-set',
    canonicalUrl: 'https://houseofurvaah.com/product/bs-102/teal-embroidered-floral-co-ord-set',
    title: 'Teal Embroidered Floral Co-Ord Set | House of Urvaah',
    description: 'Discover the Teal Embroidered Floral Co-Ord Set by House of Urvaah. Halter-neck sequin top paired with potli-trimmed skirt in a fluid silk blend.',
    keywords: 'teal embroidered floral co-ord set, resort wear, beach vacation set, halter neck sequin set, house of urvaah'
  },
  'bs-104': {
    id: 'bs-104',
    slug: 'blush-pink-embroidered-floral-co-ord-set',
    url: '/product/bs-104/blush-pink-embroidered-floral-co-ord-set',
    canonicalUrl: 'https://houseofurvaah.com/product/bs-104/blush-pink-embroidered-floral-co-ord-set',
    title: 'Blush Pink Embroidered Floral Co-Ord Set | House of Urvaah',
    description: 'Explore the Blush Pink Embroidered Floral Co-Ord Set at House of Urvaah. Delicate sequin embroidery, flattering corset lace-up back, and signature potli finish.',
    keywords: 'blush pink embroidered floral co-ord set, pastel co ord, corset lace up set, designer evening wear, house of urvaah'
  },
  'bs-103': {
    id: 'bs-103',
    slug: 'sage-bloom-embroidered-corset',
    url: '/product/bs-103/sage-bloom-embroidered-corset',
    canonicalUrl: 'https://houseofurvaah.com/product/bs-103/sage-bloom-embroidered-corset',
    title: 'Sage Bloom Embroidered Corset | House of Urvaah',
    description: 'Shop the Sage Bloom Embroidered Corset in raw tissue silk with antique golden zari and sequin work. Multi-way styling with padded boned structure.',
    keywords: 'sage bloom embroidered corset, raw tissue silk corset, zari work top, wear it two ways, luxury corset, house of urvaah'
  },
  '109': {
    id: '109',
    slug: 'ivory-heart-corset-kurti',
    url: '/product/109/ivory-heart-corset-kurti',
    canonicalUrl: 'https://houseofurvaah.com/product/109/ivory-heart-corset-kurti',
    title: 'Ivory Heart Corset Kurti | House of Urvaah',
    description: 'Shop the Ivory Heart Corset Kurti / Dress at House of Urvaah. Breathable cora cotton with heart butti embroidery, square lace neck, and wear-it-two-ways versatility.',
    keywords: 'ivory heart corset kurti, cora cotton kurti dress, wear it two ways, corset back kurti, designer cotton dress, house of urvaah'
  }
};

/**
 * Generate a clean, SEO-friendly URL slug from string
 */
export const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\//g, '-') // Replace / with - (e.g. Kurti/Dress -> Kurti-Dress)
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with -
    .replace(/^-+|-+$/g, ''); // Trim hyphens
};

/**
 * Resolve canonical product metadata from product object, id, slug, or old URL path
 */
export const resolveProductCanonical = (productOrId) => {
  if (!productOrId) return null;

  // Extract raw string representation
  let rawStr = '';
  let prodName = '';
  let prodObj = null;

  if (typeof productOrId === 'object') {
    prodObj = productOrId;
    rawStr = String(productOrId.id || productOrId.product_id || productOrId._id || '');
    prodName = String(productOrId.name || productOrId.title || '');
  } else {
    rawStr = String(productOrId).trim();
  }

  // Handle case where a full path like '/product/bs-101' was passed
  if (rawStr.startsWith('/product/')) {
    const parts = rawStr.replace('/product/', '').split('/').filter(Boolean);
    if (parts.length > 0) {
      rawStr = parts[0];
    }
  }

  const cleanId = rawStr.toLowerCase().trim();
  const upperName = prodName.toUpperCase();

  // 1. Match Mocha Brown (bs-101)
  if (
    cleanId === 'bs-101' || cleanId === '101' || cleanId === '105' || cleanId === 'prod-101' || cleanId === 'prod-105' ||
    cleanId === 'mocha-brown-embroidered-co-ord-set' ||
    upperName.includes('MOCHA BROWN') || upperName.includes('CHESTNUT BLOOM')
  ) {
    return SEO_PRODUCT_MAPPINGS['bs-101'];
  }

  // 2. Match Teal Embroidered (bs-102)
  if (
    cleanId === 'bs-102' || cleanId === '102' ||
    cleanId === 'teal-embroidered-floral-co-ord-set' ||
    upperName.includes('TEAL EMBROIDERED') || upperName.includes('OCEAN BLOOM')
  ) {
    return SEO_PRODUCT_MAPPINGS['bs-102'];
  }

  // 3. Match Blush Pink (bs-104)
  if (
    cleanId === 'bs-104' || cleanId === '104' ||
    cleanId === 'blush-pink-embroidered-floral-co-ord-set' ||
    upperName.includes('BLUSH PINK') || upperName.includes('ROSEWOOD BLOOM')
  ) {
    return SEO_PRODUCT_MAPPINGS['bs-104'];
  }

  // 4. Match Sage Bloom Corset (bs-103)
  if (
    cleanId === 'bs-103' || cleanId === '103' || cleanId === '106' || cleanId === 'prod-102' || cleanId === 'bs-106' ||
    cleanId === 'sage-bloom-embroidered-corset' ||
    upperName.includes('SAGE BLOOM') || upperName.includes('GILDED MIST') || upperName.includes('PEACH BLOOM CORSET')
  ) {
    return SEO_PRODUCT_MAPPINGS['bs-103'];
  }

  // 5. Match Ivory Heart Corset Kurti (109)
  if (
    cleanId === '109' || cleanId === 'bs-105' || cleanId === 'prod-109' || cleanId === 'bs-109' ||
    cleanId === 'ivory-heart-corset-kurti' ||
    upperName.includes('IVORY HEART') || upperName.includes('CORA COTTON')
  ) {
    return SEO_PRODUCT_MAPPINGS['109'];
  }

  // Dynamic fallback for any other catalog product
  const canonicalId = cleanId || 'garment';
  const slug = slugify(prodName || 'luxury-atelier-piece');
  const path = slug ? `/product/${canonicalId}/${slug}` : `/product/${canonicalId}`;

  return {
    id: canonicalId,
    slug: slug,
    url: path,
    canonicalUrl: `https://houseofurvaah.com${path}`,
    title: prodName ? `${prodName} | House of Urvaah` : 'House of Urvaah | Official Online Store',
    description: (prodObj && prodObj.description) ? prodObj.description : 'Shop luxury architectural tailoring and couture silhouettes at House of Urvaah.',
    keywords: prodName ? `${prodName}, luxury fashion, House of Urvaah` : 'luxury fashion, House of Urvaah'
  };
};

/**
 * Returns the SEO-friendly URL for a product, optionally appending search params / hash
 */
export const getProductUrl = (productOrId, extraQueryOrHash = '') => {
  const canonical = resolveProductCanonical(productOrId);
  const base = canonical ? canonical.url : '/';

  if (!extraQueryOrHash) return base;

  const prefix = extraQueryOrHash.startsWith('?') || extraQueryOrHash.startsWith('#') ? '' : '?';
  return `${base}${prefix}${extraQueryOrHash}`;
};
