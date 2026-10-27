import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Bell, Mail, Phone, CheckCircle2, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';

export const StockNotificationModal = ({
  isOpen,
  onClose,
  product,
  selectedSize,
  selectedColor,
  user,
  onSubscribed
}) => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState('email'); // 'email' | 'both'
  const [loading, setLoading] = useState(false);
  const [resultStatus, setResultStatus] = useState(null); // 'success' | 'already' | 'error'
  const [message, setMessage] = useState('');
  const [validationError, setValidationError] = useState('');

  // Lock background scrolling and handle ESC key to close modal
  useModalScrollLock(Boolean(isOpen && product), onClose);

  // Pre-fill user details if logged in
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
    if (user?.phone || user?.contactno) {
      setPhone(user.phone || user.contactno);
    }
    setResultStatus(null);
    setMessage('');
    setValidationError('');
  }, [isOpen, user]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setResultStatus(null);

    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();

    if (!cleanEmail && channel === 'email') {
      setValidationError('Please enter a valid email address.');
      return;
    }

    if (cleanEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        setValidationError('Please enter a valid email address.');
        return;
      }
    }

    if (channel === 'both' && !cleanPhone) {
      setValidationError('Please enter your WhatsApp phone number.');
      return;
    }

    if (cleanPhone) {
      const phoneDigits = cleanPhone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        setValidationError('Please enter a valid 10-digit phone number.');
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        productId: product.id,
        size: selectedSize || null,
        color: selectedColor || null,
        email: cleanEmail || null,
        phone: cleanPhone || null,
        channel: channel === 'both' ? 'both' : 'email'
      };

      const res = await apiClient('/api/stock-notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res?.alreadySubscribed) {
        setResultStatus('already');
        setMessage(res.message || "You're already subscribed to this item.");
        onSubscribed?.({ email: cleanEmail, productId: product.id, size: selectedSize });
      } else if (res?.success) {
        setResultStatus('success');
        setMessage(res.message || "You're on the list! We'll notify you when this item is back in stock.");
        onSubscribed?.({ email: cleanEmail, productId: product.id, size: selectedSize });
      } else {
        setResultStatus('error');
        setMessage(res?.message || 'Unable to register notification. Please try again.');
      }
    } catch (err) {
      setResultStatus('error');
      setMessage(err.message || 'Something went wrong while connecting to House of Urvaah service.');
    } finally {
      setLoading(false);
    }
  };

  const productImage = product.image || (Array.isArray(product.gallery) && product.gallery[0]) || '';

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 pointer-events-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto no-scrollbar scrollbar-none bg-white border border-neutral-200 shadow-2xl p-6 sm:p-8 text-neutral-900 transition-all font-sans pointer-events-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-black transition-colors cursor-pointer pointer-events-auto z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <span className="text-[10px] font-serif tracking-[0.25em] text-neutral-400 uppercase block mb-1">
            HOUSE OF URVAAH
          </span>
          <h2 id="stock-modal-title" className="text-lg sm:text-xl font-normal font-serif tracking-widest uppercase text-neutral-900">
            NOTIFY ME WHEN AVAILABLE
          </h2>
          <p className="text-xs text-neutral-500 font-sans mt-1.5 leading-relaxed">
            Receive priority notice the instant this silhouette returns to our inventory.
          </p>
        </div>

        {/* Product Variant Summary Card */}
        <div className="flex items-center gap-3.5 bg-neutral-50 border border-neutral-200 p-3 mb-5">
          {productImage && (
            <img
              src={productImage}
              alt={product.name || product.title}
              className="w-14 h-16 object-cover border border-neutral-200 shrink-0"
            />
          )}
          <div className="min-w-0 flex-1 text-left">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-neutral-900 truncate">
              {product.name || product.title}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-600 font-sans">
              {selectedSize && (
                <span className="bg-white border border-neutral-200 px-1.5 py-0.5 font-medium">
                  Size: <strong className="text-black">{selectedSize}</strong>
                </span>
              )}
              {selectedColor && selectedColor !== 'Default' && (
                <span className="bg-white border border-neutral-200 px-1.5 py-0.5 font-medium">
                  Color: {selectedColor}
                </span>
              )}
            </div>
            {product.price && (
              <span className="text-xs font-medium text-neutral-900 block mt-1">
                ₹{Number(product.price).toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* Success or Already Subscribed Feedback State */}
        {resultStatus === 'success' || resultStatus === 'already' ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold tracking-wider uppercase text-neutral-900 font-serif">
                {resultStatus === 'success' ? 'YOU’RE ON THE LIST!' : 'ALREADY SUBSCRIBED'}
              </h4>
              <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed">
                {message}
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-black text-white text-xs font-semibold tracking-[0.2em] uppercase hover:bg-neutral-800 transition-colors cursor-pointer pointer-events-auto"
              >
                CONTINUE BROWSING
              </button>
            </div>
          </div>
        ) : (
          /* Subscription Form */
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {/* Validation or API Error Alert */}
            {(validationError || resultStatus === 'error') && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{validationError || message}</span>
              </div>
            )}

            {/* Notification Channel Toggle */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold tracking-wider uppercase text-neutral-700 block">
                Notification Channel
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={channel === 'email'}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setChannel('email');
                  }}
                  className={`py-2 px-3 border flex items-center justify-center gap-1.5 transition-all cursor-pointer pointer-events-auto select-none ${
                    channel === 'email'
                      ? 'border-black bg-neutral-900 text-white font-semibold shadow-xs'
                      : 'border-neutral-300 text-neutral-700 hover:border-black bg-white hover:bg-neutral-50'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span>Email Only</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={channel === 'both'}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setChannel('both');
                  }}
                  className={`py-2 px-3 border flex items-center justify-center gap-1.5 transition-all cursor-pointer pointer-events-auto select-none ${
                    channel === 'both'
                      ? 'border-black bg-neutral-900 text-white font-semibold shadow-xs'
                      : 'border-neutral-300 text-neutral-700 hover:border-black bg-white hover:bg-neutral-50'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span>Email & WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Email Address Input */}
            <div className="space-y-1">
              <label htmlFor="stock-email" className="text-[11px] font-semibold tracking-wider uppercase text-neutral-700 block">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="stock-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full h-10 px-3.5 text-xs border border-neutral-300 focus:border-black focus:outline-hidden bg-white text-neutral-900 font-sans pointer-events-auto"
                />
              </div>
            </div>

            {/* WhatsApp Phone Number Input */}
            {channel === 'both' && (
              <div className="space-y-1 animate-in fade-in duration-150">
                <label htmlFor="stock-phone" className="text-[11px] font-semibold tracking-wider uppercase text-neutral-700 block">
                  WhatsApp Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex">
                  <span className="inline-flex items-center px-3 border border-r-0 border-neutral-300 bg-neutral-100 text-neutral-600 text-xs">
                    +91
                  </span>
                  <input
                    id="stock-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full h-10 px-3.5 text-xs border border-neutral-300 focus:border-black focus:outline-hidden bg-white text-neutral-900 font-sans pointer-events-auto"
                  />
                </div>
              </div>
            )}

            {/* Store Guarantee Note */}
            <div className="pt-1 flex items-start gap-2 text-[11px] text-neutral-500 leading-relaxed font-sans">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>We only alert you when this exact silhouette and size is restocked. No spam, ever.</span>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-black text-white hover:bg-neutral-800 disabled:bg-neutral-400 text-xs font-bold tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2 cursor-pointer pointer-events-auto shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>REGISTERING ALERT...</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    <span>NOTIFY ME WHEN AVAILABLE</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
