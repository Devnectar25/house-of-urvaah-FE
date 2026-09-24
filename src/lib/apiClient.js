const API_BASE_URL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');

export const getAuthToken = () => {
  return localStorage.getItem('urvaah_token') || null;
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('urvaah_token', token);
  } else {
    localStorage.removeItem('urvaah_token');
  }
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('urvaah_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (user) {
    localStorage.setItem('urvaah_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('urvaah_user');
  }
};

export const clearAuthSession = () => {
  localStorage.removeItem('urvaah_token');
  localStorage.removeItem('urvaah_user');
};

export async function apiClient(endpoint, options = {}) {
  const token = getAuthToken();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${cleanEndpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // Handle 401 Unauthorized globally if token expired
    if (response.status === 401 && token) {
      console.warn('[apiClient] Session expired or 401 returned. Clearing session.');
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.message || data.error || `Request failed with status ${response.status}`;
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
