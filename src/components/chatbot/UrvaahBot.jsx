import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Send,
  X,
  RotateCcw,
  Sparkles,
  Eye,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  ChevronLeft,
  Check,
  Mic,
  LayoutGrid,
  List,
  Maximize2
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { apiFetch } from '../../services/api';
import { getProductUrl } from '../../utils/productUrl';

const QUICK_SUGGESTIONS = [
  'Show trending corsets',
  'Summer Bloom collection',
  'Size & Fit advice',
  'Shipping & Return policy',
  'What are your best sellers?'
];

const INITIAL_MESSAGE = {
  id: 'welcome',
  sender: 'bot',
  text: "Hello! I am **House of Urvaah Bot**, your personal luxury customer care. 🌿\n\nHow may I curate your style journey today? You can ask me about our corsets, bespoke fabrics, sizing guidance, or order tracking.",
  products: [],
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price || 0);
};

// Compact, interactive product recommendations with NO forced scrolling
const BotProductRecommendations = ({ products, onProductClick, onQuickView, onOpenCatalog }) => {
  const [viewMode, setViewMode] = useState('cards'); // 'cards' (2 per page with Next/Prev buttons) | 'list' (compact rows)
  const [page, setPage] = useState(0);

  if (!products || products.length === 0) return null;

  const pageSize = 2;
  const totalPages = Math.ceil(products.length / pageSize);
  const displayedProducts = viewMode === 'cards'
    ? products.slice(page * pageSize, (page + 1) * pageSize)
    : products;

  return (
    <div className="mt-3 pt-3 border-t border-stone-200/80 space-y-2">
      {/* Header bar with controls */}
      <div className="flex items-center justify-between gap-1.5 flex-wrap">
        <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 font-serif font-semibold truncate">
          Store Pieces ({products.length})
        </p>

        {/* View Switchers & Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Card Showcase vs Compact List Switcher */}
          <div className="flex items-center bg-neutral-100 p-0.5 rounded-md border border-neutral-200/70">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              title="Showcase Cards (2 per page with Next/Prev arrows)"
              className={`px-1.5 py-0.5 rounded text-xs transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-black shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-black'
              }`}
            >
              <LayoutGrid className="w-2.5 h-2.5" />
              <span className="text-[8.5px] uppercase tracking-wider font-sans">Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              title="Compact List (All pieces visible at once)"
              className={`px-1.5 py-0.5 rounded text-xs transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-black shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-black'
              }`}
            >
              <List className="w-2.5 h-2.5" />
              <span className="text-[8.5px] uppercase tracking-wider font-sans">List</span>
            </button>
          </div>

          {/* Full Catalog Popout */}
          {onOpenCatalog && (
            <button
              type="button"
              onClick={() => onOpenCatalog(products)}
              title="Browse all pieces in catalog overlay"
              className="px-1.5 py-0.5 rounded bg-neutral-100 hover:bg-black hover:text-white text-neutral-600 text-[8.5px] font-sans font-semibold uppercase tracking-wider border border-neutral-200/70 flex items-center gap-1 transition-all cursor-pointer"
            >
              <Maximize2 className="w-2.5 h-2.5" />
              <span>All ({products.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. CARDS SHOWCASE (Paginated, 2 per page - ZERO SCROLLING NEEDED) */}
      {viewMode === 'cards' && (
        <div className="space-y-2">
          {/* 2 Side-by-Side Cards */}
          <div className="grid grid-cols-2 gap-2">
            {displayedProducts.map((prod) => (
              <div
                key={prod.id}
                onClick={() => onProductClick(prod)}
                className="w-full bg-white border border-neutral-200/90 rounded-xl p-2 flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-black/30 transition-all duration-200 cursor-pointer group"
              >
                <div>
                  <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-neutral-100 mb-1.5">
                    <img
                      src={prod.image || '/assets/Images/Brown01.png'}
                      alt={prod.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/assets/Images/Brown01.png';
                      }}
                    />
                    {prod.inStock !== false ? (
                      <span className="absolute top-1 left-1 bg-emerald-700/90 backdrop-blur-xs text-white text-[7.5px] font-sans font-semibold tracking-wider px-1.5 py-0.5 rounded shadow-2xs uppercase">
                        IN STOCK
                      </span>
                    ) : (
                      <span className="absolute top-1 left-1 bg-neutral-800/90 backdrop-blur-xs text-white text-[7.5px] font-sans font-semibold tracking-wider px-1.5 py-0.5 rounded shadow-2xs uppercase">
                        LIMITED
                      </span>
                    )}
                  </div>
                  <h4 
                    title={prod.name}
                    className="text-[11px] font-serif font-semibold text-neutral-900 line-clamp-2 min-h-[28px] leading-tight group-hover:text-neutral-600 transition-colors"
                  >
                    {prod.name}
                  </h4>
                  <p className="text-[11px] font-sans font-bold text-neutral-900 mt-0.5">
                    {formatPrice(prod.price)}
                  </p>
                </div>
                <div className="mt-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onProductClick(prod);
                    }}
                    className="flex-1 bg-black hover:bg-neutral-800 text-white text-[8.5px] font-sans font-semibold tracking-[0.12em] uppercase py-1.5 px-1 rounded flex items-center justify-center gap-0.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <span>DETAILS</span>
                    <ChevronRight className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onQuickView) {
                        onQuickView(prod);
                      } else {
                        onProductClick(prod);
                      }
                    }}
                    title="Quick Preview"
                    aria-label="Quick Preview"
                    className="p-1 min-w-[26px] min-h-[26px] border border-neutral-300 hover:border-black hover:bg-neutral-100 rounded text-neutral-700 hover:text-black flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Navigation Bar (Prev / Next & Dots) - Zero scrolling needed */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-neutral-50 border border-neutral-200/80 rounded-lg px-2 py-1">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className={`flex items-center gap-0.5 text-[8.5px] font-semibold uppercase tracking-wider px-2 py-1 rounded transition-colors ${
                  page === 0
                    ? 'text-neutral-300 cursor-not-allowed'
                    : 'text-neutral-700 hover:text-black hover:bg-white bg-white/70 cursor-pointer shadow-2xs'
                }`}
              >
                <ChevronLeft className="w-3 h-3" />
                <span>Prev</span>
              </button>

              {/* Clickable Page Dots */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPage(idx)}
                    title={`Go to page ${idx + 1}`}
                    className={`transition-all rounded-full cursor-pointer ${
                      page === idx
                        ? 'w-4 h-1.5 bg-black'
                        : 'w-1.5 h-1.5 bg-neutral-300 hover:bg-neutral-500'
                    }`}
                  />
                ))}
                <span className="text-[8.5px] text-neutral-500 font-sans ml-1">
                  {page + 1}/{totalPages}
                </span>
              </div>

              <button
                type="button"
                disabled={page === totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className={`flex items-center gap-0.5 text-[8.5px] font-semibold uppercase tracking-wider px-2 py-1 rounded transition-colors ${
                  page === totalPages - 1
                    ? 'text-neutral-300 cursor-not-allowed'
                    : 'text-neutral-700 hover:text-black hover:bg-white bg-white/70 cursor-pointer shadow-2xs'
                }`}
              >
                <span>Next</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. COMPACT LIST VIEW (All items visible at once without scrolling!) */}
      {viewMode === 'list' && (
        <div className="space-y-1.5">
          {products.map((prod) => (
            <div
              key={prod.id}
              onClick={() => onProductClick(prod)}
              className="bg-white border border-neutral-200/90 rounded-lg p-1.5 flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs hover:border-black/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-10 h-12 rounded overflow-hidden bg-neutral-100 shrink-0">
                  <img
                    src={prod.image || '/assets/Images/Brown01.png'}
                    alt={prod.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/assets/Images/Brown01.png';
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[11px] font-serif font-semibold text-neutral-900 truncate group-hover:text-neutral-600 transition-colors">
                    {prod.name}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] font-sans font-bold text-neutral-900">
                      {formatPrice(prod.price)}
                    </span>
                    {prod.inStock !== false ? (
                      <span className="text-[8px] font-sans text-emerald-700 font-medium">
                        • In Stock
                      </span>
                    ) : (
                      <span className="text-[8px] font-sans text-amber-700 font-medium">
                        • Limited
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onProductClick(prod);
                  }}
                  className="bg-black hover:bg-neutral-800 text-white text-[8px] font-sans font-semibold tracking-wider uppercase py-1 px-2 rounded flex items-center gap-0.5 cursor-pointer shadow-2xs"
                >
                  <span>VIEW</span>
                  <ChevronRight className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onQuickView) {
                      onQuickView(prod);
                    } else {
                      onProductClick(prod);
                    }
                  }}
                  title="Quick View"
                  className="p-1 border border-neutral-300 hover:border-black hover:bg-neutral-100 rounded text-neutral-600 hover:text-black flex items-center justify-center cursor-pointer"
                >
                  <Eye className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const UrvaahBot = ({ isOpen, onClose }) => {
  const { setPdpProduct, setQuickViewProduct } = useCart();
  const navigate = useNavigate();
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('urvaah_bot_messages');
      return saved ? JSON.parse(saved) : [INITIAL_MESSAGE];
    } catch {
      return [INITIAL_MESSAGE];
    }
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => {
    let id = sessionStorage.getItem('urvaah_bot_session_id');
    if (!id) {
      id = 'session_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      sessionStorage.setItem('urvaah_bot_session_id', id);
    }
    return id;
  });
  const [feedbackGiven, setFeedbackGiven] = useState({});
  const [isListening, setIsListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState(null);
  const [activeCatalog, setActiveCatalog] = useState(null);


  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const recognitionRef = useRef(null);

  // Stop listening if chat window is closed
  useEffect(() => {
    if (!isOpen && isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
    }
  }, [isOpen, isListening]);

  // Voice Input (Web Speech API) handler
  const toggleVoiceInput = () => {
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
          setInputValue(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setVoiceNotice('Microphone access denied. Please allow microphone permissions in browser.');
        } else if (event.error !== 'no-speech') {
          setVoiceNotice(`Speech recognition: ${event.error}`);
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
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      setVoiceNotice('Microphone initialization failed. Check permissions.');
      setTimeout(() => setVoiceNotice(null), 3500);
    }
  };

  // Prevent background page from scrolling when user scrolls inside the chatbot
  useEffect(() => {
    if (!isOpen) return;
    const container = chatContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      const scrollEl = messagesContainerRef.current;
      if (!scrollEl) {
        e.preventDefault();
        return;
      }

      // If wheel event happened over non-scrollable header, chips, or input
      const isOverMessages = scrollEl.contains(e.target);
      if (!isOverMessages) {
        e.preventDefault();
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = scrollEl;
      const isAtTop = scrollTop <= 0;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

      // If scrolling up while at top boundary, or scrolling down while at bottom boundary
      if ((e.deltaY < 0 && isAtTop) || (e.deltaY > 0 && isAtBottom)) {
        e.preventDefault();
      }
    };

    let startTouchY = 0;
    const handleTouchStart = (e) => {
      startTouchY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      const scrollEl = messagesContainerRef.current;
      if (!scrollEl) return;
      const currentY = e.touches[0].clientY;
      const deltaY = startTouchY - currentY;
      const { scrollTop, scrollHeight, clientHeight } = scrollEl;
      const isAtTop = scrollTop <= 0;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

      if ((deltaY < 0 && isAtTop) || (deltaY > 0 && isAtBottom)) {
        e.preventDefault();
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, messages, isLoading]);

  useEffect(() => {
    try {
      sessionStorage.setItem('urvaah_bot_messages', JSON.stringify(messages));
    } catch (e) {
      console.warn('Could not persist chatbot messages:', e);
    }
  }, [messages]);

  const handleReset = () => {
    setMessages([
      {
        ...INITIAL_MESSAGE,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setFeedbackGiven({});
  };

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    const userMessage = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await apiFetch('/api/chatbot/query', {
        method: 'POST',
        body: JSON.stringify({
          query,
          sessionId,
          language: 'en'
        })
      });

      let botAnswer = "I'm here to help with your fashion queries, styling, and order details.";
      let returnedProducts = [];
      let queryLogId = null;

      if (res && res.data) {
        botAnswer = res.data.answer || botAnswer;
        returnedProducts = Array.isArray(res.data.products) ? res.data.products : [];
        queryLogId = res.data.queryLogId || null;
      } else if (res && res.message) {
        botAnswer = res.message;
      }

      const botMessage = {
        id: 'bot_' + Date.now(),
        sender: 'bot',
        text: botAnswer,
        products: returnedProducts,
        queryLogId,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Chatbot API request failed:', err);
      const fallbackMessage = {
        id: 'bot_' + Date.now(),
        sender: 'bot',
        text: "I'm having a momentary connection delay, but our store specialists are always at your service. Please try asking again or explore our curated collections.",
        products: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (msgId, queryLogId, type) => {
    if (feedbackGiven[msgId]) return;
    setFeedbackGiven((prev) => ({ ...prev, [msgId]: type }));

    if (queryLogId) {
      try {
        await apiFetch('/api/chatbot/feedback', {
          method: 'POST',
          body: JSON.stringify({
            queryLogId,
            feedback: type
          })
        });
      } catch (err) {
        console.warn('Feedback submission error:', err);
      }
    }
  };

  const handleProductClick = async (product) => {
    try {
      await apiFetch('/api/chatbot/log-click', {
        method: 'POST',
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          sessionId
        })
      });
    } catch {
      // fire-and-forget
    }

    if (product) {
      if (window.location.pathname === '/' || window.location.pathname === '') {
        try {
          sessionStorage.setItem('urvaah_home_scroll_y', String(window.scrollY || 0));
          sessionStorage.setItem('urvaah_home_should_restore', 'true');
        } catch {}
      }
      navigate(getProductUrl(product), {
        state: { fromScrollY: window.scrollY || 0 }
      });
    } else if (setPdpProduct) {
      setPdpProduct(product);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={chatContainerRef}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-0 sm:bottom-0 right-0 sm:right-0 z-50 w-[94vw] sm:w-[410px] h-[590px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-neutral-200 flex flex-col overflow-hidden font-sans select-text overscroll-contain"
          style={{
            bottom: '0px',
            right: '0px',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.25)',
            overscrollBehavior: 'contain',
            overscrollBehaviorY: 'contain'
          }}
        >
          {/* Hide both vertical & horizontal scrollbars across all browsers while allowing natural scrolling */}
          <style>{`
            .no-scrollbar::-webkit-scrollbar,
            .scrollbar-none::-webkit-scrollbar {
              display: none !important;
              width: 0 !important;
              height: 0 !important;
              background: transparent !important;
            }
            .no-scrollbar,
            .scrollbar-none {
              -ms-overflow-style: none !important;
              scrollbar-width: none !important;
            }
          `}</style>

          {/* In-Bot Full Catalog Drawer / Overlay */}
          {activeCatalog && (
            <div className="absolute inset-0 z-30 bg-white flex flex-col animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-neutral-950 text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => setActiveCatalog(null)}
                    title="Back to conversation"
                    className="p-1 hover:bg-white/10 rounded-full transition-colors text-white cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h4 className="text-xs font-serif font-semibold uppercase tracking-wider">
                      All Recommended Pieces ({activeCatalog.length})
                    </h4>
                    <p className="text-[10px] text-neutral-400 font-sans">
                      Curated from House of Urvaah
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveCatalog(null)}
                  title="Close"
                  className="p-1 text-neutral-400 hover:text-white rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#FAF9F6]">
                <div className="grid grid-cols-2 gap-2.5">
                  {activeCatalog.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => {
                        setActiveCatalog(null);
                        handleProductClick(prod);
                      }}
                      className="bg-white border border-neutral-200 rounded-xl p-2.5 flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-black/30 transition-all cursor-pointer group"
                    >
                      <div>
                        <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-neutral-100 mb-2">
                          <img
                            src={prod.image || '/assets/Images/Brown01.png'}
                            alt={prod.name}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/assets/Images/Brown01.png';
                            }}
                          />
                          {prod.inStock !== false ? (
                            <span className="absolute top-1.5 left-1.5 bg-emerald-700/90 text-white text-[8px] font-sans font-semibold tracking-wider px-1.5 py-0.5 rounded uppercase">
                              IN STOCK
                            </span>
                          ) : (
                            <span className="absolute top-1.5 left-1.5 bg-neutral-800/90 text-white text-[8px] font-sans font-semibold tracking-wider px-1.5 py-0.5 rounded uppercase">
                              LIMITED
                            </span>
                          )}
                        </div>
                        <h5 className="text-xs font-serif font-semibold text-neutral-900 line-clamp-2 min-h-[30px] leading-tight">
                          {prod.name}
                        </h5>
                        <p className="text-xs font-sans font-bold text-neutral-900 mt-1">
                          {formatPrice(prod.price)}
                        </p>
                      </div>
                      <div className="mt-2.5 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCatalog(null);
                            handleProductClick(prod);
                          }}
                          className="flex-1 bg-black hover:bg-neutral-800 text-white text-[9px] font-sans font-semibold tracking-wider uppercase py-1.5 rounded flex items-center justify-center gap-1 transition-all shadow-2xs cursor-pointer"
                        >
                          <span>VIEW PIECE</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (setQuickViewProduct) {
                              setQuickViewProduct(prod);
                            } else {
                              handleProductClick(prod);
                            }
                          }}
                          title="Quick Preview"
                          className="p-1.5 border border-neutral-300 hover:border-black hover:bg-neutral-100 rounded text-neutral-700 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="bg-white text-black px-4 py-3.5 flex items-center justify-between border-b border-neutral-200 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-neutral-100 border border-neutral-300/80 text-black shadow-inner">
                <Bot className="w-5 h-5 text-black stroke-[1.8]" />
              </div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold tracking-wider uppercase text-black font-serif">
                  House of Urvaah Bot
                </h3>
                <span className="bg-neutral-100 text-black text-[9px] font-semibold tracking-wider px-1.5 py-0.5 rounded border border-neutral-300 uppercase">
                  AI
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                title="Restart Conversation"
                className="p-1.5 rounded-full text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors"
                aria-label="Restart conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                title="Close House of Urvaah Bot"
                className="p-1.5 rounded-full text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors"
                aria-label="Close chat window"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Stream (Vertical Scroll - No Visible Scrollbar) */}
          <div
            ref={messagesContainerRef}
            style={{
              overscrollBehavior: 'contain',
              overscrollBehaviorY: 'contain',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
            className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-3.5 bg-[#FAF9F6] no-scrollbar scrollbar-none"
          >
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
                >
                  <div className={`flex gap-2 max-w-[90%] ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                    {isBot && (
                      <div className="w-7 h-7 rounded-full bg-neutral-100 border border-neutral-300/80 text-black flex items-center justify-center shrink-0 mt-1 shadow-xs">
                        <Bot className="w-4 h-4 text-black stroke-[1.8]" />
                      </div>
                    )}

                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                        isBot
                          ? 'bg-white text-stone-800 border border-neutral-200 rounded-tl-sm shadow-xs'
                          : 'bg-black border border-black text-white rounded-br-sm shadow-xs'
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-normal">
                        {msg.text.split('\n').map((line, i) => {
                          // bold markdown support **text**
                          const parts = line.split(/(\*\*.*?\*\*)/g);
                          return (
                            <React.Fragment key={i}>
                              {parts.map((p, idx) => {
                                if (p.startsWith('**') && p.endsWith('**')) {
                                  return (
                                    <strong key={idx} className="font-semibold text-brand-dark">
                                      {p.slice(2, -2)}
                                    </strong>
                                  );
                                }
                                return p;
                              })}
                              {i < msg.text.split('\n').length - 1 && <br />}
                            </React.Fragment>
                          );
                        })}
                      </div>

                      {/* Products preview with Showcase (Next/Prev pagination), List, and Full Catalog views */}
                      {isBot && msg.products && msg.products.length > 0 && (
                        <BotProductRecommendations
                          products={msg.products}
                          onProductClick={handleProductClick}
                          onQuickView={setQuickViewProduct}
                          onOpenCatalog={(prods) => setActiveCatalog(prods)}
                        />
                      )}

                      {/* Feedback buttons on bot answers */}
                      {isBot && msg.id !== 'welcome' && (
                        <div className="mt-2 pt-1 flex items-center justify-between text-[10px] text-stone-400">
                          <span className="text-[9px]">{msg.timestamp}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px]">Helpful?</span>
                            <button
                              onClick={() => handleFeedback(msg.id, msg.queryLogId, 'positive')}
                              disabled={!!feedbackGiven[msg.id]}
                              className={`p-0.5 rounded hover:text-emerald-600 transition-colors ${
                                feedbackGiven[msg.id] === 'positive' ? 'text-emerald-600 font-bold' : ''
                              }`}
                              title="Helpful"
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleFeedback(msg.id, msg.queryLogId, 'negative')}
                              disabled={!!feedbackGiven[msg.id]}
                              className={`p-0.5 rounded hover:text-rose-600 transition-colors ${
                                feedbackGiven[msg.id] === 'negative' ? 'text-rose-600 font-bold' : ''
                              }`}
                              title="Not helpful"
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                            {feedbackGiven[msg.id] && (
                              <Check className="w-3 h-3 text-emerald-600 ml-0.5" />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {!isBot && (
                    <span className="text-[9px] text-stone-400 mt-1 mr-1">
                      {msg.timestamp}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex items-start gap-2 max-w-[90%]">
                <div className="w-7 h-7 rounded-full bg-neutral-100 border border-neutral-300/80 text-black flex items-center justify-center shrink-0 mt-1 shadow-xs">
                  <Bot className="w-4 h-4 text-black animate-bounce stroke-[1.8]" />
                </div>
                <div className="bg-white text-neutral-600 border border-neutral-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-xs flex items-center gap-1.5">
                  <span className="text-xs text-neutral-600 font-medium">House of Urvaah Bot is crafting style advice</span>
                  <span className="flex items-center gap-1 ml-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse delay-150" />
                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse delay-300" />
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips (Horizontal Scroll - No Visible Scrollbar) */}
          <div
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
            className="px-3 py-2 bg-neutral-50 border-t border-neutral-200 overflow-x-auto flex gap-1.5 shrink-0 no-scrollbar scrollbar-none"
          >
            {QUICK_SUGGESTIONS.map((sugg, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(sugg)}
                disabled={isLoading}
                className="whitespace-nowrap bg-white hover:bg-black hover:text-white border border-neutral-300 hover:border-black text-neutral-800 text-[11px] px-2.5 py-1 rounded-full transition-all shrink-0 font-medium disabled:opacity-50 cursor-pointer"
              >
                {sugg}
              </button>
            ))}
          </div>

          {/* Voice Input Active / Error Notice */}
          {voiceNotice && (
            <div className="px-3.5 py-1.5 bg-neutral-900 text-white text-[11px] flex items-center justify-between border-t border-white/10 shrink-0 font-sans">
              <span className="flex items-center gap-1.5">
                {isListening ? (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                ) : (
                  <Sparkles className="w-3 h-3 text-amber-400" />
                )}
                <span className="tracking-wide">{voiceNotice}</span>
              </span>
              <button
                type="button"
                onClick={() => setVoiceNotice(null)}
                className="text-neutral-400 hover:text-white ml-2 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isListening && recognitionRef.current) {
                try {
                  recognitionRef.current.stop();
                } catch {}
                setIsListening(false);
              }
              if (!inputValue.trim()) {
                inputRef.current?.focus();
                return;
              }
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-neutral-200 shrink-0 flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isListening ? "Listening... Speak your question 🎙️" : "Ask House of Urvaah Bot about dresses, fits, orders..."}
                className={`w-full px-3.5 py-2 text-xs sm:text-sm bg-neutral-50 border rounded-full focus:outline-none transition-all text-neutral-900 placeholder:text-neutral-400 ${
                  isListening
                    ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/40 text-rose-950 font-medium'
                    : 'border-neutral-200 focus:border-black focus:ring-1 focus:ring-black focus:bg-white'
                }`}
                disabled={isLoading}
              />
            </div>

            {/* Voice Input (Microphone) Button */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              disabled={isLoading}
              data-no-hover="true"
              className={`no-global-hover group w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 border cursor-pointer hover:scale-105 active:scale-95 ${
                isListening
                  ? 'bg-rose-600 border-rose-600 text-white animate-pulse shadow-md ring-2 ring-rose-300'
                  : 'bg-neutral-100 hover:bg-black border-neutral-300 hover:border-black text-neutral-800 hover:text-white shadow-2xs hover:shadow-md'
              }`}
              title={isListening ? 'Stop listening' : 'Voice input (Speak to House of Urvaah Bot)'}
              aria-label={isListening ? 'Stop listening' : 'Voice input'}
            >
              {isListening ? (
                <Mic className="w-4 h-4 text-white animate-bounce" />
              ) : (
                <Mic className="w-4 h-4 text-neutral-800 group-hover:text-white transition-colors duration-200" />
              )}
            </button>

            {/* Send Message Button */}
            <button
              type="submit"
              disabled={isLoading}
              data-no-hover="true"
              className="no-global-hover group w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 border cursor-pointer hover:scale-105 active:scale-95 bg-neutral-100 hover:bg-black border-neutral-300 hover:border-black text-neutral-800 hover:text-white shadow-2xs hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send message"
              aria-label="Send message"
            >
              <Send className="w-4 h-4 ml-0.5 text-neutral-800 group-hover:text-white transition-colors duration-200" />
            </button>
          </form>

          {/* Footer note */}
          <div className="py-1.5 bg-neutral-50 border-t border-neutral-200/60 text-center">
            <a
              href="https://devnectar.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] tracking-widest text-neutral-400 hover:text-black transition-colors uppercase font-medium inline-block hover:underline"
            >
              Powered by <span className="normal-case font-semibold">devNectar</span>
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UrvaahBot;
