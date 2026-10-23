import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Mic, Loader2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { BEST_SELLERS_PRODUCTS, MOCK_PRODUCTS } from '../../data/mockProducts';
import { ProductCard } from '../common/ProductCard';
import { productApi } from '../../services/productApi';
import { getProductUrl } from '../../utils/productUrl';

export const SearchOverlay = () => {
  const { isSearchOpen, setIsSearchOpen } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState(null);
  const [liveProducts, setLiveProducts] = useState([]);
  const [apiSearchResults, setApiSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  const trendingTags = [
    'Co-ord Sets',
    'Corset Tops',
    'Kurtis & Dresses',
    'Festive Wear',
    'Gharara Sets',
    'Floral Embroidered',
  ];

  // Prefetch active live products from PostgreSQL DB when search overlay opens or when catalog updates
  useEffect(() => {
    let isMounted = true;
    const fetchCatalog = async () => {
      try {
        const prods = await productApi.getProducts({ active: true });
        if (isMounted && Array.isArray(prods)) {
          setLiveProducts(prods);
        }
      } catch (err) {
        console.warn('Failed to prefetch live products in search overlay:', err);
      }
    };

    if (isSearchOpen) {
      fetchCatalog();
    }

    const handleUpdate = () => {
      if (isSearchOpen) fetchCatalog();
    };

    window.addEventListener('urvaah_products_updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('urvaah_products_updated', handleUpdate);
    };
  }, [isSearchOpen]);

  // Debounced live database query when searchTerm changes
  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setApiSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    let isCancelled = false;

    const timer = setTimeout(async () => {
      try {
        const results = await productApi.getProducts({ search: trimmed, active: true });
        if (!isCancelled) {
          setApiSearchResults(Array.isArray(results) ? results : []);
        }
      } catch (err) {
        console.warn('Live search query error:', err);
        if (!isCancelled) setApiSearchResults([]);
      } finally {
        if (!isCancelled) setIsSearching(false);
      }
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchTerm]);

  // Combined catalog: DB live products take priority over mock catalog products
  const allCatalog = useMemo(() => {
    const map = new Map();
    // 1. Initial mock products
    for (const p of [...BEST_SELLERS_PRODUCTS, ...MOCK_PRODUCTS]) {
      if (!p) continue;
      const key = String(p.id).toLowerCase();
      map.set(key, p);
    }
    // 2. Overwrite/supplement with real active products from database
    for (const p of liveProducts) {
      if (!p) continue;
      const key = String(p.id || p.product_id || p.productId || '').toLowerCase();
      if (key) map.set(key, p);
    }
    return Array.from(map.values());
  }, [liveProducts]);

  // Merge live database search results with instant local matches
  const filteredProducts = useMemo(() => {
    const rawQuery = searchTerm.trim().toLowerCase();
    if (!rawQuery) return [];

    const map = new Map();

    // 1. Live server search results (matching title, description, category, style_code, brand in PostgreSQL)
    if (Array.isArray(apiSearchResults)) {
      for (const p of apiSearchResults) {
        if (!p) continue;
        const key = String(p.id || p.product_id || p.productId || p.name);
        map.set(key, p);
      }
    }

    // 2. Instant client-side intelligent matches from preloaded catalog
    const cleanQuery = rawQuery.replace(/&/g, 'and');
    const rawTokens = cleanQuery.split(/\s+/).filter(Boolean);
    const tokens = rawTokens.map(t => (t.endsWith('s') && t.length > 3 ? t.slice(0, -1) : t));

    for (const p of allCatalog) {
      if (!p) continue;
      const key = String(p.id || p.product_id || p.productId || p.name);
      if (map.has(key)) continue;

      const searchableText = [
        p.name,
        p.title,
        p.category,
        p.category_name,
        Array.isArray(p.categories) ? p.categories.join(' ') : '',
        p.subcategory,
        p.subCategory,
        p.subcategory_name,
        p.fabric,
        p.occasion,
        Array.isArray(p.tags) ? p.tags.join(' ') : '',
        p.tag,
        p.styleCode,
        p.style_code,
        p.description,
        p.shortDescription
      ].filter(Boolean).join(' ').toLowerCase();

      const fullMatch = searchableText.includes(rawQuery) || searchableText.includes(cleanQuery);
      const allTokensMatch = tokens.length > 0 && tokens.every(token => searchableText.includes(token));

      if (fullMatch || allTokensMatch) {
        map.set(key, p);
      }
    }

    return Array.from(map.values());
  }, [searchTerm, apiSearchResults, allCatalog]);

  // Comprehensive close handler that closes overlay and resets all search text and queries
  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchTerm('');
    setApiSearchResults([]);
    setIsSearching(false);
    setVoiceNotice(null);
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setApiSearchResults([]);
    setIsSearching(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Reset search state whenever isSearchOpen changes to false, or focus input on open
  useEffect(() => {
    if (!isSearchOpen) {
      setSearchTerm('');
      setApiSearchResults([]);
      setIsSearching(false);
      setVoiceNotice(null);
      if (recognitionRef.current && isListening) {
        try {
          recognitionRef.current.stop();
        } catch {}
        setIsListening(false);
      }
    } else {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isSearchOpen]);

  // Automatically close and reset search overlay on page navigation
  useEffect(() => {
    handleCloseSearch();
  }, [location.pathname]);

  // Handle ESC key to dismiss search
  useEffect(() => {
    if (!isSearchOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleCloseSearch();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  // Web Speech API Voice Search Handler
  const toggleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceNotice('Voice input is not supported in this browser. Try Chrome, Edge, or Safari.');
      setTimeout(() => setVoiceNotice(null), 4000);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      setVoiceNotice(null);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = navigator.language || 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceNotice('Listening... Speak now');
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setSearchTerm(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Voice search error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setVoiceNotice('Microphone access denied. Please allow microphone permissions.');
        } else if (event.error !== 'no-speech') {
          setVoiceNotice(`Speech recognition error: ${event.error}`);
        }
        setTimeout(() => setVoiceNotice(null), 3500);
      };

      recognition.onend = () => {
        setIsListening(false);
        setTimeout(() => setVoiceNotice(null), 1500);
        if (inputRef.current) {
          inputRef.current.focus();
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Voice search failed to start:', err);
      setIsListening(false);
      setVoiceNotice('Microphone could not be started.');
      setTimeout(() => setVoiceNotice(null), 3500);
    }
  };

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseSearch}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs"
          />

          {/* Slide-down Search Bar Panel */}
          <motion.div
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            style={{ overscrollBehavior: 'contain' }}
            className="fixed top-0 inset-x-0 z-50 bg-white text-brand-dark shadow-2xl p-6 md:p-10 border-b border-neutral-200 font-serif max-h-[85vh] overflow-y-auto overscroll-contain"
          >
            <div className="max-w-5xl mx-auto">
              {/* Input Header */}
              <div className="relative flex items-center border-b border-black pb-3.5 mb-4">
                <Search className="w-5.5 h-5.5 sm:w-6 sm:h-6 text-brand-dark mr-3 flex-shrink-0 stroke-[1.75]" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="SEARCH FOR CO-ORD SETS, CORSETS, KURTIS, FESTIVE WEAR..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                  className="w-full text-base md:text-xl font-light tracking-wider uppercase bg-transparent outline-none placeholder:text-neutral-300"
                />

                {isSearching && (
                  <Loader2 className="w-5 h-5 text-neutral-400 animate-spin mr-2 flex-shrink-0" />
                )}

                {searchTerm && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="p-1 hover:text-black text-neutral-400 mr-2 text-xs uppercase cursor-pointer"
                  >
                    CLEAR
                  </button>
                )}

                {/* Voice Search Button */}
                <button
                  type="button"
                  onClick={toggleVoiceSearch}
                  className={`p-2 mx-1 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isListening
                      ? 'text-rose-600 bg-rose-50 ring-2 ring-rose-500 shadow-sm'
                      : 'text-neutral-500 hover:text-black hover:bg-neutral-100'
                  }`}
                  aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                  title={isListening ? 'Stop voice input' : 'Search with voice'}
                >
                  <Mic className={`w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[1.75] ${isListening ? 'animate-pulse text-rose-600' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={handleCloseSearch}
                  className="p-1.5 text-neutral-500 hover:text-black transition-colors cursor-pointer"
                  aria-label="Close search"
                >
                  <X className="w-6 h-6 stroke-[1.75]" />
                </button>
              </div>

              {/* Voice Status Notice */}
              {voiceNotice && (
                <div className="mb-4 inline-flex items-center gap-2 px-3.5 py-1.5 bg-neutral-900 text-white text-xs font-sans rounded-full shadow-sm animate-in fade-in">
                  {isListening && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
                  <span>{voiceNotice}</span>
                </div>
              )}

              {/* Trending Filter Tabs - Always visible for fast category discovery */}
              <div className="py-3 border-b border-neutral-100">
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-[10px] tracking-widest text-neutral-400 uppercase font-semibold">
                    TRENDING SEARCHES
                  </h4>
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        if (inputRef.current) inputRef.current.focus();
                      }}
                      className="text-[10px] tracking-wider uppercase text-neutral-400 hover:text-black transition-colors cursor-pointer"
                    >
                      Show All
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {trendingTags.map((tag, idx) => {
                    const isSelected = searchTerm.trim().toLowerCase() === tag.trim().toLowerCase();
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSearchTerm('');
                          } else {
                            setSearchTerm(tag);
                          }
                          if (inputRef.current) inputRef.current.focus();
                        }}
                        className={`px-3.5 py-1.5 rounded-full text-xs tracking-wider uppercase font-medium transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-black text-white border-black shadow-xs font-semibold'
                            : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200/80 hover:border-black'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search Results */}
              {searchTerm && (
                <div className="pt-4">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-[10px] tracking-widest text-neutral-400 uppercase font-semibold">
                      SEARCH RESULTS ({filteredProducts.length})
                    </h4>
                    {isSearching && (
                      <span className="flex items-center gap-1.5 text-xs text-neutral-400 tracking-wider font-sans uppercase">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-500" />
                        Searching...
                      </span>
                    )}
                  </div>

                  {filteredProducts.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-sm text-neutral-500 tracking-wider uppercase mb-2">
                        {isSearching ? `SEARCHING FOR "${searchTerm}"...` : `NO PRODUCTS FOUND MATCHING "${searchTerm}"`}
                      </p>
                      <p className="text-xs text-neutral-400 font-sans tracking-wide">
                        Try searching by silhouette, color, fabric (e.g., silk, corset, co-ord), or product name.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id || product.product_id}
                          onClickCapture={handleCloseSearch}
                        >
                          <ProductCard
                            product={product}
                            onQuickView={(p) => {
                              handleCloseSearch();
                              navigate(getProductUrl(p));
                              window.scrollTo({ top: 0, behavior: 'instant' });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
