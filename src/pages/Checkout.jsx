import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Check,
  ShieldCheck,
  Truck,
  CreditCard,
  Plus,
  MapPin,
  Pencil,
  ArrowLeft,
  Tag,
  ShoppingBag,
  Smartphone,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  QrCode,
  X,
  Loader2,
  Package,
  Calendar,
  RotateCcw,
  FileText,
  XCircle,
  Clock,
  PackageCheck,
  ChevronDown,
  RefreshCw,
  Star,
  Trash2,
  Banknote
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import apiClient from '../lib/apiClient';
import { getSupabaseMediaUrl } from '../lib/supabase';
import { checkItemStockStatus } from '../utils/stockValidator';
import { SEOHead } from '../components/common/SEOHead';
import { INDIAN_STATES, findMatchedState } from '../data/indianStates';
import { UpiLogo, VisaLogo, MastercardLogo, RupayLogo } from '../components/common/PaymentLogos';
import { InvoiceModal } from '../components/common/InvoiceModal';
import { ShipmentTrackingModal } from '../components/common/ShipmentTrackingModal';
import { shippingApi } from '../services/shippingApi';
import { useModalScrollLock, forceUnlockScroll } from '../hooks/useModalScrollLock';
import { subscribeToOrderUpdates, broadcastOrderUpdate } from '../lib/orderSync';
import Swal from 'sweetalert2';
import { getProductUrl } from '../utils/productUrl';

const ORDER_SESSION_KEY = 'urvaah_last_placed_order';

