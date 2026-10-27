import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { ProductCard } from '../common/ProductCard';
import { productApi } from '../../services/productApi';
import { BEST_SELLERS_PRODUCTS, MOCK_PRODUCTS } from '../../data/mockProducts';
import { resolveProductCanonical } from '../../utils/productUrl';

const ALL_FALLBACK_PRODUCTS = [...BEST_SELLERS_PRODUCTS, ...MOCK_PRODUCTS];

// DB and mock catalog use different ids for the same piece (e.g. '105' vs 'bs-101'),
// so compare on the canonical product id instead of the raw id.
const getProductKey = (p) => {
  if (!p) return '';
  const canonicalId = resolveProductCanonical(p)?.id;
  return String(canonicalId || p.id || p.product_id || p.name || '').toLowerCase();
};

const dedupeProducts = (list, excludeKey) => {
  const seen = new Set(excludeKey ? [excludeKey] : []);
  return list.filter((p) => {
    const key = getProductKey(p);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
const TARGET_POOL_SIZE = 16;
const ITEMS_PER_BATCH = 4;
const REFRESH_INTERVAL_MS = 15000; // 15 seconds

export const RelatedProducts = ({ currentProduct, onQuickView }) => {
  const [allProducts, setAllProducts] = useState([]);
  const [batchIndex, setBatchIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setBatchIndex(0);

    const fetchRelated = async () => {
      if (!currentProduct) {
        if (isMounted) setLoading(false);
        return;
      }

      const currentIdStr = String(currentProduct.id || currentProduct.product_id || '').trim();
      const currentCategory = currentProduct.category || currentProduct.category_id || currentProduct.categoryId || '';

      try {
        const res = await productApi.getRelatedProducts(currentIdStr, currentCategory, TARGET_POOL_SIZE);
        let fetchedList = Array.isArray(res) ? res : res?.data || [];

        // Normalize fetched products
        let normalizedList = fetchedList.map((p) => {
          const galleryArr = Array.isArray(p.gallery)
            ? p.gallery
            : typeof p.gallery === 'string'
            ? p.gallery.split(/\s+/).filter(Boolean)
            : [];
          const mainImg = p.image || galleryArr[0] || '/assets/Images/Brown01.png';
          const hoverImg = p.hoverImage || galleryArr[1] || mainImg;

          return {
            ...p,
            id: String(p.id || p.product_id),
            name: p.name || p.title || 'House of Urvaah Piece',
            price: Number(p.price) || 12990,
            originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
            image: mainImg,
            hoverImage: hoverImg,
            carouselImages: galleryArr.length > 0 ? galleryArr : [mainImg, hoverImg]
          };
        });

        // Filter out the current product itself and any duplicate pieces
        const currentKey = getProductKey(currentProduct);
        normalizedList = dedupeProducts(normalizedList, currentKey);

        // Backfill from the bundled sample catalogue only when the live API returned nothing;
        // otherwise deleted products would reappear among related pieces
        if (normalizedList.length === 0) {
          const existingKeys = new Set([currentKey, ...normalizedList.map(getProductKey)]);

          // Priority 1: same category in catalog
          const sameCat = ALL_FALLBACK_PRODUCTS.filter(
            (p) =>
              currentCategory &&
              p.category &&
              p.category.toLowerCase().includes(String(currentCategory).toLowerCase())
          );

          // Priority 2: other catalog products
          const backfills = [...sameCat, ...ALL_FALLBACK_PRODUCTS];
          for (const item of backfills) {
            if (normalizedList.length >= TARGET_POOL_SIZE) break;
            const key = getProductKey(item);
            if (key && !existingKeys.has(key)) {
              existingKeys.add(key);
              normalizedList.push(item);
            }
          }
        }

        if (isMounted) {
          setAllProducts(normalizedList);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching related products:', err);
        const fallbackList = dedupeProducts(ALL_FALLBACK_PRODUCTS, getProductKey(currentProduct));
        if (isMounted) {
          setAllProducts(fallbackList);
          setLoading(false);
        }
      }
    };

    fetchRelated();

    // Listen to urvaah_products_updated custom event from admin changes
    const handleUpdate = () => fetchRelated();
    window.addEventListener('urvaah_products_updated', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('urvaah_products_updated', handleUpdate);
    };
  }, [
    currentProduct?.id,
    currentProduct?.product_id,
    currentProduct?.category,
    currentProduct?.category_id,
    currentProduct?.categoryId
  ]);

  const totalBatches = Math.max(1, Math.ceil(allProducts.length / ITEMS_PER_BATCH));

  // Automatically refresh every 15 seconds to display the next batch of related pieces
  useEffect(() => {
    if (allProducts.length <= ITEMS_PER_BATCH || isPaused) return;

    const timer = setInterval(() => {
      setBatchIndex((prev) => (prev + 1) % totalBatches);
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [allProducts.length, totalBatches, isPaused]);

  if (!loading && (!allProducts || allProducts.length === 0)) {
    return null;
  }

  // Slice or wrap 4 items for the active batch
  const startIdx = (batchIndex * ITEMS_PER_BATCH) % Math.max(1, allProducts.length);
  const currentBatch = [];
  for (let i = 0; i < ITEMS_PER_BATCH && i < allProducts.length; i++) {
    currentBatch.push(allProducts[(startIdx + i) % allProducts.length]);
  }

  return (
    <section
      className="w-full mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-neutral-200/80 font-serif text-brand-dark"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8 border-b border-neutral-200/80 pb-4 text-left">
        <div>
          <span className="text-[10px] sm:text-xs font-serif tracking-[0.25em] uppercase text-neutral-400 font-semibold block mb-1.5">
            CURATED STORE SELECTIONS
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif tracking-[0.1em] uppercase text-brand-dark font-semibold">
            RELATED PIECES
          </h2>
        </div>
      </div>

      {/* Product Grid / Skeleton */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex flex-col animate-pulse">
              <div className="w-full aspect-[3/4] bg-neutral-100 mb-3" />
              <div className="h-3 bg-neutral-100 w-3/4 mb-2" />
              <div className="h-3 bg-neutral-100 w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={batchIndex}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8"
          >
            {currentBatch.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                onQuickView={onQuickView}
                hideColorDots={true}
                hideOriginalPrice={false}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </section>
  );
};

export default RelatedProducts;
