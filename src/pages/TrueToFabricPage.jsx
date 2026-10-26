import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Layers,
  ShoppingBag
} from 'lucide-react';
import { SEOHead } from '../components/common/SEOHead';
import { ProductCard } from '../components/common/ProductCard';
import { productApi } from '../services/productApi';
import { apiClient } from '../lib/apiClient';
import { MOCK_PRODUCTS } from '../data/mockProducts';

// Canonical fabric metadata dictionary
export const CANONICAL_FABRICS = [
  {
    id: 'blush-pink',
    slug: 'petal-threadwork',
    aliases: ['petal-threadwork', 'blush-pink', 'petal', 'threadwork'],
    tag: 'PETAL THREADWORK',
    fabricName: 'Petal Threadwork',
    videoTitle: 'Blush Pink Embroidered Floral Co-Ord Set',
    name: 'Blush Pink Embroidered Floral Co-Ord Set',
    subtitle: 'Tactile Tonal Embroidery & Delicate Micro-Sequins',
    description:
      'A refined tactile textile crafted with delicate tonal petal embroidery, light-reflecting micro-sequins, and hand-finished potli edging, crafted for soft daytime to evening transitions.',
    sensoryProfile: [
      { label: 'Texture', value: 'Embossed & Tactile' },
      { label: 'Sheen', value: 'Luminous Micro-Shimmer' },
      { label: 'Drape', value: 'Graceful & Flowing' },
      { label: 'Occasion', value: 'Evening & Festive' }
    ],
    videoPath: 'videos/Blush Pink Embroidered Floral Co-Ord Set_h264.mp4',
    defaultVideoUrl:
      'https://fhbdceauisvlcpmuzpmf.supabase.co/storage/v1/object/public/houseofurvaah-media/videos/Blush%20Pink%20Embroidered%20Floral%20Co-Ord%20Set_h264.mp4'
  },
  {
    id: 'mocha-brown',
    slug: 'heritage-weave',
    aliases: ['heritage-weave', 'mocha-brown', 'heritage', 'weave'],
    tag: 'HERITAGE WEAVE',
    fabricName: 'Heritage Weave',
    videoTitle: 'Mocha Brown Embroidered Co-Ord Set',
    name: 'Mocha Brown Embroidered Co-Ord Set',
    subtitle: 'Intricate Heirloom Embroidery & Radiant Sequin Highlights',
    description:
      'Rich earthy mocha tones interwoven with intricate heirloom floral embroidery and radiant sequin highlights, evoking traditional artistry crafted for contemporary silhouettes.',
    sensoryProfile: [
      { label: 'Texture', value: 'Intricate & Sculptural' },
      { label: 'Sheen', value: 'Subtle Gilded Glow' },
      { label: 'Drape', value: 'Structured & Fluid' },
      { label: 'Occasion', value: 'Night Out & Celebrations' }
    ],
    videoPath: 'videos/Mocha Brown Embroidered Co-Ord Set_h264.mp4',
    defaultVideoUrl:
      'https://fhbdceauisvlcpmuzpmf.supabase.co/storage/v1/object/public/houseofurvaah-media/videos/Mocha%20Brown%20Embroidered%20Co-Ord%20Set_h264.mp4'
  },
  {
    id: 'teal',
    slug: 'ocean-bloom',
    aliases: ['ocean-bloom', 'teal', 'ocean', 'bloom'],
    tag: 'OCEAN BLOOM',
    fabricName: 'Ocean Bloom',
    videoTitle: 'Teal Embroidered Floral Co-Ord Set',
    name: 'Teal Embroidered Floral Co-Ord Set',
    subtitle: 'Luminous Oceanic Florals & Handcrafted Potli Edging',
    description:
      'Luminous oceanic teal floral embroidery adorned with all-over light-reflecting sequins and playful handcrafted potli trims that catch every ray of ambient light with movement.',
    sensoryProfile: [
      { label: 'Texture', value: 'Dimensional & Sequined' },
      { label: 'Sheen', value: 'Prismatic Light-Catching' },
      { label: 'Drape', value: 'Supple & Effortless' },
      { label: 'Occasion', value: 'Resort, Beach & Evening' }
    ],
    videoPath: 'videos/Teal Embroidered Floral Co-Ord Set_h264.mp4',
    defaultVideoUrl:
      'https://fhbdceauisvlcpmuzpmf.supabase.co/storage/v1/object/public/houseofurvaah-media/videos/Teal%20Embroidered%20Floral%20Co-Ord%20Set_h264.mp4'
  },
  {
    id: 'cora-cotton',
    slug: 'cora-cotton',
    aliases: ['cora-cotton', 'cora', 'cotton'],
    tag: 'BREATHABLE CORA COTTON',
    fabricName: 'Cora Cotton',
    videoTitle: 'Ivory Heart Corset Kurti/Dress',
    name: 'Ivory Heart Corset Kurti/Dress',
    subtitle: 'Breathable Natural Ease & Dual-Layer Soft Cotton Lining',
    description:
      'Pure, breathable Cora cotton designed for all-day comfort in humid and warm climates, finished with soft cotton lining, square necklines, and delicate all-over heart butti embroidery.',
    sensoryProfile: [
      { label: 'Texture', value: 'Organic Crisp Weave' },
      { label: 'Sheen', value: 'Natural Matte Finish' },
      { label: 'Drape', value: 'Structured & Airy' },
      { label: 'Occasion', value: 'College, Office & Brunch' }
    ],
    videoPath: '',
    defaultVideoUrl: ''
  },
  {
    id: 'raw-tissue-silk',
    slug: 'raw-tissue-silk',
    aliases: ['raw-tissue-silk', 'tissue-silk', 'tissue', 'silk'],
    tag: 'ROYAL RAW TISSUE SILK',
    fabricName: 'Raw Tissue Silk',
    videoTitle: 'Sage Bloom Embroidered Corset',
    name: 'Sage Bloom Embroidered Corset',
    subtitle: 'Imperial Heritage Craftsmanship & Rich Golden Zari',
    description:
      'Authentic raw tissue silk hand-embroidered with rich golden zari threadwork and delicate sequin detailing, sculpted to hold structured contours with royal festive luster.',
    sensoryProfile: [
      { label: 'Texture', value: 'Crisp Metallic Weave' },
      { label: 'Sheen', value: 'Radiant Gold Luster' },
      { label: 'Drape', value: 'Sculptural & Regal' },
      { label: 'Occasion', value: 'Weddings & High Occasions' }
    ],
    videoPath: '',
    defaultVideoUrl: ''
  }
];

