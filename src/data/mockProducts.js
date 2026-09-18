import { getSupabaseMediaUrl } from '../lib/supabase';

export const CATEGORIES = [
  {
    id: 'new-in',
    name: 'NEW IN',
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1000',
    itemCount: '64 Items',
    subcategories: [
      { name: 'Weekly Drop #34', featured: true },
      { name: 'Studio Capsule Edit', featured: true },
      { name: 'Monochrome Outerwear', featured: false },
      { name: 'Silk & Satin Collection', featured: false },
    ],
    promo: {
      title: 'DROP #34 / W26',
      subtitle: 'LIMITED RUNWAY PIECES',
      image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=800'
    }
  },
  {
    id: 'clothing',
    name: 'CLOTHING',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1000',
    itemCount: '184 Items',
    subcategories: [
      { name: 'Dresses & Jumpsuits', featured: true },
      { name: 'Blazers & Tailoring', featured: true },
      { name: 'Co-ord Sets', featured: true },
      { name: 'Tops & Shirts', featured: false },
      { name: 'Knitwear & Sweaters', featured: false },
      { name: 'Coats & Jackets', featured: false },
      { name: 'Trousers & Skirts', featured: false },
      { name: 'Denim Collection', featured: false },
    ],
    promo: {
      title: 'THE TAILORED EDIT',
      subtitle: 'AUTUMN / WINTER 2026',
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800'
    }
  },
  {
    id: 'dresses',
    name: 'DRESSES',
    image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=1000',
    itemCount: '52 Items',
    subcategories: [
      { name: 'Silk & Satin Midis', featured: true },
      { name: 'Draped Maxis', featured: true },
      { name: 'Tailored Blazer Dresses', featured: false },
      { name: 'Minimalist Minis', featured: false },
      { name: 'Evening & Party', featured: false },
    ],
    promo: {
      title: 'FLUID SILHOUETTES',
      subtitle: 'PURE SILK EDITION',
      image: 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&q=80&w=800'
    }
  },
  {
    id: 'tops',
    name: 'TOPS',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=1000',
    itemCount: '48 Items',
    subcategories: [
      { name: 'Oversized Linen Shirts', featured: true },
      { name: 'Asymmetric Blouses', featured: false },
      { name: 'Minimalist Corsets', featured: false },
      { name: 'Basic Knit Tops', featured: false },
    ],
    promo: {
      title: 'STRUCTURED BLOUSES',
      subtitle: 'ESSENTIAL TOPS',
      image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&q=80&w=800'
    }
  },
  {
    id: 'knitwear',
    name: 'KNITWEAR',
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&q=80&w=1000',
    itemCount: '36 Items',
    subcategories: [
      { name: 'Cashmere Sweaters', featured: true },
      { name: 'Chunky Ribbed Knits', featured: true },
      { name: 'Knit Cardigans & Vests', featured: false },
      { name: 'Knit Dresses', featured: false },
    ],
    promo: {
      title: 'ARCHITECTURAL KNITS',
      subtitle: 'MONGOLIAN CASHMERE',
      image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&q=80&w=800'
    }
  },
  {
    id: 'outerwear',
    name: 'OUTERWEAR',
    image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=1000',
    itemCount: '42 Items',
    subcategories: [
      { name: 'Oversized Trench Coats', featured: true },
      { name: 'Double-Breasted Blazers', featured: true },
      { name: 'Wool Tailored Overcoats', featured: false },
      { name: 'Leather Biker Jackets', featured: false },
    ],
    promo: {
      title: 'STATEMENT COATS',
      subtitle: 'WOOL & CASHMERE BLENDS',
      image: 'https://images.unsplash.com/photo-1548624149-f1b9616ed7be?auto=format&fit=crop&q=80&w=800'
    }
  },
  {
    id: 'trousers',
    name: 'TROUSERS',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1000',
    itemCount: '38 Items',
    subcategories: [
      { name: 'High-Waisted Wide Leg', featured: true },
      { name: 'Pleated Tailored Pants', featured: true },
      { name: 'Straight-Leg Jeans', featured: false },
      { name: 'Fluid Satin Trousers', featured: false },
    ],
    promo: {
      title: 'WIDE-LEG SILHOUETTES',
      subtitle: 'TAILORED LEGS',
      image: 'https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&q=80&w=800'
    }
  },
  {
    id: 'shoes',
    name: 'SHOES',
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=1000',
    itemCount: '28 Items',
    subcategories: [
      { name: 'Leather Ankle Boots', featured: true },
      { name: 'Minimalist Mule Heels', featured: false },
      { name: 'Strappy Sandals', featured: false },
      { name: 'Loafers & Flats', featured: false },
    ],
    promo: {
      title: 'FOOTWEAR CAPSULE',
      subtitle: 'ITALIAN LEATHER',
      image: 'https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?auto=format&fit=crop&q=80&w=800'
    }
  },
  {
    id: 'accessories',
    name: 'BAGS & ACCESSORIES',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=1000',
    itemCount: '45 Items',
    subcategories: [
      { name: 'Calfskin Shoulder Bags', featured: true },
      { name: 'Structured Totes', featured: false },
      { name: 'Minimalist Leather Belts', featured: false },
      { name: 'Gold Statement Jewelry', featured: false },
    ],
    promo: {
      title: 'LEATHER GOODS',
      subtitle: 'ARTISANAL ACCENTS',
      image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&q=80&w=800'
    }
  },
  {
    id: 'sale',
    name: 'SALE',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=1000',
    itemCount: 'UP TO 50% OFF',
    subcategories: [
      { name: 'Dresses Special Prices', featured: true },
      { name: 'Outerwear Reductions', featured: true },
      { name: 'Last Sizes', featured: false },
    ],
    promo: {
      title: 'SEASONAL REDUCTIONS',
      subtitle: 'DISCOVER ARCHIVE PIECES',
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=800'
    }
  }
];