const readCachedOrder = (expectedOrderParam) => {
  try {
    const raw = sessionStorage.getItem(ORDER_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.orderNumber) return null;
    if (expectedOrderParam) {
      const exp = String(expectedOrderParam).trim().toLowerCase();
      if (
        String(parsed.orderNumber).trim().toLowerCase() === exp ||
        String(parsed.id || '').trim().toLowerCase() === exp
      ) {
        return parsed;
      }
      return null;
    }
    const placedTime = parsed.placedAt ? new Date(parsed.placedAt).getTime() : Date.now();
    if (Date.now() - placedTime < 24 * 60 * 60 * 1000) {
      return parsed;
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const getOrderGstInfo = (ord) => {
  if (!ord) return { taxRate: 18, totalTax: 0, subtotal: 0, total: 0, taxRatio: 0.18 };
  const subtotal = Number(ord.subtotal || ord.original_total || ord.originalTotal || 0);
  const rawTotal = Number(ord.total || ord.totalPaid || ord.total_amount || 0);
  const discount = Number(ord.discount_amount || ord.discount || 0);
  const shipping = Number(ord.shipping || ord.shipping_cost || ord.shipping_fee || ord.shippingFee || 0);
  let tax = Number(ord.tax || ord.tax_amount || ord.taxAmount || 0);
  let taxRate = Number(ord.tax_rate || ord.taxRate || ord.gst_percentage || 0);

  const netTaxable = Math.max(0, subtotal - discount);

  // If tax is not directly provided, check if rawTotal has tax difference above netTaxable
  if (!tax && rawTotal > netTaxable && netTaxable > 0) {
    tax = Math.max(0, Math.round(rawTotal - netTaxable - shipping));
  }

  // Determine tax rate: fallback to 18% for luxury items > 2500, else 5%
  if (!taxRate) {
    if (tax > 0 && netTaxable > 0) {
      taxRate = Math.round((tax / netTaxable) * 100);
    } else {
      taxRate = netTaxable > 2500 ? 18 : (netTaxable > 0 ? 5 : 18);
    }
  }

  // If tax is still 0 or unrecorded, compute tax from netTaxable using applicable rate
  if (!tax && netTaxable > 0) {
    tax = Math.round(netTaxable * (taxRate / 100));
  }

  const computedTotal = netTaxable + tax + shipping;
  const effectiveTotal = Math.max(rawTotal, computedTotal);
  const taxRatio = netTaxable > 0 && tax > 0 ? (tax / netTaxable) : (taxRate / 100);

  return { taxRate, totalTax: tax, subtotal, total: effectiveTotal, taxRatio };
};

export const getItemGstBreakdown = (item, orderGstInfo, isSingleItem = false) => {
  const unitPrice = Number(item.price || item.unit_price || 0);
  const qty = Number(item.quantity || 1);
  const baseTotal = unitPrice * qty;

  let taxAmount = 0;
  if (isSingleItem && orderGstInfo.totalTax > 0) {
    taxAmount = orderGstInfo.totalTax;
  } else if (orderGstInfo.totalTax > 0 && orderGstInfo.subtotal > 0) {
    taxAmount = Math.round((baseTotal / orderGstInfo.subtotal) * orderGstInfo.totalTax);
  } else {
    taxAmount = Math.round(baseTotal * orderGstInfo.taxRatio);
  }

  const totalWithTax = baseTotal + taxAmount;
  return {
    unitPrice,
    qty,
    baseTotal,
    taxAmount,
    totalWithTax,
    taxRate: orderGstInfo.taxRate
  };
};

// Helper to format order for confirmation screen
const formatOrderDetails = (ord, currentUser) => {
  if (!ord) return null;
  const orderNum = ord.order_number || ord.orderNumber || (ord.id ? `HOU-${ord.id}` : 'HOU-340391');

  let addrObj = ord.shipping_address || ord.shippingAddress || {};
  if (typeof addrObj === 'string') {
    try { addrObj = JSON.parse(addrObj); } catch (e) { addrObj = { street: addrObj }; }
  }

  const isRepForward = String(orderNum).endsWith('-REP') || Boolean(ord.original_order_number || ord.original_order_id);
  const origTotalNum = Number(ord.original_total || ord.originalTotal || 0);

  let totalPaid = Number(ord.total || ord.total_amount || ord.totalAmount || ord.total_price || 0);
  let subtotal = Number(ord.subtotal || totalPaid || 0);

  // If replacement order has 0, restore previous price as it is
  if (isRepForward) {
    if (totalPaid === 0 && origTotalNum > 0) totalPaid = origTotalNum;
    if (subtotal === 0 && (origTotalNum > 0 || totalPaid > 0)) subtotal = origTotalNum || totalPaid;
  }

  const rawItems = Array.isArray(ord.items) && ord.items.length > 0
    ? ord.items
    : [
        {
          id: ord.product_id || ord.id || '1',
          name: ord.product_name || ord.title || ord.name || 'PEACH BLOOM CORSET SET',
          price: Number(ord.price || subtotal || totalPaid || 0),
          quantity: Number(ord.quantity || 1),
          image: ord.image || ord.image_url || '/assets/Images/Brown01.png',
          selectedSize: ord.selectedSize || ord.size || 'M'
        }
      ];

  const mappedItems = rawItems.map((it) => {
    let itemPrice = Number(it.price || 0);
    if (isRepForward && itemPrice === 0) {
      itemPrice = origTotalNum > 0 ? origTotalNum : subtotal > 0 ? subtotal : totalPaid > 0 ? totalPaid : 0;
    }
    const realProdId = it.product_id || it.productId || (it.product && (it.product.id || it.product.product_id)) || it.id;
    return {
      id: String(it.id || it.product_id || '1'),
      product_id: realProdId,
      productId: realProdId,
      name: it.name || it.product_name || it.title || 'PEACH BLOOM CORSET SET',
      price: itemPrice,
      quantity: Number(it.quantity || 1),
      image: it.image || it.image_url || '/assets/Images/Brown01.png',
      selectedSize: it.selectedSize || it.size || 'M',
      status: it.status || ord.status || null,
      cancel_reason: it.cancel_reason || ord.cancel_reason || null,
      return_reason: it.return_reason || ord.return_reason || null,
      product: {
        id: String(realProdId || '1'),
        product_id: realProdId,
        productId: realProdId,
        name: it.name || it.product_name || it.title || 'PEACH BLOOM CORSET SET',
        price: itemPrice,
        image: it.image || it.image_url || '/assets/Images/Brown01.png'
      }
    };
  });

  const discount = Number(ord.discount || ord.discount_amount || ord.discountAmount || 0);
  const shippingFee = Number(ord.shipping_fee || ord.shippingFee || ord.shipping || 0);

  let rawTax = Number(ord.tax || ord.tax_amount || ord.taxAmount || 0);
  let rawTaxRate = Number(ord.tax_rate || ord.taxRate || ord.gst_percentage || 0);

  // If tax was not directly provided or is 0, compute fallback from totalPaid vs subtotal
  if (!rawTax && totalPaid > (subtotal - discount + shippingFee)) {
    rawTax = Math.max(0, Math.round(totalPaid - (subtotal - discount) - shippingFee));
  }
  if (!rawTaxRate) {
    if (rawTax > 0 && (subtotal - discount) > 0) {
      rawTaxRate = Math.round((rawTax / (subtotal - discount)) * 100);
    } else {
      rawTaxRate = (subtotal - discount) > 2500 ? 18 : 5;
    }
  }

  const rawCreatedAt = ord.created_at || ord.createddate || ord.createdAt || ord.placedAt;
  const createdAt = rawCreatedAt ? new Date(rawCreatedAt) : new Date();
  const deliveryDate = new Date(createdAt);
  deliveryDate.setDate(deliveryDate.getDate() + 7);
  const estDeliveryStr = deliveryDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return {
    id: ord.id || null,
    orderNumber: orderNum,
    createdAt: rawCreatedAt || createdAt.toISOString(),
    placedAt: rawCreatedAt || createdAt.toISOString(),
    trackingNumber: ord.tracking_number || ord.trackingNumber || `TRK-${String(orderNum).replace(/\D/g, '').slice(-6) || 'VHYNGE'}`,
    estimatedDelivery: estDeliveryStr,
    items: mappedItems,
    subtotal: subtotal,
    tax: rawTax,
    taxRate: rawTaxRate,
    discount: discount,
    shippingFee: shippingFee,
    totalPaid: totalPaid,
    shippingAddress: {
      name: addrObj.name || addrObj.recipient_name || ord.recipient_name || ord.customer_name || currentUser?.name || 'Customer Name',
      street: addrObj.street || addrObj.full_address || ord.full_address || 'Address Details',
      city: addrObj.city || ord.city || '',
      state: addrObj.state || ord.state || '',
      pincode: addrObj.pincode || addrObj.postal_code || ord.postal_code || '',
      country: addrObj.country || 'INDIA'
    },
    paymentMethod: ord.payment_method || ord.paymentMethod || 'Online Payment',
    paymentStatus: ord.payment_status || ord.paymentStatus || '',
    payment_status: ord.payment_status || ord.paymentStatus || '',
    customerEmail: ord.customer_email || ord.email || currentUser?.email || '',
    customerPhone: ord.recipient_phone || ord.customer_phone || ord.phone || currentUser?.phone || '',
    status: ord.status || 'Confirmed',
    original_status: ord.original_status || ord.originalStatus || null,
    originalStatus: ord.original_status || ord.originalStatus || null,
    refund_status: ord.refund_status || ord.refundStatus || null,
    refundStatus: ord.refund_status || ord.refundStatus || null,
    refund_txn_id: ord.refund_txn_id || ord.refundTxnId || ord.refund_transaction_id || null,
    refundTxnId: ord.refund_txn_id || ord.refundTxnId || ord.refund_transaction_id || null,
    is_product_received: ord.is_product_received ?? ord.isProductReceived ?? false,
    isProductReceived: ord.is_product_received ?? ord.isProductReceived ?? false,
    cancel_reason: ord.cancel_reason || ord.cancelReason || null,
    cancelReason: ord.cancel_reason || ord.cancelReason || null,
    rejection_reason: ord.rejection_reason || ord.rejectionReason || null,
    rejectionReason: ord.rejection_reason || ord.rejectionReason || null,
    return_reason: ord.return_reason || ord.returnReason || null,
    returnReason: ord.return_reason || ord.returnReason || null,
    logistics_status: ord.logistics_status || ord.logisticsStatus || null,
    logisticsStatus: ord.logistics_status || ord.logisticsStatus || null,
    shipment_status: ord.shipment_status || ord.shipmentStatus || null,
    shipmentStatus: ord.shipment_status || ord.shipmentStatus || null,
    delivered_at: ord.delivered_at || ord.deliveredAt || null,
    deliveredAt: ord.delivered_at || ord.deliveredAt || null,
    replacement_order_id: ord.replacement_order_id || ord.replacementOrderId || null,
    replacement_order_number: ord.replacement_order_number || ord.replacementOrderNumber || null,
    original_order_id: ord.original_order_id || ord.originalOrderId || null,
    original_order_number: ord.original_order_number || ord.originalOrderNumber || null,
    replacement_size: ord.replacement_size || ord.replacementSize || null,
    refund_bank_account: ord.refund_bank_account || ord.refundBankAccount || null,
    refund_ifsc_code: ord.refund_ifsc_code || ord.refundIfscCode || null,
    refund_holder_name: ord.refund_holder_name || ord.refundHolderName || null,
    return_type: ord.return_type || ord.returnType || null,
    returnType: ord.return_type || ord.returnType || null,
    is_returned_order: ord.is_returned_order ?? ord.isReturnedOrder ?? false,
    isReturnedOrder: ord.is_returned_order ?? ord.isReturnedOrder ?? false,
    return_qc_status: ord.return_qc_status || ord.returnQcStatus || null,
    returnQcStatus: ord.return_qc_status || ord.returnQcStatus || null,
    refund_eligible_amount: ord.refund_eligible_amount || ord.refundEligibleAmount || null,
    refundEligibleAmount: ord.refund_eligible_amount || ord.refundEligibleAmount || null,
    refund_processed_at: ord.refund_processed_at || ord.refundProcessedAt || null,
    refundProcessedAt: ord.refund_processed_at || ord.refundProcessedAt || null
  };
};

export const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const orderParamFromUrl = searchParams.get('orderId') || searchParams.get('orderNumber');

  const {
    cart,
    user,
    authLoading,
    openAuthModal,
    cartSubtotal,
    freeShippingProgress,
    clearCart,
    removeFromCart,
    setPendingAction,
    addToCart,
    selectedCartItemKeys,
    setSelectedCartItemKeys,
    syncCartStock,
    updateUserProfile,
    getCartItemKey,
  } = useCart();

  const getItemKey = React.useCallback((it) => {
    if (typeof getCartItemKey === 'function') return getCartItemKey(it);
    return `${it?.product?.id || it?.id}_${String(it?.selectedSize || it?.size || 'M').trim().toUpperCase()}`;
  }, [getCartItemKey]);

  // Active selected purchase items vs other bag items
  const activeSelectedKeys = React.useMemo(() => {
    const cartKeys = (cart || []).map((it) => getItemKey(it));
    if (selectedCartItemKeys && selectedCartItemKeys.length > 0) {
      const valid = selectedCartItemKeys.filter((k) => cartKeys.includes(k));
      if (valid.length > 0) return valid;
    }
    // Fallback: If no keys explicitly selected, select ONLY the most recent item added (last item in cart)
    if (cart && cart.length > 0) {
      const last = cart[cart.length - 1];
      return [getItemKey(last)];
    }
    return [];
  }, [selectedCartItemKeys, cart, getItemKey]);

  const selectedItems = React.useMemo(() => {
    return (cart || []).filter((item) => activeSelectedKeys.includes(getItemKey(item)));
  }, [cart, activeSelectedKeys, getItemKey]);

  const unselectedItems = React.useMemo(() => {
    return (cart || []).filter((item) => !activeSelectedKeys.includes(getItemKey(item)));
  }, [cart, activeSelectedKeys, getItemKey]);

  const orderSubtotal = React.useMemo(() => {
    return selectedItems.reduce(
      (acc, item) => acc + Number(item.product?.price || 0) * Number(item.quantity || 1),
      0
    );
  }, [selectedItems]);

  // Live stock verification for checkout items
  const [liveStockMap, setLiveStockMap] = useState({});
  const [, setIsValidatingStock] = useState(false);

  useEffect(() => {
    if (!cart || cart.length === 0) return;
    let isCancelled = false;

    if (typeof syncCartStock === 'function') {
      syncCartStock().catch(() => {});
    }

    const fetchLiveStock = async () => {
      setIsValidatingStock(true);
      try {
        const uniqueCleanIds = Array.from(new Set(
          cart.map((item) => {
            const rawId = item.product?.id || item.productId || item.id;
            return String(rawId).replace(/\D/g, '');
          }).filter(Boolean)
        ));

        const results = await Promise.all(
          uniqueCleanIds.map(async (cleanId) => {
            try {
              const res = await apiClient(`/api/products/${cleanId}`);
              if (res && res.success && res.data) {
                return { cleanId, data: res.data };
              }
            } catch (e) {
              // Non-blocking
            }
            return null;
          })
        );

        if (!isCancelled) {
          const map = {};
          results.forEach((r) => {
            if (r) map[r.cleanId] = r.data;
          });
          setLiveStockMap((prev) => ({ ...prev, ...map }));
        }
      } catch (err) {
        console.warn('Live stock verification note:', err);
      } finally {
        if (!isCancelled) setIsValidatingStock(false);
      }
    };

    fetchLiveStock();

    return () => {
      isCancelled = true;
    };
  }, [cart, syncCartStock]);

  const getItemStockInfo = React.useCallback(
    (item) => {
      if (!item) return { isOutOfStock: false, availableStock: 99, insufficientStock: false, reason: '' };
      const rawId = item.product?.id || item.productId || item.id;
      const cleanId = String(rawId).replace(/\D/g, '');
      const liveData = liveStockMap[cleanId] || null;
      return checkItemStockStatus(item, liveData);
    },
    [liveStockMap]
  );

  const outOfStockSelectedItems = React.useMemo(() => {
    return selectedItems.filter((item) => getItemStockInfo(item).isOutOfStock);
  }, [selectedItems, getItemStockInfo]);

  const hasOutOfStockSelected = outOfStockSelectedItems.length > 0;

  const handleIncludeItemInOrder = (item) => {
    const stockInfo = getItemStockInfo(item);
    if (stockInfo.isOutOfStock) {
      const msg = stockInfo.reason || `Cannot add "${item.product?.name || item.name}" - currently out of stock.`;
      showToast(msg, 'error');
      return;
    }
    const key = getItemKey(item);
    setSelectedCartItemKeys((prev) => Array.from(new Set([...(prev || []), key])));
  };

  const handleExcludeItemFromOrder = (item) => {
    const key = getItemKey(item);
    setSelectedCartItemKeys((prev) => (prev || []).filter((k) => k !== key));
  };

  const handleDeleteItem = (item) => {
    const key = getItemKey(item);
    setSelectedCartItemKeys((prev) => (prev || []).filter((k) => k !== key));
    removeFromCart(item.product?.id, item.selectedSize);
  };

  const initialCachedOrder = React.useMemo(() => {
    if (location.state?.viewOrder) {
      return formatOrderDetails(location.state.viewOrder, user);
    }
    if (orderParamFromUrl) {
      return readCachedOrder(orderParamFromUrl);
    }
    const recentCached = readCachedOrder(null);
    if (recentCached && (!cart || cart.length === 0)) {
      return recentCached;
    }
    return null;
  }, [location.state?.viewOrder, orderParamFromUrl, cart, user]);

  // Protect route: Redirect if not authenticated (unless viewing an order confirmation)
  useEffect(() => {
    const hasOrder = Boolean(
      orderParamFromUrl ||
      initialCachedOrder ||
      readCachedOrder(orderParamFromUrl || null)
    );
    if (!authLoading && !user && !hasOrder) {
      if (setPendingAction) {
        setPendingAction(() => () => navigate('/checkout'));
      }
      openAuthModal('login');
      navigate('/');
    }
  }, [user, authLoading, openAuthModal, navigate, setPendingAction, orderParamFromUrl, initialCachedOrder]);

  // Saved Addresses State
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [isAddressesLoading, setIsAddressesLoading] = useState(true);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [saveAddressToAccount, setSaveAddressToAccount] = useState(true);
  const [newAddressErrors, setNewAddressErrors] = useState({});

  // Checkout Address Editing Modal State
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [editingAddressForm, setEditingAddressForm] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    type: 'Home',
    isDefault: false,
  });
  const [editingAddressErrors, setEditingAddressErrors] = useState({});
  const [editingSaving, setEditingSaving] = useState(false);

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
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'cod'

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
  const [orderPlaced, setOrderPlaced] = useState(() => Boolean(initialCachedOrder));
  const [placedOrderNumber, setPlacedOrderNumber] = useState(() => initialCachedOrder?.orderNumber || orderParamFromUrl || '');
  const [confirmedGrandTotal, setConfirmedGrandTotal] = useState(() => initialCachedOrder?.totalPaid || 0);
  const [placedOrderDetails, setPlacedOrderDetails] = useState(() => initialCachedOrder);
  const [isFetchingOrder, setIsFetchingOrder] = useState(() => Boolean(orderParamFromUrl && !initialCachedOrder));
  const [orderFetchError, setOrderFetchError] = useState(false);
  const [toast, setToast] = useState(null); // { message: string, type: 'info' | 'error' | 'success' }
  const [paymentErrorMessage, _setPaymentErrorMessage] = useState('');
  const [liveTrackingOpen, setLiveTrackingOpen] = useState(false);
  const [shippingServiceability, setShippingServiceability] = useState({
    loading: false,
    checked: false,
    available: true,
    minDays: 2,
    maxDays: 4,
    zone: 'DOMESTIC',
    courierName: 'Urvaah Express (Shiprocket)',
    codAvailable: true,
    pincode: ''
  });
  const [isReordering, setIsReordering] = useState(false);

  // Dynamic Store Settings (GST & Card Surcharge)
  const [storeSettings, setStoreSettings] = useState({
    gst_percentage: 18,
    enable_tiered_gst: true,
    gst_threshold: 2500,
    gst_rate_below: 5,
    gst_rate_above: 18,
    card_charge_enabled: true,
    card_charge_percentage: 2,
    free_shipping_threshold: 2999
  });

  useEffect(() => {
    let isMounted = true;
    apiClient('/api/settings/public')
      .then((res) => {
        if (isMounted && res && res.success && res.data) {
          setStoreSettings(res.data);
        }
      })
      .catch((err) => {
        console.warn('[Checkout] Failed to load store settings:', err.message);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const setPaymentErrorMessage = (msg, type = 'error') => {
    _setPaymentErrorMessage(msg || '');
    if (!msg) {
      setToast(null);
    } else {
      showToast(msg, type);
    }
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  const [orderCancelled, setOrderCancelled] = useState(false);
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isCancelOrderModalOpen, setIsCancelOrderModalOpen] = useState(false);
  const [isConfirmOrderModalOpen, setIsConfirmOrderModalOpen] = useState(false);
  const [isItemReturnModalOpen, setIsItemReturnModalOpen] = useState(false);
  const [itemActionsState, setItemActionsState] = useState({});
  const [productSizeStocks, setProductSizeStocks] = useState({});
  const [returnBankDetails, setReturnBankDetails] = useState({
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    holderName: ''
  });
  const [cancelBankDetails, setCancelBankDetails] = useState({
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    holderName: ''
  });
  const [isEditingCancelBank, setIsEditingCancelBank] = useState(false);
  const [isEditingReturnBank, setIsEditingReturnBank] = useState(false);
  const [isSavingReturnBank, setIsSavingReturnBank] = useState(false);
  const [savedBankDetailsSnapshot, setSavedBankDetailsSnapshot] = useState(null);
  const [returnComments, setReturnComments] = useState('');
  const [isSubmittingItemReturn, setIsSubmittingItemReturn] = useState(false);
  const [itemReturnError, setItemReturnError] = useState('');

  const getSavedBank = (ord) => {
    let acc = (ord?.refund_bank_account || placedOrderDetails?.refund_bank_account || user?.bankDetails?.accountNumber || '').trim();
    let ifsc = (ord?.refund_ifsc_code || placedOrderDetails?.refund_ifsc_code || user?.bankDetails?.ifscCode || '').trim();
    let holder = (ord?.refund_holder_name || placedOrderDetails?.refund_holder_name || user?.bankDetails?.holderName || placedOrderDetails?.shippingAddress?.name || user?.name || '').trim();

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

  const handleSaveReturnBank = async () => {
    const cleanHolder = (returnBankDetails.holderName || '').trim();
    const cleanIfsc = (returnBankDetails.ifscCode || '').trim().toUpperCase();
    const cleanAccount = (returnBankDetails.accountNumber || '').trim();
    const cleanConfirm = (returnBankDetails.confirmAccountNumber || '').trim();

    if (!cleanHolder) {
      setItemReturnError('Please enter Account Holder Name.');
      return;
    }
    if (cleanHolder.length < 2 || !/^[a-zA-Z\s.]{2,70}$/.test(cleanHolder)) {
      setItemReturnError('Account Holder Name must be at least 2 characters (letters, spaces, and periods only).');
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
      holderName: cleanHolder,
      refund_bank_account: cleanAccount,
      refund_ifsc_code: cleanIfsc,
      refund_holder_name: cleanHolder
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

    setPlacedOrderDetails(prev => prev ? ({
      ...prev,
      refund_bank_account: cleanAccount,
      refund_ifsc_code: cleanIfsc,
      refund_holder_name: cleanHolder
    }) : prev);

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
    }

    // Background sync: dispatch profile & order update concurrently without blocking UI
    setIsSavingReturnBank(true);
    const targetOrderNumber = details?.orderNumber || details?.id || placedOrderNumber;
    const syncOps = [];

    if (typeof updateUserProfile === 'function') {
      syncOps.push(
        updateUserProfile({
          refund_bank_account: cleanAccount,
          refund_ifsc_code: cleanIfsc,
          refund_holder_name: cleanHolder
        }).catch(e => console.warn('User profile bank sync:', e.message))
      );
    }

    if (targetOrderNumber) {
      syncOps.push(
        apiClient(`/api/orders/${targetOrderNumber}/bank-details`, {
          method: 'PUT',
          body: JSON.stringify(bankPayload)
        }).catch(orderErr => console.warn('Order bank update warning:', orderErr.message))
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
      const fallback = getSavedBank(placedOrderDetails || details);
      setReturnBankDetails(fallback);
    }
    setIsEditingReturnBank(false);
    setItemReturnError('');
  };

  // Real-time Shiprocket Pincode Serviceability & Courier Check (Optimized to avoid duplicate requests)
  const lastCheckedPinRef = useRef('');
  useEffect(() => {
    const rawPin = showNewAddressForm
      ? newShippingForm.pincode
      : addresses[selectedAddressIndex]?.pincode;
    const cleanPin = String(rawPin || '').trim();

    if (/^\d{6}$/.test(cleanPin)) {
      if (lastCheckedPinRef.current === cleanPin) {
        return;
      }
      lastCheckedPinRef.current = cleanPin;

      let isMounted = true;
      setShippingServiceability((prev) => ({
        ...prev,
        loading: true,
        pincode: cleanPin
      }));

      shippingApi
        .checkServiceability(cleanPin)
        .then((res) => {
          if (!isMounted) return;
          const isAvail = res?.available !== false && res?.success !== false;
          const couriers = res?.data?.available_courier_companies || [];
          const topCourier = couriers[0];
          const hasCod =
            couriers.length > 0
              ? couriers.some((c) => Number(c.cod) === 1)
              : true;

          setShippingServiceability({
            loading: false,
            checked: true,
            available: isAvail,
            minDays: res?.minDays || 2,
            maxDays: res?.maxDays || 4,
            zone: res?.zone || 'DOMESTIC',
            courierName:
              topCourier?.courier_name ||
              (res?.zone === 'METRO'
                ? 'Blue Dart Air / Delhivery'
                : 'Urvaah Express Logistics'),
            codAvailable: hasCod,
            pincode: cleanPin
          });

          if (!hasCod) {
            setPaymentMethod((prev) => (prev === 'cod' ? 'upi' : prev));
          }
        })
        .catch((err) => {
          if (!isMounted) return;
          console.warn('[Checkout] Serviceability check notice:', err.message);
          setShippingServiceability((prev) => ({
            ...prev,
            loading: false,
            checked: true,
            available: true,
            pincode: cleanPin
          }));
        });

      return () => {
        isMounted = false;
      };
    } else {
      lastCheckedPinRef.current = '';
      setShippingServiceability((prev) => ({
        ...prev,
        checked: false,
        loading: false
      }));
    }
  }, [
    showNewAddressForm,
    newShippingForm.pincode,
    addresses,
    selectedAddressIndex
  ]);
  const [cancelOrderReason, setCancelOrderReason] = useState('Ordered by mistake');
  const [cancelOrderComments, setCancelOrderComments] = useState('');
  const [cancelOrderError, setCancelOrderError] = useState('');

  useModalScrollLock(isCancelOrderModalOpen, () => !isCancellingOrder && setIsCancelOrderModalOpen(false));
  useModalScrollLock(Boolean(isConfirmOrderModalOpen || isPlacingOrder), () => {
    if (!isPlacingOrder && isConfirmOrderModalOpen) {
      setIsConfirmOrderModalOpen(false);
    }
  });
  useModalScrollLock(isItemReturnModalOpen, () => !isSubmittingItemReturn && setIsItemReturnModalOpen(false));

  const activeAddressForReview = useMemo(() => {
    if (showNewAddressForm || addresses.length === 0) {
      return {
        name: newShippingForm.fullName || user?.name || 'Customer',
        phone: newShippingForm.phone || user?.phone || '',
        street: newShippingForm.street || '',
        city: newShippingForm.city || '',
        state: newShippingForm.state || '',
        pincode: newShippingForm.pincode || '',
        type: newShippingForm.type || 'Home'
      };
    }
    const sel = addresses[selectedAddressIndex] || {};
    return {
      name: sel.recipient_name || sel.name || user?.name || 'Customer',
      phone: sel.phone || user?.phone || '',
      street: sel.full_address || sel.street || '',
      city: sel.city || '',
      state: sel.state || '',
      pincode: sel.postal_code || sel.pincode || '',
      type: sel.address_label || sel.type || 'Home'
    };
  }, [showNewAddressForm, addresses, selectedAddressIndex, newShippingForm, user]);

  // Address edit modal state (24-hour order edit window)
  const [isEditAddressModalOpen, setIsEditAddressModalOpen] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressEditForm, setAddressEditForm] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [addressEditError, setAddressEditError] = useState('');
  const hasAutoOpenedAddressEditRef = useRef(false);
  const fetchedOrderParamRef = useRef(null);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);

  const handleCloseEditAddressModal = () => {
    setIsEditAddressModalOpen(false);
    hasAutoOpenedAddressEditRef.current = true;
    if (location.state?.openAddressEdit) {
      navigate(location.pathname + location.search, {
        replace: true,
        state: { ...location.state, openAddressEdit: false }
      });
    }
  };

  useModalScrollLock(Boolean(isEditAddressModalOpen || isEditingModalOpen), () => {
    if (!isSavingAddress && isEditAddressModalOpen) handleCloseEditAddressModal();
    if (isEditingModalOpen) setIsEditingModalOpen(false);
  });

  // Fetch saved addresses for user (Single source of truth)
  const loadAddresses = async () => {
    if (!user) return;
    setIsAddressesLoading(true);
    try {
      const res = await apiClient('/api/users/profile');
      if (res.success && res.addresses && res.addresses.length > 0) {
        const mapped = res.addresses.map((a) => ({
          id: a.id,
          name: a.recipient_name || a.name || user.name || 'Recipient',
          phone: a.phone || a.contact_phone || user.phone || '',
          street: a.full_address || a.street || '',
          city: a.city || '',
          state: findMatchedState(a.state) || a.state || '',
          pincode: a.postal_code || a.pincode || '',
          type: a.address_label || a.type || 'Home',
          isDefault: !!a.is_default,
        }));
        setAddresses(mapped);

        // Find default shipping address index
        const defaultIdx = mapped.findIndex((a) => a.isDefault);
        setSelectedAddressIndex(defaultIdx >= 0 ? defaultIdx : 0);
        setShowNewAddressForm(false);
      } else if (user.addresses && user.addresses.length > 0) {
        const mapped = user.addresses.map((a) => ({
          id: a.id,
          name: a.recipient_name || a.name || user.name || 'Recipient',
          phone: a.phone || a.contact_phone || user.phone || '',
          street: a.full_address || a.street || '',
          city: a.city || '',
          state: findMatchedState(a.state) || a.state || '',
          pincode: a.postal_code || a.pincode || '',
          type: a.address_label || a.type || 'Home',
          isDefault: !!a.is_default,
        }));
        setAddresses(mapped);
        const defaultIdx = mapped.findIndex((a) => a.isDefault);
        setSelectedAddressIndex(defaultIdx >= 0 ? defaultIdx : 0);
        setShowNewAddressForm(false);
      } else {
        setAddresses([]);
        setShowNewAddressForm(true);
      }
    } catch (err) {
      console.warn('Error loading addresses in Checkout:', err.message);
      setAddresses([]);
      setShowNewAddressForm(true);
    } finally {
      setIsAddressesLoading(false);
    }
  };

  // Check for viewOrder passed from Account page, URL orderId/orderNumber, or sessionStorage fallback
  useEffect(() => {
    const orderParam = searchParams.get('orderId') || searchParams.get('orderNumber');
    if (location.state?.viewOrder) {
      const formatted = formatOrderDetails(location.state.viewOrder, user);
      if (formatted) {
        setPlacedOrderDetails(formatted);
        setPlacedOrderNumber(formatted.orderNumber);
        setConfirmedGrandTotal(formatted.totalPaid);
        setOrderPlaced(true);
        setIsFetchingOrder(false);
        try {
          sessionStorage.setItem(ORDER_SESSION_KEY, JSON.stringify(formatted));
        } catch (e) {}
        if (!orderParam || orderParam !== formatted.orderNumber) {
          navigate(`/checkout?orderNumber=${encodeURIComponent(formatted.orderNumber)}`, { replace: true, state: location.state });
        }
      }
    } else if (orderParam) {
      const cached = readCachedOrder(orderParam);
      if (cached && !placedOrderDetails) {
        setPlacedOrderDetails(cached);
        setPlacedOrderNumber(cached.orderNumber);
        setConfirmedGrandTotal(cached.totalPaid);
        setOrderPlaced(true);
        setIsFetchingOrder(false);
      }

      // Fetch from API only once per orderParam unless explicitly requested
      if (user && fetchedOrderParamRef.current !== orderParam) {
        fetchedOrderParamRef.current = orderParam;
        if (!cached && !placedOrderDetails) {
          setIsFetchingOrder(true);
        }
        apiClient(`/api/orders/${orderParam}`)
          .then((res) => {
            const ord = res.data || res.order;
            if (ord) {
              const formatted = formatOrderDetails(ord, user);
              setPlacedOrderDetails(formatted);
              setPlacedOrderNumber(formatted.orderNumber);
              setConfirmedGrandTotal(formatted.totalPaid);
              setOrderPlaced(true);
              setOrderFetchError(false);
              try {
                sessionStorage.setItem(ORDER_SESSION_KEY, JSON.stringify(formatted));
              } catch (e) {}
            } else if (!cached && !placedOrderDetails) {
              setOrderFetchError(true);
            }
          })
          .catch((err) => {
            console.warn('Could not fetch order from API:', err);
            if (!cached && !placedOrderDetails) {
              setOrderFetchError(true);
            }
          })
          .finally(() => {
            setIsFetchingOrder(false);
          });
      }
    } else if (!orderParam && (!cart || cart.length === 0)) {
      // If user refreshed on /checkout without query param, restore recent cached order if available
      const cached = readCachedOrder(null);
      if (cached) {
        setPlacedOrderDetails(cached);
        setPlacedOrderNumber(cached.orderNumber);
        setConfirmedGrandTotal(cached.totalPaid);
        setOrderPlaced(true);
        setIsFetchingOrder(false);
        navigate(`/checkout?orderNumber=${encodeURIComponent(cached.orderNumber)}`, { replace: true });
      }
    }
  }, [location.state, searchParams, user, cart?.length, navigate]);

  // Real-time synchronization: update order status dynamically when admin or other session updates it
  useEffect(() => {
    const currentOrderNum = placedOrderNumber || placedOrderDetails?.orderNumber || searchParams.get('orderNumber') || searchParams.get('orderId');
    if (!currentOrderNum) return;

    const unsubscribe = subscribeToOrderUpdates((payload) => {
      if (!payload) return;
      const targetNum = String(currentOrderNum).toLowerCase();
      const match =
        String(payload.order_number || payload.orderNumber || '').toLowerCase() === targetNum ||
        String(payload.id || '').toLowerCase() === targetNum;

      if (match && payload.status) {
        setPlacedOrderDetails((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: payload.status,
            paymentStatus: payload.payment_status || payload.paymentStatus || prev.paymentStatus,
            cancel_reason: payload.cancel_reason || payload.cancelReason || prev.cancel_reason,
            rejection_reason: payload.rejection_reason || payload.rejectionReason || prev.rejection_reason
          };
        });
        if (payload.status === 'Cancelled') {
          setOrderCancelled(true);
        } else if (payload.status === 'Cancellation Rejected' || payload.status === 'Restore' || (payload.status && !payload.status.toLowerCase().includes('cancel'))) {
          setOrderCancelled(false);
        }
      }

      if (match && (payload.shippingAddress || payload.shipping_address)) {
        const sa = payload.shippingAddress || payload.shipping_address;
        setPlacedOrderDetails((prev) => {
          if (!prev) return prev;
          const next = {
            ...prev,
            customerPhone: payload.customerPhone || sa.phone || prev.customerPhone,
            shippingAddress: {
              ...prev.shippingAddress,
              ...sa
            }
          };
          try {
            sessionStorage.setItem(ORDER_SESSION_KEY, JSON.stringify(next));
          } catch (e) {}
          return next;
        });
      }
    });

    return () => unsubscribe();
  }, [placedOrderNumber, placedOrderDetails?.orderNumber, searchParams]);

  // Auto-open Address Edit modal if directed from Account or navigation state
  useEffect(() => {
    if (location.state?.openAddressEdit && placedOrderDetails && !hasAutoOpenedAddressEditRef.current) {
      hasAutoOpenedAddressEditRef.current = true;
      const ord = placedOrderDetails;
      const rawCreatedAt = ord.createdAt || ord.created_at || ord.createddate || ord.placedAt;
      const orderCreatedMs = rawCreatedAt ? new Date(rawCreatedAt).getTime() : Date.now();
      const diffHours = (Date.now() - orderCreatedMs) / (1000 * 60 * 60);
      const statusLower = (ord.status || '').toLowerCase();
      const isLocked = ['shipped', 'dispatched', 'out for delivery', 'delivered', 'cancelled', 'cancellation requested', 'returned'].some((s) => statusLower.includes(s));

      if (diffHours <= 24 && !isLocked) {
        const addr = ord.shippingAddress || ord.shipping_address || {};
        setAddressEditForm({
          name: addr.name || addr.recipient_name || ord.recipient_name || ord.customer_name || user?.name || '',
          phone: ord.recipient_phone || ord.customer_phone || ord.phone || addr.phone || user?.phone || '',
          street: addr.street || addr.full_address || ord.full_address || '',
          city: addr.city || ord.city || '',
          state: addr.state || ord.state || '',
          pincode: addr.pincode || addr.postal_code || ord.postal_code || ''
        });
        setAddressEditError('');
        setIsEditAddressModalOpen(true);
      }
    }
  }, [location.state?.openAddressEdit, placedOrderDetails, user]);

  // On-demand order status refresh (called strictly as required)
  const refreshLatestStatus = async () => {
    const currentOrderNum = placedOrderNumber || placedOrderDetails?.orderNumber || searchParams.get('orderNumber') || searchParams.get('orderId');
    if (!currentOrderNum || isRefreshingStatus) return;

    setIsRefreshingStatus(true);
    try {
      const res = await apiClient(`/api/orders/${currentOrderNum}`);
      const ord = res?.data || res?.order;
      if (ord) {
        const formatted = formatOrderDetails(ord, user);
        setPlacedOrderDetails(formatted);
        const stLower = (ord.status || '').toLowerCase();
        const isRej = stLower === 'cancellation rejected' || 
          Boolean(ord.rejection_reason && (ord.rejection_reason.toLowerCase().includes('cancel') || ord.rejection_reason.toLowerCase().includes('rejected'))) ||
          Boolean(ord.cancel_reason && ord.cancel_reason.toLowerCase().includes('rejected'));

        if (!isRej && (['cancelled', 'refunded'].includes(stLower) || (ord.cancel_reason && !ord.cancel_reason.toLowerCase().includes('rejected')))) {
          setOrderCancelled(true);
        } else {
          setOrderCancelled(false);
        }
        showToast('Order details refreshed.', 'success');
      }
    } catch (e) {
      console.warn('Manual order status refresh warning:', e.message);
    } finally {
      setIsRefreshingStatus(false);
    }
  };

  useEffect(() => {
    if (user) {
      setNewShippingForm((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        phone: prev.phone || user.phone || '',
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

  // Calculations (strictly computed on selected purchase items using live store settings)
  const shippingFee = 0; // Free express shipping
  const discountAmount = appliedCoupon
    ? Math.round((orderSubtotal * appliedCoupon.discountPercent) / 100)
    : 0;
  const taxableAmount = Math.max(0, orderSubtotal - discountAmount);

  // Dynamic GST Tax Rule from Admin Settings
  let taxRate = Number(storeSettings.gst_percentage) || 18;
  if (storeSettings.enable_tiered_gst) {
    taxRate = taxableAmount > (Number(storeSettings.gst_threshold) || 2500)
      ? (Number(storeSettings.gst_rate_above) || 18)
      : (Number(storeSettings.gst_rate_below) || 5);
  }
  const taxAmount = taxableAmount > 0 ? Math.round(taxableAmount * (taxRate / 100)) : 0;
  const basePayable = taxableAmount + taxAmount + shippingFee;

  // Dynamic Card Surcharge from Admin Settings
  const cardSurcharge = (paymentMethod === 'card' && storeSettings.card_charge_enabled)
    ? Math.round(basePayable * ((Number(storeSettings.card_charge_percentage) || 2) / 100))
    : 0;
  const grandTotal = basePayable + cardSurcharge;

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

  // Helper to dynamically load Razorpay Checkout JS SDK
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const buildShiprocketOrderPayload = (orderNumber, orderId, totalAmount, paymentMode, addressObj, itemsList) => {
    const rawItems = (itemsList && itemsList.length > 0) ? itemsList : (selectedItems || []);
    const addr = addressObj || {};

    const fullName = (addr.name || addr.fullName || addr.recipient_name || user?.name || 'Valued Customer').trim();
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || '';

    const streetAddress = addr.street || addr.full_address || addr.address || addr.address_line || 'Boutique Address';
    const cityName = addr.city || 'Mumbai';
    const stateName = addr.state || 'Maharashtra';
    const pincodeVal = String(addr.pincode || addr.postal_code || '400001').replace(/\D/g, '').slice(0, 6) || '400001';
    const phoneVal = String(addr.phone || user?.phone || '9999999999').replace(/\D/g, '').slice(-10) || '9999999999';
    const emailVal = user?.email || addr.email || 'customer@houseofurvaah.com';

    return {
      order_id: String(orderNumber || orderId),
      order_number: String(orderNumber || orderId),
      id: orderId || orderNumber,
      order_date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      pickup_location: 'Primary Atelier',
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: streetAddress,
      billing_city: cityName,
      billing_pincode: pincodeVal,
      billing_state: stateName,
      billing_country: addr.country || 'India',
      billing_email: emailVal,
      billing_phone: phoneVal,
      shipping_is_billing: true,
      shippingAddress: {
        firstName,
        lastName,
        address: streetAddress,
        city: cityName,
        state: stateName,
        pincode: pincodeVal,
        country: addr.country || 'India',
        phone: phoneVal,
        email: emailVal
      },
      recipient_name: fullName,
      shipping_address_line: streetAddress,
      city: cityName,
      state: stateName,
      pincode: pincodeVal,
      recipient_phone: phoneVal,
      customer_email: emailVal,
      order_items: rawItems.map((item) => ({
        name: item.name || item.product?.name || item.title || 'Luxury Garment',
        sku: String(item.product?.id || item.productId || item.id || item.sku || 'URV-SKU-001'),
        units: parseInt(item.quantity || 1, 10),
        selling_price: parseFloat(item.price || item.product?.price || item.unit_price || 0)
      })),
      items: rawItems.map((item) => ({
        name: item.name || item.product?.name || item.title || 'Luxury Garment',
        sku: String(item.product?.id || item.productId || item.id || item.sku || 'URV-SKU-001'),
        product_id: item.product?.id || item.productId || item.id,
        quantity: parseInt(item.quantity || 1, 10),
        units: parseInt(item.quantity || 1, 10),
        price: parseFloat(item.price || item.product?.price || item.unit_price || 0),
        unit_price: parseFloat(item.price || item.product?.price || item.unit_price || 0)
      })),
      payment_method: (paymentMode === 'cod' || String(paymentMode).toLowerCase().includes('cash')) ? 'COD' : 'Prepaid',
      payment_type: (paymentMode === 'cod' || String(paymentMode).toLowerCase().includes('cash')) ? 'COD' : 'Prepaid',
      sub_total: parseFloat(orderSubtotal || totalAmount || grandTotal || 0),
      total: parseFloat(totalAmount || grandTotal || 0),
      subtotal: parseFloat(orderSubtotal || totalAmount || grandTotal || 0),
      length: 15,
      breadth: 12,
      height: 6,
      weight: 0.6
    };
  };

  const finalizeOrderSuccess = (orderNumber, amount, customTrackingNumber = null) => {
    const finalPaid = (amount !== undefined && amount > 0) ? amount : (grandTotal || 0);
    setConfirmedGrandTotal(finalPaid);

    const snapshotItems = (selectedItems && selectedItems.length > 0)
      ? selectedItems.map((item) => ({
          id: item.product?.id || item.id,
          name: item.product?.name || item.name,
          price: item.product?.price || item.price,
          quantity: item.quantity,
          image: item.product?.image || (item.product?.gallery && item.product?.gallery[0]) || item.image || '/assets/Images/Brown01.png',
          selectedSize: item.selectedSize || 'M',
          product: item.product,
        }))
      : [];

    const selectedAddr = (showNewAddressForm || addresses.length === 0)
      ? {
          name: newShippingForm.fullName,
          phone: newShippingForm.phone,
          street: newShippingForm.street,
          city: newShippingForm.city,
          state: newShippingForm.state,
          pincode: newShippingForm.pincode,
          country: newShippingForm.country || 'INDIA',
        }
      : (addresses[selectedAddressIndex] || {});

    const deliveryDateObj = new Date();
    deliveryDateObj.setDate(deliveryDateObj.getDate() + 7);
    const estimatedDeliveryStr = deliveryDateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const trackingNum = customTrackingNumber || `TRK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const orderNum = orderNumber || `ORD-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const details = {
      orderNumber: orderNum,
      trackingNumber: trackingNum,
      estimatedDelivery: estimatedDeliveryStr,
      items: snapshotItems,
      subtotal: orderSubtotal,
      tax: taxAmount,
      taxRate: taxRate,
      discount: discountAmount,
      shippingFee: shippingFee,
      totalPaid: finalPaid,
      shippingAddress: selectedAddr,
      paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : paymentMethod === 'card' ? 'Credit / Debit Card' : 'UPI',
      payment_method: paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : paymentMethod === 'card' ? 'Credit / Debit Card' : 'UPI',
      paymentStatus: paymentMethod === 'cod' ? 'Pending' : 'Paid',
      payment_status: paymentMethod === 'cod' ? 'Pending' : 'Paid',
      customerEmail: user?.email || '',
      customerPhone: selectedAddr.phone || user?.phone || '',
      status: 'Pending',
      placedAt: new Date().toISOString()
    };

    setPlacedOrderDetails(details);

    try {
      sessionStorage.setItem(ORDER_SESSION_KEY, JSON.stringify(details));
    } catch (e) {
      console.warn('Could not cache placed order to sessionStorage', e);
    }

    // Remove only the purchased items from cart, keeping unselected items in bag!
    if (selectedItems && selectedItems.length > 0) {
      selectedItems.forEach((item) => {
        removeFromCart(item.product?.id, item.selectedSize);
      });
    }
    setPlacedOrderNumber(orderNum);
    forceUnlockScroll(true);
    setIsPlacingOrder(false);
    setOrderPlaced(true);
    setIsFetchingOrder(false);

    // Update URL to /checkout?orderNumber=... so refresh keeps the confirmation screen
    navigate(`/checkout?orderNumber=${encodeURIComponent(orderNum)}`, { replace: true });

    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const verifyAndCompletePayment = async ({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    order_id,
    orderNumber,
    amountPaid,
    shippingAddress,
    orderItems
  }) => {
    try {
      const verifyRes = await apiClient('/api/payments/verify', {
        method: 'POST',
        body: JSON.stringify({
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          order_id
        })
      });

      if (verifyRes && verifyRes.success) {
        // Register forward shipment in Shiprocket (/api/shipping/order/create)
        let shiprocketTrackingCode = null;
        try {
          const currentAddr = shippingAddress || (showNewAddressForm || addresses.length === 0
            ? {
                name: newShippingForm.fullName,
                phone: newShippingForm.phone,
                street: newShippingForm.street,
                city: newShippingForm.city,
                state: newShippingForm.state,
                pincode: newShippingForm.pincode,
                country: newShippingForm.country || 'India',
              }
            : (addresses[selectedAddressIndex] || {}));

          const shiprocketPayload = buildShiprocketOrderPayload(
            orderNumber,
            order_id,
            amountPaid || grandTotal,
            paymentMethod,
            currentAddr,
            orderItems || selectedItems
          );
          console.log('[Checkout] Registering online order with Shiprocket (/api/shipping/order/create)...', shiprocketPayload);
          const shipRes = await shippingApi.createShipment(shiprocketPayload);
          console.log('[Checkout] Shiprocket forward shipment response:', shipRes);
          if (shipRes && (shipRes.shipment_id || shipRes.awb_code)) {
            shiprocketTrackingCode = shipRes.shipment_id || shipRes.awb_code;
          }
        } catch (srErr) {
          console.warn('[Checkout] Shiprocket forward shipment registration note (non-blocking):', srErr.message);
        }

        finalizeOrderSuccess(orderNumber, amountPaid || grandTotal, shiprocketTrackingCode);
      } else {
        setIsPlacingOrder(false);
        setPaymentErrorMessage(verifyRes?.message || 'Payment verification failed. Your items remain saved in your bag so you can try again.');
        showToast(verifyRes?.message || 'Payment verification failed.', 'error');
      }
    } catch (err) {
      console.error('Payment verification API error:', err.message);
      setIsPlacingOrder(false);
      setPaymentErrorMessage(err.message || 'Payment verification failed. Your bag is saved - please check your connection and try again.');
      showToast('Payment verification failed. Please try again.', 'error');
    }
  };

  // Validate inline shipping address form on checkout
  const validateNewShippingForm = () => {
    const errors = {};
    if (!newShippingForm.fullName || !newShippingForm.fullName.trim()) {
      errors.fullName = 'Recipient full name is required.';
    }
    const cleanPhone = (newShippingForm.phone || '').replace(/\D/g, '');
    if (!cleanPhone) {
      errors.phone = 'Phone number is required.';
    } else if (cleanPhone.length !== 10) {
      errors.phone = 'Phone number must be exactly 10 digits.';
    }
    if (!newShippingForm.street || !newShippingForm.street.trim()) {
      errors.street = 'Street address / flat / building is required.';
    }
    if (!newShippingForm.city || !newShippingForm.city.trim()) {
      errors.city = 'City is required.';
    }

    const cleanPincode = (newShippingForm.pincode || '').replace(/\D/g, '');
    if (!cleanPincode) {
      errors.pincode = 'Pincode is required.';
    } else if (cleanPincode.length !== 6) {
      errors.pincode = 'Pincode must be exactly 6 digits.';
    }
    setNewAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Open edit modal for an address on Checkout
  const openEditAddressOnCheckout = (idx) => {
    const item = addresses[idx];
    if (!item) return;
    setEditingAddressId(item.id || null);
    setEditingAddressForm({
      name: item.name || '',
      phone: item.phone || '',
      street: item.street || '',
      city: item.city || '',
      state: findMatchedState(item.state) || item.state || '',
      pincode: item.pincode || '',
      type: item.type || 'Home',
      isDefault: item.isDefault || false,
    });
    setEditingAddressErrors({});
    setIsEditingModalOpen(true);
  };

  // Save edited address on Checkout (PUT /api/addresses/:id)
  const handleSaveCheckoutEditedAddress = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!editingAddressForm.name || !editingAddressForm.name.trim()) errors.name = 'Recipient name is required.';
    const cleanPhone = (editingAddressForm.phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) errors.phone = 'Valid 10-digit phone number is required.';
    if (!editingAddressForm.street || !editingAddressForm.street.trim()) errors.street = 'Street address is required.';
    if (!editingAddressForm.city || !editingAddressForm.city.trim()) errors.city = 'City is required.';

    const cleanPincode = (editingAddressForm.pincode || '').replace(/\D/g, '');
    if (!cleanPincode || cleanPincode.length !== 6) errors.pincode = 'Valid 6-digit pincode is required.';

    if (Object.keys(errors).length > 0) {
      setEditingAddressErrors(errors);
      return;
    }

    setEditingSaving(true);
    try {
      const payload = {
        user_id: user.id || user.username || user.email,
        address_label: editingAddressForm.type || 'Home',
        full_address: editingAddressForm.street.trim(),
        city: editingAddressForm.city.trim(),
        state: editingAddressForm.state.trim(),
        postal_code: editingAddressForm.pincode.trim(),
        is_default: editingAddressForm.isDefault,
        recipient_name: editingAddressForm.name.trim(),
        phone: editingAddressForm.phone.trim(),
      };

      if (editingAddressId && !String(editingAddressId).startsWith('local-')) {
        await apiClient(`/api/addresses/${editingAddressId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      }
      await loadAddresses();
      setIsEditingModalOpen(false);
    } catch (err) {
      console.error('Error saving edited address on checkout:', err);
    } finally {
      setEditingSaving(false);
    }
  };

  // Place Order Handler
  // Pre-validate form inputs and open Order Review & Confirmation Modal
  const handlePlaceOrder = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setPaymentErrorMessage('');

    // 0. Selected Items Pre-check
    if (selectedItems.length === 0) {
      setPaymentErrorMessage('Please select at least one item to place an order.');
      return;
    }

    // 1. Stock Availability Pre-check
    const outOfStockItems = selectedItems.filter(
      (item) => getItemStockInfo(item).isOutOfStock
    );
    if (outOfStockItems.length > 0) {
      const names = outOfStockItems
        .map((it) => `"${it.product?.name || it.name}" (${it.selectedSize})`)
        .join(', ');
      const msg = `Cannot proceed: ${names} is currently out of stock. Please remove from your order to proceed.`;
      setPaymentErrorMessage(msg);
      showToast(msg, 'error');
      return;
    }

    // 2. Shipping Address Pre-check
    if (showNewAddressForm || addresses.length === 0) {
      if (!validateNewShippingForm()) {
        setPaymentErrorMessage('Please fill in all required delivery address fields correctly.');
        return;
      }

      if (showNewAddressForm && addresses.length >= 4) {
        setPaymentErrorMessage('You can save a maximum of 4 delivery addresses. Please select from your saved addresses or edit an existing one.');
        return;
      }
    }

    // 3. Courier Serviceability Pre-check
    if (shippingServiceability.checked && !shippingServiceability.available) {
      setPaymentErrorMessage('Delivery is not serviceable for this pincode. Please enter an alternate delivery pincode.');
      return;
    }

    // Pre-validations passed: open Order Review & Confirmation modal
    setConfirmedGrandTotal(grandTotal);
    setIsConfirmOrderModalOpen(true);
  };

  // Execute Actual Order Placement (Called when customer clicks "Confirm & Place Order" in modal)
  const executeOrderPlacement = async () => {
    setIsPlacingOrder(true);
    setPaymentErrorMessage('');
    setConfirmedGrandTotal(grandTotal);

    try {
      const selectedAddr = (showNewAddressForm || addresses.length === 0)
        ? { name: newShippingForm.fullName, phone: newShippingForm.phone }
        : (addresses[selectedAddressIndex] || {});

      let activeAddressId = null;
      let addressPayload = null;

      if (showNewAddressForm || addresses.length === 0) {
        addressPayload = {
          user_id: user.id || user.username || user.email,
          address_label: newShippingForm.type || 'Home',
          full_address: newShippingForm.street.trim(),
          city: newShippingForm.city.trim(),
          state: newShippingForm.state.trim(),
          postal_code: newShippingForm.pincode.trim(),
          is_default: saveAddressToAccount && addresses.length === 0,
          recipient_name: newShippingForm.fullName.trim(),
          phone: newShippingForm.phone.trim(),
        };

        try {
          const createRes = await apiClient('/api/addresses', {
            method: 'POST',
            body: JSON.stringify(addressPayload),
          });
          if (createRes && createRes.success && createRes.data) {
            activeAddressId = createRes.data.id;
            await loadAddresses();
          }
        } catch (err) {
          console.warn('API address creation fallback:', err);
        }
      } else {
        activeAddressId = selectedAddr.id || null;
      }

      let sanitizedAddressId = activeAddressId;
      if (sanitizedAddressId) {
        const strVal = String(sanitizedAddressId).trim();
        if (strVal.startsWith('local-') || isNaN(Number(strVal))) {
          sanitizedAddressId = null;
        } else {
          sanitizedAddressId = parseInt(strVal, 10);
        }
      } else {
        sanitizedAddressId = null;
      }

      const randomOrderNum = `HOU-${Math.floor(100000 + Math.random() * 900000)}`;

      const orderPayload = {
        orderNumber: randomOrderNum,
        addressId: sanitizedAddressId,
        shippingAddress: (showNewAddressForm || addresses.length === 0) ? addressPayload : selectedAddr,
        paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : paymentMethod === 'card' ? 'Credit / Debit Card' : 'UPI',
        paymentStatus: 'Pending',
        paymentType: paymentMethod === 'cod' ? 'COD' : paymentMethod === 'card' ? 'Card' : 'UPI',
        subtotal: orderSubtotal,
        tax: taxAmount,
        taxRate: taxRate,
        shipping: shippingFee,
        cardSurcharge: cardSurcharge,
        total: grandTotal,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        items: selectedItems.map((item) => {
          let cleanId = item.product?.id || item.id || item.productId;
          if (typeof cleanId === 'string') {
            const digits = cleanId.replace(/\D/g, '');
            if (digits) {
              const num = parseInt(digits, 10);
              cleanId = num === 103 ? 106 : num;
            }
          }
          return {
            id: cleanId,
            productId: cleanId,
            name: item.product?.name || item.name || 'Garment',
            price: Number(item.product?.price || item.price || 0),
            quantity: item.quantity || 1,
            size: item.selectedSize || 'M',
            image: item.product?.image || item.image || ''
          };
        })
      };

      // Case 1: Cash on Delivery (COD) -> directly create order & skip Razorpay
      if (paymentMethod === 'cod') {
        try {
          const res = await apiClient('/api/orders', {
            method: 'POST',
            body: JSON.stringify(orderPayload)
          });
          if (res && res.success && res.data) {
            const confirmedOrderNum = res.data.order_number || randomOrderNum;
            const confirmedOrderId = res.data.id || confirmedOrderNum;

            // Register forward shipment in Shiprocket (/api/shipping/order/create)
            let shiprocketTrackingCode = null;
            try {
              const shiprocketPayload = buildShiprocketOrderPayload(
                confirmedOrderNum,
                confirmedOrderId,
                grandTotal,
                'cod',
                (showNewAddressForm || addresses.length === 0) ? addressPayload : selectedAddr,
                orderPayload.items
              );
              console.log('[Checkout] Registering COD order with Shiprocket (/api/shipping/order/create)...', shiprocketPayload);
              const shipRes = await shippingApi.createShipment(shiprocketPayload);
              console.log('[Checkout] Shiprocket forward shipment response:', shipRes);
              if (shipRes && (shipRes.shipment_id || shipRes.awb_code)) {
                shiprocketTrackingCode = shipRes.shipment_id || shipRes.awb_code;
              }
            } catch (srErr) {
              console.warn('[Checkout] Shiprocket forward shipment registration note (non-blocking):', srErr.message);
            }

            setIsConfirmOrderModalOpen(false);
            finalizeOrderSuccess(confirmedOrderNum, grandTotal, shiprocketTrackingCode);
            return;
          } else {
            throw new Error(res?.message || 'Failed to place order in database.');
          }
        } catch (err) {
          console.error('COD order creation failed:', err.message);
          setIsPlacingOrder(false);
          setIsConfirmOrderModalOpen(false);
          setPaymentErrorMessage(`Order creation failed: ${err.message || 'Please try again.'}`);
          return;
        }
      }

      // Case 2: Online / Card Payment via Razorpay
      let createdOrder = null;
      try {
        const createOrderRes = await apiClient('/api/orders', {
          method: 'POST',
          body: JSON.stringify(orderPayload)
        });
        if (createOrderRes && createOrderRes.success && createOrderRes.data) {
          createdOrder = createOrderRes.data;
        } else {
          throw new Error(createOrderRes?.message || 'Failed to initialize order on server.');
        }
      } catch (err) {
        console.error('Internal order creation failed:', err.message);
        setIsPlacingOrder(false);
        setIsConfirmOrderModalOpen(false);
        setPaymentErrorMessage(`Failed to initiate order: ${err.message || 'Please check your connection and try again.'}`);
        return;
      }

      const internalOrderId = createdOrder?.id || null;
      const orderNumber = createdOrder?.order_number || randomOrderNum;

      // Request Razorpay order from backend
      let rzpOrderData = null;
      try {
        const rzpRes = await apiClient('/api/payments/create-order', {
          method: 'POST',
          body: JSON.stringify({
            amount: grandTotal,
            currency: 'INR',
            receipt: orderNumber,
            orderId: internalOrderId
          })
        });
        if (rzpRes && rzpRes.success && rzpRes.data) {
          rzpOrderData = rzpRes.data;
        }
      } catch (err) {
        console.warn('Razorpay create-order backend warning:', err.message);
      }

      const rzpLoaded = await loadRazorpayScript();
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SIPp9QznVVM48W';

      if (!rzpLoaded || !window.Razorpay) {
        setIsPlacingOrder(false);
        setIsConfirmOrderModalOpen(false);
        const errMsg = 'Payment gateway could not be loaded. Please check your network or ad-blocker settings and try again.';
        setPaymentErrorMessage(errMsg);
        showToast(errMsg, 'error');
        return;
      }

      const rzpConfig = paymentMethod === 'card'
        ? {
            display: {
              blocks: {
                card_block: {
                  name: 'Pay with Credit or Debit Card',
                  instruments: [
                    {
                      method: 'card'
                    }
                  ]
                }
              },
              sequence: ['block.card_block'],
              preferences: {
                show_default_blocks: false
              },
              hide: [
                { method: 'upi' },
                { method: 'netbanking' },
                { method: 'wallet' },
                { method: 'paylater' },
                { method: 'emi' }
              ]
            }
          }
        : {
            display: {
              blocks: {
                upi_nb_block: {
                  name: 'Pay with UPI or Netbanking',
                  instruments: [
                    {
                      method: 'upi'
                    },
                    {
                      method: 'netbanking'
                    }
                  ]
                }
              },
              sequence: ['block.upi_nb_block'],
              preferences: {
                show_default_blocks: false
              },
              hide: [
                { method: 'card' },
                { method: 'wallet' },
                { method: 'paylater' },
                { method: 'emi' }
              ]
            }
          };

      const rzpOptions = {
        key: razorpayKey,
        amount: rzpOrderData?.amount || Math.round(grandTotal * 100),
        currency: rzpOrderData?.currency || 'INR',
        name: 'House of Urvaah',
        description: paymentMethod === 'card'
          ? (cardSurcharge > 0 ? `Credit / Debit Card Purchase (Incl. ₹${cardSurcharge} Card Fee)` : 'Credit / Debit Card Purchase')
          : 'UPI & Netbanking Purchase',
        image: (typeof window !== 'undefined' && window.location.hostname === 'localhost') ? undefined : `${window.location.origin}/assets/Images/Brown01.png`,
        order_id: (rzpOrderData?.id && !rzpOrderData.id.startsWith('order_rzp_test_')) ? rzpOrderData.id : undefined,
        prefill: {
          name: selectedAddr.name || user?.name || '',
          email: user?.email || '',
          contact: selectedAddr.phone || user?.phone || '',
          method: paymentMethod === 'card' ? 'card' : 'upi'
        },
        config: rzpConfig,
        theme: {
          color: '#111111'
        },
        handler: async function (response) {
          setIsConfirmOrderModalOpen(false);
          await verifyAndCompletePayment({
            razorpay_order_id: response.razorpay_order_id || rzpOrderData?.id || `order_${Date.now()}`,
            razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
            razorpay_signature: response.razorpay_signature || 'test_signature',
            order_id: internalOrderId,
            orderNumber,
            amountPaid: grandTotal,
            shippingAddress: (showNewAddressForm || addresses.length === 0) ? addressPayload : selectedAddr,
            orderItems: orderPayload.items
          });
        },
        modal: {
          ondismiss: function () {
            console.log('Razorpay modal dismissed by user.');
            setIsPlacingOrder(false);
            showToast('Payment window was closed. Your items remain saved in your bag.', 'info');
            if (internalOrderId) {
              apiClient('/api/payments/failure', {
                method: 'POST',
                body: JSON.stringify({
                  order_id: internalOrderId,
                  reason: 'Payment modal closed by user before completion'
                })
              }).catch(() => {});
            }
          }
        }
      };

      // Close confirmation modal right before opening Razorpay checkout window
      setIsConfirmOrderModalOpen(false);
      const razorpayModal = new window.Razorpay(rzpOptions);
      razorpayModal.on('payment.failed', async function (resp) {
        console.warn('Razorpay SDK payment.failed triggered:', resp.error);
        setIsPlacingOrder(false);
        const errMsg = resp.error?.description || resp.error?.reason || 'Payment failed or was declined. Please try again.';
        setPaymentErrorMessage(`Payment failed: ${errMsg}`);
        showToast(errMsg, 'error');

        if (internalOrderId) {
          apiClient('/api/payments/failure', {
            method: 'POST',
            body: JSON.stringify({
              order_id: internalOrderId,
              reason: errMsg,
              error_code: resp.error?.code || 'PAYMENT_FAILED',
              error_description: errMsg
            })
          }).catch(err => console.warn('[Checkout] Failed to record payment failure:', err.message));
        }
      });
      razorpayModal.open();

    } catch (err) {
      console.error('Error in executeOrderPlacement:', err);
      setIsPlacingOrder(false);
      setIsConfirmOrderModalOpen(false);
      setPaymentErrorMessage('Failed to initiate payment. Please check your connection and try again.');
    }
  };

  const hasOrderInSession = Boolean(
    orderPlaced ||
    placedOrderDetails ||
    orderParamFromUrl ||
    readCachedOrder(orderParamFromUrl || null)
  );

  if (authLoading || (!user && !hasOrderInSession)) {
    return (
      <div className="min-h-screen bg-white text-brand-dark pt-32 pb-20 flex flex-col items-center justify-center font-serif">
        <div className="w-8 h-8 border-2 border-brand-dark border-t-transparent animate-spin mb-4" />
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
          Loading Checkout Session...
        </p>
      </div>
    );
  }

  if (isFetchingOrder) {
    return (
      <div className="min-h-screen bg-white text-brand-dark pt-32 pb-20 flex flex-col items-center justify-center font-serif">
        <div className="w-8 h-8 border-2 border-brand-dark border-t-transparent animate-spin mb-4" />
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
          Loading Order Confirmation...
        </p>
      </div>
    );
  }

  if (orderFetchError && !orderPlaced) {
    return (
      <div className="min-h-screen bg-white text-brand-dark pt-28 sm:pt-32 pb-20 font-serif">
        <SEOHead title="Order Not Found | House of Urvaah" noindex={true} />
        <div className="max-w-md mx-auto px-4 text-center py-16">
          <AlertCircle className="w-12 h-12 stroke-[1] text-amber-600 mx-auto mb-4" />
          <h2 className="text-xl font-serif tracking-[0.15em] uppercase text-black mb-2">
            Order Not Found
          </h2>
          <p className="text-xs font-sans text-neutral-500 uppercase tracking-wider mb-6">
            We couldn't locate the details for this order. You can check your complete order history in your account.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/account?tab=VIEW ORDERS"
              className="inline-block bg-brand-dark text-white text-xs font-sans font-bold tracking-[0.25em] uppercase px-6 py-3.5 hover:bg-neutral-800 transition-colors"
            >
              VIEW MY ORDERS
            </Link>
            <Link
              to="/"
              className="inline-block border border-neutral-300 text-brand-dark text-xs font-sans font-bold tracking-[0.25em] uppercase px-6 py-3.5 hover:border-black transition-colors"
            >
              EXPLORE COLLECTION
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Order Success Screen View (Matching House of Urvaah Atelier Brand Theme)
  if (orderPlaced) {
    const details = placedOrderDetails || {
      orderNumber: placedOrderNumber || `HOU-${Math.floor(100000 + Math.random() * 900000)}`,
      trackingNumber: `TRK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      estimatedDelivery: 'Monday, October 12, 2026',
      items: [
        {
          id: 'item-1',
          name: 'CORSET DETAIL JACQUARD TOP',
          price: confirmedGrandTotal || 4999,
          quantity: 1,
          image: '/assets/Images/Blue01.png',
          selectedSize: 'M',
          product: { id: 'item-1', name: 'CORSET DETAIL JACQUARD TOP', price: confirmedGrandTotal || 4999, image: '/assets/Images/Blue01.png' }
        }
      ],
      subtotal: confirmedGrandTotal || 4999,
      tax: Math.round((confirmedGrandTotal || 4999) * 0.18),
      taxRate: 18,
      discount: 0,
      shippingFee: 0,
      totalPaid: (confirmedGrandTotal || 4999) + Math.round((confirmedGrandTotal || 4999) * 0.18),
      shippingAddress: {
        name: user?.name || 'Customer Name',
        street: 'Shipping Address Detail',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'INDIA'
      },
      paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'UPI / Online Payment',
      customerEmail: user?.email || '',
      customerPhone: user?.phone || '',
      status: 'Pending'
    };

    const currentStatusStr = (details.status || 'Confirmed').toLowerCase();
    const logLower = (details.logistics_status || details.logisticsStatus || details.shipment_status || details.shipmentStatus || '').toLowerCase();

    // Distinguish Forward Replacement Order from the Original Order's Reverse/Replacement Request
    const isReplacementForwardOrder = String(details.orderNumber || '').endsWith('-REP') || Boolean(details.original_order_number);

    const returnTypeStr = (details.return_type || details.returnType || '').toLowerCase();
    const returnReasonStr = (details.return_reason || details.returnReason || '').toLowerCase();

    // Is this parent order in an exchange/replacement intent?
    const isReplacementIntent = !isReplacementForwardOrder && Boolean(
      returnTypeStr.includes('replace') ||
      returnTypeStr.includes('exchange') ||
      currentStatusStr.includes('replace') ||
      Boolean(details.replacement_order_number) ||
      Boolean(details.replacement_order_id) ||
      Boolean(details.replacement_size && !details.refund_bank_account) ||
      returnReasonStr.includes('replace') ||
      returnReasonStr.includes('exchange')
    );

    // Mixed Return & Replacement (Simultaneous Items)
    const isMixedReturnReplace = !isReplacementForwardOrder && Boolean(
      returnTypeStr.includes('mixed') ||
      currentStatusStr.includes('& replacement') ||
      currentStatusStr.includes('returned & replaced') ||
      (
        Array.isArray(details.items) &&
        details.items.some(it => (it.return_action || '').toLowerCase() === 'return' || (it.status || '').toLowerCase().includes('return')) &&
        details.items.some(it => (it.return_action || '').toLowerCase() === 'replace' || (it.status || '').toLowerCase().includes('replace'))
      )
    );

    const mixedRefundAmount = parseFloat(details.refund_eligible_amount || details.refund_amount || 0) || (
      Array.isArray(details.items)
        ? details.items.filter(it => (it.return_action || '').toLowerCase() === 'return' || (it.status || '').toLowerCase().includes('return'))
            .reduce((sum, it) => sum + (parseFloat(it.price || 0) * (parseInt(it.quantity, 10) || 1)), 0)
        : 0
    );

    const mixedReplacementSize = details.replacement_size || (
      Array.isArray(details.items)
        ? (details.items.find(it => (it.return_action || '').toLowerCase() === 'replace' || (it.status || '').toLowerCase().includes('replace'))?.replacement_size)
        : null
    );

    // Financial Settlement & Refund Status
    const isRefundCompleted = (details.refund_status && ['completed', 'refunded', 'success'].includes(String(details.refund_status).toLowerCase())) || 
      currentStatusStr === 'refunded' || 
      ((details.payment_status || details.paymentStatus || '').toLowerCase() === 'refunded');

    const isExplicitReturn = !isReplacementForwardOrder && !isReplacementIntent && !isMixedReturnReplace && (
      returnTypeStr === 'return' || 
      currentStatusStr.includes('return') || 
      currentStatusStr.includes('received at house of urvaah') ||
      currentStatusStr.includes('received at urvaah house') ||
      currentStatusStr.includes('received at homved') ||
      Boolean(details.is_returned_order) ||
      Boolean(details.return_reason || details.returnReason)
    );

    // 1. Return Flow States (Post-Delivery only, Mutually exclusive from Replacement and Forward orders)
    const isReturned = !isReplacementForwardOrder && !isReplacementIntent && !isMixedReturnReplace && (
      currentStatusStr === 'returned' || 
      currentStatusStr === 'return completed' ||
      currentStatusStr === 'refunded' ||
      isRefundCompleted
    );
    const isReceivedAtUrvaah = !isReplacementForwardOrder && !isReplacementIntent && !isMixedReturnReplace && !isReturned && (
      currentStatusStr === 'received at house of urvaah' || 
      currentStatusStr === 'received at urvaah house' || 
      currentStatusStr === 'received at homved' || 
      logLower.includes('received at house of urvaah')
    );
    const isReturnCollected = !isReplacementForwardOrder && !isReplacementIntent && !isMixedReturnReplace && !isReturned && !isReceivedAtUrvaah && (
      currentStatusStr.includes('collected') || 
      currentStatusStr.includes('in transit to') || 
      currentStatusStr.includes('reverse transit') || 
      logLower.includes('collected') || 
      logLower.includes('reverse transit')
    );
    const isReturnQcRejected = !isReplacementForwardOrder && !isReplacementIntent && (
      currentStatusStr === 'return qc rejected' ||
      (details.return_qc_status || details.returnQcStatus || '').toLowerCase() === 'rejected'
    );
    const isReturnRejected = !isReplacementForwardOrder && !isReplacementIntent && (
      currentStatusStr === 'return rejected' ||
      isReturnQcRejected ||
      (currentStatusStr === 'delivered' && (
        Boolean(details.return_rejection_reason) ||
        Boolean(details.rejection_reason)
      ) && !(
        (details.return_type || '').toLowerCase().includes('replace') ||
        Boolean(details.replacement_size) ||
        (details.return_rejection_reason || '').toLowerCase().includes('replace')
      )) ||
      Boolean(details.return_rejection_reason)
    );
    const isReturnApproved = !isReplacementForwardOrder && !isReplacementIntent && !isMixedReturnReplace && !isReturned && !isReceivedAtUrvaah && !isReturnCollected && !isReturnRejected && (
      currentStatusStr === 'return approved' || 
      currentStatusStr === 'return pickup scheduled' || 
      (currentStatusStr.includes('pickup scheduled') && (currentStatusStr.includes('return') || logLower.includes('return'))) || 
      logLower.includes('return pickup scheduled')
    );
    const isReturnRequested = !isReplacementForwardOrder && !isReplacementIntent && !isMixedReturnReplace && !isReturned && !isReceivedAtUrvaah && !isReturnCollected && !isReturnApproved && !isReturnRejected && (
      currentStatusStr === 'return requested' || 
      currentStatusStr === 'return request processing' || 
      logLower === 'return initiated' || 
      logLower === 'return requested' ||
      (isExplicitReturn && !currentStatusStr.includes('delivered'))
    );
    const isInReturnFlow = !isReplacementForwardOrder && !isReturnRejected && (isReturnRequested || isReturnApproved || isReturnCollected || isReceivedAtUrvaah || isReturned);
    const returnAwb = details.tracking_number || details.trackingNumber || details.awb_code;
    const returnCourier = details.courier_name || 'Delhivery Reverse Logistics (Doorstep QC)';

    // 2. Replacement Flow States (For the original parent order)
    const isReplacementRequested = isReplacementIntent && (currentStatusStr === 'replacement request processing' || currentStatusStr === 'replace requested' || currentStatusStr === 'replacement requested');
    const isReplacementApproved = isReplacementIntent && (currentStatusStr === 'replace approved' || currentStatusStr === 'replacement approved' || currentStatusStr.includes('pickup scheduled'));
    const isReplacementCollected = isReplacementIntent && (currentStatusStr.includes('collected') || currentStatusStr.includes('in transit to') || currentStatusStr.includes('reverse transit') || logLower.includes('collected') || logLower.includes('reverse transit'));
    const isReplacementQCReceived = isReplacementIntent && (currentStatusStr.includes('received at') || logLower.includes('received at') || logLower.includes('qc passed'));
    const isReplacementInTransit = isReplacementCollected || (isReplacementIntent && (currentStatusStr === 'replacement processing' || currentStatusStr === 'replacement shipped' || currentStatusStr === 'in reverse transit'));
    const isReplacementOutForDelivery = isReplacementIntent && (currentStatusStr === 'replacement out for delivery');
    const isReplaced = isReplacementIntent && (currentStatusStr === 'replaced' || Boolean(details.replacement_order_number));
    const isReplacementRejected = isReplacementIntent && (currentStatusStr === 'replace rejected');
    const isInReplacementFlow = isReplacementIntent;

    // 3. Pre-Delivery Cancellation States (Customer requested vs Admin approved/rejected)
    const isCancellationRequested = !isInReturnFlow && !isInReplacementFlow && (currentStatusStr === 'cancellation requested' || currentStatusStr === 'cancel_requested');
    const isCancellationRejected = !isInReturnFlow && !isInReplacementFlow && !isCancellationRequested && (
      currentStatusStr === 'cancellation rejected' ||
      Boolean(
        (details.rejection_reason || details.rejectionReason) && (
          (details.rejection_reason || details.rejectionReason).toLowerCase().includes('cancel') ||
          (details.rejection_reason || details.rejectionReason).toLowerCase().includes('rejected by admin') ||
          (details.rejection_reason || details.rejectionReason).toLowerCase().includes('cancellation request rejected')
        )
      ) ||
      Boolean(
        (details.cancel_reason || details.cancelReason) && (
          (details.cancel_reason || details.cancelReason).toLowerCase().includes('rejected by admin') ||
          (details.cancel_reason || details.cancelReason).toLowerCase().includes('cancellation request rejected')
        )
      )
    );
    const isOrderCancelled = !isInReturnFlow && !isInReplacementFlow && !isCancellationRequested && !isCancellationRejected && (orderCancelled || currentStatusStr === 'cancelled' || currentStatusStr === 'canceled');

    // 5. Delivery and Forward Logistics States
    const isProductEverDelivered = Boolean(details.delivered_at || details.deliveredAt) || 
      (details.original_status || details.originalStatus || '').toLowerCase() === 'delivered' || 
      Boolean(details.is_product_received || details.isProductReceived) ||
      isInReturnFlow ||
      isInReplacementFlow;

    const isDelivered = !isOrderCancelled && !isCancellationRequested && !isInReturnFlow && !isInReplacementFlow && (currentStatusStr.includes('delivered') || currentStatusStr.includes('completed'));
    const isReplacementDelivered = isReplacementForwardOrder && !isOrderCancelled && !isCancellationRequested && (currentStatusStr.includes('delivered') || currentStatusStr.includes('completed') || Boolean(details.delivered_at || details.deliveredAt));
    const isInvoiceEligible = isDelivered || isReplacementDelivered;
    const isOutForDelivery = !isOrderCancelled && !isCancellationRequested && !isInReturnFlow && !isInReplacementFlow && (isDelivered || currentStatusStr.includes('out') || currentStatusStr.includes('delivery'));
    const isShipped = !isOrderCancelled && !isCancellationRequested && !isInReturnFlow && !isInReplacementFlow && (isOutForDelivery || currentStatusStr.includes('shipped') || currentStatusStr.includes('transit') || currentStatusStr.includes('dispatched'));

    // 24-hour shipping address editing rule
    const rawOrderTime = details.createdAt || details.placedAt || details.created_at;
    const orderCreatedMs = rawOrderTime ? new Date(rawOrderTime).getTime() : Date.now();
    const diffHours = (Date.now() - orderCreatedMs) / (1000 * 60 * 60);
    const isWithin24Hours = diffHours <= 24;
    const hoursRemaining = Math.max(1, Math.ceil(24 - diffHours));

    const isAddressLockedStatus = isShipped || isOutForDelivery || isDelivered || isOrderCancelled || isCancellationRequested || isInReturnFlow || isInReplacementFlow;
    const canEditAddress = isWithin24Hours && !isAddressLockedStatus;

    const handleReorder = async () => {
      if (isReordering) return;
      if (!details || !details.items || !Array.isArray(details.items) || details.items.length === 0) {
        showToast('No items found in this order to reorder.', 'error');
        return;
      }

      setIsReordering(true);
      try {
        const targetKeys = [];

        for (let i = 0; i < details.items.length; i++) {
          const item = details.items[i];
          const rawId = item.product?.id || item.id || item.productId || '1';
          const sizeToUse = item.selectedSize || item.size || 'M';
          const qtyToUse = Math.max(1, Number(item.quantity || 1));

          const prodObj = {
            ...(item.product || {}),
            id: String(rawId),
            name: item.product?.name || item.name || item.title || 'Atelier Piece',
            title: item.product?.title || item.name || 'Atelier Piece',
            price: Number(item.product?.price || item.price || 0),
            image: item.product?.image || item.image || '/assets/Images/Brown01.png',
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

        // Clear cached order data so customer exits the success screen and enters fresh active checkout
        sessionStorage.removeItem(ORDER_SESSION_KEY);
        sessionStorage.removeItem('hou_last_order_num');
        sessionStorage.removeItem('hou_last_order_data');

        setOrderPlaced(false);
        setPlacedOrderDetails(null);
        setPlacedOrderNumber('');
        setConfirmedGrandTotal(0);

        navigate('/checkout', { replace: true, state: {} });
      } catch (err) {
        console.error('Reorder error:', err);
        showToast('Failed to reorder items. Please try again.', 'error');
      } finally {
        setIsReordering(false);
      }
    };

    const handleDownloadInvoice = () => {
      setIsInvoiceModalOpen(true);
    };

    const handleReturnOrder = async () => {
      if (isCancellingOrder) return;

      const { value: formValues } = await Swal.fire({
        title: 'Return Order (Post-Delivery)',
        heightAuto: false,
        scrollbarPadding: false,
        willOpen: () => {
          document.documentElement.style.overflow = 'hidden';
          document.body.style.overflow = 'hidden';
          document.body.setAttribute('data-modal-open', 'true');
        },
        didClose: () => {
          document.documentElement.style.overflow = '';
          document.body.style.overflow = '';
          document.body.removeAttribute('data-modal-open');
        },
        html: `
          <div class="text-left font-sans space-y-3">
            <p class="text-xs text-neutral-600">Select a reason for returning your delivered atelier piece:</p>
            <select id="swal-return-reason" class="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-sans text-neutral-800 focus:outline-none">
              <option value="Size or fit issue">Size or fit issue</option>
              <option value="Defective or damaged piece received">Defective or damaged piece received</option>
              <option value="Quality or fabric not as expected">Quality or fabric not as expected</option>
              <option value="Received incorrect item or color">Received incorrect item or color</option>
              <option value="Did not match online images">Did not match online images</option>
              <option value="Changed my mind">Changed my mind</option>
              <option value="Other">Other</option>
            </select>
            <textarea id="swal-return-comment" placeholder="Optional comments / notes..." class="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-sans text-neutral-800 resize-none h-20 focus:outline-none"></textarea>
            <div class="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-[11px] text-indigo-900 leading-relaxed">
              Once submitted, your return request will be reviewed by admin. Upon approval, reverse pickup will be scheduled back to House of Urvaah, followed by full refund processing at our Refund Desk.
            </div>
          </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonColor: '#171717',
        cancelButtonColor: '#737373',
        confirmButtonText: 'Submit Return Request',
        cancelButtonText: 'Keep Piece',
        reverseButtons: true,
        background: '#ffffff',
        customClass: {
          popup: 'rounded-2xl shadow-2xl border border-neutral-200 font-sans',
          title: 'font-serif font-bold text-xl uppercase tracking-wider text-neutral-900',
          confirmButton: 'rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer',
          cancelButton: 'rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer'
        },
        preConfirm: () => {
          const reason = document.getElementById('swal-return-reason')?.value || 'Return requested by customer';
          const comments = document.getElementById('swal-return-comment')?.value || '';
          return { reason, comments };
        }
      });

      if (formValues) {
        setIsCancellingOrder(true);
        const orderNum = details?.orderNumber || placedOrderNumber;
        if (orderNum) {
          try {
            await apiClient(`/api/orders/${orderNum}/return`, {
              method: 'POST',
              body: JSON.stringify({
                cancelReason: formValues.reason,
                comments: formValues.comments
              })
            });
            setPlacedOrderDetails((prev) => {
              const next = {
                ...prev,
                status: 'Return Requested',
                cancel_reason: formValues.reason,
                return_reason: formValues.reason
              };
              try {
                sessionStorage.setItem(ORDER_SESSION_KEY, JSON.stringify(next));
              } catch (e) {}
              return next;
            });

            // Dynamically broadcast to admin panel and across all browser tabs
            broadcastOrderUpdate({
              orderNumber: orderNum,
              order_number: orderNum,
              status: 'Return Requested',
              cancel_reason: formValues.reason,
              return_reason: formValues.reason
            });
            await Swal.fire({
              title: 'Return Request Submitted',
              text: 'Your return request has been submitted to House of Urvaah admin for review.',
              icon: 'success',
              confirmButtonColor: '#171717',
              confirmButtonText: 'OK',
              background: '#ffffff',
              customClass: {
                popup: 'rounded-2xl shadow-2xl border border-neutral-200 font-sans',
                title: 'font-serif font-bold text-xl uppercase tracking-wider text-neutral-900',
                htmlContainer: 'text-sm text-neutral-600',
                confirmButton: 'rounded-xl px-6 py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer'
              }
            });
          } catch (e) {
            console.warn('Return order error:', e.message);
            await Swal.fire({
              title: 'Submission Failed',
              text: e.message || 'Could not submit return request. Please try again.',
              icon: 'error',
              confirmButtonColor: '#171717',
              confirmButtonText: 'OK'
            });
          } finally {
            setIsCancellingOrder(false);
          }
        }
      }
    };

    const handleReplaceOrder = async () => {
      if (isCancellingOrder) return;

      const { value: formValues } = await Swal.fire({
        title: 'Request Product Replacement',
        heightAuto: false,
        scrollbarPadding: false,
        willOpen: () => {
          document.documentElement.style.overflow = 'hidden';
          document.body.style.overflow = 'hidden';
          document.body.setAttribute('data-modal-open', 'true');
        },
        didClose: () => {
          document.documentElement.style.overflow = '';
          document.body.style.overflow = '';
          document.body.removeAttribute('data-modal-open');
        },
        html: `
          <div class="text-left font-sans space-y-3">
            <p class="text-xs text-neutral-600">Select a reason and your preferred replacement size:</p>
            <div>
              <label class="block text-[11px] font-bold text-neutral-700 uppercase mb-1">Reason for Exchange</label>
              <select id="swal-replace-reason" class="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-sans text-neutral-800 focus:outline-none">
                <option value="Size or fit issue - need different size">Size or fit issue - need different size</option>
                <option value="Defective or damaged piece received">Defective or damaged piece received</option>
                <option value="Color or variant exchange">Color or variant exchange</option>
                <option value="Fabric or styling not as expected">Fabric or styling not as expected</option>
                <option value="Wrong piece delivered">Wrong piece delivered</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-neutral-700 uppercase mb-1">Preferred Replacement Size</label>
              <select id="swal-replace-size" class="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-sans text-neutral-800 focus:outline-none">
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M" selected>M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
              </select>
            </div>
            <textarea id="swal-replace-comment" placeholder="Optional notes for atelier concierge..." class="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-sans text-neutral-800 resize-none h-16 focus:outline-none"></textarea>
            <div class="p-3 bg-purple-50 border border-purple-100 rounded-lg text-[11px] text-purple-900 leading-relaxed">
              Complimentary reverse pickup will be scheduled from your delivery address. Once reviewed, your replacement piece will be dispatched with priority delivery.
            </div>
          </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonColor: '#171717',
        cancelButtonColor: '#737373',
        confirmButtonText: 'Submit Replacement Request',
        cancelButtonText: 'Keep Piece',
        reverseButtons: true,
        background: '#ffffff',
        customClass: {
          popup: 'rounded-2xl shadow-2xl border border-neutral-200 font-sans',
          title: 'font-serif font-bold text-xl uppercase tracking-wider text-neutral-900',
          confirmButton: 'rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer',
          cancelButton: 'rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer'
        },
        preConfirm: () => {
          const reason = document.getElementById('swal-replace-reason')?.value || 'Size or fit issue - need different size';
          const size = document.getElementById('swal-replace-size')?.value || 'M';
          const comments = document.getElementById('swal-replace-comment')?.value || '';
          return { reason, size, comments };
        }
      });

      if (formValues) {
        setIsCancellingOrder(true);
        const orderNum = details?.orderNumber || placedOrderNumber;
        const fullReason = `Replacement: ${formValues.reason} (Preferred Size: ${formValues.size})${formValues.comments ? ` - Notes: ${formValues.comments}` : ''}`;
        if (orderNum) {
          try {
            await apiClient(`/api/orders/${orderNum}/replace`, {
              method: 'POST',
              body: JSON.stringify({
                type: 'Replacement',
                cancelReason: fullReason,
                reason: fullReason,
                replacementSize: formValues.size,
                comments: formValues.comments
              })
            });
            setPlacedOrderDetails((prev) => ({
              ...prev,
              status: 'Replacement Request Processing',
              cancel_reason: fullReason,
              return_type: 'Replacement'
            }));

            // Dynamically broadcast to admin panel and across all browser tabs
            broadcastOrderUpdate({
              orderNumber: orderNum,
              order_number: orderNum,
              status: 'Replacement Request Processing',
              cancel_reason: fullReason
            });

            await Swal.fire({
              title: 'Replacement Request Submitted',
              text: 'Your exchange request has been submitted to House of Urvaah atelier team for verification.',
              icon: 'success',
              confirmButtonColor: '#171717',
              confirmButtonText: 'OK',
              background: '#ffffff'
            });
          } catch (e) {
            console.warn('Replacement order error:', e.message);
            await Swal.fire({
              title: 'Submission Failed',
              text: e.message || 'Could not submit replacement request. Please try again.',
              icon: 'error',
              confirmButtonColor: '#171717',
              confirmButtonText: 'OK'
            });
          } finally {
            setIsCancellingOrder(false);
          }
        }
      }
    };

    const handleOpenReturnReplaceChoice = () => {
      const currentItems = details?.items || placedOrderDetails?.items || [];
      const initialMap = {};
      const initialStocks = {};

      // If 1 item: default to Return
      // If 2 or 3 items: default to Keep, customer picks which one to return or replace!
      const defaultAction = currentItems.length <= 1 ? 'Return' : 'Keep';

      currentItems.forEach((item, idx) => {
        const key = item.id || item.product_id || idx;
        const sStock = item.size_stock || item.sizeStock || {};
        initialStocks[key] = {
          size_stock: sStock,
          sizes: item.sizes || (sStock && Object.keys(sStock).length > 0 ? Object.keys(sStock) : null)
        };

        let initialRepSize = item.size || 'M';
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
              console.warn('[Checkout] Live stock fetch error:', err?.message);
            });
        }
      });

      setProductSizeStocks(initialStocks);
      setItemActionsState(initialMap);
      setItemReturnError('');
      setReturnComments('');
      const savedBank = getSavedBank(details || placedOrderDetails);
      setReturnBankDetails(savedBank);
      setSavedBankDetailsSnapshot(savedBank);
      setIsEditingReturnBank(!savedBank.accountNumber);
      setIsItemReturnModalOpen(true);
    };

    const handleConfirmItemReturn = async (e) => {
      if (e) e.preventDefault();
      const currentItems = details?.items || placedOrderDetails?.items || [];
      const isOrderCod = (details?.paymentMethod || details?.payment_method || '').toLowerCase().includes('cash') || (details?.paymentMethod || details?.payment_method || '').toLowerCase().includes('cod');

      // Verify at least one item is marked for Return or Replace
      const nonKeepItems = currentItems.filter(it => {
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
        const orderNum = details?.id || details?.orderNumber || placedOrderNumber;
        const reqType = (hasReturnItem && nonKeepItems.some(it => {
          const key = it.id || it.product_id;
          const st = itemActionsState[key] || itemActionsState[it.id] || itemActionsState[it.product_id];
          return st?.action === 'Replace';
        }))
          ? 'Partial Return & Exchange'
          : hasReturnItem ? 'Return' : 'Replacement';

        const formattedItems = currentItems.map(it => {
          const key = it.id || it.product_id;
          const st = itemActionsState[key] || itemActionsState[it.id] || itemActionsState[it.product_id] || { action: 'Keep' };
          return {
            id: it.id || it.product_id,
            product_id: it.product_id,
            action: st.action,
            reason: st.reason,
            replacementSize: st.replacementSize,
            quantity: it.quantity || 1
          };
        });

        const res = await apiClient(`/api/orders/${orderNum}/return-request`, {
          method: 'POST',
          body: JSON.stringify({
            type: reqType,
            items: formattedItems,
            bankDetails: hasReturnItem ? returnBankDetails : null,
            comments: returnComments,
            reason: returnComments || (reqType === 'Return' ? 'Customer return request' : reqType === 'Replacement' ? 'Customer exchange request' : 'Customer return / exchange request')
          })
        });

        const updatedOrder = res?.data || {};
        const targetStatus = updatedOrder.status || 'Return Request Processing';

        setPlacedOrderDetails((prev) => {
          const next = {
            ...prev,
            status: targetStatus,
            return_type: updatedOrder.return_type || 'Return',
            return_reason: updatedOrder.return_reason || returnComments,
            items: updatedOrder.items || prev?.items
          };
          try {
            sessionStorage.setItem(ORDER_SESSION_KEY, JSON.stringify(next));
          } catch (e) {}
          return next;
        });

        if (hasReturnItem && returnBankDetails?.accountNumber) {
          persistSavedBank(returnBankDetails);
        }

        broadcastOrderUpdate({
          orderNumber: orderNum,
          order_number: orderNum,
          status: targetStatus,
          return_type: updatedOrder.return_type,
          return_reason: updatedOrder.return_reason
        });

        setIsItemReturnModalOpen(false);

        // Count scenarios to display personalized Haute Couture message
        const returnCount = nonKeepItems.filter(it => (itemActionsState[it.id || it.product_id]?.action === 'Return')).length;
        const replaceCount = nonKeepItems.filter(it => (itemActionsState[it.id || it.product_id]?.action === 'Replace')).length;
        const keepCount = currentItems.length - nonKeepItems.length;

        let summaryText = '';
        if (returnCount > 0 && replaceCount > 0) {
          summaryText = `Your request has been submitted: ${returnCount} item(s) for return & refund, ${replaceCount} item(s) for exchange, and ${keepCount} item(s) retained. Complimentary reverse pickup will be arranged.`;
        } else if (returnCount > 0) {
          summaryText = `Your return request for ${returnCount} item(s) has been submitted. Reverse pickup will be scheduled and your refund will be disbursed upon inspection. ${keepCount > 0 ? `(${keepCount} item(s) retained by you).` : ''}`;
        } else {
          summaryText = `Your replacement request for ${replaceCount} item(s) has been submitted. Reverse pickup will be arranged and your new size will be dispatched with priority delivery.`;
        }

        await Swal.fire({
          title: 'Request Submitted Successfully',
          text: summaryText,
          icon: 'success',
          confirmButtonColor: '#171717',
          confirmButtonText: 'OK',
          background: '#ffffff',
          customClass: {
            popup: 'rounded-2xl shadow-2xl border border-neutral-200 font-sans',
            title: 'font-serif font-bold text-xl uppercase tracking-wider text-neutral-900',
            htmlContainer: 'text-sm text-neutral-600',
            confirmButton: 'rounded-xl px-6 py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer'
          }
        });
      } catch (err) {
        console.error('Item return request error:', err);
        setItemReturnError(err.message || 'Failed to submit request. Please try again.');
      } finally {
        setIsSubmittingItemReturn(false);
      }
    };

    const isCodOrder = (details?.paymentMethod || details?.payment_method || details?.paymentType || details?.payment_type || '').toLowerCase().includes('cash') || (details?.paymentMethod || details?.payment_method || details?.paymentType || details?.payment_type || '').toLowerCase().includes('cod');
    const isPaidOrder = (details?.paymentStatus || details?.payment_status || '').toLowerCase() === 'paid' || Boolean(details?.razorpay_payment_id);
    const isPrepaidOrder = !isCodOrder || isPaidOrder || ['upi', 'card', 'online', 'prepaid'].some(m =>
      (details?.paymentMethod || details?.payment_method || '').toLowerCase().includes(m) ||
      (details?.paymentType || details?.payment_type || '').toLowerCase().includes(m)
    );
    const requiresBankDetails = isDelivered || isPrepaidOrder;

    const handleCancelOrder = () => {
      setCancelOrderReason(isDelivered ? 'Size or fit issue' : 'Ordered by mistake');
      setCancelOrderComments('');
      setCancelOrderError('');
      const savedBank = getSavedBank(details || placedOrderDetails);
      setCancelBankDetails(savedBank);
      const hasValidSavedBank = Boolean(
        savedBank.accountNumber &&
        /^\d{9,18}$/.test(String(savedBank.accountNumber).trim()) &&
        /^[A-Z]{4}0[A-Z0-9]{6}$/.test(String(savedBank.ifscCode || '').trim().toUpperCase()) &&
        String(savedBank.holderName || '').trim().length >= 3
      );
      setIsEditingCancelBank(!hasValidSavedBank);
      setIsCancelOrderModalOpen(true);
    };

    const handleConfirmCancellation = async (e) => {
      if (e) e.preventDefault();
      if (!cancelOrderReason) {
        setCancelOrderError('Please select a reason for cancellation.');
        return;
      }

      if (requiresBankDetails) {
        const cleanHolder = (cancelBankDetails.holderName || '').trim();
        const cleanIfsc = (cancelBankDetails.ifscCode || '').trim().toUpperCase();
        const cleanAccount = (cancelBankDetails.accountNumber || '').trim();
        const cleanConfirm = (cancelBankDetails.confirmAccountNumber || '').trim();

        if (!cleanHolder) {
          setCancelOrderError('Please enter the Account Holder Name for your refund disbursement.');
          setIsEditingCancelBank(true);
          return;
        }
        if (cleanHolder.length < 3 || !/^[a-zA-Z\s.]{3,70}$/.test(cleanHolder)) {
          setCancelOrderError('Account Holder Name must be at least 3 characters and contain only letters.');
          setIsEditingCancelBank(true);
          return;
        }

        if (!cleanIfsc) {
          setCancelOrderError('Please enter your Bank IFSC Code for refund transfer.');
          setIsEditingCancelBank(true);
          return;
        }
        if (cleanIfsc.length !== 11) {
          setCancelOrderError(`Bank IFSC Code must be exactly 11 characters (currently ${cleanIfsc.length} characters). Example: HDFC0008718.`);
          setIsEditingCancelBank(true);
          return;
        }
        if (cleanIfsc[4] !== '0') {
          setCancelOrderError('Invalid IFSC Code: The 5th character must be the digit 0 (zero), not the letter O.');
          setIsEditingCancelBank(true);
          return;
        }
        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
          setCancelOrderError('Invalid Bank IFSC Code format. Must be 4 letters, followed by 0, followed by 6 alphanumeric characters (e.g. HDFC0008718).');
          setIsEditingCancelBank(true);
          return;
        }

        if (!cleanAccount) {
          setCancelOrderError('Please enter your Bank Account Number for refund payout.');
          setIsEditingCancelBank(true);
          return;
        }
        if (!/^\d+$/.test(cleanAccount)) {
          setCancelOrderError('Bank Account Number must contain numbers only.');
          setIsEditingCancelBank(true);
          return;
        }
        if (cleanAccount.length < 9 || cleanAccount.length > 18) {
          setCancelOrderError(`Bank Account Number must be between 9 and 18 digits (currently ${cleanAccount.length} digits).`);
          setIsEditingCancelBank(true);
          return;
        }

        if (!cleanConfirm) {
          setCancelOrderError('Please confirm your Bank Account Number.');
          setIsEditingCancelBank(true);
          return;
        }
        if (cleanAccount !== cleanConfirm) {
          setCancelOrderError('Bank Account Numbers do not match. Please verify and re-enter.');
          setIsEditingCancelBank(true);
          return;
        }

        // Persist bank details permanently
        persistSavedBank({
          accountNumber: cleanAccount,
          ifscCode: cleanIfsc,
          holderName: cleanHolder
        });
      }

      setIsCancellingOrder(true);
      setCancelOrderError('');

      const finalReason = cancelOrderComments.trim()
        ? `${cancelOrderReason} - ${cancelOrderComments.trim()}`
        : cancelOrderReason;

      const orderNum = details?.orderNumber || placedOrderNumber;
      if (orderNum) {
        try {
          const res = await apiClient(`/api/orders/${orderNum}/cancel`, {
            method: 'POST',
            body: JSON.stringify({
              cancelReason: finalReason,
              bankDetails: requiresBankDetails ? {
                accountNumber: cancelBankDetails.accountNumber.trim(),
                ifscCode: cancelBankDetails.ifscCode.trim().toUpperCase(),
                holderName: cancelBankDetails.holderName.trim()
              } : null
            })
          });
          const targetStatus = res?.data?.status || 'Cancellation Requested';
          setPlacedOrderDetails((prev) => ({
            ...prev,
            status: targetStatus,
            cancel_reason: finalReason,
            refund_bank_account: requiresBankDetails ? cancelBankDetails.accountNumber.trim() : prev?.refund_bank_account,
            refund_ifsc_code: requiresBankDetails ? cancelBankDetails.ifscCode.trim().toUpperCase() : prev?.refund_ifsc_code,
            refund_holder_name: requiresBankDetails ? cancelBankDetails.holderName.trim() : prev?.refund_holder_name
          }));
          if (targetStatus === 'Cancelled') {
            setOrderCancelled(true);
          }
          setIsCancelOrderModalOpen(false);

          // Dynamically broadcast to admin panel and across all browser tabs
          broadcastOrderUpdate({
            orderNumber: orderNum,
            order_number: orderNum,
            status: targetStatus,
            cancel_reason: finalReason,
            refund_bank_account: requiresBankDetails ? cancelBankDetails.accountNumber.trim() : details?.refund_bank_account,
            refund_ifsc_code: requiresBankDetails ? cancelBankDetails.ifscCode.trim().toUpperCase() : details?.refund_ifsc_code,
            refund_holder_name: requiresBankDetails ? cancelBankDetails.holderName.trim() : details?.refund_holder_name
          });

          setToast({
            type: 'success',
            title: 'Cancellation Submitted',
            message: requiresBankDetails
              ? 'Your cancellation request has been submitted with your refund bank details.'
              : 'Your cancellation request has been submitted to our atelier team.'
          });
        } catch (err) {
          console.warn('Cancel order API fallback:', err.message);
          setPlacedOrderDetails((prev) => ({
            ...prev,
            status: 'Cancellation Requested',
            cancel_reason: finalReason
          }));
          setIsCancelOrderModalOpen(false);
          setToast({
            type: 'success',
            title: 'Cancellation Submitted',
            message: 'Your cancellation request has been recorded.'
          });
        } finally {
          setIsCancellingOrder(false);
        }
      }
    };

    const handleOpenEditAddress = () => {
      hasAutoOpenedAddressEditRef.current = false;
      const currentAddr = details?.shippingAddress || {};
      setAddressEditForm({
        name: currentAddr.name || details?.customerName || user?.name || '',
        phone: details?.customerPhone || currentAddr.phone || user?.phone || '',
        street: currentAddr.street || '',
        city: currentAddr.city || '',
        state: currentAddr.state || '',
        pincode: currentAddr.pincode || ''
      });
      setAddressEditError('');
      setIsEditAddressModalOpen(true);
    };

    const handleSaveShippingAddress = async (e) => {
      e.preventDefault();
      setAddressEditError('');

      const name = (addressEditForm.name || '').trim();
      const phone = (addressEditForm.phone || '').trim();
      const street = (addressEditForm.street || '').trim();
      const city = (addressEditForm.city || '').trim();
      const state = (addressEditForm.state || '').trim();
      const pincode = (addressEditForm.pincode || '').trim();

      if (!name) {
        setAddressEditError('Please enter recipient full name');
        return;
      }
      const digitsOnlyPhone = phone.replace(/\D/g, '');
      if (digitsOnlyPhone.length < 10) {
        setAddressEditError('Please enter a valid 10-digit mobile number');
        return;
      }
      if (!street) {
        setAddressEditError('Please enter flat, street or building details');
        return;
      }
      if (!city) {
        setAddressEditError('Please enter city');
        return;
      }
      if (!state) {
        setAddressEditError('Please select or enter state');
        return;
      }
      const digitsOnlyPin = pincode.replace(/\D/g, '');
      if (digitsOnlyPin.length !== 6) {
        setAddressEditError('Please enter a valid 6-digit PIN code');
        return;
      }

      setIsSavingAddress(true);
      try {
        const targetOrderId = details.id || details.orderNumber;
        const res = await apiClient(`/api/orders/${targetOrderId}/address`, {
          method: 'PUT',
          body: JSON.stringify({
            name,
            phone,
            street,
            city,
            state,
            pincode
          })
        });

        if (res.success) {
          const updatedAddr = {
            name,
            street,
            city,
            state,
            pincode,
            country: 'INDIA'
          };

          setPlacedOrderDetails((prev) => {
            if (!prev) return prev;
            const next = {
              ...prev,
              customerPhone: phone,
              shippingAddress: updatedAddr
            };
            try {
              sessionStorage.setItem(ORDER_SESSION_KEY, JSON.stringify(next));
            } catch (err) {}
            return next;
          });

          broadcastOrderUpdate({
            orderId: targetOrderId,
            orderNumber: details.orderNumber,
            shippingAddress: updatedAddr,
            customerPhone: phone,
            updatedAt: new Date().toISOString()
          });

          handleCloseEditAddressModal();
          Swal.fire({
            icon: 'success',
            title: 'Shipping Address Updated',
            text: 'Your delivery address has been successfully updated for this order.',
            timer: 2500,
            showConfirmButton: false,
            confirmButtonColor: '#171717'
          });
        } else {
          setAddressEditError(res.message || 'Failed to update address. Please try again.');
        }
      } catch (err) {
        console.error('Error updating shipping address:', err);
        setAddressEditError(err.message || 'An error occurred while updating the address.');
      } finally {
        setIsSavingAddress(false);
      }
    };

    return (
      <div className="w-full bg-white text-brand-dark pt-24 sm:pt-28 pb-4 sm:pb-6 font-serif selection:bg-brand-dark selection:text-white">
        <SEOHead title="Order Confirmed | House of Urvaah" noindex={true} />



        {/* Floating Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`fixed bottom-6 right-6 z-[100] max-w-sm sm:max-w-md w-[calc(100%-3rem)] sm:w-auto px-5 py-3.5 rounded-xl shadow-2xl backdrop-blur-md flex items-center justify-between gap-4 font-sans border text-white ${
                toast.type === 'error'
                  ? 'bg-neutral-950/95 border-rose-900/60 shadow-rose-950/30'
                  : toast.type === 'success'
                  ? 'bg-neutral-950/95 border-emerald-900/60 shadow-emerald-950/30'
                  : 'bg-neutral-950/95 border-neutral-800 shadow-black/40'
              }`}
            >
              <div className="flex items-center gap-3">
                {toast.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                ) : toast.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <ShoppingBag className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span className="text-xs sm:text-sm font-light tracking-wide text-neutral-200 leading-snug">
                  {toast.message}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="text-neutral-400 hover:text-white transition-colors p-1 cursor-pointer shrink-0 ml-2"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-[1340px] mx-auto px-4 sm:px-6 md:px-8">
          {/* Top Order Confirmed Header */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm ${
                isCancellationRejected || isReturnRejected
                  ? 'bg-rose-700 text-white'
                  : isOrderCancelled
                  ? 'bg-red-600 text-white'
                  : isCancellationRequested
                  ? 'bg-amber-600 text-white'
                  : isInReturnFlow
                  ? (isReturned ? 'bg-emerald-600 text-white' : 'bg-indigo-900 text-white')
                  : isInReplacementFlow
                  ? 'bg-purple-900 text-white'
                  : 'bg-brand-dark text-white'
              }`}
            >
              {isCancellationRejected || isReturnRejected ? (
                <XCircle className="w-8 h-8 stroke-[2.5]" />
              ) : isOrderCancelled ? (
                <X className="w-8 h-8 stroke-[2.5]" />
              ) : isCancellationRequested ? (
                <Clock className="w-8 h-8 stroke-[2.5]" />
              ) : isInReturnFlow ? (
                isReturned ? <Check className="w-8 h-8 stroke-[2.5]" /> : <RotateCcw className="w-8 h-8 stroke-[2.5]" />
              ) : isInReplacementFlow ? (
                <RefreshCw className="w-8 h-8 stroke-[2.5]" />
              ) : (
                <Check className="w-8 h-8 stroke-[2.5]" />
              )}
            </motion.div>

            <span className="text-[10px] tracking-[0.25em] uppercase text-neutral-500 block mb-1.5 font-serif font-semibold">
              {isCancellationRejected
                ? 'CANCELLATION REQUEST REJECTED BY ADMIN'
                : isReturnQcRejected
                ? 'RETURN QC REJECTED • REFUND CANCELLED'
                : isReturnRejected
                ? 'RETURN REQUEST REJECTED BY ADMIN'
                : isOrderCancelled
                ? (isRefundCompleted ? 'ORDER CANCELLED & 100% REFUND COMPLETED' : 'ORDER CANCELLED & SHIPROCKET SHIPMENT VOIDED')
                : isCancellationRequested
                ? 'CANCELLATION REQUEST UNDER REVIEW'
                : isMixedReturnReplace
                ? (isReplaced || Boolean(details.replacement_order_number) ? 'REPLACEMENT ORDER DISPATCHED & REFUND PROCESSED' : isReplacementQCReceived ? 'PARCEL RECEIVED AT ATELIER • QC PASSED' : isReplacementCollected ? 'PARCEL COLLECTED • IN REVERSE TRANSIT' : isReplacementApproved ? 'EXCHANGE & RETURN APPROVED • REVERSE PICKUP SCHEDULED' : 'SIMULTANEOUS RETURN & REPLACEMENT UNDER REVIEW')
                : isReplacementForwardOrder
                ? (isDelivered ? 'REPLACEMENT ORDER DELIVERED' : isShipped ? 'REPLACEMENT ORDER DISPATCHED' : 'REPLACEMENT IN TAILORING')
                : isInReturnFlow
                ? (isReturned ? 'RETURN COMPLETED & 100% REFUND SETTLED' : isReceivedAtUrvaah ? 'RETURN RECEIVED AT ATELIER • QC IN PROGRESS' : isReturnApproved ? 'RETURN APPROVED • REVERSE PICKUP SCHEDULED' : 'RETURN REQUEST UNDER ATELIER REVIEW')
                : isInReplacementFlow
                ? (isReplaced || Boolean(details.replacement_order_number) ? 'REPLACEMENT ORDER DISPATCHED' : isReplacementQCReceived ? 'PARCEL RECEIVED AT ATELIER • QC PASSED' : isReplacementCollected ? 'PARCEL COLLECTED • IN REVERSE TRANSIT' : isReplacementApproved ? 'REPLACEMENT APPROVED • REVERSE PICKUP SCHEDULED' : 'REPLACEMENT REQUEST UNDER REVIEW')
                : isDelivered
                ? 'ORDER DELIVERED & COMPLETED'
                : 'ORDER CONFIRMED & PROCESSING'}
            </span>
            <h1 className="text-2xl sm:text-4xl font-serif tracking-[0.12em] uppercase text-black font-semibold mb-2">
              {isCancellationRejected
                ? 'CANCELLATION REQUEST DECLINED'
                : isReturnQcRejected
                ? 'RETURN REJECTED (QC FAILED)'
                : isReturnRejected
                ? 'RETURN REQUEST DECLINED'
                : isOrderCancelled
                ? 'THIS ORDER HAS BEEN CANCELLED'
                : isCancellationRequested
                ? 'CANCELLATION REQUEST SUBMITTED'
                : isMixedReturnReplace
                ? (isReplaced || Boolean(details.replacement_order_number) ? 'EXCHANGE DISPATCHED & RETURN SETTLED' : 'EXCHANGE & RETURN IN MOTION')
                : isReplacementForwardOrder
                ? `REPLACEMENT PIECE #${details.orderNumber}`
                : isInReturnFlow
                ? (isReturned ? 'RETURN & REFUND COMPLETED' : isReceivedAtUrvaah ? 'PIECE RECEIVED AT HOUSE OF URVAAH' : isReturnApproved ? 'RETURN APPROVED BY ATELIER' : 'RETURN REQUEST SUBMITTED')
                : isInReplacementFlow
                ? (isReplaced || Boolean(details.replacement_order_number) ? 'REPLACEMENT ORDER PLACED & DISPATCHED' : 'EXCHANGE / REPLACEMENT IN MOTION')
                : isDelivered
                ? 'THANK YOU! YOUR ORDER HAS BEEN DELIVERED'
                : 'THANK YOU FOR YOUR ORDER'}
            </h1>
            <p className="text-xs font-sans text-neutral-500 tracking-wider uppercase">
              {isCancellationRejected ? (
                <>Your cancellation request was reviewed and <strong className="text-black font-medium">rejected by our atelier admin team</strong>. Your order remains confirmed and will be processed for delivery.{(details.rejection_reason || details.cancel_reason) ? ` Reason: "${details.rejection_reason || details.cancel_reason}"` : ''}</>
              ) : isReturnQcRejected ? (
                <>Your returned parcel was inspected by our atelier QC team and <strong className="text-black font-medium">could not be accepted into inventory</strong>. As per our policy, the return has been rejected and the refund has been cancelled.{(details.return_rejection_reason || details.rejection_reason || details.cancel_reason) ? ` QC Reason: "${details.return_rejection_reason || details.rejection_reason || details.cancel_reason}"` : ''}</>
              ) : isReturnRejected ? (
                <>Your return request was reviewed and <strong className="text-black font-medium">declined by our atelier team</strong>. Your order remains delivered and no reverse pickup will take place.{(details.return_rejection_reason || details.rejection_reason || details.cancel_reason) ? ` Reason: "${details.return_rejection_reason || details.rejection_reason || details.cancel_reason}"` : ''}</>
              ) : isOrderCancelled ? (
                isRefundCompleted ? (
                  <>Shiprocket courier pickup was voided prior to dispatch. 100% full refund of <strong className="text-black font-medium">{formatPrice(details.totalPaid)}</strong> has been disbursed to your original payment method{details.refund_txn_id ? ` (UTR: ${details.refund_txn_id})` : ''}.</>
                ) : (
                  <>Shiprocket courier pickup was voided prior to dispatch. 100% full refund has been initiated to your original payment method.</>
                )
              ) : isCancellationRequested ? (
                <>Your cancellation request has been recorded and is currently being reviewed by our atelier management team. Once approved, freight will be voided and your refund will be processed.</>
              ) : isMixedReturnReplace ? (
                isReplaced || Boolean(details.replacement_order_number) ? (
                  <>Your replacement order #{details.replacement_order_number || `${details.orderNumber}-REP`} has been generated and dispatched with 100% exchange credit, and ₹{mixedRefundAmount.toLocaleString('en-IN')} refund for your returned item has been processed.</>
                ) : isReplacementQCReceived ? (
                  <>Reverse parcel containing both exchange and return items has arrived at House of Urvaah atelier and verified in pristine condition. Replacement order is queued and refund of <strong className="text-black font-medium">{formatPrice(mixedRefundAmount)}</strong> is in settlement.</>
                ) : isReplacementCollected ? (
                  <>Courier rider has collected both exchange and return pieces from your doorstep and they are in transit to our atelier.</>
                ) : isReplacementApproved ? (
                  <>Both exchange and return requests have been authorized. Delhivery reverse courier pickup has been scheduled for your doorstep. Please keep pieces ready.</>
                ) : (
                  <>Your simultaneous exchange and return request is active. Our concierge is coordinating doorstep collection for both items, replacement dispatch, and refund settlement of <strong className="text-black font-medium">{formatPrice(mixedRefundAmount)}</strong>.</>
                )
              ) : isReplacementForwardOrder ? (
                <>Our atelier is crafting your replacement piece{details.replacement_size ? ` in size ${details.replacement_size}` : ''} for delivered Order #{details.original_order_number || 'original'}. 100% exchange credit applied (₹0 balance).</>
              ) : isInReturnFlow ? (
                isReturned ? (
                  <>Your delivered piece was received back at House of Urvaah and passed inspection. 100% full refund of <strong className="text-black font-medium">{formatPrice(details.totalPaid)}</strong> has been settled to your account{details.refund_txn_id ? ` (UTR: ${details.refund_txn_id})` : ''}.</>
                ) : isReceivedAtUrvaah ? (
                  <>Your return parcel has arrived at our atelier. Our quality team is verifying the piece. Upon verification, your refund will be disbursed immediately.</>
                ) : isReturnApproved ? (
                  <>Your return request has been approved by admin. Delhivery reverse courier pickup has been scheduled for your delivery address within 24–48 hours.</>
                ) : (
                  <>Your return request has been received and is pending admin verification. Upon approval, reverse doorstep pickup will be scheduled. Refund will be processed upon QC inspection at our atelier.</>
                )
              ) : isInReplacementFlow ? (
                isReplaced || Boolean(details.replacement_order_number) ? (
                  <>Your replacement order #{details.replacement_order_number || `${details.orderNumber}-REP`} has been generated and placed in the Maison dispatch queue with 100% exchange credit.</>
                ) : isReplacementQCReceived ? (
                  <>Original parcel was received at House of Urvaah atelier and verified in pristine condition. Replacement order is queued for placement.</>
                ) : isReplacementCollected ? (
                  <>Courier rider has collected the parcel from customer doorstep and is delivering it to our atelier.</>
                ) : isReplacementApproved ? (
                  <>Replacement authorized. Courier partner has been assigned for doorstep parcel collection. Please keep tags and packaging ready.</>
                ) : (
                  <>Your exchange request is active. Our concierge is coordinating doorstep collection and replacement dispatch.</>
                )
              ) : (
                <>We'll send you an order confirmation email shortly to <strong className="text-black font-medium">{details.customerEmail || user?.email}</strong>.</>
              )}
            </p>
          </div>

          {/* Top 3 Metric Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {/* Card 1: Order Number */}
            <div className="bg-[#FAF8F3] border border-neutral-200/80 p-5 sm:p-6 flex items-center gap-4 text-left">
              <div className="w-11 h-11 bg-brand-dark text-white rounded-full flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="font-sans flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 font-semibold block mb-0.5">
                    Order Number
                  </span>
                  <button
                    type="button"
                    onClick={refreshLatestStatus}
                    disabled={isRefreshingStatus}
                    title="Refresh order details"
                    className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-neutral-500 hover:text-black transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshingStatus ? 'animate-spin text-black' : ''}`} />
                    <span>{isRefreshingStatus ? 'Updating...' : 'Sync'}</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm sm:text-base font-semibold text-black font-serif tracking-[0.06em]">
                    {details.orderNumber}
                  </span>
                  {isReplacementForwardOrder && (
                    <span className="px-2 py-0.5 text-[9px] font-sans font-bold tracking-wider uppercase rounded-full bg-purple-100 text-purple-900 border border-purple-200 shadow-2xs">
                      Replacement {details.original_order_number ? `(#${details.original_order_number})` : ''}
                    </span>
                  )}
                  {isReplaced && details.replacement_order_number && (
                    <span className="px-2 py-0.5 text-[9px] font-sans font-bold tracking-wider uppercase rounded-full bg-purple-100 text-purple-900 border border-purple-200 shadow-2xs">
                      Exchanged for #{details.replacement_order_number}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Card 2: Tracking Number / Shiprocket Status */}
            <div className="bg-[#FAF8F3] border border-neutral-200/80 p-5 sm:p-6 flex items-center gap-4 text-left">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-white ${
                isOrderCancelled || isReturnQcRejected
                  ? 'bg-rose-700'
                  : isCancellationRequested
                  ? 'bg-amber-600'
                  : isInReturnFlow
                  ? 'bg-indigo-900'
                  : isInReplacementFlow
                  ? 'bg-purple-900'
                  : 'bg-brand-dark'
              }`}>
                {isReturnQcRejected ? <XCircle className="w-5 h-5 stroke-[1.8]" /> : <Truck className="w-5 h-5 stroke-[1.8]" />}
              </div>
              <div className="font-sans flex-1">
                <span className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 font-semibold block mb-0.5">
                  {isReturnQcRejected ? 'QC Inspection Status' : isOrderCancelled ? 'Shiprocket Logistics' : isMixedReturnReplace ? 'Mixed Reverse Logistics' : isReplacementForwardOrder ? 'Courier Partner / Tracking' : isInReturnFlow ? 'Reverse Logistics' : isInReplacementFlow ? 'Exchange Reverse Logistics' : isCancellationRequested ? 'Logistics Status' : 'Tracking Number'}
                </span>
                <span className={`text-sm sm:text-base font-semibold font-serif tracking-[0.06em] block ${
                  isOrderCancelled || isReturnQcRejected
                    ? 'text-rose-700'
                    : isMixedReturnReplace
                    ? 'text-indigo-950'
                    : isInReturnFlow
                    ? 'text-indigo-950'
                    : isInReplacementFlow
                    ? 'text-purple-950'
                    : isCancellationRequested
                    ? 'text-amber-800'
                    : 'text-black'
                }`}>
                  {isReturnQcRejected
                    ? 'QC Inspection Failed'
                    : isOrderCancelled
                    ? 'Pickup Voided • ₹0 Freight'
                    : isCancellationRequested
                    ? 'Cancellation Under Review'
                    : isMixedReturnReplace
                    ? (returnAwb ? `Reverse AWB: ${returnAwb}` : (isReplacementApproved ? 'Reverse Pickup Scheduled' : 'Reverse Pickup Active'))
                    : isReplacementForwardOrder
                    ? (details.trackingNumber || 'Processing Forward Transit')
                    : isInReturnFlow
                    ? (returnAwb ? `Reverse AWB: ${returnAwb}` : (isReturnApproved ? 'Pickup Scheduled' : 'Reverse Pickup Pending Approval'))
                    : isInReplacementFlow
                    ? (returnAwb ? `Reverse AWB: ${returnAwb}` : (isReplacementApproved ? 'Reverse Pickup Scheduled' : 'Reverse Pickup & Exchange Active'))
                    : details.trackingNumber}
                </span>
              </div>
            </div>

            {/* Card 3: Estimated Delivery / Settlement */}
            <div className="bg-[#FAF8F3] border border-neutral-200/80 p-5 sm:p-6 flex items-center gap-4 text-left">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-white ${
                isReturnQcRejected
                  ? 'bg-rose-700'
                  : isOrderCancelled
                  ? 'bg-emerald-700'
                  : isCancellationRequested
                  ? 'bg-amber-600'
                  : isMixedReturnReplace
                  ? 'bg-purple-900'
                  : isReplacementForwardOrder
                  ? 'bg-brand-dark'
                  : isInReturnFlow
                  ? (isReturned ? 'bg-emerald-700' : 'bg-indigo-900')
                  : isInReplacementFlow
                  ? 'bg-purple-900'
                  : 'bg-brand-dark'
              }`}>
                {isReturnQcRejected ? <XCircle className="w-5 h-5 stroke-[1.8]" /> : (isOrderCancelled || isInReturnFlow ? <RotateCcw className="w-5 h-5 stroke-[1.8]" /> : isCancellationRequested ? <Clock className="w-5 h-5 stroke-[1.8]" /> : isReplacementForwardOrder ? <Calendar className="w-5 h-5 stroke-[1.8]" /> : isInReplacementFlow ? <RefreshCw className="w-5 h-5 stroke-[1.8]" /> : <Calendar className="w-5 h-5 stroke-[1.8]" />)}
              </div>
              <div className="font-sans">
                <span className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 font-semibold block mb-0.5">
                  {isReturnQcRejected || isOrderCancelled || isInReturnFlow || isCancellationRequested ? 'Financial Settlement' : isMixedReturnReplace ? 'Exchange & Refund' : isReplacementForwardOrder ? 'Exchange Settlement' : isInReplacementFlow ? 'Exchange Fulfillment' : 'Estimated Delivery'}
                </span>
                <span className={`text-xs sm:text-sm font-bold font-sans tracking-tight ${isReturnQcRejected ? 'text-rose-700' : 'text-black'}`}>
                  {isReturnQcRejected
                    ? 'Refund Cancelled • ₹0.00 Payable'
                    : isOrderCancelled
                    ? (isRefundCompleted ? '100% Refund Disbursed (Completed)' : 'Full Refund Initiated (3-5 Days)')
                    : isCancellationRequested
                    ? 'Refund Pending Admin Approval'
                    : isMixedReturnReplace
                    ? (isReplaced || Boolean(details.replacement_order_number) ? `Dispatched + Refund ${formatPrice(mixedRefundAmount)}` : `Exchange Piece + Refund ${formatPrice(mixedRefundAmount)}`)
                    : isReplacementForwardOrder
                    ? '100% Exchange Credit Applied (₹0 Balance)'
                    : isInReturnFlow
                    ? (isReturned ? (details.refund_txn_id ? `100% Refund Disbursed (UTR: ${details.refund_txn_id})` : '100% Refund Disbursed (Completed)') : isReceivedAtUrvaah ? 'QC Inspection • Refund Queued' : `Refund Pending QC (${formatPrice(details.totalPaid)})`)
                    : isInReplacementFlow
                    ? (details.replacement_order_number ? `Replacement Piece #${details.replacement_order_number} Dispatched (₹0 Balance)` : 'Exchange Piece In Preparation')
                    : details.estimatedDelivery}
                </span>
              </div>
            </div>
          </div>

          {/* Pre-Delivery Cancellation Rejected Alert Banner */}
          {isCancellationRejected && (
            <div className="mb-8 bg-rose-50/90 border border-rose-200/90 rounded-2xl p-5 sm:p-6 flex items-start gap-4 shadow-sm text-left">
              <div className="p-2.5 bg-rose-100 rounded-xl text-rose-800 shrink-0 mt-0.5">
                <XCircle className="w-6 h-6 text-rose-700" />
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h4 className="font-serif font-bold text-rose-950 uppercase tracking-wide text-sm sm:text-base">
                    Cancellation Request Rejected by Admin
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-900 border border-rose-300 uppercase">
                    Request Declined
                  </span>
                </div>
                <p className="text-rose-900/90 leading-relaxed font-sans text-xs sm:text-sm">
                  Your cancellation request for this order was reviewed and <strong>rejected by our atelier admin team</strong>. Your order remains confirmed and will be processed and dispatched for delivery as scheduled.
                </p>
                {(details.rejection_reason || details.cancel_reason) && (
                  <p className="text-xs text-rose-800 font-sans pt-1">
                    <span className="font-semibold uppercase tracking-wider text-[11px]">Admin Reason:</span> "{details.rejection_reason || details.cancel_reason}"
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Post-Delivery Return QC Rejected Alert Banner */}
          {isReturnQcRejected && (
            <div className="mb-8 bg-rose-50/90 border border-rose-200/90 rounded-2xl p-5 sm:p-6 flex items-start gap-4 shadow-sm text-left">
              <div className="p-2.5 bg-rose-100 rounded-xl text-rose-800 shrink-0 mt-0.5">
                <AlertCircle className="w-6 h-6 text-rose-700" />
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h4 className="font-serif font-bold text-rose-950 uppercase tracking-wide text-sm sm:text-base">
                    Return Rejected — Atelier Quality Verification Failed
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-900 border border-rose-300 uppercase">
                    QC Rejected
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300 uppercase">
                    Refund Cancelled
                  </span>
                </div>
                <p className="text-rose-900/90 leading-relaxed font-sans text-xs sm:text-sm">
                  The returned parcel arrived at the House of Urvaah atelier and underwent quality inspection, but did not pass verification. As per policy, the return has been rejected and the refund has been cancelled.
                </p>
                {(details.return_rejection_reason || details.rejection_reason || details.cancel_reason) && (
                  <p className="text-xs text-rose-800 font-sans pt-1 font-medium">
                    <span className="font-semibold uppercase tracking-wider text-[11px]">QC Findings / Reason:</span> "{details.return_rejection_reason || details.rejection_reason || details.cancel_reason}"
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Post-Delivery Return Initial Request Rejected Alert Banner */}
          {isReturnRejected && !isReturnQcRejected && (
            <div className="mb-8 bg-rose-50/90 border border-rose-200/90 rounded-2xl p-5 sm:p-6 flex items-start gap-4 shadow-sm text-left">
              <div className="p-2.5 bg-rose-100 rounded-xl text-rose-800 shrink-0 mt-0.5">
                <AlertCircle className="w-6 h-6 text-rose-700" />
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h4 className="font-serif font-bold text-rose-950 uppercase tracking-wide text-sm sm:text-base">
                    Return Request Declined by Admin
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-900 border border-rose-300 uppercase">
                    Request Declined
                  </span>
                </div>
                <p className="text-rose-900/90 leading-relaxed font-sans text-xs sm:text-sm">
                  Your return request was reviewed and <strong>declined by our atelier team</strong>. Your order remains delivered and no reverse pickup will take place.
                </p>
                {(details.return_rejection_reason || details.rejection_reason || details.cancel_reason) && (
                  <p className="text-xs text-rose-800 font-sans pt-1 font-medium">
                    <span className="font-semibold uppercase tracking-wider text-[11px]">Admin Reason:</span> "{details.return_rejection_reason || details.rejection_reason || details.cancel_reason}"
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TWO COLUMN MAIN CONTENT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT COLUMN: Order Summary & Shipping Address */}
            <div className="lg:col-span-7 space-y-8 text-left">
              {/* Card 1: Order Summary */}
              <div className="bg-white border border-neutral-200/80 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-6 border-b border-neutral-200">
                  <h2 className="text-lg sm:text-xl font-serif tracking-[0.15em] uppercase text-black font-semibold">
                    ORDER SUMMARY
                  </h2>
                  <button
                    type="button"
                    onClick={handleReorder}
                    disabled={isReordering}
                    className="inline-flex items-center gap-2 border border-neutral-300 hover:border-black text-brand-dark text-[10px] font-sans font-bold tracking-[0.2em] uppercase px-4 py-2.5 transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isReordering ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                    <span>{isReordering ? 'Adding to Bag...' : 'Reorder This Entire Order'}</span>
                  </button>
                </div>

                {/* Items List */}
                <div className="space-y-6 mb-8 font-sans">
                  {details.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-4 pb-6 border-b border-neutral-100 last:border-b-0 last:pb-0">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-20 bg-neutral-100 flex-shrink-0 border border-neutral-200/60 p-0.5">
                          <img
                            src={getSupabaseMediaUrl(item.image)}
                            alt={item.name}
                            className="w-full h-full object-contain object-center"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = getSupabaseMediaUrl('Images/Blue02.png');
                            }}
                          />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-semibold uppercase text-black font-serif tracking-wide leading-snug">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1.5 font-sans flex-wrap">
                            <span className="text-[11px] text-neutral-500 font-medium">Qty: {item.quantity}{item.size ? ` • Size: ${item.size}` : ''}</span>
                            {(() => {
                              const itemAct = (item.return_action || '').toLowerCase();
                              const itemStat = (item.status || '').toLowerCase();
                              if (isReturnQcRejected || itemStat.includes('qc reject') || (isReturnRejected && (details.return_qc_status || '').toLowerCase() === 'rejected')) {
                                return (
                                  <span className="px-2 py-0.5 text-[9px] font-sans font-bold tracking-[0.16em] uppercase bg-rose-100 text-rose-900 border border-rose-300">
                                    QC REJECTED
                                  </span>
                                );
                              }
                              if (isReturnRejected || itemStat.includes('return reject')) {
                                return (
                                  <span className="px-2 py-0.5 text-[9px] font-sans font-semibold tracking-[0.16em] uppercase bg-rose-100 text-rose-900 border border-rose-300">
                                    Return Rejected
                                  </span>
                                );
                              }
                              if (itemAct === 'replace' || itemStat.includes('replace') || itemStat.includes('exchange')) {
                                return (
                                  <span className="px-2 py-0.5 text-[9px] font-sans font-semibold tracking-[0.16em] uppercase bg-purple-100 text-purple-900 border border-purple-200">
                                    Replace (Size: {item.replacement_size || details.replacement_size || 'M'})
                                  </span>
                                );
                              }
                              if (itemAct === 'return' || itemStat.includes('return')) {
                                return (
                                  <span className="px-2 py-0.5 text-[9px] font-sans font-semibold tracking-[0.16em] uppercase bg-amber-100 text-amber-900 border border-amber-200">
                                    Return Requested
                                  </span>
                                );
                              }
                              if (itemAct === 'keep') {
                                return (
                                  <span className="px-2 py-0.5 text-[9px] font-sans font-semibold tracking-[0.16em] uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    Kept
                                  </span>
                                );
                              }
                              return (
                                <span className={`px-2 py-0.5 text-[9px] font-sans font-semibold tracking-[0.16em] uppercase ${
                                  isOrderCancelled
                                    ? 'bg-red-900 text-white'
                                    : isReturned
                                    ? 'bg-emerald-700 text-white'
                                    : isDelivered
                                    ? 'bg-emerald-700 text-white'
                                    : isOutForDelivery
                                    ? 'bg-blue-700 text-white'
                                    : isShipped
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-brand-dark text-white'
                                }`}>
                                  {isOrderCancelled ? 'CANCELLED' : isReturned ? 'RETURNED' : isDelivered ? 'DELIVERED' : isOutForDelivery ? 'OUT FOR DELIVERY' : isShipped ? 'SHIPPED' : 'PROCESSING'}
                                </span>
                              );
                            })()}
                            {isDelivered && !isOrderCancelled && !isCancellationRequested && !isInReturnFlow && !isInReplacementFlow && (
                              <button
                                type="button"
                                onClick={() => {
                                  const prodId = item.product_id || item.productId || (item.product && (item.product.id || item.product.product_id)) || item.id;
                                  if (prodId) {
                                    navigate(`/product/${prodId}?openReview=true#customer-reviews`);
                                  }
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded border border-neutral-900 bg-neutral-900 hover:bg-black text-white text-[9px] font-sans font-bold tracking-[0.14em] uppercase transition-all shadow-2xs cursor-pointer ml-1"
                                title="Rate and give feedback for this piece"
                              >
                                <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                                <span>Feedback</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-sans">
                        <span className="text-sm font-bold text-black block font-serif">
                          {formatPrice((item.price || details.subtotal || details.totalPaid) * item.quantity)}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-medium block uppercase tracking-wider">
                          {formatPrice(item.price || details.subtotal || details.totalPaid)} each
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Subtotals */}
                <div className="pt-6 border-t border-neutral-200 space-y-3 text-xs font-sans text-neutral-600">
                  <div className="flex justify-between items-center">
                    <span className="uppercase tracking-wider">Original Order Total</span>
                    <span className="font-semibold text-black">{formatPrice(details.subtotal || details.totalPaid)}</span>
                  </div>
                  {details.discount > 0 && (
                    <div className="flex justify-between items-center text-emerald-800 font-medium">
                      <span className="uppercase tracking-wider">Effective Subtotal</span>
                      <span>-{formatPrice(details.discount)}</span>
                    </div>
                  )}
                  {(() => {
                    const baseSub = Number(details.subtotal || 0);
                    const disc = Number(details.discount || 0);
                    const ship = Number(details.shippingFee || 0);
                    const tot = Number(details.totalPaid || 0);
                    const computedDiff = Math.max(0, Math.round(tot - (baseSub - disc) - ship));
                    const effectiveTax = Number(details.tax) > 0 ? Number(details.tax) : computedDiff;
                    const effectiveRate = details.taxRate || (effectiveTax > 0 && (baseSub - disc) > 0
                      ? Math.round((effectiveTax / (baseSub - disc)) * 100)
                      : (baseSub > 2500 ? 18 : 5));

                    if (effectiveTax > 0) {
                      return (
                        <div className="flex justify-between items-center text-neutral-600">
                          <span className="uppercase tracking-wider">GST ({effectiveRate}%)</span>
                          <span className="font-semibold text-black">+{formatPrice(effectiveTax)}</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  <div className="flex justify-between items-center">
                    <span className="uppercase tracking-wider">Shipping</span>
                    <span className="font-semibold text-black">
                      {details.shippingFee === 0 ? 'COMPLIMENTARY EXPRESS' : formatPrice(details.shippingFee)}
                    </span>
                  </div>
                </div>

                {/* Total */}
                <div className="pt-6 border-t border-neutral-200 mt-6 flex justify-between items-baseline font-serif">
                  <span className="text-xl sm:text-2xl tracking-[0.1em] uppercase font-semibold text-black">TOTAL</span>
                  {isReplacementForwardOrder ? (
                    <div className="text-right">
                      <span className="text-xl sm:text-2xl font-bold text-black font-serif">₹0</span>
                      <span className="text-[10px] font-sans font-bold text-purple-700 block tracking-wider uppercase mt-0.5">100% Exchange Credit Applied</span>
                    </div>
                  ) : (
                    <span className="text-xl sm:text-2xl font-bold text-black font-serif">{formatPrice(details.totalPaid || details.subtotal)}</span>
                  )}
                </div>
              </div>

              {/* Card 2: Shipping Address */}
              <div className="bg-white border border-neutral-200/80 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6 border-b border-neutral-200 pb-4 flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-dark text-white flex items-center justify-center shrink-0">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-serif tracking-[0.15em] uppercase text-black font-semibold">
                      SHIPPING ADDRESS
                    </h3>
                  </div>

                  {canEditAddress && (
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] font-sans font-bold tracking-wider uppercase text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Editable for {hoursRemaining}h</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleOpenEditAddress}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-black bg-black text-white hover:bg-neutral-800 text-[11px] font-sans font-semibold tracking-wider uppercase rounded transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Edit Address</span>
                      </button>
                    </div>
                  )}

                  {!canEditAddress && !isOrderCancelled && !isCancellationRequested && (
                    <span className="text-[10px] font-sans font-medium text-neutral-400 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-neutral-400" />
                      <span>Address locked</span>
                    </span>
                  )}
                </div>

                <div className="bg-[#FAF8F3] border border-neutral-200/80 p-6 text-xs font-sans text-neutral-800 leading-relaxed space-y-2.5">
                  <p className="font-bold text-sm text-black uppercase tracking-wider">{details.shippingAddress.name || details.customerName}</p>
                  <p className="text-neutral-600 font-medium leading-relaxed">
                    {[
                      details.shippingAddress.street,
                      details.shippingAddress.city,
                      `${details.shippingAddress.state || ''} - ${details.shippingAddress.pincode || ''}`
                    ].filter(Boolean).join(', ')}
                  </p>
                  <p className="font-bold text-black uppercase text-[11px] tracking-[0.2em]">{details.shippingAddress.country || 'INDIA'}</p>

                  <div className="pt-4 border-t border-neutral-200/80 flex flex-wrap items-center gap-x-12 gap-y-2 text-[11px] font-sans">
                    <div>
                      <span className="text-neutral-400 block text-[9px] uppercase font-bold tracking-[0.2em] mb-0.5">PHONE</span>
                      <span className="font-semibold text-black font-sans">{details.customerPhone}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[9px] uppercase font-bold tracking-[0.2em] mb-0.5">EMAIL</span>
                      <span className="font-bold text-black">{details.customerEmail}</span>
                    </div>
                  </div>
                </div>

                {canEditAddress && (
                  <div className="mt-3.5 flex items-center gap-1.5 text-[11px] text-neutral-500 font-sans px-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Need to update address? Allowed within 24 hours of ordering.</span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: ORDER JOURNEY Timeline & Order Status */}
            <div className="lg:col-span-5 space-y-8 text-left">
              {/* Card 1: ORDER JOURNEY Timeline, CANCELLATION LIFECYCLE, RETURN QC LIFECYCLE, or REPLACEMENT JOURNEY */}
              {isReturnQcRejected ? (
                <div className="bg-white border border-rose-200/90 p-6 sm:p-8 rounded-xl shadow-xs">
                  <div className="flex items-center justify-between pb-3 mb-6 border-b border-rose-100">
                    <h3 className="text-xs font-serif tracking-[0.25em] uppercase text-rose-950 font-semibold flex items-center gap-2">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>RETURN QC & REFUND LIFECYCLE</span>
                    </h3>
                    <span className="text-[10px] font-sans font-bold tracking-[0.16em] uppercase text-rose-800 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                      REFUND CANCELLED
                    </span>
                  </div>

                  {/* QC Rejection Notice Card */}
                  <div className="mb-6 p-4 bg-rose-50/70 border border-rose-200/80 rounded-xl space-y-2 text-xs font-sans">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>QC Verification Failed</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-rose-200 text-rose-900">
                        PRODUCT REJECTED
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-900/90 leading-relaxed">
                      The returned parcel was received at House of Urvaah atelier and underwent quality inspection. The piece could not be verified into inventory. As per store policy, the return has been rejected and the refund has been cancelled.
                    </p>
                    {(details.return_rejection_reason || details.rejection_reason || details.cancel_reason) && (
                      <p className="text-[11px] text-rose-900 font-semibold pt-1">
                        <span className="uppercase tracking-wider text-[10px] text-rose-700">Findings:</span> "{details.return_rejection_reason || details.rejection_reason || details.cancel_reason}"
                      </p>
                    )}
                  </div>

                  {/* 4-Step Vertical Timeline */}
                  <div className="space-y-6 relative pl-1">
                    {/* Vertical Connected Line */}
                    <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-neutral-200" />

                    {/* Step 1: Return Requested */}
                    <div className="relative flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 font-bold text-xs bg-neutral-900 text-white shadow-xs">
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div className="font-sans pt-0.5">
                        <h4 className="text-xs font-bold tracking-[0.15em] text-black uppercase">1. RETURN REQUESTED</h4>
                        <span className="text-[9px] font-sans font-semibold tracking-[0.16em] uppercase block mt-0.5 text-neutral-600">
                          COMPLETED • REASON RECORDED
                        </span>
                      </div>
                    </div>

                    {/* Step 2: Collected & In Transit */}
                    <div className="relative flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 font-bold text-xs bg-indigo-700 text-white shadow-xs">
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div className="font-sans pt-0.5">
                        <h4 className="text-xs font-bold tracking-[0.15em] text-black uppercase">2. DOORSTEP PICKUP & ARRIVAL</h4>
                        <span className="text-[9px] font-sans font-semibold tracking-[0.16em] uppercase block mt-0.5 text-indigo-700">
                          PARCEL DELIVERED TO ATELIER
                        </span>
                      </div>
                    </div>

                    {/* Step 3: Atelier QC Inspection */}
                    <div className="relative flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 font-bold text-xs bg-rose-600 text-white shadow-xs ring-4 ring-rose-100">
                        <X className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div className="font-sans pt-0.5">
                        <h4 className="text-xs font-bold tracking-[0.15em] text-rose-900 uppercase">3. ATELIER QUALITY CHECK</h4>
                        <span className="text-[9px] font-sans font-bold tracking-[0.16em] uppercase block mt-0.5 text-rose-700">
                          INSPECTION FAILED • RETURN REJECTED
                        </span>
                      </div>
                    </div>

                    {/* Step 4: Refund Cancelled */}
                    <div className="relative flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 font-bold text-xs bg-neutral-800 text-white shadow-xs ring-4 ring-neutral-200">
                        <X className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div className="font-sans pt-0.5">
                        <h4 className="text-xs font-bold tracking-[0.15em] text-neutral-800 uppercase">4. FINANCIAL SETTLEMENT</h4>
                        <span className="text-[9px] font-sans font-bold tracking-[0.16em] uppercase block mt-0.5 text-rose-800">
                          REFUND CANCELLED • ₹0.00 PAYABLE
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Settlement Breakdown Card */}
                  <div className="mt-8 pt-6 border-t border-rose-100 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Original Total:</span>
                      <span className="font-semibold text-neutral-400 line-through">{formatPrice(details.totalPaid)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-950">Payable Refund:</span>
                      <span className="font-mono font-bold text-rose-800">₹0.00 (Cancelled)</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-relaxed pt-1">
                      Due to quality inspection failure, the refund cannot be disbursed. If you have questions regarding this assessment, please contact our concierge team.
                    </p>
                  </div>
                </div>
              ) : isInReplacementFlow ? (
                <div className="bg-white border border-purple-200/80 p-6 sm:p-8">
                  <div className="flex items-center justify-between pb-3 mb-6 border-b border-purple-100">
                    <h3 className="text-xs font-serif tracking-[0.25em] uppercase text-purple-950 font-semibold flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 text-purple-700" />
                      <span>{isMixedReturnReplace ? 'SIMULTANEOUS RETURN & REPLACEMENT JOURNEY' : 'EXCHANGE & REPLACEMENT JOURNEY'}</span>
                    </h3>
                    <span className="text-[10px] font-sans font-bold tracking-[0.16em] uppercase text-purple-700">
                      STEP {isReplaced || Boolean(details.replacement_order_number) ? '5 OF 5' : isReplacementQCReceived ? '4 OF 5' : isReplacementCollected ? '3 OF 5' : isReplacementApproved ? '2 OF 5' : '1 OF 5'}
                    </span>
                  </div>

                  <div className="space-y-6 relative pl-1">
                    {/* Connected Vertical Line */}
                    <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-neutral-200" />

                    {/* Step 1: REPLACEMENT / MIXED REQUESTED */}
                    <div className="relative flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 font-bold text-xs bg-purple-700 text-white shadow-xs">
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div className="font-sans pt-0.5">
                        <h4 className="text-xs font-bold tracking-[0.15em] text-black uppercase">
                          {isMixedReturnReplace ? '1. RETURN & REPLACEMENT REQUESTED' : '1. REPLACEMENT REQUESTED'}
                        </h4>
                        <span className="text-[9px] font-sans font-semibold tracking-[0.16em] uppercase block mt-1 text-purple-700">
                          {isMixedReturnReplace
                            ? (mixedReplacementSize ? `REPLACE (SIZE ${mixedReplacementSize}) + RETURN (₹${mixedRefundAmount.toLocaleString('en-IN')})` : 'EXCHANGE & RETURN RECORDED')
                            : (details.replacement_size ? `SIZE ${details.replacement_size} REQUESTED` : 'COMPLETED')}
                        </span>
                      </div>
                    </div>

                    {/* Step 2: ATELIER APPROVED */}
                    <div className="relative flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${isReplacementApproved || isReplacementCollected || isReplacementQCReceived || isReplaced ? 'bg-purple-700 text-white shadow-xs font-bold' : 'bg-white border-2 border-neutral-300 text-neutral-400'}`}>
                        {isReplacementApproved || isReplacementCollected || isReplacementQCReceived || isReplaced ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div className="font-sans pt-0.5">
                        <h4 className={`text-xs font-bold tracking-[0.15em] uppercase ${isReplacementApproved || isReplacementCollected || isReplacementQCReceived || isReplaced ? 'text-black font-bold' : 'text-neutral-400'}`}>2. ATELIER APPROVED</h4>
                        <span className={`text-[9px] font-sans font-medium tracking-[0.16em] uppercase block mt-1 ${isReplacementApproved || isReplacementCollected || isReplacementQCReceived || isReplaced ? 'text-purple-700 font-bold' : 'text-neutral-400'}`}>
                          {isReplacementApproved || isReplacementCollected || isReplacementQCReceived || isReplaced ? 'REVERSE PICKUP SCHEDULED' : 'PENDING APPROVAL'}
                        </span>
                      </div>
                    </div>

                    {/* Step 3: PARCEL COLLECTED */}
                    <div className="relative flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${isReplacementCollected || isReplacementQCReceived || isReplaced ? 'bg-purple-700 text-white shadow-xs font-bold' : 'bg-white border-2 border-neutral-300 text-neutral-400'}`}>
                        {isReplacementCollected || isReplacementQCReceived || isReplaced ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Truck className="w-4 h-4" />}
                      </div>
                      <div className="font-sans pt-0.5">
                        <h4 className={`text-xs font-bold tracking-[0.15em] uppercase ${isReplacementCollected || isReplacementQCReceived || isReplaced ? 'text-black font-bold' : 'text-neutral-400'}`}>3. PARCEL COLLECTED</h4>
                        <span className={`text-[9px] font-sans font-medium tracking-[0.16em] uppercase block mt-1 ${isReplacementCollected || isReplacementQCReceived || isReplaced ? 'text-purple-700 font-bold' : 'text-neutral-400'}`}>
                          {isReplacementCollected || isReplacementQCReceived || isReplaced ? 'COLLECTED & IN REVERSE TRANSIT' : 'AWAITING DOORSTEP PICKUP'}
                        </span>
                      </div>
                    </div>

                    {/* Step 4: ATELIER QC PASSED */}
                    <div className="relative flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${isReplacementQCReceived || isReplaced ? 'bg-purple-700 text-white shadow-xs font-bold' : 'bg-white border-2 border-neutral-300 text-neutral-400'}`}>
                        {isReplacementQCReceived || isReplaced ? <Check className="w-4 h-4 stroke-[2.5]" /> : <ShieldCheck className="w-4 h-4" />}
                      </div>
                      <div className="font-sans pt-0.5">
                        <h4 className={`text-xs font-bold tracking-[0.15em] uppercase ${isReplacementQCReceived || isReplaced ? 'text-black font-bold' : 'text-neutral-400'}`}>4. ATELIER QC PASSED</h4>
                        <span className={`text-[9px] font-sans font-medium tracking-[0.16em] uppercase block mt-1 ${isReplacementQCReceived || isReplaced ? 'text-purple-700 font-bold' : 'text-neutral-400'}`}>
                          {isReplacementQCReceived || isReplaced ? 'ORIGINAL PIECE VERIFIED' : 'PENDING ATELIER INSPECTION'}
                        </span>
                      </div>
                    </div>

                    {/* Step 5: REPLACEMENT ORDER DISPATCHED / REFUND SETTLED */}
                    <div className="relative flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${isReplaced || Boolean(details.replacement_order_number) ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'bg-white border-2 border-neutral-300 text-neutral-400'}`}>
                        <PackageCheck className="w-4 h-4" />
                      </div>
                      <div className="font-sans pt-0.5">
                        <h4 className={`text-xs font-bold tracking-[0.15em] uppercase ${isReplaced || Boolean(details.replacement_order_number) ? 'text-emerald-700 font-bold' : 'text-neutral-400'}`}>
                          {isMixedReturnReplace ? '5. REPLACEMENT DISPATCHED & REFUND SETTLED' : '5. REPLACEMENT ORDER PLACED'}
                        </h4>
                        <span className={`text-[9px] font-sans font-medium tracking-[0.16em] uppercase block mt-1 ${isReplaced || Boolean(details.replacement_order_number) ? 'text-emerald-700 font-bold' : 'text-neutral-400'}`}>
                          {isMixedReturnReplace
                            ? (isReplaced || Boolean(details.replacement_order_number) ? (details.replacement_order_number ? `NEW ORDER #${details.replacement_order_number} + ₹${mixedRefundAmount.toLocaleString('en-IN')} REFUNDED` : 'DISPATCHED & REFUND SETTLED') : 'PENDING DISPATCH & SETTLEMENT')
                            : (isReplaced || Boolean(details.replacement_order_number) ? (details.replacement_order_number ? `NEW ORDER #${details.replacement_order_number}` : 'DISPATCHED') : 'PENDING DISPATCH')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Prominent Link to Track the Replacement Order */}
                  {(isReplaced || Boolean(details.replacement_order_number)) && (
                    <div className="mt-8 pt-6 border-t border-purple-100 flex flex-col gap-3">
                      <div className="text-xs text-purple-950 font-serif font-bold uppercase tracking-wider">
                        Forward Replacement Order Active
                      </div>
                      <p className="text-xs text-purple-900/80 leading-relaxed">
                        A dedicated replacement forward order #{details.replacement_order_number || `${details.orderNumber}-REP`} has been generated for size {details.replacement_size || 'your requested size'}. Click below to view the new order's live placement and fulfillment cycle.
                      </p>
                      <Link
                        to={`/checkout?orderNumber=${details.replacement_order_number || `${details.orderNumber}-REP`}`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
                      >
                        <span>Track Replacement Order #{details.replacement_order_number || `${details.orderNumber}-REP`}</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </div>
              ) : isInReturnFlow ? (
                <div className="bg-white border border-indigo-200/90 p-6 sm:p-8 rounded-xl shadow-xs">
                  <div className="flex items-center justify-between pb-3 mb-6 border-b border-indigo-100">
                    <h3 className="text-xs font-serif tracking-[0.25em] uppercase text-indigo-950 font-semibold flex items-center gap-2">
                      <RotateCcw className="w-3.5 h-3.5 text-indigo-700" />
                      <span>RETURN & REVERSE PICKUP JOURNEY</span>
                    </h3>
                    <span className="text-[10px] font-sans font-bold tracking-[0.16em] uppercase text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                      STEP {isReturned ? '5 OF 5' : isReceivedAtUrvaah ? '4 OF 5' : isReturnCollected ? '4 OF 5' : isReturnApproved ? '3 OF 5' : '1 OF 5'}
                    </span>
                  </div>

                  {/* Reverse Pickup Courier Card */}
                  <div className="mb-6 p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-xl space-y-2.5 text-xs font-sans">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-indigo-700" />
                        <span>Doorstep Courier Pickup</span>
                      </span>
                      {returnAwb && (
                        <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-900">
                          REVERSE AWB: {returnAwb}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-indigo-900/90 leading-relaxed">
                      {isReturned
                        ? 'Piece received back at House of Urvaah atelier. 100% full refund has been settled to your account.'
                        : isReceivedAtUrvaah
                        ? 'Package arrived at Urvaah atelier. Quality check passed; refund queued for settlement.'
                        : isReturnCollected
                        ? 'Courier rider collected the parcel from customer doorstep! In transit back to House of Urvaah.'
                        : isReturnApproved
                        ? 'Return approved! Courier partner is scheduled to collect package from your delivery address within 24–48 hours.'
                        : 'Return request submitted. Our atelier team is reviewing your request for reverse courier dispatch.'}
                    </p>

                    {/* Pickup Details Grid */}
                    <div className="pt-2 border-t border-indigo-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-indigo-950">
                      <div>
                        <span className="text-neutral-500 font-medium block">Reverse Courier Partner:</span>
                        <span className="font-bold">{returnCourier}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 font-medium block">Doorstep Pickup Location:</span>
                        <span className="font-semibold truncate block">
                          {details.shippingAddress.city ? `${details.shippingAddress.city}, PIN ${details.shippingAddress.pincode}` : 'Customer Delivery Address'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 5-Step Vertical Timeline */}
                  <div className="space-y-6 relative pl-1">
                    {/* Vertical Connected Line */}
                    <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-neutral-200" />

                    {/* Step 1: Return Requested */}
                    <div className="relative flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 font-bold text-xs bg-indigo-700 text-white shadow-xs">
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div className="font-sans pt-0.5">
                        <h4 className="text-xs font-bold tracking-[0.15em] text-black uppercase">1. RETURN REQUESTED</h4>
                        <span className="text-[9px] font-sans font-semibold tracking-[0.16em] uppercase block mt-0.5 text-indigo-700">
                          COMPLETED • REASON RECORDED
                        </span>
                      </div>
                    </div>

                    {/* Step 2: Return Approved & Courier Allocated */}
                    <div className="relative flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                        isReturnApproved || isReturnCollected || isReceivedAtUrvaah || isReturned
                          ? 'bg-indigo-700 text-white shadow-xs font-bold'
                          : 'bg-white border-2 border-neutral-300 text-neutral-400'
                      }`}>
                        {isReturnApproved || isReturnCollected || isReceivedAtUrvaah || isReturned ? (
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                      </div>
                      <div className="font-sans pt-0.5">
                        <h4 className={`text-xs font-bold tracking-[0.15em] uppercase ${
                          isReturnApproved || isReturnCollected || isReceivedAtUrvaah || isReturned
                            ? 'text-black'
                            : 'text-neutral-400'
                        }`}>
                          2. ATELIER APPROVED & COURIER ASSIGNED
                        </h4>
                        <span className={`text-[9px] font-sans font-medium tracking-[0.16em] uppercase block mt-0.5 ${
                          isReturnApproved || isReturnCollected || isReceivedAtUrvaah || isReturned
                            ? 'text-indigo-700 font-bold'
                            : 'text-neutral-400'
                        }`}>
                          {isReturnApproved || isReturnCollected || isReceivedAtUrvaah || isReturned
                            ? 'COMPLETED • REVERSE AWB ASSIGNED'
                            : 'UNDER REVIEW'}
                        </span>
                      </div>
                    </div>

                    {/* Step 3: Doorstep Courier Pickup from Customer */}
                    <div className="relative flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                        isReturnCollected || isReceivedAtUrvaah || isReturned
                          ? 'bg-indigo-700 text-white shadow-xs font-bold'
                          : isReturnApproved
                          ? 'bg-amber-500 text-white shadow-xs font-bold ring-4 ring-amber-100 animate-pulse'
                          : 'bg-white border-2 border-neutral-300 text-neutral-400'
                      }`}>
                        {isReturnCollected || isReceivedAtUrvaah || isReturned ? (
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        ) : (
                          <Truck className="w-4 h-4" />
                        )}
                      </div>
                      <div className="font-sans pt-0.5">
                        <h4 className={`text-xs font-bold tracking-[0.15em] uppercase ${
                          isReturnCollected || isReceivedAtUrvaah || isReturned || isReturnApproved
                            ? 'text-black'
                            : 'text-neutral-400'
                        }`}>
                          3. DOORSTEP COURIER PICKUP
                        </h4>
                        <span className={`text-[9px] font-sans font-medium tracking-[0.16em] uppercase block mt-0.5 ${
                          isReturnCollected || isReceivedAtUrvaah || isReturned
                            ? 'text-emerald-700 font-bold'
                            : isReturnApproved
                            ? 'text-amber-700 font-bold'
                            : 'text-neutral-400'
                        }`}>
                          {isReturnCollected || isReceivedAtUrvaah || isReturned
                            ? 'PARCEL COLLECTED FROM CUSTOMER'
                            : isReturnApproved
                            ? 'RIDER ASSIGNED FOR DOORSTEP PICKUP'
                            : 'PENDING'}
                        </span>
                      </div>
                    </div>

                    {/* Step 4: In Transit to Urvaah Atelier */}
                    <div className="relative flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                        isReceivedAtUrvaah || isReturned
                          ? 'bg-indigo-700 text-white shadow-xs font-bold'
                          : isReturnCollected
                          ? 'bg-indigo-600 text-white shadow-xs font-bold ring-4 ring-indigo-100 animate-pulse'
                          : 'bg-white border-2 border-neutral-300 text-neutral-400'
                      }`}>
                        {isReceivedAtUrvaah || isReturned ? (
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                      </div>
                      <div className="font-sans pt-0.5">
                        <h4 className={`text-xs font-bold tracking-[0.15em] uppercase ${
                          isReceivedAtUrvaah || isReturned || isReturnCollected
                            ? 'text-black'
                            : 'text-neutral-400'
                        }`}>
                          4. IN TRANSIT TO URVAAH ATELIER
                        </h4>
                        <span className={`text-[9px] font-sans font-medium tracking-[0.16em] uppercase block mt-0.5 ${
                          isReceivedAtUrvaah || isReturned
                            ? 'text-indigo-700 font-bold'
                            : isReturnCollected
                            ? 'text-indigo-600 font-bold'
                            : 'text-neutral-400'
                        }`}>
                          {isReceivedAtUrvaah || isReturned
                            ? 'ARRIVED AT ATELIER'
                            : isReturnCollected
                            ? 'IN TRANSIT'
                            : 'PENDING PICKUP'}
                        </span>
                      </div>
                    </div>

                    {/* Step 5: Restocked & Refund Completed */}
                    <div className="relative flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                        isReturned
                          ? 'bg-emerald-600 text-white shadow-xs font-bold'
                          : isReceivedAtUrvaah
                          ? 'bg-blue-600 text-white shadow-xs font-bold ring-4 ring-blue-100 animate-pulse'
                          : 'bg-white border-2 border-neutral-300 text-neutral-400'
                      }`}>
                        <PackageCheck className="w-4 h-4" />
                      </div>
                      <div className="font-sans pt-0.5">
                        <h4 className={`text-xs font-bold tracking-[0.15em] uppercase ${
                          isReturned ? 'text-emerald-700 font-bold' : isReceivedAtUrvaah ? 'text-blue-900 font-bold' : 'text-neutral-400'
                        }`}>
                          5. ATELIER VERIFICATION & REFUND
                        </h4>
                        <span className={`text-[9px] font-sans font-medium tracking-[0.16em] uppercase block mt-0.5 ${
                          isReturned ? 'text-emerald-700 font-bold' : isReceivedAtUrvaah ? 'text-blue-700 font-bold' : 'text-neutral-400'
                        }`}>
                          {isReturned
                            ? '100% FULL REFUND SETTLED'
                            : isReceivedAtUrvaah
                            ? 'RESTOCKED • REFUND DESK QUEUED'
                            : 'PENDING'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : isCancellationRequested ? (
                <div className="bg-white border border-amber-200/90 p-6 sm:p-8 rounded-xl shadow-xs">
                  <div className="flex items-center justify-between pb-3 mb-6 border-b border-amber-100">
                    <h3 className="text-xs font-serif tracking-[0.25em] uppercase text-amber-950 font-semibold flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      <span>CANCELLATION REVIEW JOURNEY</span>
                    </h3>
                    <span className="text-[10px] font-sans font-bold tracking-[0.16em] uppercase text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                      STEP 2 OF 4
                    </span>
                  </div>

                  <div className="mb-6 p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2 text-xs font-sans">
                    <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                      <span>Cancellation Under Atelier Review</span>
                    </span>
                    <p className="text-[11px] text-amber-900/90 leading-relaxed">
                      Your cancellation request has been received by our atelier concierge. Once reviewed and verified, the Shiprocket courier pickup will be voided and your refund will be queued.
                    </p>
                  </div>

                  <div className="space-y-6 relative pl-1">
                    <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-neutral-200" />

                    {/* Step 1: ORDER PLACED */}
                    <div className="relative flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 font-bold text-xs bg-neutral-900 text-white shadow-xs">
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div className="font-sans pt-0.5">
                        <h4 className="text-xs font-bold tracking-[0.15em] text-black uppercase">1. ORDER PLACED</h4>
                        <span className="text-[9px] font-sans font-semibold tracking-[0.16em] uppercase block mt-1 text-neutral-500">
                          PAYMENT CONFIRMED
                        </span>
                      </div>
                    </div>

                    {/* Step 2: CANCELLATION REQUESTED */}
                    <div className="relative flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 font-bold text-xs bg-amber-600 text-white shadow-xs">
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div className="font-sans pt-0.5">
                        <h4 className="text-xs font-bold tracking-[0.15em] text-black uppercase">2. CANCELLATION REQUESTED</h4>
                        <span className="text-[9px] font-sans font-semibold tracking-[0.16em] uppercase block mt-1 text-amber-700 font-bold">
                          COMPLETED • REASON RECORDED
                        </span>
                      </div>
                    </div>

                    {/* Step 3: ATELIER REVIEW & FREIGHT VOID */}
                    <div className="relative flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 bg-amber-500 text-white shadow-xs font-bold ring-4 ring-amber-100 animate-pulse">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="font-sans pt-0.5">
                        <h4 className="text-xs font-bold tracking-[0.15em] text-black uppercase">3. ATELIER REVIEW & DISPATCH VOID</h4>
                        <span className="text-[9px] font-sans font-medium tracking-[0.16em] uppercase block mt-1 text-amber-700 font-bold">
                          UNDER REVIEW BY ADMIN
                        </span>
                      </div>
                    </div>

                    {/* Step 4: REFUND DISBURSED */}
                    <div className="relative flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 bg-white border-2 border-neutral-300 text-neutral-400">
                        <RotateCcw className="w-4 h-4" />
                      </div>
                      <div className="font-sans pt-0.5">
                        <h4 className="text-xs font-bold tracking-[0.15em] text-neutral-400 uppercase">4. FINANCIAL SETTLEMENT</h4>
                        <span className="text-[9px] font-sans font-medium tracking-[0.16em] uppercase block mt-1 text-neutral-400">
                          PENDING APPROVAL
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-neutral-200/80 p-6 sm:p-8">
                  <h3 className="text-xs font-serif tracking-[0.25em] uppercase text-neutral-500 block mb-6 font-semibold pb-3 border-b border-neutral-200">
                    {isOrderCancelled ? 'CANCELLATION & SHIPROCKET LIFECYCLE' : 'ORDER JOURNEY'}
                  </h3>

                {isOrderCancelled ? (
                  <div className="space-y-6 relative pl-1">
                    {/* Connected Vertical Line */}
                    <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-neutral-200" />

                    {/* Step 1: ORDER PLACED */}
                    <div className="relative flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 font-bold text-xs bg-neutral-900 text-white shadow-xs">
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div className="font-sans pt-0.5">
                        <h4 className="text-xs font-bold tracking-[0.15em] text-black uppercase">ORDER PLACED</h4>
                        <span className="text-[9px] font-sans font-semibold tracking-[0.16em] uppercase block mt-1 text-neutral-500">
                          PAYMENT CONFIRMED
                        </span>
                      </div>
                    </div>

                    {/* Step 2: CANCELLED */}
                    <div className="relative flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 font-bold text-xs bg-red-600 text-white shadow-xs">
                        <X className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div className="font-sans pt-0.5">
                        <h4 className="text-xs font-bold tracking-[0.15em] text-red-700 uppercase">ORDER CANCELLED</h4>
                        <span className="text-[9px] font-sans font-semibold tracking-[0.16em] uppercase block mt-1 text-red-600">
                          PRE-DISPATCH VOID
                        </span>
                      </div>
                    </div>

                    {/* Step 3: SHIPROCKET VOIDED */}
                    <div className="relative flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 font-bold text-xs bg-neutral-900 text-white shadow-xs">
                        <Package className="w-4 h-4 stroke-[2]" />
                      </div>
                      <div className="font-sans pt-0.5">
                        <h4 className="text-xs font-bold tracking-[0.15em] text-black uppercase">SHIPROCKET VOIDED</h4>
                        <span className="text-[9px] font-sans font-semibold tracking-[0.16em] uppercase block mt-1 text-neutral-500">
                          PICKUP CANCELLED • ₹0 FREIGHT
                        </span>
                      </div>
                    </div>

                    {/* Step 4: REFUND COMPLETED */}
                    <div className="relative flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 font-bold text-xs bg-emerald-700 text-white shadow-xs">
                        <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <div className="font-sans pt-0.5">
                        <h4 className="text-xs font-bold tracking-[0.15em] text-emerald-800 uppercase">
                          {(details.paymentMethod || '').toLowerCase().includes('cod') ? 'COD SETTLED' : (isRefundCompleted ? 'REFUND COMPLETED' : 'REFUND ISSUED')}
                        </h4>
                        <span className="text-[9px] font-sans font-semibold tracking-[0.16em] uppercase block mt-1 text-emerald-700">
                          {(details.paymentMethod || '').toLowerCase().includes('cod') ? 'ZERO PAYMENT COLLECTED' : (isRefundCompleted ? '100% FULL REFUND DISBURSED' : '100% REFUND INITIATED')}
                        </span>
                        {details.refund_txn_id && (
                          <span className="text-[9px] font-mono font-semibold text-neutral-600 block mt-1 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                            UTR: {details.refund_txn_id}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 relative pl-1">
                    {/* Connected Vertical Line */}
                    <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-neutral-200" />

                    {/* Step 1: ORDER PLACED */}
                    <div className="relative flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 font-bold text-xs ${isShipped ? 'bg-brand-dark text-white' : 'bg-yellow-400 text-black shadow-xs'}`}>
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div className="font-sans pt-0.5">
                        <h4 className="text-xs font-bold tracking-[0.15em] text-black uppercase">
                          {isReplacementForwardOrder ? 'REPLACEMENT ORDER PLACED' : 'ORDER PLACED'}
                        </h4>
                        <span className={`text-[9px] font-sans font-semibold tracking-[0.16em] uppercase block mt-1 ${isShipped ? 'text-black' : 'text-yellow-700'}`}>
                          {isReplacementForwardOrder ? '100% EXCHANGE CREDIT APPLIED' : (isShipped ? 'COMPLETED' : 'IN PROGRESS')}
                        </span>
                      </div>
                    </div>

                    {/* Step 2: SHIPPED */}
                    <div className="relative flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${isShipped ? 'bg-brand-dark text-white shadow-xs font-bold' : 'bg-white border-2 border-neutral-300 text-neutral-400'}`}>
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="font-sans pt-0.5">
                        <h4 className={`text-xs font-bold tracking-[0.15em] uppercase ${isShipped ? 'text-black font-bold' : 'text-neutral-400'}`}>SHIPPED</h4>
                        <span className={`text-[9px] font-sans font-medium tracking-[0.16em] uppercase block mt-1 ${isShipped ? 'text-black font-bold' : 'text-neutral-400'}`}>
                          {isShipped ? 'COMPLETED' : 'PENDING'}
                        </span>
                      </div>
                    </div>

                    {/* Step 3: OUT FOR DELIVERY */}
                    <div className="relative flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${isOutForDelivery ? 'bg-brand-dark text-white shadow-xs font-bold' : 'bg-white border-2 border-neutral-300 text-neutral-400'}`}>
                        <Truck className="w-4 h-4" />
                      </div>
                      <div className="font-sans pt-0.5">
                        <h4 className={`text-xs font-bold tracking-[0.15em] uppercase ${isOutForDelivery ? 'text-black font-bold' : 'text-neutral-400'}`}>OUT FOR DELIVERY</h4>
                        <span className={`text-[9px] font-sans font-medium tracking-[0.16em] uppercase block mt-1 ${isOutForDelivery ? (isDelivered ? 'COMPLETED' : 'IN PROGRESS') : 'PENDING'}`}>
                          {isOutForDelivery ? (isDelivered ? 'COMPLETED' : 'IN PROGRESS') : 'PENDING'}
                        </span>
                      </div>
                    </div>

                    {/* Step 4: DELIVERED */}
                    <div className="relative flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${isDelivered ? 'bg-emerald-500 text-white shadow-xs font-bold' : 'bg-white border-2 border-neutral-300 text-neutral-400'}`}>
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="font-sans pt-0.5">
                        <h4 className={`text-xs font-bold tracking-[0.15em] uppercase ${isDelivered ? 'text-emerald-700 font-bold' : 'text-neutral-400'}`}>DELIVERED</h4>
                        <span className={`text-[9px] font-sans font-medium tracking-[0.16em] uppercase block mt-1 ${isDelivered ? 'text-emerald-700 font-bold' : 'text-neutral-400'}`}>
                          {isDelivered ? 'DELIVERED' : 'PENDING'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

              {/* Card 2: Order Status & Actions */}
              <div className="bg-white border border-neutral-200/80 p-6 sm:p-8 font-sans">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-200">
                  <h3 className="text-lg sm:text-xl font-serif tracking-[0.15em] uppercase text-black font-semibold">
                    ORDER STATUS
                  </h3>
                  {isInvoiceEligible ? (
                    <button
                      type="button"
                      onClick={handleDownloadInvoice}
                      className="inline-flex items-center gap-1.5 border border-neutral-300 hover:border-black text-brand-dark text-[10px] font-sans font-bold tracking-[0.2em] uppercase px-3 py-1.5 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>DOWNLOAD INVOICE</span>
                    </button>
                  ) : (
                    <span className="text-[10px] font-sans text-neutral-400 tracking-wider uppercase font-medium">
                      Invoice available on delivery
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-bold tracking-wider uppercase text-neutral-500">Current Status</span>
                  <div className="flex items-center gap-2">
                    {isOrderCancelled && (
                      <span className="px-2.5 py-1 font-sans text-[10px] font-semibold tracking-[0.16em] uppercase bg-neutral-900 text-white rounded-full">
                        SHIPROCKET VOIDED
                      </span>
                    )}
                    <span className={`px-2.5 py-1 font-sans text-[10px] font-semibold tracking-[0.16em] uppercase rounded-full ${
                      isCancellationRejected
                        ? 'bg-rose-700 text-white font-bold'
                      : isReturnQcRejected
                        ? 'bg-rose-700 text-white font-bold'
                      : isReturnRejected
                        ? 'bg-rose-700 text-white font-bold'
                      : isOrderCancelled
                        ? (isRefundCompleted ? 'bg-emerald-700 text-white font-bold' : 'bg-red-900 text-white font-bold')
                      : isCancellationRequested
                        ? 'bg-amber-600 text-white font-bold'
                      : isReplacementRequested
                        ? 'bg-purple-700 text-white font-bold'
                      : isReplacementApproved
                        ? 'bg-indigo-700 text-white font-bold'
                      : isReplacementInTransit
                        ? 'bg-blue-700 text-white font-bold'
                      : isReplaced
                        ? 'bg-emerald-700 text-white font-bold'
                      : isReplacementRejected
                        ? 'bg-rose-700 text-white'
                      : isReturnRequested
                        ? 'bg-amber-600 text-white font-bold'
                      : isReturnApproved
                        ? 'bg-indigo-600 text-white font-bold'
                      : isReceivedAtUrvaah
                        ? 'bg-blue-600 text-white font-bold'
                      : isReturned
                        ? 'bg-emerald-600 text-white font-bold'
                      : isDelivered
                        ? 'bg-emerald-600 text-white'
                      : isOutForDelivery
                        ? 'bg-blue-600 text-white'
                      : isShipped
                        ? 'bg-amber-500 text-black'
                        : 'bg-yellow-400 text-black'
                    }`}>
                      {isCancellationRejected
                        ? 'CANCELLATION REJECTED'
                        : isReturnQcRejected
                        ? 'RETURN REJECTED (QC FAILED)'
                        : isReturnRejected
                        ? 'RETURN REJECTED'
                        : isOrderCancelled
                        ? (isRefundCompleted ? 'CANCELLED & REFUNDED' : 'CANCELLED')
                        : isCancellationRequested
                        ? 'CANCELLATION REQUESTED'
                        : isReplacementRequested
                        ? 'REPLACEMENT REQUESTED'
                        : isReplacementApproved
                        ? 'REPLACEMENT APPROVED'
                        : isReplacementInTransit
                        ? 'REPLACEMENT IN TRANSIT'
                        : isReplaced
                        ? 'REPLACED'
                        : isReplacementRejected
                        ? 'REPLACEMENT REJECTED'
                        : isReturnRequested
                        ? 'RETURN REQUESTED'
                        : isReturnApproved
                        ? 'RETURN APPROVED'
                        : isReceivedAtUrvaah
                        ? 'RECEIVED AT URVAAH HOUSE'
                        : isReturned
                        ? 'RETURNED & REFUNDED'
                        : isDelivered
                        ? 'DELIVERED'
                        : isOutForDelivery
                        ? 'OUT FOR DELIVERY'
                        : isShipped
                        ? 'SHIPPED'
                        : (details.status || 'PROCESSING').toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Payment Method Container */}
                <div className="bg-[#FAF8F3] border border-neutral-200/80 p-4 mb-6 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-dark text-white flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="text-left font-sans">
                      <span className="text-[10px] tracking-[0.2em] uppercase text-neutral-400 font-bold block mb-0.5">
                        Payment Method
                      </span>
                      <span className="text-xs font-bold text-black uppercase tracking-wider">{details.paymentMethod}</span>
                    </div>
                  </div>
                  {/* Payment status badge for COD / Online */}
                  {(() => {
                    if (isReturnQcRejected || (isReturnRejected && (details.refund_status || '').toLowerCase() === 'cancelled')) {
                      return (
                        <span className="px-2.5 py-1 text-[10px] font-sans font-bold tracking-[0.16em] uppercase rounded-full border bg-rose-100 text-rose-900 border-rose-300">
                          REFUND CANCELLED
                        </span>
                      );
                    }
                    const isDeliveredOrderEver = isDelivered || Boolean(details.deliveredAt || details.delivered_at) || (details.original_status || '').toLowerCase() === 'delivered' || isInReturnFlow || isInReplacementFlow;
                    const isCod = (details.paymentMethod || '').toLowerCase().includes('cash') || (details.paymentMethod || '').toLowerCase().includes('cod');
                    const isPaid = (isDeliveredOrderEver && isCod) || (details.paymentStatus || details.payment_status || '').toLowerCase() === 'paid';
                    if (isOrderCancelled && isCod && !isPaid) {
                      return null;
                    }
                    return (
                      <span className={`px-2.5 py-1 text-[10px] font-sans font-bold tracking-[0.16em] uppercase rounded-full border ${
                        isPaid ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-neutral-100 text-neutral-700 border-neutral-300'
                      }`}>
                        {isPaid ? 'PAID' : 'PENDING'}
                      </span>
                    );
                  })()}
                </div>

                {/* Action Buttons Stack (Luxury Atelier Button Theme) */}
                <div className="space-y-3">
                  <Link
                    to="/account?tab=VIEW ORDERS"
                    state={{ tab: 'VIEW ORDERS' }}
                    className="w-full block bg-white border border-neutral-300 text-black text-xs font-sans font-bold tracking-[0.25em] uppercase px-8 py-3.5 hover:border-black transition-colors text-center"
                  >
                    VIEW ORDER HISTORY
                  </Link>

                  <Link
                    to="/"
                    className="w-full block border border-neutral-300 text-brand-dark text-xs font-sans font-bold tracking-[0.25em] uppercase px-8 py-4 hover:border-black transition-colors text-center"
                  >
                    CONTINUE SHOPPING
                  </Link>

                  {/* Pre-Dispatch Cancel Order Button (cannot cancel once shipped, out for delivery, or if cancellation was already rejected) */}
                  {!isDelivered && !isShipped && !isOutForDelivery && !isOrderCancelled && !isCancellationRequested && !isCancellationRejected && !isInReturnFlow && !isInReplacementFlow && !isReplacementForwardOrder && (
                    <button
                      type="button"
                      onClick={handleCancelOrder}
                      className="w-full py-3.5 px-4 border border-neutral-900 bg-[#dcdcdc] hover:bg-[#d0d0d0] text-xs font-sans font-bold tracking-[0.25em] uppercase text-neutral-900 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>CANCEL ORDER</span>
                    </button>
                  )}

                  {/* Post-Delivery Unified Return / Replace Button */}
                  {isDelivered && !isOrderCancelled && !isCancellationRequested && !isInReturnFlow && !isInReplacementFlow && !isReturnRejected && !isReturnQcRejected && (
                    <button
                      type="button"
                      onClick={handleOpenReturnReplaceChoice}
                      className="w-full py-3.5 px-4 border border-neutral-900 bg-white hover:bg-neutral-900 text-neutral-900 hover:text-white text-xs font-sans font-bold tracking-[0.25em] uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs group"
                    >
                      <RotateCcw className="w-4 h-4 text-neutral-600 group-hover:text-white transition-colors" />
                      <span>RETURN / REPLACE PRODUCT</span>
                    </button>
                  )}

                  {/* Post-Delivery Give Feedback Button */}
                  {!isOrderCancelled && !isCancellationRequested && isDelivered && (
                    <button
                      type="button"
                      onClick={() => {
                        const items = details?.items || placedOrderDetails?.items || [];
                        if (!items || items.length === 0) return;

                        if (items.length === 1) {
                          const item = items[0];
                          const prodId = item?.product_id || item?.productId || (item?.product && (item.product.id || item.product.product_id)) || item?.id;
                          if (prodId) {
                            navigate(getProductUrl(prodId, 'openReview=true#customer-reviews'));
                          }
                          return;
                        }

                        // For multi-item orders, show a clean modal to select which product to review
                        Swal.fire({
                          title: 'SELECT PRODUCT TO REVIEW',
                          text: 'Which piece from your delivered order would you like to review?',
                          html: `
                            <div class="space-y-2.5 mt-4 text-left font-sans">
                              ${items.map((it, idx) => {
                                const pid = it.product_id || it.productId || (it.product && (it.product.id || it.product.product_id)) || it.id;
                                const pName = it.name || it.product_name || `Product #${idx + 1}`;
                                const pImg = it.image || it.image_url || '/assets/Images/Blue01.png';
                                return `
                                  <button type="button" class="swal-feedback-item-btn w-full p-2.5 flex items-center gap-3 border border-neutral-200 hover:border-black rounded-xl transition-all cursor-pointer bg-white hover:bg-neutral-50 text-left shadow-2xs" data-prod-id="${pid}">
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
                            const btns = document.querySelectorAll('.swal-feedback-item-btn');
                            btns.forEach(btn => {
                              btn.addEventListener('click', () => {
                                const targetPid = btn.getAttribute('data-prod-id');
                                Swal.close();
                                if (targetPid) {
                                  navigate(getProductUrl(targetPid, 'openReview=true#customer-reviews'));
                                }
                              });
                            });
                          }
                        });
                      }}
                      className="w-full py-3.5 px-4 border border-black text-white bg-black hover:bg-neutral-800 text-xs font-sans font-bold tracking-[0.25em] uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span>GIVE FEEDBACK</span>
                    </button>
                  )}

                  {/* Replacement Requested Status Pill */}
                  {isReplacementRequested && (
                    <div className="w-full py-3 px-4 bg-purple-50 border border-purple-200 text-purple-900 text-xs font-sans font-bold tracking-[0.15em] uppercase flex items-center justify-center gap-2 text-center">
                      <Clock className="w-4 h-4 text-purple-700" />
                      <span>Replacement Pending Atelier Review</span>
                    </div>
                  )}

                  {/* Replacement Approved Status Pill */}
                  {isReplacementApproved && (
                    <div className="w-full py-3 px-4 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-sans font-bold tracking-[0.15em] uppercase flex items-center justify-center gap-2 text-center">
                      <CheckCircle2 className="w-4 h-4 text-indigo-700" />
                      <span>Replacement Approved • Exchange In Motion</span>
                    </div>
                  )}

                  {/* Replacement In Transit Status Pill */}
                  {(isReplacementInTransit || isReplacementOutForDelivery) && (
                    <div className="w-full py-3 px-4 bg-blue-50 border border-blue-200 text-blue-900 text-xs font-sans font-bold tracking-[0.15em] uppercase flex items-center justify-center gap-2 text-center">
                      <Truck className="w-4 h-4 text-blue-700 animate-pulse" />
                      <span>Replacement Order In Transit</span>
                    </div>
                  )}

                  {/* Product Replaced Completed Pill */}
                  {isReplaced && (
                    <div className="w-full py-3 px-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-sans font-bold tracking-[0.15em] uppercase flex items-center justify-center gap-2 text-center">
                      <PackageCheck className="w-4 h-4 text-emerald-700" />
                      <span>Product Replacement Completed</span>
                    </div>
                  )}

                  {/* Replacement Rejected Pill */}
                  {isReplacementRejected && (
                    <div className="w-full py-3 px-4 bg-rose-50 border border-rose-200 text-rose-900 text-xs font-sans font-bold tracking-[0.15em] uppercase flex items-center justify-center gap-2 text-center">
                      <AlertCircle className="w-4 h-4 text-rose-700" />
                      <span>Replacement Not Approved</span>
                    </div>
                  )}

                  {/* Pre-Delivery Cancelled Pill */}
                  {isOrderCancelled && (
                    <div className={`w-full py-3 px-4 border text-xs font-sans font-bold tracking-[0.15em] uppercase flex items-center justify-center gap-2 text-center ${
                      isRefundCompleted
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-red-50 border-red-200 text-red-900'
                    }`}>
                      {isRefundCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-700" /> : <XCircle className="w-4 h-4 text-red-700" />}
                      <span>{isRefundCompleted ? 'Order Cancelled & Refund Completed' : 'Order Cancelled'}</span>
                    </div>
                  )}

                  {/* Pre-Delivery Cancellation Review Pill */}
                  {isCancellationRequested && (
                    <div className="w-full py-3 px-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-sans font-bold tracking-[0.15em] uppercase flex items-center justify-center gap-2 text-center">
                      <Clock className="w-4 h-4 text-amber-700" />
                      <span>Cancellation Pending Admin Approval</span>
                    </div>
                  )}

                  {/* Pre-Delivery Cancellation Rejected Pill */}
                  {isCancellationRejected && (
                    <div className="w-full py-3 px-4 bg-rose-50 border border-rose-200 text-rose-900 text-xs font-sans font-bold tracking-[0.15em] uppercase flex items-center justify-center gap-2 text-center">
                      <XCircle className="w-4 h-4 text-rose-700" />
                      <span>Cancellation Request Rejected by Admin</span>
                    </div>
                  )}

                  {/* Post-Delivery Return Requested */}
                  {isReturnRequested && (
                    <div className="w-full py-3 px-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-sans font-bold tracking-[0.15em] uppercase flex items-center justify-center gap-2 text-center">
                      <Clock className="w-4 h-4 text-amber-700" />
                      <span>Return Pending Admin Approval</span>
                    </div>
                  )}

                  {/* Post-Delivery Return Approved */}
                  {isReturnApproved && (
                    <div className="w-full py-3 px-4 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-sans font-bold tracking-[0.15em] uppercase flex items-center justify-center gap-2 text-center">
                      <Truck className="w-4 h-4 text-indigo-700" />
                      <span>Return In Transit To House of Urvaah</span>
                    </div>
                  )}

                  {/* Post-Delivery Received at House of Urvaah */}
                  {isReceivedAtUrvaah && (
                    <div className="w-full py-3 px-4 bg-blue-50 border border-blue-200 text-blue-900 text-xs font-sans font-bold tracking-[0.15em] uppercase flex items-center justify-center gap-2 text-center">
                      <PackageCheck className="w-4 h-4 text-blue-700" />
                      <span>Delivered to House of Urvaah • Refund Desk Queued</span>
                    </div>
                  )}

                  {/* Post-Delivery Returned */}
                  {isReturned && (
                    <div className="w-full py-3 px-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-sans font-bold tracking-[0.15em] uppercase flex items-center justify-center gap-2 text-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>Return Completed & Refund Disbursed</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Haute Couture Official Invoice Modal */}
        <InvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          order={details}
          orderId={details.orderNumber}
        />

        {/* Atelier Cancel Order Modal with Reason Selection */}
        <AnimatePresence>
          {isCancelOrderModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 selection:bg-red-500 font-sans">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isCancellingOrder && setIsCancelOrderModalOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              />

              {/* Modal Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="relative z-10 w-full max-w-lg bg-white shadow-2xl p-6 sm:p-8 border border-neutral-200 max-h-[90vh] overflow-y-auto no-scrollbar scrollbar-none text-left"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsCancelOrderModalOpen(false)}
                  disabled={isCancellingOrder}
                  className="absolute top-5 right-5 p-1 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer disabled:opacity-50"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4 stroke-[2]" />
                </button>

                {/* Header */}
                <div className="mb-5">
                  <span className="text-[10px] font-serif tracking-[0.25em] text-neutral-400 uppercase block mb-1">
                    HOUSE OF URVAAH
                  </span>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full border border-red-200 bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                      <XCircle className="w-4 h-4" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-serif tracking-[0.12em] uppercase text-neutral-900 font-semibold">
                      CANCEL ORDER
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-500 font-sans mt-2 leading-relaxed">
                    We're sorry to see you cancel order #{details.orderNumber}. Please select a reason below so we can process your request.
                  </p>
                </div>

                <form onSubmit={handleConfirmCancellation} className="space-y-4">
                  {cancelOrderError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{cancelOrderError}</span>
                    </div>
                  )}

                  {/* Reason for Cancellation */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
                      Reason for Cancellation <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={cancelOrderReason}
                        onChange={(e) => setCancelOrderReason(e.target.value)}
                        required
                        className="w-full appearance-none px-3.5 py-2.5 bg-white border border-neutral-300 text-xs sm:text-sm text-neutral-800 focus:outline-none focus:border-black cursor-pointer pr-10 font-sans"
                      >
                        {isDelivered ? (
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
                    <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
                      Additional Comments / Feedback (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={cancelOrderComments}
                      onChange={(e) => setCancelOrderComments(e.target.value)}
                      placeholder="Please share any additional details to help us improve..."
                      className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 text-xs sm:text-sm text-neutral-800 focus:outline-none focus:border-black font-sans resize-none"
                    />
                  </div>

                  {/* Bank Details for Refund Disbursement (Prepaid Orders & Post-Delivery Returns) */}
                  {requiresBankDetails && (
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

                      <p className="text-[11px] text-neutral-600 leading-relaxed font-sans">
                        Please verify your bank details so our finance desk can disburse your full refund of{' '}
                        <strong className="text-neutral-900 font-bold">
                          ₹{Number(details?.total || details?.total_amount || placedOrderDetails?.total || 0).toLocaleString('en-IN')}
                        </strong>{' '}
                        directly via secure IMPS / NEFT transfer upon cancellation approval.
                      </p>

                      {/* Saved Bank Details Card View */}
                      {cancelBankDetails.accountNumber && !isEditingCancelBank ? (
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
                                {cancelBankDetails.holderName || user?.name || details?.shippingAddress?.name || 'Account Holder'}
                              </div>
                              <div className="text-xs text-neutral-600 font-mono flex flex-wrap items-center gap-x-4 gap-y-1">
                                <span>
                                  A/C: •••• •••• •••• {String(cancelBankDetails.accountNumber).slice(-4)}
                                </span>
                                <span>
                                  IFSC: <span className="font-bold uppercase text-neutral-800">{cancelBankDetails.ifscCode}</span>
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
                                setCancelBankDetails(prev => ({
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
                          {cancelBankDetails.accountNumber && isEditingCancelBank && (
                            <div className="flex items-center justify-between pb-1">
                              <span className="text-[11px] text-neutral-700 font-bold uppercase tracking-wider">
                                Update Bank Account Details:
                              </span>
                              <button
                                type="button"
                                onClick={() => setIsEditingCancelBank(false)}
                                className="text-[11px] font-semibold text-neutral-600 hover:text-black uppercase tracking-wider cursor-pointer"
                              >
                                Use Saved Details
                              </button>
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
                                value={cancelBankDetails.holderName}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^a-zA-Z\s.]/g, '');
                                  setCancelBankDetails(prev => ({ ...prev, holderName: val }));
                                  setCancelOrderError('');
                                }}
                                placeholder="e.g. Aditi Sharma"
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs bg-white text-neutral-800 focus:outline-none focus:border-amber-500 font-sans"
                              />
                              <span className="text-[10px] text-neutral-400 mt-1 block font-sans">
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
                                value={cancelBankDetails.ifscCode}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 11);
                                  setCancelBankDetails(prev => ({ ...prev, ifscCode: val }));
                                  setCancelOrderError('');
                                }}
                                placeholder="e.g. HDFC0008718"
                                className={`w-full px-3 py-2 border rounded-lg text-xs bg-white text-neutral-800 uppercase focus:outline-none font-mono ${
                                  cancelBankDetails.ifscCode?.length === 11 && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(cancelBankDetails.ifscCode)
                                    ? 'border-emerald-500 bg-emerald-50/20'
                                    : cancelBankDetails.ifscCode?.length >= 5 && cancelBankDetails.ifscCode[4] !== '0'
                                    ? 'border-red-400 bg-red-50/20'
                                    : 'border-neutral-300 focus:border-amber-500'
                                }`}
                              />
                              <span className={`text-[10px] mt-1 block font-sans ${
                                cancelBankDetails.ifscCode?.length === 11 && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(cancelBankDetails.ifscCode)
                                  ? 'text-emerald-700 font-medium'
                                  : cancelBankDetails.ifscCode?.length >= 5 && cancelBankDetails.ifscCode[4] !== '0'
                                  ? 'text-red-600 font-medium'
                                  : 'text-neutral-400'
                              }`}>
                                {cancelBankDetails.ifscCode?.length === 11 && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(cancelBankDetails.ifscCode)
                                  ? '✓ Valid IFSC format'
                                  : cancelBankDetails.ifscCode?.length >= 5 && cancelBankDetails.ifscCode[4] !== '0'
                                  ? '⚠ 5th character must be 0 (zero)'
                                  : cancelBankDetails.ifscCode?.length > 0
                                  ? `${cancelBankDetails.ifscCode.length}/11 characters (e.g. HDFC0008718)`
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
                                value={cancelBankDetails.accountNumber}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '').slice(0, 18);
                                  setCancelBankDetails(prev => ({ ...prev, accountNumber: val }));
                                  setCancelOrderError('');
                                }}
                                placeholder="e.g. 50100234567890"
                                className={`w-full px-3 py-2 border rounded-lg text-xs bg-white text-neutral-800 focus:outline-none font-mono ${
                                  cancelBankDetails.accountNumber?.length >= 9 && cancelBankDetails.accountNumber?.length <= 18
                                    ? 'border-emerald-500 bg-emerald-50/20'
                                    : cancelBankDetails.accountNumber?.length > 0
                                    ? 'border-amber-400'
                                    : 'border-neutral-300 focus:border-amber-500'
                                }`}
                              />
                              <span className={`text-[10px] mt-1 block font-sans ${
                                cancelBankDetails.accountNumber?.length >= 9 && cancelBankDetails.accountNumber?.length <= 18
                                  ? 'text-emerald-700 font-medium'
                                  : 'text-neutral-400'
                              }`}>
                                {cancelBankDetails.accountNumber?.length >= 9 && cancelBankDetails.accountNumber?.length <= 18
                                  ? `✓ Valid account number (${cancelBankDetails.accountNumber.length} digits)`
                                  : cancelBankDetails.accountNumber?.length > 0
                                  ? `${cancelBankDetails.accountNumber.length}/18 digits (minimum 9 digits)`
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
                                value={cancelBankDetails.confirmAccountNumber}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '').slice(0, 18);
                                  setCancelBankDetails(prev => ({ ...prev, confirmAccountNumber: val }));
                                  setCancelOrderError('');
                                }}
                                placeholder="Re-enter same account number"
                                className={`w-full px-3 py-2 border rounded-lg text-xs bg-white text-neutral-800 focus:outline-none font-mono ${
                                  cancelBankDetails.confirmAccountNumber && cancelBankDetails.confirmAccountNumber === cancelBankDetails.accountNumber
                                    ? 'border-emerald-500 bg-emerald-50/20'
                                    : cancelBankDetails.confirmAccountNumber
                                    ? 'border-red-400 bg-red-50/20'
                                    : 'border-neutral-300 focus:border-amber-500'
                                }`}
                              />
                              <span className={`text-[10px] mt-1 block font-sans ${
                                cancelBankDetails.confirmAccountNumber && cancelBankDetails.confirmAccountNumber === cancelBankDetails.accountNumber
                                  ? 'text-emerald-700 font-medium'
                                  : cancelBankDetails.confirmAccountNumber
                                  ? 'text-red-600 font-medium'
                                  : 'text-neutral-400'
                              }`}>
                                {cancelBankDetails.confirmAccountNumber && cancelBankDetails.confirmAccountNumber === cancelBankDetails.accountNumber
                                  ? '✓ Account numbers match'
                                  : cancelBankDetails.confirmAccountNumber
                                  ? '⚠ Numbers do not match'
                                  : 'Re-enter same account number'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Policy Info Note */}
                  <div className="p-3 bg-[#FAF8F3] border border-neutral-200 text-[11px] text-neutral-600 leading-relaxed font-sans">
                    {isDelivered
                      ? 'Once submitted, your post-delivery cancellation request will be reviewed by our team. Upon approval, reverse pickup will be scheduled and your refund processed via the Refund Desk.'
                      : requiresBankDetails
                      ? 'Once submitted, your cancellation will be processed by our team. Your prepaid refund will be disbursed directly to your verified bank account via secure IMPS / NEFT transfer.'
                      : 'Once submitted, your cancellation request will be reviewed and processed by our team.'}
                  </div>

                  {/* Buttons Stack */}
                  <div className="pt-2 flex flex-col-reverse sm:flex-row gap-2.5">
                    <button
                      type="button"
                      disabled={isCancellingOrder}
                      onClick={() => setIsCancelOrderModalOpen(false)}
                      className="w-full sm:w-1/2 py-3 border border-neutral-300 text-neutral-800 text-xs font-bold tracking-[0.2em] uppercase hover:border-black transition-colors cursor-pointer text-center disabled:opacity-50"
                    >
                      KEEP ORDER
                    </button>
                    <button
                      type="submit"
                      disabled={isCancellingOrder}
                      className="w-full sm:w-1/2 py-3 bg-red-600 text-white text-xs font-bold tracking-[0.2em] uppercase hover:bg-red-700 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      {isCancellingOrder ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>SUBMITTING...</span>
                        </>
                      ) : (
                        <span>SUBMIT CANCELLATION</span>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Atelier Granular Multi-Item Return & Exchange Modal */}
        <AnimatePresence>
          {isItemReturnModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 font-sans text-left">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isSubmittingItemReturn && setIsItemReturnModalOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              />

              {/* Modal Box */}
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
                      HOUSE OF URVAAH ATELIER • RETURNS & EXCHANGES
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
                      Choose an action for each garment in Order #{details?.orderNumber || placedOrderNumber}.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsItemReturnModalOpen(false)}
                    disabled={isSubmittingItemReturn}
                    className="p-1.5 text-neutral-400 hover:text-black rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Scrollable Body */}
                <form onSubmit={handleConfirmItemReturn} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 no-scrollbar scrollbar-none">
                  {itemReturnError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{itemReturnError}</span>
                    </div>
                  )}

                  {/* Items List */}
                  {(() => {
                    const currentOrder = details || placedOrderDetails;
                    const allItems = details?.items || placedOrderDetails?.items || [];
                    const gstInfo = getOrderGstInfo(currentOrder);
                    const isSingle = allItems.length === 1;

                    return (
                      <div className="space-y-3">
                        <span className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider block">
                          Select Action Per Product ({allItems.length} items)
                        </span>

                        {allItems.map((item, idx) => {
                          const itemKey = item.id || item.product_id || idx;
                          const currentState = itemActionsState[itemKey] || {
                            action: allItems.length <= 1 ? 'Return' : 'Keep',
                            reason: 'Size or fit issue',
                            replacementSize: item.size || 'M'
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
                                    <p className="font-bold text-neutral-900 truncate">{item.name || item.title || 'Atelier Item'}</p>
                                    <p className="text-[11px] text-neutral-500">
                                      Size: <strong className="text-neutral-800">{item.size || 'M'}</strong> • Qty: {breakdown.qty}
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
                                        Refund of ₹{breakdown.totalWithTax.toLocaleString('en-IN')}{breakdown.taxAmount > 0 ? ` (including ₹${breakdown.taxAmount.toLocaleString('en-IN')} GST)` : ''} will be credited upon doorstep collection & atelier QC.
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
                    const currentOrder = details || placedOrderDetails;
                    const currentItems = details?.items || placedOrderDetails?.items || [];
                    const gstInfo = getOrderGstInfo(currentOrder);
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
                    const currentOrder = details || placedOrderDetails;
                    const currentItems = details?.items || placedOrderDetails?.items || [];
                    const hasReturn = currentItems.some(it => itemActionsState[it.id || it.product_id]?.action === 'Return');

                    if (!hasReturn) return null;

                    const gstInfo = getOrderGstInfo(currentOrder);
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
                                {returnBankDetails.holderName || user?.name || details?.shippingAddress?.name || 'Account Holder'}
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
                                onClick={handleSaveReturnBank}
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

                              {(returnBankDetails.accountNumber || savedBankDetailsSnapshot?.accountNumber) && (
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
                      Additional Notes for Atelier Concierge (Optional)
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
                      onClick={() => setIsItemReturnModalOpen(false)}
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

        {/* Atelier Edit Shipping Address Modal (24-Hour Edit Window) */}
        <AnimatePresence>
          {isEditAddressModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 selection:bg-neutral-800 selection:text-white font-sans">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isSavingAddress && handleCloseEditAddressModal()}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              />

              {/* Modal Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="relative z-10 w-full max-w-lg bg-white shadow-2xl p-6 sm:p-8 border border-neutral-200 max-h-[90vh] overflow-y-auto no-scrollbar scrollbar-none text-left"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={handleCloseEditAddressModal}
                  disabled={isSavingAddress}
                  className="absolute top-5 right-5 p-1 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer disabled:opacity-50"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4 stroke-[2]" />
                </button>

                {/* Header */}
                <div className="mb-5">
                  <span className="text-[10px] font-serif tracking-[0.25em] text-neutral-400 uppercase block mb-1">
                    HOUSE OF URVAAH ATELIER
                  </span>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full border border-neutral-300 bg-neutral-100 text-neutral-900 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-serif tracking-[0.12em] uppercase text-neutral-900 font-semibold">
                      EDIT SHIPPING ADDRESS
                    </h3>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="text-[10px] font-sans font-bold tracking-wider uppercase text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-amber-600" />
                      <span>24-Hour Edit Window Active ({hoursRemaining}h left)</span>
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 font-sans mt-2 leading-relaxed">
                    Update the recipient and delivery destination for Order #{details.orderNumber}. Ensure your PIN code and phone number are accurate for prompt dispatch.
                  </p>
                </div>

                {addressEditError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{addressEditError}</span>
                  </div>
                )}

                <form onSubmit={handleSaveShippingAddress} className="space-y-4">
                  {/* Recipient Full Name */}
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider uppercase text-neutral-700 mb-1">
                      Recipient Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addressEditForm.name}
                      onChange={(e) => setAddressEditForm({ ...addressEditForm, name: e.target.value })}
                      placeholder=""
                      required
                      className="w-full px-3.5 py-2.5 border border-neutral-300 rounded text-xs focus:outline-none focus:border-black font-sans"
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider uppercase text-neutral-700 mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-500 font-sans">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={addressEditForm.phone}
                        onChange={(e) => setAddressEditForm({ ...addressEditForm, phone: e.target.value.replace(/\D/g, '') })}
                        placeholder="10-digit mobile number"
                        required
                        className="w-full pl-12 pr-3.5 py-2.5 border border-neutral-300 rounded text-xs focus:outline-none focus:border-black font-sans"
                      />
                    </div>
                  </div>

                  {/* Street Address */}
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider uppercase text-neutral-700 mb-1">
                      Address (Flat / Building / Street) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={addressEditForm.street}
                      onChange={(e) => setAddressEditForm({ ...addressEditForm, street: e.target.value })}
                      placeholder="Flat 402, Lotus Residency, MG Road"
                      required
                      className="w-full px-3.5 py-2.5 border border-neutral-300 rounded text-xs focus:outline-none focus:border-black font-sans resize-none"
                    />
                  </div>

                  {/* City and State */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold tracking-wider uppercase text-neutral-700 mb-1">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={addressEditForm.city}
                        onChange={(e) => setAddressEditForm({ ...addressEditForm, city: e.target.value })}
                        placeholder="e.g. Mumbai"
                        required
                        className="w-full px-3.5 py-2.5 border border-neutral-300 rounded text-xs focus:outline-none focus:border-black font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold tracking-wider uppercase text-neutral-700 mb-1">
                        State <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={addressEditForm.state}
                        onChange={(e) => setAddressEditForm({ ...addressEditForm, state: e.target.value })}
                        required
                        className="w-full px-3.5 py-2.5 border border-neutral-300 rounded text-xs focus:outline-none focus:border-black font-sans bg-white"
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* PIN Code */}
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider uppercase text-neutral-700 mb-1">
                      PIN Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={addressEditForm.pincode}
                      onChange={(e) => setAddressEditForm({ ...addressEditForm, pincode: e.target.value.replace(/\D/g, '') })}
                      placeholder="6-digit PIN code"
                      required
                      className="w-full px-3.5 py-2.5 border border-neutral-300 rounded text-xs focus:outline-none focus:border-black font-sans"
                    />
                  </div>

                  {/* Policy Info Note */}
                  <div className="p-3 bg-[#FAF8F3] border border-neutral-200 text-[11px] text-neutral-600 leading-relaxed font-sans">
                    Address updates are permitted for up to 24 hours from when the order was placed. Once dispatched by our atelier logistics team, routing changes cannot be applied.
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex flex-col-reverse sm:flex-row gap-2.5">
                    <button
                      type="button"
                      disabled={isSavingAddress}
                      onClick={handleCloseEditAddressModal}
                      className="w-full sm:w-1/2 py-3 border border-neutral-300 text-neutral-800 text-xs font-bold tracking-[0.2em] uppercase hover:border-black transition-colors cursor-pointer text-center disabled:opacity-50"
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingAddress}
                      className="w-full sm:w-1/2 py-3 bg-black text-white text-xs font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      {isSavingAddress ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>SAVING...</span>
                        </>
                      ) : (
                        <span>UPDATE ADDRESS</span>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
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

        {/* Floating Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`fixed bottom-6 right-6 z-[100] max-w-sm sm:max-w-md w-[calc(100%-3rem)] sm:w-auto px-5 py-3.5 rounded-xl shadow-2xl backdrop-blur-md flex items-center justify-between gap-4 font-sans border text-white ${
                toast.type === 'error'
                  ? 'bg-neutral-950/95 border-rose-900/60 shadow-rose-950/30'
                  : toast.type === 'success'
                  ? 'bg-neutral-950/95 border-emerald-900/60 shadow-emerald-950/30'
                  : 'bg-neutral-950/95 border-neutral-800 shadow-black/40'
              }`}
            >
              <div className="flex items-center gap-3">
                {toast.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                ) : toast.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <ShoppingBag className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span className="text-xs sm:text-sm font-light tracking-wide text-neutral-200 leading-snug">
                  {toast.message}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="text-neutral-400 hover:text-white transition-colors p-1 cursor-pointer shrink-0 ml-2"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TWO-COLUMN CHECKOUT LAYOUT */}
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* LEFT COLUMN: Main Form Area (Contact, Shipping, Payment, Billing) */}
          <div className="lg:col-span-7 space-y-4 font-sans">

            {/* 1. CONTACT SECTION */}
            <section className="bg-neutral-50/70 p-5 sm:p-6 border border-neutral-200/80">
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-neutral-200">
                <h2 className="text-base sm:text-lg font-serif tracking-[0.15em] uppercase text-black font-medium flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-dark text-white text-xs flex items-center justify-center font-sans font-bold">
                    1
                  </span>
                  CONTACT INFORMATION
                </h2>
                <span className="text-[10px] font-sans font-semibold tracking-[0.16em] uppercase text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5">
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
            <section className="bg-neutral-50/70 p-5 sm:p-6 border border-neutral-200/80">
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-neutral-200">
                <h2 className="text-base sm:text-lg font-serif tracking-[0.15em] uppercase text-black font-medium flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-dark text-white text-xs flex items-center justify-center font-sans font-bold">
                    2
                  </span>
                  DELIVERY ADDRESS
                </h2>
                {addresses.length > 0 && !showNewAddressForm && (
                  <button
                    type="button"
                    onClick={() => {
                      if (addresses.length >= 4) {
                        showToast('Maximum 4 delivery addresses allowed. Please select or edit an existing address.', 'error');
                        return;
                      }
                      setNewShippingForm({
                        fullName: user?.name || '',
                        phone: user?.phone || '',
                        street: '',
                        city: '',
                        state: '',
                        pincode: '',
                        country: 'India',
                        type: 'Home',
                      });
                      setNewAddressErrors({});
                      setShowNewAddressForm(true);
                    }}
                    disabled={addresses.length >= 4}
                    className={`text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 transition-colors ${
                      addresses.length >= 4
                        ? 'text-neutral-400 cursor-not-allowed'
                        : 'text-brand-dark hover:underline cursor-pointer'
                    }`}
                    title={addresses.length >= 4 ? 'Maximum 4 addresses reached' : 'Add New Address'}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>ADD NEW ADDRESS {addresses.length >= 4 ? '(4/4 MAX)' : `(${addresses.length}/4)`}</span>
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
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 bg-neutral-100 text-[10px] font-bold tracking-widest uppercase text-neutral-700">
                                {addr.type || 'HOME'}
                              </span>
                              {addr.isDefault && (
                                <span className="px-2 py-0.5 bg-neutral-900 text-white text-[10px] font-bold tracking-widest uppercase">
                                  DEFAULT
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditAddressOnCheckout(idx);
                                }}
                                className="text-neutral-400 hover:text-black p-1 cursor-pointer transition-colors"
                                title="Edit Address"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              {isSelected && (
                                <span className="flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-emerald-800">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> SELECTED
                                </span>
                              )}
                            </div>
                          </div>
                          <h4 className="text-xs font-bold text-neutral-900 mb-1">{addr.name}</h4>
                          <p className="text-xs text-neutral-600 leading-relaxed">
                            {addr.street}
                            <br />
                            {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                          <p className="text-[11px] text-neutral-500 font-sans font-medium mt-2">
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
                        className={`w-full px-3.5 py-2.5 bg-white border ${
                          newAddressErrors.fullName ? 'border-red-500' : 'border-neutral-300'
                        } focus:border-brand-dark focus:ring-1 focus:ring-brand-dark outline-none text-sm`}
                        placeholder="e.g. Ananya Sharma"
                      />
                      {newAddressErrors.fullName && (
                        <p className="text-[10px] text-red-600 mt-0.5">{newAddressErrors.fullName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block font-semibold tracking-wider text-neutral-700 uppercase mb-1">
                        PHONE NUMBER *
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={newShippingForm.phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setNewShippingForm({ ...newShippingForm, phone: val });
                          if (val.length > 0 && val.length !== 10) {
                            setNewAddressErrors((prev) => ({ ...prev, phone: 'Phone number must be exactly 10 digits.' }));
                          } else {
                            setNewAddressErrors((prev) => ({ ...prev, phone: null }));
                          }
                        }}
                        className={`w-full px-3.5 py-2.5 bg-white border ${
                          newAddressErrors.phone ? 'border-red-500' : 'border-neutral-300'
                        } focus:border-brand-dark focus:ring-1 focus:ring-brand-dark outline-none text-sm`}
                        placeholder="+91 XXXXX XXXXX"
                      />
                      {newAddressErrors.phone && (
                        <p className="text-[10px] text-red-600 mt-0.5">{newAddressErrors.phone}</p>
                      )}
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
                      className={`w-full px-3.5 py-2.5 bg-white border ${
                        newAddressErrors.street ? 'border-red-500' : 'border-neutral-300'
                      } focus:border-brand-dark focus:ring-1 focus:ring-brand-dark outline-none text-sm`}
                      placeholder="House/Flat No., Street Name, Area"
                    />
                    {newAddressErrors.street && (
                      <p className="text-[10px] text-red-600 mt-0.5">{newAddressErrors.street}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        className={`w-full px-3.5 py-2.5 bg-white border ${
                          newAddressErrors.city ? 'border-red-500' : 'border-neutral-300'
                        } focus:border-brand-dark focus:ring-1 focus:ring-brand-dark outline-none text-sm`}
                        placeholder="City"
                      />
                      {newAddressErrors.city && (
                        <p className="text-[10px] text-red-600 mt-0.5">{newAddressErrors.city}</p>
                      )}
                    </div>
                    <div>
                      <label className="block font-semibold tracking-wider text-neutral-700 uppercase mb-1">
                        PINCODE *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={newShippingForm.pincode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setNewShippingForm({ ...newShippingForm, pincode: val });
                          if (val.length > 0 && val.length !== 6) {
                            setNewAddressErrors((prev) => ({ ...prev, pincode: 'Pincode must be exactly 6 digits.' }));
                          } else {
                            setNewAddressErrors((prev) => ({ ...prev, pincode: null }));
                          }
                        }}
                        className={`w-full px-3.5 py-2.5 bg-white border ${
                          newAddressErrors.pincode ? 'border-red-500' : 'border-neutral-300'
                        } focus:border-brand-dark focus:ring-1 focus:ring-brand-dark outline-none text-sm`}
                        placeholder="6-digit PIN"
                      />
                      {newAddressErrors.pincode && (
                        <p className="text-[10px] text-red-600 mt-0.5">{newAddressErrors.pincode}</p>
                      )}
                    </div>
                  </div>

                  {/* Save to Account Checkbox (Checked by default) */}
                  <div className="pt-2 flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id="saveAddressToAccount"
                      checked={saveAddressToAccount}
                      onChange={(e) => setSaveAddressToAccount(e.target.checked)}
                      className="w-4 h-4 accent-black cursor-pointer"
                    />
                    <label
                      htmlFor="saveAddressToAccount"
                      className="text-xs font-semibold tracking-wider text-neutral-800 uppercase cursor-pointer select-none"
                    >
                      Save this address to my account
                    </label>
                  </div>
                </div>
              )}

              {/* Shipping Method Row (Real-time Shiprocket Serviceability) */}
              <div className="mt-4 text-xs bg-white p-3.5 border border-neutral-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Truck className="w-4 h-4 text-emerald-800 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-neutral-900 uppercase tracking-wider block">
                          EXPRESS COURIER DELIVERY
                        </span>
                        {shippingServiceability.checked && shippingServiceability.available && (
                          <span className="text-[9px] font-sans font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                            ⚡ {shippingServiceability.zone || 'METRO'}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-neutral-500 font-serif">
                        {shippingServiceability.loading
                          ? `Checking courier serviceability for PIN ${shippingServiceability.pincode}...`
                          : shippingServiceability.checked && !shippingServiceability.available
                          ? `⚠️ Delivery is currently unavailable to PIN ${shippingServiceability.pincode}`
                          : `Estimated Delivery: ${shippingServiceability.minDays}–${shippingServiceability.maxDays} Business Days • ${shippingServiceability.courierName}`}
                      </span>
                    </div>
                  </div>
                  <span className="font-sans font-semibold text-emerald-800 uppercase tracking-[0.16em] text-xs">
                    FREE
                  </span>
                </div>

                {shippingServiceability.checked && !shippingServiceability.available && (
                  <div className="mt-2.5 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-800 text-[11px] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Courier delivery is unserviceable to PIN code {shippingServiceability.pincode}. Please enter an alternate delivery PIN code.</span>
                  </div>
                )}
              </div>
            </section>

            {/* 3. PAYMENT SECTION */}
            <section className="bg-neutral-50/70 p-5 sm:p-6 border border-neutral-200/80">
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
                {/* Option 1: UPI & Netbanking */}
                <label
                  onClick={() => setPaymentMethod('upi')}
                  className={`block p-4 bg-white border cursor-pointer transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-brand-dark ring-2 ring-brand-dark/20 shadow-xs'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'upi'}
                        onChange={() => setPaymentMethod('upi')}
                        className="mt-0.5 accent-black cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-neutral-900 text-sm tracking-wide uppercase">
                            UPI &amp; NETBANKING
                          </span>
                        </div>
                        <p className="text-neutral-500 text-[11px] mt-0.5">
                          Pay instantly using GPay, PhonePe, Paytm, BHIM UPI, or Netbanking. Zero extra surcharge.
                        </p>
                        <div className="flex items-center gap-2 mt-2.5">
                          <div className="px-1.5 py-0.5 border border-neutral-300 bg-white flex items-center justify-center h-6 min-w-[44px] rounded-xs shadow-2xs">
                            <UpiLogo className="h-3.5 w-auto" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <Smartphone className="w-5 h-5 text-neutral-700 flex-shrink-0" />
                  </div>
                </label>

                {/* Option 2: Credit / Debit Cards (+2% Extra Charge) */}
                <label
                  onClick={() => setPaymentMethod('card')}
                  className={`block p-4 bg-white border cursor-pointer transition-all ${
                    paymentMethod === 'card'
                      ? 'border-brand-dark ring-2 ring-brand-dark/20 shadow-xs'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        className="mt-0.5 accent-black cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-neutral-900 text-sm tracking-wide uppercase">
                            CREDIT / DEBIT CARDS
                          </span>
                          {storeSettings.card_charge_enabled && Number(storeSettings.card_charge_percentage) > 0 && (
                            <span className="text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              +{storeSettings.card_charge_percentage}% Extra Charge (+{formatPrice(cardSurcharge)})
                            </span>
                          )}
                        </div>
                        <p className="text-neutral-500 text-[11px] mt-0.5">
                          {storeSettings.card_charge_enabled && Number(storeSettings.card_charge_percentage) > 0
                            ? `Pay securely using Visa, Mastercard, RuPay, or American Express. A ${storeSettings.card_charge_percentage}% processing fee is applied.`
                            : 'Pay securely using Visa, Mastercard, RuPay, or American Express. Zero extra surcharge.'}
                        </p>
                        <div className="flex items-center gap-2 mt-2.5">
                          <div className="px-1.5 py-0.5 border border-neutral-300 bg-white flex items-center justify-center h-6 min-w-[44px] rounded-xs shadow-2xs">
                            <VisaLogo className="h-3 w-auto" />
                          </div>
                          <div className="px-1.5 py-0.5 border border-neutral-300 bg-white flex items-center justify-center h-6 min-w-[44px] rounded-xs shadow-2xs">
                            <MastercardLogo className="h-3.5 w-auto" />
                          </div>
                          <div className="px-1.5 py-0.5 border border-neutral-300 bg-white flex items-center justify-center h-6 min-w-[44px] rounded-xs shadow-2xs">
                            <RupayLogo className="h-3.5 w-auto" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <CreditCard className="w-5 h-5 text-neutral-700 flex-shrink-0" />
                  </div>
                </label>

                {/* Option 3: Cash on Delivery */}
                <label
                  onClick={() => {
                    if (shippingServiceability.checked && !shippingServiceability.codAvailable) {
                      showToast('Cash on Delivery is unavailable for this destination pincode. Please select UPI or Cards.', 'info');
                      return;
                    }
                    setPaymentMethod('cod');
                  }}
                  className={`block p-4 bg-white border transition-all ${
                    shippingServiceability.checked && !shippingServiceability.codAvailable
                      ? 'opacity-60 bg-neutral-100 cursor-not-allowed border-neutral-200'
                      : paymentMethod === 'cod'
                      ? 'border-brand-dark ring-2 ring-brand-dark/20 shadow-xs cursor-pointer'
                      : 'border-neutral-200 hover:border-neutral-300 cursor-pointer'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        disabled={shippingServiceability.checked && !shippingServiceability.codAvailable}
                        checked={paymentMethod === 'cod'}
                        onChange={() => {
                          if (shippingServiceability.checked && !shippingServiceability.codAvailable) return;
                          setPaymentMethod('cod');
                        }}
                        className="mt-0.5 accent-black cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-neutral-900 text-sm tracking-wide block uppercase">
                            CASH ON DELIVERY (COD)
                          </span>
                          {shippingServiceability.checked && !shippingServiceability.codAvailable && (
                            <span className="text-[9px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full uppercase">
                              Unavailable for Pincode
                            </span>
                          )}
                        </div>
                        <p className="text-neutral-500 text-[11px] mt-0.5">
                          {shippingServiceability.checked && !shippingServiceability.codAvailable
                            ? 'Courier COD is not supported for this PIN code. Please use UPI or Cards.'
                            : 'Pay with cash or UPI upon delivery.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </section>



            {/* 5. PRIMARY CTA BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isPlacingOrder || selectedItems.length === 0 || hasOutOfStockSelected || (shippingServiceability.checked && !shippingServiceability.available)}
                className="w-full py-4 bg-[#111111] hover:bg-neutral-800 text-white text-xs font-sans font-bold tracking-[0.25em] uppercase transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlacingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white stroke-[2.25] shrink-0" />
                    <span>PROCESSING ORDER...</span>
                  </>
                ) : hasOutOfStockSelected ? (
                  <span className="flex items-center justify-center gap-1.5 text-rose-300">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>OUT OF STOCK • REMOVE TO CONTINUE</span>
                  </span>
                ) : selectedItems.length === 0 ? (
                  <span>SELECT ITEMS TO PLACE ORDER</span>
                ) : shippingServiceability.checked && !shippingServiceability.available ? (
                  <span>PINCODE UNSERVICEABLE • ENTER ALTERNATE PIN</span>
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
              {hasOutOfStockSelected ? (
                <p className="text-[11px] text-center text-rose-600 font-medium mt-2">
                  Please remove out-of-stock item{outOfStockSelectedItems.length > 1 ? 's' : ''} from your order to proceed.
                </p>
              ) : (
                <p className="text-[11px] text-center text-neutral-400 mt-2 font-serif">
                  By clicking place order, you agree to House of Urvaah's Terms of Purchase & Privacy Policy.
                </p>
              )}
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
                  ORDER SUMMARY ({selectedItems.reduce((a, b) => a + b.quantity, 0)})
                </h3>
                <Link
                  to="/"
                  className="text-[11px] text-neutral-500 hover:text-black font-semibold tracking-wider uppercase"
                >
                  CONTINUE SHOPPING
                </Link>
              </div>

              {/* 1. ACTIVE ITEMS IN THIS ORDER */}
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-[0.18em] text-neutral-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>SELECTED FOR THIS ORDER ({selectedItems.length})</span>
                  </span>
                  {selectedItems.length > 0 && unselectedItems.length > 0 && (
                    <span className="text-[10px] text-emerald-800 font-semibold tracking-wider">
                      Active
                    </span>
                  )}
                </div>

                {hasOutOfStockSelected && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200/90 rounded-xl text-xs text-rose-900 flex items-start gap-2.5 mb-3.5 shadow-2xs">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-rose-800 tracking-wide uppercase text-[11px]">
                        Stock Unavailable for Selected Item{outOfStockSelectedItems.length > 1 ? 's' : ''}
                      </p>
                      <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                        {outOfStockSelectedItems.map((it) => `"${it.product?.name || it.name}" (${it.selectedSize})`).join(', ')} {outOfStockSelectedItems.length > 1 ? 'are' : 'is'} out of stock. Please remove {outOfStockSelectedItems.length > 1 ? 'them' : 'it'} from your order to proceed.
                      </p>
                    </div>
                  </div>
                )}

                {selectedItems.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-xl text-center text-xs text-amber-900 space-y-1 my-3">
                    <p className="font-semibold">No items currently selected for this order.</p>
                    <p className="text-[11px] text-amber-800">
                      Please click <strong>&quot;+ Add to Order&quot;</strong> on any product in your bag below to purchase it.
                    </p>
                  </div>
                ) : (
                  <div
                    className="divide-y divide-neutral-200/80 max-h-[300px] overflow-y-auto no-scrollbar scrollbar-none pt-1"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {selectedItems.map((item, idx) => {
                      const stockInfo = getItemStockInfo(item);
                      return (
                        <div
                          key={`selected-${item.product.id}-${item.selectedSize}-${idx}`}
                          className={`py-3.5 first:pt-2 last:pb-1 flex gap-3.5 items-center justify-between transition-colors ${
                            stockInfo.isOutOfStock ? 'bg-rose-50/50 border border-rose-200/90 px-2.5 py-3 rounded-lg my-1.5' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className="relative flex-shrink-0 pt-1 pr-1">
                              <img
                                src={getSupabaseMediaUrl(item.product.image)}
                                alt={item.product.name}
                                className={`w-16 h-20 object-cover object-top border ${
                                  stockInfo.isOutOfStock ? 'border-rose-300 opacity-70' : 'border-neutral-200 bg-white'
                                }`}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = getSupabaseMediaUrl('Images/Blue02.png');
                                }}
                              />
                              <span
                                className={`absolute top-0 right-0 w-5 h-5 ${
                                  stockInfo.isOutOfStock ? 'bg-rose-600' : 'bg-black'
                                } text-white text-[10px] font-sans font-semibold rounded-full flex items-center justify-center tabular-nums shadow-xs`}
                              >
                                {item.quantity}
                              </span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-900 truncate">
                                  {item.product.name}
                                </h4>
                                {stockInfo.isOutOfStock && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase bg-rose-100 text-rose-700 rounded border border-rose-200 shrink-0">
                                    OUT OF STOCK
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-neutral-500 tracking-wider mt-0.5">
                                SIZE: <span className="font-bold text-neutral-800">{item.selectedSize}</span>
                              </p>
                              {stockInfo.isOutOfStock ? (
                                <p className="text-[10px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                                  <span>{stockInfo.reason || 'This item is currently out of stock.'}</span>
                                </p>
                              ) : (
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-xs font-bold text-neutral-900">
                                    {formatPrice(item.product.price * item.quantity)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Delete / Remove Item from Order */}
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item)}
                            className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-neutral-200/60 rounded-full transition-colors cursor-pointer shrink-0 ml-2"
                            title="Remove item from order"
                            aria-label="Remove item from order"
                          >
                            <Trash2 className="w-4 h-4 stroke-[1.75]" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. OTHER ITEMS IN YOUR BAG (Saved from previous additions) */}
              {unselectedItems.length > 0 && (
                <div className="pt-4 border-t border-neutral-300/80 mt-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <div>
                      <h4 className="text-xs font-serif font-bold uppercase tracking-[0.16em] text-neutral-900 flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-neutral-700" />
                        <span>OTHER ITEMS IN YOUR BAG ({unselectedItems.length})</span>
                      </h4>
                      <p className="text-[10px] text-neutral-500 tracking-wide mt-0.5">
                        Saved in your bag. Want to buy them together?
                      </p>
                    </div>
                  </div>

                  <div
                    className="divide-y divide-neutral-200/60 max-h-[260px] overflow-y-auto no-scrollbar scrollbar-none bg-white/70 border border-neutral-200/80 rounded-xl p-3"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {unselectedItems.map((item, idx) => {
                      const stockInfo = getItemStockInfo(item);
                      return (
                        <div key={`unselected-${item.product.id}-${item.selectedSize}-${idx}`} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={getSupabaseMediaUrl(item.product.image)}
                              alt={item.product.name}
                              className={`w-11 h-14 object-cover object-top border ${
                                stockInfo.isOutOfStock ? 'border-rose-300 opacity-60' : 'border-neutral-200 bg-white'
                              } shrink-0 rounded-xs`}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = getSupabaseMediaUrl('Images/Blue02.png');
                              }}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h5 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-800 truncate">
                                  {item.product.name}
                                </h5>
                                {stockInfo.isOutOfStock && (
                                  <span className="px-1 py-0.2 text-[8px] font-bold tracking-wider uppercase bg-rose-100 text-rose-700 rounded border border-rose-200">
                                    OUT OF STOCK
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-neutral-500">
                                Size: <strong className="text-neutral-700">{item.selectedSize}</strong> &bull; Qty: {item.quantity}
                              </p>
                              <p className="text-[11px] font-bold text-neutral-900">
                                {formatPrice(item.product.price * item.quantity)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              disabled={stockInfo.isOutOfStock}
                              onClick={() => handleIncludeItemInOrder(item)}
                              className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-sans font-bold tracking-[0.14em] uppercase transition flex items-center gap-1 shrink-0 ${
                                stockInfo.isOutOfStock
                                  ? 'border-neutral-200 bg-neutral-100 text-neutral-400 cursor-not-allowed shadow-none'
                                  : 'border-[#c5a880] hover:border-black bg-white hover:bg-[#FAF8F3] text-neutral-900 cursor-pointer shadow-2xs'
                              }`}
                              title={stockInfo.isOutOfStock ? (stockInfo.reason || 'This item is out of stock') : 'Add to active order'}
                            >
                              {stockInfo.isOutOfStock ? (
                                <span>OUT OF STOCK</span>
                              ) : (
                                <>
                                  <Plus className="w-3 h-3 text-[#8c734b]" />
                                  <span>ADD TO ORDER</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item)}
                              className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-neutral-200/60 rounded-full transition-colors cursor-pointer"
                              title="Remove item from bag"
                              aria-label="Remove item from bag"
                            >
                              <Trash2 className="w-3.5 h-3.5 stroke-[1.75]" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* DISCOUNT CODE INPUT FIELD (Commented out) */}
              {/* <div className="pt-4 border-t border-neutral-200">
                <label className="block text-[11px] font-bold text-neutral-600 tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-brand-dark" />
                  DISCOUNT VOUCHER / PROMO CODE
                </label>

                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="e.g. WELCOME10"
                      className="flex-1 px-3 py-2 text-xs bg-white border border-neutral-300 focus:border-brand-dark outline-none font-sans font-medium tracking-[0.15em] uppercase placeholder:font-normal placeholder:tracking-normal"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-4 py-2 bg-brand-dark hover:bg-neutral-800 text-white text-xs font-bold tracking-widest uppercase transition-colors cursor-pointer"
                    >
                      APPLY
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-sans font-bold text-emerald-900 uppercase tracking-[0.16em] block">
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
              </div> */}

              {/* CALCULATED TOTALS */}
              <div className="pt-4 border-t border-neutral-200 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-neutral-600">
                  <span className="uppercase tracking-wider">Subtotal</span>
                  <span className="font-semibold text-neutral-900 font-sans tabular-nums">
                    {formatPrice(orderSubtotal)}
                  </span>
                </div>

                {appliedCoupon && discountAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-800 font-semibold">
                    <span className="uppercase tracking-wider">
                      Discount ({appliedCoupon.code})
                    </span>
                    <span className="font-sans font-medium tabular-nums">-{formatPrice(discountAmount)}</span>
                  </div>
                )}

                {/* Tax / GST Line Item */}
                <div className="flex justify-between items-center text-neutral-600">
                  <span className="uppercase tracking-wider">
                    GST / Tax ({taxRate}%)
                  </span>
                  <span className="font-semibold text-neutral-900 font-sans tabular-nums">
                    +{formatPrice(taxAmount)}
                  </span>
                </div>

                {/* Card Surcharge Line Item (if card selected and enabled) */}
                {paymentMethod === 'card' && storeSettings.card_charge_enabled && Number(storeSettings.card_charge_percentage) > 0 && (
                  <div className="flex justify-between items-center text-amber-900 bg-amber-50/80 px-2.5 py-2 rounded-xs border border-amber-300/80 text-xs">
                    <span className="uppercase tracking-wider text-[11px] font-semibold flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                      Card Processing Surcharge ({storeSettings.card_charge_percentage}%)
                    </span>
                    <span className="font-sans font-bold tabular-nums">
                      +{formatPrice(cardSurcharge)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-neutral-600">
                  <span className="uppercase tracking-wider">Shipping</span>
                  <span className="font-sans font-semibold text-emerald-800 uppercase tracking-[0.16em]">
                    FREE
                  </span>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-neutral-300 text-sm sm:text-base font-bold text-neutral-900">
                  <span className="font-serif tracking-widest uppercase">TOTAL</span>
                  <span className="font-serif tracking-wider">{formatPrice(grandTotal)}</span>
                </div>
                <p className="text-[10px] text-neutral-400 text-right uppercase tracking-wider">
                  Includes {taxRate}% GST ({formatPrice(taxAmount)}) & Luxury taxes
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

      {/* CHECKOUT EDIT ADDRESS MODAL */}
      <AnimatePresence>
        {isEditingModalOpen && editingAddressForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 font-sans"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white max-w-lg w-full p-6 sm:p-8 border border-neutral-200 shadow-xl relative max-h-[90vh] overflow-y-auto no-scrollbar scrollbar-none"
            >
              <button
                type="button"
                onClick={() => setIsEditingModalOpen(false)}
                className="absolute right-4 top-4 text-neutral-400 hover:text-black p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-serif tracking-[0.15em] uppercase text-black font-semibold mb-4 pb-2 border-b border-neutral-200">
                EDIT DELIVERY ADDRESS
              </h3>

              <form onSubmit={handleSaveCheckoutEditedAddress} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold tracking-wider text-neutral-700 uppercase mb-1">
                    RECIPIENT NAME *
                  </label>
                  <input
                    type="text"
                    value={editingAddressForm.name}
                    onChange={(e) => setEditingAddressForm({ ...editingAddressForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-neutral-300 focus:border-black outline-none text-sm"
                  />
                  {editingAddressErrors.name && (
                    <p className="text-[10px] text-red-600 mt-0.5">{editingAddressErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold tracking-wider text-neutral-700 uppercase mb-1">
                    PHONE NUMBER *
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={editingAddressForm.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setEditingAddressForm({ ...editingAddressForm, phone: val });
                      if (val.length > 0 && val.length !== 10) {
                        setEditingAddressErrors((prev) => ({ ...prev, phone: 'Phone number must be exactly 10 digits.' }));
                      } else {
                        setEditingAddressErrors((prev) => ({ ...prev, phone: null }));
                      }
                    }}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full px-3.5 py-2.5 border border-neutral-300 focus:border-black outline-none text-sm"
                  />
                  {editingAddressErrors.phone && (
                    <p className="text-[10px] text-red-600 mt-0.5">{editingAddressErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold tracking-wider text-neutral-700 uppercase mb-1">
                    STREET ADDRESS / FLAT / BUILDING *
                  </label>
                  <input
                    type="text"
                    value={editingAddressForm.street}
                    onChange={(e) => setEditingAddressForm({ ...editingAddressForm, street: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-neutral-300 focus:border-black outline-none text-sm"
                  />
                  {editingAddressErrors.street && (
                    <p className="text-[10px] text-red-600 mt-0.5">{editingAddressErrors.street}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold tracking-wider text-neutral-700 uppercase mb-1">
                      CITY *
                    </label>
                    <input
                      type="text"
                      value={editingAddressForm.city}
                      onChange={(e) => setEditingAddressForm({ ...editingAddressForm, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-neutral-300 focus:border-black outline-none text-sm"
                    />
                    {editingAddressErrors.city && (
                      <p className="text-[10px] text-red-600 mt-0.5">{editingAddressErrors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold tracking-wider text-neutral-700 uppercase mb-1">
                      PINCODE *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={editingAddressForm.pincode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setEditingAddressForm({ ...editingAddressForm, pincode: val });
                        if (val.length > 0 && val.length !== 6) {
                          setEditingAddressErrors((prev) => ({ ...prev, pincode: 'Pincode must be exactly 6 digits.' }));
                        } else {
                          setEditingAddressErrors((prev) => ({ ...prev, pincode: null }));
                        }
                      }}
                      className="w-full px-3.5 py-2.5 border border-neutral-300 focus:border-black outline-none text-sm"
                    />
                    {editingAddressErrors.pincode && (
                      <p className="text-[10px] text-red-600 mt-0.5">{editingAddressErrors.pincode}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="checkoutEditingDefault"
                    checked={editingAddressForm.isDefault}
                    onChange={(e) => setEditingAddressForm({ ...editingAddressForm, isDefault: e.target.checked })}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                  <label htmlFor="checkoutEditingDefault" className="font-semibold tracking-wider uppercase text-neutral-800 cursor-pointer">
                    Set as default shipping address
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setIsEditingModalOpen(false)}
                    className="px-5 py-2.5 border border-neutral-300 text-neutral-700 hover:text-black uppercase text-xs font-bold tracking-widest cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={editingSaving}
                    className="px-6 py-2.5 bg-brand-dark hover:bg-neutral-800 text-white uppercase text-xs font-bold tracking-widest cursor-pointer disabled:opacity-50"
                  >
                    {editingSaving ? 'SAVING...' : 'SAVE CHANGES'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. Order Review & Confirmation Modal */}
      <AnimatePresence>
        {isConfirmOrderModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto no-scrollbar scrollbar-none"
            onClick={() => {
              if (!isPlacingOrder) setIsConfirmOrderModalOpen(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl bg-white border border-neutral-200 shadow-2xl rounded-2xl overflow-hidden max-h-[92vh] flex flex-col font-sans my-auto"
            >
              {/* Modal Header */}
              <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70 sticky top-0 z-10 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-dark text-white flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-sans font-bold tracking-[0.25em] text-neutral-400 uppercase block">
                      HOUSE OF URVAAH • ATELIER
                    </span>
                    <h3 className="text-base sm:text-lg font-serif font-semibold tracking-wide text-black">
                      Confirm Your Order
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isPlacingOrder}
                  onClick={() => setIsConfirmOrderModalOpen(false)}
                  className="p-2 text-neutral-400 hover:text-black rounded-full hover:bg-neutral-100 transition-colors cursor-pointer disabled:opacity-40"
                  aria-label="Close review modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content Body */}
              <div className="p-5 sm:p-6 overflow-y-auto no-scrollbar scrollbar-none space-y-6 flex-1 divide-y divide-neutral-100">
                {/* Section 1: Order Items Summary */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-700 flex items-center gap-1.5">
                      <span>Items in Order</span>
                      <span className="text-[10px] font-sans font-semibold px-2 py-0.5 bg-neutral-100 rounded-full text-neutral-600">
                        {selectedItems.length}
                      </span>
                    </h4>
                    <span className="text-xs font-semibold text-neutral-500">
                      Subtotal: {formatPrice(orderSubtotal)}
                    </span>
                  </div>

                  <div 
                    className="space-y-2.5 max-h-52 overflow-y-auto no-scrollbar scrollbar-none pr-1"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {selectedItems.map((item, idx) => {
                      const imgUrl = item.product?.image || item.image || '/assets/Images/Brown01.png';
                      return (
                        <div
                          key={item.id || item.productId || idx}
                          className="flex items-center gap-3.5 p-3 rounded-xl bg-neutral-50/70 border border-neutral-100"
                        >
                          <img
                            src={getSupabaseMediaUrl(imgUrl)}
                            alt={item.product?.name || item.name}
                            className="w-14 h-16 object-cover object-top rounded-lg border border-neutral-200 bg-neutral-100 shrink-0"
                            onError={(e) => {
                              e.target.src = '/assets/Images/Brown01.png';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-serif font-bold text-neutral-900 truncate">
                              {item.product?.name || item.name}
                            </h5>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-500">
                              <span className="px-2 py-0.5 bg-white border border-neutral-200 rounded text-[10px] font-bold text-neutral-700">
                                Size: {item.selectedSize || 'M'}
                              </span>
                              <span>•</span>
                              <span>Qty: {item.quantity || 1}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold text-neutral-900">
                              {formatPrice(Number(item.product?.price || item.price || 0) * (item.quantity || 1))}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Delivery Destination */}
                <div className="pt-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-700 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Delivery Address</span>
                    </h4>
                    <button
                      type="button"
                      disabled={isPlacingOrder}
                      onClick={() => setIsConfirmOrderModalOpen(false)}
                      className="text-[11px] font-bold tracking-wider uppercase text-neutral-600 hover:text-black cursor-pointer disabled:opacity-40"
                    >
                      Change
                    </button>
                  </div>

                  <div className="p-3.5 bg-neutral-50/70 border border-neutral-200/80 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neutral-900">
                        {activeAddressForReview.name}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-neutral-200/70 text-neutral-700 rounded-md">
                        {activeAddressForReview.type}
                      </span>
                    </div>
                    <p className="text-neutral-600 leading-relaxed">
                      {activeAddressForReview.street}
                    </p>
                    <p className="text-neutral-600">
                      {activeAddressForReview.city}, {activeAddressForReview.state} — <span className="font-mono font-bold text-neutral-800">{activeAddressForReview.pincode}</span>
                    </p>
                    <p className="text-[11px] text-neutral-500 pt-0.5">
                      Phone: <span className="font-mono font-semibold text-neutral-700">{activeAddressForReview.phone}</span>
                    </p>
                  </div>
                </div>

                {/* Section 3: Payment Method */}
                <div className="pt-4">
                  <h4 className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-700 flex items-center gap-1.5 mb-2.5">
                    <CreditCard className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Payment Method</span>
                  </h4>

                  <div className="p-3.5 bg-neutral-50/70 border border-neutral-200/80 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-900">
                          {paymentMethod === 'cod'
                            ? 'Cash on Delivery (COD)'
                            : paymentMethod === 'card'
                            ? 'Credit / Debit Card'
                            : 'UPI & Netbanking'}
                        </span>
                        {paymentMethod === 'cod' && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                            PAY AT DOORSTEP
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        {paymentMethod === 'cod'
                          ? 'Zero upfront payment. Pay securely in cash when parcel arrives.'
                          : 'Encrypted via 256-bit SSL Razorpay payment gateway.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isPlacingOrder}
                      onClick={() => setIsConfirmOrderModalOpen(false)}
                      className="text-[11px] font-bold tracking-wider uppercase text-neutral-600 hover:text-black shrink-0 ml-3 cursor-pointer disabled:opacity-40"
                    >
                      Change
                    </button>
                  </div>
                </div>

                {/* Section 4: Total Cost Breakdown */}
                <div className="pt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-neutral-600">
                    <span>Items Subtotal</span>
                    <span className="font-medium tabular-nums">{formatPrice(orderSubtotal)}</span>
                  </div>

                  {shippingFee > 0 ? (
                    <div className="flex justify-between text-neutral-600">
                      <span>Delivery / Freight</span>
                      <span className="font-medium tabular-nums">{formatPrice(shippingFee)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-emerald-700">
                      <span>Delivery / Freight</span>
                      <span className="font-bold uppercase tracking-wider text-[11px]">FREE</span>
                    </div>
                  )}

                  {cardSurcharge > 0 && (
                    <div className="flex justify-between text-neutral-600">
                      <span>Card Processing Fee</span>
                      <span className="font-medium tabular-nums">{formatPrice(cardSurcharge)}</span>
                    </div>
                  )}

                  {appliedCoupon && discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Coupon Discount ({appliedCoupon.code})</span>
                      <span className="tabular-nums">-{formatPrice(discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-neutral-600">
                    <span>GST / Taxes ({taxRate}%)</span>
                    <span className="font-medium tabular-nums">+{formatPrice(taxAmount)}</span>
                  </div>

                  <div className="pt-3 border-t border-neutral-200 flex justify-between items-baseline">
                    <div>
                      <span className="text-sm font-bold uppercase tracking-wider text-black block">
                        Total Payable
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        Inclusive of all applicable taxes
                      </span>
                    </div>
                    <span className="text-lg font-serif font-bold text-black">
                      {formatPrice(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="p-4 sm:p-5 bg-neutral-50/80 border-t border-neutral-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sticky bottom-0 z-10 backdrop-blur-md">
                <button
                  type="button"
                  disabled={isPlacingOrder}
                  onClick={() => setIsConfirmOrderModalOpen(false)}
                  className="w-full sm:w-auto px-5 py-3 border border-neutral-300 hover:border-black text-neutral-700 hover:text-black text-xs font-bold uppercase tracking-[0.18em] transition-colors cursor-pointer rounded-xl disabled:opacity-40 text-center"
                >
                  REVIEW / CHANGE DETAILS
                </button>

                <button
                  type="button"
                  disabled={isPlacingOrder}
                  onClick={executeOrderPlacement}
                  className="w-full sm:w-auto px-7 py-3.5 bg-brand-dark hover:bg-neutral-800 text-white text-xs font-sans font-bold tracking-[0.25em] uppercase transition-colors flex items-center justify-center gap-2 shadow-lg cursor-pointer rounded-xl disabled:opacity-50"
                >
                  {isPlacingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                      <span>CONFIRMING & PLACING...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 stroke-[2]" />
                      <span>CONFIRM & PLACE ORDER ({formatPrice(grandTotal)})</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real-time Shiprocket Live Tracking Modal */}
      <ShipmentTrackingModal
        isOpen={liveTrackingOpen}
        onClose={() => setLiveTrackingOpen(false)}
        awb={placedOrderDetails?.trackingNumber || placedOrderNumber}
        orderNumber={placedOrderDetails?.orderNumber || placedOrderNumber}
        isReturn={false}
        fallbackStatus={placedOrderDetails?.status || 'Confirmed'}
      />
    </div>
  );
};

export default Checkout;
