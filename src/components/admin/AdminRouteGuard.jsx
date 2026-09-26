import React, { useEffect, useState, useTransition } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { getAuthToken, getStoredUser, clearAuthSession } from '../../lib/apiClient';
import { Loader2 } from 'lucide-react';

/**
 * Safely decodes the payload of a JWT without external libraries
 */
export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    try {
      return JSON.parse(atob(parts[1]));
    } catch {
      return null;
    }
  }
}

export const VALID_ADMIN_ROLES = ['admin', 'super_admin', 'subadmin', 'sub_admin'];

/**
 * Synchronously checks authentication, token expiration, and role validity.
 */
function evaluateAuth(allowedRoles) {
  const token = getAuthToken();

  // 1. Token presence check
  if (!token) {
    return { status: 'unauthenticated' };
  }

  // 2. Token expiry check (decoding exp without network call)
  const payload = decodeJwtPayload(token);
  if (payload && typeof payload.exp === 'number') {
    const currentTimeInSec = Math.floor(Date.now() / 1000);
    if (payload.exp <= currentTimeInSec) {
      clearAuthSession();
      return { status: 'expired' };
    }
  }

  // 3. Role check
  const storedUser = getStoredUser();
  const rawRole = payload?.role || storedUser?.role || '';
  const normalizedRole = String(rawRole).trim().toLowerCase();

  if (!normalizedRole || !VALID_ADMIN_ROLES.includes(normalizedRole)) {
    clearAuthSession();
    return { status: 'unauthorized' };
  }

  // 6. Role-based route restriction
  if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const normalizedAllowed = allowedRoles.map((r) => String(r).trim().toLowerCase());
    if (!normalizedAllowed.includes(normalizedRole)) {
      return { status: 'forbidden', role: normalizedRole };
    }
  }

  return { status: 'authorized', role: normalizedRole, user: storedUser };
}

/**
 * AdminRouteGuard: Robust access control for House of Urvaah admin routes.
 *
 * Supports both wrapping children or serving as an Outlet layout route.
 *
 * @param {Array<string>} [allowedRoles] - Optional list of restricted roles (e.g. ['super_admin'])
 * @param {React.ReactNode} [children] - Child elements to render if authorized
 */
export const AdminRouteGuard = ({ allowedRoles = null, children = null }) => {
  const location = useLocation();

  // Evaluate synchronously on first render to prevent any flash of protected content
  const [authState, setAuthState] = useState(() => evaluateAuth(allowedRoles));

  // Live invalidation listeners:
  // - Handles 401/403 API responses emitted across the admin panel
  // - Handles cross-tab logout via storage event
  // - Periodic token expiration timer while idle on the page
  useEffect(() => {
    const handleUnauthorizedEvent = () => {
      setAuthState({ status: 'expired' });
    };

    const handleStorageChange = (e) => {
      if (e.key === 'urvaah_token') {
        const fresh = evaluateAuth(allowedRoles);
        setAuthState(fresh);
      }
    };

    window.addEventListener('urvaah:auth:unauthorized', handleUnauthorizedEvent);
    window.addEventListener('storage', handleStorageChange);

    // Periodically re-check expiration every 15 seconds
    const interval = setInterval(() => {
      const current = evaluateAuth(allowedRoles);
      if (current.status !== 'authorized') {
        setAuthState(current);
      }
    }, 15000);

    return () => {
      window.removeEventListener('urvaah:auth:unauthorized', handleUnauthorizedEvent);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [allowedRoles]);

  // Handle unauthenticated: no token found -> redirect to login immediately
  if (authState.status === 'unauthenticated') {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  // Handle expired: token expired -> redirect to login with message
  if (authState.status === 'expired') {
    return (
      <Navigate
        to="/admin/login?reason=expired"
        replace
        state={{ reason: 'expired', from: location }}
      />
    );
  }

  // Handle unauthorized: user lacks admin role -> redirect with message
  if (authState.status === 'unauthorized') {
    return (
      <Navigate
        to="/admin/login?reason=unauthorized"
        replace
        state={{ reason: 'unauthorized', from: location }}
      />
    );
  }

  // Handle forbidden: authenticated admin lacks permission for specific restricted route
  if (authState.status === 'forbidden') {
    return (
      <Navigate
        to="/admin/dashboard?error=restricted"
        replace
        state={{ error: 'Access restricted', requiredRoles: allowedRoles }}
      />
    );
  }

  // Initializing/Checking loading state (if needed for async transitions)
  if (authState.status === 'loading') {
    return (
      <div className="min-h-screen bg-brand-sand flex flex-col items-center justify-center p-6 font-serif">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
          <p className="text-xs uppercase tracking-[0.25em] text-neutral-600 font-sans">
            Verifying Authorization...
          </p>
        </div>
      </div>
    );
  }

  // Authorized: render children or nested route Outlet
  return children ? children : <Outlet />;
};

export default AdminRouteGuard;