export const FEATURED_CATEGORIES = [
  {
    id: 'cat-dresses',
    name: 'DRESSES & SILK',
    subtitle: 'FLUID SILHOUETTES',
    image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=1000',
    link: '#dresses',
  },
  {
    id: 'cat-outerwear',
    name: 'TAILORED OUTERWEAR',
    subtitle: 'WOOL & CASHMERE',
    image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=1000',
    link: '#outerwear',
  },
  {
    id: 'cat-coords',
    name: 'CO-ORD SETS',
    subtitle: 'MONOCHROME SETS',
    image: 'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&q=80&w=1000',
    link: '#clothing',
  },
  {
    id: 'cat-knitwear',
    name: 'ARCHITECTURAL KNITS',
    subtitle: 'CHUNKY TEXTURES',
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&q=80&w=1000',
    link: '#knitwear',
  },
  {
    id: 'cat-trousers',
    name: 'WIDE-LEG TROUSERS',
    subtitle: 'HIGH-WAISTED CUTS',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1000',
    link: '#trousers',
  },
  {
    id: 'cat-leather',
    name: 'BAGS & ACCESSORIES',
    subtitle: 'MINIMALIST ACCENTS',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=1000',
    link: '#accessories',
  }
];

const RAW_BEST_SELLERS_PRODUCTS = [
  {
    id: 'bs-101',
    name: 'OVERSIZED TAILORED BLAZER',
    price: 8990,
    originalPrice: 11990,
    category: 'OUTERWEAR',
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
    description: 'Structured single-breasted blazer in warm taupe brown with padded shoulders and notched lapels.'
  },
  {
    id: 'bs-102',
    name: 'DARK BLUE WIDE LEG TAILORED SET',
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
    description: 'Printed two-piece ensemble featuring a halter neck top and matching floral mini skirt.'
  },
  {
    id: 'bs-103',
    name: 'PEACH BLOOM CORSET SET',
    price: 12990,
    category: 'CO-ORD SETS',
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
    description: 'Floral embroidered corset bodice with sweetheart neckline and matching blossom skirt.'
  },
  {
    id: 'bs-104',
    name: 'MINIMALIST RIBBED SILK TOP',
    price: 4990,
    category: 'ACCESSORIES',
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
    description: 'Fine silk rib knit fitted top in dusty rose blush with delicate crew neckline.'
  }
];

const RAW_MOCK_PRODUCTS = [
  {
    id: 'prod-101',
    name: 'DOUBLE-BREASTED OVERSIZED BLAZER',
    price: 8990,
    originalPrice: 11990,
    category: 'OUTERWEAR',
    subcategory: 'Blazers & Tailoring',
    tag: 'NEW IN',
    isNew: true,
    isBestSeller: true,
    image: '/assets/Images/Brown01.png',
    hoverImage: '/assets/Images/Brown04.png',
    colors: ['#111111', '#F5F5F0', '#4A3B32'],
    sizes: ['XS', 'S', 'M', 'L'],
    description: 'Structured double-breasted blazer made of premium virgin wool blend with peak lapels, flap pockets, and back vent.'
  },
  {
    id: 'prod-102',
    name: 'DRAPED ASYMMETRICAL SILK DRESS',
    price: 12990,
    category: 'DRESSES',
    subcategory: 'Silk & Satin Midis',
    tag: 'EDITORIAL',
    isNew: true,
    isBestSeller: true,
    image: '/assets/Images/Corset04.png',
    hoverImage: '/assets/Images/Peach01.png',
    colors: ['#FFFFFF', '#111111'],
    sizes: ['S', 'M', 'L'],
    description: 'Flowing mulberry silk mid-length dress with asymmetric draped neckline and side slit.'
  },
  {
    id: 'prod-103',
    name: 'OVERSIZED TRENCH COAT WITH BELT',
    price: 14990,
    originalPrice: 18990,
    category: 'OUTERWEAR',
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
    category: 'KNITWEAR',
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
    category: 'ACCESSORIES',
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
    category: 'TROUSERS',
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
    category: 'TOPS',
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
