import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  SlidersHorizontal,
  X,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Check
} from 'lucide-react';
import { SEOHead } from '../components/common/SEOHead';
import { ProductCard } from '../components/common/ProductCard';
import { productApi } from '../services/productApi';
import { apiClient } from '../lib/apiClient';

// Canonical collection definitions
const CANONICAL_COLLECTIONS = [
  { slug: 'all', path: '/category/all', label: 'ALL' },
  { slug: 'new-arrivals', path: '/new-arrivals', label: 'NEW ARRIVALS' },
  { slug: 'co-ord-sets', path: '/co-ord-sets', label: 'CO-ORD SETS' },
  { slug: 'festive-wear', path: '/festive-wear', label: 'FESTIVE WEAR' },
  { slug: 'kurtis-and-dresses', path: '/kurtis-and-dresses', label: 'KURTIS AND DRESSES' },
  { slug: 'corset-tops', path: '/corset-tops', label: 'CORSET TOPS', minProducts: 2 }
];

// Occasion filter options specified in task requirements
const OCCASION_OPTIONS = [
  'Beach and Vacation',
  'Night Out',
  'College and Office',
  'Festive and Wedding'
];

// Fabric filter options specified in task requirements
const FABRIC_OPTIONS = [
  'Cora Cotton',
  'Tissue Silk'
];

// Match product against collection slug
const productMatchesCategory = (product, slug) => {
  if (!slug || slug === 'all') return true;
  const norm = slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

  // New Arrivals contains all 6 current products eligible for storefront display
  if (norm === 'new-arrivals' || norm === 'new-in') {
    return true;
  }

  const pCats = Array.isArray(product.categories) ? product.categories : [];
  const normalizedCats = pCats.map((c) =>
    String(c).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')
  );

  const pTitle = (product.name || product.title || '').toLowerCase();
  const pCatName = (product.category || '').toLowerCase().trim();

  if (norm === 'co-ord-sets' || norm === 'co-ord-set') {
    if (normalizedCats.some((c) => c.includes('co-ord'))) return true;
    return pTitle.includes('co-ord') || pTitle.includes('coord') || pCatName.includes('co-ord');
  }

  if (norm === 'festive-wear' || norm === 'ethnic-wear') {
    if (normalizedCats.some((c) => c.includes('festive') || c.includes('ethnic'))) return true;
    return (
      pTitle.includes('gharara') ||
      pTitle.includes('corset') ||
      pCatName.includes('festive') ||
      pCatName.includes('ethnic')
    );
  }

  if (norm === 'kurtis-and-dresses' || norm === 'kurti' || norm === 'dresses') {
    if (normalizedCats.some((c) => c.includes('kurti') || c.includes('dress'))) return true;
    return pTitle.includes('kurti') || pTitle.includes('dress') || pCatName.includes('kurti') || pCatName.includes('dress');
  }

  if (norm === 'corset-tops' || norm === 'corset') {
    if (normalizedCats.some((c) => c.includes('corset'))) return true;
    return pTitle.includes('corset') || pCatName.includes('corset');
  }

  // Fallback for custom or ID categories
  const pCatId = String(product.category_id || product.categoryId || '');
  if (pCatId && pCatId === norm) return true;

  return (
    normalizedCats.includes(norm) ||
    pCatName === norm.replace(/-/g, ' ') ||
    pTitle.includes(norm.replace(/-/g, ' '))
  );
};

