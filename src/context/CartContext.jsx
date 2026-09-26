import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import apiClient, { getAuthToken, setAuthToken, getStoredUser, setStoredUser, clearAuthSession } from '../lib/apiClient';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [user, setUser] = useState(null); // formatted user object
  const [token, setTokenState] = useState(null);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [pdpProduct, setPdpProduct] = useState(null);

  const formatUserData = (userData) => {
    if (!userData) return null;
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
      if (res.success && res.user) {
        const formatted = formatUserData({
          ...res.user,
          addresses: res.addresses || []
        });
        setUser(formatted);
        setStoredUser(formatted);
      }
    } catch (err) {
      console.warn('Failed to fetch profile with stored JWT:', err.message);
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
      if (savedUser) {
        setUser(savedUser);
      }
      // Refresh profile details in background
      fetchUserProfile().finally(() => setAuthLoading(false));
    } else {
      // Fallback: check Supabase session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session?.user) {
          const formatted = formatUserData(session.user);
          setUser(formatted);
        }
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
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch & persist wishlist for logged-in user
  useEffect(() => {
    if (!user) {
      setWishlist([]);
      return;
    }

    const userId = user.id || user.username || 'user';
    const cachedKey = `urvaah_wishlist_${userId}`;

    // 1. Instant load from localStorage cache if available
    const cached = localStorage.getItem(cachedKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setWishlist(parsed.map(String));
        }
      } catch (e) {}
    }

    // 2. Fetch ground truth wishlist from backend API
    apiClient(`/api/wishlist/${userId}`)
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          const ids = res.data.map((item) => String(item.productId || item.product_id));
          setWishlist(ids);
          localStorage.setItem(cachedKey, JSON.stringify(ids));
        }
      })
      .catch((err) => {
        console.warn('Could not fetch backend wishlist, using cached:', err.message);
      });
  }, [user?.id]);

  // Fetch & persist cart for logged-in user
  useEffect(() => {
    if (!user) {
      setCart([]);
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
          const mappedBackendCart = res.data.map((item) => ({
            product: {
              id: String(item.productId || item.product_id || item.id),
              name: item.name || item.productname || item.title || 'Product',
              price: Number(item.price || 0),
              originalPrice: Number(item.originalPrice || item.originalprice || item.price || 0),
              image: item.image || item.image_url || '/assets/Images/Brown01.png',
              brand: item.brand || 'House of Urvaah',
              category: item.category || 'CLOTHING',
              inStock: item.inStock ?? true,
              stockQuantity: item.stockQuantity ?? 10
            },
            selectedSize: item.selectedSize || 'M',
            quantity: Number(item.quantity || 1)
          }));

          setCart(mappedBackendCart);
          localStorage.setItem(cachedKey, JSON.stringify(mappedBackendCart));
        }
      })
      .catch((err) => {
        console.warn('Could not fetch backend cart, using cached:', err.message);
      });
  }, [user?.id]);

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

  const addToCart = async (product, selectedSize = 'M') => {
    if (!product) return;

    if (!user && !getAuthToken()) {
      setPendingAction(() => () => addToCart(product, selectedSize));
      openAuthModal('login');
      return;
    }

    const userId = user?.id || getStoredUser()?.id || 'user';
    const cachedKey = `urvaah_cart_${userId}`;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => String(item.product.id) === String(product.id) && item.selectedSize === selectedSize
      );

      let updated;
      if (existingIndex > -1) {
        updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1
        };
      } else {
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
              category: product.category || 'CLOTHING'
            },
            selectedSize,
            quantity: 1
          }
        ];
      }

      localStorage.setItem(cachedKey, JSON.stringify(updated));
      return updated;
    });

    setIsCartOpen(true);

    const numericId = parseInt(String(product.id).replace(/\D/g, ''), 10);
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
  };

  const removeFromCart = async (productId, selectedSize) => {
    if (!user && !getAuthToken()) {
      openAuthModal('login');
      return;
    }

    const userId = user?.id || getStoredUser()?.id || 'user';
    const cachedKey = `urvaah_cart_${userId}`;

    setCart((prevCart) => {
      const updated = prevCart.filter(
        (item) => !(String(item.product.id) === String(productId) && item.selectedSize === selectedSize)
      );
      localStorage.setItem(cachedKey, JSON.stringify(updated));
      return updated;
    });

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
  };

  const updateQuantity = async (productId, selectedSize, delta) => {
    if (!user && !getAuthToken()) {
      openAuthModal('login');
      return;
    }

    const userId = user?.id || getStoredUser()?.id || 'user';
    const cachedKey = `urvaah_cart_${userId}`;
    let newQty = 0;

    setCart((prevCart) => {
      const updated = prevCart
        .map((item) => {
          if (String(item.product.id) === String(productId) && item.selectedSize === selectedSize) {
            const calculated = item.quantity + delta;
            newQty = calculated;
            return calculated > 0 ? { ...item, quantity: calculated } : null;
          }
          return item;
        })
        .filter(Boolean);

      localStorage.setItem(cachedKey, JSON.stringify(updated));
      return updated;
    });

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
    if (!user && !getAuthToken()) {
      openAuthModal('login');
      return false;
    }

    const userId = user?.id || getStoredUser()?.id || 'user';
    const stringId = String(productId).trim();
    const numId = stringId.replace(/\D/g, '');
    const cachedKey = `urvaah_wishlist_${userId}`;

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

    try {
      await apiClient('/api/wishlist/toggle', {
        method: 'POST',
        body: JSON.stringify({ userId, productId: stringId })
      });
    } catch (err) {
      console.warn('Wishlist toggle API sync warning:', err.message);
    }

    return !isCurrentlyIn;
  };

  const removeFromWishlist = async (productId) => {
    if (!user && !getAuthToken()) {
      openAuthModal('login');
      return;
    }

    const userId = user?.id || getStoredUser()?.id || 'user';
    const stringId = String(productId).trim();
    const numId = stringId.replace(/\D/g, '');
    const cachedKey = `urvaah_wishlist_${userId}`;
    const updated = wishlist.filter((id) => {
      const itemStr = String(id).trim();
      const itemNum = itemStr.replace(/\D/g, '');
      if (itemStr === stringId) return false;
      if (numId && itemNum && numId === itemNum) return false;
      return true;
    });

    setWishlist(updated);
    localStorage.setItem(cachedKey, JSON.stringify(updated));

    try {
      await apiClient(`/api/wishlist/${userId}/${stringId}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn('Wishlist remove API sync warning:', err.message);
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
        updateQuantity,
        toggleWishlist,
        removeFromWishlist,
        isInWishlist,
        cartCount,
        cartSubtotal,
        freeShippingProgress,
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
