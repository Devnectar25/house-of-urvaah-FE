import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Check,
  ShieldCheck,
  Truck,
  CreditCard,
  Plus,
  MapPin,
  Edit3,
  ArrowLeft,
  Tag,
  ShoppingBag,
  Smartphone,
  CheckCircle2,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import apiClient from '../lib/apiClient';
import { SEOHead } from '../components/common/SEOHead';

export const Checkout = () => {
  const navigate = useNavigate();
  const {
    cart,
    user,
    authLoading,
    openAuthModal,
    cartSubtotal,
    freeShippingProgress,
  } = useCart();

  // Protect route: Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      openAuthModal('login');
      navigate('/');
    }
  }, [user, authLoading, openAuthModal, navigate]);

  // Saved Addresses State
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [isAddressesLoading, setIsAddressesLoading] = useState(true);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  // New Shipping Address Form State
  const [newShippingForm, setNewShippingForm] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    type: 'Home',
  });

  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' | 'cod'

  // Billing Address State
  const [billingOption, setBillingOption] = useState('same'); // 'same' | 'different'
  const [billingForm, setBillingForm] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });

  // Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState({ type: '', text: '' });

  // Order Placement State
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState('');

  // Fetch saved addresses for user
  useEffect(() => {
    const loadAddresses = async () => {
      if (!user) return;
      setIsAddressesLoading(true);
      try {
        const res = await apiClient('/api/users/profile');
        if (res.success && res.addresses && res.addresses.length > 0) {
          const mapped = res.addresses.map((a) => ({
            id: a.id,
            name: user.name || a.name || 'Recipient',
            phone: user.phone || a.phone || '',
            street: a.full_address || a.street || '',
            city: a.city || '',
            state: a.state || '',
            pincode: a.postal_code || a.pincode || '',
            type: a.address_label || a.type || 'Home',
            isDefault: !!a.is_default,
          }));
          setAddresses(mapped);

          // Find default index
          const defaultIdx = mapped.findIndex((a) => a.isDefault);
          setSelectedAddressIndex(defaultIdx >= 0 ? defaultIdx : 0);
        } else if (user.addresses && user.addresses.length > 0) {
          setAddresses(user.addresses);
        } else {
          setAddresses([]);
          setShowNewAddressForm(true);
        }
      } catch (err) {
        if (user.addresses && user.addresses.length > 0) {
          setAddresses(user.addresses);
        } else {
          setAddresses([]);
          setShowNewAddressForm(true);
        }
      } finally {
        setIsAddressesLoading(false);
      }
    };

    if (user) {
      // Pre-fill shipping form with user defaults
      setNewShippingForm((prev) => ({
        ...prev,
        fullName: user.name || '',
        phone: user.phone || '',
      }));
      loadAddresses();
    }
  }, [user]);

  // Format currency
  const formatPrice = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Calculations
  const shippingFee = 0; // Free express shipping
  const discountAmount = appliedCoupon
    ? Math.round((cartSubtotal * appliedCoupon.discountPercent) / 100)
    : 0;
  const grandTotal = Math.max(0, cartSubtotal - discountAmount + shippingFee);

  // Apply Coupon Handler
  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'WELCOME10' || code === 'URVAAH10') {
      setAppliedCoupon({ code, discountPercent: 10, label: '10% Welcome Discount' });
      setCouponMessage({ type: 'success', text: 'Coupon WELCOME10 applied! (10% OFF)' });
    } else if (code === 'ATELIER20') {
      setAppliedCoupon({ code, discountPercent: 20, label: '20% VIP Atelier Discount' });
      setCouponMessage({ type: 'success', text: 'Coupon ATELIER20 applied! (20% OFF)' });
    } else {
      setCouponMessage({
        type: 'error',
        text: 'Invalid or expired coupon code. Try WELCOME10',
      });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponMessage({ type: '', text: '' });
  };

  // Place Order Handler
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setIsPlacingOrder(true);

    // Simulate order placement delay
    setTimeout(() => {
      const randomOrderNum = `HOU-${Math.floor(100000 + Math.random() * 900000)}`;
      setPlacedOrderNumber(randomOrderNum);
      setIsPlacingOrder(false);
      setOrderPlaced(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1200);
  };

  if (authLoading || (!user && !orderPlaced)) {
    return (
      <div className="min-h-screen bg-white text-brand-dark pt-32 pb-20 flex flex-col items-center justify-center font-serif">
        <div className="w-8 h-8 border-2 border-brand-dark border-t-transparent animate-spin mb-4" />
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
          Loading Checkout Session...
        </p>
      </div>
    );
  }

  // Order Success Screen View
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-white text-brand-dark pt-28 sm:pt-32 pb-20 font-serif selection:bg-brand-dark selection:text-white">
        <SEOHead title="Order Confirmed | House of Urvaah" noindex={true} />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-20 h-20 bg-brand-dark text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md"
          >
            <Check className="w-10 h-10 stroke-[2.5]" />
          </motion.div>

          <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-500 block mb-2 font-mono font-bold">
            ORDER CONFIRMED
          </span>
          <h1 className="text-2xl sm:text-4xl font-serif tracking-[0.12em] uppercase text-black font-semibold mb-3">
            THANK YOU FOR YOUR ORDER
          </h1>
          <p className="text-sm font-sans text-neutral-600 mb-6">
            Order Reference:{' '}
            <strong className="text-black font-mono font-bold">{placedOrderNumber}</strong>
          </p>

          <div className="bg-[#FAF8F3] border border-neutral-200/80 p-6 sm:p-8 text-left space-y-4 mb-8 text-xs font-sans">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
              <span className="text-neutral-500 uppercase tracking-wider font-semibold">
                Status
              </span>
              <span className="px-2.5 py-1 bg-emerald-900 text-white font-mono font-bold tracking-wider uppercase text-[10px]">
                CONFIRMED & PROCESSING
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
              <span className="text-neutral-500 uppercase tracking-wider font-semibold">
                Customer Email
              </span>
              <span className="text-neutral-900 font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
              <span className="text-neutral-500 uppercase tracking-wider font-semibold">
                Payment Method
              </span>
              <span className="text-neutral-900 font-medium">
                {paymentMethod === 'cod'
                  ? 'Cash on Delivery (COD)'
                  : 'Consolidated Payment (Cards/UPI/Wallets)'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-500 uppercase tracking-wider font-semibold">
                Total Paid
              </span>
              <span className="text-base font-bold text-neutral-900 font-serif">
                {formatPrice(grandTotal)}
              </span>
            </div>
          </div>

          <p className="text-xs text-neutral-500 tracking-wider uppercase mb-8 font-sans">
            A confirmation receipt has been sent to your email address. You can track your dispatch status anytime under your Atelier account orders.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/account"
              className="w-full sm:w-auto bg-brand-dark text-white text-xs font-sans font-bold tracking-[0.25em] uppercase px-8 py-4 hover:bg-neutral-800 transition-colors"
            >
              VIEW MY ORDERS
            </Link>
            <Link
              to="/"
              className="w-full sm:w-auto border border-neutral-300 text-brand-dark text-xs font-sans font-bold tracking-[0.25em] uppercase px-8 py-4 hover:border-black transition-colors"
            >
              CONTINUE SHOPPING
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Redirect or Empty Cart View
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white text-brand-dark pt-28 sm:pt-32 pb-20 font-serif selection:bg-brand-dark selection:text-white">
        <SEOHead title="Checkout | House of Urvaah" noindex={true} />
        <div className="max-w-md mx-auto px-4 text-center py-16">
          <ShoppingBag className="w-12 h-12 stroke-[1] text-neutral-400 mx-auto mb-4" />
          <h2 className="text-xl font-serif tracking-[0.15em] uppercase text-black mb-2">
            YOUR SHOPPING BAG IS EMPTY
          </h2>
          <p className="text-xs font-sans text-neutral-500 uppercase tracking-wider mb-6">
            Please add items to your cart before proceeding to checkout.
          </p>
          <Link
            to="/"
            className="inline-block bg-brand-dark text-white text-xs font-sans font-bold tracking-[0.25em] uppercase px-8 py-3.5 hover:bg-neutral-800 transition-colors"
          >
            EXPLORE COLLECTION
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-brand-dark pt-24 sm:pt-28 pb-20 font-serif selection:bg-brand-dark selection:text-white">
      <SEOHead
        title="Checkout | House of Urvaah"
        description="Complete your order securely with House of Urvaah."
        noindex={true}
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
        {/* Top Header / Breadcrumb */}
        <div className="mb-8 pb-4 border-b border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-black font-sans uppercase tracking-widest mb-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>RETURN TO SHOPPING</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-serif tracking-[0.12em] uppercase text-black font-normal">
              CHECKOUT
            </h1>
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-500 font-sans tracking-widest uppercase">
            <Lock className="w-4 h-4 text-emerald-800" />
            <span>256-BIT ENCRYPTED SSL CHECKOUT</span>
          </div>
        </div>

        {/* TWO-COLUMN CHECKOUT LAYOUT */}
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* LEFT COLUMN: Main Form Area (Contact, Shipping, Payment, Billing) */}
          <div className="lg:col-span-7 space-y-8 font-sans">
            
            {/* 1. CONTACT SECTION */}
            <section className="bg-neutral-50/70 p-6 sm:p-8 border border-neutral-200/80">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-200">
                <h2 className="text-base sm:text-lg font-serif tracking-[0.15em] uppercase text-black font-medium flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-dark text-white text-xs flex items-center justify-center font-sans font-bold">
                    1
                  </span>
                  CONTACT INFORMATION
                </h2>
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5">
                  AUTHENTICATED
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 tracking-wider uppercase mb-1.5">
                  EMAIL ADDRESS (LOGGED IN USER)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-3 text-sm bg-neutral-100 border border-neutral-200 text-neutral-600 font-medium cursor-not-allowed"
                  />
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                </div>
                <p className="text-[11px] text-neutral-400 mt-1.5 font-serif">
                  Order status updates and tax invoice receipts will be delivered to this email.
                </p>
              </div>
            </section>

            {/* 2. SHIPPING ADDRESS SECTION */}
            <section className="bg-neutral-50/70 p-6 sm:p-8 border border-neutral-200/80">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-200">
                <h2 className="text-base sm:text-lg font-serif tracking-[0.15em] uppercase text-black font-medium flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-dark text-white text-xs flex items-center justify-center font-sans font-bold">
                    2
                  </span>
                  DELIVERY ADDRESS
                </h2>
                {addresses.length > 0 && !showNewAddressForm && (
                  <button
                    type="button"
                    onClick={() => setShowNewAddressForm(true)}
                    className="text-xs font-bold tracking-wider uppercase text-brand-dark hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>ADD NEW ADDRESS</span>
                  </button>
                )}
              </div>

              {/* Case A: User Has Saved Addresses */}
              {addresses.length > 0 && !showNewAddressForm ? (
                <div className="space-y-4">
                  <p className="text-xs text-neutral-600 font-medium uppercase tracking-wider mb-2">
                    SELECT DELIVERY ADDRESS:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map((addr, idx) => {
                      const isSelected = selectedAddressIndex === idx;
                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedAddressIndex(idx)}
                          className={`p-4 bg-white border cursor-pointer transition-all relative ${
                            isSelected
                              ? 'border-brand-dark ring-2 ring-brand-dark/20 shadow-xs'
                              : 'border-neutral-200 hover:border-neutral-400'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2 py-0.5 bg-neutral-100 text-[10px] font-bold tracking-widest uppercase text-neutral-700">
                              {addr.type || 'HOME'}
                            </span>
                            {isSelected && (
                              <span className="flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-emerald-800">
                                <CheckCircle2 className="w-3.5 h-3.5" /> SELECTED
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-neutral-900 mb-1">{addr.name}</h4>
                          <p className="text-xs text-neutral-600 leading-relaxed">
                            {addr.street}
                            <br />
                            {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                          <p className="text-[11px] text-neutral-500 font-mono mt-2">
                            Ph: {addr.phone}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Case B: New Address Form (Inline) */
                <div className="space-y-4 text-xs">
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowNewAddressForm(false)}
                      className="text-xs font-bold tracking-wider uppercase text-neutral-500 hover:text-black mb-2 inline-block cursor-pointer"
                    >
                      ← USE A SAVED ADDRESS INSTEAD
                    </button>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold tracking-wider text-neutral-700 uppercase mb-1">
                        RECIPIENT FULL NAME *
                      </label>
                      <input
                        type="text"
                        required
                        value={newShippingForm.fullName}
                        onChange={(e) =>
                          setNewShippingForm({ ...newShippingForm, fullName: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 focus:border-brand-dark focus:ring-1 focus:ring-brand-dark outline-none text-sm"
                        placeholder="e.g. Ananya Sharma"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold tracking-wider text-neutral-700 uppercase mb-1">
                        PHONE NUMBER *
                      </label>
                      <input
                        type="tel"
                        required
                        value={newShippingForm.phone}
                        onChange={(e) =>
                          setNewShippingForm({ ...newShippingForm, phone: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 focus:border-brand-dark focus:ring-1 focus:ring-brand-dark outline-none text-sm"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold tracking-wider text-neutral-700 uppercase mb-1">
                      STREET ADDRESS / FLAT / BUILDING *
                    </label>
                    <input
                      type="text"
                      required
                      value={newShippingForm.street}
                      onChange={(e) =>
                        setNewShippingForm({ ...newShippingForm, street: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 focus:border-brand-dark focus:ring-1 focus:ring-brand-dark outline-none text-sm"
                      placeholder="House/Flat No., Street Name, Area"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold tracking-wider text-neutral-700 uppercase mb-1">
                        CITY *
                      </label>
                      <input
                        type="text"
                        required
                        value={newShippingForm.city}
                        onChange={(e) =>
                          setNewShippingForm({ ...newShippingForm, city: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 focus:border-brand-dark focus:ring-1 focus:ring-brand-dark outline-none text-sm"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold tracking-wider text-neutral-700 uppercase mb-1">
                        STATE *
                      </label>
                      <input
                        type="text"
                        required
                        value={newShippingForm.state}
                        onChange={(e) =>
                          setNewShippingForm({ ...newShippingForm, state: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 focus:border-brand-dark focus:ring-1 focus:ring-brand-dark outline-none text-sm"
                        placeholder="State"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold tracking-wider text-neutral-700 uppercase mb-1">
                        PINCODE *
                      </label>
                      <input
                        type="text"
                        required
                        value={newShippingForm.pincode}
                        onChange={(e) =>
                          setNewShippingForm({ ...newShippingForm, pincode: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 focus:border-brand-dark focus:ring-1 focus:ring-brand-dark outline-none text-sm"
                        placeholder="6-digit PIN"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Shipping Method Row */}
              <div className="mt-6 pt-4 border-t border-neutral-200 flex items-center justify-between text-xs bg-white p-3.5 border border-neutral-200">
                <div className="flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-emerald-800" />
                  <div>
                    <span className="font-bold text-neutral-900 uppercase tracking-wider block">
                      EXPRESS COURIER DELIVERY
                    </span>
                    <span className="text-[11px] text-neutral-500 font-serif">
                      Estimated Delivery: 2–4 Business Days
                    </span>
                  </div>
                </div>
                <span className="font-mono font-bold text-emerald-800 uppercase tracking-widest text-xs">
                  FREE
                </span>
              </div>
            </section>

            {/* 3. PAYMENT SECTION */}
            <section className="bg-neutral-50/70 p-6 sm:p-8 border border-neutral-200/80">
              <div className="mb-4 pb-3 border-b border-neutral-200">
                <h2 className="text-base sm:text-lg font-serif tracking-[0.15em] uppercase text-black font-medium flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-dark text-white text-xs flex items-center justify-center font-sans font-bold">
                    3
                  </span>
                  PAYMENT METHOD
                </h2>
                <p className="text-xs text-neutral-500 font-sans mt-0.5">
                  All transactions are secure and encrypted.
                </p>
              </div>

              <div className="space-y-3 font-sans text-xs">
                {/* Radio Option 1: Consolidated Payment Gateway (UPI, Cards, Wallets, Netbanking) */}
                <label
                  onClick={() => setPaymentMethod('online')}
                  className={`block p-4 bg-white border cursor-pointer transition-all ${
                    paymentMethod === 'online'
                      ? 'border-brand-dark ring-2 ring-brand-dark/20 shadow-xs'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'online'}
                        onChange={() => setPaymentMethod('online')}
                        className="mt-0.5 accent-black"
                      />
                      <div>
                        <span className="font-bold text-neutral-900 text-sm tracking-wide block uppercase">
                          UPI, CARDS, WALLETS, NETBANKING & MORE
                        </span>
                        <p className="text-neutral-500 text-[11px] mt-0.5">
                          Pay securely using GPay, PhonePe, Paytm, Credit/Debit Cards, or Netbanking.
                        </p>
                        <div className="flex items-center gap-2 mt-2.5">
                          <span className="px-1.5 py-0.5 border border-neutral-300 text-[9px] font-mono font-bold text-neutral-700 bg-neutral-50">
                            UPI
                          </span>
                          <span className="px-1.5 py-0.5 border border-neutral-300 text-[9px] font-mono font-bold text-neutral-700 bg-neutral-50">
                            VISA
                          </span>
                          <span className="px-1.5 py-0.5 border border-neutral-300 text-[9px] font-mono font-bold text-neutral-700 bg-neutral-50">
                            MASTERCARD
                          </span>
                          <span className="px-1.5 py-0.5 border border-neutral-300 text-[9px] font-mono font-bold text-neutral-700 bg-neutral-50">
                            RUPAY
                          </span>
                        </div>
                      </div>
                    </div>

                    <CreditCard className="w-5 h-5 text-neutral-700 flex-shrink-0" />
                  </div>
                </label>

                {/* Radio Option 2: Cash on Delivery */}
                <label
                  onClick={() => setPaymentMethod('cod')}
                  className={`block p-4 bg-white border cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-brand-dark ring-2 ring-brand-dark/20 shadow-xs'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="mt-0.5 accent-black"
                      />
                      <div>
                        <span className="font-bold text-neutral-900 text-sm tracking-wide block uppercase">
                          CASH ON DELIVERY (COD)
                        </span>
                        <p className="text-neutral-500 text-[11px] mt-0.5">
                          Pay with cash or UPI upon delivery.
                        </p>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </section>

            {/* 4. BILLING ADDRESS SECTION */}
            <section className="bg-neutral-50/70 p-6 sm:p-8 border border-neutral-200/80">
              <div className="mb-4 pb-3 border-b border-neutral-200">
                <h2 className="text-base sm:text-lg font-serif tracking-[0.15em] uppercase text-black font-medium flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-dark text-white text-xs flex items-center justify-center font-sans font-bold">
                    4
                  </span>
                  BILLING ADDRESS
                </h2>
              </div>

              <div className="space-y-3 font-sans text-xs">
                <label
                  onClick={() => setBillingOption('same')}
                  className={`block p-3.5 bg-white border cursor-pointer transition-all ${
                    billingOption === 'same'
                      ? 'border-brand-dark ring-2 ring-brand-dark/20'
                      : 'border-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="billingOption"
                      checked={billingOption === 'same'}
                      onChange={() => setBillingOption('same')}
                      className="accent-black"
                    />
                    <span className="font-semibold text-neutral-900 uppercase">
                      SAME AS SHIPPING ADDRESS
                    </span>
                  </div>
                </label>

                <label
                  onClick={() => setBillingOption('different')}
                  className={`block p-3.5 bg-white border cursor-pointer transition-all ${
                    billingOption === 'different'
                      ? 'border-brand-dark ring-2 ring-brand-dark/20'
                      : 'border-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="billingOption"
                      checked={billingOption === 'different'}
                      onChange={() => setBillingOption('different')}
                      className="accent-black"
                    />
                    <span className="font-semibold text-neutral-900 uppercase">
                      USE A DIFFERENT BILLING ADDRESS
                    </span>
                  </div>
                </label>

                {billingOption === 'different' && (
                  <div className="pt-3 space-y-3 bg-white p-4 border border-neutral-200 mt-2">
                    <input
                      type="text"
                      placeholder="Billing Full Name"
                      value={billingForm.fullName}
                      onChange={(e) => setBillingForm({ ...billingForm, fullName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Billing Address / Flat / Building"
                      value={billingForm.street}
                      onChange={(e) => setBillingForm({ ...billingForm, street: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 text-xs"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="City"
                        value={billingForm.city}
                        onChange={(e) => setBillingForm({ ...billingForm, city: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Pincode"
                        value={billingForm.pincode}
                        onChange={(e) => setBillingForm({ ...billingForm, pincode: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 5. PRIMARY CTA BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isPlacingOrder}
                className="w-full py-4 bg-[#111111] hover:bg-neutral-800 text-white text-xs font-sans font-bold tracking-[0.25em] uppercase transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {isPlacingOrder ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin" />
                    <span>PROCESSING ORDER...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 stroke-[2]" />
                    <span>
                      {paymentMethod === 'cod'
                        ? `PLACE ORDER (${formatPrice(grandTotal)})`
                        : `PAY ${formatPrice(grandTotal)}`}
                    </span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-center text-neutral-400 mt-2 font-serif">
                By clicking place order, you agree to House of Urvaah's Terms of Purchase & Privacy Policy.
              </p>
            </div>

            {/* FOOTER POLICY LINKS */}
            <div className="pt-6 border-t border-neutral-200 flex flex-wrap items-center justify-center gap-6 text-[11px] text-neutral-500 tracking-wider uppercase font-sans">
              <Link to="/return-refund-policy" className="hover:text-black transition-colors">
                RETURN POLICY
              </Link>
              <span>•</span>
              <Link to="/privacy-policy" className="hover:text-black transition-colors">
                PRIVACY POLICY
              </Link>
              <span>•</span>
              <Link to="/terms-and-conditions" className="hover:text-black transition-colors">
                TERMS OF SERVICE
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary (Sticky on scroll) */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28 bg-[#FAF8F3] border border-neutral-200/80 p-6 sm:p-8 space-y-6 font-sans">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
                <h3 className="font-serif text-base sm:text-lg tracking-[0.15em] uppercase text-black font-semibold">
                  ORDER SUMMARY ({cart.reduce((a, b) => a + b.quantity, 0)})
                </h3>
                <Link
                  to="/"
                  className="text-[11px] text-neutral-500 hover:text-black font-semibold tracking-wider uppercase"
                >
                  EDIT CART
                </Link>
              </div>

              {/* CART ITEMS LIST */}
              <div className="divide-y divide-neutral-200/80 max-h-[360px] overflow-y-auto pr-1">
                {cart.map((item, idx) => (
                  <div key={`${item.product.id}-${item.selectedSize}-${idx}`} className="py-3.5 first:pt-0 last:pb-0 flex gap-3.5 items-center">
                    <div className="relative flex-shrink-0">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-16 h-20 object-cover object-top border border-neutral-200 bg-white"
                      />
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-black text-white text-[10px] font-mono font-bold rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-900 truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-[11px] text-neutral-500 tracking-wider mt-0.5">
                        SIZE: <span className="font-bold text-neutral-800">{item.selectedSize}</span>
                      </p>
                      <p className="text-xs font-bold text-neutral-900 mt-1">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* DISCOUNT CODE INPUT FIELD */}
              <div className="pt-4 border-t border-neutral-200">
                <label className="block text-[11px] font-bold text-neutral-600 tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-brand-dark" />
                  DISCOUNT VOUCHER / PROMO CODE
                </label>

                {!appliedCoupon ? (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="e.g. WELCOME10"
                      className="flex-1 px-3 py-2 text-xs bg-white border border-neutral-300 focus:border-brand-dark outline-none font-mono uppercase"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-brand-dark hover:bg-neutral-800 text-white text-xs font-bold tracking-widest uppercase transition-colors cursor-pointer"
                    >
                      APPLY
                    </button>
                  </form>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-emerald-900 uppercase tracking-widest block">
                        {appliedCoupon.code}
                      </span>
                      <span className="text-[10px] text-emerald-700">{appliedCoupon.label}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-[10px] text-red-700 font-bold uppercase tracking-wider hover:underline"
                    >
                      REMOVE
                    </button>
                  </div>
                )}

                {couponMessage.text && !appliedCoupon && (
                  <p
                    className={`text-[11px] mt-1.5 font-medium ${
                      couponMessage.type === 'success' ? 'text-emerald-800' : 'text-red-700'
                    }`}
                  >
                    {couponMessage.text}
                  </p>
                )}
              </div>

              {/* CALCULATED TOTALS */}
              <div className="pt-4 border-t border-neutral-200 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-neutral-600">
                  <span className="uppercase tracking-wider">Subtotal</span>
                  <span className="font-bold text-neutral-900 font-mono">
                    {formatPrice(cartSubtotal)}
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between items-center text-emerald-800 font-semibold">
                    <span className="uppercase tracking-wider">
                      Discount ({appliedCoupon.code})
                    </span>
                    <span className="font-mono">-{formatPrice(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-neutral-600">
                  <span className="uppercase tracking-wider">Shipping</span>
                  <span className="font-mono font-bold text-emerald-800 uppercase tracking-widest">
                    FREE
                  </span>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-neutral-300 text-sm sm:text-base font-bold text-neutral-900">
                  <span className="font-serif tracking-widest uppercase">TOTAL</span>
                  <span className="font-serif tracking-wider">{formatPrice(grandTotal)}</span>
                </div>
                <p className="text-[10px] text-neutral-400 text-right uppercase tracking-wider">
                  Includes all applicable GST & Luxury taxes
                </p>
              </div>

              {/* PERKS BADGES */}
              <div className="pt-4 border-t border-neutral-200 grid grid-cols-2 gap-3 text-[11px] text-neutral-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-800 flex-shrink-0" />
                  <span>100% Authentic Quality Guaranteed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-800 flex-shrink-0" />
                  <span>Free Express Courier Delivery</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
