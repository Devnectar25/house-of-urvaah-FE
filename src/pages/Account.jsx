import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, MapPin, Plus, Trash2, Edit3, Check, X, Shield, Lock, Ticket, Package, FileText, Heart, LogOut } from 'lucide-react';
import { useCart } from '../context/CartContext';
import apiClient from '../lib/apiClient';
import { SEOHead } from '../components/common/SEOHead';

export const Account = () => {
  const navigate = useNavigate();
  const { user, authLoading, logoutUser, updateUserProfile, openAuthModal, wishlist } = useCart();

  const [activeTab, setActiveTab] = useState('ACCOUNT DETAILS');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [fullNameInput, setFullNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  // Sign out confirmation modal state
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Address modal & state
  const [addresses, setAddresses] = useState([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState(null);
  const [editingAddressId, setEditingAddressId] = useState(null);

  // Keyboard Escape listener for Sign Out modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showSignOutModal) {
        setShowSignOutModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSignOutModal]);

  const handleConfirmSignOut = async () => {
    setIsSigningOut(true);
    await logoutUser();
    setShowSignOutModal(false);
    setIsSigningOut(false);
    navigate('/');
  };
  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    type: 'Home',
    isDefault: false
  });
  const [addressSaving, setAddressSaving] = useState(false);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Fetch real profile details and addresses on mount / user change
  const loadProfileAndAddresses = async () => {
    if (!user) return;
    try {
      const res = await apiClient('/api/users/profile');
      if (res.success) {
        if (res.addresses) {
          const mapped = res.addresses.map(a => ({
            id: a.id,
            name: user.name || 'Recipient',
            phone: user.phone || '',
            street: a.full_address || a.street || '',
            city: a.city || '',
            state: a.state || '',
            pincode: a.postal_code || a.pincode || '',
            type: a.address_label || a.type || 'Home',
            isDefault: !!a.is_default
          }));
          setAddresses(mapped);
        }
      }
    } catch (e) {
      if (user.addresses) setAddresses(user.addresses);
    }
  };

  useEffect(() => {
    if (user) {
      setFullNameInput(user.name || '');
      setPhoneInput(user.phone || '');
      loadProfileAndAddresses();
    }
  }, [user]);

  // Fetch orders when tab switches to VIEW ORDERS
  useEffect(() => {
    if (activeTab === 'VIEW ORDERS' && user) {
      setOrdersLoading(true);
      apiClient('/api/orders/my-orders')
        .then(res => {
          if (res.success && res.data) {
            setOrders(res.data);
          }
        })
        .catch(err => {
          console.warn('Could not fetch orders:', err.message);
        })
        .finally(() => setOrdersLoading(false));
    }
  }, [activeTab, user]);

  // Protect route
  useEffect(() => {
    if (!authLoading && !user) {
      openAuthModal('login');
    }
  }, [user, authLoading, openAuthModal]);

  const firstName = user?.firstName || user?.name?.split(' ')[0] || 'ATELIER MEMBER';

  const tabs = [
    'VIEW ORDERS',
    'INVOICES',
    'VIEW WISHLIST',
    'ACCOUNT DETAILS',
    'MY COUPONS',
    'SIGN OUT'
  ];

  const handleTabClick = (tab) => {
    if (tab === 'SIGN OUT') {
      setShowSignOutModal(true);
      return;
    }
    setActiveTab(tab);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage('');

    const res = await updateUserProfile({
      fullName: fullNameInput.trim(),
      phone: phoneInput.trim()
    });

    setProfileSaving(false);
    if (res.success) {
      setIsEditingProfile(false);
      setProfileMessage('Account details successfully updated.');
      setTimeout(() => setProfileMessage(''), 3000);
    } else {
      setProfileMessage('Failed to update details. Please try again.');
    }
  };

  const openAddAddressModal = () => {
    setEditingAddressIndex(null);
    setEditingAddressId(null);
    setAddressForm({
      name: user?.name || '',
      phone: user?.phone || '',
      street: '',
      city: '',
      state: '',
      pincode: '',
      type: 'Home',
      isDefault: addresses.length === 0
    });
    setIsAddressModalOpen(true);
  };

  const openEditAddressModal = (idx) => {
    setEditingAddressIndex(idx);
    const item = addresses[idx];
    setEditingAddressId(item.id || null);
    setAddressForm({ ...item });
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setAddressSaving(true);

    try {
      const payload = {
        user_id: user.id || user.username,
        address_label: addressForm.type,
        full_address: addressForm.street,
        city: addressForm.city,
        state: addressForm.state,
        postal_code: addressForm.pincode,
        is_default: addressForm.isDefault
      };

      if (editingAddressId) {
        await apiClient(`/api/addresses/${editingAddressId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiClient('/api/addresses', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      await loadProfileAndAddresses();
      setIsAddressModalOpen(false);
    } catch (err) {
      console.error('Failed to save address via backend API, falling back:', err);
      // Fallback update profile
      let updatedList = [...addresses];
      if (addressForm.isDefault) {
        updatedList = updatedList.map((addr) => ({ ...addr, isDefault: false }));
      }
      if (editingAddressIndex !== null) {
        updatedList[editingAddressIndex] = addressForm;
      } else {
        updatedList.push(addressForm);
      }
      const res = await updateUserProfile({ addresses: updatedList });
      if (res.success) {
        setAddresses(updatedList);
        setIsAddressModalOpen(false);
      }
    } finally {
      setAddressSaving(false);
    }
  };

  const handleDeleteAddress = async (idx) => {
    const item = addresses[idx];
    if (item?.id) {
      try {
        await apiClient(`/api/addresses/${item.id}`, { method: 'DELETE' });
        await loadProfileAndAddresses();
        return;
      } catch (err) {
        console.error('Failed to delete address via backend API:', err);
      }
    }
    const updatedList = addresses.filter((_, i) => i !== idx);
    const res = await updateUserProfile({ addresses: updatedList });
    if (res.success) {
      setAddresses(updatedList);
    }
  };

  const handleSetDefaultAddress = async (idx) => {
    const item = addresses[idx];
    if (item?.id) {
      try {
        await apiClient(`/api/addresses/${item.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            user_id: user.id || user.username,
            address_label: item.type,
            full_address: item.street,
            city: item.city,
            state: item.state,
            postal_code: item.pincode,
            is_default: true
          })
        });
        await loadProfileAndAddresses();
        return;
      } catch (err) {}
    }
    const updatedList = addresses.map((addr, i) => ({
      ...addr,
      isDefault: i === idx
    }));
    const res = await updateUserProfile({ addresses: updatedList });
    if (res.success) {
      setAddresses(updatedList);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center pt-28 pb-16 bg-white">
        <div className="text-center font-serif">
          <div className="w-8 h-8 border-2 border-brand-dark border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs uppercase tracking-widest text-neutral-400">Loading your Atelier profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 pt-32 text-center font-serif bg-white">
        <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 block mb-2">
          HOUSE OF URVAAH
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif tracking-[0.15em] uppercase mb-4 text-brand-dark">
          PLEASE LOG IN TO ACCESS YOUR ACCOUNT
        </h1>
        <p className="text-xs text-neutral-500 tracking-wider uppercase mb-8 max-w-md">
          Sign in to view your orders, addresses, and saved preferences.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="bg-brand-dark text-white text-xs font-semibold tracking-widest px-8 py-3.5 uppercase hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          LOG IN / SIGN UP
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-brand-dark pt-24 sm:pt-28 pb-20 font-serif selection:bg-brand-dark selection:text-white">
      <SEOHead
        title="My Account | House of Urvaah"
        description="Manage your House of Urvaah account, track order status, update shipping details, and view saved items."
        keywords="House of Urvaah account, user profile, orders, addresses"
        noindex={true}
      />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
        {/* Profile Header Card with Cream/Off-White Palette (#FAF8F3) matching modal */}
        <div className="mb-8 p-6 sm:p-8 bg-[#FAF8F3] border border-neutral-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
          <div className="flex items-center gap-5">
            {/* Avatar / Initial Circle */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white border border-neutral-300 flex items-center justify-center text-xl sm:text-2xl font-serif font-semibold tracking-widest text-brand-dark shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-[0.25em] font-serif uppercase px-2.5 py-0.5 bg-black text-white font-semibold">
                  PRIVILÈGE VIP MEMBER
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-serif tracking-[0.12em] uppercase text-black font-semibold">
                {user?.name || 'ATELIER MEMBER'}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-600 font-sans font-light">
                {user?.email || 'member@houseofurvaah.com'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 border-neutral-200/80 pt-4 md:pt-0">
            <button
              onClick={() => setShowSignOutModal(true)}
              className="w-full md:w-auto bg-brand-dark text-white hover:bg-neutral-800 text-xs font-sans font-bold tracking-[0.2em] uppercase px-6 py-3 transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <LogOut className="w-4 h-4 stroke-[1.5]" />
              SIGN OUT
            </button>
          </div>
        </div>

        {/* 1. Horizontal Top Navigation Tabs Bar */}
        <div className="mb-10 border-b border-neutral-200 overflow-x-auto scrollbar-none">
          <div className="flex items-center justify-between min-w-max md:min-w-full w-full gap-4 sm:gap-6 md:gap-8 pb-0.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleTabClick(tab)}
                  className={`relative py-3 text-xs sm:text-sm tracking-[0.2em] font-sans uppercase transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'text-black font-semibold'
                      : 'text-neutral-500 hover:text-black font-medium'
                  }`}
                >
                  {tab}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 inset-x-0 h-[2px] bg-brand-dark"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Success / Info Message Toast */}
        <AnimatePresence>
          {profileMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-neutral-900 text-white text-xs font-sans tracking-wider rounded-none flex items-center justify-between"
            >
              <span>{profileMessage}</span>
              <button onClick={() => setProfileMessage('')} className="p-1 hover:opacity-75">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. TAB CONTENT PANELS */}
        {activeTab === 'ACCOUNT DETAILS' && (
          <div className="space-y-12 max-w-4xl">
            {/* ACCOUNT DETAILS SECTION */}
            <section className="bg-neutral-50/70 p-6 sm:p-8 md:p-10 border border-neutral-200/80">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-200">
                <div>
                  <h2 className="text-lg sm:text-xl font-serif tracking-[0.15em] uppercase text-black font-normal">
                    ACCOUNT DETAILS
                  </h2>
                  <p className="text-xs text-neutral-500 tracking-wider font-sans mt-0.5">
                    Personal information and contact preferences
                  </p>
                </div>
                {!isEditingProfile ? (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase font-sans text-brand-dark hover:underline cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>EDIT</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="text-xs font-semibold tracking-widest uppercase font-sans text-neutral-500 hover:text-black cursor-pointer"
                  >
                    CANCEL
                  </button>
                )}
              </div>

              {!isEditingProfile ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-sans">
                  <div>
                    <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                      NAME
                    </span>
                    <p className="text-sm sm:text-base text-neutral-900 font-medium">
                      {user.name || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                      EMAIL
                    </span>
                    <p className="text-sm sm:text-base text-neutral-900 font-medium break-all">
                      {user.email}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                      PHONE NO.
                    </span>
                    <p className="text-sm sm:text-base text-neutral-900 font-medium">
                      {user.phone || 'Not provided'}
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="space-y-6 font-sans">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold tracking-wider text-neutral-700 uppercase mb-2">
                        FULL NAME
                      </label>
                      <input
                        type="text"
                        value={fullNameInput}
                        onChange={(e) => setFullNameInput(e.target.value)}
                        required
                        className="w-full px-4 py-3 text-sm bg-white border border-neutral-300 focus:border-brand-dark focus:ring-1 focus:ring-brand-dark outline-none font-sans"
                        placeholder="Enter full name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold tracking-wider text-neutral-700 uppercase mb-2">
                        PHONE NUMBER
                      </label>
                      <input
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="w-full px-4 py-3 text-sm bg-white border border-neutral-300 focus:border-brand-dark focus:ring-1 focus:ring-brand-dark outline-none font-sans"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold tracking-wider text-neutral-400 uppercase mb-2">
                      EMAIL ADDRESS (READ ONLY)
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={user.email}
                        disabled
                        className="w-full px-4 py-3 text-sm bg-neutral-100 border border-neutral-200 text-neutral-500 cursor-not-allowed font-sans"
                      />
                      <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="bg-brand-dark hover:bg-neutral-800 text-white text-xs font-semibold tracking-widest px-6 py-3 uppercase transition-colors cursor-pointer"
                    >
                      {profileSaving ? 'SAVING...' : 'SAVE CHANGES'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="border border-neutral-300 hover:border-black text-neutral-700 hover:text-black text-xs font-semibold tracking-widest px-6 py-3 uppercase transition-colors cursor-pointer"
                    >
                      CANCEL
                    </button>
                  </div>
                </form>
              )}
            </section>

            {/* ADDRESSES SECTION */}
            <section className="bg-neutral-50/70 p-6 sm:p-8 md:p-10 border border-neutral-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-200">
                <div>
                  <h2 className="text-lg sm:text-xl font-serif tracking-[0.15em] uppercase text-black font-normal">
                    ADDRESSES
                  </h2>
                  <p className="text-xs text-neutral-500 tracking-wider font-sans mt-0.5">
                    Manage your saved delivery addresses
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openAddAddressModal}
                  className="inline-flex items-center justify-center gap-2 bg-brand-dark hover:bg-neutral-800 text-white text-xs font-semibold tracking-widest px-5 py-2.5 uppercase transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>ADD ADDRESS</span>
                </button>
              </div>

              {/* Saved Addresses List / Empty State */}
              {addresses.length === 0 ? (
                <div className="py-10 text-center border border-dashed border-neutral-300 bg-white p-6 font-sans">
                  <MapPin className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
                  <p className="text-xs sm:text-sm text-neutral-600 tracking-wider uppercase font-medium">
                    You haven't saved any addresses yet.
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Add a default shipping address for faster checkout.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                  {addresses.map((addr, idx) => (
                    <div
                      key={idx}
                      className={`relative p-5 bg-white border transition-all ${
                        addr.isDefault
                          ? 'border-brand-dark ring-1 ring-brand-dark/20 shadow-xs'
                          : 'border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-neutral-100 text-[10px] font-bold tracking-widest uppercase text-neutral-700">
                            {addr.type || 'HOME'}
                          </span>
                          {addr.isDefault && (
                            <span className="px-2 py-0.5 bg-neutral-900 text-white text-[10px] font-bold tracking-widest uppercase">
                              DEFAULT
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => openEditAddressModal(idx)}
                            className="text-neutral-500 hover:text-black p-1 cursor-pointer"
                            title="Edit Address"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(idx)}
                            className="text-neutral-400 hover:text-red-600 p-1 cursor-pointer"
                            title="Delete Address"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-sm font-semibold text-neutral-900 mb-1">{addr.name}</h4>
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        {addr.street}
                        <br />
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      <p className="text-xs text-neutral-500 mt-2 font-mono">Ph: {addr.phone}</p>

                      {!addr.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(idx)}
                          className="mt-4 text-[11px] font-semibold text-brand-dark hover:underline tracking-wider uppercase block cursor-pointer"
                        >
                          SET AS DEFAULT
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* OTHER TAB PANELS */}
        {activeTab === 'VIEW ORDERS' && (
          <div className="max-w-4xl bg-neutral-50/70 p-8 md:p-12 border border-neutral-200 text-center font-sans">
            <Package className="w-10 h-10 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-serif tracking-[0.15em] uppercase text-black mb-2">
              MY ORDERS
            </h3>
            <p className="text-xs text-neutral-500 tracking-wider uppercase mb-6 max-w-md mx-auto">
              You haven't placed any orders yet. Explore our latest luxury edit to make your first purchase.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-brand-dark hover:bg-neutral-800 text-white text-xs font-semibold tracking-widest px-8 py-3.5 uppercase transition-colors cursor-pointer"
            >
              EXPLORE COLLECTION
            </button>
          </div>
        )}

        {activeTab === 'INVOICES' && (
          <div className="max-w-4xl bg-neutral-50/70 p-8 md:p-12 border border-neutral-200 text-center font-sans">
            <FileText className="w-10 h-10 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-serif tracking-[0.15em] uppercase text-black mb-2">
              TAX INVOICES & STATEMENTS
            </h3>
            <p className="text-xs text-neutral-500 tracking-wider uppercase max-w-md mx-auto">
              No tax invoices or downloadable receipts currently available for this account.
            </p>
          </div>
        )}

        {activeTab === 'VIEW WISHLIST' && (
          <div className="max-w-4xl bg-neutral-50/70 p-8 md:p-12 border border-neutral-200 text-center font-sans">
            <Heart className="w-10 h-10 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-serif tracking-[0.15em] uppercase text-black mb-2">
              SAVED WISHLIST ITEMS ({wishlist.length})
            </h3>
            <p className="text-xs text-neutral-500 tracking-wider uppercase mb-6 max-w-md mx-auto">
              Manage your saved luxury pieces and curated looks.
            </p>
            <button
              onClick={() => navigate('/wishlist')}
              className="bg-brand-dark hover:bg-neutral-800 text-white text-xs font-semibold tracking-widest px-8 py-3.5 uppercase transition-colors cursor-pointer"
            >
              GO TO WISHLIST
            </button>
          </div>
        )}

        {activeTab === 'MY COUPONS' && (
          <div className="max-w-4xl bg-neutral-50/70 p-8 md:p-12 border border-neutral-200 text-center font-sans">
            <Ticket className="w-10 h-10 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-serif tracking-[0.15em] uppercase text-black mb-2">
              ATELIER VOUCHERS & COUPONS
            </h3>
            <div className="max-w-md mx-auto p-4 bg-white border border-dashed border-neutral-300 text-left my-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-widest uppercase text-brand-dark font-mono">
                  WELCOME10
                </span>
                <span className="px-2 py-0.5 bg-neutral-900 text-white text-[10px] font-bold tracking-widest uppercase">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-neutral-600 mt-1">10% Off your inaugural House of Urvaah purchase.</p>
            </div>
          </div>
        )}
      </div>

      {/* 3. ADD / EDIT ADDRESS MODAL */}
      <AnimatePresence>
        {isAddressModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 selection:bg-brand-dark font-sans">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddressModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-lg bg-white p-6 sm:p-8 shadow-2xl border border-neutral-200 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-neutral-200">
                <h3 className="font-serif text-lg tracking-[0.15em] uppercase text-black">
                  {editingAddressIndex !== null ? 'EDIT ADDRESS' : 'ADD NEW ADDRESS'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="p-1 text-neutral-400 hover:text-black cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAddress} className="space-y-4 font-sans text-xs">
                <div>
                  <label className="block font-semibold tracking-wider text-neutral-700 uppercase mb-1">
                    RECIPIENT NAME
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.name}
                    onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 focus:border-brand-dark focus:ring-1 focus:ring-brand-dark outline-none text-sm"
                    placeholder="Full name"
                  />
                </div>

                <div>
                  <label className="block font-semibold tracking-wider text-neutral-700 uppercase mb-1">
                    PHONE NUMBER
                  </label>
                  <input
                    type="tel"
                    required
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 focus:border-brand-dark focus:ring-1 focus:ring-brand-dark outline-none text-sm"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="block font-semibold tracking-wider text-neutral-700 uppercase mb-1">
                    STREET ADDRESS / FLAT / BUILDING
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={addressForm.street}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 focus:border-brand-dark focus:ring-1 focus:ring-brand-dark outline-none text-sm resize-none"
                    placeholder="House/Flat No., Street Name, Area"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold tracking-wider text-neutral-700 uppercase mb-1">
                      CITY
                    </label>
                    <input
                      type="text"
                      required
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 focus:border-brand-dark focus:ring-1 focus:ring-brand-dark outline-none text-sm"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold tracking-wider text-neutral-700 uppercase mb-1">
                      STATE
                    </label>
                    <input
                      type="text"
                      required
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 focus:border-brand-dark focus:ring-1 focus:ring-brand-dark outline-none text-sm"
                      placeholder="State"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold tracking-wider text-neutral-700 uppercase mb-1">
                      PINCODE
                    </label>
                    <input
                      type="text"
                      required
                      value={addressForm.pincode}
                      onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 focus:border-brand-dark focus:ring-1 focus:ring-brand-dark outline-none text-sm"
                      placeholder="6-digit Pincode"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold tracking-wider text-neutral-700 uppercase mb-1">
                      ADDRESS TYPE
                    </label>
                    <select
                      value={addressForm.type}
                      onChange={(e) => setAddressForm({ ...addressForm, type: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 focus:border-brand-dark focus:ring-1 focus:ring-brand-dark outline-none text-sm cursor-pointer"
                    >
                      <option value="Home">Home</option>
                      <option value="Work">Work</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                  <label htmlFor="isDefault" className="text-xs text-neutral-700 font-medium cursor-pointer">
                    Make this my default shipping address
                  </label>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={addressSaving}
                    className="flex-1 bg-brand-dark hover:bg-neutral-800 text-white text-xs font-semibold tracking-widest py-3 uppercase transition-colors cursor-pointer text-center"
                  >
                    {addressSaving ? 'SAVING...' : 'SAVE ADDRESS'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(false)}
                    className="px-5 py-3 border border-neutral-300 hover:border-black text-neutral-700 text-xs font-semibold tracking-widest uppercase transition-colors cursor-pointer"
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. SIGN OUT CONFIRMATION MODAL */}
      <AnimatePresence>
        {showSignOutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 selection:bg-brand-dark font-sans">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSignOutModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-md bg-[#FAF8F3] p-6 sm:p-8 shadow-2xl border border-neutral-200 text-center"
            >
              <button
                type="button"
                onClick={() => setShowSignOutModal(false)}
                className="absolute top-4 right-4 p-1 text-neutral-400 hover:text-black cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-full bg-white border border-neutral-200 flex items-center justify-center mx-auto mb-4 text-brand-dark shadow-xs">
                <LogOut className="w-5 h-5 stroke-[1.5]" />
              </div>

              <h3 className="font-serif text-lg sm:text-xl tracking-[0.12em] uppercase text-black font-semibold mb-2">
                SIGN OUT OF YOUR ACCOUNT?
              </h3>

              <p className="text-xs text-neutral-600 font-sans leading-relaxed tracking-wider mb-8 max-w-xs mx-auto">
                You'll need to log in again to access your orders, wishlist, and saved addresses.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleConfirmSignOut}
                  disabled={isSigningOut}
                  className="w-full sm:flex-1 bg-brand-dark hover:bg-neutral-800 text-white text-xs font-sans font-bold tracking-[0.2em] uppercase py-3.5 transition-colors cursor-pointer text-center shadow-xs flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4 stroke-[1.5]" />
                  {isSigningOut ? 'SIGNING OUT...' : 'SIGN OUT'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSignOutModal(false)}
                  disabled={isSigningOut}
                  className="w-full sm:flex-1 border border-neutral-300 hover:border-black bg-white text-neutral-700 hover:text-black text-xs font-sans font-semibold tracking-[0.2em] uppercase py-3.5 transition-colors cursor-pointer text-center"
                >
                  CANCEL
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Account;
