import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, User, Lock, Mail, Eye, EyeOff, AlertCircle, RefreshCw } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../lib/supabase';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const AuthSection = () => {
  const { user, loginUser, logoutUser } = useCart();

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Form fields state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupNewsletter, setSignupNewsletter] = useState(true);

  // Error states
  const [loginErrors, setLoginErrors] = useState({});
  const [signupErrors, setSignupErrors] = useState({});
  const [loginServerError, setLoginServerError] = useState('');
  const [signupServerError, setSignupServerError] = useState('');

  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [isSignupSubmitting, setIsSignupSubmitting] = useState(false);

  const [submittedStatus, setSubmittedStatus] = useState(''); // 'login' | 'signup' | ''

  const validateLoginForm = () => {
    const errors = {};
    if (!loginEmail || !loginEmail.trim() || !EMAIL_REGEX.test(loginEmail.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    if (!loginPassword) {
      errors.password = 'Password is required';
    }
    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateSignupForm = () => {
    const errors = {};
    if (!signupName || !signupName.trim()) {
      errors.name = 'Full name is required';
    } else if (signupName.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters';
    }

    if (!signupEmail || !signupEmail.trim() || !EMAIL_REGEX.test(signupEmail.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!signupPassword || signupPassword.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!signupConfirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    } else if (signupPassword !== signupConfirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setSignupErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginServerError('');
    if (!validateLoginForm()) return;

    setIsLoginSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (error) {
        setLoginServerError('Invalid email or password.');
        setIsLoginSubmitting(false);
        return;
      }

      setSubmittedStatus('login');
      const loggedUser = data.user;
      const userName = loggedUser.user_metadata?.full_name || loggedUser.email.split('@')[0];

      setTimeout(() => {
        loginUser({
          id: loggedUser.id,
          name: userName,
          email: loggedUser.email
        });
        setSubmittedStatus('');
        setIsLoginSubmitting(false);
      }, 1000);
    } catch (err) {
      setLoginServerError('An unexpected error occurred.');
      setIsLoginSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setSignupServerError('');
    if (!validateSignupForm()) return;

    setIsSignupSubmitting(true);
    try {
      const email = signupEmail.trim();
      const fullName = signupName.trim();

      const { data, error } = await supabase.auth.signUp({
        email,
        password: signupPassword,
        options: {
          data: { full_name: fullName }
        }
      });

      if (error) {
        setSignupServerError('An account with this email already exists');
        setIsSignupSubmitting(false);
        return;
      }

      // Trigger Brevo Welcome Email
      try {
        fetch('http://localhost:4000/api/auth/send-welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name: fullName })
        }).catch(() => {});
      } catch (e) {}

      setSubmittedStatus('signup');

      setTimeout(() => {
        loginUser({
          id: data?.user?.id || 'new-user',
          name: fullName,
          email: email
        });
        setSubmittedStatus('');
        setIsSignupSubmitting(false);
      }, 1200);

    } catch (err) {
      setSignupServerError('An unexpected error occurred.');
      setIsSignupSubmitting(false);
    }
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
            LOGIN OR SIGN UP TO THE ATELIER
          </h2>
          <div className="w-16 h-[1px] bg-neutral-900/30 mx-auto mb-5" />
          <p className="text-xs sm:text-sm md:text-base font-serif text-neutral-700 leading-relaxed font-light">
            Unlock bespoke concierge styling, express checkout, order tracking, and private invitations to limited-run Autumn / Winter collections.
          </p>
        </div>

        {user ? (
          /* LOGGED IN USER STATE */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto bg-white p-8 sm:p-12 border border-neutral-200 shadow-sm text-center space-y-6"
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
                <span className="text-[9px] uppercase tracking-widest text-neutral-400 block">ORDERS</span>
                <span className="text-sm font-semibold tracking-wider text-black block mt-0.5">1 ACTIVE SHIPMENT</span>
              </div>
              <div className="p-4 bg-neutral-50 border border-neutral-200/60">
                <span className="text-[9px] uppercase tracking-widest text-neutral-400 block">WISHLIST</span>
                <span className="text-sm font-semibold tracking-wider text-black block mt-0.5">2 SAVED PIECES</span>
              </div>
              <div className="p-4 bg-neutral-50 border border-neutral-200/60">
                <span className="text-[9px] uppercase tracking-widest text-neutral-400 block">VIP TIER</span>
                <span className="text-sm font-semibold tracking-wider text-black block mt-0.5">PRIVILÈGE VIP</span>
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
          /* TWO-COLUMN EDITORIAL AUTH CARD GRID */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            {/* Column 1: MEMBER LOGIN CARD */}
            <motion.div
              initial={{ opacity: 0, x: -25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-6 bg-white p-8 sm:p-10 md:p-12 border border-neutral-200/90 shadow-xs"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-[10px] tracking-[0.25em] uppercase text-neutral-500 block mb-1">
                    EXISTING CLIENT
                  </span>
                  <h3 className="text-xl sm:text-2xl font-serif font-normal tracking-[0.15em] uppercase text-[#111111]">
                    ATELIER LOGIN
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#FAF8F3] flex items-center justify-center text-neutral-800">
                  <User className="w-5 h-5 stroke-[1.5]" />
                </div>
              </div>

              {loginServerError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xs text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span className="font-medium">{loginServerError}</span>
                </div>
              )}

              {submittedStatus === 'login' ? (
                <div className="py-12 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-800 mx-auto stroke-[1.5]" />
                  <p className="text-sm font-serif tracking-widest uppercase text-neutral-900">
                    AUTHENTICATING ACCOUNT...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleLoginSubmit} className="space-y-5" noValidate>
                  <div className="space-y-1">
                    <label className="text-[11px] sm:text-xs tracking-[0.2em] uppercase text-neutral-900 font-semibold block">
                      EMAIL ADDRESS *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => {
                          setLoginEmail(e.target.value);
                          if (loginErrors.email) setLoginErrors(prev => ({ ...prev, email: '' }));
                          if (loginServerError) setLoginServerError('');
                        }}
                        placeholder="eleanor@example.com"
                        className={`w-full bg-white border ${loginErrors.email ? 'border-red-500' : 'border-neutral-300'} pl-10 pr-4 py-3 text-xs text-neutral-900 placeholder:text-neutral-400 font-medium focus:outline-none focus:border-black transition-colors`}
                      />
                      <Mail className="w-4 h-4 text-neutral-700 absolute left-3 top-3.5 stroke-[1.75]" />
                    </div>
                    {loginErrors.email && (
                      <p className="text-[11px] text-red-600 mt-1">{loginErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] sm:text-xs tracking-[0.2em] uppercase text-neutral-900 font-semibold">
                        PASSWORD *
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => {
                          setLoginPassword(e.target.value);
                          if (loginErrors.password) setLoginErrors(prev => ({ ...prev, password: '' }));
                          if (loginServerError) setLoginServerError('');
                        }}
                        placeholder="••••••••••••"
                        className={`w-full bg-white border ${loginErrors.password ? 'border-red-500' : 'border-neutral-300'} pl-10 pr-10 py-3 text-xs text-neutral-900 placeholder:text-neutral-400 font-medium focus:outline-none focus:border-black transition-colors`}
                      />
                      <Lock className="w-4 h-4 text-neutral-700 absolute left-3 top-3.5 stroke-[1.75]" />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-3.5 text-neutral-700 hover:text-black transition-colors cursor-pointer"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4 stroke-[1.75]" /> : <Eye className="w-4 h-4 stroke-[1.75]" />}
                      </button>
                    </div>
                    {loginErrors.password && (
                      <p className="text-[11px] text-red-600 mt-1">{loginErrors.password}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoginSubmitting}
                    className="w-full bg-[#111111] text-white text-xs font-semibold tracking-[0.25em] uppercase py-4 hover:bg-neutral-800 transition-colors flex items-center justify-center gap-3 cursor-pointer mt-6 disabled:opacity-50"
                  >
                    {isLoginSubmitting ? (
                      <span className="animate-pulse flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" /> AUTHENTICATING...
                      </span>
                    ) : (
                      <>
                        LOG IN TO ACCOUNT <ArrowRight className="w-4 h-4 stroke-[1.5]" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>

            {/* Column 2: NEW CLIENT REGISTER CARD */}
            <motion.div
              initial={{ opacity: 0, x: 25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="lg:col-span-6 bg-white p-8 sm:p-10 md:p-12 border border-neutral-200/90 shadow-xs"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-[10px] tracking-[0.25em] uppercase text-neutral-500 block mb-1">
                    NEW CLIENT INVITATION
                  </span>
                  <h3 className="text-xl sm:text-2xl font-serif font-normal tracking-[0.15em] uppercase text-[#111111]">
                    SIGN UP
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#FAF8F3] flex items-center justify-center text-neutral-800">
                  <Sparkles className="w-5 h-5 stroke-[1.5]" />
                </div>
              </div>

              {signupServerError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xs text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span className="font-medium">{signupServerError}</span>
                </div>
              )}

              {submittedStatus === 'signup' ? (
                <div className="py-12 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-800 mx-auto stroke-[1.5]" />
                  <p className="text-sm font-serif tracking-widest uppercase text-neutral-900">
                    CREATING ATELIER MEMBERSHIP...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSignupSubmit} className="space-y-4" noValidate>
                  <div className="space-y-1">
                    <label className="text-[11px] sm:text-xs tracking-[0.2em] uppercase text-neutral-900 font-semibold block">
                      FULL NAME *
                    </label>
                    <input
                      type="text"
                      value={signupName}
                      onChange={(e) => {
                        setSignupName(e.target.value);
                        if (signupErrors.name) setSignupErrors(prev => ({ ...prev, name: '' }));
                        if (signupServerError) setSignupServerError('');
                      }}
                      placeholder="e.g. Eleanor Vance"
                      className={`w-full bg-white border ${signupErrors.name ? 'border-red-500' : 'border-neutral-300'} px-4 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 font-medium focus:outline-none focus:border-black transition-colors`}
                    />
                    {signupErrors.name && (
                      <p className="text-[11px] text-red-600 mt-1">{signupErrors.name}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] sm:text-xs tracking-[0.2em] uppercase text-neutral-900 font-semibold block">
                      EMAIL ADDRESS *
                    </label>
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => {
                        setSignupEmail(e.target.value);
                        if (signupErrors.email) setSignupErrors(prev => ({ ...prev, email: '' }));
                        if (signupServerError) setSignupServerError('');
                      }}
                      placeholder="eleanor@example.com"
                      className={`w-full bg-white border ${signupErrors.email ? 'border-red-500' : 'border-neutral-300'} px-4 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 font-medium focus:outline-none focus:border-black transition-colors`}
                    />
                    {signupErrors.email && (
                      <p className="text-[11px] text-red-600 mt-1">{signupErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] sm:text-xs tracking-[0.2em] uppercase text-neutral-900 font-semibold block">
                      CREATE PASSWORD *
                    </label>
                    <div className="relative">
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        value={signupPassword}
                        onChange={(e) => {
                          setSignupPassword(e.target.value);
                          if (signupErrors.password) setSignupErrors(prev => ({ ...prev, password: '' }));
                          if (signupServerError) setSignupServerError('');
                        }}
                        placeholder="••••••••••••"
                        className={`w-full bg-white border ${signupErrors.password ? 'border-red-500' : 'border-neutral-300'} px-4 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 font-medium focus:outline-none focus:border-black transition-colors`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-3 top-3 text-neutral-700 hover:text-black transition-colors cursor-pointer"
                      >
                        {showSignupPassword ? <EyeOff className="w-4 h-4 stroke-[1.75]" /> : <Eye className="w-4 h-4 stroke-[1.75]" />}
                      </button>
                    </div>
                    {signupErrors.password && (
                      <p className="text-[11px] text-red-600 mt-1">{signupErrors.password}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] sm:text-xs tracking-[0.2em] uppercase text-neutral-900 font-semibold block">
                      CONFIRM PASSWORD *
                    </label>
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      value={signupConfirmPassword}
                      onChange={(e) => {
                        setSignupConfirmPassword(e.target.value);
                        if (signupErrors.confirmPassword) setSignupErrors(prev => ({ ...prev, confirmPassword: '' }));
                        if (signupServerError) setSignupServerError('');
                      }}
                      placeholder="••••••••••••"
                      className={`w-full bg-white border ${signupErrors.confirmPassword ? 'border-red-500' : 'border-neutral-300'} px-4 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 font-medium focus:outline-none focus:border-black transition-colors`}
                    />
                    {signupErrors.confirmPassword && (
                      <p className="text-[11px] text-red-600 mt-1">{signupErrors.confirmPassword}</p>
                    )}
                  </div>

                  <div className="flex items-start gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="signupNewsletterHome"
                      checked={signupNewsletter}
                      onChange={(e) => setSignupNewsletter(e.target.checked)}
                      className="mt-0.5 border-neutral-300 accent-black cursor-pointer"
                    />
                    <label htmlFor="signupNewsletterHome" className="text-[10px] text-neutral-600 leading-normal font-light">
                      Receive private invitations, personal styling advice, and first access to seasonal trunk shows.
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSignupSubmitting}
                    className="w-full bg-[#111111] text-white text-xs font-semibold tracking-[0.25em] uppercase py-3.5 hover:bg-neutral-800 transition-colors flex items-center justify-center gap-3 cursor-pointer mt-2 disabled:opacity-50"
                  >
                    {isSignupSubmitting ? (
                      <span className="animate-pulse flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" /> CREATING ACCOUNT...
                      </span>
                    ) : (
                      <>
                        SIGN UP TO ATELIER <ArrowRight className="w-4 h-4 stroke-[1.5]" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
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
