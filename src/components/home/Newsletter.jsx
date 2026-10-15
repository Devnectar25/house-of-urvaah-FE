import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';
import { apiClient } from '../../lib/apiClient';

export const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validateEmailFormat = (input) => {
    if (!input || !input.trim()) return 'Email address is required.';
    const trimmed = input.trim();
    if (trimmed.length > 254) return 'Email address is too long.';
    if (trimmed.includes('..')) return 'Email cannot contain consecutive dots.';
    const parts = trimmed.split('@');
    if (parts.length !== 2) return 'Please enter a valid email with a single @ symbol.';
    const [local, domain] = parts;
    if (!local) return 'Please enter the username portion before @.';
    if (!domain || !domain.includes('.')) return 'Please provide a valid domain (e.g. domain.com).';
    const domainParts = domain.split('.');
    const tld = domainParts[domainParts.length - 1];
    if (!tld || tld.length < 2) return 'Please provide a valid top-level domain (e.g. .com, .in).';
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!emailRegex.test(trimmed)) return 'Please enter a valid email address (e.g. name@domain.com).';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valError = validateEmailFormat(email);
    if (valError) {
      setStatus('error');
      setErrorMessage(valError);
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const data = await apiClient('/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          source: 'homepage'
        })
      });

      setStatus('success');
      setSuccessMessage(data?.message || 'THANK YOU FOR SUBSCRIBING TO HOUSE OF URVAAH');
      setEmail('');
      setTimeout(() => {
        setStatus('idle');
        setSuccessMessage('');
      }, 5000);
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message || 'Subscription failed. Please check your internet connection.');
    }
  };

  return (
    <section className="py-24 bg-white font-serif text-brand-dark border-b border-neutral-300">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-[10px] tracking-[0.35em] uppercase text-neutral-400 font-serif block mb-2">
            EXCLUSIVE ACCESS
          </span>
          <h2 className="section-heading-lg font-serif tracking-[0.1em] text-brand-dark mb-5 md:mb-6">
            BE THE FIRST TO KNOW
          </h2>
          <p className="text-xs md:text-sm text-neutral-500 tracking-wider font-light leading-relaxed mb-8 max-w-lg mx-auto">
            Subscribe to receive private invitations to runway drops, secret archive sales, and seasonal editorials.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row items-stretch border-b border-black pb-2 gap-2 sm:gap-3">
              <input
                type="email"
                placeholder="ENTER YOUR EMAIL ADDRESS"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                className="flex-1 bg-transparent text-xs tracking-widest uppercase outline-none py-2.5 px-2 placeholder:text-neutral-300 font-light min-h-[44px]"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={status === 'loading'}
                className="group flex items-center justify-center gap-2 whitespace-nowrap min-h-[44px] w-full sm:w-auto cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? 'SUBSCRIBING...' : 'SUBSCRIBE'}
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Error state */}
            {status === 'error' && (
              <p className="text-[11px] text-red-600 font-serif tracking-wider mt-2 text-left">
                {errorMessage}
              </p>
            )}

            {/* Success Toast */}
            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-neutral-900 text-white text-xs tracking-wider uppercase font-medium flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                {successMessage || 'THANK YOU FOR SUBSCRIBING TO HOUSE OF URVAAH'}
              </motion.div>
            )}

            <p className="text-[10px] text-neutral-400 tracking-widest font-light mt-4">
              By subscribing, you agree to our{' '}
              <a href="#privacy" className="underline hover:text-black">
                Privacy Policy
              </a>
              . You may unsubscribe at any time.
            </p>
          </form>
        </motion.div>
      </div>
    </section>
  );
};
