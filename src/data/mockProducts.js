import { getSupabaseMediaUrl } from '../lib/supabase';

export const CATEGORIES = [
  {
    id: 'corset-tops',
    name: 'CORSET TOPS',
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1000',
    itemCount: '24 Items',
    subcategories: [
      { name: 'Embroidered Corsets', featured: true },
      { name: 'Contoured Bodices', featured: true },
      { name: 'Satin & Silk Corsets', featured: false }
    ],
    promo: {
      title: 'CONTOURED SILHOUETTES',
      subtitle: 'CORSET COLLECTION',
      image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800'
    }
  },
  {
    id: 'co-ord-sets',
    name: 'CO-ORD SETS',
    image: 'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&q=80&w=1000',
    itemCount: '32 Items',
    subcategories: [
      { name: 'Printed Ensembles', featured: true },
      { name: 'Tailored Two-Piece', featured: true },
      { name: 'Resort Wear Sets', featured: false }
    ],
    promo: {
      title: 'MATCHING ENSEMBLES',
      subtitle: 'CO-ORD SETS',
      image: 'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&q=80&w=800'
    }
  },
  {
    id: 'summer-dresses',
    name: 'SUMMER DRESSES',
    image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=1000',
    itemCount: '45 Items',
    subcategories: [
      { name: 'Breezy Linen Midis', featured: true },
      { name: 'Floral Maxis', featured: true },
      { name: 'Sundresses', featured: false }
    ],
    promo: {
      title: 'BREEZY ELEGANCE',
      subtitle: 'SUMMER DRESSES',
      image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=800'
    }
  },
  {
    id: 'party-wear',
    name: 'PARTY WEAR',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1000',
    itemCount: '38 Items',
    subcategories: [
      { name: 'Cocktail Dresses', featured: true },
      { name: 'Evening Gowns', featured: true },
      { name: 'Sequined Edits', featured: false }
    ],
    promo: {
      title: 'NIGHT OUT & EVENINGS',
      subtitle: 'PARTY WEAR',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800'
    }
  }
];

export const FEATURED_CATEGORIES = [
  {
    id: 'corset-tops',
    name: 'CORSET TOPS',
    subtitle: 'CONTOURED SILHOUETTES',
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1000',
    link: '#corset-tops',
  },
  {
    id: 'co-ord-sets',
    name: 'CO-ORD SETS',
    subtitle: 'MATCHING ENSEMBLES',
    image: 'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&q=80&w=1000',
    link: '#co-ord-sets',
  },
  {
    id: 'summer-dresses',
    name: 'SUMMER DRESSES',
    subtitle: 'BREEZY & FLUID',
    image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=1000',
    link: '#summer-dresses',
  },
  {
    id: 'party-wear',
    name: 'PARTY WEAR',
    subtitle: 'GLAMOROUS EVENINGS',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1000',
    link: '#party-wear',
  }
];

const RAW_BEST_SELLERS_PRODUCTS = [
  {
    id: 'bs-101',
    name: 'CHESTNUT BLOOM SET',
    price: 8990,
    originalPrice: 11990,
    category: 'PARTY WEAR',
    subcategory: 'Blazers & Tailoring',
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
    id: 'bs-102',
    name: 'CERULEAN GARDEN SET',
    price: 10990,
    category: 'CO-ORD SETS',
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
    additionalInfo: 'Fabric: Embroidered fabric with sequin detailing\nSkirt hem: Hand-finished potli trim\nClosure: Adjustable tie-back (top), side zip on left of skirt\nLining: Fully lined (top and skirt)\nAvailable sizes: S, M, L\nTop: Lightly Padded',
    additionalInfoText: 'Fabric: Embroidered fabric with sequin detailing\nSkirt hem: Hand-finished potli trim\nClosure: Adjustable tie-back (top), side zip on left of skirt\nLining: Fully lined (top and skirt)\nAvailable sizes: S, M, L\nTop: Lightly Padded'
  },
  {
    id: 'bs-103',
    name: 'GILDED MIST CORSET',
    price: 12990,
    category: 'CORSET TOPS',
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
    id: 'bs-104',
    name: 'ROSEWOOD BLOOM SET',
    price: 4990,
    category: 'CORSET TOPS',
    subcategory: 'Tops & Shirts',
    tag: 'ESSENTIAL',
    isNew: false,
    isBestSeller: true,
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
    id: 'bs-105',
    name: 'Ivory Corset Kurti',
    price: 8990,
    originalPrice: 11990,
    category: 'CO-ORD SETS',
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
  }
];

