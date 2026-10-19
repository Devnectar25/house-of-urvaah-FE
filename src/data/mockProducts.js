import { getSupabaseMediaUrl } from '../lib/supabase';

export const CATEGORIES = [
  {
    id: 'new-arrivals',
    name: 'NEW ARRIVALS',
    image: '/assets/Images/Brown01.png',
    itemCount: '6 Items',
    subcategories: [
      { name: 'Latest Atelier Drops', featured: true },
      { name: 'Co-Ord Sets', featured: true },
      { name: 'Festive Silhouettes', featured: true }
    ],
    promo: {
      title: 'CONTEMPORARY ATELIER',
      subtitle: 'NEW ARRIVALS',
      image: '/assets/Images/Brown01.png'
    }
  },
  {
    id: 'co-ord-sets',
    name: 'CO-ORD SETS',
    image: '/assets/Images/Blue02.png',
    itemCount: '3 Items',
    subcategories: [
      { name: 'Printed Ensembles', featured: true },
      { name: 'Embroidered Sets', featured: true },
      { name: 'Resort Wear Sets', featured: false }
    ],
    promo: {
      title: 'MATCHING ENSEMBLES',
      subtitle: 'CO-ORD SETS',
      image: '/assets/Images/Blue02.png'
    }
  },
  {
    id: 'festive-wear',
    name: 'FESTIVE WEAR',
    image: '/assets/Images/Peach04.png',
    itemCount: '2 Items',
    subcategories: [
      { name: 'Gharara Ensembles', featured: true },
      { name: 'Embroidered Corsets', featured: true },
      { name: 'Zari Highlights', featured: false }
    ],
    promo: {
      title: 'FESTIVE & WEDDING CELEBRATIONS',
      subtitle: 'FESTIVE WEAR',
      image: '/assets/Images/Peach04.png'
    }
  },
  {
    id: 'kurtis-and-dresses',
    name: 'KURTIS AND DRESSES',
    image: '/assets/Images/Kurti_2.png',
    itemCount: '1 Item',
    subcategories: [
      { name: 'Cora Cotton Kurti Dress', featured: true },
      { name: 'Wear It Two Ways', featured: true },
      { name: 'Day-to-Evening', featured: false }
    ],
    promo: {
      title: 'HERITAGE REFINED',
      subtitle: 'KURTI DRESSES',
      image: '/assets/Images/Kurti_2.png'
    }
  },
  {
    id: 'corset-tops',
    name: 'CORSET TOPS',
    image: '/assets/Images/Corset01.png',
    itemCount: '1 Item',
    subcategories: [
      { name: 'Raw Tissue Silk Corsets', featured: true },
      { name: 'Wear It Two Ways', featured: true },
      { name: 'Golden Zari Tops', featured: false }
    ],
    promo: {
      title: 'CONTOURED SILHOUETTES',
      subtitle: 'CORSET COLLECTION',
      image: '/assets/Images/Corset01.png'
    }
  }
];

export const FEATURED_CATEGORIES = [
  {
    id: 'new-arrivals',
    name: 'NEW ARRIVALS',
    subtitle: 'LATEST RUNWAY DROPS',
    image: '/assets/Images/Brown01.png',
    link: '/new-arrivals',
  },
  {
    id: 'co-ord-sets',
    name: 'CO-ORD SETS',
    subtitle: 'MATCHING ENSEMBLES',
    image: '/assets/Images/Blue02.png',
    link: '/co-ord-sets',
  },
  {
    id: 'festive-wear',
    name: 'FESTIVE WEAR',
    subtitle: 'FESTIVE & WEDDINGS',
    image: '/assets/Images/Peach04.png',
    link: '/festive-wear',
  },
  {
    id: 'kurtis-and-dresses',
    name: 'KURTIS AND DRESSES',
    subtitle: 'VERSATILE SILHOUETTES',
    image: '/assets/Images/Kurti_2.png',
    link: '/kurtis-and-dresses',
  }
];

