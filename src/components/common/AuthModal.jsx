import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Shield, AlertCircle, RefreshCw, ArrowRight, CheckCircle2, User as UserIcon, Phone, Edit3 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { Logo } from '../common/Logo';
import apiClient from '../../lib/apiClient';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/; // 10-digit Indian mobile number format

export const AuthModal = () => {
  const navigate = useNavigate();
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    user,
    loginUser,
    logoutUser,
  } = useCart();

  // State Machine: 'email' | 'otp' | 'details'
  const [step, setStep] = useState('email');

  // Form inputs state
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // UI status state
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // OTP Resend Countdown state (60s)
  const [resendCountdown, setResendCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Refs for OTP input auto-focus
  const otpInputRefs = useRef([]);

  // Auto-close modal if user is already authenticated
  useEffect(() => {
    if (isAuthModalOpen && user) {
      setIsAuthModalOpen(false);
    }
  }, [isAuthModalOpen, user, setIsAuthModalOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isAuthModalOpen) {
      setStep('email');
      setServerError('');
      setFieldErrors({});
      setSuccessMessage('');
      setOtpDigits(['', '', '', '', '', '']);
      setResendCountdown(60);
      setCanResend(false);
    }
  }, [isAuthModalOpen]);

  // Resend Countdown Timer effect
  useEffect(() => {
    let interval = null;
    if (step === 'otp' && resendCountdown > 0) {
      setCanResend(false);
      interval = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (resendCountdown === 0) {
      setCanResend(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendCountdown]);

  // Focus first OTP box when entering OTP step
  useEffect(() => {
    if (step === 'otp' && otpInputRefs.current[0]) {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  // --- STEP 1: SEND OTP ---
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setServerError('');
    setFieldErrors({});

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setFieldErrors({ email: 'Please enter a valid email address' });
      return;
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setFieldErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient('/api/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail }),
      });

      if (res.success) {
        setStep('otp');
        setOtpDigits(['', '', '', '', '', '']);
        setResendCountdown(60);
        setCanResend(false);
      } else {
        setServerError(res.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      console.error('[Send OTP Error]', err);
      setServerError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- STEP 2: VERIFY OTP ---
  const handleOtpChange = (index, value) => {
    if (serverError) setServerError('');
    const sanitized = value.replace(/\D/g, ''); // numbers only
    const newDigits = [...otpDigits];

    if (!sanitized) {
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    // Take single character
    newDigits[index] = sanitized.charAt(sanitized.length - 1);
    setOtpDigits(newDigits);

    // Auto-advance to next box if available
    if (index < 5 && sanitized) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').trim();
    if (pasted.length >= 6) {
      const digits = pasted.slice(0, 6).split('');
      setOtpDigits(digits);
      otpInputRefs.current[5]?.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setServerError('');
    setFieldErrors({});

    const otpString = otpDigits.join('');
    if (otpString.length !== 6) {
      setServerError('Please enter the complete 6-digit verification code');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), otp: otpString }),
      });

      if (res.requiresDetails) {
        // First-time user -> Go to Step 3 Details form
        setStep('details');
      } else if (res.user && res.token) {
        // Returning user -> Auto-login
        setSuccessMessage(`Welcome back, ${res.user.firstName || res.user.fullName || 'Member'}`);
        setTimeout(() => {
          loginUser(res.user, res.token);
          setIsSubmitting(false);
          setSuccessMessage('');
          setIsAuthModalOpen(false);
        }, 800);
      } else {
        setServerError('Verification failed. Please try again.');
      }
    } catch (err) {
      console.error('[Verify OTP Error]', err);
      setServerError(err.message || 'Invalid verification code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || isSubmitting) return;
    setServerError('');
    setIsSubmitting(true);

    try {
      const res = await apiClient('/api/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });

      if (res.success) {
        setResendCountdown(60);
        setCanResend(false);
        setOtpDigits(['', '', '', '', '', '']);
        setSuccessMessage('A new verification code has been dispatched to your email.');
        setTimeout(() => setSuccessMessage(''), 3500);
      } else {
        setServerError(res.message || 'Failed to resend code');
      }
    } catch (err) {
      setServerError(err.message || 'Failed to resend verification code');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- STEP 3: COMPLETE SIGNUP DETAILS ---
  const handleCompleteSignup = async (e) => {
    if (e) e.preventDefault();
    setServerError('');
    setFieldErrors({});

    const errors = {};
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      errors.phone = 'Please enter a valid 10-digit mobile number';
    } else if (!PHONE_REGEX.test(cleanPhone)) {
      errors.phone = 'Please enter a valid Indian mobile number starting with 6-9';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient('/api/auth/complete-signup', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          firstName: 'Customer',
          lastName: '',
          phone: cleanPhone,
        }),
      });

      if (res.user && res.token) {
        setSuccessMessage('Welcome to House of Urvaah!');
        setTimeout(() => {
          loginUser(res.user, res.token);
          setIsSubmitting(false);
          setSuccessMessage('');
          setIsAuthModalOpen(false);
        }, 1000);
      } else {
        setServerError('Signup failed. Please try again.');
      }
    } catch (err) {
      console.error('[Complete Signup Error]', err);
      setServerError(err.message || 'Failed to complete registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthModalOpen) return null;

  return (
    <AnimatePresence>
      <div
        data-auth-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-serif selection:bg-brand-dark selection:text-white select-none"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsAuthModalOpen(false)}
          className="fixed inset-0 bg-black/65 backdrop-blur-xs"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-md bg-white border border-neutral-200 shadow-2xl overflow-hidden my-auto transition-all duration-300"
        >
          {/* Header Bar */}
          <div className="p-5 md:p-6 border-b border-neutral-100 flex items-center justify-between bg-[#FAF8F3]">
            <Logo className="h-9 sm:h-10" />
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
              <div className="text-center space-y-6 py-4 font-serif">
                <div className="w-16 h-16 rounded-full bg-[#FAF8F3] border border-neutral-300 mx-auto flex items-center justify-center text-xl font-medium tracking-widest text-neutral-800">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
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
                    <span className="text-neutral-500">MEMBER STATUS:</span>
                    <span className="font-semibold text-black">AUTHENTICATED</span>
                  </div>
                </div>

                <button
                  onClick={logoutUser}
                  className="w-full bg-neutral-900 hover:bg-black text-white text-xs font-semibold tracking-[0.25em] uppercase py-3.5 transition-colors cursor-pointer"
                >
                  SIGN OUT
                </button>
              </div>
            ) : successMessage ? (
              /* SUCCESS FEEDBACK */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 text-center space-y-3 font-serif"
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-800 mx-auto stroke-[1.5]" />
                <p className="text-sm font-serif tracking-widest uppercase text-neutral-900">
                  {successMessage}
                </p>
              </motion.div>
            ) : (
              <>
                {/* Global Server Error Banner */}
                {serverError && (
                  <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                    <span className="font-medium leading-relaxed">{serverError}</span>
                  </div>
                )}

                {/* --- STEP 1: EMAIL ENTRY --- */}
                {step === 'email' && (
                  <div className="space-y-5 font-serif">
                    <div className="text-center mb-6">
                      <span className="text-[10px] tracking-[0.25em] uppercase text-neutral-400 block mb-1">
                        SIGN IN / SIGN UP
                      </span>
                      <h3 className="text-lg sm:text-xl font-serif tracking-[0.15em] uppercase text-neutral-900 font-normal">
                        ENTER YOUR EMAIL
                      </h3>
                      <p className="text-xs text-neutral-500 font-light mt-1.5 leading-relaxed">
                        We will send a 6-digit verification code to your email address. No password required.
                      </p>
                    </div>

                    <form onSubmit={handleSendOtp} className="space-y-4" noValidate>
                      <div className="space-y-1.5">
                        <label className="text-[11px] sm:text-xs tracking-[0.2em] uppercase text-neutral-900 font-semibold block">
                          EMAIL ADDRESS *
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            name="email"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              if (fieldErrors.email) setFieldErrors({});
                              if (serverError) setServerError('');
                            }}
                            placeholder="eleanor@example.com"
                            className={`w-full bg-white border ${
                              fieldErrors.email ? 'border-red-500' : 'border-neutral-300'
                            } pl-10 pr-4 py-3 text-xs text-neutral-900 placeholder:text-neutral-400 font-medium focus:outline-none focus:border-black transition-colors`}
                            autoFocus
                          />
                          <Mail className="w-4 h-4 text-neutral-700 absolute left-3 top-3.5 stroke-[1.75]" />
                        </div>
                        {fieldErrors.email && (
                          <p className="text-[11px] text-red-600 mt-1">{fieldErrors.email}</p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#111111] text-white text-xs font-semibold tracking-[0.25em] uppercase py-3.5 hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 cursor-pointer mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <span className="animate-pulse flex items-center gap-2">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> SENDING CODE...
                          </span>
                        ) : (
                          <>
                            CONTINUE <ArrowRight className="w-4 h-4 stroke-[1.5]" />
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}

                {/* --- STEP 2: OTP ENTRY --- */}
                {step === 'otp' && (
                  <div className="space-y-5 font-serif">
                    <div className="text-center mb-6">
                      <span className="text-[10px] tracking-[0.25em] uppercase text-neutral-400 block mb-1">
                        VERIFICATION CODE
                      </span>
                      <h3 className="text-lg sm:text-xl font-serif tracking-[0.15em] uppercase text-neutral-900 font-normal">
                        ENTER 6-DIGIT CODE
                      </h3>
                      <div className="flex items-center justify-center gap-2 text-xs text-neutral-600 mt-2">
                        <span>We sent a code to <strong className="text-neutral-900">{email}</strong></span>
                        <button
                          type="button"
                          onClick={() => {
                            setStep('email');
                            setServerError('');
                          }}
                          className="text-[11px] underline text-neutral-500 hover:text-black flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" /> Change
                        </button>
                      </div>
                    </div>

                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                      {/* 6 Individual Digit Boxes */}
                      <div className="flex justify-between items-center gap-2 sm:gap-3 my-4">
                        {otpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => (otpInputRefs.current[idx] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            onPaste={handleOtpPaste}
                            className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold bg-[#FAF8F3] border ${
                              digit ? 'border-black bg-white' : 'border-neutral-300'
                            } focus:border-black focus:bg-white focus:outline-none transition-all`}
                          />
                        ))}
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting || otpDigits.join('').length !== 6}
                        className="w-full bg-[#111111] text-white text-xs font-semibold tracking-[0.25em] uppercase py-3.5 hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <span className="animate-pulse flex items-center gap-2">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> VERIFYING...
                          </span>
                        ) : (
                          'VERIFY & CONTINUE'
                        )}
                      </button>

                      {/* Resend OTP Link with 60s Countdown */}
                      <div className="text-center pt-2">
                        {canResend ? (
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={isSubmitting}
                            className="text-xs tracking-wider uppercase font-semibold text-neutral-900 hover:underline cursor-pointer"
                          >
                            RESEND OTP CODE
                          </button>
                        ) : (
                          <p className="text-xs text-neutral-400 font-light tracking-wider uppercase">
                            Resend code in <span className="font-semibold text-neutral-700">{resendCountdown}s</span>
                          </p>
                        )}
                      </div>
                    </form>
                  </div>
                )}

                {/* --- STEP 3: FIRST-TIME USER DETAILS --- */}
                {step === 'details' && (
                  <div className="space-y-5 font-serif">
                    <div className="text-center mb-6">
                      <span className="text-[10px] tracking-[0.25em] uppercase text-neutral-400 block mb-1">
                        ACCOUNT DETAILS
                      </span>
                      <h3 className="text-lg sm:text-xl font-serif tracking-[0.15em] uppercase text-neutral-900 font-medium">
                        HEY, WE NEED A FEW DETAILS
                      </h3>
                      <p className="text-xs text-neutral-500 font-light mt-1.5 leading-relaxed">
                        Complete your profile to customize your Atelier experience.
                      </p>
                    </div>

                    <form onSubmit={handleCompleteSignup} className="space-y-4" noValidate>
                      {/* Phone Number Field */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] sm:text-xs tracking-[0.2em] uppercase text-neutral-900 font-semibold block">
                          PHONE NUMBER *
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-2.5 text-xs text-neutral-500 font-medium flex items-center gap-1 border-r border-neutral-300 pr-2">
                            <span>+91</span>
                          </div>
                          <input
                            type="tel"
                            value={phone}
                            maxLength={10}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setPhone(val);
                              if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: '' }));
                            }}
                            placeholder="9876543210"
                            className={`w-full bg-white border ${
                              fieldErrors.phone ? 'border-red-500' : 'border-neutral-300'
                            } pl-16 pr-4 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 font-medium focus:outline-none focus:border-black transition-colors`}
                            autoFocus
                          />
                        </div>
                        {fieldErrors.phone && (
                          <p className="text-[11px] text-red-600 mt-1">{fieldErrors.phone}</p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#111111] text-white text-xs font-semibold tracking-[0.25em] uppercase py-3.5 hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 cursor-pointer mt-6 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <span className="animate-pulse flex items-center gap-2">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> SUBMITTING...
                          </span>
                        ) : (
                          'SUBMIT'
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Security Notice */}
          <div className="bg-[#FAF8F3] px-6 py-3 border-t border-neutral-200/80 flex items-center justify-center gap-2 text-[10px] text-neutral-500 tracking-widest uppercase">
            <Shield className="w-3.5 h-3.5 text-neutral-400 stroke-[1.5]" />
            256-BIT ENCRYPTED ATELIER CONCIERGE
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AuthModal;
