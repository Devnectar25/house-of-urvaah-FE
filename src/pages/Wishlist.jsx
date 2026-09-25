import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { SEOHead } from '../components/common/SEOHead';
import { ProductCard } from '../components/common/ProductCard';
import { BEST_SELLERS_PRODUCTS, MOCK_PRODUCTS } from '../data/mockProducts';
import { productApi } from '../services/productApi';
import { getSupabaseMediaUrl } from '../lib/supabase';

// Combine all product catalogs for item lookup
const ALL_CATALOG_PRODUCTS = [...BEST_SELLERS_PRODUCTS, ...MOCK_PRODUCTS];

const findLocalProduct = (id) => {
  if (!id) return null;
  const strId = String(id).trim();
  const numId = strId.replace(/\D/g, '');

  return ALL_CATALOG_PRODUCTS.find((p) => {
    const pStrId = String(p.id).trim();
    const pNumId = pStrId.replace(/\D/g, '');

    // Exact string match (e.g. 'bs-103' === 'bs-103' or '103' === '103')
    if (pStrId === strId) return true;
    // Numeric match (e.g. '103' matches 'bs-103' or 'prod-103')
    if (numId && pNumId && numId === pNumId) return true;
    return false;
  });
};

export const Wishlist = () => {
  const navigate = useNavigate();
  const { user, authLoading, wishlist, openAuthModal, setPdpProduct } = useCart();
  const [resolvedProducts, setResolvedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Protect route - open auth modal if guest
  useEffect(() => {
    if (!authLoading && !user) {
      openAuthModal('login');
    }
  }, [user, authLoading, openAuthModal]);

  // Resolve product objects for wishlist IDs (checking local catalog first, then backend API)
  useEffect(() => {
    let isMounted = true;

    async function resolveWishlistItems() {
      if (!wishlist || wishlist.length === 0) {
        if (isMounted) {
          setResolvedProducts([]);
          setLoadingProducts(false);
        }
        return;
      }

      setLoadingProducts(true);

      const items = await Promise.all(
        wishlist.map(async (id) => {
          // 1. Try local catalog match (fast & immediate)
          const local = findLocalProduct(id);
          if (local) return local;

          // 2. Fetch from backend API if not in static catalog
          try {
            const apiProd = await productApi.getProductById(id);
            if (apiProd && (apiProd.name || apiProd.title)) {
              return {
                ...apiProd,
                id: String(apiProd.id || id),
                name: apiProd.name || apiProd.title,
                price: parseFloat(apiProd.price) || 8990,
                image: getSupabaseMediaUrl(apiProd.image),
                hoverImage: apiProd.hoverImage
                  ? getSupabaseMediaUrl(apiProd.hoverImage)
                  : getSupabaseMediaUrl(apiProd.image),
                gallery: apiProd.gallery
                  ? apiProd.gallery.map(getSupabaseMediaUrl)
                  : [getSupabaseMediaUrl(apiProd.image)],
                colors: apiProd.colors || ['#111111'],
                sizes: apiProd.sizes || ['S', 'M', 'L']
              };
            }
          } catch (e) {
            console.warn('API lookup failed for wishlist product ID:', id, e);
          }

          return null;
        })
      );

      if (isMounted) {
        setResolvedProducts(items.filter(Boolean));
        setLoadingProducts(false);
      }
    }

    resolveWishlistItems();

    return () => {
      isMounted = false;
    };
  }, [wishlist]);

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center pt-28 pb-16 bg-white font-serif">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-dark border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs uppercase tracking-widest text-neutral-400 font-sans">Loading your Wishlist...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 pt-32 text-center font-serif bg-white">
        <SEOHead
          title="My Wishlist | House of Urvaah"
          description="View your saved House of Urvaah items."
          noindex={true}
        />
        <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 block mb-2">
          HOUSE OF URVAAH
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif tracking-[0.15em] uppercase mb-4 text-brand-dark">
          PLEASE LOG IN TO VIEW YOUR WISHLIST
        </h1>
        <p className="text-xs text-neutral-500 tracking-wider uppercase mb-8 max-w-md font-sans">
          Sign in to access your saved luxury pieces and synchronized preferences.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="bg-brand-dark text-white text-xs font-semibold tracking-widest px-8 py-3.5 uppercase hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          LOG IN / SIGN UP
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-brand-dark pt-24 sm:pt-28 pb-20 font-serif selection:bg-brand-dark selection:text-white">
      <SEOHead
        title={`My Wishlist (${resolvedProducts.length}) | House of Urvaah`}
        description="View and manage your saved House of Urvaah runway pieces and curated items."
        keywords="House of Urvaah wishlist, saved items, luxury fashion atelier"
      />

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 md:px-12">
        {/* Page Header */}
        <div className="mb-10 md:mb-14 border-b border-neutral-200 pb-6 md:pb-7 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 font-serif block mb-1">
              CURATED SELECTION
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif tracking-[0.15em] uppercase text-brand-dark font-normal">
              MY WISHLIST ({resolvedProducts.length})
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/account')}
              className="inline-flex items-center gap-2 text-xs font-sans font-semibold tracking-widest uppercase text-neutral-500 hover:text-black transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>RETURN TO ACCOUNT</span>
            </button>
          </div>
        </div>

        {/* Wishlist Grid / Loading / Empty State */}
        {loadingProducts && resolvedProducts.length === 0 ? (
          <div className="py-20 text-center font-serif text-neutral-400">
            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs uppercase tracking-widest">Loading your saved items...</p>
          </div>
        ) : resolvedProducts.length === 0 ? (
          <div className="max-w-4xl mx-auto bg-neutral-50/70 p-8 sm:p-12 md:p-16 border border-neutral-200 text-center font-sans my-8">
            <Heart className="w-12 h-12 text-neutral-300 mx-auto mb-4 stroke-[1.25]" />
            <h3 className="text-lg sm:text-xl font-serif tracking-[0.15em] uppercase text-black mb-2 font-normal">
              YOUR WISHLIST IS EMPTY
            </h3>
            <p className="text-xs text-neutral-500 tracking-wider uppercase mb-8 max-w-md mx-auto leading-relaxed">
              Explore our luxury collection and click the heart icon on any piece to save it for later.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-brand-dark hover:bg-neutral-800 text-white text-xs font-semibold tracking-widest px-8 py-3.5 uppercase transition-colors cursor-pointer shadow-xs"
            >
              EXPLORE COLLECTION
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 md:gap-8">
            <AnimatePresence>
              {resolvedProducts.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35 }}
                >
                  <ProductCard product={product} onQuickView={(p) => setPdpProduct(p)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
