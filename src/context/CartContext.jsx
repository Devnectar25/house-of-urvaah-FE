import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import apiClient, { getAuthToken, setAuthToken, getStoredUser, setStoredUser, clearAuthSession } from '../lib/apiClient';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import { checkItemStockStatus } from '../utils/stockValidator';

const CartContext = createContext();

export const getCartItemKey = (item) => {
  if (!item) return '';
  const prodId = item.product?.id || item.id || item.productId || '';
  const size = (item.selectedSize || item.size || 'M').trim().toUpperCase();
  return `${String(prodId).trim()}_${String(size).trim()}`;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState(() => {
    try {
      const savedUserStr = localStorage.getItem('urvaah_user');
      let userId = null;
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        userId = parsed?.id || parsed?.username;
      }
      const token = localStorage.getItem('urvaah_token') || localStorage.getItem('sb-access-token');
      const cachedKey = (token && userId) ? `urvaah_wishlist_${userId}` : 'urvaah_guest_wishlist';
      const cached = localStorage.getItem(cachedKey) || localStorage.getItem('urvaah_guest_wishlist');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(String);
      }
    } catch (e) {}
    return [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [user, setUser] = useState(() => getStoredUser()); // formatted user object
  const [token, setTokenState] = useState(() => getAuthToken());
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(() => {
    return !getAuthToken() && !getStoredUser();
  });
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [pdpProduct, setPdpProduct] = useState(null);

  // Selected cart items for checkout (Allows buying only chosen product while keeping other bag items separate)
  const [selectedCartItemKeys, setSelectedCartItemKeys] = useState(() => {
    try {
      const raw = sessionStorage.getItem('urvaah_selected_cart_keys');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  });

  const updateSelectedCartItemKeys = (keysOrFn) => {
    setSelectedCartItemKeys((prev) => {
      const next = typeof keysOrFn === 'function' ? keysOrFn(prev) : keysOrFn;
      try {
        sessionStorage.setItem('urvaah_selected_cart_keys', JSON.stringify(next || []));
      } catch (e) {}
      return next || [];
    });
  };

  const toggleCartItemSelection = (itemKey) => {
    updateSelectedCartItemKeys((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      if (current.includes(itemKey)) {
        return current.filter((k) => k !== itemKey);
      } else {
        return [...current, itemKey];
      }
    });
  };

  const selectAllCartItems = () => {
    const allKeys = cart.map(getCartItemKey);
    updateSelectedCartItemKeys(allKeys);
  };

  const selectOnlyCartItem = (itemKey) => {
    updateSelectedCartItemKeys([itemKey]);
  };

  const formatUserData = (userData) => {
    if (!userData) return null;
    if (userData.id === '1' || userData.username === '1' || String(userData.email || userData.emailid || '').includes('@urvaah.local')) {
      return null;
    }
    const fullName = userData.fullName || userData.name || userData.fullname || userData.user_metadata?.full_name || userData.email?.split('@')[0] || 'Atelier Member';
    const firstName = fullName.trim().split(' ')[0] || fullName;
    return {
      id: userData.id || userData.userid || userData.username || 'user',
      name: fullName,
      firstName: firstName,
      email: userData.email || userData.emailid || '',
      phone: userData.phone || userData.contactno || '',
      addresses: userData.addresses || [],
      memberSince: userData.memberSince || userData.member_since || null,
      avatar: userData.avatar || userData.avatar_url || '',
      bankDetails: {
        accountNumber: userData.bankDetails?.accountNumber || userData.refund_bank_account || (() => {
          try {
            const raw = localStorage.getItem('urvaah_saved_bank');
            return raw ? JSON.parse(raw)?.accountNumber || '' : '';
          } catch (e) { return ''; }
        })(),
        ifscCode: userData.bankDetails?.ifscCode || userData.refund_ifsc_code || (() => {
          try {
            const raw = localStorage.getItem('urvaah_saved_bank');
            return raw ? JSON.parse(raw)?.ifscCode || '' : '';
          } catch (e) { return ''; }
        })(),
        holderName: userData.bankDetails?.holderName || userData.refund_holder_name || (() => {
          try {
            const raw = localStorage.getItem('urvaah_saved_bank');
            return raw ? JSON.parse(raw)?.holderName || '' : '';
          } catch (e) { return ''; }
        })()
      }
    };
  };

  const fetchUserProfile = async () => {
    try {
      const res = await apiClient('/api/users/profile');
      if (res?.success && res?.user) {
        const formatted = formatUserData({
          ...res.user,
          addresses: res.addresses || []
        });
        if (formatted) {
          setUser(formatted);
          setStoredUser(formatted);
          if (formatted.bankDetails?.accountNumber) {
            try {
              localStorage.setItem('urvaah_saved_bank', JSON.stringify(formatted.bankDetails));
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch profile with stored JWT:', err.message);
      // ONLY clear session if server explicitly returned 401 Unauthorized (expired/invalid JWT)
      // Never clear session on 404, 403, 500, network error, etc.!
      if (err.status === 401) {
        clearAuthSession();
        setUser(null);
        setTokenState(null);
      }
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      const res = await apiClient('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      if (res.success && res.user) {
        const formatted = formatUserData({
          ...res.user,
          addresses: user?.addresses || []
        });
        setUser(formatted);
        setStoredUser(formatted);
        if (formatted?.bankDetails?.accountNumber) {
          try {
            localStorage.setItem('urvaah_saved_bank', JSON.stringify(formatted.bankDetails));
          } catch (e) {}
        }
        return { success: true };
      }
      return { success: false, error: res.message || 'Update failed' };
    } catch (err) {
      console.error('Failed to update user profile via backend API:', err);
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    // 1. Initial check for JWT token & user in localStorage
    const savedToken = getAuthToken();
    const savedUser = getStoredUser();

    if (savedToken) {
      setTokenState(savedToken);
      if (savedUser && !user) {
        setUser(savedUser);
      }
      // Re-fetch ground truth profile details in background without locking out the user
      fetchUserProfile().finally(() => {
        setAuthLoading(false);
      });
    } else {
      // Fallback: check Supabase session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session?.user) {
          const formatted = formatUserData(session.user);
          setUser(formatted);
        }
        setAuthLoading(false);
      }).catch(() => {
        setAuthLoading(false);
      });
    }

    // Listen for Supabase Auth changes as fallback
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user && !getAuthToken()) {
        const formatted = formatUserData(session.user);
        setUser(formatted);
      }
      if (!getAuthToken()) {
        setAuthLoading(false);
      }
    });

    // Listen for global customer unauthorized event
    const handleUnauthorized = () => {
      setUser(null);
      setTokenState(null);
      setAuthLoading(false);
    };
    window.addEventListener('urvaah:auth:unauthorized', handleUnauthorized);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('urvaah:auth:unauthorized', handleUnauthorized);
    };
  }, []);

  // Lock background body scroll whenever any drawer or modal overlay is open
  const isOverlayActive = Boolean(
    isCartOpen ||
    isSearchOpen ||
    isMobileMenuOpen ||
    isAuthModalOpen ||
    quickViewProduct ||
    pdpProduct
  );
  useModalScrollLock(isOverlayActive);

  // Fetch & persist wishlist for user
  useEffect(() => {
    const isAdminUser = ['admin', 'super_admin', 'subadmin', 'sub_admin'].includes((user?.role || '').toLowerCase());
    if (!user || isAdminUser) {
      if (!user) {
        const cached = localStorage.getItem('urvaah_guest_wishlist');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) setWishlist(parsed.map(String));
          } catch (e) {}
        }
      }
      return;
    }

    const userId = user.id || user.username || 'user';
    const cachedKey = `urvaah_wishlist_${userId}`;

    // 1. Instant load from localStorage cache if available
    const cached = localStorage.getItem(cachedKey) || localStorage.getItem('urvaah_guest_wishlist');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWishlist(parsed.map(String));
        }
      } catch (e) {}
    }

    // 2. Fetch ground truth wishlist from backend API
    apiClient(`/api/wishlist/${userId}`)
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          if (res.data.length > 0) {
            const ids = res.data.map((item) => String(item.productId || item.product_id));
            setWishlist(ids);
            localStorage.setItem(cachedKey, JSON.stringify(ids));
          } else {
            // Backend wishlist is empty. If local wishlist has items, PRESERVE them and sync to backend!
            setWishlist((prevWishlist) => {
              if (prevWishlist && prevWishlist.length > 0) {
                for (const id of prevWishlist) {
                  apiClient('/api/wishlist/toggle', {
                    method: 'POST',
                    body: JSON.stringify({ userId, productId: id })
                  }).catch(() => {});
                }
                localStorage.setItem(cachedKey, JSON.stringify(prevWishlist));
                return prevWishlist;
              }
              localStorage.setItem(cachedKey, JSON.stringify([]));
              return [];
            });
          }
        }
      })
      .catch((err) => {
        console.warn('Could not fetch backend wishlist, using cached:', err.message);
      });
  }, [user?.id, user?.role]);

  // Fetch & persist cart for user
  useEffect(() => {
    const isAdminUser = ['admin', 'super_admin', 'subadmin', 'sub_admin'].includes((user?.role || '').toLowerCase());
    if (!user || isAdminUser) {
      if (!user) {
        const cached = localStorage.getItem('urvaah_guest_cart');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) setCart(parsed);
          } catch (e) {}
        } else {
          setCart([]);
        }
      }
      return;
    }

    const userId = user.id || user.username || 'user';
    const cachedKey = `urvaah_cart_${userId}`;

    // 1. Instant load from localStorage cache if available
    const cached = localStorage.getItem(cachedKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setCart(parsed);
        }
      } catch (e) {}
    }

    // 2. Fetch ground truth cart from backend API
    apiClient(`/api/cart/${userId}`)
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          if (res.data.length > 0) {
            let localCartMap = {};
            try {
              const localRaw = localStorage.getItem(cachedKey);
              if (localRaw) {
                const parsed = JSON.parse(localRaw);
                if (Array.isArray(parsed)) {
                  parsed.forEach(it => {
                    const pId = String(it.product?.id || it.productId || it.id);
                    if (pId && it.selectedSize) {
                      localCartMap[pId] = String(it.selectedSize).trim().toUpperCase();
                    }
                  });
                }
              }
            } catch (e) {}

            const mappedBackendCart = res.data
              .map((item) => {
                const sizeStock = item.sizeStock || item.size_stock || {};
                const stock = (item.stockQuantity !== null && item.stockQuantity !== undefined)
                  ? Number(item.stockQuantity)
                  : ((item.stock_quantity !== null && item.stock_quantity !== undefined)
                    ? Number(item.stock_quantity)
                    : (Object.keys(sizeStock).length > 0
                        ? Object.values(sizeStock).reduce((acc, v) => acc + (parseInt(v, 10) || 0), 0)
                        : 0));

                const pId = String(item.productId || item.product_id || item.id);
                let chosenSize = (item.selectedSize || item.size || '').trim().toUpperCase();

                // If backend returned default 'M' or empty, but size M is 0 in size_stock, check local cart
                if (!chosenSize || (chosenSize === 'M' && sizeStock && typeof sizeStock === 'object' && sizeStock['M'] === 0)) {
                  if (localCartMap[pId]) {
                    chosenSize = localCartMap[pId];
                  }
                }

                // If chosenSize is still empty or has 0 stock while other sizes exist, pick first in-stock size
                if (!chosenSize || (sizeStock && typeof sizeStock === 'object' && Object.keys(sizeStock).length > 0 && (parseInt(sizeStock[chosenSize], 10) || 0) <= 0)) {
                  const sizes = Array.isArray(item.sizes) && item.sizes.length > 0 ? item.sizes : ['XS', 'S', 'M', 'L', 'XL'];
                  const inStockSize = sizes.find(sz => {
                    const matchK = Object.keys(sizeStock).find(k => k.trim().toUpperCase() === sz.trim().toUpperCase());
                    return matchK !== undefined ? (parseInt(sizeStock[matchK], 10) || 0) > 0 : false;
                  });
                  if (inStockSize) {
                    chosenSize = inStockSize;
                  } else {
                    chosenSize = chosenSize || 'M';
                  }
                }

                const clampedQty = stock > 0 ? Math.max(1, Math.min(Number(item.quantity || 1), stock)) : Number(item.quantity || 1);
                return {
                  product: {
                    id: pId,
                    name: item.name || item.productname || item.title || 'Product',
                    price: Number(item.price || 0),
                    originalPrice: Number(item.originalPrice || item.originalprice || item.price || 0),
                    image: item.image || item.image_url || '/assets/Images/Brown01.png',
                    brand: item.brand || 'House of Urvaah',
                    category: item.category || 'CLOTHING',
                    inStock: item.inStock ?? (stock > 0),
                    instock: item.inStock ?? (stock > 0),
                    stockQuantity: stock,
                    stock_quantity: stock,
                    sizeStock: sizeStock,
                    size_stock: sizeStock
                  },
                  selectedSize: chosenSize,
                  quantity: clampedQty
                };
              })
              // Do not inject items that are strictly out of stock from outdated backend rows
              .filter(cartItem => !checkItemStockStatus(cartItem).isOutOfStock);

            setCart(mappedBackendCart);
            localStorage.setItem(cachedKey, JSON.stringify(mappedBackendCart));
          } else {
            // Backend cart is empty. If local cart has items, preserve them and sync to backend DB!
            setCart((prevCart) => {
              if (prevCart && prevCart.length > 0) {
                for (const cItem of prevCart) {
                  const numericId = parseInt(String(cItem.product.id).replace(/\D/g, ''), 10);
                  if (numericId && !isNaN(numericId)) {
                    apiClient('/api/cart/add', {
                      method: 'POST',
                      body: JSON.stringify({ userId, productId: numericId, quantity: cItem.quantity, size: cItem.selectedSize })
                    }).catch(() => {});
                  }
                }
                localStorage.setItem(cachedKey, JSON.stringify(prevCart));
                return prevCart;
              }
              localStorage.setItem(cachedKey, JSON.stringify([]));
              return [];
            });
          }
        }
      })
      .catch((err) => {
        console.warn('Could not fetch backend cart, using cached:', err.message);
      });
  }, [user?.id, user?.role]);

  // Live stock synchronization whenever shopping bag opens or cart changes
  const syncLiveStock = React.useCallback(async (targetCart = null) => {
    const cartToCheck = targetCart || cart;
    if (!cartToCheck || cartToCheck.length === 0) return;

    try {
      let hasChanges = false;
      const verifiedCart = await Promise.all(
        cartToCheck.map(async (item) => {
          const rawId = String(item.product?.id || item.productId || item.id || '').trim();
          if (!rawId) return item;
          // The API resolves catalog aliases (e.g. 'bs-104', '104'); only fall back to the
          // digits-only form if the raw id isn't found.
          const numericId = rawId.replace(/\D/g, '');

          try {
            let res = await apiClient(`/api/products/${encodeURIComponent(rawId)}`).catch(() => null);
            if ((!res || !res.success || !res.data) && numericId && numericId !== rawId) {
              res = await apiClient(`/api/products/${numericId}`).catch(() => null);
            }
            if (!res || !res.success || !res.data) {
              console.warn(`[CartContext] Live stock check failed for cart item "${rawId}"`);
            }
            if (res && res.success && res.data) {
              const prod = res.data;
              const liveStock = Number(
                prod.stockQuantity !== undefined && prod.stockQuantity !== null
                  ? prod.stockQuantity
                  : (prod.stock_quantity ?? prod.quantity ?? prod.stock ?? 0)
              );
              const sizeStock = prod.sizeStock || prod.size_stock || item.product?.sizeStock || {};
              const itemSize = (item.selectedSize || 'M').trim().toUpperCase();
              let sizeMaxStock = null;
              if (sizeStock && typeof sizeStock === 'object' && Object.keys(sizeStock).length > 0) {
                const matchKey = Object.keys(sizeStock).find(k => k.trim().toUpperCase() === itemSize);
                if (matchKey !== undefined) {
                  sizeMaxStock = Math.max(0, parseInt(sizeStock[matchKey], 10) || 0);
                }
              }
              const effectiveStock = sizeMaxStock !== null ? sizeMaxStock : liveStock;
              const isOutOfStock = Boolean(
                effectiveStock <= 0 ||
                liveStock <= 0 ||
                prod.inStock === false ||
                prod.instock === false ||
                prod.is_active === false
              );

              const currentStock = item.product?.stockQuantity;
              const currentQty = item.quantity;
              const clampedQty = effectiveStock > 0 ? Math.min(currentQty, effectiveStock) : currentQty;

              if (
                currentStock !== liveStock ||
                currentQty !== clampedQty ||
                item.product?.inStock !== !isOutOfStock ||
                JSON.stringify(item.product?.sizeStock || {}) !== JSON.stringify(sizeStock)
              ) {
                hasChanges = true;
                return {
                  ...item,
                  quantity: clampedQty,
                  product: {
                    ...item.product,
                    stockQuantity: liveStock,
                    stock_quantity: liveStock,
                    sizeStock: sizeStock,
                    size_stock: sizeStock,
                    inStock: !isOutOfStock,
                    instock: !isOutOfStock
                  }
                };
              }
            }
          } catch (err) {
            // Ignore network error for single item check
          }
          return item;
        })
      );

      if (hasChanges) {
        const isGuest = !user && !getAuthToken();
        const userId = user?.id || getStoredUser()?.id || 'guest';
        const cachedKey = isGuest ? 'urvaah_guest_cart' : `urvaah_cart_${userId}`;
        setCart(verifiedCart);
        localStorage.setItem(cachedKey, JSON.stringify(verifiedCart));
      }
    } catch (err) {
      console.warn('Live cart stock check error:', err);
    }
  }, [cart, user]);

  useEffect(() => {
    if (isCartOpen) {
      syncLiveStock();
    }
  }, [isCartOpen, syncLiveStock]);

  // Also re-validate a cached bag on page load and when the tab regains focus, so items that
  // went out of stock while the bag sat in localStorage are flagged even before the drawer opens.
  const syncLiveStockRef = useRef(syncLiveStock);
  syncLiveStockRef.current = syncLiveStock;
  const cartItemIdsKey = cart.map((it) => `${it.product?.id}:${it.selectedSize}`).join('|');
  useEffect(() => {
    if (cartItemIdsKey) syncLiveStockRef.current();
  }, [cartItemIdsKey]);
  useEffect(() => {
    const handleFocus = () => syncLiveStockRef.current();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const [pendingAction, setPendingAction] = useState(null);

  const requireAuth = (actionCallback) => {
    if (user || getAuthToken()) {
      if (typeof actionCallback === 'function') {
        actionCallback();
      }
    } else {
      if (typeof actionCallback === 'function') {
        setPendingAction(() => actionCallback);
      }
      openAuthModal('login');
    }
  };

  const loginUser = (userData, jwtToken = null) => {
    const formatted = formatUserData(userData);
    setUser(formatted);
    setStoredUser(formatted);

    if (jwtToken) {
      setTokenState(jwtToken);
      setAuthToken(jwtToken);
    }

    // Merge guest cart items into logged-in user cart without accidental duplication
    const guestCartStr = localStorage.getItem('urvaah_guest_cart');
    if (guestCartStr) {
      try {
        const guestItems = JSON.parse(guestCartStr);
        if (Array.isArray(guestItems) && guestItems.length > 0) {
          const userId = formatted.id || formatted.username || 'user';
          const userCartKey = `urvaah_cart_${userId}`;

          let userSavedCart = [];
          try {
            const rawUserCart = localStorage.getItem(userCartKey);
            if (rawUserCart) {
              const parsed = JSON.parse(rawUserCart);
              if (Array.isArray(parsed)) userSavedCart = parsed;
            }
          } catch (e) {}

          // Merge guest items into saved cart.
          // For matching items, use gItem.quantity (the current active guest selection).
          // NEVER compound quantity with (+ gItem.quantity) which previously doubled items on checkout!
          const merged = [...userSavedCart];
          for (const gItem of guestItems) {
            const existingIdx = merged.findIndex(
              (uItem) => String(uItem.product.id) === String(gItem.product.id) && uItem.selectedSize === gItem.selectedSize
            );
            if (existingIdx > -1) {
              merged[existingIdx] = {
                ...merged[existingIdx],
                quantity: gItem.quantity
              };
            } else {
              merged.push(gItem);
            }
          }

          setCart(merged);
          localStorage.setItem(userCartKey, JSON.stringify(merged));

          // Sync merged guest items to backend API with setMode: true
          for (const gItem of guestItems) {
            const numericId = parseInt(String(gItem.product.id).replace(/\D/g, ''), 10);
            if (numericId && !isNaN(numericId)) {
              apiClient('/api/cart/add', {
                method: 'POST',
                body: JSON.stringify({ userId, productId: numericId, quantity: gItem.quantity, setMode: true })
              }).catch(() => {});
            }
          }
        }
      } catch (e) {}
      localStorage.removeItem('urvaah_guest_cart');
    }

    // Merge guest wishlist items into logged-in user wishlist
    const guestWishlistStr = localStorage.getItem('urvaah_guest_wishlist');
    if (guestWishlistStr) {
      try {
        const guestWishlist = JSON.parse(guestWishlistStr);
        if (Array.isArray(guestWishlist) && guestWishlist.length > 0) {
          setWishlist((prevWishlist) => {
            const merged = Array.from(new Set([...prevWishlist, ...guestWishlist.map(String)]));
            const userId = formatted.id || 'user';
            localStorage.setItem(`urvaah_wishlist_${userId}`, JSON.stringify(merged));
            return merged;
          });
        }
      } catch (e) {}
      localStorage.removeItem('urvaah_guest_wishlist');
    }

    setIsAuthModalOpen(false);

    if (pendingAction) {
      const actionToRun = pendingAction;
      setPendingAction(null);
      setTimeout(() => {
        try {
          actionToRun();
        } catch (e) {
          console.error('Error executing post-login action:', e);
        }
      }, 200);
    }
  };

  const logoutUser = async () => {
    try {
      await apiClient('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    clearAuthSession();
    setTokenState(null);
    setUser(null);
    setSession(null);
    setWishlist([]);
    setCart([]);
    setPendingAction(null);
    setIsAuthModalOpen(false);
    try {
      await supabase.auth.signOut();
    } catch (err) {}
  };

  const openAuthModal = (mode = 'login') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const addToCart = async (product, selectedSize, options = {}) => {
    if (!product) return false;

    // Resolve size to use
    let sizeToUse = (typeof selectedSize === 'string' && selectedSize.trim()) ? selectedSize.trim().toUpperCase() : null;
    const sizeStock = product.sizeStock || product.size_stock || {};

    if (!sizeToUse) {
      const availableSizes = Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes : ['XS', 'S', 'M', 'L', 'XL'];
      const firstInStock = availableSizes.find(sz => {
        const matchK = Object.keys(sizeStock).find(k => k.trim().toUpperCase() === sz.trim().toUpperCase());
        return matchK !== undefined ? (parseInt(sizeStock[matchK], 10) || 0) > 0 : true;
      });
      sizeToUse = (firstInStock || (typeof product.selectedSize === 'string' && product.selectedSize) || 'M').trim().toUpperCase();
    }

    // Defensive check using authoritative stock validator
    const stockStatus = checkItemStockStatus({
      product,
      selectedSize: sizeToUse,
      quantity: options.quantity || 1
    });

    if (stockStatus.isOutOfStock) {
      console.warn(`[CartContext] Prevented adding out of stock item: ${product.name || 'Product'} (Size: ${sizeToUse})`);
      return false;
    }

    const isGuest = !user && !getAuthToken();
    const userId = user?.id || getStoredUser()?.id || 'guest';
    const cachedKey = isGuest ? 'urvaah_guest_cart' : `urvaah_cart_${userId}`;
    const targetItemKey = `${String(product.id).trim()}_${String(sizeToUse).trim()}`;

    // Automatically set the newly chosen product as the single active purchase item by default!
    if (options.selectOnlyThis !== false) {
      updateSelectedCartItemKeys([targetItemKey]);
    } else {
      updateSelectedCartItemKeys((prev) => Array.from(new Set([...(prev || []), targetItemKey])));
    }

    const availableStock = stockStatus.availableStock || 99;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => String(item.product.id) === String(product.id) && String(item.selectedSize).trim().toUpperCase() === sizeToUse
      );

      let updated;
      if (existingIndex > -1) {
        const existing = prevCart[existingIndex];
        const qtyToAdd = options.quantity || 1;
        // options.setQuantity: set the line to exactly this quantity (idempotent, e.g. Reorder)
        // instead of adding on top of what's already in the bag
        const newQty = options.setQuantity
          ? Math.min(qtyToAdd, availableStock)
          : Math.min(existing.quantity + qtyToAdd, availableStock);
        if (newQty === existing.quantity) {
          return prevCart;
        }

        updated = [...prevCart];
        updated[existingIndex] = {
          ...existing,
          selectedSize: sizeToUse,
          quantity: newQty
        };
      } else {
        const qtyToAdd = Math.min(options.quantity || 1, availableStock);
        updated = [
          ...prevCart,
          {
            product: {
              id: String(product.id),
              name: product.name || product.title || 'Garment',
              price: Number(product.price || 0),
              originalPrice: Number(product.originalPrice || product.price || 0),
              image: product.image || (product.gallery && product.gallery[0]) || '/assets/Images/Brown01.png',
              colors: product.colors || ['#111111'],
              brand: product.brand || 'House of Urvaah',
              category: product.category || 'CLOTHING',
              inStock: true,
              stockQuantity: availableStock,
              sizeStock: sizeStock,
              size_stock: sizeStock
            },
            selectedSize: sizeToUse,
            quantity: qtyToAdd
          }
        ];
      }

      localStorage.setItem(cachedKey, JSON.stringify(updated));
      return updated;
    });

    if (options.openDrawer !== false) {
      setIsCartOpen(true);
    }

    if (!isGuest) {
      const rawNum = parseInt(String(product.id).replace(/\D/g, ''), 10);
      const numericId = rawNum === 103 ? 106 : rawNum;
      if (numericId && !isNaN(numericId)) {
        try {
          await apiClient('/api/cart/add', {
            method: 'POST',
            body: JSON.stringify({ userId, productId: numericId, quantity: options.quantity || 1, size: sizeToUse, setMode: Boolean(options.setQuantity) })
          });
        } catch (err) {
          console.warn('Cart add API sync warning:', err.message);
        }
      }
    }
    return true;
  };

  const removeFromCart = async (productId, selectedSize) => {
    const isGuest = !user && !getAuthToken();
    const userId = user?.id || getStoredUser()?.id || 'guest';
    const cachedKey = isGuest ? 'urvaah_guest_cart' : `urvaah_cart_${userId}`;
    const cleanSize = (selectedSize ? String(selectedSize).trim().toUpperCase() : null);

    setCart((prevCart) => {
      const updated = prevCart.filter(
        (item) => !(String(item.product.id) === String(productId) && (!cleanSize || String(item.selectedSize).trim().toUpperCase() === cleanSize))
      );
      localStorage.setItem(cachedKey, JSON.stringify(updated));
      return updated;
    });

    if (!isGuest) {
      const numericId = parseInt(String(productId).replace(/\D/g, ''), 10);
      if (numericId && !isNaN(numericId)) {
        try {
          const queryParam = cleanSize ? `?size=${encodeURIComponent(cleanSize)}` : '';
          await apiClient(`/api/cart/item/${numericId}${queryParam}`, {
            method: 'DELETE'
          });
        } catch (err) {
          console.warn('Cart remove API sync warning:', err.message);
        }
      }
    }
  };

  const clearCart = async () => {
    const isGuest = !user && !getAuthToken();
    const userId = user?.id || getStoredUser()?.id || 'guest';
    const cachedKey = isGuest ? 'urvaah_guest_cart' : `urvaah_cart_${userId}`;
    setCart([]);
    localStorage.removeItem(cachedKey);
    localStorage.setItem(cachedKey, JSON.stringify([]));
    localStorage.removeItem('urvaah_guest_cart');
    if (!isGuest) {
      try {
        await apiClient('/api/cart/clear', { method: 'DELETE' });
        await apiClient(`/api/cart/${userId}`, { method: 'DELETE' });
      } catch (e) {}
    }
  };

  const updateQuantity = async (productId, selectedSize, delta) => {
    const isGuest = !user && !getAuthToken();
    const userId = user?.id || getStoredUser()?.id || 'guest';
    const cachedKey = isGuest ? 'urvaah_guest_cart' : `urvaah_cart_${userId}`;
    const cleanSize = (selectedSize ? String(selectedSize).trim().toUpperCase() : 'M');
    let newQty = 0;

    setCart((prevCart) => {
      const updated = prevCart
        .map((item) => {
          if (
            String(item.product.id) === String(productId) &&
            String(item.selectedSize).trim().toUpperCase() === cleanSize
          ) {
            const stockStatus = checkItemStockStatus(item);
            const maxStock = stockStatus.availableStock || 99;

            if (delta > 0 && item.quantity >= maxStock) {
              newQty = item.quantity;
              return item;
            }

            const calculated = Math.min(maxStock, item.quantity + delta);
            newQty = calculated;
            return calculated > 0 ? { ...item, quantity: calculated } : null;
          }
          return item;
        })
        .filter(Boolean);

      localStorage.setItem(cachedKey, JSON.stringify(updated));
      return updated;
    });

    if (!isGuest) {
      const numericId = parseInt(String(productId).replace(/\D/g, ''), 10);
      if (numericId && !isNaN(numericId)) {
        try {
          if (newQty <= 0) {
            await apiClient(`/api/cart/item/${numericId}?size=${encodeURIComponent(cleanSize)}`, { method: 'DELETE' });
          } else {
            await apiClient('/api/cart/update', {
              method: 'PATCH',
              body: JSON.stringify({ userId, productId: numericId, quantity: newQty, size: cleanSize })
            });
          }
        } catch (err) {
          console.warn('Cart update quantity API sync warning:', err.message);
        }
      }
    }
  };

  const isInWishlist = (productId) => {
    if (!productId) return false;
    const strId = String(productId).trim();
    const numId = strId.replace(/\D/g, '');
    return wishlist.some((id) => {
      const itemStr = String(id).trim();
      const itemNum = itemStr.replace(/\D/g, '');
      if (itemStr === strId) return true;
      if (numId && itemNum && numId === itemNum) return true;
      return false;
    });
  };

  const toggleWishlist = async (productId) => {
    const isGuest = !user && !getAuthToken();
    const userId = user?.id || getStoredUser()?.id || 'guest';
    const stringId = String(productId).trim();
    const numId = stringId.replace(/\D/g, '');
    const cachedKey = isGuest ? 'urvaah_guest_wishlist' : `urvaah_wishlist_${userId}`;

    const isCurrentlyIn = isInWishlist(stringId);
    let updated;
    if (isCurrentlyIn) {
      updated = wishlist.filter((id) => {
        const itemStr = String(id).trim();
        const itemNum = itemStr.replace(/\D/g, '');
        if (itemStr === stringId) return false;
        if (numId && itemNum && numId === itemNum) return false;
        return true;
      });
    } else {
      updated = [...wishlist, stringId];
    }

    setWishlist(updated);
    localStorage.setItem(cachedKey, JSON.stringify(updated));

    if (!isGuest) {
      try {
        await apiClient('/api/wishlist/toggle', {
          method: 'POST',
          body: JSON.stringify({ userId, productId: stringId })
        });
      } catch (err) {
        console.warn('Wishlist toggle API sync warning:', err.message);
      }
    }

    return !isCurrentlyIn;
  };

  const removeFromWishlist = async (productId) => {
    const isGuest = !user && !getAuthToken();
    const userId = user?.id || getStoredUser()?.id || 'guest';
    const stringId = String(productId).trim();
    const numId = stringId.replace(/\D/g, '');
    const cachedKey = isGuest ? 'urvaah_guest_wishlist' : `urvaah_wishlist_${userId}`;
    const updated = wishlist.filter((id) => {
      const itemStr = String(id).trim();
      const itemNum = itemStr.replace(/\D/g, '');
      if (itemStr === stringId) return false;
      if (numId && itemNum && numId === itemNum) return false;
      return true;
    });

    setWishlist(updated);
    localStorage.setItem(cachedKey, JSON.stringify(updated));

    if (!isGuest) {
      try {
        await apiClient(`/api/wishlist/${userId}/${stringId}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.warn('Wishlist remove API sync warning:', err.message);
      }
    }
  };

  const wishlistCount = useMemo(() => wishlist.length, [wishlist]);

  const cartCount = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((total, item) => {
      if (checkItemStockStatus(item).isOutOfStock) return total;
      return total + (Number(item.product?.price || 0) * Number(item.quantity || 1));
    }, 0);
  }, [cart]);

  const freeShippingProgress = useMemo(() => {
    const threshold = 2999;
    return Math.min(100, Math.round((cartSubtotal / threshold) * 100));
  }, [cartSubtotal]);

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        wishlistCount,
        isCartOpen,
        setIsCartOpen,
        isSearchOpen,
        setIsSearchOpen,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authMode,
        setAuthMode,
        openAuthModal,
        setPendingAction,
        user,
        setUser,
        session,
        authLoading,
        loginUser,
        logoutUser,
        updateUserProfile,
        quickViewProduct,
        setQuickViewProduct,
        pdpProduct,
        setPdpProduct,
        addToCart,
        removeFromCart,
        clearCart,
        updateQuantity,
        toggleWishlist,
        removeFromWishlist,
        isInWishlist,
        cartCount,
        cartSubtotal,
        freeShippingProgress,
        selectedCartItemKeys,
        setSelectedCartItemKeys: updateSelectedCartItemKeys,
        toggleCartItemSelection,
        selectAllCartItems,
        selectOnlyCartItem,
        getCartItemKey,
        syncCartStock: syncLiveStock,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
