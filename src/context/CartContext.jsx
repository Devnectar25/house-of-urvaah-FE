import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import apiClient, { getAuthToken, setAuthToken, getStoredUser, setStoredUser, clearAuthSession } from '../lib/apiClient';
import { useModalScrollLock } from '../hooks/useModalScrollLock';

const CartContext = createContext();

export const getCartItemKey = (item) => {
  if (!item) return '';
  const prodId = item.product?.id || item.id || item.productId || '';
  const size = item.selectedSize || item.size || 'M';
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
      avatar: userData.avatar || userData.avatar_url || ''
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
            const mappedBackendCart = res.data.map((item) => {
              const stock = (item.stockQuantity !== null && item.stockQuantity !== undefined)
                ? Number(item.stockQuantity)
                : ((item.stock_quantity !== null && item.stock_quantity !== undefined)
                  ? Number(item.stock_quantity)
                  : 10);
              const clampedQty = Math.max(1, Math.min(Number(item.quantity || 1), Math.max(1, stock)));
              return {
                product: {
                  id: String(item.productId || item.product_id || item.id),
                  name: item.name || item.productname || item.title || 'Product',
                  price: Number(item.price || 0),
                  originalPrice: Number(item.originalPrice || item.originalprice || item.price || 0),
                  image: item.image || item.image_url || '/assets/Images/Brown01.png',
                  brand: item.brand || 'House of Urvaah',
                  category: item.category || 'CLOTHING',
                  inStock: item.inStock ?? true,
                  stockQuantity: stock
                },
                selectedSize: item.selectedSize || 'M',
                quantity: clampedQty
              };
            });

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
                      body: JSON.stringify({ userId, productId: numericId, quantity: cItem.quantity })
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
  useEffect(() => {
    if (!cart || cart.length === 0) return;

    let isCancelled = false;

    const syncLiveStock = async () => {
      try {
        let hasChanges = false;
        const verifiedCart = await Promise.all(
          cart.map(async (item) => {
            const rawId = item.product?.id || item.productId || item.id;
            const cleanId = String(rawId).replace(/\D/g, '');
            if (!cleanId) return item;

            try {
              const res = await apiClient(`/api/products/${cleanId}`);
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

                if (currentStock !== liveStock || currentQty !== clampedQty || item.product?.inStock !== !isOutOfStock) {
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

        if (!isCancelled && hasChanges) {
          const isGuest = !user && !getAuthToken();
          const userId = user?.id || getStoredUser()?.id || 'guest';
          const cachedKey = isGuest ? 'urvaah_guest_cart' : `urvaah_cart_${userId}`;
          setCart(verifiedCart);
          localStorage.setItem(cachedKey, JSON.stringify(verifiedCart));
        }
      } catch (err) {
        console.warn('Live cart stock check error:', err);
      }
    };

    if (isCartOpen) {
      syncLiveStock();
    }

    return () => {
      isCancelled = true;
    };
  }, [isCartOpen]);

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
    if (!product) return;

    // Defensive check: Do not add out-of-stock items to cart
    const itemQty = Number(
      product.stockQuantity !== undefined && product.stockQuantity !== null
        ? product.stockQuantity
        : (product.stock_quantity ?? product.stock ?? product.quantity ?? 0)
    );

    const sizeToUse = (typeof selectedSize === 'string' && selectedSize) ? selectedSize : (product.selectedSize || 'M');
    const sizeStock = product.sizeStock || product.size_stock || {};
    let sizeSpecificStock = null;
    if (sizeStock && typeof sizeStock === 'object' && Object.keys(sizeStock).length > 0) {
      const matchKey = Object.keys(sizeStock).find(k => k.trim().toUpperCase() === String(sizeToUse).trim().toUpperCase());
      if (matchKey !== undefined) {
        sizeSpecificStock = Math.max(0, parseInt(sizeStock[matchKey], 10) || 0);
      }
    }
    const effectiveStock = sizeSpecificStock !== null ? sizeSpecificStock : itemQty;

    const isOutOfStock = Boolean(
      effectiveStock <= 0 ||
      itemQty <= 0 ||
      (itemQty <= 0 && (product.inStock === false || product.instock === false)) ||
      product.isOutOfStock === true ||
      product.status === 'Out of Stock' ||
      product.status === 'out_of_stock'
    );
    if (isOutOfStock) return;

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

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => String(item.product.id) === String(product.id) && item.selectedSize === sizeToUse
      );

      let updated;
      if (existingIndex > -1) {
        const existing = prevCart[existingIndex];
        const existingSizeStock = existing.product?.sizeStock || existing.product?.size_stock || sizeStock || {};
        let existingSizeSpecificStock = null;
        if (existingSizeStock && typeof existingSizeStock === 'object' && Object.keys(existingSizeStock).length > 0) {
          const matchKey = Object.keys(existingSizeStock).find(k => k.trim().toUpperCase() === String(sizeToUse).trim().toUpperCase());
          if (matchKey !== undefined) {
            existingSizeSpecificStock = Math.max(0, parseInt(existingSizeStock[matchKey], 10) || 0);
          }
        }

        const maxStock = existingSizeSpecificStock !== null
          ? existingSizeSpecificStock
          : Number(
              (itemQty > 0 ? itemQty : null) ??
              existing.product?.stockQuantity ??
              existing.product?.stock_quantity ??
              existing.product?.quantity ??
              99
            );

        if (existing.quantity >= maxStock) {
          // Max available stock already in cart!
          return prevCart;
        }

        const qtyToAdd = options.quantity || 1;
        const newQty = Math.min(existing.quantity + qtyToAdd, maxStock);

        updated = [...prevCart];
        updated[existingIndex] = {
          ...existing,
          product: {
            ...existing.product,
            stockQuantity: itemQty > 0 ? itemQty : existing.product?.stockQuantity,
            sizeStock: Object.keys(sizeStock).length > 0 ? sizeStock : existing.product?.sizeStock,
            size_stock: Object.keys(sizeStock).length > 0 ? sizeStock : existing.product?.size_stock,
            inStock: !isOutOfStock
          },
          quantity: newQty
        };
      } else {
        const maxStock = effectiveStock > 0 ? effectiveStock : 1;
        const qtyToAdd = Math.min(options.quantity || 1, maxStock);
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
              inStock: !isOutOfStock,
              stockQuantity: itemQty,
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
            body: JSON.stringify({ userId, productId: numericId, quantity: 1 })
          });
        } catch (err) {
          console.warn('Cart add API sync warning:', err.message);
        }
      }
    }
  };

  const removeFromCart = async (productId, selectedSize) => {
    const isGuest = !user && !getAuthToken();
    const userId = user?.id || getStoredUser()?.id || 'guest';
    const cachedKey = isGuest ? 'urvaah_guest_cart' : `urvaah_cart_${userId}`;

    setCart((prevCart) => {
      const updated = prevCart.filter(
        (item) => !(String(item.product.id) === String(productId) && item.selectedSize === selectedSize)
      );
      localStorage.setItem(cachedKey, JSON.stringify(updated));
      return updated;
    });

    if (!isGuest) {
      const numericId = parseInt(String(productId).replace(/\D/g, ''), 10);
      if (numericId && !isNaN(numericId)) {
        try {
          await apiClient(`/api/cart/item/${numericId}`, {
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
    let newQty = 0;

    setCart((prevCart) => {
      const updated = prevCart
        .map((item) => {
          if (String(item.product.id) === String(productId) && item.selectedSize === selectedSize) {
            const sizeStock = item.product?.sizeStock || item.product?.size_stock || {};
            let sizeSpecificStock = null;
            if (sizeStock && typeof sizeStock === 'object' && Object.keys(sizeStock).length > 0) {
              const matchKey = Object.keys(sizeStock).find(k => k.trim().toUpperCase() === String(selectedSize).trim().toUpperCase());
              if (matchKey !== undefined) {
                sizeSpecificStock = Math.max(0, parseInt(sizeStock[matchKey], 10) || 0);
              }
            }

            const maxStock = sizeSpecificStock !== null
              ? sizeSpecificStock
              : Number(
                  item.product?.stockQuantity !== undefined && item.product?.stockQuantity !== null
                    ? item.product.stockQuantity
                    : (item.product?.stock_quantity ?? item.product?.stock ?? item.product?.quantity ?? 99)
                );

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
            await apiClient(`/api/cart/item/${numericId}`, { method: 'DELETE' });
          } else {
            await apiClient('/api/cart/update', {
              method: 'PATCH',
              body: JSON.stringify({ userId, productId: numericId, quantity: newQty })
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
    return cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
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
