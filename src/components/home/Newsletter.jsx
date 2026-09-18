import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';

export const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setStatus('success');
    setEmail('');
    setErrorMessage('');
    setTimeout(() => setStatus('idle'), 4000);
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
          <h2 className="section-heading-lg mb-5 md:mb-6">
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
                className="group flex items-center justify-center gap-2 whitespace-nowrap min-h-[44px] w-full sm:w-auto cursor-pointer"
              >
                SUBSCRIBE
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
                THANK YOU FOR SUBSCRIBING TO HOUSE OF URAAH
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
