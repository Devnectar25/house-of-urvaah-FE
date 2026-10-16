import React, { useState, useEffect, useRef } from 'react';
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
  Star
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import apiClient from '../lib/apiClient';
import { getSupabaseMediaUrl } from '../lib/supabase';
import { SEOHead } from '../components/common/SEOHead';
import { INDIAN_STATES, findMatchedState } from '../data/indianStates';
import { UpiLogo, VisaLogo, MastercardLogo, RupayLogo } from '../components/common/PaymentLogos';
import { InvoiceModal } from '../components/common/InvoiceModal';
import { ShipmentTrackingModal } from '../components/common/ShipmentTrackingModal';
import { shippingApi } from '../services/shippingApi';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import { subscribeToOrderUpdates, broadcastOrderUpdate } from '../lib/orderSync';
import Swal from 'sweetalert2';

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

// Helper to format order for confirmation screen
const formatOrderDetails = (ord, currentUser) => {
  if (!ord) return null;
  const orderNum = ord.order_number || ord.orderNumber || (ord.id ? `HOU-${ord.id}` : 'HOU-340391');

  let addrObj = ord.shipping_address || ord.shippingAddress || {};
  if (typeof addrObj === 'string') {
    try { addrObj = JSON.parse(addrObj); } catch (e) { addrObj = { street: addrObj }; }
  }

  const rawItems = Array.isArray(ord.items) && ord.items.length > 0
    ? ord.items
    : [
        {
          id: ord.product_id || ord.id || '1',
          name: ord.product_name || ord.title || ord.name || 'PEACH BLOOM CORSET SET',
          price: Number(ord.price || ord.total || ord.total_amount || 0),
          quantity: Number(ord.quantity || 1),
          image: ord.image || ord.image_url || '/assets/Images/Brown01.png',
          selectedSize: ord.selectedSize || ord.size || 'M'
        }
      ];

  const mappedItems = rawItems.map((it) => ({
    id: String(it.id || it.product_id || '1'),
    name: it.name || it.product_name || it.title || 'PEACH BLOOM CORSET SET',
    price: Number(it.price || 0),
    quantity: Number(it.quantity || 1),
    image: it.image || it.image_url || '/assets/Images/Brown01.png',
    selectedSize: it.selectedSize || it.size || 'M',
    product: {
      id: String(it.id || it.product_id || '1'),
      name: it.name || it.product_name || it.title || 'PEACH BLOOM CORSET SET',
      price: Number(it.price || 0),
      image: it.image || it.image_url || '/assets/Images/Brown01.png'
    }
  }));

  const totalPaid = Number(ord.total || ord.total_amount || ord.totalAmount || ord.total_price || 0);
  const subtotal = Number(ord.subtotal || totalPaid || 0);
  const discount = Number(ord.discount || 0);
  const shippingFee = Number(ord.shipping_fee || ord.shippingFee || 0);

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
    customerEmail: ord.customer_email || ord.email || currentUser?.email || '',
    customerPhone: ord.recipient_phone || ord.customer_phone || ord.phone || currentUser?.phone || '',
    status: ord.status || 'Confirmed'
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
  } = useCart();

  // Active selected purchase items vs other bag items
  const activeSelectedKeys = React.useMemo(() => {
    const cartKeys = (cart || []).map((it) => `${it.product?.id}_${it.selectedSize}`);
    if (selectedCartItemKeys && selectedCartItemKeys.length > 0) {
      const valid = selectedCartItemKeys.filter((k) => cartKeys.includes(k));
      if (valid.length > 0) return valid;
    }
    // Fallback: If no keys explicitly selected, select ONLY the most recent item added (last item in cart)
    if (cart && cart.length > 0) {
      const last = cart[cart.length - 1];
      return [`${last.product?.id}_${last.selectedSize}`];
    }
    return [];
  }, [selectedCartItemKeys, cart]);

  const selectedItems = React.useMemo(() => {
    return (cart || []).filter((item) => activeSelectedKeys.includes(`${item.product?.id}_${item.selectedSize}`));
  }, [cart, activeSelectedKeys]);

  const unselectedItems = React.useMemo(() => {
    return (cart || []).filter((item) => !activeSelectedKeys.includes(`${item.product?.id}_${item.selectedSize}`));
  }, [cart, activeSelectedKeys]);

  const orderSubtotal = React.useMemo(() => {
    return selectedItems.reduce(
      (acc, item) => acc + Number(item.product?.price || 0) * Number(item.quantity || 1),
      0
    );
  }, [selectedItems]);

  const handleIncludeItemInOrder = (item) => {
    const key = `${item.product?.id}_${item.selectedSize}`;
    setSelectedCartItemKeys((prev) => Array.from(new Set([...(prev || []), key])));
  };

  const handleExcludeItemFromOrder = (item) => {
    const key = `${item.product?.id}_${item.selectedSize}`;
    setSelectedCartItemKeys((prev) => (prev || []).filter((k) => k !== key));
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
            cancel_reason: payload.cancel_reason || payload.cancelReason || prev.cancel_reason
          };
        });
        if (payload.status === 'Cancelled') {
          setOrderCancelled(true);
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
        if (ord.status === 'Cancelled') {
          setOrderCancelled(true);
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

  // Calculations (strictly computed on selected purchase items)
  const shippingFee = 0; // Free express shipping
  const discountAmount = appliedCoupon
    ? Math.round((orderSubtotal * appliedCoupon.discountPercent) / 100)
    : 0;
  const taxableAmount = Math.max(0, orderSubtotal - discountAmount);
  // GST Tax Rule: If order > 2500 then 18% tax, if <= 2500 then 5% tax
  const taxRate = taxableAmount > 2500 ? 18 : 5;
  const taxAmount = taxableAmount > 0 ? Math.round(taxableAmount * (taxRate / 100)) : 0;
  const basePayable = taxableAmount + taxAmount + shippingFee;
  const cardSurcharge = paymentMethod === 'card' ? Math.round(basePayable * 0.02) : 0;
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
    setIsPlacingOrder(false);
    setOrderPlaced(true);
    setIsFetchingOrder(false);

    // Update URL to /checkout?orderNumber=... so refresh keeps the confirmation screen
    navigate(`/checkout?orderNumber=${encodeURIComponent(orderNum)}`, { replace: true });

    window.scrollTo({ top: 0, behavior: 'smooth' });
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
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setIsPlacingOrder(true);
    setPaymentErrorMessage('');
    setConfirmedGrandTotal(grandTotal);

    try {
      const selectedAddr = (showNewAddressForm || addresses.length === 0)
        ? { name: newShippingForm.fullName, phone: newShippingForm.phone }
        : (addresses[selectedAddressIndex] || {});

      let activeAddressId = null;

      if (showNewAddressForm || addresses.length === 0) {
        if (!validateNewShippingForm()) {
          setIsPlacingOrder(false);
          setPaymentErrorMessage('Please fill in all required delivery address fields correctly.');
          return;
        }

        if (showNewAddressForm && addresses.length >= 4) {
          setIsPlacingOrder(false);
          setPaymentErrorMessage('You can save a maximum of 4 delivery addresses. Please select from your saved addresses or edit an existing one.');
          return;
        }

        const addressPayload = {
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

            finalizeOrderSuccess(confirmedOrderNum, grandTotal, shiprocketTrackingCode);
            return;
          } else {
            throw new Error(res?.message || 'Failed to place order in database.');
          }
        } catch (err) {
          console.error('COD order creation failed:', err.message);
          setIsPlacingOrder(false);
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
        const errMsg = 'Payment gateway could not be loaded. Please check your network or ad-blocker settings and try again.';
        setPaymentErrorMessage(errMsg);
        showToast(errMsg, 'error');
        return;
      }

      const rzpOptions = {
        key: razorpayKey,
        amount: rzpOrderData?.amount || Math.round(grandTotal * 100),
        currency: rzpOrderData?.currency || 'INR',
        name: 'House of Urvaah',
        description: paymentMethod === 'card' ? 'Credit / Debit Card Purchase (Incl. 2% Card Fee)' : 'UPI / QR Code Purchase',
        image: (typeof window !== 'undefined' && window.location.hostname === 'localhost') ? undefined : `${window.location.origin}/assets/Images/Brown01.png`,
        order_id: (rzpOrderData?.id && !rzpOrderData.id.startsWith('order_rzp_test_')) ? rzpOrderData.id : undefined,
        prefill: {
          name: selectedAddr.name || user?.name || '',
          email: user?.email || '',
          contact: selectedAddr.phone || user?.phone || '',
          method: paymentMethod === 'card' ? 'card' : undefined
        },
        theme: {
          color: '#111111'
        },
        handler: async function (response) {
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
      console.error('Error in handlePlaceOrder:', err);
      setIsPlacingOrder(false);
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
      discount: 0,
      shippingFee: 0,
      totalPaid: confirmedGrandTotal || 4999,
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
    const isCancellationRequested = currentStatusStr === 'cancellation requested' || currentStatusStr === 'cancel_requested';
    const isOrderCancelled = orderCancelled || ((currentStatusStr.includes('cancel') || currentStatusStr === 'cancelled' || currentStatusStr === 'canceled') && !isCancellationRequested);
    const isReturnRequested = currentStatusStr === 'return requested' || currentStatusStr === 'return request processing';
    const isReturnApproved = currentStatusStr === 'return approved';
    const isReceivedAtUrvaah = currentStatusStr === 'received at house of urvaah' || currentStatusStr === 'received at urvaah house';
    const isReturned = currentStatusStr === 'returned' || currentStatusStr === 'return completed';
    const isInReturnFlow = isReturnRequested || isReturnApproved || isReceivedAtUrvaah || isReturned;

    // Replacement Flow States in Checkout
    const isReplacementRequested = currentStatusStr === 'replacement request processing' || currentStatusStr === 'replace requested' || currentStatusStr === 'replacement requested';
    const isReplacementApproved = currentStatusStr === 'replace approved' || currentStatusStr === 'replacement approved';
    const isReplacementInTransit = currentStatusStr === 'replacement processing' || currentStatusStr === 'replacement shipped' || currentStatusStr === 'in reverse transit';
    const isReplacementOutForDelivery = currentStatusStr === 'replacement out for delivery';
    const isReplaced = currentStatusStr === 'replaced';
    const isReplacementRejected = currentStatusStr === 'replace rejected';
    const isInReplacementFlow = isReplacementRequested || isReplacementApproved || isReplacementInTransit || isReplacementOutForDelivery || isReplaced || isReplacementRejected;

    const isDelivered = (currentStatusStr.includes('delivered') || currentStatusStr.includes('completed')) && !isInReturnFlow && !isInReplacementFlow;
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

    const handleReorder = () => {
      if (details && details.items) {
        details.items.forEach((item) => {
          if (addToCart) {
            addToCart(item.product || { id: item.id, name: item.name, price: item.price, image: item.image }, item.selectedSize || 'M');
          }
        });
        navigate('/checkout');
      }
    };

    const handleDownloadInvoice = () => {
      setIsInvoiceModalOpen(true);
    };

    const handleReturnOrder = async () => {
      if (isCancellingOrder) return;

      const { value: formValues } = await Swal.fire({
        title: 'Return Order (Post-Delivery)',
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
            setPlacedOrderDetails((prev) => ({
              ...prev,
              status: 'Return Requested',
              cancel_reason: formValues.reason
            }));
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

    const handleCancelOrder = () => {
      setCancelOrderReason(isDelivered ? 'Size or fit issue' : 'Ordered by mistake');
      setCancelOrderComments('');
      setCancelOrderError('');
      setIsCancelOrderModalOpen(true);
    };

    const handleConfirmCancellation = async (e) => {
      if (e) e.preventDefault();
      if (!cancelOrderReason) {
        setCancelOrderError('Please select a reason for cancellation.');
        return;
      }
      setIsCancellingOrder(true);
      setCancelOrderError('');

      const finalReason = cancelOrderComments.trim()
        ? `${cancelOrderReason} - ${cancelOrderComments.trim()}`
        : cancelOrderReason;

      const orderNum = details?.orderNumber || placedOrderNumber;
      if (orderNum) {
        try {
          // Direct call to Shiprocket Cancel Order / Shipment API
          await apiClient('/api/shipping/order/cancel', {
            method: 'POST',
            body: JSON.stringify({
              order_ids: [orderNum],
              order_id: orderNum,
              reason: finalReason
            })
          }).catch((e) => console.warn('Shipping cancel API error:', e.message));

          const res = await apiClient(`/api/orders/${orderNum}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ cancelReason: finalReason })
          });
          const targetStatus = res?.data?.status || 'Cancellation Requested';
          setPlacedOrderDetails((prev) => ({
            ...prev,
            status: targetStatus,
            cancel_reason: finalReason
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
            cancel_reason: finalReason
          });

          setToast({
            type: 'success',
            title: 'Cancellation Submitted',
            message: 'Your cancellation request has been submitted to our atelier team.'
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
              initial={{ opacity: 0, y: -24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -24, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`fixed top-24 sm:top-28 left-1/2 -translate-x-1/2 z-[100] max-w-lg w-[92%] sm:w-auto px-5 py-3.5 shadow-2xl backdrop-blur-md flex items-center justify-between gap-4 font-sans border text-white ${
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
                isOrderCancelled ? 'bg-red-600 text-white' : 'bg-brand-dark text-white'
              }`}
            >
              {isOrderCancelled ? (
                <X className="w-8 h-8 stroke-[2.5]" />
              ) : (
                <Check className="w-8 h-8 stroke-[2.5]" />
              )}
            </motion.div>

            <span className="text-[10px] tracking-[0.25em] uppercase text-neutral-500 block mb-1.5 font-serif font-semibold">
              {isOrderCancelled
                ? 'ORDER CANCELLED & SHIPROCKET SHIPMENT VOIDED'
                : isDelivered
                ? 'ORDER DELIVERED & COMPLETED'
                : 'ORDER CONFIRMED & PROCESSING'}
            </span>
            <h1 className="text-2xl sm:text-4xl font-serif tracking-[0.12em] uppercase text-black font-semibold mb-2">
              {isOrderCancelled
                ? 'THIS ORDER HAS BEEN CANCELLED'
                : isDelivered
                ? 'THANK YOU! YOUR ORDER HAS BEEN DELIVERED'
                : 'THANK YOU FOR YOUR ORDER'}
            </h1>
            <p className="text-xs font-sans text-neutral-500 tracking-wider uppercase">
              {isOrderCancelled ? (
                'Shiprocket courier pickup was voided prior to dispatch. 100% full refund has been initiated to your original payment method.'
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
                <span className="text-sm sm:text-base font-semibold text-black font-serif tracking-[0.06em]">
                  {details.orderNumber}
                </span>
              </div>
            </div>

            {/* Card 2: Tracking Number / Shiprocket Status */}
            <div className="bg-[#FAF8F3] border border-neutral-200/80 p-5 sm:p-6 flex items-center gap-4 text-left">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-white ${
                isOrderCancelled ? 'bg-red-700' : 'bg-brand-dark'
              }`}>
                <Truck className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="font-sans flex-1">
                <span className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 font-semibold block mb-0.5">
                  {isOrderCancelled ? 'Shiprocket Logistics' : 'Tracking Number'}
                </span>
                <span className={`text-sm sm:text-base font-semibold font-serif tracking-[0.06em] block ${
                  isOrderCancelled ? 'text-red-700' : 'text-black'
                }`}>
                  {isOrderCancelled ? 'Pickup Voided • ₹0 Freight' : details.trackingNumber}
                </span>
                {!isOrderCancelled && (
                  <button
                    type="button"
                    onClick={() => setLiveTrackingOpen(true)}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white hover:bg-neutral-800 text-[10px] font-sans font-bold tracking-[0.16em] uppercase rounded-md shadow-2xs transition-colors cursor-pointer"
                  >
                    <Truck className="w-3 h-3" />
                    <span>Live Track Parcel</span>
                  </button>
                )}
              </div>
            </div>

            {/* Card 3: Estimated Delivery / Settlement */}
            <div className="bg-[#FAF8F3] border border-neutral-200/80 p-5 sm:p-6 flex items-center gap-4 text-left">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-white ${
                isOrderCancelled ? 'bg-emerald-700' : 'bg-brand-dark'
              }`}>
                {isOrderCancelled ? <RotateCcw className="w-5 h-5 stroke-[1.8]" /> : <Calendar className="w-5 h-5 stroke-[1.8]" />}
              </div>
              <div className="font-sans">
                <span className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 font-semibold block mb-0.5">
                  {isOrderCancelled ? 'Financial Settlement' : 'Estimated Delivery'}
                </span>
                <span className="text-xs sm:text-sm font-bold text-black font-sans tracking-tight">
                  {isOrderCancelled ? 'Full Refund Initiated (3-5 Days)' : details.estimatedDelivery}
                </span>
              </div>
            </div>
          </div>

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
                    className="inline-flex items-center gap-2 border border-neutral-300 hover:border-black text-brand-dark text-[10px] font-sans font-bold tracking-[0.2em] uppercase px-4 py-2.5 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reorder This Entire Order</span>
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
                          <div className="flex items-center gap-2 mt-1.5 font-sans">
                            <span className="text-[11px] text-neutral-500 font-medium">Qty: {item.quantity}</span>
                            <span className={`px-2 py-0.5 text-[9px] font-sans font-semibold tracking-[0.16em] uppercase ${
                              orderCancelled
                                ? 'bg-red-900 text-white'
                                : isDelivered
                                ? 'bg-emerald-700 text-white'
                                : isOutForDelivery
                                ? 'bg-blue-700 text-white'
                                : isShipped
                                ? 'bg-amber-600 text-white'
                                : 'bg-brand-dark text-white'
                            }`}>
                              {orderCancelled ? 'CANCELLED' : isDelivered ? 'DELIVERED' : isOutForDelivery ? 'OUT FOR DELIVERY' : isShipped ? 'SHIPPED' : 'PROCESSING'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-sans">
                        <span className="text-sm font-bold text-black block font-serif">{formatPrice(item.price * item.quantity)}</span>
                        <span className="text-[10px] text-neutral-400 font-medium block uppercase tracking-wider">{formatPrice(item.price)} each</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Subtotals */}
                <div className="pt-6 border-t border-neutral-200 space-y-3 text-xs font-sans text-neutral-600">
                  <div className="flex justify-between items-center">
                    <span className="uppercase tracking-wider">Original Order Total</span>
                    <span className="font-semibold text-black">{formatPrice(details.subtotal)}</span>
                  </div>
                  {details.discount > 0 && (
                    <div className="flex justify-between items-center text-emerald-800 font-medium">
                      <span className="uppercase tracking-wider">Effective Subtotal</span>
                      <span>-{formatPrice(details.discount)}</span>
                    </div>
                  )}
                  {(details.tax > 0 || details.taxRate) && (
                    <div className="flex justify-between items-center text-neutral-600">
                      <span className="uppercase tracking-wider">GST / Tax ({details.taxRate || (details.subtotal > 2500 ? 18 : 5)}%)</span>
                      <span className="font-semibold text-black">+{formatPrice(details.tax || Math.round(details.subtotal * ((details.subtotal > 2500 ? 18 : 5) / 100)))}</span>
                    </div>
                  )}
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
                  <span className="text-xl sm:text-2xl font-bold text-black">{formatPrice(details.totalPaid)}</span>
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
              {/* Card 1: ORDER JOURNEY Timeline, CANCELLATION LIFECYCLE, or REPLACEMENT JOURNEY */}
              {isInReplacementFlow ? (
                <div className="bg-white border border-purple-200/80 p-6 sm:p-8">
                  <div className="flex items-center justify-between pb-3 mb-6 border-b border-purple-100">
                    <h3 className="text-xs font-serif tracking-[0.25em] uppercase text-purple-950 font-semibold flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 text-purple-700" />
                      <span>EXCHANGE & REPLACEMENT JOURNEY</span>
                    </h3>
                    <span className="text-[10px] font-sans font-bold tracking-[0.16em] uppercase text-purple-700">
                      STEP {isReplaced ? '4 OF 4' : (isReplacementOutForDelivery || isReplacementInTransit) ? '3 OF 4' : isReplacementApproved ? '2 OF 4' : '1 OF 4'}
                    </span>
                  </div>

                  <div className="space-y-6 relative pl-1">
                    {/* Connected Vertical Line */}
                    <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-neutral-200" />

                    {/* Step 1: REPLACEMENT REQUESTED */}
                    <div className="relative flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 font-bold text-xs bg-purple-700 text-white shadow-xs">
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div className="font-sans pt-0.5">
                        <h4 className="text-xs font-bold tracking-[0.15em] text-black uppercase">REPLACEMENT REQUESTED</h4>
                        <span className="text-[9px] font-sans font-semibold tracking-[0.16em] uppercase block mt-1 text-purple-700">
                          COMPLETED
                        </span>
                      </div>
                    </div>

                    {/* Step 2: ATELIER APPROVED */}
                    <div className="relative flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${isReplacementApproved || isReplacementInTransit || isReplacementOutForDelivery || isReplaced ? 'bg-purple-700 text-white shadow-xs font-bold' : 'bg-white border-2 border-neutral-300 text-neutral-400'}`}>
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="font-sans pt-0.5">
                        <h4 className={`text-xs font-bold tracking-[0.15em] uppercase ${isReplacementApproved || isReplacementInTransit || isReplacementOutForDelivery || isReplaced ? 'text-black font-bold' : 'text-neutral-400'}`}>ATELIER APPROVED</h4>
                        <span className={`text-[9px] font-sans font-medium tracking-[0.16em] uppercase block mt-1 ${isReplacementApproved || isReplacementInTransit || isReplacementOutForDelivery || isReplaced ? 'text-purple-700 font-bold' : 'text-neutral-400'}`}>
                          {isReplacementApproved || isReplacementInTransit || isReplacementOutForDelivery || isReplaced ? 'COMPLETED' : 'PENDING'}
                        </span>
                      </div>
                    </div>

                    {/* Step 3: IN TRANSIT */}
                    <div className="relative flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${isReplacementInTransit || isReplacementOutForDelivery || isReplaced ? 'bg-purple-700 text-white shadow-xs font-bold' : 'bg-white border-2 border-neutral-300 text-neutral-400'}`}>
                        <Truck className="w-4 h-4" />
                      </div>
                      <div className="font-sans pt-0.5">
                        <h4 className={`text-xs font-bold tracking-[0.15em] uppercase ${isReplacementInTransit || isReplacementOutForDelivery || isReplaced ? 'text-black font-bold' : 'text-neutral-400'}`}>IN TRANSIT</h4>
                        <span className={`text-[9px] font-sans font-medium tracking-[0.16em] uppercase block mt-1 ${isReplacementInTransit || isReplacementOutForDelivery || isReplaced ? 'text-purple-700 font-bold' : 'text-neutral-400'}`}>
                          {isReplacementInTransit || isReplacementOutForDelivery || isReplaced ? (isReplaced ? 'COMPLETED' : 'IN PROGRESS') : 'PENDING'}
                        </span>
                      </div>
                    </div>

                    {/* Step 4: REPLACED & DELIVERED */}
                    <div className="relative flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${isReplaced ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'bg-white border-2 border-neutral-300 text-neutral-400'}`}>
                        <PackageCheck className="w-4 h-4" />
                      </div>
                      <div className="font-sans pt-0.5">
                        <h4 className={`text-xs font-bold tracking-[0.15em] uppercase ${isReplaced ? 'text-emerald-700 font-bold' : 'text-neutral-400'}`}>REPLACED & DELIVERED</h4>
                        <span className={`text-[9px] font-sans font-medium tracking-[0.16em] uppercase block mt-1 ${isReplaced ? 'text-emerald-700 font-bold' : 'text-neutral-400'}`}>
                          {isReplaced ? 'DELIVERED' : 'PENDING'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : !isCancellationRequested && !isInReturnFlow ? (
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
                          {(details.paymentMethod || '').toLowerCase().includes('cod') ? 'COD SETTLED' : 'REFUND ISSUED'}
                        </h4>
                        <span className="text-[9px] font-sans font-semibold tracking-[0.16em] uppercase block mt-1 text-emerald-700">
                          {(details.paymentMethod || '').toLowerCase().includes('cod') ? 'ZERO PAYMENT COLLECTED' : '100% REFUND INITIATED'}
                        </span>
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
                        <h4 className="text-xs font-bold tracking-[0.15em] text-black uppercase">ORDER PLACED</h4>
                        <span className={`text-[9px] font-sans font-semibold tracking-[0.16em] uppercase block mt-1 ${isShipped ? 'text-black' : 'text-yellow-700'}`}>
                          {isShipped ? 'COMPLETED' : 'IN PROGRESS'}
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
              ) : null}

              {/* Card 2: Order Status & Actions */}
              <div className="bg-white border border-neutral-200/80 p-6 sm:p-8 font-sans">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-200">
                  <h3 className="text-lg sm:text-xl font-serif tracking-[0.15em] uppercase text-black font-semibold">
                    ORDER STATUS
                  </h3>
                  <button
                    type="button"
                    onClick={handleDownloadInvoice}
                    className="inline-flex items-center gap-1.5 border border-neutral-300 hover:border-black text-brand-dark text-[10px] font-sans font-bold tracking-[0.2em] uppercase px-3 py-1.5 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>DOWNLOAD INVOICE</span>
                  </button>
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
                      isOrderCancelled
                        ? 'bg-red-900 text-white'
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
                        ? 'bg-amber-600 text-white'
                        : isReturnApproved
                        ? 'bg-indigo-600 text-white'
                        : isReceivedAtUrvaah
                        ? 'bg-blue-600 text-white'
                        : isReturned
                        ? 'bg-emerald-600 text-white'
                        : isDelivered
                        ? 'bg-emerald-600 text-white'
                        : isOutForDelivery
                        ? 'bg-blue-600 text-white'
                        : isShipped
                        ? 'bg-amber-500 text-black'
                        : 'bg-yellow-400 text-black'
                    }`}>
                      {isOrderCancelled
                        ? 'CANCELLED'
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
                        ? 'RETURN IN TRANSIT'
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
                    const isCod = (details.paymentMethod || '').toLowerCase().includes('cash') || (details.paymentMethod || '').toLowerCase().includes('cod');
                    const isPaid = (isDelivered && isCod) || (details.paymentStatus || details.payment_status || '').toLowerCase() === 'paid';
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
                  {!isOrderCancelled && (
                    <button
                      type="button"
                      onClick={() => setLiveTrackingOpen(true)}
                      className="w-full py-4 bg-brand-dark hover:bg-neutral-800 text-white text-xs font-sans font-bold tracking-[0.25em] uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <Truck className="w-4 h-4" />
                      <span>TRACK YOUR SHIPMENT LIVE</span>
                    </button>
                  )}

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

                  {/* Cancel Order Button (Both Pre-Delivery and Post-Delivery) */}
                  {!isOrderCancelled && !isCancellationRequested && !isInReplacementFlow && (
                    <button
                      type="button"
                      onClick={handleCancelOrder}
                      className="w-full py-3.5 px-4 border border-neutral-900 bg-[#dcdcdc] hover:bg-[#d0d0d0] text-xs font-sans font-bold tracking-[0.25em] uppercase text-neutral-900 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>CANCEL ORDER</span>
                    </button>
                  )}

                  {/* Post-Delivery Give Feedback Button */}
                  {!isOrderCancelled && !isCancellationRequested && isDelivered && (
                    <button
                      type="button"
                      onClick={() => {
                        const items = orderDetails?.items || [];
                        const firstItem = items[0];
                        const prodId = firstItem?.product_id || firstItem?.productId || firstItem?.id;
                        if (prodId) {
                          navigate(`/product/${prodId}?openReview=true#customer-reviews`);
                        }
                      }}
                      className="w-full py-3.5 px-4 border border-black text-white bg-black hover:bg-neutral-800 text-xs font-sans font-bold tracking-[0.25em] uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span>GIVE FEEDBACK</span>
                    </button>
                  )}

                  {/* Post-Delivery Replace Button */}
                  {!isOrderCancelled && !isCancellationRequested && isDelivered && !isInReplacementFlow && (
                    <button
                      type="button"
                      onClick={handleReplaceOrder}
                      className="w-full py-3.5 px-4 border border-purple-900/40 text-purple-950 bg-purple-50/70 hover:bg-purple-900 hover:text-white text-xs font-sans font-bold tracking-[0.25em] uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>REPLACE PRODUCT</span>
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
                    <div className="w-full py-3 px-4 bg-red-50 border border-red-200 text-red-900 text-xs font-sans font-bold tracking-[0.15em] uppercase flex items-center justify-center gap-2 text-center">
                      <XCircle className="w-4 h-4 text-red-700" />
                      <span>Order Cancelled</span>
                    </div>
                  )}

                  {/* Pre-Delivery Cancellation Review Pill */}
                  {isCancellationRequested && (
                    <div className="w-full py-3 px-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-sans font-bold tracking-[0.15em] uppercase flex items-center justify-center gap-2 text-center">
                      <Clock className="w-4 h-4 text-amber-700" />
                      <span>Cancellation Pending Admin Approval</span>
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
                className="relative z-10 w-full max-w-lg bg-white shadow-2xl p-6 sm:p-8 border border-neutral-200 max-h-[90vh] overflow-y-auto text-left"
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
                    HOUSE OF URVAAH ATELIER
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

                  {/* Policy Info Note */}
                  <div className="p-3 bg-[#FAF8F3] border border-neutral-200 text-[11px] text-neutral-600 leading-relaxed font-sans">
                    {isDelivered
                      ? 'Once submitted, your post-delivery cancellation request will be reviewed by our atelier team. Upon approval, reverse pickup will be scheduled and your refund processed via the Refund Desk.'
                      : 'Once submitted, your request will be reviewed by our atelier admin team. If you paid online, your refund will be automatically routed to the Refund Desk upon approval.'}
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
                      placeholder="e.g. Kuldeep Mahajan"
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
              initial={{ opacity: 0, y: -24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -24, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`fixed top-24 sm:top-28 left-1/2 -translate-x-1/2 z-[100] max-w-lg w-[92%] sm:w-auto px-5 py-3.5 shadow-2xl backdrop-blur-md flex items-center justify-between gap-4 font-sans border text-white ${
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
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            0% Extra Charge
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
                          <span className="text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            +2% Extra Charge (+{formatPrice(Math.round(basePayable * 0.02))})
                          </span>
                        </div>
                        <p className="text-neutral-500 text-[11px] mt-0.5">
                          Pay securely using Visa, Mastercard, RuPay, or American Express. A 2% processing fee is applied.
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
                disabled={isPlacingOrder || selectedItems.length === 0 || (shippingServiceability.checked && !shippingServiceability.available)}
                className="w-full py-4 bg-[#111111] hover:bg-neutral-800 text-white text-xs font-sans font-bold tracking-[0.25em] uppercase transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {isPlacingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white stroke-[2.25] shrink-0" />
                    <span>PROCESSING ORDER...</span>
                  </>
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
                    {selectedItems.map((item, idx) => (
                      <div key={`selected-${item.product.id}-${item.selectedSize}-${idx}`} className="py-3.5 first:pt-2 last:pb-1 flex gap-3.5 items-center">
                        <div className="relative flex-shrink-0 pt-1 pr-1">
                          <img
                            src={getSupabaseMediaUrl(item.product.image)}
                            alt={item.product.name}
                            className="w-16 h-20 object-cover object-top border border-neutral-200 bg-white"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = getSupabaseMediaUrl('Images/Blue02.png');
                            }}
                          />
                          <span className="absolute top-0 right-0 w-5 h-5 bg-black text-white text-[10px] font-sans font-semibold rounded-full flex items-center justify-center tabular-nums shadow-xs">
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
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs font-bold text-neutral-900">
                              {formatPrice(item.product.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
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
                    {unselectedItems.map((item, idx) => (
                      <div key={`unselected-${item.product.id}-${item.selectedSize}-${idx}`} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={getSupabaseMediaUrl(item.product.image)}
                            alt={item.product.name}
                            className="w-11 h-14 object-cover object-top border border-neutral-200 bg-white shrink-0 rounded-xs"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = getSupabaseMediaUrl('Images/Blue02.png');
                            }}
                          />
                          <div className="min-w-0">
                            <h5 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-800 truncate">
                              {item.product.name}
                            </h5>
                            <p className="text-[10px] text-neutral-500">
                              Size: <strong className="text-neutral-700">{item.selectedSize}</strong> &bull; Qty: {item.quantity}
                            </p>
                            <p className="text-[11px] font-bold text-neutral-900">
                              {formatPrice(item.product.price * item.quantity)}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleIncludeItemInOrder(item)}
                          className="px-2.5 py-1.5 rounded-lg border border-[#c5a880] hover:border-black bg-white hover:bg-[#FAF8F3] text-neutral-900 text-[10px] font-sans font-bold tracking-[0.14em] uppercase transition cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
                        >
                          <Plus className="w-3 h-3 text-[#8c734b]" />
                          <span>ADD TO ORDER</span>
                        </button>
                      </div>
                    ))}
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

                {/* Card Surcharge Line Item (if card selected) */}
                {paymentMethod === 'card' && (
                  <div className="flex justify-between items-center text-amber-900 bg-amber-50/80 px-2.5 py-2 rounded-xs border border-amber-300/80 text-xs">
                    <span className="uppercase tracking-wider text-[11px] font-semibold flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                      Card Processing Surcharge (2%)
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
