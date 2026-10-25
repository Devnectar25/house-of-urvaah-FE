const API_BASE_URL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');

export const getAuthToken = () => {
  const token = localStorage.getItem('urvaah_token');
  if (!token || token === 'undefined' || token === 'null' || !token.trim()) {
    return null;
  }
  return token.trim();
};

export const setAuthToken = (token) => {
  if (token && token !== 'undefined' && token !== 'null') {
    localStorage.setItem('urvaah_token', token.trim());
  } else {
    localStorage.removeItem('urvaah_token');
  }
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('urvaah_user');
    if (!raw || raw === 'undefined' || raw === 'null') return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed?.id === '1' || parsed?.username === '1' || String(parsed?.email || '').includes('@urvaah.local')) {
      clearAuthSession();
      return null;
    }
    return parsed;
  } catch (e) {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (user && typeof user === 'object') {
    if (user.id === '1' || user.username === '1' || String(user.email || '').includes('@urvaah.local')) {
      console.warn('[apiClient] Blocked storing mock/invalid default user:', user);
      clearAuthSession();
      return;
    }
    localStorage.setItem('urvaah_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('urvaah_user');
  }
};

export const clearAuthSession = () => {
  localStorage.removeItem('urvaah_token');
  localStorage.removeItem('urvaah_user');
  if (typeof document !== 'undefined') {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  }
};

// Helper to safely decode JWT payload with base64 padding support
export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    let base64Url = parts[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    try {
      let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) {
        b64 += '=';
      }
      return JSON.parse(atob(b64));
    } catch {
      return null;
    }
  }
}

// --- Dedicated Admin Auth Storage (Completely isolated from customer session) ---
export const getAdminAuthToken = () => {
  const directToken = localStorage.getItem('urvaah_admin_token');
  if (directToken) return directToken;

  // Seamless legacy migration: check if customer token was actually an admin token
  const legacyToken = localStorage.getItem('urvaah_token');
  if (legacyToken) {
    const payload = decodeJwtPayload(legacyToken);
    const role = String(payload?.role || '').toLowerCase();
    if (['admin', 'super_admin', 'sub_admin', 'subadmin'].includes(role)) {
      localStorage.setItem('urvaah_admin_token', legacyToken);
      const legacyUser = localStorage.getItem('urvaah_user');
      if (legacyUser) {
        localStorage.setItem('urvaah_admin_user', legacyUser);
      }
      return legacyToken;
    }
  }
  return null;
};

export const setAdminAuthToken = (token) => {
  if (token) {
    localStorage.setItem('urvaah_admin_token', token);
  } else {
    localStorage.removeItem('urvaah_admin_token');
  }
};

export const getAdminStoredUser = () => {
  try {
    const raw = localStorage.getItem('urvaah_admin_user');
    if (raw) return JSON.parse(raw);

    const legacyRaw = localStorage.getItem('urvaah_user');
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw);
      const role = String(parsed?.role || '').toLowerCase();
      if (['admin', 'super_admin', 'sub_admin', 'subadmin'].includes(role) || parsed?.username === 'Admin') {
        localStorage.setItem('urvaah_admin_user', legacyRaw);
        return parsed;
      }
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const setAdminStoredUser = (user) => {
  if (user) {
    localStorage.setItem('urvaah_admin_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('urvaah_admin_user');
  }
};

export const clearAdminAuthSession = () => {
  localStorage.removeItem('urvaah_admin_token');
  localStorage.removeItem('urvaah_admin_user');
};

export async function apiClient(endpoint, options = {}) {
  // Context-aware admin detection: URL path starting with /admin, endpoint with /admin, or options.isAdmin
  const isAdminContext =
    Boolean(options.isAdmin) ||
    endpoint.includes('/admin') ||
    (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'));

  const adminToken = getAdminAuthToken();
  const customerToken = getAuthToken();
  const token = isAdminContext ? adminToken : customerToken;

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${cleanEndpoint}`;

  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  };

  if (options.body instanceof FormData && headers['Content-Type']) {
    delete headers['Content-Type'];
  }

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    credentials: 'include',
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // Handle 401 Unauthorized globally if token expired or invalid
    // Note: 403 Forbidden indicates permission restriction for a resource, not session expiration.
    // Never clear session on 403 or on /login endpoints (wrong credentials return 401).
    if (response.status === 401 && token) {
      const isLoginEndpoint = endpoint.includes('/login');
      if (!isLoginEndpoint) {
        console.warn(`[apiClient] Session expired (401) on ${isAdminContext ? 'admin' : 'customer'} endpoint: ${endpoint}`);
        if (isAdminContext) {
          clearAdminAuthSession();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('urvaah:admin:unauthorized', { detail: { status: response.status } })
            );
          }
        } else {
          clearAuthSession();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('urvaah:auth:unauthorized', { detail: { status: response.status } })
            );
          }
        }
      }
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      let errorMsg = data.message || data.error || `Request failed with status ${response.status}`;
      // Generic auth failures from the API are not meaningful to shoppers; say what to do instead
      if (response.status === 401 && !endpoint.includes('/login') &&
          ['Not authorized to access this route', 'Valid token required'].includes(errorMsg)) {
        errorMsg = token
          ? 'Your session has expired. Please sign in again to continue.'
          : 'Please sign in to your account to continue.';
      }
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    console.error(`[apiClient Error] ${options.method || 'GET'} ${endpoint}:`, err.message);
    throw err;
  }
}

export default apiClient;
