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
    name: 'OVERSIZED TAILORED BLAZER',
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
    description: 'Floral embroidered corset bodice with sweetheart neckline and matching blossom skirt.'
  },
  {
    id: 'bs-104',
    name: 'MINIMALIST RIBBED SILK TOP',
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
    description: 'Fine silk rib knit fitted top in dusty rose blush with delicate crew neckline.'
  },
  {
    id: 'bs-105',
    name: 'EMBROIDERED SILK KURTI SET',
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
    description: 'Architectural embroidered silk kurti ensemble featuring intricate hand-finished detailing and flowing silhouette.'
  }
];

const RAW_MOCK_PRODUCTS = [
  {
    id: 'prod-101',
    name: 'DOUBLE-BREASTED OVERSIZED BLAZER',
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
    description: 'Structured double-breasted blazer made of premium virgin wool blend with peak lapels, flap pockets, and back vent.'
  },
  {
    id: 'prod-102',
    name: 'DRAPED ASYMMETRICAL SILK DRESS',
    price: 12990,
    category: 'SUMMER DRESSES',
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
