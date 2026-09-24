import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import apiClient, { getAuthToken, setAuthToken, getStoredUser, setStoredUser, clearAuthSession } from '../lib/apiClient';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([
    // Initial sample item for instant demo satisfaction
    {
      product: {
        id: 'prod-101',
        name: 'DOUBLE-BREASTED OVERSIZED BLAZER',
        price: 8990,
        image: 'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&q=80&w=1000',
        colors: ['#111111']
      },
      selectedSize: 'M',
      quantity: 1
    }
  ]);
  const [wishlist, setWishlist] = useState(['prod-102']);
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

  const addToCart = (product, selectedSize = 'M') => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.product.id === product.id && item.selectedSize === selectedSize
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += 1;
        return updated;
      }

      return [...prevCart, { product, selectedSize, quantity: 1 }];
    });

    // Auto open side cart drawer on add
    setIsCartOpen(true);
  };

  const removeFromCart = (productId, selectedSize) => {
    setCart((prevCart) =>
      prevCart.filter(
        (item) => !(item.product.id === productId && item.selectedSize === selectedSize)
      )
    );
  };

  const updateQuantity = (productId, selectedSize, delta) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId && item.selectedSize === selectedSize) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const toggleWishlist = (productId) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const isInWishlist = (productId) => wishlist.includes(productId);

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
