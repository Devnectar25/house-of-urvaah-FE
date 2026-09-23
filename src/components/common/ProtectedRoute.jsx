import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

export const ProtectedRoute = ({ children }) => {
  const { user, authLoading, openAuthModal } = useCart();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center bg-white font-serif text-neutral-800">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
          <span className="text-xs tracking-[0.25em] uppercase font-semibold text-neutral-600 block">
            VERIFYING ATELIER SESSION...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    // Open auth modal if route is protected
    openAuthModal('login');
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
