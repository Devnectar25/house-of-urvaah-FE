import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, MapPin, Plus, Trash2, Pencil, Check, X, Shield, Lock, Ticket, Package, Heart, LogOut, Truck, CheckCircle2, RotateCcw, XCircle, ShoppingBag, AlertCircle, ChevronDown, Clock, PackageCheck, FileText, RefreshCw, ChevronLeft, ChevronRight, Star, Building2, Banknote } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import apiClient from '../lib/apiClient';
import { SEOHead } from '../components/common/SEOHead';
import { INDIAN_STATES, findMatchedState } from '../data/indianStates';
import { getSupabaseMediaUrl } from '../lib/supabase';
import { InvoiceModal } from '../components/common/InvoiceModal';
import { ShipmentTrackingModal } from '../components/common/ShipmentTrackingModal';
import { ProductCard } from '../components/common/ProductCard';
import { BEST_SELLERS_PRODUCTS, MOCK_PRODUCTS } from '../data/mockProducts';
import { productApi } from '../services/productApi';
import { subscribeToOrderUpdates, broadcastOrderUpdate } from '../lib/orderSync';
import Swal from 'sweetalert2';

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

const VALID_TABS = ['VIEW ORDERS', 'VIEW WISHLIST', /* 'MY COUPONS', */ 'ACCOUNT DETAILS'];

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
  const { user, authLoading, logoutUser, updateUserProfile, openAuthModal, wishlist, addToCart, setSelectedCartItemKeys } = useCart();
  const [selectedOrderModal, setSelectedOrderModal] = useState(null);
  const [activeTrackingModal, setActiveTrackingModal] = useState(null);

  const handleReorderOrder = async (ord) => {
    if (!ord || !ord.items || !Array.isArray(ord.items) || ord.items.length === 0) {
      return;
    }

    try {
      const targetKeys = [];
      for (const item of ord.items) {
        const rawId = item.product?.id || item.id || item.productId || '1';
        const sizeToUse = item.selectedSize || item.size || 'M';
        const qtyToUse = Math.max(1, Number(item.quantity || 1));

        const prodObj = {
          ...(item.product || {}),
          id: String(rawId),
          name: item.name || item.title || item.product?.name || 'Product',
          title: item.name || item.title || item.product?.title || 'Product',
          price: Number(item.price || item.product?.price || 0),
          image: item.image || item.product?.image || '/assets/Images/Brown01.png',
          stockQuantity: 99,
          stock_quantity: 99,
          stock: 99,
          inStock: true,
          instock: true,
          is_active: true
        };

        targetKeys.push(`${String(rawId).trim()}_${String(sizeToUse).trim()}`);

        if (addToCart) {
          await addToCart(prodObj, sizeToUse, {
            quantity: qtyToUse,
            selectOnlyThis: false,
            openDrawer: false
          });
        }
      }

      if (setSelectedCartItemKeys && targetKeys.length > 0) {
        setSelectedCartItemKeys(targetKeys);
      }

      sessionStorage.removeItem('urvaah_last_placed_order');
      sessionStorage.removeItem('hou_last_order_num');

      navigate('/checkout');
    } catch (err) {
      console.error('Account reorder error:', err);
    }
  };

  // Cancel Order Modal State
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [selectedCancelItems, setSelectedCancelItems] = useState([]);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelComments, setCancelComments] = useState('');
  const [isSubmittingCancellation, setIsSubmittingCancellation] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [returnBankDetails, setReturnBankDetails] = useState({
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    holderName: ''
  });
  const [bankDetailsError, setBankDetailsError] = useState('');

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => {
        setToastMsg(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  const handleCancelOrderInAccount = (ord) => {
    setCancelModalOrder(ord);
    setSelectedCancelItems([]);
    setCancelReason('');
    setCancelComments('');
    setReturnBankDetails({
      accountNumber: ord?.refund_bank_account || '',
      confirmAccountNumber: ord?.refund_bank_account || '',
      ifscCode: ord?.refund_ifsc_code || '',
      holderName: ord?.refund_holder_name || ord?.customer_name || user?.name || ''
    });
    setBankDetailsError('');
  };

  const handleCloseCancelModal = () => {
    if (isSubmittingCancellation) return;
    setCancelModalOrder(null);
    setSelectedCancelItems([]);
    setCancelReason('');
    setCancelComments('');
    setReturnBankDetails({
      accountNumber: '',
      confirmAccountNumber: '',
      ifscCode: '',
      holderName: ''
    });
    setBankDetailsError('');
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

  const isDeliveredModalOrder = Boolean(
    cancelModalOrder && (
      (cancelModalOrder.status || '').toLowerCase().includes('delivered') ||
      (cancelModalOrder.status || '').toLowerCase().includes('completed')
    )
  );

  // Refund Situation: Either post-delivery return (COD or Prepaid) OR pre-delivery online paid cancellation
  const isRefundSituation = Boolean(cancelModalOrder && (isDeliveredModalOrder || !isCODOrder));

  const isBankValid = !isRefundSituation || (
    returnBankDetails.holderName.trim().length > 0 &&
    returnBankDetails.accountNumber.trim().length >= 6 &&
    returnBankDetails.confirmAccountNumber.trim() === returnBankDetails.accountNumber.trim() &&
    returnBankDetails.ifscCode.trim().length >= 4
  );

  const isFormFilled = selectedCancelItems.length > 0 && 
                       cancelReason.trim().length > 0 && 
                       isBankValid;

  const handleSubmitCancellation = async () => {
    if (!cancelModalOrder || !isFormFilled) return;

    if (isRefundSituation) {
      if (!returnBankDetails.holderName.trim()) {
        setBankDetailsError('Please enter the Account Holder Name.');
        return;
      }
      if (!returnBankDetails.accountNumber.trim() || returnBankDetails.accountNumber.trim().length < 6) {
        setBankDetailsError('Please enter a valid Bank Account Number (minimum 6 digits).');
        return;
      }
      if (returnBankDetails.accountNumber.trim() !== returnBankDetails.confirmAccountNumber.trim()) {
        setBankDetailsError('Bank Account Numbers do not match.');
        return;
      }
      if (!returnBankDetails.ifscCode.trim() || returnBankDetails.ifscCode.trim().length < 4) {
        setBankDetailsError('Please enter a valid Bank IFSC code.');
        return;
      }
    }

    setIsSubmittingCancellation(true);
    setBankDetailsError('');
    const ord = cancelModalOrder;
    const orderNum = ord.order_number || ord.orderNumber || ord.id;
    const endpoint = `/api/orders/${orderNum}/cancel`;
    const targetStatus = isDeliveredModalOrder ? 'Return Requested' : 'Cancellation Requested';

    try {
      const cleanBankDetails = isRefundSituation ? {
        accountNumber: returnBankDetails.accountNumber.trim(),
        ifscCode: returnBankDetails.ifscCode.trim().toUpperCase(),
        holderName: returnBankDetails.holderName.trim()
      } : null;

      await apiClient(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          cancelReason,
          comments: cancelComments,
          itemIds: selectedCancelItems,
          bankDetails: cleanBankDetails
        })
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === ord.id || o.order_number === orderNum ? {
          ...o,
          status: targetStatus,
          cancel_reason: cancelReason,
          return_reason: isDeliveredModalOrder ? cancelReason : o.return_reason,
          refund_bank_account: cleanBankDetails?.accountNumber || o.refund_bank_account,
          refund_ifsc_code: cleanBankDetails?.ifscCode || o.refund_ifsc_code,
          refund_holder_name: cleanBankDetails?.holderName || o.refund_holder_name
        } : o))
      );

      // Broadcast update across admin panel and all tabs dynamically
      broadcastOrderUpdate({
        id: ord.id,
        orderNumber: orderNum,
        order_number: orderNum,
        status: targetStatus,
        cancel_reason: cancelReason,
        return_reason: isDeliveredModalOrder ? cancelReason : ord.return_reason
      });

      setToastMsg({
        text: isDeliveredModalOrder ? 'Return request submitted for atelier review.' : 'Cancellation request submitted for admin review.',
        type: 'success'
      });
    } catch (e) {
      console.warn('Order action error:', e.message);
      setToastMsg({ text: e.message || 'Failed to submit request.', type: 'error' });
    } finally {
      setIsSubmittingCancellation(false);
      setCancelModalOrder(null);
      setSelectedCancelItems([]);
      setCancelReason('');
      setCancelComments('');
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  // Product Replacement Modal State
  const [replaceModalOrder, setReplaceModalOrder] = useState(null);
  const [selectedReplaceItems, setSelectedReplaceItems] = useState([]);
  const [replaceReason, setReplaceReason] = useState('Size or fit issue - need different size');
  const [replacementSize, setReplacementSize] = useState('M');
  const [replaceComments, setReplaceComments] = useState('');
  const [isSubmittingReplacement, setIsSubmittingReplacement] = useState(false);

  // Return or Replace Choice Modal State (Unified Post-Delivery Action)
  const [returnReplaceModalOrder, setReturnReplaceModalOrder] = useState(null);

  const handleOpenReturnReplaceModal = (ord) => {
    setReturnReplaceModalOrder(ord);
  };

  const handleCloseReturnReplaceModal = () => {
    setReturnReplaceModalOrder(null);
  };

  useModalScrollLock(Boolean(cancelModalOrder || replaceModalOrder || returnReplaceModalOrder), () => {
    if (!isSubmittingCancellation && cancelModalOrder) handleCloseCancelModal();
    if (!isSubmittingReplacement && replaceModalOrder) handleCloseReplaceModal();
    if (returnReplaceModalOrder) handleCloseReturnReplaceModal();
  });

  const handleReplaceOrderInAccount = (ord) => {
    setReplaceModalOrder(ord);
    const items = ord.items && Array.isArray(ord.items) && ord.items.length > 0 ? ord.items : [];
    const firstItemId = items.length > 0 ? (items[0].id || items[0]._id || items[0].productId || 'item-0') : 'item-0';
    setSelectedReplaceItems([firstItemId]);
    setReplaceReason('Size or fit issue - need different size');
    setReplacementSize('M');
    setReplaceComments('');
  };

  const handleCloseReplaceModal = () => {
    if (isSubmittingReplacement) return;
    setReplaceModalOrder(null);
    setSelectedReplaceItems([]);
    setReplaceReason('Size or fit issue - need different size');
    setReplacementSize('M');
    setReplaceComments('');
  };

  const handleToggleReplaceItem = (itemId) => {
    setSelectedReplaceItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const replaceModalItems = replaceModalOrder
    ? (replaceModalOrder.items && Array.isArray(replaceModalOrder.items) && replaceModalOrder.items.length > 0)
      ? replaceModalOrder.items
      : [
          {
            id: replaceModalOrder.product_id || replaceModalOrder.id || 'item-1',
            name: replaceModalOrder.product_name || replaceModalOrder.name || 'Atelier Product',
            price: replaceModalOrder.price || replaceModalOrder.total || 0,
            quantity: replaceModalOrder.quantity || 1,
            image: replaceModalOrder.image || replaceModalOrder.image_url || '/assets/Images/Brown01.png',
            selectedSize: replaceModalOrder.selectedSize || 'M'
          }
        ]
    : [];

  const handleSubmitReplacement = async () => {
    if (!replaceModalOrder || selectedReplaceItems.length === 0 || !replaceReason.trim()) return;
    setIsSubmittingReplacement(true);
    const ord = replaceModalOrder;
    const orderNum = ord.order_number || ord.orderNumber || ord.id;
    const endpoint = `/api/orders/${orderNum}/replace`;
    const targetStatus = 'Replacement Request Processing';

    const fullReason = `Replacement: ${replaceReason} (Preferred Size: ${replacementSize})${replaceComments.trim() ? ` - Notes: ${replaceComments.trim()}` : ''}`;

    try {
      await apiClient(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          type: 'Replacement',
          cancelReason: fullReason,
          reason: fullReason,
          replacementSize,
          comments: replaceComments,
          itemIds: selectedReplaceItems
        })
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === ord.id || o.order_number === orderNum ? { ...o, status: targetStatus, cancel_reason: fullReason, return_type: 'Replacement' } : o))
      );

      // Broadcast update across admin panel and all tabs dynamically
      broadcastOrderUpdate({
        id: ord.id,
        orderNumber: orderNum,
        order_number: orderNum,
        status: targetStatus,
        cancel_reason: fullReason
      });

      setToastMsg({
        text: 'Replacement request submitted for atelier review.',
        type: 'success'
      });
    } catch (e) {
      console.warn('Replacement action error:', e.message);
      setToastMsg({ text: e.message || 'Failed to submit replacement request.', type: 'error' });
    } finally {
      setIsSubmittingReplacement(false);
      setReplaceModalOrder(null);
      setSelectedReplaceItems([]);
      setReplaceReason('Size or fit issue - need different size');
      setReplacementSize('M');
      setReplaceComments('');
      setTimeout(() => setToastMsg(null), 4000);
    }
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
  const [profileErrors, setProfileErrors] = useState({});

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

  // Orders state & pagination (10 orders per page)
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);
  const [orderPage, setOrderPage] = useState(1);
  const ordersPerPage = 10;

  const totalOrderPages = Math.max(1, Math.ceil((orders?.length || 0) / ordersPerPage));
  const paginatedOrders = useMemo(() => {
    const list = Array.isArray(orders) ? orders : [];
    const startIndex = (orderPage - 1) * ordersPerPage;
    return list.slice(startIndex, startIndex + ordersPerPage);
  }, [orders, orderPage, ordersPerPage]);

  useModalScrollLock(Boolean(isAddressModalOpen || showSignOutModal || selectedOrderModal), () => {
    if (!addressSaving && isAddressModalOpen) setIsAddressModalOpen(false);
    if (!isSigningOut && showSignOutModal) setShowSignOutModal(false);
    if (selectedOrderModal) setSelectedOrderModal(null);
  });

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

  // Fetch orders when user loads and when tab switches to VIEW ORDERS (supports silent mode)
  const fetchUserOrders = async (silent = false) => {
    if (!user) return;
    if (!silent) {
      setOrdersLoading(true);
    }
    try {
      const res = await apiClient('/api/orders/my-orders');
      if (res && res.success && Array.isArray(res.data)) {
        // Exclude internal child replacement orders (-REP) so only single primary order displays
        const cleanOrders = res.data.filter((o) => {
          const num = o.order_number || o.orderNumber || '';
          return !num.endsWith('-REP') && !num.startsWith('HOU-REP-');
        });
        setOrders(cleanOrders);
      }
    } catch (err) {
      console.warn('Could not fetch orders:', err.message);
    } finally {
      if (!silent) {
        setOrdersLoading(false);
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserOrders();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'VIEW ORDERS' && user) {
      fetchUserOrders();
    }
  }, [activeTab]);

  // Real-time synchronization: update orders dynamically when admin or other session updates status
  useEffect(() => {
    const unsubscribe = subscribeToOrderUpdates((payload) => {
      if (!payload) return;
      const targetId = payload.id;
      const targetNum = payload.order_number || payload.orderNumber;

      setOrders((prevOrders) =>
        prevOrders.map((o) => {
          const match =
            (targetId && (o.id === targetId || o._id === targetId)) ||
            (targetNum && (o.order_number === targetNum || o.orderNumber === targetNum));

          if (match && payload.status) {
            return {
              ...o,
              status: payload.status,
              payment_status: payload.payment_status || payload.paymentStatus || o.payment_status,
              paymentStatus: payload.payment_status || payload.paymentStatus || o.payment_status,
              cancel_reason: payload.cancel_reason || payload.cancelReason || o.cancel_reason,
              shipping_address: payload.shipping_address || o.shipping_address
            };
          }
          return o;
        })
      );
    });

    return () => unsubscribe();
  }, []);

  // Window focus listener for silent real-time sync (NO automatic 5s/6s polling interval)
  useEffect(() => {
    if (activeTab !== 'VIEW ORDERS' || !user) return;

    const handleFocus = () => {
      fetchUserOrders(true);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
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
    // { name: 'MY COUPONS', icon: Ticket },
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

  const handleStartEditProfile = () => {
    setFullNameInput(user?.name || '');
    setPhoneInput((user?.phone || '').replace(/\D/g, '').slice(0, 10));
    setProfileErrors({});
    setIsEditingProfile(true);
  };

  const handleCancelEditProfile = () => {
    setFullNameInput(user?.name || '');
    setPhoneInput(user?.phone || '');
    setProfileErrors({});
    setIsEditingProfile(false);
  };

  const handlePhoneInputChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length === 12 && val.startsWith('91')) {
      val = val.slice(2);
    }
    val = val.slice(0, 10);
    setPhoneInput(val);

    if (profileErrors.phone) {
      if (!val) {
        setProfileErrors((prev) => ({ ...prev, phone: 'Phone number is required.' }));
      } else if (val.length !== 10) {
        setProfileErrors((prev) => ({ ...prev, phone: 'Phone number must be exactly 10 digits.' }));
      } else if (!/^[6-9]\d{9}$/.test(val)) {
        setProfileErrors((prev) => ({ ...prev, phone: 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.' }));
      } else {
        setProfileErrors((prev) => ({ ...prev, phone: '' }));
      }
    }
  };

  const handleFullNameInputChange = (e) => {
    const val = e.target.value;
    setFullNameInput(val);

    if (profileErrors.fullName) {
      const trimmed = val.trim();
      if (!trimmed) {
        setProfileErrors((prev) => ({ ...prev, fullName: 'Full name is required.' }));
      } else if (trimmed.length < 2) {
        setProfileErrors((prev) => ({ ...prev, fullName: 'Full name must be at least 2 characters.' }));
      } else if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) {
        setProfileErrors((prev) => ({ ...prev, fullName: 'Full name should only contain letters and spaces.' }));
      } else {
        setProfileErrors((prev) => ({ ...prev, fullName: '' }));
      }
    }
  };

  const validateProfileForm = () => {
    const errors = {};
    const cleanName = (fullNameInput || '').trim();
    if (!cleanName) {
      errors.fullName = 'Full name is required.';
    } else if (cleanName.length < 2) {
      errors.fullName = 'Full name must be at least 2 characters.';
    } else if (!/^[a-zA-Z\s.'-]+$/.test(cleanName)) {
      errors.fullName = 'Full name should only contain letters and spaces.';
    }

    const cleanPhone = (phoneInput || '').replace(/\D/g, '');
    if (!cleanPhone) {
      errors.phone = 'Phone number is required.';
    } else if (cleanPhone.length !== 10) {
      errors.phone = 'Phone number must be exactly 10 digits.';
    } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errors.phone = 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.';
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!validateProfileForm()) {
      return;
    }

    setProfileSaving(true);
    setProfileMessage('');

    const cleanPhone = phoneInput.replace(/\D/g, '').slice(0, 10);
    const cleanName = fullNameInput.trim();

    const res = await updateUserProfile({
      fullName: cleanName,
      phone: cleanPhone
    });

    setProfileSaving(false);
    if (res.success) {
      setIsEditingProfile(false);
      setProfileErrors({});
      setProfileMessage('Account details successfully updated.');
      setTimeout(() => setProfileMessage(''), 3000);
    } else {
      setProfileMessage(res.error || 'Failed to update details. Please try again.');
    }
  };

  const openAddAddressModal = () => {
    if (addresses.length >= 4) {
      setToastMsg({
        type: 'error',
        text: 'Maximum 4 delivery addresses allowed. Please edit or delete an existing address.'
      });
      return;
    }
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
    } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errors.phone = 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.';
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
    if (!editingAddressId && addresses.length >= 4) {
      setToastMsg({
        type: 'error',
        text: 'Maximum 4 delivery addresses allowed. Please edit or delete an existing address.'
      });
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
    if (addresses.length <= 1) {
      setToastMsg({
        type: 'error',
        text: 'At least 1 delivery address is required. You cannot delete your only saved address.'
      });
      return;
    }
    const item = addresses[idx];
    if (item?.id && !String(item.id).startsWith('local-')) {
      try {
        const res = await apiClient(`/api/addresses/${item.id}`, { method: 'DELETE' });
        if (res && res.message && !res.success) {
          setToastMsg({ type: 'error', text: res.message });
          return;
        }
        await loadProfileAndAddresses();
        setToastMsg({ type: 'success', text: 'Address removed successfully.' });
        return;
      } catch (err) {
        console.error('Failed to delete address via backend API:', err);
        setToastMsg({ type: 'error', text: err.message || 'Failed to delete address.' });
        return;
      }
    }
    const updatedList = addresses.filter((_, i) => i !== idx);
    const res = await updateUserProfile({ addresses: updatedList });
    if (res.success) {
      setAddresses(updatedList);
      setToastMsg({ type: 'success', text: 'Address removed successfully.' });
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
                <div className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 shadow-2xs ${
                  isDeliveredModalOrder ? 'border-neutral-800 bg-neutral-900 text-white' : 'border-red-200 bg-red-50 text-red-600'
                }`}>
                  {isDeliveredModalOrder ? <RotateCcw className="w-4 h-4 stroke-[2.2]" /> : <XCircle className="w-4 h-4 stroke-[2.2]" />}
                </div>
                <h3 className="text-xl font-serif tracking-[0.1em] uppercase text-black font-semibold">
                  {isDeliveredModalOrder ? 'Return & Refund Request' : 'Cancel Order'}
                </h3>
              </div>
              <p className="text-xs text-neutral-500 font-sans tracking-wide leading-relaxed mb-5">
                {isDeliveredModalOrder
                  ? 'Request a return for your delivered atelier piece(s). Our concierge team will coordinate reverse pickup and process your 100% full refund.'
                  : "We're sorry to see you cancel. Please tell us why you're cancelling your order."}
              </p>

              <div className="space-y-4">
                {/* Select Products */}
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
                                  ? (isDeliveredModalOrder ? 'bg-black text-white' : 'bg-red-600 text-white')
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

                          {/* Selected Badge */}
                          {isSelected && (
                            <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                              isDeliveredModalOrder
                                ? 'text-neutral-800 border-neutral-300 bg-neutral-100'
                                : 'text-red-500 border-red-200 bg-red-50'
                            }`}>
                              {isDeliveredModalOrder ? 'Returning' : 'Cancelling'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reason for Return / Cancellation */}
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                    {isDeliveredModalOrder ? 'Reason for Return' : 'Reason for Cancellation'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full appearance-none px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-700 focus:outline-none focus:border-neutral-400 cursor-pointer pr-10"
                    >
                      <option value="" disabled>Select a reason</option>
                      {isDeliveredModalOrder ? (
                        <>
                          <option value="Size or fit issue">Size or fit issue</option>
                          <option value="Defective or damaged piece received">Defective or damaged piece received</option>
                          <option value="Quality or fabric not as expected">Quality or fabric not as expected</option>
                          <option value="Received incorrect item or color">Received incorrect item or color</option>
                          <option value="Did not match online images">Did not match online images</option>
                          <option value="Changed my mind">Changed my mind</option>
                          <option value="Other">Other</option>
                        </>
                      ) : (
                        <>
                          <option value="Ordered by mistake">Ordered by mistake</option>
                          <option value="Found better price elsewhere">Found better price elsewhere</option>
                          <option value="Delivery taking too long">Delivery taking too long</option>
                          <option value="Changed my mind">Changed my mind</option>
                          <option value="Item not needed anymore">Item not needed anymore</option>
                          <option value="Incorrect size or color ordered">Incorrect size or color ordered</option>
                          <option value="Other">Other</option>
                        </>
                      )}
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
                    placeholder={isDeliveredModalOrder ? "Provide any return or pickup notes..." : "Any additional details?"}
                    className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-700 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 resize-none"
                  />
                </div>

                {/* Bank Details for Refund Disbursement */}
                {isRefundSituation && (
                  <div className="p-4 sm:p-5 bg-[#FAF9F5] border border-neutral-200/90 rounded-2xl space-y-3.5">
                    <div className="flex items-center justify-between border-b border-neutral-200/70 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-neutral-800" />
                        <span className="text-xs font-serif font-bold uppercase tracking-[0.12em] text-neutral-900">
                          Bank Details for Refund Disbursement
                        </span>
                      </div>
                      <span className="text-[10px] font-sans font-bold text-neutral-600 uppercase tracking-widest bg-white border border-neutral-200 px-2 py-0.5 rounded-full shadow-2xs">
                        Required for Refund
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-500 font-sans leading-relaxed">
                      Please enter your verified bank details. Once your {isDeliveredModalOrder ? 'return is received and verified' : 'cancellation is approved'}, your refund of <strong className="text-neutral-900 font-semibold font-serif">₹{estimatedRefund.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> will be credited directly to this bank account via secure IMPS / NEFT transfer.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Account Holder Name */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-neutral-700 uppercase tracking-wider mb-1 font-sans">
                          Account Holder Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={returnBankDetails.holderName}
                          onChange={(e) => {
                            setReturnBankDetails(prev => ({ ...prev, holderName: e.target.value }));
                            setBankDetailsError('');
                          }}
                          placeholder="Name exactly as registered with bank"
                          className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 font-sans"
                        />
                      </div>

                      {/* Account Number */}
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-700 uppercase tracking-wider mb-1 font-sans">
                          Bank Account Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={returnBankDetails.accountNumber}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\s+/g, '');
                            setReturnBankDetails(prev => ({ ...prev, accountNumber: val }));
                            setBankDetailsError('');
                          }}
                          placeholder="e.g. 50100234567890"
                          className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 font-mono"
                        />
                      </div>

                      {/* Confirm Account Number */}
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-700 uppercase tracking-wider mb-1 font-sans">
                          Confirm Account Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={returnBankDetails.confirmAccountNumber}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\s+/g, '');
                            setReturnBankDetails(prev => ({ ...prev, confirmAccountNumber: val }));
                            setBankDetailsError('');
                          }}
                          placeholder="Re-enter Account Number"
                          className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none font-mono ${
                            returnBankDetails.confirmAccountNumber && returnBankDetails.confirmAccountNumber !== returnBankDetails.accountNumber
                              ? 'border-red-400 focus:border-red-500'
                              : 'border-neutral-200 focus:border-neutral-400'
                          }`}
                        />
                      </div>

                      {/* Bank IFSC Code */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-neutral-700 uppercase tracking-wider mb-1 font-sans">
                          Bank IFSC Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={returnBankDetails.ifscCode}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\s+/g, '').toUpperCase();
                            setReturnBankDetails(prev => ({ ...prev, ifscCode: val }));
                            setBankDetailsError('');
                          }}
                          placeholder="e.g. HDFC0001234"
                          maxLength={11}
                          className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 font-mono uppercase"
                        />
                      </div>
                    </div>

                    {/* Mismatch Warning */}
                    {returnBankDetails.confirmAccountNumber && returnBankDetails.confirmAccountNumber !== returnBankDetails.accountNumber && (
                      <p className="text-[11px] text-red-600 font-medium">
                        * Account numbers do not match. Please verify.
                      </p>
                    )}

                    {bankDetailsError && (
                      <p className="text-[11px] text-red-600 font-medium bg-red-50 p-2 rounded-lg border border-red-200">
                        {bankDetailsError}
                      </p>
                    )}
                  </div>
                )}

                {/* Note Banner */}
                <div className={`border rounded-2xl p-3.5 sm:p-4 flex items-start gap-3 ${
                  isDeliveredModalOrder ? 'bg-indigo-50/70 border-indigo-200' : 'bg-amber-50/70 border-amber-200'
                }`}>
                  {isDeliveredModalOrder ? (
                    <Truck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider block text-amber-800">
                      CANCELLATION APPROVAL FLOW
                    </span>
                    <p className="text-[11px] sm:text-xs leading-relaxed font-normal text-amber-950">
                      {isDeliveredModalOrder
                        ? 'Your post-delivery cancellation request will be submitted to our atelier team for review. Upon approval, pickup back to House of Urvaah is scheduled and your refund will be processed via the Refund Desk.'
                        : isCODOrder
                        ? 'Your request will be submitted for admin review prior to delivery. Once approved, this Cash on Delivery order will be cancelled with no payment due.'
                        : 'Your request will be submitted to our atelier team for approval. Upon approval, online/UPI payments will be routed directly to our Refund Desk for full disbursement.'}
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
                    Keep order
                  </button>

                  {isFormFilled ? (
                    <button
                      type="button"
                      onClick={handleSubmitCancellation}
                      disabled={isSubmittingCancellation}
                      className={`px-6 py-3 text-white text-xs font-sans font-bold tracking-[0.2em] uppercase rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 ${
                        isDeliveredModalOrder ? 'bg-neutral-900 hover:bg-black' : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      {isSubmittingCancellation
                        ? 'Submitting...'
                        : (isDeliveredModalOrder ? 'Submit Return Request' : 'Submit Cancellation Request')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="px-6 py-3 bg-neutral-200 text-neutral-400 text-xs font-sans font-bold tracking-[0.2em] uppercase rounded-xl cursor-not-allowed"
                    >
                      {isDeliveredModalOrder ? 'Submit Return Request' : 'Submit Cancellation Request'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Unified Return or Replace Choice Modal */}
      <AnimatePresence>
        {returnReplaceModalOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 selection:bg-neutral-900 font-sans">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseReturnReplaceModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-neutral-100 max-h-[90vh] overflow-y-auto no-scrollbar scrollbar-none text-left"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <button
                type="button"
                onClick={handleCloseReturnReplaceModal}
                className="absolute top-5 right-5 p-1 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4 stroke-[2]" />
              </button>

              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-8 h-8 rounded-full border border-neutral-300 bg-neutral-100 text-neutral-800 flex items-center justify-center shrink-0 shadow-2xs">
                  <RotateCcw className="w-4 h-4 stroke-[2.2]" />
                </div>
                <h3 className="text-lg sm:text-xl font-serif tracking-[0.1em] uppercase text-black font-semibold">
                  Return or Replace Piece
                </h3>
              </div>
              <p className="text-xs text-neutral-500 font-sans tracking-wide leading-relaxed mb-6">
                Your order <strong className="text-neutral-900">#{returnReplaceModalOrder.order_number || returnReplaceModalOrder.orderNumber}</strong> was successfully delivered. Choose how you would like to proceed:
              </p>

              <div className="space-y-4">
                {/* Option 1: Return & Refund */}
                <div
                  onClick={() => {
                    const ord = returnReplaceModalOrder;
                    setReturnReplaceModalOrder(null);
                    handleCancelOrderInAccount(ord);
                  }}
                  className="p-5 rounded-2xl border border-neutral-200 hover:border-black bg-white hover:bg-neutral-50/80 transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <RotateCcw className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-serif font-bold uppercase tracking-wider text-neutral-900">
                          Return & Refund
                        </h4>
                        <span className="text-[10px] font-sans font-bold text-neutral-500 tracking-wider uppercase bg-neutral-100 px-2 py-0.5 rounded-full">
                          Full Refund
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 font-sans leading-relaxed mt-1">
                        Return the delivered piece to House of Urvaah atelier. Reverse pickup will be arranged and 100% refund processed back to your payment account.
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-xs font-sans font-bold tracking-wider uppercase text-neutral-900 mt-3 no-underline group-hover:translate-x-1 transition-transform">
                        <span>Initiate Return</span>
                        <span className="text-sm">→</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Option 2: Replace / Exchange Piece */}
                <div
                  onClick={() => {
                    const ord = returnReplaceModalOrder;
                    setReturnReplaceModalOrder(null);
                    handleReplaceOrderInAccount(ord);
                  }}
                  className="p-5 rounded-2xl border border-purple-200 hover:border-purple-800 bg-purple-50/50 hover:bg-purple-50 transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-900 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <RefreshCw className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-serif font-bold uppercase tracking-wider text-purple-950">
                          Replace Product
                        </h4>
                        <span className="text-[10px] font-sans font-bold text-purple-700 tracking-wider uppercase bg-purple-100 px-2 py-0.5 rounded-full">
                          Size / Exchange
                        </span>
                      </div>
                      <p className="text-xs text-purple-900/80 font-sans leading-relaxed mt-1">
                        Exchange your delivered piece for another size or replacement item. Enjoy complimentary reverse pickup and priority dispatch.
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-xs font-sans font-bold tracking-wider uppercase text-purple-900 mt-3 no-underline group-hover:translate-x-1 transition-transform">
                        <span>Request Replacement</span>
                        <span className="text-sm">→</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleCloseReturnReplaceModal}
                  className="px-5 py-2.5 rounded-xl border border-neutral-300 hover:border-black bg-white text-neutral-700 hover:text-black text-xs font-sans font-semibold tracking-wider uppercase transition-colors cursor-pointer"
                >
                  Keep Order
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Replacement Popup Modal */}
      <AnimatePresence>
        {replaceModalOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 selection:bg-purple-500 font-sans">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseReplaceModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative z-10 w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 md:p-9 border border-neutral-100 max-h-[90vh] overflow-y-auto no-scrollbar scrollbar-none text-left"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={handleCloseReplaceModal}
                className="absolute top-5 right-5 p-1 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4 stroke-[2]" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 rounded-full border border-purple-200 bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 shadow-2xs">
                  <RefreshCw className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
                <h3 className="text-xl font-serif tracking-[0.1em] uppercase text-black font-semibold">
                  Request Product Replacement
                </h3>
              </div>
              <p className="text-xs text-neutral-500 font-sans tracking-wide leading-relaxed mb-5">
                Delivered pieces can be exchanged for a different size or replacement piece. Select the item, choose your preferred size, and our atelier concierge will coordinate reverse pickup and replacement delivery.
              </p>

              <div className="space-y-4">
                {/* Select Item to Replace */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-serif tracking-[0.12em] uppercase text-black font-semibold">
                      Select Item to Replace
                    </span>
                    <span className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest">
                      {selectedReplaceItems.length} OF {replaceModalItems.length} SELECTED
                    </span>
                  </div>

                  <div
                    className="space-y-2.5 max-h-56 overflow-y-auto no-scrollbar scrollbar-none pr-1"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {replaceModalItems.map((item, idx) => {
                      const itemId = item.id || item._id || item.productId || `item-${idx}`;
                      const isSelected = selectedReplaceItems.includes(itemId);
                      const itemImg = getSupabaseMediaUrl(item.image || (item.product && item.product.image) || item.image_url);
                      const itemPrice = Number(item.price || item.unit_price || 0);

                      return (
                        <div
                          key={itemId}
                          onClick={() => handleToggleReplaceItem(itemId)}
                          className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-purple-300 bg-purple-50/50'
                              : 'border-neutral-200/80 bg-white hover:border-neutral-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                                isSelected ? 'bg-purple-700 text-white' : 'border-2 border-neutral-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>

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

                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-neutral-800 truncate">
                                {item.name || item.title || 'Atelier Item'}
                              </p>
                              <p className="text-[11px] text-neutral-400 font-medium mt-0.5">
                                Current Size: {item.size || item.selectedSize || 'Standard'} • ₹{itemPrice.toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>

                          {isSelected && (
                            <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border text-purple-700 border-purple-200 bg-purple-100/70">
                              Replacing
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reason for Replacement */}
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                    Reason for Replacement <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={replaceReason}
                      onChange={(e) => setReplaceReason(e.target.value)}
                      className="w-full appearance-none px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-700 focus:outline-none focus:border-neutral-400 cursor-pointer pr-10"
                    >
                      <option value="Size or fit issue - need different size">Size or fit issue - need different size</option>
                      <option value="Defective or damaged piece received">Defective or damaged piece received</option>
                      <option value="Color or variant exchange">Color or variant exchange</option>
                      <option value="Fabric or styling not as expected">Fabric or styling not as expected</option>
                      <option value="Wrong piece delivered">Wrong piece delivered</option>
                      <option value="Other">Other</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Preferred Replacement Size */}
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                    Preferred Replacement Size <span className="text-purple-600">*</span>
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setReplacementSize(sz)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-sans font-semibold tracking-wider transition-all cursor-pointer ${
                          replacementSize === sz
                            ? 'bg-neutral-900 text-white shadow-xs'
                            : 'bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-400'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional Comments */}
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                    Notes for Atelier Concierge (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={replaceComments}
                    onChange={(e) => setReplaceComments(e.target.value)}
                    placeholder="Specify sizing specifics, preferred delivery times, or exchange details..."
                    className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-700 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 resize-none"
                  />
                </div>

                {/* Reverse Pickup & Replacement Notice */}
                <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-3.5 sm:p-4 flex items-start gap-3">
                  <Truck className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider block text-purple-900">
                      COMPLIMENTARY REVERSE PICKUP & EXCHANGE
                    </span>
                    <p className="text-[11px] sm:text-xs leading-relaxed font-normal text-purple-950">
                      Our courier will collect the piece from your delivery address with zero return fee. Upon verification by our atelier, your requested size ({replacementSize}) will be dispatched immediately.
                    </p>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseReplaceModal}
                    className="px-5 py-3 border border-neutral-300 hover:border-black bg-white text-neutral-700 hover:text-black text-xs font-sans font-semibold tracking-[0.2em] uppercase rounded-xl transition-colors cursor-pointer"
                  >
                    Keep Current Piece
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitReplacement}
                    disabled={isSubmittingReplacement || selectedReplaceItems.length === 0}
                    className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-sans font-bold tracking-[0.2em] uppercase rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingReplacement ? 'Submitting...' : 'Request Replacement'}
                  </button>
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
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`fixed bottom-6 right-6 z-[100] max-w-sm sm:max-w-md w-[calc(100%-3rem)] sm:w-auto px-5 py-3.5 rounded-xl shadow-2xl backdrop-blur-md flex items-center justify-between gap-4 font-sans border text-white ${
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
                    onClick={handleStartEditProfile}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase font-sans text-brand-dark hover:opacity-75 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>EDIT</span>
                  </button>
                ) : (
                  <button
                    onClick={handleCancelEditProfile}
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
                <form onSubmit={handleSaveProfile} noValidate className="space-y-6 font-sans">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold tracking-wider text-neutral-700 uppercase mb-2">
                        FULL NAME <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={fullNameInput}
                        onChange={handleFullNameInputChange}
                        className={`w-full px-4 py-3 text-sm bg-white border ${
                          profileErrors.fullName
                            ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                            : 'border-neutral-300 focus:border-brand-dark focus:ring-1 focus:ring-brand-dark'
                        } outline-none font-sans transition-colors`}
                        placeholder="Enter full name"
                      />
                      {profileErrors.fullName && (
                        <p className="text-[11px] text-red-600 mt-1.5 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{profileErrors.fullName}</span>
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold tracking-wider text-neutral-700 uppercase mb-2">
                        PHONE NUMBER <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          maxLength={10}
                          value={phoneInput}
                          onChange={handlePhoneInputChange}
                          className={`w-full px-4 py-3 text-sm bg-white border ${
                            profileErrors.phone
                              ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                              : 'border-neutral-300 focus:border-brand-dark focus:ring-1 focus:ring-brand-dark'
                          } outline-none font-sans transition-colors`}
                          placeholder="10-digit mobile number"
                        />
                        {phoneInput && (
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-neutral-400 font-mono pointer-events-none">
                            {phoneInput.length}/10
                          </span>
                        )}
                      </div>
                      {profileErrors.phone && (
                        <p className="text-[11px] text-red-600 mt-1.5 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{profileErrors.phone}</span>
                        </p>
                      )}
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
                      onClick={handleCancelEditProfile}
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
                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={openAddAddressModal}
                    disabled={addresses.length >= 4}
                    className={`inline-flex items-center justify-center gap-2 text-xs font-semibold tracking-widest px-5 py-2.5 uppercase transition-colors ${
                      addresses.length >= 4
                        ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                        : 'bg-brand-dark hover:bg-neutral-800 text-white cursor-pointer'
                    }`}
                    title={addresses.length >= 4 ? 'Maximum 4 addresses reached' : 'Add Address'}
                  >
                    <Plus className="w-4 h-4" />
                    <span>ADD ADDRESS</span>
                  </button>
                </div>
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
                            className="text-neutral-500 hover:text-black p-1 cursor-pointer transition-colors"
                            title="Edit Address"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(idx)}
                            className={`p-1 transition-colors ${
                              addresses.length <= 1
                                ? 'text-neutral-300 cursor-not-allowed opacity-40'
                                : 'text-neutral-400 hover:text-red-600 cursor-pointer'
                            }`}
                            title={addresses.length <= 1 ? "At least 1 address is required" : "Delete Address"}
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
                          className="mt-4 text-[11px] font-semibold text-brand-dark hover:text-neutral-600 tracking-wider uppercase block cursor-pointer transition-colors"
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
              <>
                <div className="space-y-6">
                {paginatedOrders.map((ord, idx) => {
                  const orderNum = ord.order_number || ord.orderNumber || `ORD-2026-${ord.id || Math.floor(100000 + Math.random() * 900000)}`;
                  const orderStatus = ord.status || 'Pending';
                  const statusLower = orderStatus.toLowerCase();
                  const isCancellationRequested = statusLower === 'cancellation requested' || statusLower === 'cancel_requested';

                  const isProductEverDelivered = Boolean(ord.delivered_at) || 
                    (ord.original_status || '').toLowerCase() === 'delivered' || 
                    Boolean(ord.is_product_received);

                  const isPreDeliveryCancelled = !isProductEverDelivered && (
                    statusLower === 'cancelled' || 
                    statusLower === 'canceled' || 
                    statusLower.includes('cancel') || 
                    Boolean(ord.cancel_reason) || 
                    (statusLower === 'refunded' && !statusLower.includes('return'))
                  );

                  const isCancelled = (isPreDeliveryCancelled || statusLower === 'cancelled' || statusLower === 'canceled' || statusLower.includes('cancel')) && !isCancellationRequested;

                  const isRefundCompleted = (ord.refund_status && ['completed', 'refunded', 'success'].includes(String(ord.refund_status).toLowerCase())) || 
                    statusLower === 'refunded' || 
                    ((ord.payment_status || ord.paymentStatus || '').toLowerCase() === 'refunded');

                  // Post-delivery Replacement Flow Identification
                  const isReplacementForwardOrder = orderNum.endsWith('-REP') || Boolean(ord.original_order_number);
                  const isReplacementIntent = !isReplacementForwardOrder && Boolean(
                    ord.replacement_size ||
                    ord.replacement_order_number ||
                    ord.replacement_order_id ||
                    statusLower.includes('replace') ||
                    (ord.cancel_reason || '').toLowerCase().includes('replace') ||
                    (ord.cancel_reason || '').toLowerCase().includes('exchange') ||
                    (ord.return_reason || '').toLowerCase().includes('replace') ||
                    (ord.return_reason || '').toLowerCase().includes('exchange')
                  );

                  // Post-delivery Return Flow States (Mutually exclusive from Replacement)
                  const logLower = (ord.logistics_status || ord.shipment_status || '').toLowerCase();
                  const hasReturnIntent = Boolean(
                    ord.return_type ||
                    statusLower.includes('return') ||
                    logLower.includes('return') ||
                    logLower.includes('reverse') ||
                    ord.return_pickup_scheduled ||
                    ord.return_reason
                  );

                  const isReturnRequested = hasReturnIntent && !isReplacementIntent && !isCancelled && !isCancellationRequested && (
                    statusLower === 'return requested' || 
                    statusLower === 'return request processing' || 
                    logLower === 'return initiated' ||
                    logLower === 'return requested'
                  );
                  const isReturnApproved = hasReturnIntent && !isReplacementIntent && !isCancelled && !isCancellationRequested && (
                    statusLower === 'return approved' || 
                    statusLower === 'return pickup scheduled' || 
                    (statusLower.includes('pickup scheduled') && (statusLower.includes('return') || logLower.includes('return'))) || 
                    logLower.includes('return pickup scheduled') || 
                    logLower.includes('reverse pickup scheduled')
                  );
                  const isReturnCollected = hasReturnIntent && !isReplacementIntent && !isCancelled && !isCancellationRequested && (
                    statusLower.includes('collected') || 
                    statusLower.includes('in transit to') || 
                    statusLower.includes('reverse transit') || 
                    logLower.includes('reverse transit') || 
                    (logLower.includes('collected') && hasReturnIntent)
                  );
                  const isReceivedAtUrvaah = hasReturnIntent && !isReplacementIntent && !isCancelled && !isCancellationRequested && (
                    statusLower === 'received at house of urvaah' || 
                    statusLower === 'received at urvaah house' || 
                    statusLower === 'received at homved' ||
                    logLower.includes('received at house of urvaah')
                  );
                  const isReturned = hasReturnIntent && !isReplacementIntent && !isCancelled && !isCancellationRequested && (
                    statusLower === 'returned' || 
                    statusLower === 'return completed' || 
                    (isProductEverDelivered && ord.refund_status && String(ord.refund_status).toLowerCase() === 'completed' && hasReturnIntent)
                  );
                  const isReturnRejected = hasReturnIntent && !isReplacementIntent && !isCancelled && !isCancellationRequested && (
                    statusLower === 'return rejected'
                  );
                  const isInReturnFlow = hasReturnIntent && (isReturnRequested || isReturnApproved || isReturnCollected || isReceivedAtUrvaah || isReturned || isReturnRejected);

                  // Post-delivery Replacement Flow States (Original parent order)
                  const isReplacementRequested = isReplacementIntent && !isCancelled && !isCancellationRequested && (statusLower === 'replacement request processing' || statusLower === 'replace requested' || statusLower === 'replacement requested');
                  const isReplacementApproved = isReplacementIntent && !isCancelled && !isCancellationRequested && (statusLower === 'replace approved' || statusLower === 'replacement approved' || (statusLower.includes('pickup scheduled') && (statusLower.includes('replace') || logLower.includes('replace'))));
                  const isReplacementCollected = isReplacementIntent && !isCancelled && !isCancellationRequested && (statusLower.includes('collected') || statusLower.includes('in transit to') || statusLower.includes('reverse transit') || logLower.includes('collected') || logLower.includes('reverse transit'));
                  const isReplacementQCReceived = isReplacementIntent && !isCancelled && !isCancellationRequested && (statusLower.includes('received at') || logLower.includes('received at') || logLower.includes('qc passed'));
                  const isReplacementInTransit = isReplacementCollected || (isReplacementIntent && (statusLower === 'replacement processing' || statusLower === 'replacement shipped' || statusLower === 'in reverse transit'));
                  const isReplacementOutForDelivery = isReplacementIntent && (statusLower === 'replacement out for delivery');
                  const isReplaced = isReplacementIntent && !isCancelled && !isCancellationRequested && (statusLower === 'replaced' || Boolean(ord.replacement_order_number));
                  const isReplacementRejected = isReplacementIntent && !isCancelled && !isCancellationRequested && (statusLower === 'replace rejected');
                  const isInReplacementFlow = isReplacementIntent;

                  const isDelivered = !isCancelled && !isCancellationRequested && (statusLower.includes('delivered') || statusLower.includes('completed')) && !isInReturnFlow && !isInReplacementFlow;
                  const isReplacementDelivered = isReplacementForwardOrder && !isCancelled && !isCancellationRequested && (statusLower.includes('delivered') || statusLower.includes('completed') || Boolean(ord.delivered_at));
                  const isInvoiceEligible = isDelivered || isReplacementDelivered;
                  const isOutForDelivery = !isCancelled && !isCancellationRequested && !isInReturnFlow && !isInReplacementFlow && (isDelivered || statusLower.includes('out') || statusLower.includes('delivery'));
                  const isShipped = !isCancelled && !isCancellationRequested && !isInReturnFlow && !isInReplacementFlow && (isOutForDelivery || statusLower.includes('shipped') || statusLower.includes('transit') || statusLower.includes('dispatched'));
                  const isDeliveredOrderEver = isProductEverDelivered || isDelivered;
                  const isCod = (ord.payment_method || ord.paymentMethod || '').toLowerCase() === 'cod' || (ord.payment_method || ord.paymentMethod || '').toLowerCase().includes('cash');
                  const isPaid = (isDeliveredOrderEver && isCod) || (ord.payment_status || ord.paymentStatus || '').toLowerCase() === 'paid' || (ord.payment_status || ord.paymentStatus || '').toLowerCase() === 'refunded' || isRefundCompleted;
                  const isOnlinePayment = !isCod;

                  // 24-hour shipping address editing eligibility
                  const orderCreatedTime = ord.created_at || ord.createddate ? new Date(ord.created_at || ord.createddate).getTime() : Date.now();
                  const diffHours = (Date.now() - orderCreatedTime) / (1000 * 60 * 60);
                  const isWithin24Hours = diffHours <= 24;
                  const hoursRemaining = Math.max(1, Math.ceil(24 - diffHours));
                  const isAddressLocked = isShipped || isOutForDelivery || isDelivered || isCancelled || isCancellationRequested || isInReturnFlow || isInReplacementFlow;
                  const canEditAddress = isWithin24Hours && !isAddressLocked;

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
                    <div key={ord.id || idx} className="bg-white border border-[#E7E2D8] rounded-2xl p-4 sm:p-7 shadow-[0_4px_25px_rgba(0,0,0,0.03)] font-sans text-left space-y-5 sm:space-y-6 hover:border-neutral-300 transition-all duration-300">
                      {/* Header Row */}
                      <div className="flex flex-wrap items-start justify-between gap-4 pb-2 border-b border-neutral-100">
                        <div>
                          <span className="text-[10px] font-sans font-bold tracking-[0.25em] uppercase text-neutral-400 block mb-0.5">
                            ORDER REFERENCE
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base sm:text-lg font-serif tracking-[0.06em] text-black font-semibold">
                              #{orderNum}
                            </h3>
                            {isReplacementForwardOrder && (
                              <span className="px-2.5 py-0.5 text-[10px] font-sans font-bold tracking-wider uppercase rounded-full bg-purple-100 text-purple-900 border border-purple-200 shadow-2xs">
                                Replacement Piece {ord.original_order_number ? `(For #${ord.original_order_number})` : ''}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 font-sans tracking-wide mt-0.5">{orderDateStr}</p>
                        </div>

                        <div className="flex items-center gap-2.5 flex-wrap">
                          {/* Status Badge */}
                          <span className={`px-3.5 py-1 text-[11px] font-sans font-semibold tracking-[0.16em] uppercase rounded-full border shadow-2xs flex items-center gap-1.5 ${
                            isCancellationRequested
                              ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                              : isCancelled
                              ? (isRefundCompleted ? 'bg-emerald-50 text-emerald-900 border-emerald-200 font-bold' : 'bg-red-50 text-red-800 border-red-200 font-bold')
                              : isReplacementForwardOrder
                              ? (isDelivered ? 'bg-emerald-50 text-emerald-900 border-emerald-200 font-bold' : isShipped ? 'bg-blue-50 text-blue-900 border-blue-200 font-bold' : 'bg-purple-100 text-purple-900 border-purple-300 font-bold')
                              : isReplacementRequested
                              ? 'bg-purple-100 text-purple-900 border-purple-300 font-bold'
                              : isReplacementApproved
                              ? 'bg-indigo-50 text-indigo-900 border-indigo-200 font-bold'
                              : isReplacementCollected
                              ? 'bg-blue-50 text-blue-900 border-blue-200 font-bold'
                              : isReplacementQCReceived
                              ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
                              : isReplaced
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-200 font-bold'
                              : isReplacementRejected
                              ? 'bg-rose-50 text-rose-900 border-rose-200'
                              : isReturnRequested
                              ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                              : isReturnApproved
                              ? 'bg-indigo-50 text-indigo-900 border-indigo-200 font-bold'
                              : isReceivedAtUrvaah
                              ? 'bg-blue-50 text-blue-900 border-blue-200 font-bold'
                              : isReturned
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-200 font-bold'
                              : isReturnRejected
                              ? 'bg-rose-50 text-rose-900 border-rose-200'
                              : isDelivered
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                              : isOutForDelivery
                              ? 'bg-blue-50 text-blue-900 border-blue-200'
                              : isShipped
                              ? 'bg-amber-50 text-amber-900 border-amber-200'
                              : 'bg-[#FAF8F3] text-neutral-800 border-[#E5E0D8]'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              isCancellationRequested || isReturnRequested || isReplacementRequested
                                ? 'bg-amber-600 animate-pulse'
                                : isCancelled
                                ? (isRefundCompleted ? 'bg-emerald-600' : 'bg-red-600')
                                : isReturnRejected || isReplacementRejected
                                ? 'bg-red-600'
                                : isReturnApproved || isReplacementApproved
                                ? 'bg-indigo-600 animate-pulse'
                                : isReceivedAtUrvaah || isReplacementCollected
                                ? 'bg-blue-600 animate-pulse'
                                : isReplacementQCReceived
                                ? 'bg-amber-600 animate-pulse'
                                : isReturned || isDelivered || isReplaced
                                ? 'bg-emerald-600'
                                : isOutForDelivery
                                ? 'bg-blue-600'
                                : isShipped
                                ? 'bg-amber-600'
                                : 'bg-amber-500 animate-pulse'
                            }`} />
                            <span>{
                              isCancellationRequested ? 'CANCELLATION REQUESTED' :
                              isCancelled ? (isRefundCompleted ? 'CANCELLED & REFUNDED' : 'CANCELLED') :
                              isReplacementForwardOrder ? (isDelivered ? 'REPLACEMENT DELIVERED' : isShipped ? 'REPLACEMENT DISPATCHED' : 'REPLACEMENT IN TAILORING') :
                              isReplacementRequested ? 'REPLACEMENT REQUESTED' :
                              isReplacementApproved ? 'REPLACEMENT APPROVED' :
                              isReplacementCollected ? 'PARCEL COLLECTED (REVERSE)' :
                              isReplacementQCReceived ? 'ATELIER QC VERIFIED' :
                              isReplaced ? 'REPLACEMENT DISPATCHED' :
                              isReplacementRejected ? 'REPLACEMENT REJECTED' :
                              isReturnRequested ? 'RETURN REQUESTED' :
                              isReturnCollected ? 'RETURN IN TRANSIT' :
                              isReturnApproved ? 'RETURN PICKUP SCHEDULED' :
                              isReceivedAtUrvaah ? 'RECEIVED AT ATELIER' :
                              isReturned ? 'RETURNED & REFUNDED' :
                              isReturnRejected ? 'RETURN REJECTED' :
                              orderStatus
                            }</span>
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
                                {isPaid ? (isRefundCompleted ? 'REFUND COMPLETED' : 'REFUND ISSUED') : 'COD SETTLED'}
                              </span>
                              <span className="text-[9px] text-emerald-600/80 font-sans tracking-tight mt-0.5 hidden sm:block">
                                {isPaid ? (isRefundCompleted ? '100% Refund Disbursed' : '100% Settled') : 'Zero Due'}
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
                                  {isPaid ? (isRefundCompleted ? '100% Refund Disbursed' : '100% Refunded') : 'Zero Payment'}
                                </span>
                              </div>
                              {isPaid ? (
                                <>
                                  <p className="text-[11px] text-neutral-600 leading-relaxed">
                                    Full 100% refund of <strong className="text-neutral-900 font-semibold">₹{Number(orderTotal).toLocaleString('en-IN')}</strong> {isRefundCompleted ? 'disbursed' : 'initiated'} to original payment source ({ord.payment_type || ord.payment_method || 'Online / UPI'}).
                                  </p>
                                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-500">
                                    <span>Settlement: <strong className="text-neutral-700">{isRefundCompleted ? 'Completed' : '3-5 Business Days'}</strong></span>
                                    <span>UTR Ref: <strong className="text-neutral-700">{ord.refund_txn_id || ord.refund_transaction_id || ord.refund_utr || `REF-${orderNum}`}</strong></span>
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
                      ) : isInReplacementFlow ? (
                        <div className="bg-[#FAF8F3] border border-purple-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs">
                          <div className="flex items-center justify-between mb-5">
                            <h4 className="text-[10px] font-serif tracking-[0.25em] text-purple-950 uppercase font-semibold flex items-center gap-2">
                              <RefreshCw className="w-3.5 h-3.5 text-purple-600" />
                              <span>REPLACEMENT & EXCHANGE JOURNEY</span>
                            </h4>
                            <span className="text-[10px] font-sans tracking-[0.15em] uppercase text-purple-700 font-medium">
                              STEP {isReplaced ? '4 OF 4' : (isReplacementOutForDelivery || isReplacementInTransit) ? '3 OF 4' : isReplacementApproved ? '2 OF 4' : '1 OF 4'}
                            </span>
                          </div>

                          <div className="grid grid-cols-4 gap-2 relative">
                            {/* Background Line */}
                            <div className="absolute top-4 left-[12%] right-[12%] h-1 bg-neutral-200/90 z-0 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-purple-700 transition-all duration-500"
                                style={{
                                  width: isReplaced
                                    ? '100%'
                                    : (isReplacementOutForDelivery || isReplacementInTransit)
                                    ? '66%'
                                    : isReplacementApproved
                                    ? '33%'
                                    : '0%'
                                }}
                              />
                            </div>

                            {/* Step 1: REPLACEMENT REQUESTED */}
                            <div className="flex flex-col items-center text-center z-10">
                              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold shadow-xs bg-purple-700 text-white ring-4 ring-purple-100">
                                <Check className="w-4 h-4 stroke-[2.5]" />
                              </div>
                              <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.16em] uppercase mt-2.5 font-sans text-black">
                                REQUESTED
                              </span>
                            </div>

                            {/* Step 2: ATELIER APPROVED */}
                            <div className="flex flex-col items-center text-center z-10">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all ${
                                isReplacementApproved || isReplacementInTransit || isReplacementOutForDelivery || isReplaced
                                  ? 'bg-purple-700 text-white ring-4 ring-purple-100 shadow-xs'
                                  : 'bg-white border-2 border-neutral-300 text-neutral-400'
                              }`}>
                                <CheckCircle2 className="w-4 h-4 stroke-[1.8]" />
                              </div>
                              <span className={`text-[9px] sm:text-[10px] tracking-[0.16em] uppercase mt-2.5 font-sans ${
                                isReplacementApproved || isReplacementInTransit || isReplacementOutForDelivery || isReplaced ? 'font-bold text-black' : 'font-medium text-neutral-400'
                              }`}>
                                APPROVED
                              </span>
                            </div>

                            {/* Step 3: DISPATCH / IN TRANSIT */}
                            <div className="flex flex-col items-center text-center z-10">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all ${
                                isReplacementInTransit || isReplacementOutForDelivery || isReplaced
                                  ? 'bg-purple-700 text-white ring-4 ring-purple-100 shadow-xs'
                                  : 'bg-white border-2 border-neutral-300 text-neutral-400'
                              }`}>
                                <Truck className="w-4 h-4 stroke-[1.8]" />
                              </div>
                              <span className={`text-[9px] sm:text-[10px] tracking-[0.16em] uppercase mt-2.5 font-sans ${
                                isReplacementInTransit || isReplacementOutForDelivery || isReplaced ? 'font-bold text-black' : 'font-medium text-neutral-400'
                              }`}>
                                IN TRANSIT
                              </span>
                            </div>

                            {/* Step 4: REPLACED & DELIVERED */}
                            <div className="flex flex-col items-center text-center z-10">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all ${
                                isReplaced
                                  ? 'bg-emerald-700 text-white ring-4 ring-emerald-100 shadow-xs'
                                  : 'bg-white border-2 border-neutral-300 text-neutral-400'
                              }`}>
                                <PackageCheck className="w-4 h-4 stroke-[1.8]" />
                              </div>
                              <span className={`text-[9px] sm:text-[10px] tracking-[0.16em] uppercase mt-2.5 font-sans ${
                                isReplaced ? 'font-bold text-emerald-800' : 'font-medium text-neutral-400'
                              }`}>
                                REPLACED
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : isInReturnFlow ? (
                        <div className="bg-[#FAF8F3] border border-indigo-200/60 rounded-2xl p-5 sm:p-6 shadow-2xs">
                          <div className="flex items-center justify-between mb-5">
                            <h4 className="text-[10px] font-serif tracking-[0.25em] text-indigo-900 uppercase font-semibold flex items-center gap-2">
                              <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                              <span>RETURN & REVERSE PICKUP JOURNEY</span>
                            </h4>
                            <span className="text-[10px] font-sans tracking-[0.15em] uppercase text-indigo-700 font-medium">
                              STEP {isReceivedAtUrvaah || isReturned ? '5 OF 5' : isReturnCollected ? '4 OF 5' : isReturnApproved ? '3 OF 5' : '1 OF 5'}
                            </span>
                          </div>

                          <div className="grid grid-cols-5 gap-1.5 sm:gap-2 relative">
                            {/* Background Line */}
                            <div className="absolute top-4 left-[10%] right-[10%] h-1 bg-neutral-200/90 z-0 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-700 transition-all duration-500"
                                style={{
                                  width: isReceivedAtUrvaah || isReturned
                                    ? '100%'
                                    : isReturnCollected
                                    ? '75%'
                                    : isReturnApproved
                                    ? '50%'
                                    : '15%'
                                }}
                              />
                            </div>

                            {/* Step 1: RETURN REQUESTED */}
                            <div className="flex flex-col items-center text-center z-10">
                              <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-full flex items-center justify-center font-bold shadow-xs bg-indigo-700 text-white ring-4 ring-indigo-100">
                                <Check className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[2.5]" />
                              </div>
                              <span className="text-[8px] sm:text-[9px] font-bold tracking-[0.14em] uppercase mt-2 font-sans text-black">
                                REQUESTED
                              </span>
                            </div>

                            {/* Step 2: ATELIER APPROVED */}
                            <div className="flex flex-col items-center text-center z-10">
                              <div className={`w-8 sm:w-9 h-8 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all ${
                                isReturnApproved || isReturnCollected || isReceivedAtUrvaah || isReturned
                                  ? 'bg-indigo-700 text-white ring-4 ring-indigo-100 shadow-xs'
                                  : 'bg-white border-2 border-neutral-300 text-neutral-400'
                              }`}>
                                <CheckCircle2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[1.8]" />
                              </div>
                              <span className={`text-[8px] sm:text-[9px] tracking-[0.14em] uppercase mt-2 font-sans ${
                                isReturnApproved || isReturnCollected || isReceivedAtUrvaah || isReturned ? 'font-bold text-black' : 'font-medium text-neutral-400'
                              }`}>
                                APPROVED
                              </span>
                            </div>

                            {/* Step 3: DOORSTEP COURIER PICKUP */}
                            <div className="flex flex-col items-center text-center z-10">
                              <div className={`w-8 sm:w-9 h-8 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all ${
                                isReturnCollected || isReceivedAtUrvaah || isReturned
                                  ? 'bg-indigo-700 text-white ring-4 ring-indigo-100 shadow-xs'
                                  : isReturnApproved
                                  ? 'bg-amber-500 text-white ring-4 ring-amber-100 shadow-xs animate-pulse'
                                  : 'bg-white border-2 border-neutral-300 text-neutral-400'
                              }`}>
                                <Truck className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[1.8]" />
                              </div>
                              <span className={`text-[8px] sm:text-[9px] tracking-[0.14em] uppercase mt-2 font-sans ${
                                isReturnCollected || isReceivedAtUrvaah || isReturned
                                  ? 'font-bold text-black'
                                  : isReturnApproved
                                  ? 'font-bold text-amber-700'
                                  : 'font-medium text-neutral-400'
                              }`}>
                                {isReturnCollected || isReceivedAtUrvaah || isReturned ? 'PICKED UP' : 'PICKUP'}
                              </span>
                            </div>

                            {/* Step 4: IN TRANSIT TO URVAAH */}
                            <div className="flex flex-col items-center text-center z-10">
                              <div className={`w-8 sm:w-9 h-8 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all ${
                                isReceivedAtUrvaah || isReturned
                                  ? 'bg-indigo-700 text-white ring-4 ring-indigo-100 shadow-xs'
                                  : isReturnCollected
                                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-xs animate-pulse'
                                  : 'bg-white border-2 border-neutral-300 text-neutral-400'
                              }`}>
                                <RotateCcw className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[1.8]" />
                              </div>
                              <span className={`text-[8px] sm:text-[9px] tracking-[0.14em] uppercase mt-2 font-sans ${
                                isReceivedAtUrvaah || isReturned ? 'font-bold text-black' : isReturnCollected ? 'font-bold text-indigo-700' : 'font-medium text-neutral-400'
                              }`}>
                                IN TRANSIT
                              </span>
                            </div>

                            {/* Step 5: ATELIER RECEIVED & REFUND */}
                            <div className="flex flex-col items-center text-center z-10">
                              <div className={`w-8 sm:w-9 h-8 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all ${
                                isReceivedAtUrvaah || isReturned
                                  ? 'bg-emerald-700 text-white ring-4 ring-emerald-100 shadow-xs'
                                  : 'bg-white border-2 border-neutral-300 text-neutral-400'
                              }`}>
                                <PackageCheck className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[1.8]" />
                              </div>
                              <span className={`text-[8px] sm:text-[9px] tracking-[0.14em] uppercase mt-2 font-sans ${
                                isReceivedAtUrvaah || isReturned ? 'font-bold text-emerald-800' : 'font-medium text-neutral-400'
                              }`}>
                                {isReturned ? 'REFUNDED' : 'ATELIER'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : !isCancelled && !isCancellationRequested ? (
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
                      ) : null}

                      {/* Replacement Flow Informational Banners */}
                      {isReplacementRequested && (
                        <div className="bg-purple-50/90 border border-purple-200/90 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
                          <div className="p-2 bg-purple-100 rounded-xl text-purple-800 shrink-0 mt-0.5">
                            <Clock className="w-5 h-5 text-purple-700" />
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-serif font-bold text-purple-950 uppercase tracking-wide text-xs sm:text-sm">
                                Replacement Request Pending Atelier Review
                              </h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-200/80 text-purple-900 border border-purple-300 uppercase">
                                Under Review
                              </span>
                            </div>
                            <p className="text-purple-900/90 leading-relaxed font-normal">
                              Your product exchange request for this delivered order has been submitted to the House of Urvaah atelier concierge. Our team is verifying stock availability for your replacement size and will coordinate reverse pickup of the delivered item.
                            </p>
                            {(ord.cancel_reason || ord.return_reason) && (
                              <p className="text-[11px] text-purple-800 pt-1">
                                <span className="font-semibold uppercase tracking-wider text-[10px]">Exchange Details:</span> {ord.cancel_reason || ord.return_reason}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {isReplacementApproved && !isReplacementCollected && !isReplacementQCReceived && !isReplaced && (
                        <div className="bg-indigo-50/90 border border-indigo-200/90 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
                          <div className="p-2 bg-indigo-100 rounded-xl text-indigo-800 shrink-0 mt-0.5">
                            <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-serif font-bold text-indigo-950 uppercase tracking-wide text-xs sm:text-sm">
                                Replacement Approved — Reverse Pickup Scheduled
                              </h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-200/80 text-indigo-900 border border-indigo-300 uppercase">
                                Pickup Scheduled
                              </span>
                            </div>
                            <p className="text-indigo-900/90 leading-relaxed font-normal">
                              Your replacement has been authorized by our atelier team. Courier partner is assigned for doorstep collection of the original piece. Please ensure tags and original packaging remain intact.
                            </p>
                            {ord.replacement_size && (
                              <p className="text-[11px] text-indigo-950 pt-1 font-semibold">
                                <span className="uppercase tracking-wider text-[10px] text-indigo-700">Requested Replacement Size:</span> {ord.replacement_size}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {isReplacementCollected && !isReplacementQCReceived && !isReplaced && (
                        <div className="bg-blue-50/90 border border-blue-200/90 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
                          <div className="p-2 bg-blue-100 rounded-xl text-blue-800 shrink-0 mt-0.5">
                            <Truck className="w-5 h-5 text-blue-700 animate-pulse" />
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-serif font-bold text-blue-950 uppercase tracking-wide text-xs sm:text-sm">
                                Original Parcel Collected — In Reverse Transit
                              </h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-200/80 text-blue-900 border border-blue-300 uppercase">
                                Parcel Collected
                              </span>
                            </div>
                            <p className="text-blue-900/90 leading-relaxed font-normal">
                              Courier rider has collected the original piece from your doorstep. It is currently in reverse transit to House of Urvaah atelier for swift verification.
                            </p>
                          </div>
                        </div>
                      )}

                      {isReplacementQCReceived && !isReplaced && (
                        <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
                          <div className="p-2 bg-amber-100 rounded-xl text-amber-800 shrink-0 mt-0.5">
                            <PackageCheck className="w-5 h-5 text-amber-700" />
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-serif font-bold text-amber-950 uppercase tracking-wide text-xs sm:text-sm">
                                Parcel Received at Atelier — QC Verified
                              </h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-900 border border-amber-300 uppercase">
                                QC Passed
                              </span>
                            </div>
                            <p className="text-amber-900/90 leading-relaxed font-normal">
                              Your returned garment has arrived at the atelier and passed quality inspection. Your replacement forward order is being prepared and dispatched.
                            </p>
                          </div>
                        </div>
                      )}

                      {(isReplaced || Boolean(ord.replacement_order_number)) && (
                        <div className="bg-purple-50/90 border border-purple-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-2xs">
                          <div className="flex items-start gap-3.5">
                            <div className="p-2 bg-purple-100 rounded-xl text-purple-800 shrink-0 mt-0.5">
                              <PackageCheck className="w-5 h-5 text-purple-700" />
                            </div>
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-serif font-bold text-purple-950 uppercase tracking-wide text-xs sm:text-sm">
                                  Replacement Order Placed & In Motion
                                </h4>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-200/80 text-purple-900 border border-purple-300 uppercase">
                                  Order #{ord.replacement_order_number || `${orderNum}-REP`}
                                </span>
                              </div>
                              <p className="text-purple-900/90 leading-relaxed font-normal">
                                Your replacement order has been placed in the atelier dispatch queue with 100% exchange credit. You can track its live forward journey below.
                              </p>
                              {ord.replacement_size && (
                                <p className="text-[11px] text-purple-950 pt-0.5 font-medium">
                                  <span className="uppercase tracking-wider text-[10px] text-purple-700 font-bold">Exchange Size:</span> {ord.replacement_size}
                                </p>
                              )}
                            </div>
                          </div>
                          <Link
                            to={`/checkout?orderNumber=${ord.replacement_order_number || `${orderNum}-REP`}`}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm shrink-0 cursor-pointer"
                          >
                            <span>Track Replacement</span>
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      )}

                      {isReplacementRejected && (
                        <div className="bg-rose-50/90 border border-rose-200/90 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
                          <div className="p-2 bg-rose-100 rounded-xl text-rose-800 shrink-0 mt-0.5">
                            <AlertCircle className="w-5 h-5 text-rose-700" />
                          </div>
                          <div className="space-y-1 text-xs">
                            <h4 className="font-serif font-bold text-rose-950 uppercase tracking-wide text-xs sm:text-sm">
                              Replacement Request Not Approved
                            </h4>
                            <p className="text-rose-900/90 leading-relaxed font-normal">
                              Your replacement request could not be approved by the atelier team. For further assistance or alternate sizing options, please contact our concierge care.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Post-Delivery Return Requested Review Banner */}
                      {isReturnRequested && (
                        <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
                          <div className="p-2 bg-amber-100 rounded-xl text-amber-800 shrink-0 mt-0.5">
                            <Clock className="w-5 h-5 text-amber-700" />
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-serif font-bold text-amber-950 uppercase tracking-wide text-xs sm:text-sm">
                                Return Request Pending Admin Review
                              </h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-900 border border-amber-300 uppercase">
                                Under Review
                              </span>
                            </div>
                            <p className="text-amber-900/90 leading-relaxed font-normal">
                              Your return request for this delivered order has been submitted to the House of Urvaah atelier team. Once approved by admin, reverse pickup will be initiated.
                            </p>
                            {ord.cancel_reason && (
                              <p className="text-[11px] text-amber-800 pt-1">
                                <span className="font-semibold uppercase tracking-wider text-[10px]">Return Reason:</span> {ord.cancel_reason}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Return Approved Banner */}
                      {isReturnApproved && (
                        <div className="bg-indigo-50/90 border border-indigo-200/90 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
                          <div className="p-2 bg-indigo-100 rounded-xl text-indigo-800 shrink-0 mt-0.5">
                            <Truck className="w-5 h-5 text-indigo-700" />
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-serif font-bold text-indigo-950 uppercase tracking-wide text-xs sm:text-sm">
                                {isReturnCollected
                                  ? 'Package Collected — In Transit to House of Urvaah'
                                  : 'Return Approved — Reverse Courier Pickup Scheduled'}
                              </h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-200/80 text-indigo-900 border border-indigo-300 uppercase">
                                {isReturnCollected ? 'In Reverse Transit' : 'Pickup Scheduled'}
                              </span>
                            </div>
                            <p className="text-indigo-900/90 leading-relaxed font-normal">
                              {isReturnCollected
                                ? 'Courier executive has collected the package from your doorstep. It is in transit back to the House of Urvaah Central Atelier. Once delivered, our Refund Desk will disburse your refund.'
                                : 'Your return request has been approved by admin! Reverse pickup is scheduled from your delivery address within 24–48 hours. Please keep the item packed in original condition with tags intact for rider collection.'}
                            </p>
                            <div className="pt-1 flex items-center gap-2 text-[11px] font-sans font-semibold text-indigo-800">
                              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                              <span>Destination: House of Urvaah Central Atelier</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Received at House of Urvaah Banner */}
                      {isReceivedAtUrvaah && (
                        <div className="bg-blue-50/90 border border-blue-200/90 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
                          <div className="p-2 bg-blue-100 rounded-xl text-blue-800 shrink-0 mt-0.5">
                            <PackageCheck className="w-5 h-5 text-blue-700" />
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-serif font-bold text-blue-950 uppercase tracking-wide text-xs sm:text-sm">
                                Package Delivered to House of Urvaah — Refund Desk Initiated
                              </h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-200/80 text-blue-900 border border-blue-300 uppercase">
                                Received at Atelier
                              </span>
                            </div>
                            <p className="text-blue-900/90 leading-relaxed font-normal">
                              Your returned items have safely arrived at House of Urvaah! Inventory has been restocked and this order is now active at our Refund Desk for customer disbursement.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Returned & Refund Disbursed Banner */}
                      {isReturned && (
                        <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
                          <div className="p-2 bg-emerald-100 rounded-xl text-emerald-800 shrink-0 mt-0.5">
                            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-serif font-bold text-emerald-950 uppercase tracking-wide text-xs sm:text-sm">
                                Return Completed & Full Refund Disbursed
                              </h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200/80 text-emerald-900 border border-emerald-300 uppercase">
                                Refund Completed
                              </span>
                            </div>
                            <p className="text-emerald-900/90 leading-relaxed font-normal">
                              Full refund of ₹{Number(ord.refund_eligible_amount || orderTotal).toLocaleString('en-IN')} has been disbursed{ord.refund_method ? ` via ${ord.refund_method}` : ''}.
                              {ord.refund_txn_id || ord.refund_transaction_id || ord.refund_utr ? ` Transaction Reference / UTR: ${ord.refund_txn_id || ord.refund_transaction_id || ord.refund_utr}` : ''}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Return Rejected Banner */}
                      {isReturnRejected && (
                        <div className="bg-rose-50/90 border border-rose-200/90 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
                          <div className="p-2 bg-rose-100 rounded-xl text-rose-800 shrink-0 mt-0.5">
                            <AlertCircle className="w-5 h-5 text-rose-700" />
                          </div>
                          <div className="space-y-1 text-xs">
                            <h4 className="font-serif font-bold text-rose-950 uppercase tracking-wide text-xs sm:text-sm">
                              Return Request Not Approved
                            </h4>
                            <p className="text-rose-900/90 leading-relaxed font-normal">
                              Your return request could not be approved by the atelier team. For questions regarding atelier policies, please reach out to customer care.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Pre-Delivery Cancellation Requested Review Banner */}
                      {isCancellationRequested && (
                        <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
                          <div className="p-2 bg-amber-100 rounded-xl text-amber-800 shrink-0 mt-0.5">
                            <Clock className="w-5 h-5 text-amber-700" />
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-serif font-bold text-amber-950 uppercase tracking-wide text-xs sm:text-sm">
                                Cancellation Request Pending Admin Approval
                              </h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-900 border border-amber-300 uppercase">
                                Review In Progress
                              </span>
                            </div>
                            <p className="text-amber-900/90 leading-relaxed font-normal">
                              Your cancellation request has been submitted to our atelier admin team for verification prior to delivery.
                              {isOnlinePayment
                                ? ' Once approved, the full amount will automatically be routed to the Refund Desk for customer disbursement.'
                                : ' As this is a Cash on Delivery order, no payment was collected.'}
                            </p>
                            {ord.cancel_reason && (
                              <p className="text-[11px] text-amber-800 pt-1">
                                <span className="font-semibold uppercase tracking-wider text-[10px]">Reason:</span> {ord.cancel_reason}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Pre-Delivery Cancelled & Refund Status Banner */}
                      {isCancelled && (
                        <div className={`rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 border shadow-2xs ${
                          !isOnlinePayment
                            ? 'bg-neutral-50 border-neutral-200 text-neutral-800'
                            : (ord.refund_status === 'Completed' || ord.refund_status === 'Refunded' || ord.payment_status === 'Refunded')
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                            : (ord.refund_status === 'Processing' || ord.refund_status === 'In-Review')
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-950'
                            : 'bg-amber-50 border-amber-200 text-amber-950'
                        }`}>
                          <div className="p-2 rounded-xl bg-white/90 border border-current shrink-0 mt-0.5">
                            <AlertCircle className="w-5 h-5" />
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-serif font-bold uppercase tracking-wide text-xs sm:text-sm">
                                {!isOnlinePayment
                                  ? 'Order Cancelled (Cash on Delivery)'
                                  : (ord.refund_status === 'Completed' || ord.refund_status === 'Refunded' || ord.payment_status === 'Refunded')
                                  ? 'Refund Completed'
                                  : (ord.refund_status === 'Processing' || ord.refund_status === 'In-Review')
                                  ? 'Refund In Processing'
                                  : 'Order Cancelled — Sent to Refund Desk'}
                              </h4>
                              {isOnlinePayment && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border bg-white/80">
                                  {ord.refund_status || 'Pending'}
                                </span>
                              )}
                            </div>
                            <p className="leading-relaxed font-normal">
                              {!isOnlinePayment
                                ? 'This order was cancelled prior to delivery. No payment was charged for Cash on Delivery.'
                                : (ord.refund_status === 'Completed' || ord.refund_status === 'Refunded' || ord.payment_status === 'Refunded')
                                ? `Full refund of ₹${Number(ord.refund_eligible_amount || orderTotal).toLocaleString('en-IN')} has been disbursed${ord.refund_method ? ` via ${ord.refund_method}` : ''}.${ord.refund_txn_id || ord.refund_transaction_id || ord.refund_utr ? ` Reference/UTR: ${ord.refund_txn_id || ord.refund_transaction_id || ord.refund_utr}` : ''}`
                                : (ord.refund_status === 'Processing' || ord.refund_status === 'In-Review')
                                ? `Full refund of ₹${Number(ord.refund_eligible_amount || orderTotal).toLocaleString('en-IN')} is being processed by the Refund Desk.`
                                : `Full amount of ₹${Number(ord.refund_eligible_amount || orderTotal).toLocaleString('en-IN')} has been approved and queued at the Refund Desk for customer disbursement.`}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Sub-card Products List */}
                      <div className="bg-white border border-neutral-200/80 rounded-2xl p-3.5 sm:p-5 divide-y divide-neutral-100 space-y-3.5 sm:space-y-4 shadow-2xs">
                        {itemsList.map((item, itemIdx) => {
                          const itemImg = getSupabaseMediaUrl(item.image || (item.product && item.product.image) || item.image_url);
                          const itemPrice = Number(item.price || item.unit_price || 0);
                          return (
                            <div key={itemIdx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 pt-3.5 sm:pt-4 first:pt-0">
                              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                <div className="w-14 h-18 sm:w-16 sm:h-20 bg-[#FAF8F3] rounded-xl overflow-hidden border border-neutral-200/80 p-0.5 shrink-0 shadow-2xs">
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
                                <div className="min-w-0 flex-1">
                                  <h5 className="text-xs sm:text-sm font-serif tracking-[0.04em] uppercase text-black font-semibold truncate leading-snug" title={item.name || item.title}>
                                    {item.name || item.title || 'Atelier Item'}
                                  </h5>
                                  <div className="flex items-center gap-2 text-xs text-neutral-500 font-sans tracking-wide mt-1 flex-wrap">
                                    <span>Qty: {item.quantity || 1}</span>
                                    {item.size && (
                                      <>
                                        <span className="text-neutral-300">•</span>
                                        <span>Size: {item.size}</span>
                                      </>
                                    )}
                                    {itemPrice > 0 && (
                                      <>
                                        <span className="text-neutral-300">•</span>
                                        <span className="font-semibold text-neutral-900">₹{itemPrice.toLocaleString('en-IN')}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 flex-wrap sm:justify-end self-start sm:self-center pl-[68px] sm:pl-0">
                                <span className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] font-sans font-bold tracking-[0.14em] uppercase border shrink-0 ${
                                  isCancellationRequested
                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : isCancelled
                                    ? 'bg-red-50 text-red-800 border-red-200'
                                    : isReturnRequested
                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : isReturnApproved
                                    ? 'bg-indigo-50 text-indigo-900 border-indigo-200'
                                    : isReceivedAtUrvaah
                                    ? 'bg-blue-50 text-blue-900 border-blue-200'
                                    : isReturned
                                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                    : isDelivered
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : isOutForDelivery
                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                    : isShipped
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-neutral-100 text-neutral-800 border-neutral-200'
                                }`}>
                                  {isCancellationRequested ? 'CANCEL REQUESTED' : isCancelled ? 'CANCELLED' : isReturnRequested ? 'RETURN REQUESTED' : isReturnCollected ? 'RETURN IN TRANSIT' : isReturnApproved ? 'PICKUP SCHEDULED' : isReceivedAtUrvaah ? 'AT ATELIER' : isReturned ? 'RETURNED' : isDelivered ? 'DELIVERED' : isOutForDelivery ? 'OUT FOR DELIVERY' : isShipped ? 'SHIPPED' : 'PROCESSING'}
                                </span>

                                {isDelivered && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const prodId = item.product_id || item.productId || (item.product && (item.product.id || item.product.product_id)) || item.id;
                                      if (prodId) {
                                        navigate(`/product/${prodId}?openReview=true#customer-reviews`);
                                      }
                                    }}
                                    className="px-3.5 py-1.5 rounded-lg border border-neutral-900 bg-neutral-900 hover:bg-black text-white text-[10px] font-sans font-bold tracking-[0.14em] uppercase transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 shrink-0"
                                    title="Rate and give feedback for this delivered product"
                                  >
                                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                    <span>Give Feedback</span>
                                  </button>
                                )}
                              </div>
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

                          {/* Edit Address Quick Action (Available during 24-Hour Edit Window) */}
                          {canEditAddress && (
                            <button
                              type="button"
                              onClick={() => navigate('/checkout', { state: { viewOrder: ord, openAddressEdit: true } })}
                              className="px-5 py-2.5 rounded-xl border border-amber-300 hover:border-black bg-amber-50 hover:bg-amber-100/80 text-xs font-sans font-semibold tracking-[0.16em] uppercase text-amber-950 transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                              title={`Edit shipping address within 24 hours (${hoursRemaining}h remaining)`}
                            >
                              <Pencil className="w-3.5 h-3.5 text-amber-700" />
                              <span>Edit Address ({hoursRemaining}h)</span>
                            </button>
                          )}

                          {/* Invoice Action: Only accessible when order or replacement piece is delivered */}
                          {isInvoiceEligible && (
                            <button
                              type="button"
                              onClick={() => setSelectedOrderForInvoice(ord)}
                              className="px-5 py-2.5 rounded-xl border border-[#c5a880] hover:border-black bg-white hover:bg-[#faf8f5] text-xs font-sans font-semibold tracking-[0.16em] uppercase text-neutral-900 transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                              title="View or download official tax invoice"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#8c734b]" />
                              <span>Invoice</span>
                            </button>
                          )}

                          {/* Give Feedback Quick Action on Delivered Orders */}
                          {isDelivered && (
                            <button
                              type="button"
                              onClick={() => {
                                if (!itemsList || itemsList.length === 0) return;

                                if (itemsList.length === 1) {
                                  const firstItem = itemsList[0];
                                  const prodId = firstItem?.product_id || firstItem?.productId || (firstItem?.product && (firstItem.product.id || firstItem.product.product_id)) || firstItem?.id;
                                  if (prodId) {
                                    navigate(`/product/${prodId}?openReview=true#customer-reviews`);
                                  }
                                  return;
                                }

                                // For multi-item orders, show a clean modal to select which piece to review
                                Swal.fire({
                                  title: 'SELECT PRODUCT TO REVIEW',
                                  text: 'Which piece from your delivered order would you like to review?',
                                  html: `
                                    <div class="space-y-2.5 mt-4 text-left font-sans">
                                      ${itemsList.map((it, idx) => {
                                        const pid = it.product_id || it.productId || (it.product && (it.product.id || it.product.product_id)) || it.id;
                                        const pName = it.name || it.product_name || `Product #${idx + 1}`;
                                        const pImg = it.image || it.image_url || '/assets/Images/Blue01.png';
                                        return `
                                          <button type="button" class="swal-acc-feedback-btn w-full p-2.5 flex items-center gap-3 border border-neutral-200 hover:border-black rounded-xl transition-all cursor-pointer bg-white hover:bg-neutral-50 text-left shadow-2xs" data-prod-id="${pid}">
                                            <img src="${pImg}" class="w-12 h-14 object-contain bg-neutral-100 rounded-lg border border-neutral-200 shrink-0" alt="${pName}" />
                                            <div class="flex-1 min-w-0">
                                              <p class="text-xs font-bold text-black truncate uppercase tracking-wider">${pName}</p>
                                              <p class="text-[10px] text-neutral-500 uppercase tracking-widest mt-0.5">Click to write feedback</p>
                                            </div>
                                            <span class="text-xs font-bold text-amber-500 flex items-center gap-1 shrink-0">★ REVIEW</span>
                                          </button>
                                        `;
                                      }).join('')}
                                    </div>
                                  `,
                                  showConfirmButton: false,
                                  showCloseButton: true,
                                  didOpen: () => {
                                    const btns = document.querySelectorAll('.swal-acc-feedback-btn');
                                    btns.forEach(btn => {
                                      btn.addEventListener('click', () => {
                                        const targetPid = btn.getAttribute('data-prod-id');
                                        Swal.close();
                                        if (targetPid) {
                                          navigate(`/product/${targetPid}?openReview=true#customer-reviews`);
                                        }
                                      });
                                    });
                                  }
                                });
                              }}
                              className="px-5 py-2.5 rounded-xl border border-neutral-900 bg-neutral-900 hover:bg-black text-white text-xs font-sans font-semibold tracking-[0.16em] uppercase transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                              title="Give feedback for your delivered pieces"
                            >
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              <span>Give Feedback</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleReorderOrder(ord)}
                            className="px-5 py-2.5 rounded-xl border border-neutral-300 hover:border-black bg-white hover:bg-neutral-50 text-xs font-sans font-semibold tracking-[0.16em] uppercase text-neutral-800 hover:text-black transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reorder</span>
                          </button>

                          {/* Cancel Order Button (Pre-Delivery Only) */}
                          {!isDelivered && !isCancelled && !isCancellationRequested && !isInReturnFlow && !isInReplacementFlow && (
                            <button
                              type="button"
                              onClick={() => handleCancelOrderInAccount(ord)}
                              className="px-5 py-2.5 rounded-xl border border-red-200 hover:border-red-500 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 text-xs font-sans font-semibold tracking-[0.16em] uppercase transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancel Order</span>
                            </button>
                          )}

                          {/* Unified Return / Replace Button (Post-Delivery Only) */}
                          {isDelivered && !isCancelled && !isCancellationRequested && !isInReturnFlow && !isInReplacementFlow && (
                            <button
                              type="button"
                              onClick={() => handleOpenReturnReplaceModal(ord)}
                              className="px-5 py-2.5 rounded-xl border border-neutral-900 bg-white hover:bg-neutral-900 text-neutral-900 hover:text-white text-xs font-sans font-semibold tracking-[0.16em] uppercase transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 group"
                              title="Request Return (Refund) or Replacement Piece"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-neutral-600 group-hover:text-white transition-colors" />
                              <span>Return / Replace</span>
                            </button>
                          )}

                          {/* Post-Delivery Replacement Flow Status Badges */}
                          {isReplacementRequested && (
                            <span className="px-4 py-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-sans font-bold tracking-[0.12em] uppercase flex items-center gap-1.5 shadow-2xs">
                              <Clock className="w-3.5 h-3.5 text-purple-600" />
                              <span>Replacement Pending Review</span>
                            </span>
                          )}

                          {isReplacementApproved && (
                            <span className="px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-sans font-bold tracking-[0.12em] uppercase flex items-center gap-1.5 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Replacement Approved</span>
                            </span>
                          )}

                          {(isReplacementInTransit || isReplacementOutForDelivery) && (
                            <span className="px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-sans font-bold tracking-[0.12em] uppercase flex items-center gap-1.5 shadow-2xs">
                              <Truck className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                              <span>Replacement In Transit</span>
                            </span>
                          )}

                          {isReplaced && (
                            <span className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-sans font-bold tracking-[0.12em] uppercase flex items-center gap-1.5 shadow-2xs">
                              <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Product Replaced</span>
                            </span>
                          )}

                          {/* Pre-Delivery Cancellation Pending Review */}
                          {isCancellationRequested && (
                            <span className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-sans font-bold tracking-[0.12em] uppercase flex items-center gap-1.5 shadow-2xs">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Cancellation Pending Review</span>
                            </span>
                          )}

                          {/* Post-Delivery Return Flow Status Badges */}
                          {isReturnRequested && (
                            <span className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-sans font-bold tracking-[0.12em] uppercase flex items-center gap-1.5 shadow-2xs">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Return Pending Review</span>
                            </span>
                          )}

                          {isReturnApproved && (
                            <span className="px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-sans font-bold tracking-[0.12em] uppercase flex items-center gap-1.5 shadow-2xs">
                              <Truck className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Return In Transit</span>
                            </span>
                          )}

                          {isReceivedAtUrvaah && (
                            <span className="px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-sans font-bold tracking-[0.12em] uppercase flex items-center gap-1.5 shadow-2xs">
                              <PackageCheck className="w-3.5 h-3.5 text-blue-600" />
                              <span>At Urvaah House • Refund Desk</span>
                            </span>
                          )}

                          {isReturned && (
                            <span className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-sans font-bold tracking-[0.12em] uppercase flex items-center gap-1.5 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Refund Completed</span>
                            </span>
                          )}

                          {isCancelled && (
                            <span className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-sans font-bold tracking-[0.12em] uppercase flex items-center gap-1.5 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{isRefundCompleted ? 'Refund Completed' : 'Order Cancelled'}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Customer Orders Pagination Bar */}
              {totalOrderPages > 1 && (
                <div className="pt-4 border-t border-neutral-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-xs">
                  <div className="text-neutral-500 font-medium">
                    Showing <span className="font-semibold text-brand-dark">{(orderPage - 1) * ordersPerPage + 1}</span>–
                    <span className="font-semibold text-brand-dark">{Math.min(orderPage * ordersPerPage, orders.length)}</span> of{' '}
                    <span className="font-semibold text-brand-dark">{orders.length}</span> orders
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setOrderPage((prev) => Math.max(1, prev - 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={orderPage === 1}
                      className="inline-flex items-center gap-1 px-3 py-2 border border-neutral-200 rounded-lg text-neutral-600 hover:bg-neutral-50 hover:text-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-xs font-semibold uppercase tracking-wider"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Prev</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {(() => {
                        if (totalOrderPages <= 7) {
                          return Array.from({ length: totalOrderPages }, (_, i) => i + 1).map((pageNum) => {
                            const isActive = pageNum === orderPage;
                            return (
                              <button
                                key={`order-page-${pageNum}`}
                                type="button"
                                onClick={() => {
                                  setOrderPage(pageNum);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={`min-w-8 h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  isActive
                                    ? 'bg-brand-dark text-white shadow-xs'
                                    : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:text-black'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          });
                        }
                        const pages = [];
                        if (orderPage <= 4) {
                          for (let i = 1; i <= 5; i++) pages.push(i);
                          pages.push('...');
                          pages.push(totalOrderPages);
                        } else if (orderPage >= totalOrderPages - 3) {
                          pages.push(1);
                          pages.push('...');
                          for (let i = totalOrderPages - 4; i <= totalOrderPages; i++) pages.push(i);
                        } else {
                          pages.push(1);
                          pages.push('...');
                          pages.push(orderPage - 1);
                          pages.push(orderPage);
                          pages.push(orderPage + 1);
                          pages.push('...');
                          pages.push(totalOrderPages);
                        }
                        return pages.map((p, idx) => {
                          if (p === '...') {
                            return (
                              <span key={`order-ellipsis-${idx}`} className="w-7 text-center text-neutral-400 font-bold text-xs select-none">
                                ...
                              </span>
                            );
                          }
                          const isActive = p === orderPage;
                          return (
                            <button
                              key={`order-page-${p}`}
                              type="button"
                              onClick={() => {
                                setOrderPage(p);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className={`min-w-8 h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-brand-dark text-white shadow-xs'
                                  : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:text-black'
                              }`}
                            >
                              {p}
                            </button>
                          );
                        });
                      })()}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setOrderPage((prev) => Math.min(totalOrderPages, prev + 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={orderPage >= totalOrderPages}
                      className="inline-flex items-center gap-1 px-3 py-2 border border-neutral-200 rounded-lg text-neutral-600 hover:bg-neutral-50 hover:text-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-xs font-semibold uppercase tracking-wider"
                      title="Next Page"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
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

        {/* {activeTab === 'MY COUPONS' && (
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
        )} */}
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
              className="relative z-10 w-full max-w-lg bg-white p-6 sm:p-8 shadow-2xl border border-neutral-200 max-h-[90vh] overflow-y-auto no-scrollbar scrollbar-none"
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
                    maxLength={10}
                    value={addressForm.phone}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length === 12 && val.startsWith('91')) val = val.slice(2);
                      val = val.slice(0, 10);
                      setAddressForm((prev) => ({ ...prev, phone: val }));
                      if (addressErrors.phone) setAddressErrors((prev) => ({ ...prev, phone: '' }));
                    }}
                    className={`w-full px-3.5 py-2.5 bg-white border ${
                      addressErrors.phone ? 'border-red-500' : 'border-neutral-300 focus:border-brand-dark'
                    } focus:ring-1 focus:ring-brand-dark outline-none text-sm`}
                    placeholder="10-digit mobile number"
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
                const statusLower = modalStatus.toLowerCase();
                const isModalCancelled = statusLower === 'cancelled' || statusLower === 'canceled';
                const isModalCancelRequested = statusLower === 'cancellation requested' || statusLower === 'cancel_requested';
                const isModalReturnFlow = statusLower.includes('return');
                const isModalReplacementFlow = statusLower.includes('replace') || statusLower.includes('exchange');
                const isModalCod = (selectedOrderModal.payment_method || selectedOrderModal.paymentMethod || '').toLowerCase() === 'cod' || (selectedOrderModal.payment_method || selectedOrderModal.paymentMethod || '').toLowerCase().includes('cash');
                const isModalDelivered = statusLower === 'delivered';
                const modalIsPaid = (isModalDelivered && isModalCod) || (selectedOrderModal.payment_status || selectedOrderModal.paymentStatus || '').toLowerCase() === 'paid';
                const modalTotal = Number(selectedOrderModal.total || selectedOrderModal.total_amount || 0);

                return (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between bg-neutral-50 p-4 rounded-xl border border-neutral-200/60 text-xs gap-3">
                      <div>
                        <span className="text-neutral-400 block text-[10px] font-bold uppercase">ORDER STATUS</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {isModalCancelled && <span className="w-2 h-2 rounded-full bg-red-600" />}
                          {isModalCancelRequested && <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />}
                          {isModalReturnFlow && <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />}
                          <span className={`font-bold ${isModalCancelled ? 'text-red-700' : isModalCancelRequested ? 'text-amber-700' : isModalReturnFlow ? 'text-indigo-900' : 'text-neutral-900'}`}>{modalStatus}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px] font-bold uppercase">PAYMENT METHOD</span>
                        <span className="font-bold text-neutral-900 mt-0.5 block">{selectedOrderModal.payment_method || selectedOrderModal.paymentMethod || 'Online Payment'}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px] font-bold uppercase">PAYMENT STATUS</span>
                        <div className="mt-0.5">
                          {isModalCancelled && isModalCod && !modalIsPaid ? (
                            <span className="font-bold text-neutral-400 uppercase text-xs">N/A (Cancelled COD)</span>
                          ) : (
                            <span className={`font-bold uppercase ${modalIsPaid ? 'text-emerald-700' : 'text-neutral-900'}`}>
                              {modalIsPaid ? 'PAID' : (selectedOrderModal.payment_status || 'PENDING')}
                            </span>
                          )}
                        </div>
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

                    {/* Return Flow Banner */}
                    {isModalReturnFlow && (
                      <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-indigo-200/60">
                          <span className="text-[10px] font-serif tracking-[0.2em] uppercase font-semibold text-indigo-950 flex items-center gap-1.5">
                            <RotateCcw className="w-3.5 h-3.5 text-indigo-700" />
                            Reverse Logistics & Return Desk
                          </span>
                          <span className="text-[9px] font-bold text-indigo-800 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200 uppercase">
                            {statusLower === 'returned' ? 'Return Completed' : 'Pending Atelier QC'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="bg-white p-3 rounded-lg border border-indigo-100">
                            <span className="text-[10px] font-bold uppercase text-indigo-950 block mb-1">Doorstep Reverse Pickup</span>
                            <p className="text-[11px] text-neutral-600 leading-relaxed">
                              {statusLower === 'returned'
                                ? 'Piece returned to House of Urvaah atelier and verified.'
                                : 'Return request recorded. Upon admin approval, reverse courier partner will collect parcel from delivery address.'}
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-indigo-100">
                            <span className="text-[10px] font-bold uppercase text-indigo-950 block mb-1">Financial Settlement</span>
                            <p className="text-[11px] text-neutral-600 leading-relaxed">
                              {statusLower === 'returned'
                                ? `100% full refund of ₹${modalTotal.toLocaleString('en-IN')} has been disbursed.`
                                : `Full refund of ₹${modalTotal.toLocaleString('en-IN')} will be processed after piece is inspected at our atelier.`}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pre-Delivery Cancellation Review Banner */}
                    {isModalCancelRequested && (
                      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 space-y-2 text-xs">
                        <div className="flex items-center justify-between pb-1 border-b border-amber-200/60">
                          <span className="text-[10px] font-serif tracking-[0.2em] uppercase font-semibold text-amber-950 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-700" />
                            Cancellation Request Under Review
                          </span>
                          <span className="text-[9px] font-bold text-amber-800 bg-white px-2 py-0.5 rounded-full border border-amber-200 uppercase">
                            Pending Approval
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-900 leading-relaxed">
                          Your cancellation request is being reviewed by our atelier team. Once approved, the shipment will be voided and your refund of ₹{modalTotal.toLocaleString('en-IN')} will be queued.
                        </p>
                      </div>
                    )}

                    {/* Shiprocket Cancellation Banner if Cancelled */}
                    {isModalCancelled && (
                      <div className="bg-[#FAF8F3] border border-[#E7E2D8] rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-[#E7E2D8]/70">
                          <span className="text-[10px] font-serif tracking-[0.2em] uppercase font-semibold text-neutral-800 flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-neutral-700" />
                            Shiprocket Logistics & Refund Sync
                          </span>
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase">
                            {modalIsPaid ? '100% Refund Initiated' : 'COD • Zero Due'}
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
                              {modalIsPaid
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
                      <div key={i} className="flex items-center justify-between gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200/60 text-xs">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <img
                            src={modalImg}
                            alt={item.name || item.title || 'Product'}
                            className="w-12 h-14 object-contain rounded-md border bg-white p-0.5 shrink-0"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = getSupabaseMediaUrl('Images/Blue02.png');
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-neutral-900 truncate leading-snug">{item.name || item.title || 'Atelier Item'}</p>
                            <p className="text-neutral-500 font-medium text-[11px] mt-0.5">Quantity: {item.quantity || 1}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-neutral-900 block text-xs">₹{Number(item.price || 0).toLocaleString('en-IN')}</span>
                          {(() => {
                            const act = (item.return_action || '').toLowerCase();
                            const stat = (item.status || selectedOrderModal.status || '').toLowerCase();
                            if (act === 'keep') {
                              return (
                                <span className="text-[9px] font-bold text-emerald-700 uppercase bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                                  Kept
                                </span>
                              );
                            }
                            if (act === 'replace' || stat.includes('replace') || stat.includes('exchange')) {
                              return (
                                <span className="text-[9px] font-bold text-purple-700 uppercase bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                                  Exchange ({item.replacement_size || 'M'})
                                </span>
                              );
                            }
                            if (act === 'return' || stat.includes('return')) {
                              return (
                                <span className="text-[9px] font-bold text-amber-700 uppercase bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                                  Return Requested
                                </span>
                              );
                            }
                            if (stat.includes('cancel')) {
                              return (
                                <span className="text-[9px] font-bold text-red-600 uppercase bg-red-50 border border-red-200 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                                  Cancelled
                                </span>
                              );
                            }
                            return null;
                          })()}
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

      {/* Official Haute Couture Invoice Modal */}
      <InvoiceModal
        isOpen={Boolean(selectedOrderForInvoice)}
        onClose={() => setSelectedOrderForInvoice(null)}
        order={selectedOrderForInvoice}
        orderId={selectedOrderForInvoice?.order_number || selectedOrderForInvoice?.id}
      />

      {/* Real-Time Shiprocket Live Tracking Modal */}
      <ShipmentTrackingModal
        isOpen={Boolean(activeTrackingModal)}
        onClose={() => setActiveTrackingModal(null)}
        awb={activeTrackingModal?.awb}
        orderNumber={activeTrackingModal?.orderNumber}
        isReturn={activeTrackingModal?.isReturn}
        fallbackStatus={activeTrackingModal?.fallbackStatus}
      />
    </div>
  );
};

export default Account;