export const CategoryPage = ({ defaultCategory }) => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const currentSlug = (slug || defaultCategory || 'all').toLowerCase().trim();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [selectedOccasions, setSelectedOccasions] = useState([]);
  const [isWearItTwoWays, setIsWearItTwoWays] = useState(false);
  const [selectedFabrics, setSelectedFabrics] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Reset filters when the collection/slug changes
  useEffect(() => {
    setSelectedOccasions([]);
    setIsWearItTwoWays(false);
    setSelectedFabrics([]);
    setSelectedSizes([]);
  }, [currentSlug]);

  // Fetch all live categories and active products
  useEffect(() => {
    let isMounted = true;

    const loadCategoryData = async () => {
      setIsLoading(true);
      try {
        const [catsRes, prodsRes] = await Promise.all([
          apiClient('/api/categories/active').catch(() =>
            productApi.getCategories().catch(() => [])
          ),
          productApi.getProducts({ active: true }).catch(() => [])
        ]);

        if (!isMounted) return;

        const rawCats = Array.isArray(catsRes)
          ? catsRes
          : catsRes?.data || catsRes?.data?.data || [];
        const rawProds = Array.isArray(prodsRes) ? prodsRes : prodsRes?.data || [];

        setCategories(rawCats);
        setProducts(rawProds);
      } catch (err) {
        console.warn('[CategoryPage] Failed to fetch category products:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadCategoryData();

    const handleUpdate = () => loadCategoryData();
    const handleStorage = (e) => {
      if (e.key === 'urvaah_categories_updated' || e.key === 'urvaah_products_updated') {
        loadCategoryData();
      }
    };

    window.addEventListener('urvaah_categories_updated', handleUpdate);
    window.addEventListener('urvaah_products_updated', handleUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      isMounted = false;
      window.removeEventListener('urvaah_categories_updated', handleUpdate);
      window.removeEventListener('urvaah_products_updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Format collection title
  const categoryTitle = useMemo(() => {
    const norm = currentSlug.replace(/[^a-z0-9]+/g, '-');
    if (norm === 'all') return 'ALL ATELIER PIECES';
    if (norm === 'new-arrivals') return 'NEW ARRIVALS';
    if (norm === 'co-ord-sets') return 'CO-ORD SETS';
    if (norm === 'festive-wear' || norm === 'ethnic-wear') return 'FESTIVE WEAR';
    if (norm === 'kurtis-and-dresses' || norm === 'kurti') return 'KURTIS AND DRESSES';
    if (norm === 'corset-tops' || norm === 'corset') return 'CORSET TOPS';

    const matchedCat = categories.find((c) => {
      const cSlug = (c.slug || c.name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
      return cSlug === norm;
    });
    if (matchedCat?.name) return matchedCat.name.toUpperCase();

    return currentSlug.replace(/-/g, ' ').toUpperCase();
  }, [currentSlug, categories]);

  // Base products in this collection (before facet filtering)
  const collectionProducts = useMemo(() => {
    if (!products.length) return [];
    return products.filter((p) => productMatchesCategory(p, currentSlug));
  }, [products, currentSlug]);

  // Dynamically compute all collection pills: Canonical + dynamically created active categories
  const collectionPills = useMemo(() => {
    const list = [...CANONICAL_COLLECTIONS];

    categories.forEach((cat) => {
      if (!cat || cat.active === false || cat.is_active === false) return;
      const rawSlug = (cat.slug || cat.name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
      // Check if this category is already represented in CANONICAL_COLLECTIONS
      const alreadyIncluded = list.some(
        (c) => c.slug === rawSlug || (c.slug && rawSlug.includes(c.slug)) || (c.slug && c.slug.includes(rawSlug))
      );

      if (!alreadyIncluded && cat.name) {
        list.push({
          slug: rawSlug,
          path: `/category/${rawSlug}`,
          label: cat.name.toUpperCase()
        });
      }
    });

    return list;
  }, [categories]);

  // Check eligible products for Corset Tops visibility rule
  const corsetProductCount = useMemo(() => {
    return products.filter((p) => productMatchesCategory(p, 'corset-tops')).length;
  }, [products]);

  // Dynamically extract available sizes from collection products
  const availableSizes = useMemo(() => {
    const sizeSet = new Set();
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'ONE SIZE'];
    collectionProducts.forEach((p) => {
      const sizes = Array.isArray(p.sizes) ? p.sizes : typeof p.sizes === 'string' ? [p.sizes] : [];
      sizes.forEach((s) => {
        if (s && typeof s === 'string') sizeSet.add(s.trim().toUpperCase());
      });
    });
    return Array.from(sizeSet).sort((a, b) => {
      const idxA = sizeOrder.indexOf(a);
      const idxB = sizeOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [collectionProducts]);

  // Multi-facet filtering logic (AND combination across facets; OR within multi-select facets)
  const filteredProducts = useMemo(() => {
    return collectionProducts.filter((p) => {
      // 1. Occasion Filter
      if (selectedOccasions.length > 0) {
        const pOccasion = (p.occasion || '').toLowerCase().trim();
        const matchesOccasion = selectedOccasions.some((occ) => {
          const occLower = occ.toLowerCase();
          return pOccasion.includes(occLower) || occLower.includes(pOccasion);
        });
        if (!matchesOccasion) return false;
      }

      // 2. Wear It Two Ways Tag Filter
      if (isWearItTwoWays) {
        const pTags = Array.isArray(p.tags) ? p.tags : [];
        const hasTag =
          pTags.some((t) => t.toLowerCase().includes('two ways')) ||
          (typeof p.tag === 'string' && p.tag.toLowerCase().includes('two ways')) ||
          (p.description && p.description.toLowerCase().includes('wear it two ways'));
        if (!hasTag) return false;
      }

      // 3. Fabric Filter
      if (selectedFabrics.length > 0) {
        const pFabric = (p.fabric || '').toLowerCase();
        const pDesc = (p.description || '').toLowerCase();
        const pAddInfo = (p.additional_info || p.additionalInfo || '').toLowerCase();
        const matchesFabric = selectedFabrics.some((fab) => {
          const fabLower = fab.toLowerCase();
          return (
            pFabric.includes(fabLower) ||
            pDesc.includes(fabLower) ||
            pAddInfo.includes(fabLower)
          );
        });
        if (!matchesFabric) return false;
      }

      // 4. Size Filter
      if (selectedSizes.length > 0) {
        const pSizes = (Array.isArray(p.sizes) ? p.sizes : []).map((s) =>
          String(s).trim().toUpperCase()
        );
        const matchesSize = selectedSizes.some((s) => pSizes.includes(s.toUpperCase()));
        if (!matchesSize) return false;
      }

      return true;
    });
  }, [
    collectionProducts,
    selectedOccasions,
    isWearItTwoWays,
    selectedFabrics,
    selectedSizes
  ]);

  const sortedProducts = filteredProducts;

  // Reset all active filters
  const handleResetFilters = () => {
    setSelectedOccasions([]);
    setIsWearItTwoWays(false);
    setSelectedFabrics([]);
    setSelectedSizes([]);
  };

  const hasActiveFilters =
    selectedOccasions.length > 0 ||
    isWearItTwoWays ||
    selectedFabrics.length > 0 ||
    selectedSizes.length > 0;

  const toggleOccasion = (occ) => {
    setSelectedOccasions((prev) =>
      prev.includes(occ) ? prev.filter((o) => o !== occ) : [...prev, occ]
    );
  };

  const toggleFabric = (fab) => {
    setSelectedFabrics((prev) =>
      prev.includes(fab) ? prev.filter((f) => f !== fab) : [...prev, fab]
    );
  };

  const toggleSize = (sz) => {
    setSelectedSizes((prev) =>
      prev.includes(sz) ? prev.filter((s) => s !== sz) : [...prev, sz]
    );
  };

  return (
    <main className="w-full min-h-screen bg-white font-serif select-none pt-24 sm:pt-28 md:pt-32 pb-20">
      <SEOHead
        title={`${categoryTitle} Collection | House of Urvaah Atelier`}
        description={`Explore the ${categoryTitle} collection at House of Urvaah. Handcrafted festive ensembles, minimalist co-ord sets, and contemporary women's designer apparel.`}
        keywords={`House of Urvaah, ${categoryTitle}, luxury clothing, designer fashion`}
      />

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 md:px-12">
        {/* Editorial Collection Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] tracking-[0.25em] text-neutral-400 uppercase font-sans">
              ATELIER EDIT
            </span>
            <span className="text-neutral-300">•</span>
            <span className="text-[10px] tracking-[0.2em] text-neutral-500 uppercase font-sans">
              {collectionProducts.length} {collectionProducts.length === 1 ? 'PIECE' : 'PIECES'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif tracking-[0.12em] uppercase text-brand-dark leading-tight font-normal">
            {categoryTitle}
          </h1>
        </div>

        {/* Collection Switcher Navigation Pills */}
        <div className="border-y border-neutral-200 py-3 mb-6 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 min-w-max py-0.5">
            {collectionPills.map((col) => {

              const isSelected =
                (col.slug === 'all' && (currentSlug === 'all' || !currentSlug)) ||
                currentSlug === col.slug;

              return (
                <Link
                  key={col.slug}
                  to={col.path}
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                  className={`px-4 py-1.5 text-xs tracking-wider uppercase transition-all rounded-full border whitespace-nowrap ${
                    isSelected
                      ? 'bg-black text-white border-black font-semibold shadow-2xs'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200/80 hover:border-black hover:text-black font-normal'
                  }`}
                >
                  {col.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Unified Filter Toolbar & Facet Panel Container */}
        <div className="border border-neutral-200 bg-white mb-4">
          {/* Top Row Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-1.5 bg-neutral-50/80">
            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Toggle Button */}
              <button
                type="button"
                onClick={() => setIsFilterPanelOpen((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 h-7 px-2.5 text-[11px] tracking-wider uppercase transition-all border cursor-pointer select-none ${
                  isFilterPanelOpen || hasActiveFilters
                    ? 'bg-black text-white border-black font-semibold'
                    : 'bg-white text-neutral-800 border-neutral-300 hover:border-black'
                }`}
              >
                <SlidersHorizontal className="w-3 h-3 stroke-[1.75]" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                )}
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${
                    isFilterPanelOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Quick Wear It Two Ways Toggle Pill */}
              <button
                type="button"
                onClick={() => setIsWearItTwoWays((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 h-7 px-2.5 text-[11px] tracking-wider uppercase transition-all border cursor-pointer select-none ${
                  isWearItTwoWays
                    ? 'bg-black text-white border-black font-semibold shadow-2xs'
                    : 'bg-white text-neutral-800 border-neutral-300 hover:border-black'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Wear it 2 ways</span>
                {isWearItTwoWays && <Check className="w-2.5 h-2.5 text-white stroke-[2.5]" />}
              </button>
            </div>

            {/* Clear All Filters Button (if active) */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 h-7 px-2 text-[11px] text-neutral-500 hover:text-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Reset All</span>
              </button>
            )}
          </div>

          {/* Collapsible Filter Facet Panel (Directly Attached) */}
          <AnimatePresence>
            {isFilterPanelOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-neutral-200 bg-white px-3 sm:px-4 py-2.5 font-sans"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-6 max-w-4xl">
                  {/* 1. Occasion Filter (Shown in Two Parts) */}
                  <div className="md:col-span-6">
                    <h4 className="text-[9px] font-semibold tracking-[0.2em] uppercase text-black pb-1 border-b border-neutral-200 mb-2">
                      Occasion
                    </h4>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                      {/* Part 1 */}
                      <div className="space-y-1">
                        {OCCASION_OPTIONS.slice(0, 2).map((occ) => {
                          const isSelected = selectedOccasions.includes(occ);
                          return (
                            <label
                              key={occ}
                              onClick={() => toggleOccasion(occ)}
                              className="flex items-center gap-1.5 text-[11px] text-neutral-700 hover:text-black cursor-pointer select-none py-0.5"
                            >
                              <div
                                className={`w-3 h-3 rounded-xs border flex items-center justify-center transition-colors flex-shrink-0 ${
                                  isSelected
                                    ? 'bg-black border-black text-white'
                                    : 'bg-white border-neutral-400 hover:border-black'
                                }`}
                              >
                                {isSelected && <Check className="w-2 h-2 stroke-[2.5]" />}
                              </div>
                              <span className={isSelected ? 'font-semibold text-black' : ''}>
                                {occ}
                              </span>
                            </label>
                          );
                        })}
                      </div>

                      {/* Part 2 */}
                      <div className="space-y-1">
                        {OCCASION_OPTIONS.slice(2).map((occ) => {
                          const isSelected = selectedOccasions.includes(occ);
                          return (
                            <label
                              key={occ}
                              onClick={() => toggleOccasion(occ)}
                              className="flex items-center gap-1.5 text-[11px] text-neutral-700 hover:text-black cursor-pointer select-none py-0.5"
                            >
                              <div
                                className={`w-3 h-3 rounded-xs border flex items-center justify-center transition-colors flex-shrink-0 ${
                                  isSelected
                                    ? 'bg-black border-black text-white'
                                    : 'bg-white border-neutral-400 hover:border-black'
                                }`}
                              >
                                {isSelected && <Check className="w-2 h-2 stroke-[2.5]" />}
                              </div>
                              <span className={isSelected ? 'font-semibold text-black' : ''}>
                                {occ}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 2. Fabric Filter */}
                  <div className="md:col-span-3">
                    <h4 className="text-[9px] font-semibold tracking-[0.2em] uppercase text-black pb-1 border-b border-neutral-200 mb-2">
                      Fabric
                    </h4>
                    <div className="space-y-1">
                      {FABRIC_OPTIONS.map((fab) => {
                        const isSelected = selectedFabrics.includes(fab);
                        return (
                          <label
                            key={fab}
                            onClick={() => toggleFabric(fab)}
                            className="flex items-center gap-1.5 text-[11px] text-neutral-700 hover:text-black cursor-pointer select-none py-0.5"
                          >
                            <div
                              className={`w-3 h-3 rounded-xs border flex items-center justify-center transition-colors flex-shrink-0 ${
                                isSelected
                                  ? 'bg-black border-black text-white'
                                  : 'bg-white border-neutral-400 hover:border-black'
                              }`}
                            >
                              {isSelected && <Check className="w-2 h-2 stroke-[2.5]" />}
                            </div>
                            <span className={isSelected ? 'font-semibold text-black' : ''}>
                              {fab}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Available Sizes */}
                  <div className="md:col-span-3">
                    <h4 className="text-[9px] font-semibold tracking-[0.2em] uppercase text-black pb-1 border-b border-neutral-200 mb-2">
                      Available Sizes
                    </h4>
                    {availableSizes.length === 0 ? (
                      <p className="text-[11px] text-neutral-400 italic">No size variants</p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {availableSizes.map((sz) => {
                          const isSelected = selectedSizes.includes(sz);
                          return (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => toggleSize(sz)}
                              className={`min-w-[28px] h-6 px-1.5 text-[11px] font-mono font-medium tracking-wider uppercase border transition-all cursor-pointer flex items-center justify-center ${
                                isSelected
                                  ? 'bg-black text-white border-black font-bold'
                                  : 'bg-white text-neutral-700 border-neutral-200 hover:border-black'
                              }`}
                            >
                              {sz}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Active Filter Chips Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-6 font-sans">
            <span className="text-[10px] tracking-[0.2em] text-neutral-400 uppercase mr-1">
              Active Filters:
            </span>

            {/* Wear It Two Ways Chip */}
            {isWearItTwoWays && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 text-neutral-900 border border-neutral-300 text-xs font-medium uppercase tracking-wider rounded-full">
                <span>Wear it 2 ways</span>
                <button
                  type="button"
                  onClick={() => setIsWearItTwoWays(false)}
                  className="hover:text-black cursor-pointer"
                  aria-label="Remove Wear it two ways filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Occasion Chips */}
            {selectedOccasions.map((occ) => (
              <span
                key={occ}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 text-neutral-900 border border-neutral-300 text-xs font-medium uppercase tracking-wider rounded-full"
              >
                <span>{occ}</span>
                <button
                  type="button"
                  onClick={() => toggleOccasion(occ)}
                  className="hover:text-black cursor-pointer"
                  aria-label={`Remove ${occ} filter`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Fabric Chips */}
            {selectedFabrics.map((fab) => (
              <span
                key={fab}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 text-neutral-900 border border-neutral-300 text-xs font-medium uppercase tracking-wider rounded-full"
              >
                <span>{fab}</span>
                <button
                  type="button"
                  onClick={() => toggleFabric(fab)}
                  className="hover:text-black cursor-pointer"
                  aria-label={`Remove ${fab} filter`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Size Chips */}
            {selectedSizes.map((sz) => (
              <span
                key={sz}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 text-neutral-900 border border-neutral-300 text-xs font-medium uppercase tracking-wider rounded-full"
              >
                <span>Size {sz}</span>
                <button
                  type="button"
                  onClick={() => toggleSize(sz)}
                  className="hover:text-black cursor-pointer"
                  aria-label={`Remove size ${sz} filter`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

          </div>
        )}

        {/* Product Grid / Loading / Empty States */}
        {isLoading ? (
          <div className="py-24 text-center font-serif text-neutral-400">
            <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs uppercase tracking-widest font-mono">
              Loading {categoryTitle} pieces...
            </p>
          </div>
        ) : collectionProducts.length === 0 ? (
          /* Empty Collection State (no products assigned to this category) */
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
                to="/new-arrivals"
                className="inline-block bg-black text-white text-xs font-mono tracking-widest px-6 py-3 uppercase hover:bg-neutral-800 transition-colors"
              >
                VIEW NEW ARRIVALS
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
        ) : sortedProducts.length === 0 ? (
          /* Filter Empty State (filters applied, zero matching products) */
          <div className="max-w-xl mx-auto py-16 px-6 bg-neutral-50 border border-neutral-200/80 text-center font-serif my-8">
            <SlidersHorizontal className="w-10 h-10 text-neutral-400 mx-auto mb-4 stroke-[1.25]" />
            <h3 className="text-lg sm:text-xl font-serif tracking-[0.15em] uppercase text-black mb-2">
              NO MATCHING PIECES FOUND
            </h3>
            <p className="text-xs text-neutral-500 tracking-wider font-sans uppercase mb-6 max-w-sm mx-auto leading-relaxed">
              No products match your currently active filter selections in {categoryTitle}.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 bg-black text-white text-xs font-mono tracking-widest px-6 py-3 uppercase hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>CLEAR ALL FILTERS</span>
            </button>
          </div>
        ) : (
          /* Product Grid */
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