const RAW_MOCK_PRODUCTS = [
  {
    id: 'prod-101',
    name: 'CHESTNUT BLOOM SET',
    price: 8990,
    originalPrice: 11990,
    category: 'PARTY WEAR',
    subcategory: 'Blazers & Tailoring',
    tag: 'NEW IN',
    isNew: true,
    isBestSeller: true,
    image: '/assets/Images/Brown01.png',
    hoverImage: '/assets/Images/Brown04.png',
    colors: ['#111111', '#F5F5F0', '#4A3B32'],
    sizes: ['XS', 'S', 'M', 'L'],
    description: 'A spaghetti-strap top and mini skirt set in a rich brown floral embroidered fabric with intricate sequin detailing. A low, backless silhouette with an adjustable tie-back on the top, finished with a potli-trimmed skirt hem for texture.\nFully lined for comfort, with a smooth side-zip closure on the skirt.'
  },
  {
    id: 'prod-102',
    name: 'GILDED MIST CORSET',
    price: 12990,
    category: 'CORSET TOPS',
    subcategory: 'Corset Sets',
    tag: 'EDITORIAL',
    isNew: true,
    isBestSeller: true,
    image: '/assets/Images/Corset04.png',
    hoverImage: '/assets/Images/Corset01.png',
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
    id: 'prod-103',
    name: 'OVERSIZED TRENCH COAT WITH BELT',
    price: 14990,
    originalPrice: 18990,
    category: 'PARTY WEAR',
    subcategory: 'Coats & Jackets',
    tag: 'BEST SELLER',
    isNew: false,
    isBestSeller: true,
    image: '/assets/Images/Brown04.png',
    hoverImage: '/assets/Images/Brown01.png',
    colors: ['#C9A66B', '#111111'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'Water-resistant double-breasted trench coat with storm flap, adjustable waist belt, and shoulder epaulettes.'
  },
  {
    id: 'prod-104',
    name: 'MINIMALIST MONOCHROME CO-ORD SET',
    price: 10990,
    category: 'CO-ORD SETS',
    subcategory: 'Co-ord Sets',
    tag: 'NEW IN',
    isNew: true,
    isBestSeller: true,
    image: '/assets/Images/Blue01.png',
    hoverImage: '/assets/Images/Blue04.png',
    colors: ['#111111', '#F5F5F0'],
    sizes: ['XS', 'S', 'M', 'L'],
    description: 'Matching two-piece set featuring structured crop vest and high-waisted wide-leg tailored trousers.'
  },
  {
    id: 'prod-105',
    name: 'RIBBED CASHMERE TURTLENECK SWEATER',
    price: 7990,
    category: 'SUMMER DRESSES',
    subcategory: 'Cashmere Sweaters',
    tag: 'ESSENTIAL',
    isNew: false,
    isBestSeller: true,
    image: '/assets/Images/Peach04.png',
    hoverImage: '/assets/Images/Peach02.png',
    colors: ['#F5F5F0', '#111111', '#8B0000'],
    sizes: ['XS', 'S', 'M', 'L'],
    description: 'Pure Grade-A Mongolian cashmere sweater with ultra-soft ribbed knit texture and wide relaxed cuffs.'
  },
  {
    id: 'prod-106',
    name: 'MINIMALIST LEATHER SHOULDER BAG',
    price: 9990,
    category: 'PARTY WEAR',
    subcategory: 'Calfskin Shoulder Bags',
    tag: 'LIMITED',
    isNew: true,
    isBestSeller: true,
    image: '/assets/Images/Peach02.png',
    hoverImage: '/assets/Images/Peach01.png',
    colors: ['#111111', '#8B0000'],
    sizes: ['ONE SIZE'],
    description: 'Full-grain calfskin leather shoulder bag with magnetic flap closure and embossed House of Uraah logo.'
  },
  {
    id: 'prod-107',
    name: 'PLEATED WIDE-LEG TAILORED TROUSERS',
    price: 6490,
    category: 'CO-ORD SETS',
    subcategory: 'High-Waisted Wide Leg',
    tag: 'NEW IN',
    isNew: true,
    isBestSeller: true,
    image: '/assets/Images/Blue04.png',
    hoverImage: '/assets/Images/Blue01.png',
    colors: ['#111111', '#F5F5F0'],
    sizes: ['XS', 'S', 'M', 'L'],
    description: 'High-waisted wide-leg trousers featuring front pleats, slant pockets, and subtle break at the hem.'
  },
  {
    id: 'prod-108',
    name: 'OVERSIZED POPLIN WHITE SHIRT',
    price: 4990,
    category: 'CORSET TOPS',
    subcategory: 'Oversized Linen Shirts',
    tag: 'BEST SELLER',
    isNew: false,
    isBestSeller: true,
    image: '/assets/Images/Peach01.png',
    hoverImage: '/assets/Images/Corset04.png',
    colors: ['#FFFFFF', '#767676', '#111111'],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Crisp 100% organic cotton poplin button-down shirt with drop shoulders and extended pointed collar.'
  }
];

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
