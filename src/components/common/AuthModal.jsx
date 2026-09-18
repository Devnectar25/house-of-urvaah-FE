import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, Lock, Mail, User as UserIcon, ArrowRight, CheckCircle2, LogOut, Shield } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { Logo } from '../common/Logo';

export const AuthModal = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authMode,
    setAuthMode,
    user,
    loginUser,
    logoutUser,
  } = useCart();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    rememberMe: true,
    newsletter: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      const userName = authMode === 'signup' && formData.name ? formData.name : 'Eleanor Vance';
      const userEmail = formData.email || 'eleanor@houseofurvaah.com';

      setSuccessMessage(
        authMode === 'login'
          ? `Welcome back to the Atelier, ${userName}`
          : `Atelier account successfully created for ${userName}`
      );

      setTimeout(() => {
        loginUser({ name: userName, email: userEmail });
        setSuccessMessage('');
      }, 1200);
    }, 800);
  };

  if (!isAuthModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-serif selection:bg-brand-dark selection:text-white select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsAuthModalOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-md bg-white border border-neutral-200 shadow-2xl overflow-hidden my-auto"
        >
          {/* Header Bar */}
          <div className="p-6 md:p-8 border-b border-neutral-100 flex items-center justify-between bg-[#FAF8F3]">
            <Logo className="h-10 sm:h-12" />
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="p-2 text-neutral-500 hover:text-black transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 stroke-[1.5]" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8">
            {user ? (
              /* LOGGED IN USER PROFILE SUMMARY */
              <div className="text-center space-y-6 py-4">
                <div className="w-16 h-16 rounded-full bg-[#FAF8F3] border border-neutral-300 mx-auto flex items-center justify-center text-xl font-medium tracking-widest text-neutral-800">
                  {user.name.charAt(0).toUpperCase()}
                </div>

                <div>
                  <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 block mb-1">
                    ATELIER MEMBER
                  </span>
                  <h3 className="text-xl font-serif tracking-[0.15em] uppercase text-[#111111]">
                    {user.name}
                  </h3>
                  <p className="text-xs text-neutral-500 font-light mt-1">{user.email}</p>
                </div>

                <div className="border-t border-b border-neutral-100 py-4 text-xs tracking-wider space-y-2 text-neutral-700 uppercase">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">MEMBER TIER:</span>
                    <span className="font-semibold text-black">PRIVILÈGE VIP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">SAVED ADDRESSES:</span>
                    <span className="font-semibold text-black">2 SALONS</span>
                  </div>
                </div>

                <button
                  onClick={logoutUser}
                  className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-semibold tracking-[0.25em] uppercase py-3.5 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 stroke-[1.5]" /> SIGN OUT
                </button>
              </div>
            ) : (
              /* AUTH FORM (LOGIN / SIGNUP) */
              <>
                {/* Tab Switcher */}
                <div className="flex border-b border-neutral-200 mb-6">
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setSuccessMessage('');
                    }}
                    className={`flex-1 py-3 text-xs tracking-[0.25em] uppercase font-semibold text-center transition-all border-b-2 cursor-pointer ${
                      authMode === 'login'
                        ? 'border-black text-black'
                        : 'border-transparent text-neutral-400 hover:text-neutral-600'
                    }`}
                  >
                    LOGIN
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('signup');
                      setSuccessMessage('');
                    }}
                    className={`flex-1 py-3 text-xs tracking-[0.25em] uppercase font-semibold text-center transition-all border-b-2 cursor-pointer ${
                      authMode === 'signup'
                        ? 'border-black text-black'
                        : 'border-transparent text-neutral-400 hover:text-neutral-600'
                    }`}
                  >
                    SIGN UP
                  </button>
                </div>

                {/* Success Feedback Overlay */}
                {successMessage ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-10 text-center space-y-3"
                  >
                    <CheckCircle2 className="w-10 h-10 text-emerald-800 mx-auto stroke-[1.5]" />
                    <p className="text-sm font-serif tracking-widest uppercase text-neutral-900">
                      {successMessage}
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4 font-serif">
                    {/* Full Name field (Sign Up mode only) */}
                    {authMode === 'signup' && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] sm:text-xs tracking-[0.2em] uppercase text-neutral-900 font-semibold block">
                          FULL NAME *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. Eleanor Vance"
                            className="w-full bg-white border border-neutral-300 pl-10 pr-4 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 font-medium focus:outline-none focus:border-black transition-colors"
                          />
                          <UserIcon className="w-4 h-4 text-neutral-700 absolute left-3 top-3 stroke-[1.75]" />
                        </div>
                      </div>
                    )}

                    {/* Email Field */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] sm:text-xs tracking-[0.2em] uppercase text-neutral-900 font-semibold block">
                        EMAIL ADDRESS *
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="eleanor@example.com"
                          className="w-full bg-white border border-neutral-300 pl-10 pr-4 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 font-medium focus:outline-none focus:border-black transition-colors"
                        />
                        <Mail className="w-4 h-4 text-neutral-700 absolute left-3 top-3 stroke-[1.75]" />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] sm:text-xs tracking-[0.2em] uppercase text-neutral-900 font-semibold">
                          PASSWORD *
                        </label>
                        {authMode === 'login' && (
                          <a
                            href="#forgot-password"
                            onClick={(e) => {
                              e.preventDefault();
                              alert('A password reset link has been dispatched to your email.');
                            }}
                            className="text-[11px] tracking-widest uppercase font-semibold text-neutral-900 hover:underline transition-colors"
                          >
                            FORGOT?
                          </a>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          required
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="••••••••••••"
                          className="w-full bg-white border border-neutral-300 pl-10 pr-10 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 font-medium focus:outline-none focus:border-black transition-colors"
                        />
                        <Lock className="w-4 h-4 text-neutral-700 absolute left-3 top-3 stroke-[1.75]" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-neutral-700 hover:text-black transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4 stroke-[1.75]" />
                          ) : (
                            <Eye className="w-4 h-4 stroke-[1.75]" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Options / Newsletter Checkboxes */}
                    {authMode === 'signup' ? (
                      <div className="flex items-start gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="newsletter"
                          name="newsletter"
                          checked={formData.newsletter}
                          onChange={handleChange}
                          className="mt-0.5 border-neutral-400 accent-black cursor-pointer"
                        />
                        <label htmlFor="newsletter" className="text-[11px] text-neutral-800 leading-normal font-normal">
                          Subscribe to House of Urvaah Atelier Private Newsletter for early access to A/W 2026 releases.
                        </label>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="rememberMe"
                          name="rememberMe"
                          checked={formData.rememberMe}
                          onChange={handleChange}
                          className="border-neutral-400 accent-black cursor-pointer"
                        />
                        <label htmlFor="rememberMe" className="text-[11px] uppercase tracking-wider text-neutral-900 font-semibold">
                          KEEP ME SIGNED IN
                        </label>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#111111] text-white text-xs font-semibold tracking-[0.25em] uppercase py-3.5 hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 cursor-pointer mt-4"
                    >
                      {isSubmitting ? (
                        <span className="animate-pulse">AUTHENTICATING...</span>
                      ) : (
                        <>
                          {authMode === 'login' ? 'LOG IN TO ATELIER' : 'SIGN UP'}
                          <ArrowRight className="w-4 h-4 stroke-[1.5]" />
                        </>
                      )}
                    </button>

                    {/* Or Divider */}
                    <div className="relative my-5">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-neutral-200" />
                      </div>
                      <div className="relative flex justify-center text-[9px] uppercase tracking-widest text-neutral-400 bg-white px-2">
                        OR CONTINUE WITH
                      </div>
                    </div>

                    {/* Quick Social Auth Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          loginUser({ name: 'Eleanor Vance', email: 'eleanor.google@example.com' });
                        }}
                        className="border border-neutral-300 py-2.5 px-3 text-[10px] tracking-wider uppercase font-medium text-neutral-700 hover:border-black transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                        GOOGLE
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          loginUser({ name: 'Eleanor Vance', email: 'eleanor.facebook@example.com' });
                        }}
                        className="border border-neutral-300 py-2.5 px-3 text-[10px] tracking-wider uppercase font-semibold text-neutral-800 hover:border-black transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5 fill-[#1877F2]" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        FACEBOOK
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>

          {/* Footer Security Notice */}
          <div className="bg-[#FAF8F3] px-6 py-3.5 border-t border-neutral-200/80 flex items-center justify-center gap-2 text-[10px] text-neutral-500 tracking-widest uppercase">
            <Shield className="w-3.5 h-3.5 text-neutral-400 stroke-[1.5]" />
            256-BIT ENCRYPTED ATELIER CONCIERGE
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AuthModal;
