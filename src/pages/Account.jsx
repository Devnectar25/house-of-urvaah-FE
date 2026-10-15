import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, MapPin, Plus, Trash2, Edit3, Check, X, Shield, Lock, Ticket, Package, Heart, LogOut, Truck, CheckCircle2, RotateCcw, XCircle, ShoppingBag, AlertCircle, ChevronDown } from 'lucide-react';
import { useCart } from '../context/CartContext';
import apiClient from '../lib/apiClient';
import { SEOHead } from '../components/common/SEOHead';
import { INDIAN_STATES, findMatchedState } from '../data/indianStates';
import { getSupabaseMediaUrl } from '../lib/supabase';
import { ProductCard } from '../components/common/ProductCard';
import { BEST_SELLERS_PRODUCTS, MOCK_PRODUCTS } from '../data/mockProducts';
import { productApi } from '../services/productApi';

const ALL_CATALOG_PRODUCTS = [...BEST_SELLERS_PRODUCTS, ...MOCK_PRODUCTS];

const findLocalProduct = (id) => {
  if (!id) return null;
  const strId = String(id).trim();
  const numId = strId.replace(/\D/g, '');

  return ALL_CATALOG_PRODUCTS.find((p) => {
    const pStrId = String(p.id).trim();
    const pNumId = pStrId.replace(/\D/g, '');

    if (pStrId === strId) return true;
    if (numId && pNumId && numId === pNumId) return true;
    return false;
  });
};

const VALID_TABS = ['VIEW ORDERS', 'VIEW WISHLIST', 'MY COUPONS', 'ACCOUNT DETAILS'];

const normalizeTabName = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const cleaned = raw.trim().toUpperCase().replace(/[-_]/g, ' ');
  if (cleaned === 'ACCOUNT DETAILS' || cleaned === 'DETAILS' || cleaned === 'PROFILE' || cleaned === 'ACCOUNT') {
    return 'ACCOUNT DETAILS';
  }
  if (cleaned === 'VIEW ORDERS' || cleaned === 'ORDERS' || cleaned === 'MY ORDERS') {
    return 'VIEW ORDERS';
  }
  if (cleaned === 'VIEW WISHLIST' || cleaned === 'WISHLIST' || cleaned === 'MY WISHLIST') {
    return 'VIEW WISHLIST';
  }
  if (cleaned === 'MY COUPONS' || cleaned === 'COUPONS' || cleaned === 'DISCOUNTS') {
    return 'MY COUPONS';
  }
  return VALID_TABS.find((t) => t.toUpperCase() === cleaned) || null;
};

