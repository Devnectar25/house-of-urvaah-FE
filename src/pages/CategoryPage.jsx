import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { SEOHead } from '../components/common/SEOHead';
import { ProductCard } from '../components/common/ProductCard';
import { productApi } from '../services/productApi';
import { apiClient } from '../lib/apiClient';
import { getSupabaseMediaUrl } from '../lib/supabase';

export const CategoryPage = ({ defaultCategory }) => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const currentSlug = (slug || defaultCategory || '').toLowerCase().trim();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all live categories and active products
  useEffect(() => {
    let isMounted = true;

    const loadCategoryData = async () => {
      setIsLoading(true);
      try {
        const [catsRes, prodsRes] = await Promise.all([
          apiClient('/api/categories/active').catch(() => productApi.getCategories().catch(() => [])),
          productApi.getProducts({ active: true }).catch(() => [])
        ]);

        if (!isMounted) return;

        const rawCats = Array.isArray(catsRes) ? catsRes : (catsRes?.data || catsRes?.data?.data || []);
        const rawProds = Array.isArray(prodsRes) ? prodsRes : (prodsRes?.data || []);

        setCategories(rawCats);
        setProducts(rawProds);
      } catch (err) {
        console.warn('[CategoryPage] Failed to fetch category products:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadCategoryData();

    // Listen to admin category & product updates for live synchronization
    const handleUpdate = () => loadCategoryData();
    window.addEventListener('urvaah_categories_updated', handleUpdate);
    window.addEventListener('urvaah_products_updated', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('urvaah_categories_updated', handleUpdate);
      window.removeEventListener('urvaah_products_updated', handleUpdate);
    };
  }, []);

  // Resolve current active category object
  const activeCategory = useMemo(() => {
    if (!currentSlug || !categories.length) return null;

    const normalized = currentSlug.replace(/[^a-z0-9]+/g, '-');
    return categories.find((c) => {
      const cSlug = (c.name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
      const cId = String(c.id || c.category_id || '');
      return (
        cSlug === normalized ||
        cSlug.replace(/-s$/, '') === normalized.replace(/-s$/, '') ||
        cId === currentSlug ||
        (c.name && c.name.toLowerCase().trim() === normalized.replace(/-/g, ' '))
      );
    });
  }, [currentSlug, categories]);

  // Fallback category title if not found in categories table
  const categoryTitle = useMemo(() => {
    if (activeCategory?.name) return activeCategory.name.toUpperCase();
    if (!currentSlug) return 'ALL COLLECTIONS';
    return currentSlug.replace(/-/g, ' ').toUpperCase();
  }, [activeCategory, currentSlug]);

  // Filter products matching current category
  const filteredProducts = useMemo(() => {
    if (!products.length) return [];
    if (!currentSlug || currentSlug === 'all') return products;

    const normalized = currentSlug.replace(/[^a-z0-9]+/g, '-');
    const targetCatId = activeCategory ? String(activeCategory.id || activeCategory.category_id || '') : '';
    const targetCatName = (activeCategory?.name || currentSlug.replace(/-/g, ' ')).toLowerCase().trim();

    return products.filter((p) => {
      const pCatId = String(p.category_id || '');
      const pCatName = (p.category || '').toLowerCase().trim();

      // 1. Direct ID match
      if (targetCatId && pCatId && pCatId === targetCatId) return true;

      // 2. Direct name match
      if (pCatName && targetCatName && (pCatName === targetCatName || targetCatName.includes(pCatName) || pCatName.includes(targetCatName))) {
        return true;
      }

      // 3. Keyword fallbacks for common categories
      const pTitle = (p.name || '').toLowerCase();
      if (normalized.includes('co-ord') && (pTitle.includes('co-ord') || pTitle.includes('coord') || pCatName.includes('co-ord'))) return true;
      if (normalized.includes('corset') && (pTitle.includes('corset') || pCatName.includes('corset'))) return true;
      if (normalized.includes('ethnic') && (pTitle.includes('kurti') || pTitle.includes('ethnic') || pCatName.includes('ethnic'))) return true;
      if (normalized.includes('kurti') && pTitle.includes('kurti')) return true;
      if (normalized.includes('party') && (pTitle.includes('party') || pTitle.includes('dress') || pCatName.includes('party'))) return true;

      return false;
    });
  }, [products, currentSlug, activeCategory]);

  const sortedProducts = filteredProducts;

  return (
    <main className="w-full min-h-screen bg-white font-serif select-none pt-24 sm:pt-28 md:pt-32 pb-20">
      <SEOHead
        title={`${categoryTitle} Collection | House of Urvaah Atelier`}
        description={`Explore the ${categoryTitle} collection at House of Urvaah. Luxury silk dresses, minimalist co-ord sets, and women's designer apparel.`}
        keywords={`House of Urvaah, ${categoryTitle}, luxury clothing, designer fashion`}
      />

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 md:px-12">

        {/* Editorial Collection Hero Header */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif tracking-[0.15em] uppercase text-brand-dark leading-tight">
            {categoryTitle}
          </h1>
        </div>

        {/* Category Switcher Tabs Bar */}
        <div className="border-y border-neutral-200 py-3 mb-10 overflow-x-auto no-scrollbar">
          {/* Quick Categories Navigation Pills */}
          <div className="flex items-center gap-2 min-w-max py-0.5">
            <Link
              to="/category/all"
              style={{ fontFamily: 'Roboto, sans-serif' }}
              className={`px-4 py-1.5 text-xs tracking-wider uppercase transition-all rounded-full border ${
                currentSlug === 'all' || !currentSlug
                  ? 'bg-black text-white border-black font-semibold'
                  : 'bg-neutral-50 text-neutral-600 border-neutral-200/80 hover:border-black hover:text-black font-normal'
              }`}
            >
              ALL
            </Link>

            {categories.map((cat) => {
              const catSlug = (cat.name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
              const isSelected =
                currentSlug === catSlug ||
                (activeCategory && (activeCategory.id === cat.id || activeCategory.category_id === cat.id));

              return (
                <Link
                  key={cat.id || cat.category_id}
                  to={`/category/${catSlug}`}
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                  className={`px-4 py-1.5 text-xs tracking-wider uppercase transition-all rounded-full border whitespace-nowrap ${
                    isSelected
                      ? 'bg-black text-white border-black font-semibold'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200/80 hover:border-black hover:text-black font-normal'
                  }`}
                >
                  {cat.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Product Grid / Loading / Empty State */}
        {isLoading ? (
          <div className="py-24 text-center font-serif text-neutral-400">
            <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs uppercase tracking-widest font-mono">Loading {categoryTitle} pieces...</p>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="max-w-2xl mx-auto py-20 px-6 bg-neutral-50 border border-neutral-200/80 text-center font-serif my-8">
            <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto mb-4 stroke-[1.25]" />
            <h3 className="text-xl sm:text-2xl font-serif tracking-[0.15em] uppercase text-black mb-2">
              NO PIECES IN THIS CURATION YET
            </h3>
            <p className="text-xs text-neutral-500 tracking-wider font-sans uppercase mb-8 max-w-md mx-auto leading-relaxed">
              We are currently tailoring new exclusive silhouettes for this collection. Explore our other curated collections below.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/category/all"
                className="inline-block bg-black text-white text-xs font-mono tracking-widest px-6 py-3 uppercase hover:bg-neutral-800 transition-colors"
              >
                VIEW ALL PIECES
              </Link>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-block bg-white text-black border border-black text-xs font-mono tracking-widest px-6 py-3 uppercase hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                RETURN TO HOMEPAGE
              </button>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12"
          >
            {sortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                hideColorDots={true}
                hideOriginalPrice={false}
              />
            ))}
          </motion.div>
        )}
      </div>
    </main>
  );
};

export default CategoryPage;
