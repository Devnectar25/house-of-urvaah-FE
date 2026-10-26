import { getProductUrl } from '../utils/productUrl';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, MapPin, Plus, Trash2, Pencil, Check, X, Shield, ShieldCheck, Lock, Ticket, Package, Heart, LogOut, Truck, CheckCircle2, RotateCcw, XCircle, ShoppingBag, AlertCircle, ChevronDown, Clock, PackageCheck, FileText, RefreshCw, ChevronLeft, ChevronRight, Star, Building2, Banknote, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import apiClient from '../lib/apiClient';
import { SEOHead } from '../components/common/SEOHead';
import { INDIAN_STATES, findMatchedState } from '../data/indianStates';
import { getSupabaseMediaUrl } from '../lib/supabase';
import { InvoiceModal } from '../components/common/InvoiceModal';
import { isCustomerInvoiceEligible } from '../utils/invoiceEligibility';
import { ShipmentTrackingModal } from '../components/common/ShipmentTrackingModal';
import { ProductCard } from '../components/common/ProductCard';
import { BEST_SELLERS_PRODUCTS, MOCK_PRODUCTS } from '../data/mockProducts';
import { productApi } from '../services/productApi';
import { buildReorderItems } from '../utils/reorder';
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

// Item-level label for a line item once it has its own state (cancelled, returned, exchanged, declined).
// Returns null for forward states, where the order-level status is shown instead.
const getItemStatusLabel = (item) => {
  const st = String(item?.status || '').trim().toLowerCase();
  const act = String(item?.return_action || '').trim().toLowerCase();
  if (!st) return null;
  if (st === 'cancellation requested' || st === 'cancel_requested') return 'CANCEL REQUESTED';
  if (st === 'cancelled' || st === 'canceled' || st === 'cancel_approved') return 'CANCELLED';
  if (st === 'return requested' || st === 'return request processing') return 'RETURN REQUESTED';
  if (st === 'replace requested' || st === 'replacement request processing' || st === 'replacement requested') return 'REPLACEMENT REQUESTED';
  if (st === 'return approved') return 'RETURN APPROVED';
  if (st === 'replace approved' || st === 'replacement approved') return 'REPLACEMENT APPROVED';
  if (st === 'return collected' || st.startsWith('in transit to')) return act === 'replace' ? 'EXCHANGE IN TRANSIT' : 'RETURN IN TRANSIT';
  if (st.startsWith('received at')) return 'AT HOUSE OF URVAAH';
  if (st === 'refunded') return act === 'replace' ? 'REPLACED' : 'RETURNED • REFUNDED';
  if (st === 'returned') return 'RETURNED';
  if (st === 'replaced') return 'REPLACED';
  if (st === 'return qc rejected') return 'RETURN NOT ACCEPTED';
  if (st === 'delivered' && /^request declined:/i.test(item?.cancel_reason || '')) return 'REQUEST DECLINED';
  return null;
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

import { getOrderGstInfo, getItemGstBreakdown, getReturnGstBreakdown } from '../utils/gstHelper';
export { getOrderGstInfo, getItemGstBreakdown, getReturnGstBreakdown };

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
      // Verify live stock before adding anything to the bag
      const { available, unavailable } = await buildReorderItems(ord.items);

      if (available.length === 0) {
        setToastMsg({
          text: unavailable.length > 0
            ? `Sorry, ${unavailable.join(', ')} ${unavailable.length > 1 ? 'are' : 'is'} currently out of stock.`
            : 'These items are no longer available to reorder.',
          type: 'error'
        });
        return;
      }

      const targetKeys = [];
      for (const { product, size, quantity } of available) {
        targetKeys.push(`${String(product.id).trim()}_${String(size).trim()}`);

        if (addToCart) {
          await addToCart(product, size, {
            quantity,
            setQuantity: true, // repeated reorders must not stack quantities
            selectOnlyThis: false,
            openDrawer: false
          });
        }
      }

      if (unavailable.length > 0) {
        setToastMsg({
          text: `Out of stock and skipped: ${unavailable.join(', ')}. Remaining items added to your bag.`,
          type: 'error'
        });
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
  const [isEditingCancelBank, setIsEditingCancelBank] = useState(false);
  const [isEditingReturnBank, setIsEditingReturnBank] = useState(false);
  const [isSavingReturnBank, setIsSavingReturnBank] = useState(false);
  const [savedBankDetailsSnapshot, setSavedBankDetailsSnapshot] = useState(null);

  // Profile-level saved bank details edit states
  const [isEditingProfileBank, setIsEditingProfileBank] = useState(false);
  const [profileBankForm, setProfileBankForm] = useState({
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    holderName: ''
  });
  const [profileBankSaving, setProfileBankSaving] = useState(false);
  const [profileBankMessage, setProfileBankMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => {
        setToastMsg(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  const getSavedBank = (ord) => {
    let acc = (ord?.refund_bank_account || user?.bankDetails?.accountNumber || '').trim();
    let ifsc = (ord?.refund_ifsc_code || user?.bankDetails?.ifscCode || '').trim();
    let holder = (ord?.refund_holder_name || user?.bankDetails?.holderName || ord?.customer_name || user?.name || '').trim();

    // 1. Check localStorage cached bank
    if (!acc) {
      try {
        const raw = localStorage.getItem('urvaah_saved_bank');
        if (raw) {
          const parsed = JSON.parse(raw);
          acc = (parsed?.accountNumber || '').trim();
          ifsc = ifsc || (parsed?.ifscCode || '').trim();
          holder = holder || (parsed?.holderName || '').trim();
        }
      } catch (e) {}
    }

    // 2. Check other user orders in state if any order had saved bank details
    if (!acc && Array.isArray(orders)) {
      const priorWithBank = orders.find(o => o.refund_bank_account && String(o.refund_bank_account).trim().length > 0);
      if (priorWithBank) {
        acc = String(priorWithBank.refund_bank_account).trim();
        ifsc = ifsc || String(priorWithBank.refund_ifsc_code || '').trim();
        holder = holder || String(priorWithBank.refund_holder_name || '').trim();
      }
    }

    return {
      accountNumber: acc,
      confirmAccountNumber: acc,
      ifscCode: ifsc.toUpperCase(),
      holderName: holder
    };
  };

  const persistSavedBank = (bank) => {
    if (!bank?.accountNumber) return;
    const cleanAcc = String(bank.accountNumber).trim();
    const cleanIfsc = String(bank.ifscCode || '').trim().toUpperCase();
    const cleanHolder = String(bank.holderName || '').trim();

    try {
      localStorage.setItem('urvaah_saved_bank', JSON.stringify({
        accountNumber: cleanAcc,
        confirmAccountNumber: cleanAcc,
        ifscCode: cleanIfsc,
        holderName: cleanHolder
      }));
    } catch (e) {}

    if (typeof updateUserProfile === 'function') {
      updateUserProfile({
        refund_bank_account: cleanAcc,
        refund_ifsc_code: cleanIfsc,
        refund_holder_name: cleanHolder
      }).catch(e => console.warn('Non-blocking user bank sync:', e.message));
    }
  };

  const handleCancelOrderInAccount = (ord) => {
    setCancelModalOrder(ord);
    const items = (ord.items && Array.isArray(ord.items) && ord.items.length > 0)
      ? ord.items
      : [
          {
            id: 'item-1',
            name: ord.product_name || 'DARK BLUE WIDE LEG TAILORED SET',
            quantity: ord.quantity || 1,
            price: Number(ord.total || ord.total_amount || 0),
            image: ord.image || ord.product_image || '/assets/Images/Blue02.png'
          }
        ];
    setSelectedCancelItems(items.map((x, idx) => x.id || x._id || x.productId || `item-${idx}`));
    setCancelReason('');
    setCancelComments('');

    const savedBank = getSavedBank(ord);
    setReturnBankDetails(savedBank);
    setBankDetailsError('');
    const hasValidSavedBank = Boolean(
      savedBank.accountNumber &&
      /^\d{9,18}$/.test(String(savedBank.accountNumber).trim()) &&
      /^[A-Z]{4}0[A-Z0-9]{6}$/.test(String(savedBank.ifscCode || '').trim().toUpperCase()) &&
      String(savedBank.holderName || '').trim().length >= 3
    );
    setIsEditingCancelBank(!hasValidSavedBank);
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
    setIsEditingCancelBank(false);
  };

  // Item-level cancellation: the customer can untick pieces they want to keep
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
      (cancelModalOrder.payment_type || '').toLowerCase() === 'cod' ||
      (cancelModalOrder.paymentMethod || '').toLowerCase().includes('cod') ||
      (cancelModalOrder.paymentMethod || '').toLowerCase().includes('cash') ||
      (cancelModalOrder.paymentType || '').toLowerCase() === 'cod'
    )
  );

  const isPaidOrder = Boolean(
    cancelModalOrder && (
      (cancelModalOrder.payment_status || '').toLowerCase() === 'paid' ||
      (cancelModalOrder.paymentStatus || '').toLowerCase() === 'paid' ||
      Boolean(cancelModalOrder.razorpay_payment_id)
    )
  );

  const isDeliveredModalOrder = Boolean(
    cancelModalOrder && (
      (cancelModalOrder.status || '').toLowerCase().includes('delivered') ||
      (cancelModalOrder.status || '').toLowerCase().includes('completed')
    )
  );

  const isPrepaidOrder = Boolean(
    cancelModalOrder && (
      !isCODOrder ||
      isPaidOrder ||
      Boolean(cancelModalOrder.razorpay_payment_id) ||
      ['upi', 'card', 'online', 'prepaid'].some(m =>
        (cancelModalOrder.payment_method || '').toLowerCase().includes(m) ||
        (cancelModalOrder.payment_type || '').toLowerCase().includes(m) ||
        (cancelModalOrder.paymentMethod || '').toLowerCase().includes(m) ||
        (cancelModalOrder.paymentType || '').toLowerCase().includes(m)
      )
    )
  );

  // Refund Situation: Either post-delivery return (COD or Prepaid) OR pre-delivery online/prepaid cancellation
  const isRefundSituation = Boolean(cancelModalOrder && (isDeliveredModalOrder || isPrepaidOrder));

  const isBankValid = !isRefundSituation || (
    returnBankDetails.holderName.trim().length >= 3 &&
    /^[a-zA-Z\s.]{3,70}$/.test(returnBankDetails.holderName.trim()) &&
    /^\d{9,18}$/.test(returnBankDetails.accountNumber.trim()) &&
    returnBankDetails.confirmAccountNumber.trim() === returnBankDetails.accountNumber.trim() &&
    /^[A-Z]{4}0[A-Z0-9]{6}$/.test(returnBankDetails.ifscCode.trim().toUpperCase())
  );

  const isFormFilled = selectedCancelItems.length > 0 && 
                       cancelReason.trim().length > 0;

  const handleSubmitCancellation = async () => {
    if (!cancelModalOrder) return;
    if (selectedCancelItems.length === 0) {
      setBankDetailsError('Please select at least one product to cancel.');
      return;
    }
    if (!cancelReason.trim()) {
      setBankDetailsError('Please select a reason for cancellation.');
      return;
    }

    if (isRefundSituation) {
      const cleanHolder = (returnBankDetails.holderName || '').trim();
      const cleanIfsc = (returnBankDetails.ifscCode || '').trim().toUpperCase();
      const cleanAccount = (returnBankDetails.accountNumber || '').trim();
      const cleanConfirm = (returnBankDetails.confirmAccountNumber || '').trim();

      if (!cleanHolder) {
        setBankDetailsError('Please enter the Account Holder Name for your refund disbursement.');
        setIsEditingCancelBank(true);
        return;
      }
      if (cleanHolder.length < 3 || !/^[a-zA-Z\s.]{3,70}$/.test(cleanHolder)) {
        setBankDetailsError('Account Holder Name must be at least 3 characters and contain only letters.');
        setIsEditingCancelBank(true);
        return;
      }

      if (!cleanIfsc) {
        setBankDetailsError('Please enter your Bank IFSC Code for refund transfer.');
        setIsEditingCancelBank(true);
        return;
      }
      if (cleanIfsc.length !== 11) {
        setBankDetailsError(`Bank IFSC Code must be exactly 11 characters (currently ${cleanIfsc.length} characters). Example: HDFC0008718.`);
        setIsEditingCancelBank(true);
        return;
      }
      if (cleanIfsc[4] !== '0') {
        setBankDetailsError('Invalid IFSC Code: The 5th character must be the digit 0 (zero), not the letter O.');
        setIsEditingCancelBank(true);
        return;
      }
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
        setBankDetailsError('Invalid Bank IFSC Code format. Must be 4 letters, followed by 0, followed by 6 alphanumeric characters (e.g. HDFC0008718).');
        setIsEditingCancelBank(true);
        return;
      }

      if (!cleanAccount) {
        setBankDetailsError('Please enter your Bank Account Number for refund payout.');
        setIsEditingCancelBank(true);
        return;
      }
      if (!/^\d+$/.test(cleanAccount)) {
        setBankDetailsError('Bank Account Number must contain numbers only.');
        setIsEditingCancelBank(true);
        return;
      }
      if (cleanAccount.length < 9 || cleanAccount.length > 18) {
        setBankDetailsError(`Bank Account Number must be between 9 and 18 digits (currently ${cleanAccount.length} digits).`);
        setIsEditingCancelBank(true);
        return;
      }

      if (!cleanConfirm) {
        setBankDetailsError('Please confirm your Bank Account Number.');
        setIsEditingCancelBank(true);
        return;
      }
      if (cleanAccount !== cleanConfirm) {
        setBankDetailsError('Bank Account Numbers do not match. Please verify and re-enter.');
        setIsEditingCancelBank(true);
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
          status: targetStatus,
          type: isDeliveredModalOrder ? 'Return' : 'Cancellation',
          cancelReason,
          comments: cancelComments,
          itemIds: selectedCancelItems,
          bankDetails: cleanBankDetails
        })
      });
      if (cleanBankDetails?.accountNumber) {
        persistSavedBank(cleanBankDetails);
      }

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
        text: isDeliveredModalOrder ? 'Return request submitted for store review.' : 'Cancellation request submitted for admin review.',
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

  // Return or Replace Modal State (Unified Post-Delivery Action)
  const [returnReplaceModalOrder, setReturnReplaceModalOrder] = useState(null);
  const [itemActionsState, setItemActionsState] = useState({});
  const [itemReturnError, setItemReturnError] = useState('');
  const [returnComments, setReturnComments] = useState('');
  const [isSubmittingItemReturn, setIsSubmittingItemReturn] = useState(false);
  const [productSizeStocks, setProductSizeStocks] = useState({});

  const handleOpenReturnReplaceModal = (ord) => {
    setReturnReplaceModalOrder(ord);
    const items = ord.items && Array.isArray(ord.items) && ord.items.length > 0 ? ord.items : [
      {
        id: ord.product_id || ord.id || 'item-1',
        name: ord.product_name || ord.name || 'Store Product',
        price: ord.price || ord.total || 0,
        quantity: ord.quantity || 1,
        image: ord.image || ord.image_url || '/assets/Images/Brown01.png',
        size: ord.selectedSize || ord.size || 'M',
        product_id: ord.product_id,
        size_stock: ord.size_stock,
        sizes: ord.sizes
      }
    ];

    // If this order already had a replacement request (e.g. one the admin rejected), default to
    // Replace so a re-submitted request continues the replacement flow instead of silently becoming a return.
    const hadReplacementRequest = Boolean(
      (ord.return_type || '').toLowerCase().includes('replace') ||
      (ord.return_type || '').toLowerCase().includes('exchange') ||
      ord.replacement_size ||
      (Array.isArray(ord.items) && ord.items.some(it => (it.return_action || '').toLowerCase() === 'replace' || (it.status || '').toLowerCase().includes('replace')))
    );
    const defaultAction = items.length <= 1 ? (hadReplacementRequest ? 'Replace' : 'Return') : 'Keep';
    const initialMap = {};
    const initialStocks = {};

    items.forEach((item, idx) => {
      const key = item.id || item.product_id || idx;
      const sStock = item.size_stock || item.sizeStock || {};
      initialStocks[key] = {
        size_stock: sStock,
        sizes: item.sizes || (sStock && Object.keys(sStock).length > 0 ? Object.keys(sStock) : null)
      };

      // Determine initial replacement size: choose in-stock size if original is OOS
      let initialRepSize = item.size || item.selectedSize || 'M';
      if (sStock && typeof sStock === 'object' && Object.keys(sStock).length > 0) {
        const inStockKey = Object.keys(sStock).find(sz => parseInt(sStock[sz] || 0, 10) > 0);
        if (inStockKey) {
          const origMatch = Object.keys(sStock).find(k => k.trim().toUpperCase() === initialRepSize.trim().toUpperCase());
          if (!origMatch || parseInt(sStock[origMatch] || 0, 10) <= 0) {
            initialRepSize = inStockKey;
          }
        }
      }

      initialMap[key] = {
        action: defaultAction,
        reason: 'Size or fit issue',
        replacementSize: initialRepSize
      };

      // Proactively fetch live product details for 100% accurate real-time inventory
      const prodId = item.product_id || item.productId;
      if (prodId) {
        apiClient(`/api/products/${prodId}`)
          .then(res => {
            const liveProd = res?.data || res;
            if (liveProd && typeof liveProd === 'object') {
              const liveStock = liveProd.size_stock || liveProd.sizeStock || {};
              const liveSizes = liveProd.sizes || (liveStock && Object.keys(liveStock).length > 0 ? Object.keys(liveStock) : null);
              setProductSizeStocks(prev => ({
                ...prev,
                [key]: {
                  size_stock: liveStock,
                  sizes: liveSizes
                }
              }));

              if (liveStock && typeof liveStock === 'object') {
                const liveInStockKey = Object.keys(liveStock).find(sz => parseInt(liveStock[sz] || 0, 10) > 0);
                if (liveInStockKey) {
                  setItemActionsState(prevSt => {
                    const cur = prevSt[key];
                    if (cur) {
                      const curMatch = Object.keys(liveStock).find(k => k.trim().toUpperCase() === (cur.replacementSize || '').trim().toUpperCase());
                      if (!curMatch || parseInt(liveStock[curMatch] || 0, 10) <= 0) {
                        return { ...prevSt, [key]: { ...cur, replacementSize: liveInStockKey } };
                      }
                    }
                    return prevSt;
                  });
                }
              }
            }
          })
          .catch(err => {
            console.warn('[Account] Could not fetch live size stock for product', prodId, err?.message);
          });
      }
    });

    setProductSizeStocks(initialStocks);
    setItemActionsState(initialMap);
    setItemReturnError('');
    setReturnComments('');

    const savedBank = getSavedBank(ord);
    setReturnBankDetails(savedBank);
    setSavedBankDetailsSnapshot(savedBank);
    setIsEditingReturnBank(!savedBank.accountNumber); // Default to verified saved card if saved details exist
  };

  const handleCloseReturnReplaceModal = () => {
    if (isSubmittingItemReturn) return;
    setReturnReplaceModalOrder(null);
    setItemReturnError('');
    setIsEditingReturnBank(false);
  };

  const handleSaveReturnBankToProfile = async () => {
    const cleanHolder = (returnBankDetails.holderName || '').trim();
    const cleanIfsc = (returnBankDetails.ifscCode || '').trim().toUpperCase();
    const cleanAccount = (returnBankDetails.accountNumber || '').trim();
    const cleanConfirm = (returnBankDetails.confirmAccountNumber || '').trim();

    if (!cleanHolder) {
      setItemReturnError('Please enter Account Holder Name.');
      return;
    }
    if (cleanHolder.length < 2 || !/^[a-zA-Z\s.]{2,70}$/.test(cleanHolder)) {
      setItemReturnError('Account Holder Name must be at least 2 characters (letters and spaces only).');
      return;
    }
    if (!cleanIfsc) {
      setItemReturnError('Please enter Bank IFSC Code.');
      return;
    }
    if (cleanIfsc.length !== 11) {
      setItemReturnError(`Bank IFSC Code must be exactly 11 characters (currently ${cleanIfsc.length}).`);
      return;
    }
    if (cleanIfsc[4] !== '0') {
      setItemReturnError('Invalid IFSC Code: The 5th character must be the digit 0 (zero).');
      return;
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
      setItemReturnError('Invalid Bank IFSC Code format (e.g. HDFC0008718).');
      return;
    }
    if (!cleanAccount) {
      setItemReturnError('Please enter Bank Account Number.');
      return;
    }
    if (!/^\d+$/.test(cleanAccount) || cleanAccount.length < 9 || cleanAccount.length > 18) {
      setItemReturnError(`Bank Account Number must be between 9 and 18 digits (currently ${cleanAccount.length} digits).`);
      return;
    }
    if (!cleanConfirm) {
      setItemReturnError('Please confirm your Bank Account Number.');
      return;
    }
    if (cleanAccount !== cleanConfirm) {
      setItemReturnError('Bank Account Numbers do not match. Please verify and re-enter.');
      return;
    }

    setItemReturnError('');

    const bankPayload = {
      accountNumber: cleanAccount,
      confirmAccountNumber: cleanAccount,
      ifscCode: cleanIfsc,
      holderName: cleanHolder
    };

    // ⚡ INSTANT OPTIMISTIC COMMIT: Save and switch UI view immediately with zero lag
    persistSavedBank(bankPayload);

    setReturnBankDetails({
      accountNumber: cleanAccount,
      confirmAccountNumber: cleanAccount,
      ifscCode: cleanIfsc,
      holderName: cleanHolder
    });
    setSavedBankDetailsSnapshot({
      accountNumber: cleanAccount,
      confirmAccountNumber: cleanAccount,
      ifscCode: cleanIfsc,
      holderName: cleanHolder
    });
    setIsEditingReturnBank(false);

    const targetOrderNum = returnReplaceModalOrder?.order_number || returnReplaceModalOrder?.id;
    if (targetOrderNum) {
      setOrders(prev => prev.map(o => (o.order_number === targetOrderNum || o.id === targetOrderNum ? {
        ...o,
        refund_bank_account: cleanAccount,
        refund_ifsc_code: cleanIfsc,
        refund_holder_name: cleanHolder
      } : o)));
    }

    if (typeof Swal !== 'undefined' && Swal.fire) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Bank Details Saved & Applied',
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true
      });
    } else {
      setToastMsg({
        type: 'success',
        title: 'Bank Details Updated',
        text: 'Refund bank details saved to your profile and applied.'
      });
    }

    // Background sync: dispatch profile & order update concurrently without blocking UI
    setIsSavingReturnBank(true);
    const syncOps = [];

    if (typeof updateUserProfile === 'function') {
      syncOps.push(
        updateUserProfile({
          refund_bank_account: cleanAccount,
          refund_ifsc_code: cleanIfsc,
          refund_holder_name: cleanHolder
        }).catch(e => console.warn('User profile bank sync warning:', e.message))
      );
    }

    if (targetOrderNum) {
      syncOps.push(
        apiClient(`/api/orders/${targetOrderNum}/bank-details`, {
          method: 'PUT',
          body: JSON.stringify(bankPayload)
        }).catch(e => console.warn('Order bank update warning:', e.message))
      );
    }

    Promise.allSettled(syncOps).finally(() => {
      setIsSavingReturnBank(false);
    });
  };

  const handleCancelEditReturnBank = () => {
    if (savedBankDetailsSnapshot?.accountNumber) {
      setReturnBankDetails(savedBankDetailsSnapshot);
    } else {
      const fallback = getSavedBank(returnReplaceModalOrder);
      setReturnBankDetails(fallback);
    }
    setIsEditingReturnBank(false);
    setItemReturnError('');
  };

  const handleConfirmReturnReplace = async (e) => {
    if (e) e.preventDefault();
    if (!returnReplaceModalOrder || isSubmittingItemReturn) return;

    const ord = returnReplaceModalOrder;
    const items = ord.items && Array.isArray(ord.items) && ord.items.length > 0 ? ord.items : [
      {
        id: ord.product_id || ord.id || 'item-1',
        name: ord.product_name || ord.name || 'Store Product',
        price: ord.price || ord.total || 0,
        quantity: ord.quantity || 1,
        image: ord.image || ord.image_url || '/assets/Images/Brown01.png',
        size: ord.selectedSize || ord.size || 'M'
      }
    ];

    const nonKeepItems = items.filter(it => {
      const key = it.id || it.product_id;
      const st = itemActionsState[key] || itemActionsState[it.id] || itemActionsState[it.product_id];
      return st && (st.action === 'Return' || st.action === 'Replace');
    });

    if (nonKeepItems.length === 0) {
      setItemReturnError('Please select at least one item to return or replace.');
      return;
    }

    const hasReturnItem = nonKeepItems.some(it => {
      const key = it.id || it.product_id;
      const st = itemActionsState[key] || itemActionsState[it.id] || itemActionsState[it.product_id];
      return st?.action === 'Return';
    });

    if (hasReturnItem) {
      const cleanHolder = (returnBankDetails.holderName || '').trim();
      const cleanIfsc = (returnBankDetails.ifscCode || '').trim().toUpperCase();
      const cleanAccount = (returnBankDetails.accountNumber || '').trim();
      const cleanConfirm = (returnBankDetails.confirmAccountNumber || '').trim();

      if (!cleanHolder) {
        setItemReturnError('Please enter the Account Holder Name.');
        return;
      }
      if (cleanHolder.length < 3 || !/^[a-zA-Z\s.]{3,70}$/.test(cleanHolder)) {
        setItemReturnError('Account Holder Name must be at least 3 characters and contain only letters.');
        return;
      }

      if (!cleanIfsc) {
        setItemReturnError('Please enter your Bank IFSC Code.');
        return;
      }
      if (cleanIfsc.length !== 11) {
        setItemReturnError(`Bank IFSC Code must be exactly 11 characters (currently ${cleanIfsc.length} characters). Example: HDFC0008718.`);
        return;
      }
      if (cleanIfsc[4] !== '0') {
        setItemReturnError('Invalid IFSC Code: The 5th character must be the digit 0 (zero), not the letter O.');
        return;
      }
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
        setItemReturnError('Invalid Bank IFSC Code format. Must be 4 letters, followed by 0, followed by 6 alphanumeric characters (e.g. HDFC0008718).');
        return;
      }

      if (!cleanAccount) {
        setItemReturnError('Please enter your Bank Account Number.');
        return;
      }
      if (!/^\d+$/.test(cleanAccount)) {
        setItemReturnError('Bank Account Number must contain numbers only.');
        return;
      }
      if (cleanAccount.length < 9 || cleanAccount.length > 18) {
        setItemReturnError(`Bank Account Number must be between 9 and 18 digits (currently ${cleanAccount.length} digits).`);
        return;
      }

      if (!cleanConfirm) {
        setItemReturnError('Please confirm your Bank Account Number.');
        return;
      }
      if (cleanAccount !== cleanConfirm) {
        setItemReturnError('Bank Account Numbers do not match. Please verify and re-enter.');
        return;
      }
    }

    // Verify each Replace item has an in-stock size selected
    for (const it of nonKeepItems) {
      const key = it.id || it.product_id;
      const st = itemActionsState[key] || itemActionsState[it.id] || itemActionsState[it.product_id];
      if (st?.action === 'Replace') {
        const chosenSize = (st.replacementSize || 'M').trim().toUpperCase();
        const sStock = productSizeStocks[key]?.size_stock || productSizeStocks[key]?.sizeStock || it.size_stock || it.sizeStock || {};
        if (sStock && typeof sStock === 'object' && Object.keys(sStock).length > 0) {
          const match = Object.keys(sStock).find(k => k.trim().toUpperCase() === chosenSize);
          const stock = match ? parseInt(sStock[match] || 0, 10) : 0;
          if (stock <= 0) {
            setItemReturnError(`Size "${chosenSize}" for "${it.name || it.title || 'item'}" is currently Out of Stock. Please select an available in-stock size, or switch to Return & Refund.`);
            return;
          }
        }
      }
    }

    setIsSubmittingItemReturn(true);
    setItemReturnError('');

    try {
      const orderNum = ord.id || ord.order_number || ord.orderNumber;
      const hasReplaceItem = nonKeepItems.some(it => {
        const key = it.id || it.product_id;
        const st = itemActionsState[key] || itemActionsState[it.id] || itemActionsState[it.product_id];
        return st?.action === 'Replace';
      });

      const reqType = (hasReturnItem && hasReplaceItem)
        ? 'Partial Return & Exchange'
        : hasReturnItem ? 'Return' : 'Replacement';

      const formattedItems = items.map(it => {
        const key = it.id || it.product_id;
        const st = itemActionsState[key] || itemActionsState[it.id] || itemActionsState[it.product_id] || { action: 'Keep' };
        const isActionReplace = st.action === 'Replace';
        return {
          id: it.id || it.product_id,
          product_id: it.product_id || it.id,
          action: st.action,
          reason: st.reason,
          replacementSize: isActionReplace ? (st.replacementSize || null) : null,
          quantity: it.quantity || 1
        };
      });

      const res = await apiClient(`/api/orders/${orderNum}/return-request`, {
        method: 'POST',
        body: JSON.stringify({
          type: reqType,
          items: formattedItems,
          bankDetails: hasReturnItem ? {
            accountNumber: returnBankDetails.accountNumber.trim(),
            ifscCode: returnBankDetails.ifscCode.trim().toUpperCase(),
            holderName: returnBankDetails.holderName.trim()
          } : null,
          comments: returnComments,
          reason: returnComments || (reqType === 'Return' ? 'Customer return request' : 'Customer exchange request')
        })
      });

      const updatedOrder = res?.data || {};
      const targetStatus = updatedOrder.status || (reqType === 'Replacement' ? 'Replacement Request Processing' : 'Return Request Processing');

      setOrders(prev =>
        prev.map(o => (o.id === ord.id || o.order_number === orderNum ? {
          ...o,
          status: targetStatus,
          return_type: updatedOrder.return_type || reqType,
          return_reason: updatedOrder.return_reason || returnComments,
          refund_bank_account: hasReturnItem ? returnBankDetails.accountNumber.trim() : o.refund_bank_account,
          refund_ifsc_code: hasReturnItem ? returnBankDetails.ifscCode.trim().toUpperCase() : o.refund_ifsc_code,
          refund_holder_name: hasReturnItem ? returnBankDetails.holderName.trim() : o.refund_holder_name,
          items: updatedOrder.items || o.items
        } : o))
      );

      if (hasReturnItem && returnBankDetails?.accountNumber) {
        persistSavedBank(returnBankDetails);
      }

      broadcastOrderUpdate({
        id: ord.id,
        orderNumber: orderNum,
        order_number: orderNum,
        status: targetStatus,
        return_type: updatedOrder.return_type || reqType
      });

      setToastMsg({
        type: 'success',
        title: 'Request Submitted',
        text: reqType === 'Replacement'
          ? 'Replacement request submitted for store review.'
          : 'Return / exchange request submitted for store review.'
      });

      setReturnReplaceModalOrder(null);
    } catch (err) {
      console.error('Error submitting return/exchange request:', err);
      setItemReturnError(err.message || 'Failed to submit return/replacement request. Please try again.');
    } finally {
      setIsSubmittingItemReturn(false);
    }
  };

  useModalScrollLock(Boolean(cancelModalOrder || replaceModalOrder || returnReplaceModalOrder), () => {
    if (!isSubmittingCancellation && cancelModalOrder) handleCloseCancelModal();
    if (!isSubmittingReplacement && replaceModalOrder) handleCloseReplaceModal();
    if (!isSubmittingItemReturn && returnReplaceModalOrder) handleCloseReturnReplaceModal();
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
            name: replaceModalOrder.product_name || replaceModalOrder.name || 'Store Product',
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
        text: 'Replacement request submitted for store review.',
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
        setOrders(res.data);
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
              rejection_reason: payload.rejection_reason || payload.rejectionReason || o.rejection_reason,
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

  const firstName = user?.firstName || user?.name?.split(' ')[0] || 'STORE MEMBER';

  const tabConfig = [
    { name: 'VIEW ORDERS', shortLabel: 'Orders', icon: Package, badge: orders.length > 0 ? orders.length : null },
    { name: 'VIEW WISHLIST', shortLabel: 'Wishlist', icon: Heart, badge: wishlist.length > 0 ? wishlist.length : null },
    // { name: 'MY COUPONS', icon: Ticket },
    { name: 'ACCOUNT DETAILS', shortLabel: 'Account', icon: User }
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

  const handleStartEditProfileBank = () => {
    setProfileBankForm({
      accountNumber: user?.bankDetails?.accountNumber || '',
      confirmAccountNumber: user?.bankDetails?.accountNumber || '',
      ifscCode: user?.bankDetails?.ifscCode || '',
      holderName: user?.bankDetails?.holderName || user?.name || ''
    });
    setProfileBankMessage({ type: '', text: '' });
    setIsEditingProfileBank(true);
  };

  const handleCancelEditProfileBank = () => {
    setIsEditingProfileBank(false);
    setProfileBankMessage({ type: '', text: '' });
  };

  const handleSaveProfileBank = async (e) => {
    if (e) e.preventDefault();
    const cleanHolder = (profileBankForm.holderName || '').trim();
    const cleanIfsc = (profileBankForm.ifscCode || '').trim().toUpperCase();
    const cleanAcc = (profileBankForm.accountNumber || '').trim();
    const cleanConfirm = (profileBankForm.confirmAccountNumber || '').trim();

    if (!cleanHolder || cleanHolder.length < 3 || !/^[a-zA-Z\s.]{3,70}$/.test(cleanHolder)) {
      setProfileBankMessage({ type: 'error', text: 'Account Holder Name must be at least 3 letters.' });
      return;
    }
    if (!cleanIfsc || cleanIfsc.length !== 11 || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
      setProfileBankMessage({ type: 'error', text: 'Valid 11-digit IFSC code required (5th character must be 0).' });
      return;
    }
    if (!cleanAcc || !/^\d{9,18}$/.test(cleanAcc)) {
      setProfileBankMessage({ type: 'error', text: 'Account number must be 9 to 18 digits (numbers only).' });
      return;
    }
    if (cleanAcc !== cleanConfirm) {
      setProfileBankMessage({ type: 'error', text: 'Account numbers do not match.' });
      return;
    }

    setProfileBankSaving(true);
    setProfileBankMessage({ type: '', text: '' });

    const res = await updateUserProfile({
      bankDetails: {
        accountNumber: cleanAcc,
        ifscCode: cleanIfsc,
        holderName: cleanHolder
      }
    });

    setProfileBankSaving(false);
    if (res.success) {
      setIsEditingProfileBank(false);
      setProfileBankMessage({ type: 'success', text: 'Refund bank details saved successfully!' });
      setTimeout(() => setProfileBankMessage({ type: '', text: '' }), 4000);
    } else {
      setProfileBankMessage({ type: 'error', text: res.error || 'Failed to save bank details.' });
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
      setToastMsg({
        type: 'error',
        title: 'Incomplete Details',
        text: 'Please check and fill all required address fields properly.'
      });
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
      setToastMsg({
        type: 'success',
        title: 'Address Saved',
        text: editingAddressId ? 'Delivery address updated successfully!' : 'Delivery address added successfully!'
      });
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
      setToastMsg({
        type: 'success',
        title: 'Address Saved',
        text: editingAddressId ? 'Delivery address updated successfully!' : 'Delivery address added successfully!'
      });
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
          <p className="text-xs uppercase tracking-widest text-neutral-400">Loading your Store profile...</p>
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
              className="relative z-10 w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 md:p-9 border border-neutral-100 max-h-[90vh] overflow-y-auto no-scrollbar scrollbar-none text-left"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
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
                  ? 'Request a return for your delivered piece(s). Our customer care team will coordinate reverse pickup and process your 100% full refund.'
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
                  <div 
                    className="space-y-2.5 max-h-56 overflow-y-auto no-scrollbar scrollbar-none pr-1"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
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
                                {item.name || item.title || 'Store Item'}
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
                      Please verify your refund bank details. Once your {isDeliveredModalOrder ? 'return is received and verified' : 'cancellation is approved'}, your refund of <strong className="text-neutral-900 font-semibold font-serif">₹{estimatedRefund.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> will be credited directly to this bank account via secure IMPS / NEFT transfer.
                    </p>

                    {/* If user has saved bank details and is NOT in editing mode, show Saved Bank Card */}
                    {returnBankDetails.accountNumber && !isEditingCancelBank ? (
                      <div className="bg-white border border-emerald-200/80 rounded-xl p-3.5 sm:p-4 shadow-2xs">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1.5 font-sans">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">✓</span>
                              <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-800">
                                Saved Bank Account
                              </span>
                            </div>
                            <div className="text-sm font-semibold text-neutral-900">
                              {returnBankDetails.holderName || user?.name || 'Account Holder'}
                            </div>
                            <div className="text-xs text-neutral-600 font-mono flex flex-wrap items-center gap-x-4 gap-y-1">
                              <span>
                                A/C: •••• •••• •••• {String(returnBankDetails.accountNumber).slice(-4)}
                              </span>
                              <span>
                                IFSC: <span className="font-bold uppercase text-neutral-800">{returnBankDetails.ifscCode}</span>
                              </span>
                            </div>
                            <p className="text-[10px] text-neutral-400 font-sans pt-0.5">
                              This saved account will be used automatically for your refund payout.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingCancelBank(true);
                              setReturnBankDetails(prev => ({
                                ...prev,
                                confirmAccountNumber: prev.accountNumber
                              }));
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wider text-brand-dark hover:opacity-75 no-underline hover:no-underline uppercase shrink-0 pt-0.5 cursor-pointer"
                          >
                            <Pencil className="w-3 h-3" />
                            <span className="no-underline">CHANGE</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Editable Bank Form */
                      <div className="space-y-3 pt-1">
                        {returnBankDetails.accountNumber && isEditingCancelBank && (
                          <div className="flex items-center justify-between pb-1">
                            <span className="text-[11px] text-neutral-500 font-medium">Update Bank Account Details:</span>
                            <button
                              type="button"
                              onClick={() => setIsEditingCancelBank(false)}
                              className="text-[11px] font-semibold text-neutral-500 hover:text-black uppercase tracking-wider cursor-pointer"
                            >
                              Use Saved Details
                            </button>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Account Holder Name */}
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-neutral-700 uppercase tracking-wider mb-1 font-sans">
                              Account Holder Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={returnBankDetails.holderName}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^a-zA-Z\s.]/g, '');
                                setReturnBankDetails(prev => ({ ...prev, holderName: val }));
                                setBankDetailsError('');
                              }}
                              placeholder=""
                              className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 font-sans"
                            />
                            <span className="text-[10px] text-neutral-400 mt-1 block font-sans">
                              Name as per bank records (letters only)
                            </span>
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
                                const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 11);
                                setReturnBankDetails(prev => ({ ...prev, ifscCode: val }));
                                setBankDetailsError('');
                              }}
                              placeholder="e.g. HDFC0008718"
                              maxLength={11}
                              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none font-mono uppercase ${
                                returnBankDetails.ifscCode?.length === 11 && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(returnBankDetails.ifscCode)
                                  ? 'border-emerald-500 bg-emerald-50/20'
                                  : returnBankDetails.ifscCode?.length >= 5 && returnBankDetails.ifscCode[4] !== '0'
                                  ? 'border-red-400 bg-red-50/20'
                                  : 'border-neutral-200 focus:border-neutral-400'
                              }`}
                            />
                            <span className={`text-[10px] mt-1 block font-sans ${
                              returnBankDetails.ifscCode?.length === 11 && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(returnBankDetails.ifscCode)
                                ? 'text-emerald-700 font-medium'
                                : returnBankDetails.ifscCode?.length >= 5 && returnBankDetails.ifscCode[4] !== '0'
                                ? 'text-red-600 font-medium'
                                : 'text-neutral-400'
                            }`}>
                              {returnBankDetails.ifscCode?.length === 11 && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(returnBankDetails.ifscCode)
                                ? '✓ Valid IFSC format'
                                : returnBankDetails.ifscCode?.length >= 5 && returnBankDetails.ifscCode[4] !== '0'
                                ? '⚠ 5th character must be 0 (zero)'
                                : returnBankDetails.ifscCode?.length > 0
                                ? `${returnBankDetails.ifscCode.length}/11 characters (e.g. HDFC0008718)`
                                : '11 characters, 5th character must be 0'}
                            </span>
                          </div>

                          {/* Account Number */}
                          <div>
                            <label className="block text-[10px] font-bold text-neutral-700 uppercase tracking-wider mb-1 font-sans">
                              Bank Account Number <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              maxLength={18}
                              value={returnBankDetails.accountNumber}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 18);
                                setReturnBankDetails(prev => ({ ...prev, accountNumber: val }));
                                setBankDetailsError('');
                              }}
                              placeholder="e.g. 47854908579056756"
                              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none font-mono ${
                                returnBankDetails.accountNumber?.length >= 9 && returnBankDetails.accountNumber?.length <= 18
                                  ? 'border-emerald-500 bg-emerald-50/20'
                                  : returnBankDetails.accountNumber?.length > 0
                                  ? 'border-amber-400'
                                  : 'border-neutral-200 focus:border-neutral-400'
                              }`}
                            />
                            <span className={`text-[10px] mt-1 block font-sans ${
                              returnBankDetails.accountNumber?.length >= 9 && returnBankDetails.accountNumber?.length <= 18
                                ? 'text-emerald-700 font-medium'
                                : 'text-neutral-400'
                            }`}>
                              {returnBankDetails.accountNumber?.length >= 9 && returnBankDetails.accountNumber?.length <= 18
                                ? `✓ Valid account number (${returnBankDetails.accountNumber.length} digits)`
                                : returnBankDetails.accountNumber?.length > 0
                                ? `${returnBankDetails.accountNumber.length}/18 digits (minimum 9 digits)`
                                : '9 to 18 digits (numbers only)'}
                            </span>
                          </div>

                          {/* Confirm Account Number */}
                          <div>
                            <label className="block text-[10px] font-bold text-neutral-700 uppercase tracking-wider mb-1 font-sans">
                              Confirm Account Number <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              maxLength={18}
                              value={returnBankDetails.confirmAccountNumber}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 18);
                                setReturnBankDetails(prev => ({ ...prev, confirmAccountNumber: val }));
                                setBankDetailsError('');
                              }}
                              placeholder="Re-enter Account Number"
                              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none font-mono ${
                                returnBankDetails.confirmAccountNumber && returnBankDetails.confirmAccountNumber === returnBankDetails.accountNumber
                                  ? 'border-emerald-500 bg-emerald-50/20'
                                  : returnBankDetails.confirmAccountNumber
                                  ? 'border-red-400 bg-red-50/20'
                                  : 'border-neutral-200 focus:border-neutral-400'
                              }`}
                            />
                            <span className={`text-[10px] mt-1 block font-sans ${
                              returnBankDetails.confirmAccountNumber && returnBankDetails.confirmAccountNumber === returnBankDetails.accountNumber
                                ? 'text-emerald-700 font-medium'
                                : returnBankDetails.confirmAccountNumber
                                ? 'text-red-600 font-medium'
                                : 'text-neutral-400'
                            }`}>
                              {returnBankDetails.confirmAccountNumber && returnBankDetails.confirmAccountNumber === returnBankDetails.accountNumber
                                ? '✓ Account numbers match'
                                : returnBankDetails.confirmAccountNumber
                                ? '⚠ Numbers do not match'
                                : 'Re-enter same account number'}
                            </span>
                          </div>
                        </div>

                        <p className="text-[10px] text-neutral-500 italic pt-1">
                          🔒 These bank details will be saved to your profile for seamless future refund processing.
                        </p>
                      </div>
                    )}

                    {bankDetailsError && (
                      <p className="text-[11px] text-red-600 font-medium bg-red-50 p-2.5 rounded-xl border border-red-200">
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
                        ? 'Your post-delivery cancellation request will be submitted to our team for review. Upon approval, pickup back to House of Urvaah is scheduled and your refund will be processed via the Refund Desk.'
                        : isCODOrder
                        ? 'Your request will be submitted for admin review prior to delivery. Once approved, this Cash on Delivery order will be cancelled with no payment due.'
                        : 'Your request will be submitted to our team for approval. Upon approval, online/UPI payments will be routed directly to our Refund Desk for full disbursement.'}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 selection:bg-neutral-900 font-sans">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmittingItemReturn && handleCloseReturnReplaceModal()}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative z-10 w-full max-w-2xl bg-white shadow-2xl p-5 sm:p-7 border border-neutral-200 max-h-[92vh] flex flex-col text-left rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-neutral-200 shrink-0">
                <div>
                  <span className="text-[10px] font-serif tracking-[0.25em] text-neutral-400 uppercase block mb-1">
                    HOUSE OF URVAAH • RETURNS & EXCHANGES
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-base sm:text-lg font-serif tracking-[0.1em] uppercase text-neutral-900 font-bold">
                      RETURN OR EXCHANGE PIECES
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Choose an action for each garment in Order #{returnReplaceModalOrder.order_number || returnReplaceModalOrder.orderNumber}.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCloseReturnReplaceModal}
                  disabled={isSubmittingItemReturn}
                  className="p-1.5 text-neutral-400 hover:text-black rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <form onSubmit={handleConfirmReturnReplace} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 no-scrollbar scrollbar-none">
                {itemReturnError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{itemReturnError}</span>
                  </div>
                )}

                {/* Items List */}
                {(() => {
                  const currentItems = returnReplaceModalOrder.items && Array.isArray(returnReplaceModalOrder.items) && returnReplaceModalOrder.items.length > 0
                    ? returnReplaceModalOrder.items
                    : [
                        {
                          id: returnReplaceModalOrder.product_id || returnReplaceModalOrder.id || 'item-1',
                          name: returnReplaceModalOrder.product_name || returnReplaceModalOrder.name || 'Store Product',
                          price: returnReplaceModalOrder.price || returnReplaceModalOrder.total || 0,
                          quantity: returnReplaceModalOrder.quantity || 1,
                          image: returnReplaceModalOrder.image || returnReplaceModalOrder.image_url || '/assets/Images/Brown01.png',
                          size: returnReplaceModalOrder.selectedSize || returnReplaceModalOrder.size || 'M'
                        }
                      ];

                  const gstInfo = getOrderGstInfo(returnReplaceModalOrder);
                  const isSingle = currentItems.length === 1;

                  return (
                    <div className="space-y-3">
                      <span className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider block">
                        Select Action Per Product ({currentItems.length} items)
                      </span>

                      {currentItems.map((item, idx) => {
                        const itemKey = item.id || item.product_id || idx;
                        const currentState = itemActionsState[itemKey] || {
                          action: currentItems.length <= 1 ? 'Return' : 'Keep',
                          reason: 'Size or fit issue',
                          replacementSize: item.size || item.selectedSize || 'M'
                        };
                        const itemAction = currentState.action;
                        const itemImg = getSupabaseMediaUrl(item.image || item.image_url || '/assets/Images/Blue02.png');
                        const breakdown = getItemGstBreakdown(item, gstInfo, isSingle);

                        return (
                          <div
                            key={itemKey}
                            className={`p-3.5 rounded-xl border transition-all text-xs ${
                              itemAction === 'Return'
                                ? 'border-amber-300 bg-amber-50/40'
                                : itemAction === 'Replace'
                                ? 'border-purple-300 bg-purple-50/40'
                                : 'border-neutral-200 bg-neutral-50/60'
                            }`}
                          >
                            {/* Item Basic Info */}
                            <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-200/60">
                              <div className="flex items-center gap-3 min-w-0">
                                <img
                                  src={itemImg}
                                  alt={item.name}
                                  className="w-12 h-14 object-contain rounded-lg border bg-white p-0.5 shrink-0"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = getSupabaseMediaUrl('Images/Blue02.png');
                                  }}
                                />
                                <div className="min-w-0">
                                  <p className="font-bold text-neutral-900 truncate">{item.name || item.title || item.product_name || 'Store Item'}</p>
                                  <p className="text-[11px] text-neutral-500">
                                    Size: <strong className="text-neutral-800">{item.size || item.selectedSize || 'M'}</strong> • Qty: {breakdown.qty}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="font-bold text-neutral-900 block text-sm">
                                  ₹{breakdown.totalWithTax.toLocaleString('en-IN')}
                                </span>
                                {breakdown.taxAmount > 0 ? (
                                  <div className="text-[10px] text-neutral-500 font-sans leading-tight mt-0.5 space-y-0.5">
                                    <div>
                                      Base: <span className="font-medium text-neutral-700">₹{breakdown.baseTotal.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="text-amber-900 font-semibold bg-amber-50/90 px-1.5 py-0.5 rounded border border-amber-200/80 inline-block">
                                      + GST ({breakdown.taxRate}%): ₹{breakdown.taxAmount.toLocaleString('en-IN')}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-neutral-400 block mt-0.5">Incl. all taxes</span>
                                )}
                              </div>
                            </div>

                            {/* 3 Action Buttons */}
                            <div className="pt-3">
                              <div className="grid grid-cols-3 gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setItemActionsState(prev => ({
                                      ...prev,
                                      [itemKey]: { ...currentState, action: 'Keep' }
                                    }));
                                  }}
                                  className={`py-2 px-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer border text-center ${
                                    itemAction === 'Keep'
                                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                                      : 'bg-white text-neutral-700 border-neutral-300 hover:border-black'
                                  }`}
                                >
                                  Keep Piece
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setItemActionsState(prev => ({
                                      ...prev,
                                      [itemKey]: { ...currentState, action: 'Return' }
                                    }));
                                  }}
                                  className={`py-2 px-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer border text-center ${
                                    itemAction === 'Return'
                                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                      : 'bg-white text-neutral-700 border-neutral-300 hover:border-amber-600 hover:text-amber-800'
                                  }`}
                                >
                                  Return & Refund
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setItemActionsState(prev => ({
                                      ...prev,
                                      [itemKey]: { ...currentState, action: 'Replace' }
                                    }));
                                  }}
                                  className={`py-2 px-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer border text-center ${
                                    itemAction === 'Replace'
                                      ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                                      : 'bg-white text-neutral-700 border-neutral-300 hover:border-purple-800 hover:text-purple-900'
                                  }`}
                                >
                                  Replace Product
                                </button>
                              </div>

                              {/* Return Specific Option */}
                              {itemAction === 'Return' && (
                                <div className="mt-3 p-2.5 bg-white rounded-lg border border-amber-200 text-xs space-y-2 animate-in fade-in duration-150">
                                  <label className="block text-[10px] font-bold text-amber-900 uppercase">
                                    Reason for Returning
                                  </label>
                                  <select
                                    value={currentState.reason || 'Size or fit issue'}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setItemActionsState(prev => ({
                                        ...prev,
                                        [itemKey]: { ...currentState, reason: val }
                                      }));
                                    }}
                                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded text-xs bg-white text-neutral-800 focus:outline-none"
                                  >
                                    <option value="Size or fit issue">Size or fit issue</option>
                                    <option value="Defective or damaged piece received">Defective or damaged piece received</option>
                                    <option value="Quality or fabric not as expected">Quality or fabric not as expected</option>
                                    <option value="Received incorrect item or color">Received incorrect item or color</option>
                                    <option value="Did not match online images">Did not match online images</option>
                                    <option value="Changed my mind">Changed my mind</option>
                                    <option value="Other">Other</option>
                                  </select>
                                  <div className="pt-1 text-[11px] text-amber-900 space-y-0.5">
                                    <div className="flex items-center justify-between font-semibold">
                                      <span>Refund Breakdown:</span>
                                      <span className="font-bold text-amber-950">₹{breakdown.totalWithTax.toLocaleString('en-IN')} Total</span>
                                    </div>
                                    {breakdown.taxAmount > 0 && (
                                      <div className="text-[10px] text-amber-800 flex items-center gap-1.5 font-medium">
                                        <span>Base Price: ₹{breakdown.baseTotal.toLocaleString('en-IN')}</span>
                                        <span>•</span>
                                        <span className="text-emerald-800 font-bold">Refundable GST ({breakdown.taxRate}%): +₹{breakdown.taxAmount.toLocaleString('en-IN')}</span>
                                      </div>
                                    )}
                                    <p className="text-[10px] text-amber-700 pt-0.5">
                                      Refund of ₹{breakdown.totalWithTax.toLocaleString('en-IN')}{breakdown.taxAmount > 0 ? ` (including ₹${breakdown.taxAmount.toLocaleString('en-IN')} GST)` : ''} will be credited upon doorstep collection & quality check.
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Replace Specific Option */}
                              {itemAction === 'Replace' && (() => {
                                const stockInfo = productSizeStocks[itemKey] || {
                                  size_stock: item.size_stock || item.sizeStock || {},
                                  sizes: item.sizes || null
                                };
                                const sizeStockObj = stockInfo.size_stock || {};
                                const hasConfiguredStock = sizeStockObj && typeof sizeStockObj === 'object' && Object.keys(sizeStockObj).length > 0;

                                // Determine full size list for this item
                                const rawSizes = stockInfo.sizes && Array.isArray(stockInfo.sizes) && stockInfo.sizes.length > 0
                                  ? stockInfo.sizes
                                  : (hasConfiguredStock ? Object.keys(sizeStockObj) : ['XS', 'S', 'M', 'L', 'XL', 'XXL']);

                                const sizeList = Array.from(new Set(rawSizes.map(s => String(s).trim().toUpperCase())));

                                const getStockForSize = (sz) => {
                                  if (!hasConfiguredStock) return null;
                                  const matchKey = Object.keys(sizeStockObj).find(k => k.trim().toUpperCase() === sz.toUpperCase());
                                  if (!matchKey) return 0;
                                  return parseInt(sizeStockObj[matchKey] || 0, 10);
                                };

                                const selectedSz = (currentState.replacementSize || 'M').trim().toUpperCase();
                                const currentStock = getStockForSize(selectedSz);
                                const isSelectedOutOfStock = currentStock !== null && currentStock <= 0;
                                const allOutOfStock = hasConfiguredStock && sizeList.every(sz => getStockForSize(sz) <= 0);

                                return (
                                  <div className="mt-3 p-3 bg-white rounded-xl border border-purple-200 text-xs space-y-3 animate-in fade-in duration-150">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div>
                                        <div className="flex items-center justify-between mb-1">
                                          <label className="block text-[10px] font-bold text-purple-900 uppercase">
                                            Preferred Replacement Size
                                          </label>
                                          {currentStock !== null && currentStock > 0 && (
                                            <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                              In Stock ({currentStock})
                                            </span>
                                          )}
                                        </div>
                                        <select
                                          value={currentState.replacementSize || (sizeList[0] || 'M')}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setItemActionsState(prev => ({
                                              ...prev,
                                              [itemKey]: { ...currentState, replacementSize: val }
                                            }));
                                          }}
                                          className={`w-full px-2.5 py-2 border rounded-lg text-xs bg-white text-neutral-800 focus:outline-none transition-colors ${
                                            isSelectedOutOfStock 
                                              ? 'border-red-400 ring-1 ring-red-400 bg-red-50/20' 
                                              : 'border-neutral-300 focus:border-purple-600'
                                          }`}
                                        >
                                          {sizeList.map((sz) => {
                                            const stockNum = getStockForSize(sz);
                                            const isOOS = stockNum !== null && stockNum <= 0;
                                            return (
                                              <option 
                                                key={sz} 
                                                value={sz} 
                                                disabled={isOOS}
                                                className={isOOS ? "text-neutral-400 bg-neutral-100 font-normal" : "text-neutral-900 font-medium"}
                                              >
                                                {sz} {isOOS ? '— (Out of Stock)' : (stockNum !== null && stockNum <= 3 ? `(Only ${stockNum} left)` : '')}
                                              </option>
                                            );
                                          })}
                                        </select>

                                        {/* Dynamic Out of Stock Warning Banner */}
                                        {isSelectedOutOfStock && (
                                          <div className="mt-1.5 p-2 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-700 flex items-start gap-1.5 leading-snug animate-in fade-in">
                                            <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                                            <div>
                                              <span className="font-bold">Size {selectedSz} is Out of Stock.</span>
                                              <span className="block text-[10px] text-red-600 mt-0.5">
                                                Please choose another size or switch to <strong>Return & Refund</strong> above.
                                              </span>
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      <div>
                                        <label className="block text-[10px] font-bold text-purple-900 uppercase mb-1">
                                          Reason for Exchange
                                        </label>
                                        <select
                                          value={currentState.reason || 'Size or fit issue - need different size'}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setItemActionsState(prev => ({
                                              ...prev,
                                              [itemKey]: { ...currentState, reason: val }
                                            }));
                                          }}
                                          className="w-full px-2.5 py-2 border border-neutral-300 rounded-lg text-xs bg-white text-neutral-800 focus:outline-none focus:border-purple-600"
                                        >
                                          <option value="Size or fit issue - need different size">Size or fit issue - need different size</option>
                                          <option value="Defective or damaged piece received">Defective or damaged piece received</option>
                                          <option value="Color or variant exchange">Color or variant exchange</option>
                                          <option value="Other">Other</option>
                                        </select>
                                      </div>
                                    </div>

                                    {allOutOfStock && (
                                      <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                                        <div>
                                          <p className="font-bold">All sizes for this garment are currently Out of Stock.</p>
                                          <p className="text-[11px] mt-0.5 text-amber-800">
                                            We cannot fulfill an immediate exchange. Please select <strong>Return & Refund</strong> above to receive a 100% refund.
                                          </p>
                                        </div>
                                      </div>
                                    )}

                                    <div className="pt-1 text-[10.5px] text-purple-900 space-y-0.5">
                                      <div className="flex items-center justify-between text-[11px] font-semibold text-purple-950">
                                        <span>Exchange Balance: ₹0 (No Additional Payment)</span>
                                        <span className="text-[10px] bg-purple-100/90 text-purple-800 px-1.5 py-0.5 rounded font-medium">100% Value Transferred</span>
                                      </div>
                                      <p className="text-[10px] text-purple-700">
                                        Complimentary reverse pickup will collect this piece. Full value of ₹{breakdown.totalWithTax.toLocaleString('en-IN')}{breakdown.taxAmount > 0 ? ` (₹${breakdown.baseTotal.toLocaleString('en-IN')} item + ₹${breakdown.taxAmount.toLocaleString('en-IN')} GST at ${breakdown.taxRate}%)` : ''} is carried over to your replacement piece.
                                      </p>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Real-time Scenario Summary Strip */}
                {(() => {
                  const currentItems = returnReplaceModalOrder.items && Array.isArray(returnReplaceModalOrder.items) && returnReplaceModalOrder.items.length > 0
                    ? returnReplaceModalOrder.items
                    : [
                        {
                          id: returnReplaceModalOrder.product_id || returnReplaceModalOrder.id || 'item-1',
                          price: returnReplaceModalOrder.price || returnReplaceModalOrder.total || 0,
                          quantity: returnReplaceModalOrder.quantity || 1
                        }
                      ];

                  const gstInfo = getOrderGstInfo(returnReplaceModalOrder);
                  const isSingle = currentItems.length === 1;

                  let keptC = 0;
                  let retC = 0;
                  let repC = 0;
                  let retBaseTotal = 0;
                  let retGstTotal = 0;
                  let repBaseTotal = 0;
                  let repGstTotal = 0;

                  currentItems.forEach(it => {
                    const k = it.id || it.product_id;
                    const act = itemActionsState[k]?.action || (currentItems.length <= 1 ? 'Return' : 'Keep');
                    const b = getItemGstBreakdown(it, gstInfo, isSingle);
                    if (act === 'Keep') keptC++;
                    else if (act === 'Return') {
                      retC++;
                      retBaseTotal += b.baseTotal;
                      retGstTotal += b.taxAmount;
                    } else if (act === 'Replace') {
                      repC++;
                      repBaseTotal += b.baseTotal;
                      repGstTotal += b.taxAmount;
                    }
                  });

                  const totalRefundAmount = retBaseTotal + retGstTotal;

                  return (
                    <div className="p-3.5 bg-neutral-900 text-white rounded-xl text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                          REQUEST SUMMARY
                        </span>
                        {retC > 0 && gstInfo.taxRate > 0 && (
                          <span className="text-[10px] text-amber-300 font-mono font-medium">
                            GST Refund Included ({gstInfo.taxRate}%)
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        {keptC > 0 && (
                          <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-md text-[11px] font-semibold">
                            {keptC} Piece(s) Kept
                          </span>
                        )}
                        {retC > 0 && (
                          <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 rounded-md text-[11px] font-semibold">
                            {retC} Return (Refund: ₹{totalRefundAmount.toLocaleString('en-IN')})
                          </span>
                        )}
                        {repC > 0 && (
                          <span className="px-2 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 rounded-md text-[11px] font-semibold">
                            {repC} Replace Product(s)
                          </span>
                        )}
                      </div>

                      {/* Financial Breakdown with GST */}
                      {retC > 0 && (
                        <div className="pt-2 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-sans">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-neutral-300">
                            <span>Item Base: <strong className="text-white">₹{retBaseTotal.toLocaleString('en-IN')}</strong></span>
                            <span>+</span>
                            <span className="text-amber-300 font-semibold">
                              GST ({gstInfo.taxRate}%): <strong>₹{retGstTotal.toLocaleString('en-IN')}</strong>
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-neutral-400 text-[10px] block">Total Refund to Bank:</span>
                            <span className="text-emerald-400 font-bold text-sm">₹{totalRefundAmount.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      )}

                      {repC > 0 && retC === 0 && (
                        <div className="pt-2 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-sans">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-neutral-300">
                            <span>Garment Value: <strong className="text-white">₹{repBaseTotal.toLocaleString('en-IN')}</strong></span>
                            <span>+</span>
                            <span>GST ({gstInfo.taxRate}%): <strong className="text-purple-300">₹{repGstTotal.toLocaleString('en-IN')}</strong></span>
                          </div>
                          <div className="text-right">
                            <span className="text-neutral-400 text-[10px] block">Exchange Balance:</span>
                            <span className="text-white font-bold text-sm">₹0 (Free Exchange)</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Bank Details for Refund (if any return items selected) */}
                {(() => {
                  const currentItems = returnReplaceModalOrder.items && Array.isArray(returnReplaceModalOrder.items) && returnReplaceModalOrder.items.length > 0
                    ? returnReplaceModalOrder.items
                    : [{ id: returnReplaceModalOrder.product_id || returnReplaceModalOrder.id || 'item-1' }];
                  const hasReturn = currentItems.some(it => (itemActionsState[it.id || it.product_id]?.action || (currentItems.length <= 1 ? 'Return' : 'Keep')) === 'Return');

                  if (!hasReturn) return null;

                  const gstInfo = getOrderGstInfo(returnReplaceModalOrder);
                  const isSingle = currentItems.length === 1;
                  let retBaseTotal = 0;
                  let retGstTotal = 0;
                  currentItems.forEach((it) => {
                    const k = it.id || it.product_id;
                    const act = itemActionsState[k]?.action || (currentItems.length <= 1 ? 'Return' : 'Keep');
                    if (act === 'Return') {
                      const b = getItemGstBreakdown(it, gstInfo, isSingle);
                      retBaseTotal += b.baseTotal;
                      retGstTotal += b.taxAmount;
                    }
                  });
                  const totalRefundForBank = retBaseTotal + retGstTotal;

                  return (
                    <div className="p-3.5 sm:p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                        <div className="flex items-center gap-2 text-amber-900 font-bold uppercase text-[11px]">
                          <Banknote className="w-4 h-4 text-amber-700" />
                          <span>Bank Details for Refund Disbursement (IMPS / NEFT)</span>
                        </div>
                        <span className="text-[10px] font-sans font-bold text-amber-900 uppercase tracking-widest bg-white border border-amber-300 px-2 py-0.5 rounded-full">
                          Required for Refund
                        </span>
                      </div>

                      <p className="text-[11px] text-neutral-600 leading-relaxed">
                        Please verify your bank details so our finance desk can disburse your full refund of{' '}
                        <strong className="text-neutral-900 font-bold">
                          ₹{totalRefundForBank.toLocaleString('en-IN')}
                        </strong>
                        {retGstTotal > 0 && (
                          <span> (inclusive of ₹{retGstTotal.toLocaleString('en-IN')} GST at {gstInfo.taxRate}%)</span>
                        )}{' '}
                        directly via secure IMPS / NEFT transfer upon return arrival.
                      </p>

                      {/* Saved Bank Details Card View */}
                      {returnBankDetails.accountNumber && !isEditingReturnBank ? (
                        <div className="bg-white border border-emerald-300/80 rounded-xl p-3.5 shadow-2xs">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 font-sans">
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">✓</span>
                                <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-800">
                                  Saved Bank Account
                                </span>
                              </div>
                              <div className="text-sm font-semibold text-neutral-900">
                                {returnBankDetails.holderName || user?.name || 'Account Holder'}
                              </div>
                              <div className="text-xs text-neutral-600 font-mono flex flex-wrap items-center gap-x-4 gap-y-1">
                                <span>
                                  A/C: •••• •••• •••• {String(returnBankDetails.accountNumber).slice(-4)}
                                </span>
                                <span>
                                  IFSC: <span className="font-bold uppercase text-neutral-800">{returnBankDetails.ifscCode}</span>
                                </span>
                              </div>
                              <p className="text-[10px] text-neutral-400 font-sans pt-0.5">
                                This saved account will be used automatically for your refund payout.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setSavedBankDetailsSnapshot({ ...returnBankDetails, confirmAccountNumber: returnBankDetails.accountNumber });
                                setIsEditingReturnBank(true);
                                setReturnBankDetails(prev => ({
                                  ...prev,
                                  confirmAccountNumber: prev.accountNumber
                                }));
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wider text-brand-dark hover:opacity-75 no-underline hover:no-underline uppercase shrink-0 pt-0.5 cursor-pointer"
                            >
                              <Pencil className="w-3 h-3" />
                              <span className="no-underline">CHANGE</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Editable Bank Form */
                        <div className="space-y-3 pt-1">
                          {returnBankDetails.accountNumber && isEditingReturnBank && (
                            <div className="pb-1">
                              <span className="text-[11px] text-neutral-700 font-bold uppercase tracking-wider">
                                Update Bank Account Details:
                              </span>
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Account Holder Name */}
                            <div>
                              <label className="block text-[10px] font-bold text-neutral-700 uppercase mb-1">
                                Account Holder Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={returnBankDetails.holderName}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^a-zA-Z\s.]/g, '');
                                  setReturnBankDetails(prev => ({ ...prev, holderName: val }));
                                  setItemReturnError('');
                                }}
                                placeholder=""
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs bg-white text-neutral-800 focus:outline-none focus:border-amber-500"
                              />
                              <span className="text-[10px] text-neutral-400 mt-1 block">
                                Name as per bank records (letters only)
                              </span>
                            </div>

                            {/* Bank IFSC Code */}
                            <div>
                              <label className="block text-[10px] font-bold text-neutral-700 uppercase mb-1">
                                Bank IFSC Code <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                maxLength={11}
                                value={returnBankDetails.ifscCode}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 11);
                                  setReturnBankDetails(prev => ({ ...prev, ifscCode: val }));
                                  setItemReturnError('');
                                }}
                                placeholder=""
                                className={`w-full px-3 py-2 border rounded-lg text-xs bg-white text-neutral-800 uppercase focus:outline-none font-mono ${
                                  returnBankDetails.ifscCode?.length === 11 && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(returnBankDetails.ifscCode)
                                    ? 'border-emerald-500 bg-emerald-50/20'
                                    : returnBankDetails.ifscCode?.length >= 5 && returnBankDetails.ifscCode[4] !== '0'
                                    ? 'border-red-400 bg-red-50/20'
                                    : 'border-neutral-300 focus:border-amber-500'
                                }`}
                              />
                              <span className={`text-[10px] mt-1 block ${
                                returnBankDetails.ifscCode?.length === 11 && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(returnBankDetails.ifscCode)
                                  ? 'text-emerald-700 font-medium'
                                  : returnBankDetails.ifscCode?.length >= 5 && returnBankDetails.ifscCode[4] !== '0'
                                  ? 'text-red-600 font-medium'
                                  : 'text-neutral-400'
                              }`}>
                                {returnBankDetails.ifscCode?.length === 11 && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(returnBankDetails.ifscCode)
                                  ? '✓ Valid IFSC format'
                                  : returnBankDetails.ifscCode?.length >= 5 && returnBankDetails.ifscCode[4] !== '0'
                                  ? '⚠ 5th character must be 0 (zero)'
                                  : returnBankDetails.ifscCode?.length > 0
                                  ? `${returnBankDetails.ifscCode.length}/11 characters (e.g. HDFC0008718)`
                                  : '11 characters, 5th character must be 0'}
                              </span>
                            </div>

                            {/* Bank Account Number */}
                            <div>
                              <label className="block text-[10px] font-bold text-neutral-700 uppercase mb-1">
                                Bank Account Number <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                maxLength={18}
                                value={returnBankDetails.accountNumber}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '').slice(0, 18);
                                  setReturnBankDetails(prev => ({ ...prev, accountNumber: val }));
                                  setItemReturnError('');
                                }}
                                placeholder=""
                                className={`w-full px-3 py-2 border rounded-lg text-xs bg-white text-neutral-800 focus:outline-none font-mono ${
                                  returnBankDetails.accountNumber?.length >= 9 && returnBankDetails.accountNumber?.length <= 18
                                    ? 'border-emerald-500 bg-emerald-50/20'
                                    : returnBankDetails.accountNumber?.length > 0
                                    ? 'border-amber-400'
                                    : 'border-neutral-300 focus:border-amber-500'
                                }`}
                              />
                              <span className={`text-[10px] mt-1 block ${
                                returnBankDetails.accountNumber?.length >= 9 && returnBankDetails.accountNumber?.length <= 18
                                  ? 'text-emerald-700 font-medium'
                                  : 'text-neutral-400'
                              }`}>
                                {returnBankDetails.accountNumber?.length >= 9 && returnBankDetails.accountNumber?.length <= 18
                                  ? `✓ Valid account number (${returnBankDetails.accountNumber.length} digits)`
                                  : returnBankDetails.accountNumber?.length > 0
                                  ? `${returnBankDetails.accountNumber.length}/18 digits (minimum 9 digits)`
                                  : '9 to 18 digits (numbers only)'}
                              </span>
                            </div>

                            {/* Confirm Account Number */}
                            <div>
                              <label className="block text-[10px] font-bold text-neutral-700 uppercase mb-1">
                                Confirm Account Number <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                maxLength={18}
                                value={returnBankDetails.confirmAccountNumber}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '').slice(0, 18);
                                  setReturnBankDetails(prev => ({ ...prev, confirmAccountNumber: val }));
                                  setItemReturnError('');
                                }}
                                placeholder=""
                                className={`w-full px-3 py-2 border rounded-lg text-xs bg-white text-neutral-800 focus:outline-none font-mono ${
                                  returnBankDetails.confirmAccountNumber && returnBankDetails.confirmAccountNumber === returnBankDetails.accountNumber
                                    ? 'border-emerald-500 bg-emerald-50/20'
                                    : returnBankDetails.confirmAccountNumber
                                    ? 'border-red-400 bg-red-50/20'
                                    : 'border-neutral-300 focus:border-amber-500'
                                }`}
                              />
                              <span className={`text-[10px] mt-1 block ${
                                returnBankDetails.confirmAccountNumber && returnBankDetails.confirmAccountNumber === returnBankDetails.accountNumber
                                  ? 'text-emerald-700 font-medium'
                                  : returnBankDetails.confirmAccountNumber
                                  ? 'text-red-600 font-medium'
                                  : 'text-neutral-400'
                              }`}>
                                {returnBankDetails.confirmAccountNumber && returnBankDetails.confirmAccountNumber === returnBankDetails.accountNumber
                                  ? '✓ Account numbers match'
                                  : returnBankDetails.confirmAccountNumber
                                  ? '⚠ Numbers do not match'
                                  : 'Re-enter same account number'}
                              </span>
                            </div>
                          </div>

                          {/* Mast Action Buttons: Save & Cancel */}
                          <div className="pt-3.5 border-t border-amber-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <button
                                type="button"
                                disabled={isSavingReturnBank}
                                onClick={handleSaveReturnBankToProfile}
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-black hover:bg-neutral-800 active:scale-[0.98] text-white text-xs font-semibold tracking-[0.14em] uppercase rounded-lg shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isSavingReturnBank ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                                    <span>SAVING DETAILS...</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3.5 h-3.5 stroke-[2.5] text-emerald-400" />
                                    <span>SAVE & APPLY DETAILS</span>
                                  </>
                                )}
                              </button>

                              {(returnBankDetails.accountNumber || savedBankDetailsSnapshot?.accountNumber || user?.bankDetails?.accountNumber) && (
                                <button
                                  type="button"
                                  disabled={isSavingReturnBank}
                                  onClick={handleCancelEditReturnBank}
                                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-neutral-300 hover:border-black bg-white hover:bg-neutral-50 active:scale-[0.98] text-neutral-700 hover:text-black text-xs font-semibold tracking-[0.14em] uppercase rounded-lg transition-all cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>CANCEL / KEEP SAVED</span>
                                </button>
                              )}
                            </div>

                            <span className="text-[10px] text-neutral-500 font-sans flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Details encrypted & saved to profile</span>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* General Comments */}
                <div>
                  <label className="block text-[10px] font-bold text-neutral-700 uppercase mb-1">
                    Additional Notes for Customer Care (Optional)
                  </label>
                  <textarea
                    value={returnComments}
                    onChange={(e) => setReturnComments(e.target.value)}
                    placeholder="Add any additional details or fit preferences..."
                    rows={2}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs bg-white text-neutral-800 focus:outline-none resize-none"
                  />
                </div>

                {/* Modal Footer Buttons */}
                <div className="pt-2 flex flex-col-reverse sm:flex-row gap-2.5">
                  <button
                    type="button"
                    disabled={isSubmittingItemReturn}
                    onClick={handleCloseReturnReplaceModal}
                    className="w-full sm:w-1/3 py-3 border border-neutral-300 text-neutral-800 text-xs font-bold tracking-[0.2em] uppercase hover:border-black transition-colors cursor-pointer text-center disabled:opacity-50 rounded-xl"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingItemReturn}
                    className="w-full sm:w-2/3 py-3 bg-neutral-900 text-white text-xs font-bold tracking-[0.2em] uppercase hover:bg-black transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm rounded-xl"
                  >
                    {isSubmittingItemReturn ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>SUBMITTING REQUEST...</span>
                      </>
                    ) : (
                      <span>SUBMIT RETURN / EXCHANGE REQUEST</span>
                    )}
                  </button>
                </div>
              </form>
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
                Delivered pieces can be exchanged for a different size or replacement piece. Select the item, choose your preferred size, and our customer care will coordinate reverse pickup and replacement delivery.
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
                                {item.name || item.title || 'Store Item'}
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
                    Notes for Customer Care (Optional)
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
                      Our courier will collect the piece from your delivery address with zero return fee. Upon verification by our store, your requested size ({replacementSize}) will be dispatched immediately.
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
                {user?.name || 'STORE MEMBER'}
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

        {/* 1. Premium Luxury House Navigation Bar */}
        <div className="mb-8 sm:mb-10 p-1.5 sm:p-2 bg-[#FAF8F3] border border-neutral-200/80 rounded-2xl shadow-xs">
          {/* Phones: equal 3-column bar with icon above a short label. sm+: one row with full labels */}
          <div className="grid grid-cols-3 sm:flex sm:items-center w-full sm:justify-between gap-1 sm:gap-2" role="tablist">
            {tabConfig.map((item) => {
              const isActive = activeTab === item.name;
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleTabClick(item.name)}
                  className={`relative sm:flex-1 flex items-center justify-center px-2 sm:px-5 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs tracking-[0.12em] sm:tracking-[0.18em] font-sans uppercase transition-all duration-200 cursor-pointer whitespace-nowrap select-none min-w-0 ${
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
                  <span className="relative z-10 flex flex-col sm:flex-row items-center gap-1 sm:gap-2 min-w-0">
                    <span className="relative">
                      <Icon className={`w-4 h-4 sm:w-3.5 sm:h-3.5 stroke-[1.6] shrink-0 transition-colors ${
                        isActive ? 'text-white' : item.isDanger ? 'text-neutral-400 group-hover:text-red-600' : 'text-neutral-500'
                      }`} />
                      {/* Phone: count badge sits on the icon corner */}
                      {typeof item.badge === 'number' && item.badge > 0 && (
                        <span className={`sm:hidden absolute -top-1.5 -right-3 min-w-[16px] px-1 py-px rounded-full text-[9px] font-semibold leading-none tabular-nums text-center ${
                          isActive ? 'bg-white text-brand-dark' : 'bg-brand-dark text-white'
                        }`}>
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </span>
                    <span className="sm:hidden truncate">{item.shortLabel || item.name}</span>
                    <span className="hidden sm:inline">{item.name}</span>
                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <span className={`hidden sm:inline px-1.5 py-0.5 rounded-full text-[10px] font-sans font-semibold leading-none tabular-nums ${
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

            {/* SAVED BANK DETAILS FOR REFUNDS SECTION */}
            <section className="bg-[#FAF8F3] p-6 sm:p-8 md:p-10 border border-[#E7E2D8] rounded-2xl shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-200">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-brand-dark" />
                    <h2 className="text-lg sm:text-xl font-serif tracking-[0.15em] uppercase text-black font-normal">
                      REFUND BANK ACCOUNT
                    </h2>
                  </div>
                  <p className="text-xs text-neutral-500 tracking-wider font-sans mt-0.5">
                    Saved bank details used automatically for return & cancellation refunds (IMPS / NEFT)
                  </p>
                </div>
                {!isEditingProfileBank ? (
                  <button
                    onClick={handleStartEditProfileBank}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase font-sans text-brand-dark hover:opacity-75 cursor-pointer self-start sm:self-auto"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>{user?.bankDetails?.accountNumber ? 'EDIT / CHANGE' : 'ADD BANK DETAILS'}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleCancelEditProfileBank}
                    className="text-xs font-semibold tracking-widest uppercase font-sans text-neutral-500 hover:text-black cursor-pointer self-start sm:self-auto"
                  >
                    CANCEL
                  </button>
                )}
              </div>

              {profileBankMessage.text && (
                <div className={`p-3.5 rounded-xl text-xs font-medium mb-5 border ${
                  profileBankMessage.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {profileBankMessage.text}
                </div>
              )}

              {!isEditingProfileBank ? (
                user?.bankDetails?.accountNumber ? (
                  <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-2xs font-sans">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div>
                        <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                          ACCOUNT HOLDER
                        </span>
                        <p className="text-sm sm:text-base text-neutral-900 font-medium">
                          {user.bankDetails.holderName || user.name || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                          ACCOUNT NUMBER
                        </span>
                        <p className="text-sm sm:text-base text-neutral-900 font-mono font-medium">
                          •••• •••• •••• {String(user.bankDetails.accountNumber).slice(-4)}
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                          IFSC CODE
                        </span>
                        <p className="text-sm sm:text-base text-neutral-900 font-mono uppercase font-semibold">
                          {user.bankDetails.ifscCode}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-3.5 border-t border-neutral-100 flex items-center gap-2 text-emerald-700 text-xs font-medium">
                      <span>✓ Verified for instant refund disbursement. No re-typing required during returns or cancellations.</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-dashed border-neutral-300 rounded-xl p-6 text-center font-sans">
                    <Building2 className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                    <p className="text-sm text-neutral-800 font-medium mb-1">No refund bank account saved yet</p>
                    <p className="text-xs text-neutral-500 mb-4">Add your bank details once so you never have to re-enter them during return or cancellation requests.</p>
                    <button
                      type="button"
                      onClick={handleStartEditProfileBank}
                      className="inline-flex items-center gap-2 bg-brand-dark hover:bg-neutral-800 text-white text-xs font-semibold tracking-widest px-5 py-2.5 uppercase transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>ADD BANK DETAILS</span>
                    </button>
                  </div>
                )
              ) : (
                <form onSubmit={handleSaveProfileBank} className="space-y-5 font-sans">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold tracking-wider text-neutral-700 uppercase mb-1.5">
                        ACCOUNT HOLDER NAME <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={profileBankForm.holderName}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^a-zA-Z\s.]/g, '');
                          setProfileBankForm(prev => ({ ...prev, holderName: val }));
                        }}
                        placeholder=""
                        className="w-full px-4 py-3 text-sm bg-white border border-neutral-300 focus:border-brand-dark focus:ring-1 focus:ring-brand-dark outline-none font-sans"
                        required
                      />
                      <span className="text-[10px] text-neutral-400 mt-1 block font-sans">
                        Full name exactly as shown in bank passbook / statement
                      </span>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold tracking-wider text-neutral-700 uppercase mb-1.5">
                        BANK IFSC CODE <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={11}
                        value={profileBankForm.ifscCode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 11);
                          setProfileBankForm(prev => ({ ...prev, ifscCode: val }));
                        }}
                        placeholder="e.g. HDFC0008718"
                        className="w-full px-4 py-3 text-sm bg-white border border-neutral-300 focus:border-brand-dark focus:ring-1 focus:ring-brand-dark outline-none font-mono uppercase"
                        required
                      />
                      <span className="text-[10px] text-neutral-400 mt-1 block font-sans">
                        11 characters, 5th character must be 0 (zero)
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold tracking-wider text-neutral-700 uppercase mb-1.5">
                        BANK ACCOUNT NUMBER <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={18}
                        value={profileBankForm.accountNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 18);
                          setProfileBankForm(prev => ({ ...prev, accountNumber: val }));
                        }}
                        placeholder="e.g. 47854908579056756"
                        className="w-full px-4 py-3 text-sm bg-white border border-neutral-300 focus:border-brand-dark focus:ring-1 focus:ring-brand-dark outline-none font-mono"
                        required
                      />
                      <span className="text-[10px] text-neutral-400 mt-1 block font-sans">
                        9 to 18 digits (numbers only)
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold tracking-wider text-neutral-700 uppercase mb-1.5">
                        CONFIRM ACCOUNT NUMBER <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={18}
                        value={profileBankForm.confirmAccountNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 18);
                          setProfileBankForm(prev => ({ ...prev, confirmAccountNumber: val }));
                        }}
                        placeholder="Re-enter same account number"
                        className={`w-full px-4 py-3 text-sm bg-white border ${
                          profileBankForm.confirmAccountNumber && profileBankForm.confirmAccountNumber === profileBankForm.accountNumber
                            ? 'border-emerald-500 focus:border-emerald-500'
                            : profileBankForm.confirmAccountNumber
                            ? 'border-red-400 focus:border-red-400'
                            : 'border-neutral-300 focus:border-brand-dark'
                        } focus:ring-1 outline-none font-mono`}
                        required
                      />
                      <span className={`text-[10px] mt-1 block font-sans ${
                        profileBankForm.confirmAccountNumber && profileBankForm.confirmAccountNumber === profileBankForm.accountNumber
                          ? 'text-emerald-700 font-medium'
                          : profileBankForm.confirmAccountNumber
                          ? 'text-red-600 font-medium'
                          : 'text-neutral-400'
                      }`}>
                        {profileBankForm.confirmAccountNumber && profileBankForm.confirmAccountNumber === profileBankForm.accountNumber
                          ? '✓ Account numbers match'
                          : profileBankForm.confirmAccountNumber
                          ? '⚠ Account numbers do not match'
                          : 'Re-enter same account number'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={profileBankSaving}
                      className="bg-brand-dark hover:bg-neutral-800 text-white text-xs font-semibold tracking-widest px-6 py-3 uppercase transition-colors cursor-pointer"
                    >
                      {profileBankSaving ? 'SAVING...' : 'SAVE BANK DETAILS'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEditProfileBank}
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

                  // A rejected return/replacement also carries a "...rejected by Admin" reason — not a cancellation rejection
                  const hasPostDeliveryRequest = Boolean(ord.return_type || ord.return_request_at || ord.return_rejection_reason);
                  const isCancellationRejected = !isCancellationRequested && !hasPostDeliveryRequest && (
                    statusLower === 'cancellation rejected' ||
                    Boolean(
                      ord.rejection_reason && (
                        ord.rejection_reason.toLowerCase().includes('cancel') ||
                        ord.rejection_reason.toLowerCase().includes('rejected by admin') ||
                        ord.rejection_reason.toLowerCase().includes('cancellation request rejected')
                      )
                    ) ||
                    Boolean(
                      ord.cancel_reason && (
                        ord.cancel_reason.toLowerCase().includes('rejected by admin') ||
                        ord.cancel_reason.toLowerCase().includes('cancellation request rejected')
                      )
                    )
                  );

                  const isProductEverDelivered = Boolean(ord.delivered_at) ||
                    (ord.original_status || '').toLowerCase() === 'delivered' ||
                    Boolean(ord.is_product_received) ||
                    statusLower === 'delivered' ||
                    Boolean(ord.return_type) ||
                    Boolean(ord.return_request_at);

                  // Admin return/replacement rejections also write their reason into cancel_reason,
                  // so a cancel_reason that is really a rejection reason must not mark the order cancelled.
                  const cancelReasonLower = (ord.cancel_reason || '').toLowerCase();
                  const cancelReasonIsRejection = Boolean(ord.cancel_reason) && (
                    cancelReasonLower.includes('rejected') ||
                    ord.cancel_reason === ord.rejection_reason ||
                    ord.cancel_reason === ord.return_rejection_reason
                  );

                  const isPreDeliveryCancelled = !isProductEverDelivered && !isCancellationRejected && (
                    statusLower === 'cancelled' ||
                    statusLower === 'canceled' ||
                    (statusLower.includes('cancel') && statusLower !== 'cancellation rejected') ||
                    (Boolean(ord.cancel_reason) && !cancelReasonIsRejection) ||
                    (statusLower === 'refunded' && !statusLower.includes('return'))
                  );

                  const isCancelled = !isCancellationRequested && !isCancellationRejected && (
                    isPreDeliveryCancelled || 
                    statusLower === 'cancelled' || 
                    statusLower === 'canceled' || 
                    (statusLower.includes('cancel') && statusLower !== 'cancellation rejected')
                  );

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
                    ord.return_rejection_reason ||
                    ord.return_qc_status ||
                    (Array.isArray(ord.items) && ord.items.some(it => (it.status || '').toLowerCase().includes('return') || (it.return_action || '').toLowerCase() === 'return')) ||
                    (ord.return_reason && !isReplacementIntent)
                  );
                  const isReturnQcRejected = hasReturnIntent && !isReplacementIntent && !isCancelled && !isCancellationRequested && (
                    statusLower === 'return qc rejected' ||
                    (ord.return_qc_status || '').toLowerCase() === 'rejected'
                  );
                  const isReturnRejected = hasReturnIntent && !isReplacementIntent && !isCancelled && !isCancellationRequested && (
                    statusLower === 'return rejected' ||
                    isReturnQcRejected ||
                    (statusLower === 'delivered' && (
                      Boolean(ord.return_rejection_reason) ||
                      Boolean(ord.rejection_reason)
                    ) && !(
                      (ord.return_type || '').toLowerCase().includes('replace') ||
                      Boolean(ord.replacement_size) ||
                      (ord.return_rejection_reason || '').toLowerCase().includes('replace') ||
                      (ord.rejection_reason || '').toLowerCase().includes('replace')
                    )) ||
                    (Boolean(ord.return_rejection_reason) && !(ord.return_rejection_reason || '').toLowerCase().includes('replace'))
                  );
                  const isReturnRequested = hasReturnIntent && !isReplacementIntent && !isCancelled && !isCancellationRequested && !isReturnRejected && (
                    statusLower === 'return requested' || 
                    statusLower === 'return request processing' || 
                    logLower === 'return initiated' || 
                    logLower === 'return requested'
                  );
                  const isReturnApproved = hasReturnIntent && !isReplacementIntent && !isCancelled && !isCancellationRequested && !isReturnRejected && (
                    statusLower === 'return approved' || 
                    statusLower === 'return pickup scheduled' || 
                    (statusLower.includes('pickup scheduled') && (statusLower.includes('return') || logLower.includes('return'))) || 
                    logLower.includes('return pickup scheduled') || 
                    logLower.includes('reverse pickup scheduled')
                  );
                  const isReturnCollected = hasReturnIntent && !isReplacementIntent && !isCancelled && !isCancellationRequested && !isReturnRejected && (
                    statusLower.includes('collected') || 
                    statusLower.includes('in transit to') || 
                    statusLower.includes('reverse transit') || 
                    logLower.includes('reverse transit') || 
                    (logLower.includes('collected') && hasReturnIntent)
                  );
                  const isReturned = hasReturnIntent && !isReplacementIntent && !isCancelled && !isCancellationRequested && !isReturnRejected && (
                    statusLower === 'returned' || 
                    statusLower === 'return completed' || 
                    statusLower === 'refunded' ||
                    isRefundCompleted ||
                    (ord.refund_status && String(ord.refund_status).toLowerCase() === 'completed')
                  );
                  const isReceivedAtUrvaah = hasReturnIntent && !isReplacementIntent && !isCancelled && !isCancellationRequested && !isReturnRejected && !isReturned && (
                    statusLower === 'received at house of urvaah' || 
                    statusLower === 'received at urvaah house' || 
                    statusLower === 'received at homved' ||
                    logLower.includes('received at house of urvaah')
                  );
                  const isInReturnFlow = hasReturnIntent && !isReturnRejected && (isReturnRequested || isReturnApproved || isReturnCollected || isReceivedAtUrvaah || isReturned);

                  // Post-delivery Replacement Flow States (Original parent order)
                  const isReplacementRequested = isReplacementIntent && !isCancelled && !isCancellationRequested && (statusLower === 'replacement request processing' || statusLower === 'replace requested' || statusLower === 'replacement requested');
                  const isReplacementApproved = isReplacementIntent && !isCancelled && !isCancellationRequested && (statusLower === 'replace approved' || statusLower === 'replacement approved' || (statusLower.includes('pickup scheduled') && (statusLower.includes('replace') || logLower.includes('replace'))));
                  const isReplacementCollected = isReplacementIntent && !isCancelled && !isCancellationRequested && (statusLower.includes('collected') || statusLower.includes('in transit to') || statusLower.includes('reverse transit') || logLower.includes('collected') || logLower.includes('reverse transit'));
                  const isReplacementQCReceived = isReplacementIntent && !isCancelled && !isCancellationRequested && (statusLower.includes('received at') || logLower.includes('received at') || logLower.includes('qc passed'));
                  const isReplacementInTransit = isReplacementCollected || (isReplacementIntent && (statusLower === 'replacement processing' || statusLower === 'replacement shipped' || statusLower === 'in reverse transit'));
                  const isReplacementOutForDelivery = isReplacementIntent && (statusLower === 'replacement out for delivery');
                  const isReplaced = isReplacementIntent && !isCancelled && !isCancellationRequested && (statusLower === 'replaced' || Boolean(ord.replacement_order_number));
                  const isReplacementRejected = isReplacementIntent && !isCancelled && !isCancellationRequested && (
                    statusLower === 'replace rejected' ||
                    (statusLower === 'delivered' && (
                      Boolean(ord.rejection_reason) ||
                      Boolean(ord.return_rejection_reason) ||
                      (Array.isArray(ord.items) && ord.items.some(it => (it.status || '').toLowerCase() === 'replace rejected'))
                    )) ||
                    Boolean(ord.return_rejection_reason)
                  );
                  const isInReplacementFlow = isReplacementIntent && !isReplacementRejected;

                  // Mixed request (some pieces returned, others exchanged): the return-only and replacement-only
                  // states above exclude each other, so this order needs its own phase
                  const isMixedRequest = hasReturnIntent && isReplacementIntent && !isCancelled && !isCancellationRequested &&
                    Array.isArray(ord.items) &&
                    ord.items.some(it => (it.return_action || '').toLowerCase() === 'return') &&
                    ord.items.some(it => (it.return_action || '').toLowerCase() === 'replace');
                  const mixedPhase = !isMixedRequest ? null
                    : ['return request processing', 'return requested', 'replacement request processing', 'replace requested', 'replacement requested', 'return & replacement requested', 'return & replacement processing'].includes(statusLower) ? 'requested'
                    : (statusLower === 'returned & replaced' || (isRefundCompleted && Boolean(ord.replacement_order_number || ord.replacement_order_id))) ? 'done'
                    : ['return & replacement approved', 'return approved', 'replace approved'].includes(statusLower) ? 'approved'
                    : (statusLower.includes('in transit to') || statusLower.includes('collected')) ? 'transit'
                    : statusLower.startsWith('received at') ? 'received'
                    : null;

                  const isDelivered = !isCancelled && !isCancellationRequested && (statusLower.includes('delivered') || statusLower.includes('completed')) && !isInReturnFlow && !isInReplacementFlow;
                  const isReplacementDelivered = isReplacementForwardOrder && !isCancelled && !isCancellationRequested && (statusLower.includes('delivered') || statusLower.includes('completed') || Boolean(ord.delivered_at));
                  const isInvoiceEligible = isDelivered || isReplacementDelivered || isCustomerInvoiceEligible(ord); // kept items stay invoiceable on partial returns
                  const isOutForDelivery = !isCancelled && !isCancellationRequested && !isInReturnFlow && !isInReplacementFlow && (isDelivered || statusLower.includes('out') || statusLower.includes('delivery'));
                  const isShipped = !isCancelled && !isCancellationRequested && !isInReturnFlow && !isInReplacementFlow && (isOutForDelivery || statusLower.includes('shipped') || statusLower.includes('transit') || statusLower.includes('dispatched'));
                  const isDeliveredOrderEver = isProductEverDelivered || isDelivered;
                  const isCod = (ord.payment_method || ord.paymentMethod || '').toLowerCase() === 'cod' || (ord.payment_method || ord.paymentMethod || '').toLowerCase().includes('cash');
                  const isOnlinePayment = !isCod;
                  const hasOnlinePaymentProof = isOnlinePayment && (
                    Boolean(ord.razorpay_payment_id) ||
                    Boolean(ord.razorpay_order_id) ||
                    Boolean(ord.refund_status) ||
                    (ord.payment_status || ord.paymentStatus || '').toLowerCase() === 'paid' ||
                    (ord.payment_status || ord.paymentStatus || '').toLowerCase() === 'refunded' ||
                    (ord.original_status || '').toLowerCase() === 'confirmed' ||
                    (ord.payment_method || ord.paymentMethod || '').toLowerCase().includes('upi') ||
                    (ord.payment_type || ord.paymentType || '').toLowerCase().includes('upi')
                  );
                  const isPaid = (isDeliveredOrderEver && isCod) ||
                    (ord.payment_status || ord.paymentStatus || '').toLowerCase() === 'paid' ||
                    (ord.payment_status || ord.paymentStatus || '').toLowerCase() === 'refunded' ||
                    isRefundCompleted ||
                    hasOnlinePaymentProof;

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
                      {/* Phones: status pill on its own line above the order info so long labels never squeeze it */}
                      <div className="flex flex-col-reverse items-start gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4 pb-2 border-b border-neutral-100">
                        <div className="min-w-0 w-full sm:w-auto">
                          <span className="text-[10px] font-sans font-bold tracking-[0.25em] uppercase text-neutral-400 block mb-0.5">
                            ORDER REFERENCE
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base sm:text-lg font-serif tracking-[0.06em] text-black font-semibold whitespace-nowrap">
                              #{orderNum}
                            </h3>
                            {isReplacementForwardOrder && (
                              <span className="px-2.5 py-0.5 text-[10px] font-sans font-bold tracking-wider uppercase rounded-full bg-[#FAF8F3] text-neutral-900 border border-[#E7E2D8] shadow-2xs">
                                Replacement Piece {ord.original_order_number ? `(For #${ord.original_order_number})` : ''}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 font-sans tracking-wide mt-0.5">{orderDateStr}</p>
                        </div>

                        <div className="flex items-center gap-2.5 flex-wrap">
                          {/* Status Badge */}
                          <span className={`px-2.5 sm:px-3.5 py-1 text-[10px] sm:text-[11px] font-sans font-semibold tracking-[0.1em] sm:tracking-[0.16em] uppercase rounded-full border shadow-2xs flex items-center gap-1.5 whitespace-nowrap ${
                            isCancellationRejected
                              ? 'bg-[#FAF8F3] text-neutral-900 border-[#E7E2D8] font-bold'
                              : isCancellationRequested
                              ? 'bg-[#FAF8F3] text-neutral-900 border-[#E7E2D8] font-bold'
                              : isCancelled
                              ? (isRefundCompleted ? 'bg-[#FAF8F3] text-neutral-900 border-[#E7E2D8] font-bold' : 'bg-[#FAF8F3] text-neutral-900 border-[#E7E2D8] font-bold')
                              : isReplacementForwardOrder
                              ? (isDelivered ? 'bg-[#FAF8F3] text-neutral-900 border-[#E7E2D8] font-bold' : isShipped ? 'bg-[#FAF8F3] text-neutral-900 border-[#E7E2D8] font-bold' : 'bg-[#FAF8F3] text-neutral-900 border-[#E7E2D8] font-bold')
                              : isReplacementRequested
                              ? 'bg-[#FAF8F3] text-neutral-900 border-[#E7E2D8] font-bold'
                              : isReplacementApproved
                              ? 'bg-[#FAF8F3] text-neutral-900 border-[#E7E2D8] font-bold'
                              : isReplacementCollected
                              ? 'bg-[#FAF8F3] text-neutral-900 border-[#E7E2D8] font-bold'
                              : isReplacementQCReceived
                              ? 'bg-[#FAF8F3] text-neutral-900 border-[#E7E2D8] font-bold'
                              : isReplaced
                              ? 'bg-[#FAF8F3] text-neutral-900 border-[#E7E2D8] font-bold'
                              : isReplacementRejected
                              ? 'bg-[#FAF8F3] text-neutral-900 border-[#E7E2D8]'
                              : isReturnRejected
                              ? 'bg-[#FAF8F3] text-neutral-900 border-[#E7E2D8] font-bold'
                              : isReturnRequested
                              ? 'bg-[#FAF8F3] text-neutral-900 border-[#E7E2D8] font-bold'
                              : isReturnApproved
                              ? 'bg-[#FAF8F3] text-neutral-900 border-[#E7E2D8] font-bold'
                              : isReceivedAtUrvaah
                              ? 'bg-[#FAF8F3] text-neutral-900 border-[#E7E2D8] font-bold'
                              : isReturned
                              ? 'bg-[#FAF8F3] text-neutral-900 border-[#E7E2D8] font-bold'
                              : isDelivered
                              ? 'bg-[#FAF8F3] text-neutral-900 border-[#E7E2D8]'
                              : isOutForDelivery
                              ? 'bg-[#FAF8F3] text-neutral-900 border-[#E7E2D8]'
                              : isShipped
                              ? 'bg-[#FAF8F3] text-neutral-900 border-[#E7E2D8]'
                              : 'bg-[#FAF8F3] text-neutral-800 border-[#E5E0D8]'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              isCancellationRejected
                                ? 'bg-neutral-900'
                                : isCancellationRequested || isReturnRequested || isReplacementRequested
                                ? 'bg-neutral-900 animate-pulse'
                                : isCancelled
                                ? (isRefundCompleted ? 'bg-neutral-900' : 'bg-neutral-900')
                                : isReturnRejected || isReplacementRejected
                                ? 'bg-neutral-900'
                                : isReturnApproved || isReplacementApproved
                                ? 'bg-neutral-900 animate-pulse'
                                : isReceivedAtUrvaah || isReplacementCollected
                                ? 'bg-neutral-900 animate-pulse'
                                : isReplacementQCReceived
                                ? 'bg-neutral-900 animate-pulse'
                                : isReturned || isDelivered || isReplaced
                                ? 'bg-neutral-900'
                                : isOutForDelivery
                                ? 'bg-neutral-900'
                                : isShipped
                                ? 'bg-neutral-900'
                                : 'bg-neutral-900 animate-pulse'
                            }`} />
                            <span>{
                              isCancellationRejected ? 'CANCELLATION REJECTED' :
                              isCancellationRequested ? 'CANCELLATION REQUESTED' :
                              isCancelled ? (isRefundCompleted ? 'CANCELLED & REFUNDED' : 'CANCELLED') :
                              isReplacementForwardOrder ? (isDelivered ? 'REPLACEMENT DELIVERED' : isShipped ? 'REPLACEMENT DISPATCHED' : 'REPLACEMENT IN TAILORING') :
                              mixedPhase === 'requested' ? 'RETURN & EXCHANGE REQUESTED' :
                              mixedPhase === 'approved' ? 'RETURN & EXCHANGE APPROVED' :
                              mixedPhase === 'transit' ? 'PIECES IN TRANSIT' :
                              mixedPhase === 'received' ? 'RECEIVED AT HOUSE OF URVAAH' :
                              mixedPhase === 'done' ? 'RETURNED & REPLACED' :
                              isReplacementRequested ? 'REPLACEMENT REQUESTED' :
                              isReplacementApproved ? 'REPLACEMENT APPROVED' :
                              isReplacementCollected ? 'PARCEL COLLECTED (REVERSE)' :
                              isReplacementQCReceived ? 'QUALITY CHECK VERIFIED' :
                              isReplaced ? 'REPLACEMENT DISPATCHED' :
                              isReplacementRejected ? 'REPLACEMENT REJECTED' :
                              isReturnRejected ? (isReturnQcRejected ? 'RETURN REJECTED (QC FAILED)' : 'RETURN REJECTED') :
                              isReturnRequested ? 'RETURN REQUESTED' :
                              isReturnCollected ? 'RETURN IN TRANSIT' :
                              isReturnApproved ? 'RETURN PICKUP SCHEDULED' :
                              isReceivedAtUrvaah ? 'RECEIVED AT HOUSE OF URVAAH' :
                              isReturned ? 'RETURNED & REFUNDED' :
                              orderStatus
                            }</span>
                          </span>

                        </div>
                      </div>

                      {/* Compact status summary (the full journey lives on View Details) */}
                      {(() => {
                        const refundAmt = Number(ord.refund_eligible_amount || 0) > 0 ? Number(ord.refund_eligible_amount) : Number(ord.total || 0);
                        const money = `₹${refundAmt.toLocaleString('en-IN')}`;
                        const reason = ord.return_rejection_reason || ord.rejection_reason || '';
                        let tone = 'neutral';
                        let title = isReplacementForwardOrder ? 'Replacement being prepared' : 'Order confirmed';
                        let detail = isReplacementForwardOrder
                          ? 'Your replacement piece is being prepared for dispatch.'
                          : 'We are preparing your order for dispatch.';
                        if (isCancelled) {
                          tone = 'rose'; title = 'Order cancelled';
                          detail = !(isPaid || isOnlinePayment)
                            ? 'Cancelled before dispatch. Nothing was charged (Cash on Delivery).'
                            : isRefundCompleted ? `Refund of ${money} completed.` : `Refund of ${money} is being processed (3–5 business days).`;
                        } else if (isCancellationRequested) {
                          tone = 'amber'; title = 'Cancellation requested'; detail = 'Our team is reviewing your request.';
                        } else if (isCancellationRejected) {
                          tone = 'amber'; title = 'Cancellation declined'; detail = 'Your order will continue as planned.';
                        } else if (isReturnQcRejected) {
                          tone = 'rose'; title = 'Return not accepted'; detail = 'The returned piece did not pass inspection, so no refund was issued.';
                        } else if (isReturnRejected) {
                          tone = 'rose'; title = 'Return request declined'; detail = reason ? `Reason: ${reason}` : 'Your order remains delivered.';
                        } else if (isReplacementRejected) {
                          tone = 'rose'; title = 'Replacement request declined'; detail = reason ? `Reason: ${reason}` : 'Your order remains delivered.';
                        } else if (mixedPhase === 'requested') {
                          tone = 'amber'; title = 'Return & exchange requested'; detail = 'Our team is reviewing each piece in your request.';
                        } else if (mixedPhase === 'approved') {
                          tone = 'indigo'; title = 'Request approved'; detail = 'A courier will pick up the pieces within 24–48 hours.';
                        } else if (mixedPhase === 'transit') {
                          tone = 'indigo'; title = 'Pieces picked up'; detail = 'Your pieces are on their way back to us.';
                        } else if (mixedPhase === 'received') {
                          tone = 'indigo'; title = 'Pieces received';
                          detail = ord.replacement_order_number ? `Replacement ${ord.replacement_order_number} is on its way; your refund of ${money} follows.` : `We are inspecting the pieces. Your refund of ${money} follows.`;
                        } else if (mixedPhase === 'done') {
                          tone = 'emerald'; title = 'Returned & replaced';
                          detail = ord.replacement_order_number ? `Refund of ${money} completed. Replacement ${ord.replacement_order_number} sent.` : `Refund of ${money} completed.`;
                        } else if (isReturned) {
                          tone = 'emerald'; title = 'Returned & refunded'; detail = `Refund of ${money} completed.`;
                        } else if (isReceivedAtUrvaah) {
                          tone = 'indigo'; title = 'Return received'; detail = `We are inspecting the piece. Your refund of ${money} follows.`;
                        } else if (isReturnCollected) {
                          tone = 'indigo'; title = 'Return picked up'; detail = 'The piece is on its way back to us.';
                        } else if (isReturnApproved) {
                          tone = 'indigo'; title = 'Return approved'; detail = 'A courier will pick up the piece within 24–48 hours.';
                        } else if (isReturnRequested) {
                          tone = 'amber'; title = 'Return requested'; detail = 'Our team is reviewing your request.';
                        } else if (isReplaced) {
                          tone = 'emerald'; title = 'Replacement dispatched';
                          detail = ord.replacement_order_number ? `New order ${ord.replacement_order_number} is on its way.` : 'Your replacement is on its way.';
                        } else if (isReplacementInTransit || isReplacementQCReceived || isReplacementCollected) {
                          tone = 'purple'; title = 'Replacement in progress'; detail = 'We have your original piece and are preparing the replacement.';
                        } else if (isReplacementApproved) {
                          tone = 'purple'; title = 'Replacement approved'; detail = 'A courier will pick up the original piece within 24–48 hours.';
                        } else if (isReplacementRequested) {
                          tone = 'amber'; title = 'Replacement requested'; detail = 'Our team is reviewing your request.';
                        } else if (isDelivered) {
                          tone = 'emerald'; title = 'Delivered';
                          detail = ord.delivered_at
                            ? `Delivered on ${new Date(ord.delivered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.`
                            : 'Your order has been delivered.';
                        } else if (isOutForDelivery) {
                          tone = 'indigo'; title = 'Out for delivery'; detail = 'Arriving today.';
                        } else if (isShipped) {
                          tone = 'indigo'; title = 'Shipped'; detail = ord.tracking_number ? `Tracking number ${ord.tracking_number}` : 'Your order is on its way.';
                        }
                        // One brand surface for every state; the icon badge carries the meaning
                        const toneClasses = 'bg-[#FAF8F3] border-[#E7E2D8] text-neutral-900';
                        const badgeClasses = tone === 'emerald'
                          ? 'bg-neutral-900 text-white'                               // finished
                          : tone === 'rose'
                          ? 'bg-white text-neutral-400 border border-[#E7E2D8]'        // cancelled / declined
                          : 'bg-white text-neutral-900 border border-neutral-900';    // in progress / awaiting
                        const StatusIcon = isCancelled || isReturnQcRejected ? XCircle
                          : isReturnRejected || isReplacementRejected || isCancellationRejected ? AlertCircle
                          : isCancellationRequested || isReturnRequested || isReplacementRequested || mixedPhase === 'requested' ? Clock
                          : mixedPhase === 'done' ? CheckCircle2
                          : isReturned ? CheckCircle2
                          : isInReturnFlow ? RotateCcw
                          : isInReplacementFlow || isReplaced ? RefreshCw
                          : isDelivered ? PackageCheck
                          : isShipped || isOutForDelivery ? Truck
                          : Package;
                        // Stepper only for normal forward orders
                        const isForwardFlow = !isCancelled && !isCancellationRequested && !isInReturnFlow && !isInReplacementFlow &&
                          !isReturnRejected && !isReturnQcRejected && !isReplacementRejected;
                        const forwardStep = isDelivered ? 4 : isOutForDelivery ? 3 : isShipped ? 2 : 1;
                        const isComplete = forwardStep === 4;
                        const steps = [
                          { label: 'Placed', Icon: ShoppingBag },
                          { label: 'Shipped', Icon: Package },
                          { label: 'Out for delivery', Icon: Truck },
                          { label: 'Delivered', Icon: PackageCheck }
                        ];
                        const fillClass = 'bg-neutral-900';
                        const deliveredOn = isDelivered && ord.delivered_at
                          ? new Date(ord.delivered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                          : null;
                        return (
                          <div className={`relative overflow-hidden rounded-xl border px-3 sm:px-4 py-2.5 ${toneClasses}`}>
                            {/* Header: status icon, message, step / date (compact) */}
                            <div className="flex items-center gap-2.5">
                              <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${badgeClasses}`}>
                                <StatusIcon className="w-3.5 h-3.5 stroke-[2]" />
                              </span>
                              <div className="min-w-0 flex-1 sm:flex sm:items-baseline sm:gap-2">
                                <p className="text-[13px] font-semibold font-sans leading-tight shrink-0">{title}</p>
                                {detail && <p className="text-[11px] sm:text-xs text-neutral-500 font-sans leading-snug sm:truncate">{detail}</p>}
                              </div>
                              {isForwardFlow && (
                                <span className="hidden sm:inline-flex shrink-0 px-2.5 py-1 rounded-full bg-white/80 border border-black/5 text-[10px] font-sans font-semibold uppercase tracking-wider text-neutral-600">
                                  {deliveredOn ? deliveredOn : `Step ${forwardStep} of 4`}
                                </span>
                              )}
                            </div>

                            {/* Stepper: nodes joined by a progress line */}
                            {isForwardFlow && (
                              <div className="relative mt-3 grid grid-cols-4" aria-label={`Step ${forwardStep} of 4`}>
                                <div className="absolute top-3.5 left-[12.5%] right-[12.5%] h-[2px] rounded-full bg-neutral-200" />
                                <div
                                  className={`absolute top-3.5 left-[12.5%] h-[2px] rounded-full transition-all duration-500 ${fillClass}`}
                                  style={{ width: `${((forwardStep - 1) / 3) * 75}%` }}
                                />
                                {steps.map(({ label, Icon }, i) => {
                                  const isDone = i < forwardStep - 1 || isComplete;
                                  const isCurrent = !isComplete && i === forwardStep - 1;
                                  return (
                                    <div key={label} className="relative flex flex-col items-center text-center">
                                      <span
                                        className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                          isDone
                                            ? `${fillClass} text-white shadow-xs`
                                            : isCurrent
                                            ? 'bg-white text-neutral-900 ring-2 ring-neutral-900 ring-offset-2 ring-offset-transparent shadow-xs'
                                            : 'bg-white text-neutral-300 border border-neutral-200'
                                        }`}
                                      >
                                        {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Icon className="w-3.5 h-3.5" />}
                                        {isCurrent && <span className="absolute inset-0 rounded-full ring-2 ring-neutral-900/20 animate-ping" />}
                                      </span>
                                      <span
                                        className={`mt-2 text-[10px] sm:text-[11px] font-sans uppercase tracking-wider leading-tight ${
                                          isDone || isCurrent ? 'text-neutral-900 font-semibold' : 'text-neutral-400'
                                        }`}
                                      >
                                        {label}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })()}

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
                                    {item.name || item.title || 'Store Item'}
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
                                  isCancellationRejected
                                    ? 'bg-[#FAF8F3] text-neutral-900 border-[#E7E2D8]'
                                    : isCancellationRequested
                                    ? 'bg-[#FAF8F3] text-neutral-900 border-[#E7E2D8]'
                                    : isCancelled
                                    ? 'bg-[#FAF8F3] text-neutral-900 border-[#E7E2D8]'
                                    : isReturnRequested
                                    ? 'bg-[#FAF8F3] text-neutral-900 border-[#E7E2D8]'
                                    : isReturnApproved
                                    ? 'bg-[#FAF8F3] text-neutral-900 border-[#E7E2D8]'
                                    : isReceivedAtUrvaah
                                    ? 'bg-[#FAF8F3] text-neutral-900 border-[#E7E2D8]'
                                    : isReturned
                                    ? 'bg-[#FAF8F3] text-neutral-900 border-[#E7E2D8]'
                                    : isDelivered
                                    ? 'bg-[#FAF8F3] text-neutral-900 border-[#E7E2D8]'
                                    : isOutForDelivery
                                    ? 'bg-[#FAF8F3] text-neutral-900 border-[#E7E2D8]'
                                    : isShipped
                                    ? 'bg-[#FAF8F3] text-neutral-900 border-[#E7E2D8]'
                                    : 'bg-neutral-100 text-neutral-800 border-neutral-200'
                                }`}>
                                  {getItemStatusLabel(item) || (isMixedRequest && !String(item.return_action || '') && isProductEverDelivered ? 'KEPT • DELIVERED' : null) || (isCancellationRejected ? 'CANCELLATION REJECTED' : isCancellationRequested ? 'CANCEL REQUESTED' : isCancelled ? 'CANCELLED' : isReturnRequested ? 'RETURN REQUESTED' : isReturnCollected ? 'RETURN IN TRANSIT' : isReturnApproved ? 'PICKUP SCHEDULED' : isReceivedAtUrvaah ? 'AT HOUSE OF URVAAH' : isReturned ? 'RETURNED' : isDelivered ? 'DELIVERED' : isOutForDelivery ? 'OUT FOR DELIVERY' : isShipped ? 'SHIPPED' : 'PROCESSING')}
                                </span>

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
                            {Number(orderTotal) === 0 && isReplacementForwardOrder && (
                              <span className="ml-2 align-middle text-[10px] font-sans font-semibold tracking-[0.12em] uppercase text-neutral-900 bg-[#FAF8F3] border border-[#E7E2D8] px-2 py-0.5 rounded-full">
                                Exchange • No charge
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center sm:gap-2.5 sm:flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              const targetOrderNum = ord.order_number || ord.orderNumber || ord.id;
                              navigate(`/checkout?orderNumber=${encodeURIComponent(targetOrderNum)}`, { state: { viewOrder: ord } });
                            }}
                            className="px-3 sm:px-5 py-2.5 rounded-xl justify-center text-center min-w-0 border border-neutral-300 hover:border-black bg-white hover:bg-neutral-50 text-[11px] sm:text-xs font-sans font-semibold tracking-[0.08em] sm:tracking-[0.16em] uppercase text-neutral-800 hover:text-black transition-all shadow-2xs cursor-pointer"
                          >
                            View Details
                          </button>

                          {/* Edit Address Quick Action (Available during 24-Hour Edit Window) */}
                          {canEditAddress && (
                            <button
                              type="button"
                              onClick={() => {
                                const targetOrderNum = ord.order_number || ord.orderNumber || ord.id;
                                navigate(`/checkout?orderNumber=${encodeURIComponent(targetOrderNum)}`, { state: { viewOrder: ord, openAddressEdit: true } });
                              }}
                              className="px-3 sm:px-5 py-2.5 rounded-xl justify-center text-center min-w-0 border border-[#E7E2D8] hover:border-black bg-[#FAF8F3] hover:bg-neutral-50 text-[11px] sm:text-xs font-sans font-semibold tracking-[0.08em] sm:tracking-[0.16em] uppercase text-neutral-900 transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                              title={`Edit shipping address within 24 hours (${hoursRemaining}h remaining)`}
                            >
                              <Pencil className="w-3.5 h-3.5 text-neutral-900" />
                              <span>Edit Address ({hoursRemaining}h)</span>
                            </button>
                          )}

                          {/* Invoice Action: Only accessible when order or replacement piece is delivered */}
                          {isInvoiceEligible && (
                            <button
                              type="button"
                              onClick={() => setSelectedOrderForInvoice(ord)}
                              className="px-3 sm:px-5 py-2.5 rounded-xl justify-center text-center min-w-0 border border-[#c5a880] hover:border-black bg-white hover:bg-[#faf8f5] text-[11px] sm:text-xs font-sans font-semibold tracking-[0.08em] sm:tracking-[0.16em] uppercase text-neutral-900 transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
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
                                            <span class="text-xs font-bold text-neutral-500 flex items-center gap-1 shrink-0">★ REVIEW</span>
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
                              className="px-3 sm:px-5 py-2.5 rounded-xl justify-center text-center min-w-0 border border-neutral-900 bg-neutral-900 hover:bg-black text-white text-[11px] sm:text-xs font-sans font-semibold tracking-[0.08em] sm:tracking-[0.16em] uppercase transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                              title="Give feedback for your delivered pieces"
                            >
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              <span>Give Feedback</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleReorderOrder(ord)}
                            className="px-3 sm:px-5 py-2.5 rounded-xl justify-center text-center min-w-0 border border-neutral-300 hover:border-black bg-white hover:bg-neutral-50 text-[11px] sm:text-xs font-sans font-semibold tracking-[0.08em] sm:tracking-[0.16em] uppercase text-neutral-800 hover:text-black transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reorder</span>
                          </button>

                          {/* Cancel Order Button (Pre-Dispatch Only: cannot cancel once shipped, out for delivery, or if cancellation was already rejected) */}
                          {!isDelivered && !isShipped && !isOutForDelivery && !isCancelled && !isCancellationRequested && !isCancellationRejected && !isInReturnFlow && !isInReplacementFlow && (
                            <button
                              type="button"
                              onClick={() => handleCancelOrderInAccount(ord)}
                              className="col-span-2 sm:col-span-1 px-3 sm:px-5 py-2.5 rounded-xl justify-center text-center min-w-0 border border-[#E7E2D8] hover:border-black bg-white hover:bg-neutral-50 text-neutral-500 hover:text-black text-[11px] sm:text-xs font-sans font-semibold tracking-[0.08em] sm:tracking-[0.16em] uppercase transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancel Order</span>
                            </button>
                          )}

                          {/* Unified Return / Replace Button (Post-Delivery Only) */}
                          {isDelivered && !isCancelled && !isCancellationRequested && !isInReturnFlow && !isInReplacementFlow && !isReturnRejected && !isReplacementRejected && (
                            <button
                              type="button"
                              onClick={() => handleOpenReturnReplaceModal(ord)}
                              className="col-span-2 sm:col-span-1 px-3 sm:px-5 py-2.5 rounded-xl justify-center text-center min-w-0 border border-neutral-900 bg-white hover:bg-neutral-900 text-neutral-900 hover:text-white text-[11px] sm:text-xs font-sans font-semibold tracking-[0.08em] sm:tracking-[0.16em] uppercase transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 group"
                              title="Request Return (Refund) or Replacement Piece"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-neutral-600 group-hover:text-white transition-colors" />
                              <span>Return / Replace</span>
                            </button>
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
                  CURATED STORE SELECTION
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
                  onClick={() => navigate('/collections')}
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
              STORE VOUCHERS & COUPONS
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
              className="relative z-10 w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6 text-left max-h-[85vh] overflow-y-auto no-scrollbar scrollbar-none border border-neutral-200"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
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
                const isModalOnline = !isModalCod;
                const isModalDelivered = statusLower === 'delivered';
                const modalHasOnlineProof = isModalOnline && (
                  Boolean(selectedOrderModal.razorpay_payment_id) ||
                  Boolean(selectedOrderModal.razorpay_order_id) ||
                  Boolean(selectedOrderModal.refund_status) ||
                  (selectedOrderModal.payment_status || selectedOrderModal.paymentStatus || '').toLowerCase() === 'paid' ||
                  (selectedOrderModal.payment_status || selectedOrderModal.paymentStatus || '').toLowerCase() === 'refunded' ||
                  (selectedOrderModal.original_status || '').toLowerCase() === 'confirmed' ||
                  (selectedOrderModal.payment_method || selectedOrderModal.paymentMethod || '').toLowerCase().includes('upi') ||
                  (selectedOrderModal.payment_type || selectedOrderModal.paymentType || '').toLowerCase().includes('upi')
                );
                const modalIsPaid = (isModalDelivered && isModalCod) ||
                  (selectedOrderModal.payment_status || selectedOrderModal.paymentStatus || '').toLowerCase() === 'paid' ||
                  (selectedOrderModal.payment_status || selectedOrderModal.paymentStatus || '').toLowerCase() === 'refunded' ||
                  modalHasOnlineProof;
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
                            <span className={`font-bold uppercase ${(modalIsPaid || isModalOnline) ? 'text-emerald-700' : 'text-neutral-900'}`}>
                              {(modalIsPaid || isModalOnline) ? 'PAID' : (selectedOrderModal.payment_status || 'PENDING')}
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
                            {statusLower === 'returned' ? 'Return Completed' : 'Pending Quality Check'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="bg-white p-3 rounded-lg border border-indigo-100">
                            <span className="text-[10px] font-bold uppercase text-indigo-950 block mb-1">Doorstep Reverse Pickup</span>
                            <p className="text-[11px] text-neutral-600 leading-relaxed">
                              {statusLower === 'returned'
                                ? 'Piece returned to House of Urvaah and verified.'
                                : 'Return request recorded. Upon admin approval, reverse courier partner will collect parcel from delivery address.'}
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-indigo-100">
                            <span className="text-[10px] font-bold uppercase text-indigo-950 block mb-1">Financial Settlement</span>
                            <p className="text-[11px] text-neutral-600 leading-relaxed">
                              {statusLower === 'returned'
                                ? `100% full refund of ₹${modalTotal.toLocaleString('en-IN')} has been disbursed.`
                                : `Full refund of ₹${modalTotal.toLocaleString('en-IN')} will be processed after piece is inspected at House of Urvaah.`}
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
                          Your cancellation request is being reviewed by our store team. Once approved, the shipment will be voided and your refund of ₹{modalTotal.toLocaleString('en-IN')} will be queued.
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
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                            (modalIsPaid || isModalOnline)
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                              : 'text-neutral-700 bg-neutral-100 border-neutral-200'
                          }`}>
                            {(modalIsPaid || isModalOnline) ? '100% Refund Initiated' : 'COD • Zero Due'}
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
                              {(modalIsPaid || isModalOnline)
                                ? `Full refund of ₹${modalTotal.toLocaleString('en-IN')} initiated to original payment source (${selectedOrderModal.payment_type || selectedOrderModal.payment_method || 'Online / UPI'} - 3-5 business days).`
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
                            <p className="font-bold text-neutral-900 truncate leading-snug">{item.name || item.title || 'Store Item'}</p>
                            <p className="text-neutral-500 font-medium text-[11px] mt-0.5">Quantity: {item.quantity || 1}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-neutral-900 block text-xs">₹{Number(item.price || 0).toLocaleString('en-IN')}</span>
                          {(() => {
                            const act = (item.return_action || '').toLowerCase();
                            const stat = (item.status || selectedOrderModal.status || '').toLowerCase();
                            // Item-level admin decision: this piece's return / replacement request was declined
                            if (!act && /^request declined:/i.test(item.cancel_reason || '')) {
                              const note = item.cancel_reason.replace(/^request declined:\s*/i, '');
                              return (
                                <span className="text-[9px] font-bold text-neutral-800 uppercase bg-[#FAF8F3] border border-[#E7E2D8] px-1.5 py-0.5 rounded mt-0.5 inline-block" title={note || undefined}>
                                  Request declined{note ? ` • ${note}` : ''}
                                </span>
                              );
                            }
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
                    const targetOrderNum = ordToView?.order_number || ordToView?.orderNumber || ordToView?.id;
                    navigate(`/checkout?orderNumber=${encodeURIComponent(targetOrderNum)}`, { state: { viewOrder: ordToView } });
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