// Helper to normalize strings for comparison
const normalizeKey = (str) =>
  String(str || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-');

export const TrueToFabricPage = () => {
  const { fabricSlug } = useParams();
  const location = useLocation();
  const passedVideoName = location.state?.videoName;
  const passedTag = location.state?.tag;

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adminFabricConfig, setAdminFabricConfig] = useState(null);

  const currentSlug = useMemo(() => {
    return fabricSlug ? normalizeKey(fabricSlug) : 'all';
  }, [fabricSlug]);

  // Load all live products and admin fabric video configuration
  useEffect(() => {
    let isMounted = true;
    window.scrollTo({ top: 0, behavior: 'instant' });

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [prodsRes, fabricRes] = await Promise.all([
          productApi.getProducts({ active: true }).catch(() => MOCK_PRODUCTS),
          apiClient('/api/ui/fabric-video').catch(() => null)
        ]);

        if (!isMounted) return;

        const rawProds = Array.isArray(prodsRes)
          ? prodsRes
          : prodsRes?.data || MOCK_PRODUCTS;

        setProducts(rawProds);
        if (fabricRes?.success && fabricRes.data) {
          setAdminFabricConfig(fabricRes.data);
        }
      } catch (err) {
        console.warn('[TrueToFabricPage] Error loading data:', err);
        if (isMounted) setProducts(MOCK_PRODUCTS);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Merge canonical fabrics with any admin-configured videos
  const mergedFabrics = useMemo(() => {
    const list = [...CANONICAL_FABRICS];

    if (adminFabricConfig?.videos && Array.isArray(adminFabricConfig.videos)) {
      adminFabricConfig.videos.forEach((adminV, idx) => {
        const tagNorm = normalizeKey(adminV.tag || '');
        const idNorm = normalizeKey(adminV.id || '');
        const slugNorm = normalizeKey(adminV.slug || adminV.fabric_slug || '');

        const existingIdx = list.findIndex(
          (f) =>
            f.slug === slugNorm ||
            f.id === idNorm ||
            normalizeKey(f.tag) === tagNorm ||
            f.aliases.some((a) => a === slugNorm || a === tagNorm || a === idNorm)
        );

        const videoUrl = adminV.video_url || adminV.url || '';
        const description = adminV.description || '';

        if (existingIdx !== -1) {
          list[existingIdx] = {
            ...list[existingIdx],
            tag: adminV.tag || list[existingIdx].tag,
            videoTitle: adminV.title || adminV.name || list[existingIdx].videoTitle,
            name: adminV.title || adminV.name || list[existingIdx].name,
            description: description || list[existingIdx].description,
            defaultVideoUrl: videoUrl || list[existingIdx].defaultVideoUrl
          };
        } else if (tagNorm || adminV.title) {
          const newSlug = slugNorm || tagNorm || `fabric-${idx + 1}`;
          list.push({
            id: adminV.id || `custom-fabric-${idx + 1}`,
            slug: newSlug,
            aliases: [newSlug, tagNorm, idNorm].filter(Boolean),
            tag: adminV.tag || adminV.title || `FABRIC ${idx + 1}`,
            videoTitle: adminV.title || adminV.name || adminV.tag || `Fabric ${idx + 1}`,
            name: adminV.title || adminV.name || adminV.tag || `Fabric ${idx + 1}`,
            subtitle: 'Exclusive House of Urvaah Textile',
            description:
              description ||
              'A distinctive artisan fabric handcrafted with bespoke detailing for contemporary silhouettes.',
            sensoryProfile: [
              { label: 'Texture', value: 'Artisan Textile' },
              { label: 'Drape', value: 'Fluid' }
            ],
            videoPath: '',
            defaultVideoUrl: videoUrl
          });
        }
      });
    }

    return list;
  }, [adminFabricConfig]);

  // Resolve currently active fabric object
  const activeFabric = useMemo(() => {
    if (currentSlug === 'all') return null;

    return mergedFabrics.find(
      (f) =>
        f.slug === currentSlug ||
        f.id === currentSlug ||
        normalizeKey(f.tag) === currentSlug ||
        f.aliases.some((a) => a === currentSlug)
    );
  }, [currentSlug, mergedFabrics]);

  // Is this an unknown/invalid fabric slug?
  const isInvalidSlug = currentSlug !== 'all' && !activeFabric;

  // Filter products by selected fabric
  const matchingProducts = useMemo(() => {
    if (!products.length) return [];

    if (currentSlug === 'all') {
      return products;
    }

    if (!activeFabric) return [];

    return products.filter((p) => {
      // 1. Direct fabric_slug or fabricSlug match (authoritative)
      const pFabricSlug = normalizeKey(p.fabric_slug || p.fabricSlug || '');
      if (pFabricSlug) {
        return (
          pFabricSlug === activeFabric.slug ||
          pFabricSlug === activeFabric.id ||
          activeFabric.aliases.includes(pFabricSlug)
        );
      }

      // 2. Title matching fallback only if fabric_slug is not explicitly defined
      const pTitle = normalizeKey(p.title || p.name || '');
      if (activeFabric.slug === 'petal-threadwork' && pTitle.includes('blush-pink')) return true;
      if (activeFabric.slug === 'heritage-weave' && pTitle.includes('mocha-brown')) return true;
      if (activeFabric.slug === 'ocean-bloom' && pTitle.includes('teal')) return true;
      if (activeFabric.slug === 'cora-cotton' && pTitle.includes('ivory-heart')) return true;
      if (activeFabric.slug === 'raw-tissue-silk' && (pTitle.includes('sage-bloom') || pTitle.includes('tissue-silk'))) return true;

      // 3. Fabric name matching
      const pFabric = normalizeKey(p.fabric || '');
      if (pFabric && (pFabric.includes(activeFabric.slug) || activeFabric.slug.includes(pFabric))) {
        return true;
      }

      // 4. Tags matching
      const pTags = Array.isArray(p.tags) ? p.tags : [];
      if (
        pTags.some((t) => {
          const tNorm = normalizeKey(t);
          return tNorm === activeFabric.slug || activeFabric.aliases.includes(tNorm);
        })
      ) {
        return true;
      }

      // 5. Description matching
      const pDesc = (p.description || '').toLowerCase();
      const fabricTag = activeFabric.tag.toLowerCase();
      if (fabricTag && pDesc.includes(fabricTag)) return true;

      return false;
    });
  }, [products, currentSlug, activeFabric]);

  const displayTitle =
    passedVideoName ||
    activeFabric?.videoTitle ||
    activeFabric?.title ||
    activeFabric?.name ||
    (activeFabric ? activeFabric.tag : 'ALL OUTFITS');

  const displayTag = passedTag || activeFabric?.tag;

  return (
    <main className="w-full min-h-screen bg-white font-serif select-none pt-24 sm:pt-28 md:pt-32 pb-20">
      <SEOHead
        title={
          activeFabric
            ? `${displayTitle} | House of Urvaah`
            : `True to Fabric Store | Luxury Textile Artistry | House of Urvaah`
        }
        description={
          activeFabric
            ? activeFabric.description
            : `Explore the True to Fabric showcase at House of Urvaah. Pure Cora cotton, raw tissue silk with gold zari, and embroidered sequin fabrics.`
        }
        keywords={`House of Urvaah, ${displayTitle}, ${displayTag || 'textile artistry'}, luxury ethnic fabrics`}
      />

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 md:px-12">
        {isInvalidSlug ? (
          /* Not Found State for unknown fabric slug */
          <div className="max-w-2xl mx-auto py-20 px-6 bg-neutral-50 border border-neutral-200 text-center font-serif my-8">
            <Layers className="w-12 h-12 text-neutral-400 mx-auto mb-4 stroke-[1.25]" />
            <h1 className="text-2xl sm:text-3xl font-serif tracking-[0.12em] uppercase text-black mb-3">
              FABRIC NOT FOUND
            </h1>
            <p className="text-xs text-neutral-500 tracking-wider font-sans uppercase mb-6 max-w-md mx-auto leading-relaxed">
              We couldn't locate outfits for "{fabricSlug}".
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-2 bg-black text-white text-xs font-mono tracking-widest px-6 py-3 uppercase hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>RETURN TO HOME</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* ── PAGE TITLE & COUNT ── */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-neutral-200 pb-3 mb-8 gap-2">
              <div>
                {displayTag && (
                  <span className="text-[10px] tracking-[0.22em] text-neutral-400 uppercase font-sans font-medium block mb-1">
                    {displayTag}
                  </span>
                )}
                <h1 className="text-xl sm:text-2xl md:text-3xl font-serif tracking-[0.08em] uppercase text-brand-dark">
                  {displayTitle}
                </h1>
              </div>
              <span className="text-[11px] font-sans tracking-[0.2em] text-neutral-500 uppercase flex-shrink-0">
                {matchingProducts.length} {matchingProducts.length === 1 ? 'PIECE' : 'PIECES'}
              </span>
            </div>

            {/* ── PRODUCT GRID / LOADING / EMPTY STATES ── */}
            {isLoading ? (
              <div className="py-24 text-center font-serif text-neutral-400">
                <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-xs uppercase tracking-widest font-mono">
                  Loading {activeFabric?.name || 'fabric'} outfits...
                </p>
              </div>
            ) : matchingProducts.length === 0 ? (
              /* Empty state for valid fabric with 0 products */
              <div className="max-w-xl mx-auto py-16 px-6 bg-neutral-50 border border-neutral-200 text-center font-serif my-8">
                <ShoppingBag className="w-10 h-10 text-neutral-400 mx-auto mb-4 stroke-[1.25]" />
                <h3 className="text-lg sm:text-xl font-serif tracking-[0.15em] uppercase text-black mb-2">
                  NO PIECES CURRENTLY DISPLAYED
                </h3>
                <p className="text-xs text-neutral-500 tracking-wider font-sans uppercase mb-6 max-w-sm mx-auto leading-relaxed">
                  Outfits tailored in {activeFabric?.name || 'this fabric'} are currently undergoing finishing in House of Urvaah.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 bg-black text-white text-xs font-mono tracking-widest px-6 py-3 uppercase hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    <span>RETURN TO HOME</span>
                  </Link>
                </div>
              </div>
            ) : (
              /* Products Grid */
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10"
              >
                {matchingProducts.map((product) => (
                  <ProductCard
                    key={product.id || product.product_id}
                    product={product}
                  />
                ))}
              </motion.div>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default TrueToFabricPage;
