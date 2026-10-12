import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ProductCard } from '../common/ProductCard';
import { productApi } from '../../services/productApi';
import { BEST_SELLERS_PRODUCTS, MOCK_PRODUCTS } from '../../data/mockProducts';

const ALL_FALLBACK_PRODUCTS = [...BEST_SELLERS_PRODUCTS, ...MOCK_PRODUCTS];

export const RelatedProducts = ({ currentProduct, onQuickView }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetchRelated = async () => {
      if (!currentProduct) {
        if (isMounted) setLoading(false);
        return;
      }

      const currentIdStr = String(currentProduct.id || currentProduct.product_id || '').trim();
      const currentCategory = currentProduct.category || currentProduct.category_id || currentProduct.categoryId || '';

      try {
        const res = await productApi.getRelatedProducts(currentIdStr, currentCategory);
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

        // Filter out the current product itself
        normalizedList = normalizedList.filter((p) => String(p.id) !== currentIdStr);

        // If fewer than 4 items, backfill from catalog
        if (normalizedList.length < 4) {
          const existingIds = new Set([currentIdStr, ...normalizedList.map((p) => String(p.id))]);

          // First priority: same category in catalog
          const sameCat = ALL_FALLBACK_PRODUCTS.filter(
            (p) =>
              !existingIds.has(String(p.id)) &&
              currentCategory &&
              p.category &&
              p.category.toLowerCase().includes(String(currentCategory).toLowerCase())
          );

          // Second priority: general catalog
          const otherItems = ALL_FALLBACK_PRODUCTS.filter(
            (p) => !existingIds.has(String(p.id))
          );

          const backfills = [...sameCat, ...otherItems];
          for (const item of backfills) {
            if (normalizedList.length >= 4) break;
            if (!existingIds.has(String(item.id))) {
              existingIds.add(String(item.id));
              normalizedList.push(item);
            }
          }
        }

        if (isMounted) {
          setProducts(normalizedList.slice(0, 4));
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching related products:', err);
        // Fallback gracefully to catalog
        const currentId = String(currentProduct?.id || '');
        const fallbackList = ALL_FALLBACK_PRODUCTS.filter((p) => String(p.id) !== currentId).slice(0, 4);
        if (isMounted) {
          setProducts(fallbackList);
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

  if (!loading && (!products || products.length === 0)) {
    return null;
  }

  return (
    <section className="w-full mt-16 sm:mt-24 pt-12 sm:pt-16 border-t border-neutral-200/80 font-serif text-brand-dark">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12 border-b border-neutral-200/80 pb-5 text-left">
        <div>
          <span className="text-[10px] sm:text-xs font-serif tracking-[0.25em] uppercase text-neutral-400 font-semibold block mb-1.5">
            CURATED ATELIER SELECTIONS
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif tracking-[0.1em] uppercase text-brand-dark font-semibold">
            RELATED PIECES
          </h2>
        </div>
        <p className="text-xs font-sans tracking-wide text-neutral-500 uppercase hidden sm:block">
          Complementary silhouettes & styles
        </p>
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
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {products.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
            >
              <ProductCard
                product={item}
                onQuickView={onQuickView}
                hideColorDots={true}
                hideOriginalPrice={false}
              />
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
};

export default RelatedProducts;
