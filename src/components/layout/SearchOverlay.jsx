import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, Mic } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { BEST_SELLERS_PRODUCTS, MOCK_PRODUCTS } from '../../data/mockProducts';
import { ProductCard } from '../common/ProductCard';

const ALL_SEARCH_PRODUCTS = Array.from(
  new Map(
    [...BEST_SELLERS_PRODUCTS, ...MOCK_PRODUCTS].map((p) => [p.id, p])
  ).values()
);

export const SearchOverlay = () => {
  const { isSearchOpen, setIsSearchOpen } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  const trendingTags = [
    'Silk Dresses',
    'Co-ord Sets',
    'Tailored Blazers',
    'Cashmere Knitwear',
    'Calfskin Shoulder Bag',
    'Wide Leg Trousers',
  ];

  // Automatically close search overlay on page navigation
  useEffect(() => {
    setIsSearchOpen(false);
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    }
  }, [location.pathname]);

  // Handle ESC key to dismiss search
  useEffect(() => {
    if (!isSearchOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsSearchOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  // Cleanup speech recognition if overlay closes
  useEffect(() => {
    if (!isSearchOpen && isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      setVoiceNotice(null);
    }
  }, [isSearchOpen, isListening]);

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

  const filteredProducts = searchTerm.trim()
    ? ALL_SEARCH_PRODUCTS.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.subcategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.tag?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSearchOpen(false)}
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
                  placeholder="SEARCH FOR BLAZERS, DRESSES, COATS, LEATHER..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                  className="w-full text-base md:text-xl font-light tracking-wider uppercase bg-transparent outline-none placeholder:text-neutral-300"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
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
                  onClick={() => setIsSearchOpen(false)}
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

              {/* Trending Tags */}
              {!searchTerm && (
                <div className="py-4">
                  <h4 className="text-[10px] tracking-widest text-neutral-400 uppercase font-semibold mb-4">
                    TRENDING SEARCHES
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {trendingTags.map((tag, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSearchTerm(tag)}
                        className="px-4 py-2 bg-brand-sand hover:bg-neutral-200 text-xs tracking-wider uppercase font-medium transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results */}
              {searchTerm && (
                <div className="pt-4">
                  <h4 className="text-[10px] tracking-widest text-neutral-400 uppercase font-semibold mb-6">
                    SEARCH RESULTS ({filteredProducts.length})
                  </h4>

                  {filteredProducts.length === 0 ? (
                    <p className="text-sm text-neutral-500 tracking-wider py-8 text-center uppercase">
                      NO PRODUCTS FOUND MATCHING "{searchTerm}"
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {filteredProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onQuickView={(p) => {
                            setIsSearchOpen(false);
                            navigate(`/product/${p.id}`);
                            window.scrollTo({ top: 0, behavior: 'instant' });
                          }}
                        />
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