export const Account = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, authLoading, logoutUser, updateUserProfile, openAuthModal, wishlist, addToCart } = useCart();
  const [selectedOrderModal, setSelectedOrderModal] = useState(null);

  const handleReorderOrder = (ord) => {
    if (ord && ord.items && Array.isArray(ord.items)) {
      ord.items.forEach((item) => {
        if (addToCart) {
          addToCart(
            item.product || {
              id: item.id || item.productId || 'reorder-prod',
              name: item.name || item.title || 'Product',
              price: item.price || 0,
              image: item.image || '/assets/Images/Brown01.png',
            },
            item.selectedSize || 'M'
          );
        }
      });
      navigate('/checkout');
    }
  };

  // Cancel Order Modal State
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [selectedCancelItems, setSelectedCancelItems] = useState([]);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelComments, setCancelComments] = useState('');
  const [isSubmittingCancellation, setIsSubmittingCancellation] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const handleCancelOrderInAccount = (ord) => {
    setCancelModalOrder(ord);
    setSelectedCancelItems([]);
    setCancelReason('');
    setCancelComments('');
  };

  const handleCloseCancelModal = () => {
    if (isSubmittingCancellation) return;
    setCancelModalOrder(null);
    setSelectedCancelItems([]);
    setCancelReason('');
    setCancelComments('');
  };

  const handleToggleCancelItem = (itemId) => {
    setSelectedCancelItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const cancelModalItems = cancelModalOrder
    ? (cancelModalOrder.items && Array.isArray(cancelModalOrder.items) && cancelModalOrder.items.length > 0)
      ? cancelModalOrder.items
      : [
          {
            id: 'item-1',
            name: cancelModalOrder.product_name || 'DARK BLUE WIDE LEG TAILORED SET',
            quantity: cancelModalOrder.quantity || 1,
            price: Number(cancelModalOrder.total || cancelModalOrder.total_amount || 0),
            image: cancelModalOrder.image || cancelModalOrder.product_image || '/assets/Images/Blue02.png'
          }
        ]
    : [];

  const estimatedRefund = cancelModalOrder
    ? selectedCancelItems.reduce((acc, selectedId) => {
        const itm = cancelModalItems.find((x, idx) => (x.id || x._id || x.productId || `item-${idx}`) === selectedId);
        if (!itm) return acc;
        const p = Number(itm.price || itm.unit_price || (cancelModalOrder.total ? cancelModalOrder.total / cancelModalItems.length : 0));
        const q = Number(itm.quantity || 1);
        return acc + p * q;
      }, 0)
    : 0;

  const isCODOrder = Boolean(
    cancelModalOrder && (
      (cancelModalOrder.payment_method || '').toLowerCase().includes('cod') ||
      (cancelModalOrder.payment_method || '').toLowerCase().includes('cash') ||
      (cancelModalOrder.paymentMethod || '').toLowerCase().includes('cod') ||
      (cancelModalOrder.paymentMethod || '').toLowerCase().includes('cash')
    )
  );

  const isFormFilled = selectedCancelItems.length > 0 && cancelReason.trim().length > 0;

  const handleSubmitCancellation = async () => {
    if (!cancelModalOrder || !isFormFilled) return;
    setIsSubmittingCancellation(true);
    const ord = cancelModalOrder;
    const orderNum = ord.order_number || ord.orderNumber || ord.id;
    try {
      await apiClient(`/api/orders/${orderNum}/cancel`, {
        method: 'POST',
        body: JSON.stringify({
          cancelReason,
          comments: cancelComments,
          itemIds: selectedCancelItems
        })
      });
    } catch (e) {
      console.warn('Cancel order fallback:', e.message);
    }
    setOrders((prev) =>
      prev.map((o) => (o.id === ord.id || o.order_number === orderNum ? { ...o, status: 'Cancelled' } : o))
    );
    setIsSubmittingCancellation(false);
    setCancelModalOrder(null);
    setSelectedCancelItems([]);
    setCancelReason('');
    setCancelComments('');
    setToastMsg({ text: 'Order cancelled successfully.', type: 'success' });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const getInitialTab = () => {
    if (location.pathname === '/account-details') {
      return 'ACCOUNT DETAILS';
    }

    const param = new URLSearchParams(location.search).get('tab');
    if (param) {
      const normalized = normalizeTabName(param);
      if (normalized) return normalized;
    }

    if (location.state?.tab) {
      const normalized = normalizeTabName(location.state.tab);
      if (normalized) return normalized;
    }

    try {
      const saved = sessionStorage.getItem('activeAccountTab');
      if (saved) {
        const normalized = normalizeTabName(saved);
        if (normalized) return normalized;
      }
    } catch (_) {}

    return 'VIEW ORDERS';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    if (location.pathname === '/account-details') {
      setActiveTab('ACCOUNT DETAILS');
      try {
        sessionStorage.setItem('activeAccountTab', 'ACCOUNT DETAILS');
      } catch (_) {}
      return;
    }

    const param = new URLSearchParams(location.search).get('tab');
    if (param) {
      const normalized = normalizeTabName(param);
      if (normalized) {
        setActiveTab(normalized);
        try {
          sessionStorage.setItem('activeAccountTab', normalized);
        } catch (_) {}
      }
    } else if (location.state?.tab) {
      const normalized = normalizeTabName(location.state.tab);
      if (normalized) {
        setActiveTab(normalized);
        try {
          sessionStorage.setItem('activeAccountTab', normalized);
        } catch (_) {}
      }
    }
  }, [location.pathname, location.search, location.state]);

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
    try {
      sessionStorage.removeItem('activeAccountTab');
    } catch (_) {}
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
  const [addressErrors, setAddressErrors] = useState({});
  const [addressSaving, setAddressSaving] = useState(false);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Fetch real profile details and addresses on mount / user change
  const loadProfileAndAddresses = async () => {
    if (!user) return;
    try {
      const res = await apiClient('/api/users/profile');
      if (res.success && res.addresses) {
        const mapped = res.addresses.map(a => ({
          id: a.id,
          name: a.recipient_name || a.name || user.name || 'Recipient',
          phone: a.phone || a.contact_phone || user.phone || '',
          street: a.full_address || a.street || '',
          city: a.city || '',
          state: findMatchedState(a.state) || a.state || '',
          pincode: a.postal_code || a.pincode || '',
          type: a.address_label || a.type || 'Home',
          isDefault: !!a.is_default
        }));
        setAddresses(mapped);
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

  const tabConfig = [
    { name: 'VIEW ORDERS', icon: Package, badge: orders.length > 0 ? orders.length : null },
    { name: 'VIEW WISHLIST', icon: Heart, badge: wishlist.length > 0 ? wishlist.length : null },
    { name: 'MY COUPONS', icon: Ticket },
    { name: 'ACCOUNT DETAILS', icon: User }
  ];

  const tabs = tabConfig.map(t => t.name);

  // Resolve product objects for wishlist IDs directly on the Account page
  const [resolvedWishlist, setResolvedWishlist] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function resolveWishlistItems() {
      if (!wishlist || wishlist.length === 0) {
        if (isMounted) {
          setResolvedWishlist([]);
          setWishlistLoading(false);
        }
        return;
      }

      setWishlistLoading(true);

      const items = await Promise.all(
        wishlist.map(async (id) => {
          const local = findLocalProduct(id);
          if (local) return local;

          try {
            const apiProd = await productApi.getProductById(id);
            if (apiProd && (apiProd.name || apiProd.title)) {
              return {
                ...apiProd,
                id: String(apiProd.id || id),
                name: apiProd.name || apiProd.title,
                price: parseFloat(apiProd.price) || 8990,
                image: getSupabaseMediaUrl(apiProd.image),
                hoverImage: apiProd.hoverImage
                  ? getSupabaseMediaUrl(apiProd.hoverImage)
                  : getSupabaseMediaUrl(apiProd.image),
                gallery: apiProd.gallery
                  ? apiProd.gallery.map(getSupabaseMediaUrl)
                  : [getSupabaseMediaUrl(apiProd.image)],
                colors: apiProd.colors || ['#111111'],
                sizes: apiProd.sizes || ['S', 'M', 'L']
              };
            }
          } catch (e) {
            console.warn('API lookup failed for wishlist product ID:', id, e);
          }

          return null;
        })
      );

      if (isMounted) {
        setResolvedWishlist(items.filter(Boolean));
        setWishlistLoading(false);
      }
    }

    resolveWishlistItems();

    return () => {
      isMounted = false;
    };
  }, [wishlist]);

  const handleTabClick = (tab) => {
    if (tab === 'SIGN OUT') {
      setShowSignOutModal(true);
      return;
    }
    setActiveTab(tab);

    try {
      sessionStorage.setItem('activeAccountTab', tab);
    } catch (_) {}

    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tab', tab);
    const targetPath = location.pathname === '/account-details' && tab !== 'ACCOUNT DETAILS'
      ? '/account'
      : location.pathname;

    navigate(`${targetPath}?${searchParams.toString()}`, { replace: true });
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
    setAddressErrors({});
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
    setAddressErrors({});
    setAddressForm({
      ...item,
      state: findMatchedState(item.state) || item.state || ''
    });
    setIsAddressModalOpen(true);
  };

  const validateAddressForm = () => {
    const errors = {};
    if (!addressForm.name || !addressForm.name.trim()) {
      errors.name = 'Recipient name is required.';
    }

    const cleanPhone = (addressForm.phone || '').replace(/\D/g, '');
    if (!cleanPhone) {
      errors.phone = 'Phone number is required.';
    } else if (cleanPhone.length !== 10) {
      errors.phone = 'Phone number must be a valid 10-digit mobile number.';
    }

    if (!addressForm.street || !addressForm.street.trim()) {
      errors.street = 'Street address / flat / building is required.';
    }

    if (!addressForm.city || !addressForm.city.trim()) {
      errors.city = 'City is required.';
    }

    const cleanPincode = (addressForm.pincode || '').replace(/\D/g, '');
    if (!cleanPincode) {
      errors.pincode = 'Pincode is required.';
    } else if (cleanPincode.length !== 6) {
      errors.pincode = 'Pincode must be exactly 6 digits.';
    }

    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!validateAddressForm()) {
      return;
    }
    setAddressSaving(true);

    try {
      const payload = {
        user_id: user.id || user.username || user.email,
        address_label: addressForm.type,
        full_address: addressForm.street.trim(),
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        postal_code: addressForm.pincode.trim(),
        is_default: addressForm.isDefault,
        name: addressForm.name.trim(),
        recipient_name: addressForm.name.trim(),
        phone: addressForm.phone.trim()
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

      let updatedList = [...addresses];
      if (addressForm.isDefault) {
        updatedList = updatedList.map((addr) => ({ ...addr, isDefault: false }));
      }
      const newItem = {
        id: editingAddressId || `local-${Date.now()}`,
        name: addressForm.name.trim(),
        phone: addressForm.phone.trim(),
        street: addressForm.street.trim(),
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        pincode: addressForm.pincode.trim(),
        type: addressForm.type,
        isDefault: addressForm.isDefault
      };

      if (editingAddressIndex !== null) {
        updatedList[editingAddressIndex] = newItem;
      } else {
        updatedList.push(newItem);
      }

      setAddresses(updatedList);
      await updateUserProfile({ addresses: updatedList });
      await loadProfileAndAddresses();
      setIsAddressModalOpen(false);
    } catch (err) {
      console.error('Failed to save address via backend API, using local fallback:', err);
      let updatedList = [...addresses];
      if (addressForm.isDefault) {
        updatedList = updatedList.map((addr) => ({ ...addr, isDefault: false }));
      }
      const newItem = {
        id: editingAddressId || `local-${Date.now()}`,
        name: addressForm.name.trim(),
        phone: addressForm.phone.trim(),
        street: addressForm.street.trim(),
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        pincode: addressForm.pincode.trim(),
        type: addressForm.type,
        isDefault: addressForm.isDefault
      };

      if (editingAddressIndex !== null) {
        updatedList[editingAddressIndex] = newItem;
      } else {
        updatedList.push(newItem);
      }
      setAddresses(updatedList);
      await updateUserProfile({ addresses: updatedList });
      setIsAddressModalOpen(false);
    } finally {
      setAddressSaving(false);
    }
  };

  const handleDeleteAddress = async (idx) => {
    const item = addresses[idx];
    if (item?.id && !String(item.id).startsWith('local-')) {
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
    if (item?.id && !String(item.id).startsWith('local-')) {
      try {
        await apiClient(`/api/addresses/${item.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            user_id: user.id || user.username || user.email,
            address_label: item.type || 'Home',
            full_address: item.street,
            city: item.city,
            state: item.state,
            postal_code: item.pincode,
            is_default: true,
            recipient_name: item.name,
            phone: item.phone
          })
        });
        await loadProfileAndAddresses();
        return;
      } catch (err) {
        console.error('Failed to set default address via API:', err);
      }
    }
    const updatedList = addresses.map((addr, i) => ({
      ...addr,
      isDefault: i === idx
    }));
    setAddresses(updatedList);
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

      {/* Cancel Order Popup Modal */}
      <AnimatePresence>
        {cancelModalOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 selection:bg-red-500 font-sans">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseCancelModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative z-10 w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 md:p-9 border border-neutral-100 max-h-[90vh] overflow-y-auto text-left"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={handleCloseCancelModal}
                className="absolute top-5 right-5 p-1 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4 stroke-[2]" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 rounded-full border border-red-200 bg-red-50 flex items-center justify-center text-red-600 shrink-0 shadow-2xs">
                  <X className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
                <h3 className="text-xl font-serif tracking-[0.1em] uppercase text-black font-semibold">
                  Cancel Order
                </h3>
              </div>
              <p className="text-xs text-neutral-500 font-sans tracking-wide leading-relaxed mb-5">
                We're sorry to see you cancel. Please tell us why you're cancelling your order.
              </p>

              <div className="space-y-4">
                {/* Select Products to Cancel */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-serif tracking-[0.12em] uppercase text-black font-semibold">
                      Select Products to Cancel
                    </span>
                    <div className="text-right">
                      <span className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest block">
                        ESTIMATED REFUND
                      </span>
                      <span className="text-base sm:text-lg font-serif font-semibold text-black tracking-wide">
                        ₹{estimatedRefund.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Products List */}
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {cancelModalItems.map((item, idx) => {
                      const itemId = item.id || item._id || item.productId || `item-${idx}`;
                      const isSelected = selectedCancelItems.includes(itemId);
                      const itemImg = getSupabaseMediaUrl(item.image || (item.product && item.product.image) || item.image_url);
                      const itemPrice = Number(item.price || item.unit_price || 0);
                      const itemQty = Number(item.quantity || 1);

                      return (
                        <div
                          key={itemId}
                          onClick={() => handleToggleCancelItem(itemId)}
                          className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-neutral-300 bg-neutral-50/70'
                              : 'border-neutral-200/80 bg-white hover:border-neutral-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Circular Selection Checkbox */}
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                                isSelected
                                  ? 'bg-red-600 text-white'
                                  : 'border-2 border-neutral-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>

                            {/* Product Thumbnail */}
                            <div className="w-12 h-12 bg-white rounded-lg border border-neutral-100 p-1 shrink-0 overflow-hidden flex items-center justify-center">
                              <img
                                src={itemImg}
                                alt={item.name || item.title || 'Product'}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = getSupabaseMediaUrl('Images/Blue02.png');
                                }}
                              />
                            </div>

                            {/* Product Info */}
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-neutral-800 truncate">
                                {item.name || item.title || 'Atelier Item'}
                              </p>
                              <p className="text-[11px] text-neutral-400 font-medium mt-0.5">
                                Purchased: {itemQty} • ₹{itemPrice.toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>

                          {/* Cancelling Badge when selected */}
                          {isSelected && (
                            <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-red-500 border border-red-200 bg-red-50">
                              Cancelling
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reason for Cancellation */}
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                    Reason for Cancellation <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full appearance-none px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-700 focus:outline-none focus:border-neutral-400 cursor-pointer pr-10"
                    >
                      <option value="" disabled>Select a reason</option>
                      <option value="Ordered by mistake">Ordered by mistake</option>
                      <option value="Found better price elsewhere">Found better price elsewhere</option>
                      <option value="Delivery taking too long">Delivery taking too long</option>
                      <option value="Changed my mind">Changed my mind</option>
                      <option value="Item not needed anymore">Item not needed anymore</option>
                      <option value="Incorrect size or color ordered">Incorrect size or color ordered</option>
                      <option value="Other">Other</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Additional Comments (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                    Additional Comments (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={cancelComments}
                    onChange={(e) => setCancelComments(e.target.value)}
                    placeholder="Any additional details?"
                    className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-700 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 resize-none"
                  />
                </div>

                {/* Cancellation Note */}
                <div className="bg-red-50/60 border border-red-100 rounded-2xl p-3.5 sm:p-4 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 block">
                      CANCELLATION NOTE
                    </span>
                    <p className="text-[11px] sm:text-xs text-red-600/90 leading-relaxed font-normal">
                      {isCODOrder
                        ? 'Since this is a Cash on Delivery (COD) order, no refund is required for the cancelled items. You will only need to pay for the remaining items in your order upon delivery.'
                        : 'Since this is a prepaid order, the estimated refund will be processed and credited to your original payment method within 5-7 business days.'}
                    </p>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseCancelModal}
                    className="px-5 py-3 border border-neutral-300 hover:border-black bg-white text-neutral-700 hover:text-black text-xs font-sans font-semibold tracking-[0.2em] uppercase rounded-xl transition-colors cursor-pointer"
                  >
                    No, keep order
                  </button>

                  {isFormFilled ? (
                    <button
                      type="button"
                      onClick={handleSubmitCancellation}
                      disabled={isSubmittingCancellation}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-sans font-bold tracking-[0.2em] uppercase rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingCancellation ? 'Cancelling...' : 'Submit Cancellation'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="px-6 py-3 bg-neutral-200 text-neutral-400 text-xs font-sans font-bold tracking-[0.2em] uppercase rounded-xl cursor-not-allowed transition-all"
                    >
                      Cancel {selectedCancelItems.length} Item(s)
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Status / Success Toaster */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.96 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`fixed top-24 sm:top-28 left-1/2 -translate-x-1/2 z-[100] max-w-lg w-[92%] sm:w-auto px-5 py-3.5 shadow-2xl backdrop-blur-md flex items-center justify-between gap-4 font-sans border text-white ${
              toastMsg.type === 'error'
                ? 'bg-neutral-950/95 border-rose-900/60 shadow-rose-950/30'
                : 'bg-neutral-950/95 border-emerald-900/60 shadow-emerald-950/30'
            }`}
          >
            <div className="flex items-center gap-3">
              {toastMsg.type === 'error' ? (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span className="text-xs sm:text-sm font-light tracking-wide text-neutral-200">
                {toastMsg.text}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setToastMsg(null)}
              className="text-neutral-400 hover:text-white p-1 cursor-pointer ml-2"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
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

        {/* 1. Premium Luxury Atelier Navigation Bar */}
        <div className="mb-10 p-1.5 sm:p-2 bg-[#FAF8F3] border border-neutral-200/80 rounded-2xl shadow-xs overflow-x-auto scrollbar-none">
          <div className="flex items-center min-w-max md:min-w-full w-full justify-between gap-1 sm:gap-2">
            {tabConfig.map((item) => {
              const isActive = activeTab === item.name;
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => handleTabClick(item.name)}
                  className={`relative flex-1 flex items-center justify-center gap-2 sm:gap-2.5 px-3.5 sm:px-5 py-3 rounded-xl text-xs tracking-[0.18em] font-sans uppercase transition-all duration-200 cursor-pointer whitespace-nowrap select-none ${
                    isActive
                      ? 'text-white font-semibold'
                      : item.isDanger
                      ? 'text-neutral-500 hover:text-red-700 hover:bg-red-50/60 font-medium'
                      : 'text-neutral-600 hover:text-black hover:bg-white/80 font-medium'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabPill"
                      className="absolute inset-0 bg-brand-dark rounded-xl shadow-xs"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 stroke-[1.6] shrink-0 transition-colors ${
                      isActive ? 'text-white' : item.isDanger ? 'text-neutral-400 group-hover:text-red-600' : 'text-neutral-500'
                    }`} />
                    <span>{item.name}</span>
                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-sans font-semibold leading-none tabular-nums ${
                        isActive ? 'bg-white/20 text-white' : 'bg-neutral-200/80 text-neutral-800'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </span>
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
          <div className="space-y-8 w-full">
            {/* ACCOUNT DETAILS SECTION */}
            <section className="bg-[#FAF8F3] p-6 sm:p-8 md:p-10 border border-[#E7E2D8] rounded-2xl shadow-xs">
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
            <section className="bg-[#FAF8F3] p-6 sm:p-8 md:p-10 border border-[#E7E2D8] rounded-2xl shadow-xs">
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
                      <p className="text-xs text-neutral-500 mt-2 font-sans font-medium">Ph: {addr.phone}</p>

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
          <div className="w-full space-y-6 font-sans text-left">
            <div>
              <h2 className="text-lg sm:text-xl font-serif tracking-[0.15em] uppercase text-black font-semibold">
                ORDER HISTORY
              </h2>
              <p className="text-xs text-neutral-500 tracking-wider font-sans mt-0.5">
                View and manage your orders
              </p>
            </div>

            {ordersLoading ? (
              <div className="py-12 text-center bg-white border border-neutral-200/80 rounded-2xl">
                <div className="w-6 h-6 border-2 border-brand-dark border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-neutral-400 uppercase tracking-widest">Loading your orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-neutral-300 bg-white rounded-2xl p-6 font-sans">
                <Package className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                <p className="text-xs sm:text-sm text-neutral-600 tracking-wider uppercase font-medium mb-1">
                  You haven't placed any orders yet.
                </p>
                <p className="text-[11px] text-neutral-400 mb-6">
                  Explore our latest luxury edit to make your first purchase.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="bg-brand-dark hover:bg-neutral-800 text-white text-xs font-semibold tracking-widest px-8 py-3.5 uppercase transition-colors cursor-pointer"
                >
                  EXPLORE COLLECTION
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((ord, idx) => {
                  const orderNum = ord.order_number || ord.orderNumber || `ORD-2026-${ord.id || Math.floor(100000 + Math.random() * 900000)}`;
                  const orderStatus = ord.status || 'Pending';
                  const statusLower = orderStatus.toLowerCase();
                  const isCancelled = statusLower.includes('cancel');
                  const isDelivered = statusLower.includes('delivered') || statusLower.includes('completed');
                  const isOutForDelivery = isDelivered || statusLower.includes('out') || statusLower.includes('delivery');
                  const isShipped = isOutForDelivery || statusLower.includes('shipped') || statusLower.includes('transit') || statusLower.includes('dispatched');
                  const isPaid = (ord.payment_status || ord.paymentStatus || 'Paid').toLowerCase() === 'paid';

                  let orderTotal = Number(ord.total || ord.total_amount || ord.grandTotal || ord.subtotal || 0);
                  if ((!orderTotal || orderTotal === 0) && ord.items && Array.isArray(ord.items) && ord.items.length > 0) {
                    orderTotal = ord.items.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
                  }

                  const orderDateStr = ord.created_at
                    ? new Date(ord.created_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : 'October 5, 2026';

                  const itemsList = (ord.items && Array.isArray(ord.items) && ord.items.length > 0)
                    ? ord.items
                    : [
                        {
                          id: 'item-1',
                          name: ord.product_name || 'DARK BLUE WIDE LEG TAILORED SET',
                          quantity: ord.quantity || 1,
                          price: orderTotal || 10990,
                          image: ord.image || ord.product_image || '/assets/Images/Blue02.png'
                        }
                      ];

                  const totalItemsCount = itemsList.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);

                  return (
                    <div key={ord.id || idx} className="bg-white border border-[#E7E2D8] rounded-2xl p-6 sm:p-7 shadow-[0_4px_25px_rgba(0,0,0,0.03)] font-sans text-left space-y-6 hover:border-neutral-300 transition-all duration-300">
                      {/* Header Row */}
                      <div className="flex flex-wrap items-start justify-between gap-4 pb-2 border-b border-neutral-100">
                        <div>
                          <span className="text-[10px] font-sans font-bold tracking-[0.25em] uppercase text-neutral-400 block mb-0.5">
                            ORDER REFERENCE
                          </span>
                          <h3 className="text-base sm:text-lg font-serif tracking-[0.06em] text-black font-semibold">
                            #{orderNum}
                          </h3>
                          <p className="text-xs text-neutral-500 font-sans tracking-wide mt-0.5">{orderDateStr}</p>
                        </div>

                        <div className="flex items-center gap-2.5 flex-wrap">
                          {/* Status Badge */}
                          <span className={`px-3.5 py-1 text-[11px] font-sans font-semibold tracking-[0.16em] uppercase rounded-full border shadow-2xs flex items-center gap-1.5 ${
                            isCancelled 
                              ? 'bg-red-50 text-red-800 border-red-200' 
                              : isDelivered 
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                              : isOutForDelivery 
                              ? 'bg-blue-50 text-blue-900 border-blue-200' 
                              : isShipped 
                              ? 'bg-amber-50 text-amber-900 border-amber-200' 
                              : 'bg-[#FAF8F3] text-neutral-800 border-[#E5E0D8]'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              isCancelled 
                                ? 'bg-red-600' 
                                : isDelivered 
                                ? 'bg-emerald-600' 
                                : isOutForDelivery 
                                ? 'bg-blue-600' 
                                : isShipped 
                                ? 'bg-amber-600' 
                                : 'bg-amber-500 animate-pulse'
                            }`} />
                            <span>{orderStatus}</span>
                          </span>

                          {/* Shiprocket Logistics Badge for Cancelled Orders */}
                          {isCancelled && (
                            <span className="px-3 py-1 text-[10px] font-sans font-semibold tracking-[0.16em] uppercase rounded-full border bg-neutral-900 text-white border-neutral-900 flex items-center gap-1.5 shadow-2xs">
                              <Package className="w-3 h-3 text-neutral-300" />
                              <span>SHIPROCKET VOIDED</span>
                            </span>
                          )}

                          {/* Payment / Refund Status Badge */}
                          <span className={`px-3 py-1 text-[10px] font-sans font-semibold tracking-[0.16em] uppercase rounded-full border ${
                            isCancelled
                              ? isPaid
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                              : isPaid 
                              ? 'bg-neutral-900 text-white border-neutral-900' 
                              : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                          }`}>
                            {isCancelled
                              ? (isPaid 
                                  ? (['refunded', 'completed'].includes((ord.refund_status || '').toLowerCase()) ? 'REFUND SETTLED' : 'REFUND INITIATED') 
                                  : 'COD • ZERO DUE')
                              : (isPaid ? 'PAID' : 'PENDING')}
                          </span>
                        </div>
                      </div>

                      {/* Horizontal ORDER PROGRESS JOURNEY Card */}
                      {isCancelled ? (
                        <div className="bg-[#FAF8F3] border border-[#E7E2D8] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                              <h4 className="text-[10px] font-serif tracking-[0.25em] text-neutral-800 uppercase font-semibold">
                                CANCELLATION & SHIPROCKET REFUND JOURNEY
                              </h4>
                            </div>
                            <span className="text-[10px] font-sans tracking-[0.15em] uppercase text-neutral-500 font-medium">
                              STEP 4 OF 4 • SHIPROCKET SYNCED
                            </span>
                          </div>

                          {/* Cancellation Journey Steps */}
                          <div className="grid grid-cols-4 gap-2 relative">
                            {/* Background Line connecting all steps */}
                            <div className="absolute top-4 left-[12%] right-[12%] h-1 bg-neutral-200/90 z-0 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-neutral-900 via-red-600 to-emerald-700 w-full transition-all duration-500" />
                            </div>

                            {/* Step 1: ORDER PLACED */}
                            <div className="flex flex-col items-center text-center z-10">
                              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold shadow-xs bg-neutral-900 text-white ring-4 ring-neutral-200">
                                <Check className="w-4 h-4 stroke-[2.5]" />
                              </div>
                              <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.16em] uppercase mt-2.5 font-sans text-neutral-900">
                                ORDER PLACED
                              </span>
                              <span className="text-[9px] text-neutral-400 font-sans tracking-tight mt-0.5 hidden sm:block">
                                Payment Received
                              </span>
                            </div>

                            {/* Step 2: CANCELLED */}
                            <div className="flex flex-col items-center text-center z-10">
                              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold shadow-xs bg-red-600 text-white ring-4 ring-red-100">
                                <X className="w-4 h-4 stroke-[2.5]" />
                              </div>
                              <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.16em] uppercase mt-2.5 font-sans text-red-700">
                                CANCELLED
                              </span>
                              <span className="text-[9px] text-red-500/80 font-sans tracking-tight mt-0.5 hidden sm:block">
                                Pre-Dispatch Request
                              </span>
                            </div>

                            {/* Step 3: SHIPROCKET VOIDED */}
                            <div className="flex flex-col items-center text-center z-10">
                              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold shadow-xs bg-neutral-900 text-white ring-4 ring-neutral-200">
                                <Package className="w-4 h-4 stroke-[2]" />
                              </div>
                              <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.16em] uppercase mt-2.5 font-sans text-neutral-900">
                                SHIPROCKET VOIDED
                              </span>
                              <span className="text-[9px] text-neutral-500 font-sans tracking-tight mt-0.5 hidden sm:block">
                                Pickup Cancelled
                              </span>
                            </div>

                            {/* Step 4: REFUND COMPLETED / COD SETTLED */}
                            <div className="flex flex-col items-center text-center z-10">
                              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold shadow-xs bg-emerald-700 text-white ring-4 ring-emerald-100">
                                <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
                              </div>
                              <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.16em] uppercase mt-2.5 font-sans text-emerald-800">
                                {isPaid ? 'REFUND ISSUED' : 'COD SETTLED'}
                              </span>
                              <span className="text-[9px] text-emerald-600/80 font-sans tracking-tight mt-0.5 hidden sm:block">
                                {isPaid ? '100% Settled' : 'Zero Due'}
                              </span>
                            </div>
                          </div>

                          {/* Shiprocket Logistics & Refund Intelligence Box */}
                          <div className="pt-3 border-t border-[#E7E2D8] grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
                            {/* Shiprocket Logistics Details */}
                            <div className="bg-white/80 border border-[#E7E2D8] rounded-xl p-3.5 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-800 flex items-center gap-1.5">
                                  <Package className="w-3.5 h-3.5 text-neutral-700" />
                                  Shiprocket Logistics Sync
                                </span>
                                <span className="text-[9px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 uppercase">
                                  Pickup Voided
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-600 leading-relaxed">
                                Shipment and courier pickup request were cancelled in Shiprocket prior to dispatch. Zero freight fee billed to order account.
                              </p>
                              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-500">
                                <span>Logistics Partner: <strong className="text-neutral-700">Shiprocket Express</strong></span>
                                <span>AWB: <strong className="text-neutral-700">Voided (Cancelled)</strong></span>
                              </div>
                            </div>

                            {/* Financial Refund Details */}
                            <div className="bg-white/80 border border-[#E7E2D8] rounded-xl p-3.5 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-800 flex items-center gap-1.5">
                                  <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                                  Financial Settlement
                                </span>
                                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border uppercase ${
                                  isPaid 
                                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                                    : 'text-neutral-700 bg-neutral-100 border-neutral-200'
                                }`}>
                                  {isPaid ? '100% Refunded' : 'Zero Payment'}
                                </span>
                              </div>
                              {isPaid ? (
                                <>
                                  <p className="text-[11px] text-neutral-600 leading-relaxed">
                                    Full 100% refund of <strong className="text-neutral-900 font-semibold">₹{Number(orderTotal).toLocaleString('en-IN')}</strong> initiated to original payment source ({ord.payment_type || ord.payment_method || 'Online / UPI'}).
                                  </p>
                                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-500">
                                    <span>Settlement: <strong className="text-neutral-700">3-5 Business Days</strong></span>
                                    <span>UTR Ref: <strong className="text-neutral-700">REF-{orderNum}</strong></span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <p className="text-[11px] text-neutral-600 leading-relaxed">
                                    This was a Cash on Delivery (COD) order. Because no advance payment was collected, no monetary refund is required.
                                  </p>
                                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-500">
                                    <span>Payment Mode: <strong className="text-neutral-700">Cash on Delivery</strong></span>
                                    <span>Balance Due: <strong className="text-neutral-700">₹0.00</strong></span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-[#FAF8F3] border border-[#E7E2D8] rounded-2xl p-5 sm:p-6 shadow-2xs">
                          <div className="flex items-center justify-between mb-5">
                            <h4 className="text-[10px] font-serif tracking-[0.25em] text-neutral-500 uppercase font-semibold">
                              ORDER PROGRESS JOURNEY
                            </h4>
                            <span className="text-[10px] font-sans tracking-[0.15em] uppercase text-neutral-400 font-medium">
                              STEP {isDelivered ? '4 OF 4' : isOutForDelivery ? '3 OF 4' : isShipped ? '2 OF 4' : '1 OF 4'}
                            </span>
                          </div>

                          {/* Progress Journey Steps */}
                          <div className="grid grid-cols-4 gap-2 relative">
                            {/* Background Line with Dynamic Fill */}
                            <div className="absolute top-4 left-[12%] right-[12%] h-1 bg-neutral-200/90 z-0 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-brand-dark transition-all duration-500" 
                                style={{ 
                                  width: isDelivered 
                                    ? '100%' 
                                    : isOutForDelivery 
                                    ? '66%' 
                                    : isShipped 
                                    ? '33%' 
                                    : '0%' 
                                }} 
                              />
                            </div>

                            {/* Step 1: ORDER PLACED */}
                            <div className="flex flex-col items-center text-center z-10">
                              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold shadow-xs transition-all bg-brand-dark text-white ring-4 ring-[#E8E2D8]">
                                <Check className="w-4 h-4 stroke-[2.5]" />
                              </div>
                              <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.16em] uppercase mt-2.5 font-sans text-black">
                                ORDER PLACED
                              </span>
                            </div>

                            {/* Step 2: SHIPPED */}
                            <div className="flex flex-col items-center text-center z-10">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all ${
                                isShipped 
                                  ? 'bg-brand-dark text-white ring-4 ring-[#E8E2D8] shadow-xs' 
                                  : 'bg-white border-2 border-neutral-300 text-neutral-400'
                              }`}>
                                <Package className="w-4 h-4 stroke-[1.8]" />
                              </div>
                              <span className={`text-[9px] sm:text-[10px] tracking-[0.16em] uppercase mt-2.5 font-sans ${
                                isShipped ? 'font-bold text-black' : 'font-medium text-neutral-400'
                              }`}>
                                SHIPPED
                              </span>
                            </div>

                            {/* Step 3: OUT FOR DELIVERY */}
                            <div className="flex flex-col items-center text-center z-10">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all ${
                                isOutForDelivery 
                                  ? 'bg-brand-dark text-white ring-4 ring-[#E8E2D8] shadow-xs' 
                                  : 'bg-white border-2 border-neutral-300 text-neutral-400'
                              }`}>
                                <Truck className="w-4 h-4 stroke-[1.8]" />
                              </div>
                              <span className={`text-[9px] sm:text-[10px] tracking-[0.16em] uppercase mt-2.5 font-sans ${
                                isOutForDelivery ? 'font-bold text-black' : 'font-medium text-neutral-400'
                              }`}>
                                OUT FOR DELIVERY
                              </span>
                            </div>

                            {/* Step 4: DELIVERED */}
                            <div className="flex flex-col items-center text-center z-10">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all ${
                                isDelivered 
                                  ? 'bg-emerald-700 text-white ring-4 ring-emerald-100 shadow-xs' 
                                  : 'bg-white border-2 border-neutral-300 text-neutral-400'
                              }`}>
                                <CheckCircle2 className="w-4 h-4 stroke-[1.8]" />
                              </div>
                              <span className={`text-[9px] sm:text-[10px] tracking-[0.16em] uppercase mt-2.5 font-sans ${
                                isDelivered ? 'font-bold text-emerald-800' : 'font-medium text-neutral-400'
                              }`}>
                                DELIVERED
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Sub-card Products List */}
                      <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-5 divide-y divide-neutral-100 space-y-4 shadow-2xs">
                        {itemsList.map((item, itemIdx) => {
                          const itemImg = getSupabaseMediaUrl(item.image || (item.product && item.product.image) || item.image_url);
                          const itemPrice = Number(item.price || item.unit_price || 0);
                          return (
                            <div key={itemIdx} className="flex items-center justify-between gap-4 pt-4 first:pt-0">
                              <div className="flex items-center gap-4 min-w-0">
                                <div className="w-14 h-18 sm:w-16 sm:h-20 bg-[#FAF8F3] rounded-xl overflow-hidden border border-neutral-200/80 p-0.5 flex-shrink-0 shadow-2xs">
                                  <img
                                    src={itemImg}
                                    alt={item.name || item.title || 'Product'}
                                    className="w-full h-full object-cover object-top rounded-lg"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = getSupabaseMediaUrl('Images/Blue02.png');
                                    }}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <h5 className="text-xs sm:text-sm font-serif tracking-[0.06em] uppercase text-black font-semibold truncate leading-snug">
                                    {item.name || item.title || 'Atelier Item'}
                                  </h5>
                                  <div className="flex items-center gap-3 text-xs text-neutral-500 font-sans tracking-wide mt-1">
                                    <span>Qty: {item.quantity || 1}</span>
                                    {itemPrice > 0 && (
                                      <>
                                        <span className="text-neutral-300">•</span>
                                        <span className="font-medium text-neutral-700">₹{itemPrice.toLocaleString('en-IN')}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <span className={`px-3 py-1 rounded-full text-[10px] font-sans font-bold tracking-[0.16em] uppercase border shrink-0 ${
                                isCancelled 
                                  ? 'bg-red-50 text-red-800 border-red-200' 
                                  : isDelivered 
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                  : isOutForDelivery 
                                  ? 'bg-blue-50 text-blue-800 border-blue-200' 
                                  : isShipped 
                                  ? 'bg-amber-50 text-amber-800 border-amber-200' 
                                  : 'bg-neutral-100 text-neutral-800 border-neutral-200'
                              }`}>
                                {isCancelled ? 'CANCELLED' : isDelivered ? 'DELIVERED' : isOutForDelivery ? 'OUT FOR DELIVERY' : isShipped ? 'SHIPPED' : 'PROCESSING'}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Footer Row */}
                      <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <span className="text-[10px] uppercase tracking-[0.2em] font-sans font-semibold text-neutral-400 block">
                            {totalItemsCount} {totalItemsCount === 1 ? 'ITEM' : 'ITEMS'} TOTAL
                          </span>
                          <span className="text-xl sm:text-2xl font-serif tracking-[0.04em] text-black font-semibold mt-0.5 block">
                            ₹{Number(orderTotal).toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => navigate('/checkout', { state: { viewOrder: ord } })}
                            className="px-5 py-2.5 rounded-xl border border-neutral-300 hover:border-black bg-white hover:bg-neutral-50 text-xs font-sans font-semibold tracking-[0.16em] uppercase text-neutral-800 hover:text-black transition-all shadow-2xs cursor-pointer"
                          >
                            View Details
                          </button>

                          <button
                            type="button"
                            onClick={() => handleReorderOrder(ord)}
                            className="px-5 py-2.5 rounded-xl border border-neutral-300 hover:border-black bg-white hover:bg-neutral-50 text-xs font-sans font-semibold tracking-[0.16em] uppercase text-neutral-800 hover:text-black transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reorder</span>
                          </button>

                          {!isCancelled && !isDelivered && (
                            <button
                              type="button"
                              onClick={() => handleCancelOrderInAccount(ord)}
                              className="px-5 py-2.5 rounded-xl border border-red-200 hover:border-red-500 bg-white hover:bg-red-50 text-xs font-sans font-semibold tracking-[0.16em] uppercase text-red-600 hover:text-red-700 transition-all shadow-2xs cursor-pointer"
                            >
                              Cancel Order
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}


        {activeTab === 'VIEW WISHLIST' && (
          <div className="space-y-6">
            {/* Wishlist Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-neutral-200">
              <div>
                <span className="text-[10px] tracking-[0.25em] uppercase text-neutral-400 font-serif block mb-1">
                  CURATED ATELIER SELECTION
                </span>
                <h2 className="text-xl sm:text-2xl font-serif tracking-[0.12em] uppercase text-black font-semibold">
                  SAVED WISHLIST PIECES ({resolvedWishlist.length})
                </h2>
                <p className="text-xs text-neutral-500 font-sans tracking-wide mt-1">
                  Manage and shop your saved luxury runway looks and curated favorites.
                </p>
              </div>

              {resolvedWishlist.length > 0 && (
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="inline-flex items-center gap-2 text-xs font-sans font-semibold tracking-[0.16em] uppercase text-neutral-500 hover:text-black transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <span>CONTINUE SHOPPING</span>
                </button>
              )}
            </div>

            {/* Wishlist Products Grid / Loading / Empty State */}
            {wishlistLoading && resolvedWishlist.length === 0 ? (
              <div className="py-16 text-center font-serif text-neutral-400 bg-white border border-[#E7E2D8] rounded-2xl">
                <div className="w-6 h-6 border-2 border-brand-dark border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs uppercase tracking-widest font-sans">Loading your saved luxury pieces...</p>
              </div>
            ) : resolvedWishlist.length === 0 ? (
              <div className="bg-[#FAF8F3] border border-[#E7E2D8] rounded-2xl p-8 sm:p-12 md:p-16 text-center font-sans">
                <Heart className="w-10 h-10 text-neutral-300 mx-auto mb-4 stroke-[1.25]" />
                <h3 className="text-lg sm:text-xl font-serif tracking-[0.15em] uppercase text-black mb-2 font-semibold">
                  YOUR WISHLIST IS EMPTY
                </h3>
                <p className="text-xs text-neutral-500 tracking-wider uppercase mb-8 max-w-md mx-auto leading-relaxed">
                  Explore our luxury collection and click the heart icon on any piece to save it for later.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="bg-brand-dark hover:bg-neutral-800 text-white text-xs font-semibold tracking-widest px-8 py-3.5 uppercase transition-colors cursor-pointer shadow-xs"
                >
                  EXPLORE COLLECTION
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
                <AnimatePresence>
                  {resolvedWishlist.map((product) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.25 }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {activeTab === 'MY COUPONS' && (
          <div className="w-full bg-[#FAF8F3] p-8 sm:p-12 md:p-16 border border-[#E7E2D8] rounded-2xl text-center font-sans shadow-xs">
            <Ticket className="w-10 h-10 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-serif tracking-[0.15em] uppercase text-black mb-2 font-semibold">
              ATELIER VOUCHERS & COUPONS
            </h3>
            <div className="max-w-md mx-auto p-4 bg-white border border-dashed border-neutral-300 text-left my-4 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-brand-dark font-sans">
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

              <form onSubmit={handleSaveAddress} noValidate className="space-y-4 font-sans text-xs">
                <div>
                  <label className="block font-semibold tracking-wider text-neutral-700 uppercase mb-1">
                    RECIPIENT NAME *
                  </label>
                  <input
                    type="text"
                    value={addressForm.name}
                    onChange={(e) => {
                      setAddressForm({ ...addressForm, name: e.target.value });
                      if (addressErrors.name) setAddressErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    className={`w-full px-3.5 py-2.5 bg-white border ${
                      addressErrors.name ? 'border-red-500' : 'border-neutral-300 focus:border-brand-dark'
                    } focus:ring-1 focus:ring-brand-dark outline-none text-sm`}
                    placeholder="Full name"
                  />
                  {addressErrors.name && (
                    <p className="text-[11px] text-red-600 mt-1">{addressErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold tracking-wider text-neutral-700 uppercase mb-1">
                    PHONE NUMBER *
                  </label>
                  <input
                    type="tel"
                    value={addressForm.phone}
                    onChange={(e) => {
                      setAddressForm({ ...addressForm, phone: e.target.value });
                      if (addressErrors.phone) setAddressErrors((prev) => ({ ...prev, phone: '' }));
                    }}
                    className={`w-full px-3.5 py-2.5 bg-white border ${
                      addressErrors.phone ? 'border-red-500' : 'border-neutral-300 focus:border-brand-dark'
                    } focus:ring-1 focus:ring-brand-dark outline-none text-sm`}
                    placeholder="+91 XXXXX XXXXX"
                  />
                  {addressErrors.phone && (
                    <p className="text-[11px] text-red-600 mt-1">{addressErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold tracking-wider text-neutral-700 uppercase mb-1">
                    STREET ADDRESS / FLAT / BUILDING *
                  </label>
                  <textarea
                    rows={2}
                    value={addressForm.street}
                    onChange={(e) => {
                      setAddressForm({ ...addressForm, street: e.target.value });
                      if (addressErrors.street) setAddressErrors((prev) => ({ ...prev, street: '' }));
                    }}
                    className={`w-full px-3.5 py-2.5 bg-white border ${
                      addressErrors.street ? 'border-red-500' : 'border-neutral-300 focus:border-brand-dark'
                    } focus:ring-1 focus:ring-brand-dark outline-none text-sm resize-none`}
                    placeholder="House/Flat No., Street Name, Area"
                  />
                  {addressErrors.street && (
                    <p className="text-[11px] text-red-600 mt-1">{addressErrors.street}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold tracking-wider text-neutral-700 uppercase mb-1">
                      CITY *
                    </label>
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => {
                        setAddressForm({ ...addressForm, city: e.target.value });
                        if (addressErrors.city) setAddressErrors((prev) => ({ ...prev, city: '' }));
                      }}
                      className={`w-full px-3.5 py-2.5 bg-white border ${
                        addressErrors.city ? 'border-red-500' : 'border-neutral-300 focus:border-brand-dark'
                      } focus:ring-1 focus:ring-brand-dark outline-none text-sm`}
                      placeholder="City"
                    />
                    {addressErrors.city && (
                      <p className="text-[11px] text-red-600 mt-1">{addressErrors.city}</p>
                    )}
                  </div>
                  <div>
                    <label className="block font-semibold tracking-wider text-neutral-700 uppercase mb-1">
                      PINCODE *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={addressForm.pincode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setAddressForm({ ...addressForm, pincode: val });
                        if (addressErrors.pincode) setAddressErrors((prev) => ({ ...prev, pincode: '' }));
                      }}
                      className={`w-full px-3.5 py-2.5 bg-white border ${
                        addressErrors.pincode ? 'border-red-500' : 'border-neutral-300 focus:border-brand-dark'
                      } focus:ring-1 focus:ring-brand-dark outline-none text-sm`}
                      placeholder="6-digit Pincode"
                    />
                    {addressErrors.pincode && (
                      <p className="text-[11px] text-red-600 mt-1">{addressErrors.pincode}</p>
                    )}
                  </div>
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

        {/* View Details Modal Overlay */}
        {selectedOrderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans text-left">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrderModal(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative z-10 w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6 text-left max-h-[85vh] overflow-y-auto border border-neutral-200"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Order Reference</span>
                  <h3 className="text-lg font-serif font-semibold text-neutral-900 tracking-[0.06em]">
                    #{selectedOrderModal.order_number || selectedOrderModal.orderNumber || `ORD-2026-${selectedOrderModal.id}`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrderModal(null)}
                  className="p-2 text-neutral-400 hover:text-black rounded-full hover:bg-neutral-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Order Status Badges */}
              {(() => {
                const modalStatus = selectedOrderModal.status || 'Pending';
                const isModalCancelled = modalStatus.toLowerCase().includes('cancel');
                const isModalPaid = (selectedOrderModal.payment_status || selectedOrderModal.paymentStatus || 'Paid').toLowerCase() === 'paid';
                const modalTotal = Number(selectedOrderModal.total || selectedOrderModal.total_amount || 0);

                return (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between bg-neutral-50 p-4 rounded-xl border border-neutral-200/60 text-xs gap-3">
                      <div>
                        <span className="text-neutral-400 block text-[10px] font-bold uppercase">ORDER STATUS</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {isModalCancelled && <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />}
                          <span className={`font-bold ${isModalCancelled ? 'text-red-700' : 'text-neutral-900'}`}>{modalStatus}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px] font-bold uppercase">PAYMENT METHOD</span>
                        <span className="font-bold text-neutral-900 mt-0.5 block">{selectedOrderModal.payment_method || selectedOrderModal.paymentMethod || 'Online Payment'}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px] font-bold uppercase">PLACED ON</span>
                        <span className="font-bold text-neutral-900 mt-0.5 block">
                          {selectedOrderModal.created_at ? new Date(selectedOrderModal.created_at).toLocaleDateString() : 'October 5, 2026'}
                        </span>
                      </div>
                      {isModalCancelled && (
                        <div>
                          <span className="text-neutral-400 block text-[10px] font-bold uppercase">SHIPROCKET SYNC</span>
                          <span className="font-bold text-neutral-900 bg-neutral-900 text-white px-2 py-0.5 rounded text-[10px] uppercase mt-0.5 inline-block">
                            VOIDED (₹0 FREIGHT)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Shiprocket Cancellation Banner if Cancelled */}
                    {isModalCancelled && (
                      <div className="bg-[#FAF8F3] border border-[#E7E2D8] rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-[#E7E2D8]/70">
                          <span className="text-[10px] font-serif tracking-[0.2em] uppercase font-semibold text-neutral-800 flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-neutral-700" />
                            Shiprocket Logistics & Refund Sync
                          </span>
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase">
                            {isModalPaid ? '100% Refund Initiated' : 'COD • Zero Due'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="bg-white p-3 rounded-lg border border-neutral-200/70">
                            <span className="text-[10px] font-bold uppercase text-neutral-700 block mb-1">Logistics Cancellation</span>
                            <p className="text-[11px] text-neutral-600 leading-relaxed">
                              Shipment and pickup manifest voided in Shiprocket prior to dispatch. Zero freight fee billed.
                            </p>
                            <span className="text-[10px] text-neutral-400 block mt-1.5">AWB: Voided (Cancelled)</span>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-neutral-200/70">
                            <span className="text-[10px] font-bold uppercase text-neutral-700 block mb-1">Financial Settlement</span>
                            <p className="text-[11px] text-neutral-600 leading-relaxed">
                              {isModalPaid 
                                ? `Full refund of ₹${modalTotal.toLocaleString('en-IN')} initiated to original payment source (3-5 business days).`
                                : 'Cash on Delivery order — zero payment collected, no refund required.'}
                            </p>
                            <span className="text-[10px] text-neutral-400 block mt-1.5">Ref: REF-{selectedOrderModal.order_number || selectedOrderModal.id}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Products List */}
              <div>
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Order Items</h4>
                <div className="space-y-3">
                  {(selectedOrderModal.items || [
                    {
                      name: selectedOrderModal.product_name || 'DARK BLUE WIDE LEG TAILORED SET',
                      quantity: selectedOrderModal.quantity || 1,
                      price: selectedOrderModal.total || selectedOrderModal.total_amount || 10990,
                      image: selectedOrderModal.image || '/assets/Images/Blue02.png'
                    }
                  ]).map((item, i) => {
                    const modalImg = getSupabaseMediaUrl(item.image || item.image_url || (item.product && item.product.image) || selectedOrderModal.image);
                    const itemIsCancelled = (item.status || selectedOrderModal.status || '').toLowerCase().includes('cancel');

                    return (
                      <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-200/60 text-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={modalImg}
                            alt={item.name || item.title || 'Product'}
                            className="w-12 h-14 object-contain rounded-md border bg-white p-0.5"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = getSupabaseMediaUrl('Images/Blue02.png');
                            }}
                          />
                          <div>
                            <p className="font-bold text-neutral-900">{item.name || item.title || 'Atelier Item'}</p>
                            <p className="text-neutral-500 font-medium">Quantity: {item.quantity || 1}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-neutral-900 block">₹{Number(item.price || 0).toLocaleString('en-IN')}</span>
                          {itemIsCancelled && (
                            <span className="text-[9px] font-bold text-red-600 uppercase bg-red-50 border border-red-200 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                              Cancelled
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-4 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const ordToView = selectedOrderModal;
                    setSelectedOrderModal(null);
                    navigate('/checkout', { state: { viewOrder: ordToView } });
                  }}
                  className="px-4 py-2 border border-neutral-300 hover:border-black text-xs font-semibold tracking-wider uppercase text-neutral-700 hover:text-black rounded-xl transition-colors cursor-pointer"
                >
                  Open Full Order Page
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOrderModal(null)}
                  className="px-6 py-2.5 bg-brand-dark text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors cursor-pointer"
                >
                  Close
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