const RAW_BEST_SELLERS_PRODUCTS = [
  {
    id: 'bs-102',
    name: 'Teal Embroidered Floral Co-Ord Set',
    price: 10990,
    originalPrice: 13990,
    category: 'CO-ORD SETS',
    categories: ['New Arrivals', 'Co-ord Sets', 'new-arrivals', 'co-ord-sets'],
    occasion: 'Beach and Vacation',
    tags: [],
    fabric: 'Fluid Silk Blend',
    fabric_slug: 'ocean-bloom',
    subcategory: 'Printed Ensembles',
    tag: 'EDITORIAL',
    isNew: true,
    isBestSeller: true,
    image: '/assets/Images/Blue02.png',
    hoverImage: '/assets/Images/Blue03.png',
    gallery: [
      '/assets/Images/Blue02.png',
      '/assets/Images/Blue03.png',
      '/assets/Images/Blue04.png',
      '/assets/Images/Blue01.png'
    ],
    colors: ['#5B9BD5', '#111111'],
    sizes: ['XS', 'S', 'M', 'L'],
    description: 'A halter-neck top and mini skirt set in a teal floral embroidered fabric, finished with all-over sequin detailing that catches the light with every move. The skirt hem is edged with a hand-finished potli trim for a playful, textured finish.\nFully lined for comfort, with an adjustable tie-back on the top for a customizable fit and a smooth side-zip closure on the skirt.\nStyle it for a beach day, a vacation dinner, or a night out — this one does double duty.',
    additionalInfo: 'Fabric: Embroidered fabric with sequin detailing\nSkirt hem: Hand-finished potli trim\nClosure: Adjustable tie-back (top), side zip on left of skirt\nLining: Fully lined (top and skirt)\nAvailable sizes: S, M, L\nTop: Lightly Padded'
  },
  {
    id: 'bs-104',
    name: 'Blush Pink Embroidered Floral Co-Ord Set',
    price: 4990,
    originalPrice: 6990,
    category: 'CO-ORD SETS',
    categories: ['New Arrivals', 'Co-ord Sets', 'new-arrivals', 'co-ord-sets'],
    occasion: 'Night Out',
    tags: [],
    fabric: 'Pure Silk Rib Knit',
    fabric_slug: 'petal-threadwork',
    subcategory: 'Tops & Skirts',
    tag: 'ESSENTIAL',
    isNew: false,
    isBestSeller: true,
    inStock: false,
    stockQuantity: 0,
    image: '/assets/Images/Peach02.png',
    hoverImage: '/assets/Images/Peach04.png',
    gallery: [
      '/assets/Images/Peach02.png',
      '/assets/Images/Peach04.png',
      '/assets/Images/Peach03.png',
      '/assets/Images/Peach01.png'
    ],
    colors: ['#F5F5F0', '#111111'],
    sizes: ['S', 'M', 'L'],
    description: 'A cap-sleeve top and mini skirt set in a soft peach-pink floral embroidered fabric with delicate sequin work throughout. The skirt hem finishes in a hand-detailed potli trim, and a corset-style lace-up back on the top gives it a fitted, flattering silhouette.\nFully lined, with a side-zip closure on the skirt for easy wear.\nSoft enough for daytime, sharp enough for evening.'
  },
  {
    id: 'bs-101',
    name: 'Mocha Brown Embroidered Co-Ord Set',
    price: 8990,
    originalPrice: 11990,
    category: 'CO-ORD SETS',
    categories: ['New Arrivals', 'Co-ord Sets', 'new-arrivals', 'co-ord-sets'],
    occasion: 'Night Out',
    tags: [],
    fabric: 'Virgin Wool Blend',
    fabric_slug: 'heritage-weave',
    subcategory: 'Co-ord Sets',
    tag: 'BEST SELLER',
    isNew: false,
    isBestSeller: true,
    image: '/assets/Images/Brown02.png',
    hoverImage: '/assets/Images/Brown03.png',
    gallery: [
      '/assets/Images/Brown02.png',
      '/assets/Images/Brown03.png',
      '/assets/Images/Brown04.png',
      '/assets/Images/Brown01.png'
    ],
    colors: ['#4A3B32', '#111111', '#F5F5F0'],
    sizes: ['XS', 'S', 'M', 'L'],
    description: 'A spaghetti-strap top and mini skirt set in a rich brown floral embroidered fabric with intricate sequin detailing. A low, backless silhouette with an adjustable tie-back on the top, finished with a potli-trimmed skirt hem for texture.\nFully lined for comfort, with a smooth side-zip closure on the skirt.'
  },
  {
    id: 'bs-105',
    name: 'Ivory Heart Corset Kurti/Dress',
    price: 8990,
    originalPrice: 11990,
    category: 'KURTIS AND DRESSES',
    categories: ['New Arrivals', 'Kurtis and Dresses', 'new-arrivals', 'kurtis-and-dresses'],
    occasion: 'College and Office',
    tags: ['Wear it two ways'],
    fabric: 'Cora Cotton',
    fabric_slug: 'cora-cotton',
    subcategory: 'Kurti Ensembles',
    tag: 'NEW IN',
    isNew: true,
    isBestSeller: true,
    image: '/assets/Images/Kurti_2.png',
    hoverImage: '/assets/Images/Kurti_4.png',
    gallery: [
      '/assets/Images/Kurti_2.png',
      '/assets/Images/Kurti_4.png',
      '/assets/Images/Kurti_3.png',
      '/assets/Images/Kurti_1.png'
    ],
    colors: ['#8B0000', '#111111', '#F5F5F0'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'A everyday-easy piece that works two ways wear it buttoned up as a mini dress, or unbutton the front placket for a more relaxed, styled-open kurti look over jeans. Made in breathable cora cotton, designed for all-day comfort in humid, Indian-summer weather.\nFinished with a square neckline trimmed in delicate floral lace, a corset-style lace-up back for a snatched, tailored fit, and all-over heart-shaped butti embroidery in a soft ivory tone. Fully lined in cotton for added comfort and opacity.\nFrom college to the office to a weekend occasion — one piece, three ways to wear it.',
    additionalInfo: 'Fabric: Cora cotton (breathable, all-day wear)\nLining: Cotton lining\nNeckline: Square neck with floral lace trim\nClosure: Front button placket, corset-style lace-up back\nEmbroidery: All-over heart-shaped butti embroidery\nStyling: Wear buttoned as a dress, or open-front as a kurti\nAvailable sizes: XS, S, M, L'
  },
  {
    id: 'bs-103',
    name: 'Sage Bloom Embroidered Corset',
    price: 12990,
    category: 'FESTIVE WEAR',
    categories: ['New Arrivals', 'Festive Wear', 'Corset Tops', 'new-arrivals', 'festive-wear', 'corset-tops'],
    occasion: '',
    tags: ['Wear it two ways'],
    fabric: 'Tissue Silk',
    fabric_slug: 'raw-tissue-silk',
    subcategory: 'Corset Sets',
    tag: 'NEW IN',
    isNew: true,
    isBestSeller: true,
    image: '/assets/Images/Corset01.png',
    hoverImage: '/assets/Images/Corset02.png',
    gallery: [
      '/assets/Images/Corset01.png',
      '/assets/Images/Corset02.png',
      '/assets/Images/Corset03.png',
      '/assets/Images/Corset04.png'
    ],
    colors: ['#FFFFFF', '#111111'],
    sizes: ['S', 'M', 'L'],
    description: 'A statement corset top in raw tissue silk, hand-embroidered with rich golden zari work and delicate sequin detailing throughout. Boned below the bust for structure, with soft padding for comfort and shape no additional support needed underneath.\nDesigned to be worn endlessly: pair it over a saree for a modern draped look, with a skirt for evening, or dress it down with jeans or palazzos for a statement daytime moment. One corset, however many ways you want to style it.\nClosure: adjustable lace-up back.'
  },
  {
    id: 'bs-108',
    name: 'Gharara Set',
    price: 15990,
    originalPrice: 19990,
    category: 'FESTIVE WEAR',
    categories: ['New Arrivals', 'Festive Wear', 'new-arrivals', 'festive-wear'],
    occasion: 'Festive and Wedding',
    tags: ['Wear it two ways'],
    fabric: 'Cashmere Blend',
    fabric_slug: 'festive-heritage',
    subcategory: 'Gharara Sets',
    tag: 'EDITORIAL',
    isNew: true,
    isBestSeller: true,
    image: '/assets/Images/Peach04.png',
    hoverImage: '/assets/Images/Peach02.png',
    gallery: [
      '/assets/Images/Peach04.png',
      '/assets/Images/Peach02.png',
      '/assets/Images/Peach03.png',
      '/assets/Images/Peach01.png'
    ],
    colors: ['#F5F5F0', '#111111', '#8B0000'],
    sizes: ['XS', 'S', 'M', 'L'],
    description: 'A versatile festive ensemble featuring an intricately embroidered short kurti with a hook-on peplum and flared gharara trousers. Wear it with the peplum for full celebratory volume, or detach for a sleek, contemporary silhouette.\nWear it two ways for wedding soirees and festive celebrations.'
  }
];

const RAW_MOCK_PRODUCTS = [...RAW_BEST_SELLERS_PRODUCTS];

const mapProductMedia = (product) => ({
  ...product,
  image: getSupabaseMediaUrl(product.image),
  hoverImage: product.hoverImage ? getSupabaseMediaUrl(product.hoverImage) : undefined,
  gallery: product.gallery ? product.gallery.map(getSupabaseMediaUrl) : [getSupabaseMediaUrl(product.image)]
});

export const BEST_SELLERS_PRODUCTS = RAW_BEST_SELLERS_PRODUCTS.map(mapProductMedia);
export const MOCK_PRODUCTS = RAW_MOCK_PRODUCTS.map(mapProductMedia);

export const ANNOUNCEMENTS = [
  "FREE EXPRESS SHIPPING ON ORDERS ABOVE ₹2999",
  "AUTUMN / WINTER 2026 WOMEN'S COLLECTION NOW LIVE — SHOP NOW",
  "COMPLIMENTARY ECO-FRIENDLY GIFT WRAPPING AVAILABLE AT CHECKOUT"
];
