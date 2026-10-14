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
  Check,
  Mic,
  MicOff
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { apiFetch } from '../../services/api';

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
  text: "Hello! I am **Urvaah bot**, your personal luxury fashion concierge. 🌿\n\nHow may I curate your style journey today? You can ask me about our corsets, bespoke fabrics, sizing guidance, or order tracking.",
  products: [],
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
        text: "I'm having a momentary connection delay, but our atelier specialists are always at your service. Please try asking again or explore our curated collections.",
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

    if (product?.id) {
      navigate(`/product/${product.id}`);
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else if (setPdpProduct) {
      setPdpProduct(product);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price || 0);
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
          className="fixed bottom-[30px] right-2 sm:right-4 z-50 w-[94vw] sm:w-[410px] h-[590px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-neutral-200 flex flex-col overflow-hidden font-sans select-text overscroll-contain"
          style={{
            bottom: '30px',
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

          {/* Header */}
          <div className="bg-white text-black px-4 py-3.5 flex items-center justify-between border-b border-neutral-200 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-neutral-100 border border-neutral-300/80 text-black shadow-inner">
                <Bot className="w-5 h-5 text-black stroke-[1.8]" />
              </div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold tracking-wider uppercase text-black font-serif">
                  Urvaah bot
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
                title="Close Urvaah bot"
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

                      {/* Products preview if available */}
                      {isBot && msg.products && msg.products.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-stone-100 space-y-2">
                          <p className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
                            Recommended Atelier Pieces ({msg.products.length})
                          </p>
                          <div
                            style={{
                              scrollbarWidth: 'none',
                              msOverflowStyle: 'none'
                            }}
                            className="flex gap-2 overflow-x-auto pb-1.5 pt-1 -mx-1 px-1 no-scrollbar scrollbar-none"
                          >
                            {msg.products.map((prod) => (
                              <div
                                key={prod.id}
                                className="w-[140px] shrink-0 bg-stone-50 border border-stone-200 rounded-lg p-2 flex flex-col justify-between hover:shadow-md transition-shadow group"
                              >
                                <div className="relative aspect-[3/4] w-full rounded overflow-hidden bg-stone-200 mb-1.5">
                                  <img
                                    src={prod.image || 'https://via.placeholder.com/300'}
                                    alt={prod.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                      e.target.src = 'https://via.placeholder.com/300';
                                    }}
                                  />
                                  {prod.inStock ? (
                                    <span className="absolute top-1 left-1 bg-emerald-600/90 text-white text-[8px] font-semibold px-1 rounded uppercase">
                                      In Stock
                                    </span>
                                  ) : (
                                    <span className="absolute top-1 left-1 bg-stone-600/90 text-white text-[8px] font-semibold px-1 rounded uppercase">
                                      Rare
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <h4 className="text-[11px] font-semibold text-stone-800 line-clamp-1">
                                    {prod.name}
                                  </h4>
                                  <p className="text-[10px] text-stone-900 font-semibold mt-0.5">
                                    {formatPrice(prod.price)}
                                  </p>
                                </div>
                                <div className="mt-2 flex gap-1">
                                  <button
                                    onClick={() => handleProductClick(prod)}
                                    className="flex-1 bg-black hover:bg-neutral-800 text-white border border-black text-[9px] font-semibold tracking-wider uppercase py-1 px-1.5 rounded flex items-center justify-center gap-0.5 transition-colors cursor-pointer"
                                  >
                                    <span>Details</span>
                                    <ChevronRight className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    onClick={() => handleProductClick(prod)}
                                    title="View Product Details"
                                    className="p-1 border border-stone-300 hover:bg-stone-200 rounded text-stone-700 transition-colors cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
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
                  <span className="text-xs text-neutral-600 font-medium">Urvaah bot is crafting style advice</span>
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
                placeholder={isListening ? "Listening... Speak your question 🎙️" : "Ask Urvaah bot about dresses, fits, orders..."}
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
              title={isListening ? 'Stop listening' : 'Voice input (Speak to Urvaah bot)'}
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
              Powered by devnectar
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UrvaahBot;
