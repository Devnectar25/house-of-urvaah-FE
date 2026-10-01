import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, User, Mail, AlertCircle, RefreshCw } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import apiClient from '../../lib/apiClient';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const AuthSection = () => {
  const navigate = useNavigate();
  const { user, openAuthModal, logoutUser } = useCart();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    // Open Auth Modal initialized with OTP flow
    openAuthModal('email');
  };

  return (
    <section id="account-section" className="w-full bg-[#FAF8F3] py-16 md:py-24 border-y border-neutral-200/80 font-serif select-none overflow-hidden">
      <div className="w-full max-w-[1500px] mx-auto px-6 sm:px-10 lg:px-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <span className="text-[10px] sm:text-xs font-serif tracking-[0.3em] uppercase text-neutral-500 mb-3 block">
            ATELIER MEMBERSHIP & CONCIERGE
          </span>
          <h2 className="section-heading font-serif tracking-[0.1em] text-brand-dark mb-5">
            ACCESS THE ATELIER
          </h2>
          <div className="w-16 h-[1px] bg-neutral-900/30 mx-auto mb-5" />
          <p className="text-xs sm:text-sm md:text-base font-serif text-neutral-700 leading-relaxed font-light">
            Unlock bespoke concierge styling, express checkout, order tracking, and private invitations to limited-run Autumn / Winter releases with single-click OTP login.
          </p>
        </div>

        {user ? (
          /* LOGGED IN USER STATE */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto bg-white p-8 sm:p-12 border border-neutral-200 shadow-xs text-center space-y-6"
          >
            <div className="w-20 h-20 rounded-full bg-[#FAF8F3] border border-neutral-300 mx-auto flex items-center justify-center text-2xl font-serif font-normal tracking-widest text-neutral-800">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 block mb-1">
                AUTHENTICATED ATELIER MEMBER
              </span>
              <h3 className="text-2xl font-serif tracking-[0.15em] uppercase text-[#111111]">
                WELCOME BACK, {user.name}
              </h3>
              <p className="text-xs text-neutral-500 font-light mt-1">{user.email}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-neutral-200 text-left">
              <div className="p-4 bg-neutral-50 border border-neutral-200/60">
                <span className="text-[9px] uppercase tracking-widest text-neutral-400 block">ACCOUNT</span>
                <span className="text-sm font-semibold tracking-wider text-black block mt-0.5">VERIFIED</span>
              </div>
              <div className="p-4 bg-neutral-50 border border-neutral-200/60">
                <span className="text-[9px] uppercase tracking-widest text-neutral-400 block">WISHLIST</span>
                <span className="text-sm font-semibold tracking-wider text-black block mt-0.5">SAVED ITEMS</span>
              </div>
              <div className="p-4 bg-neutral-50 border border-neutral-200/60">
                <span className="text-[9px] uppercase tracking-widest text-neutral-400 block">CONCIERGE</span>
                <span className="text-sm font-semibold tracking-wider text-black block mt-0.5">ACTIVE</span>
              </div>
            </div>

            <button
              onClick={logoutUser}
              className="bg-[#111111] text-white text-xs font-semibold tracking-[0.25em] uppercase px-8 py-3.5 hover:bg-neutral-800 transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              SIGN OUT OF ATELIER
            </button>
          </motion.div>
        ) : (
          /* SINGLE OTP LOGIN CARD */
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-xl mx-auto bg-white p-8 sm:p-12 border border-neutral-200/90 shadow-xs"
          >
            <div className="text-center mb-8">
              <span className="text-[10px] tracking-[0.25em] uppercase text-neutral-400 block mb-1">
                INSTANT EMAIL OTP LOGIN
              </span>
              <h3 className="text-xl sm:text-2xl font-serif font-normal tracking-[0.15em] uppercase text-[#111111]">
                SIGN IN / SIGN UP
              </h3>
              <p className="text-xs text-neutral-500 font-light mt-2">
                One seamless flow for new and returning Atelier members.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xs text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1">
                <label className="text-[11px] sm:text-xs tracking-[0.2em] uppercase text-neutral-900 font-semibold block">
                  EMAIL ADDRESS *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="eleanor@example.com"
                    className={`w-full bg-white border ${error ? 'border-red-500' : 'border-neutral-300'} pl-10 pr-4 py-3 text-xs text-neutral-900 placeholder:text-neutral-400 font-medium focus:outline-none focus:border-black transition-colors`}
                  />
                  <Mail className="w-4 h-4 text-neutral-700 absolute left-3 top-3.5 stroke-[1.75]" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#111111] text-white text-xs font-semibold tracking-[0.25em] uppercase py-4 hover:bg-neutral-800 transition-colors flex items-center justify-center gap-3 cursor-pointer mt-6"
              >
                CONTINUE WITH OTP <ArrowRight className="w-4 h-4 stroke-[1.5]" />
              </button>
            </form>
          </motion.div>
        )}

        {/* Member Privileges Highlights Footer */}
        <div className="mt-14 pt-10 border-t border-neutral-200/80 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="flex flex-col items-center">
            <ShieldCheck className="w-5 h-5 text-neutral-700 mb-2 stroke-[1.5]" />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-neutral-900">EXPRESS CHECKOUT</span>
            <p className="text-[11px] text-neutral-500 font-light mt-1">Saved addresses and seamless order tracking</p>
          </div>

          <div className="flex flex-col items-center">
            <Sparkles className="w-5 h-5 text-neutral-700 mb-2 stroke-[1.5]" />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-neutral-900">PRIVATE PREVIEWS</span>
            <p className="text-[11px] text-neutral-500 font-light mt-1">First access to limited-run atelier drops</p>
          </div>

          <div className="flex flex-col items-center">
            <User className="w-5 h-5 text-neutral-700 mb-2 stroke-[1.5]" />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-neutral-900">STYLING CONCIERGE</span>
            <p className="text-[11px] text-neutral-500 font-light mt-1">Dedicated priority assistance & tailoring support</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuthSection;
