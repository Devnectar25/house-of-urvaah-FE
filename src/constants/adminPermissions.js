// Permission modules a super admin can grant to a sub-admin.
// Keep ids in sync with the moduleKey values in App.jsx, the AdminLayout nav keys, and
// ALLOWED_PERMISSIONS in the API's subAdminService. 'subadmins' is intentionally excluded:
// sub-admin management stays super-admin only.
export const PERMISSION_GROUPS = [
  {
    group: 'Catalog & Insights',
    options: [
      { id: 'analytics', label: 'Analytics' },
      { id: 'products', label: 'Products' },
      { id: 'categories', label: 'Categories' }
    ]
  },
  {
    group: 'Orders & Payments',
    options: [
      { id: 'orders', label: 'Orders' },
      { id: 'refunds', label: 'Refund Desk' }
    ]
  },
  {
    group: 'Customers',
    options: [
      { id: 'customers', label: 'Customers' },
      { id: 'leads', label: 'Leads' },
      { id: 'reviews', label: 'Reviews' }
    ]
  },
  {
    group: 'Communication',
    options: [
      { id: 'email-notifications', label: 'Email Notifications' },
      { id: 'stock-notifications', label: 'Stock Alerts' },
      { id: 'faqs', label: 'FAQs' }
    ]
  },
  {
    group: 'Storefront & System',
    options: [
      { id: 'modify-ui', label: 'Edit Homepage' },
      { id: 'error-monitoring', label: 'Error Monitoring' },
      { id: 'settings', label: 'Settings' }
    ]
  }
];

export const PERMISSION_OPTIONS = PERMISSION_GROUPS.flatMap((g) => g.options);
export const PERMISSION_IDS = PERMISSION_OPTIONS.map((o) => o.id);
export const getPermissionLabel = (id) => PERMISSION_OPTIONS.find((o) => o.id === id)?.label || id;

// ── Sub-admin form validation (mirrors the API rules) ─────────────────────────
export const RESERVED_USERNAMES = ['admin', 'administrator', 'root', 'superadmin', 'super_admin', 'system'];
const USERNAME_PATTERN = /^[A-Za-z0-9._@-]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const validateUsername = (raw, existingUsernames = []) => {
  const username = String(raw || '').trim();
  if (!username) return 'Username is required.';
  if (username.length < 3) return 'Username must be at least 3 characters.';
  if (username.length > 50) return 'Username must be 50 characters or fewer.';
  if (/\s/.test(username)) return 'Username cannot contain spaces.';
  if (!USERNAME_PATTERN.test(username)) return 'Use only letters, numbers, and . _ - @';
  if (username.includes('@') && !EMAIL_PATTERN.test(username)) return 'Enter a valid email address.';
  if (RESERVED_USERNAMES.includes(username.toLowerCase())) return 'This username is reserved. Choose another.';
  if (existingUsernames.some((u) => String(u || '').toLowerCase() === username.toLowerCase())) {
    return 'A sub-admin with this username already exists.';
  }
  return null;
};

export const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { id: 'upper', label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number', test: (p) => /\d/.test(p) },
  { id: 'special', label: 'One special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
  { id: 'spaces', label: 'No spaces', test: (p) => p.length > 0 && !/\s/.test(p) }
];

export const validatePassword = (password, username = '') => {
  const p = String(password || '');
  if (!p) return 'Password is required.';
  const failed = PASSWORD_RULES.find((r) => !r.test(p));
  if (failed) return `Password needs: ${failed.label.toLowerCase()}.`;
  if (p.length > 64) return 'Password must be 64 characters or fewer.';
  if (username && p.toLowerCase().includes(String(username).trim().toLowerCase())) {
    return 'Password must not contain the username.';
  }
  return null;
};

export const validatePermissions = (permissions) => {
  const list = Array.isArray(permissions) ? permissions : [];
  if (list.length === 0) return 'Select at least one permission module.';
  const unknown = list.filter((p) => !PERMISSION_IDS.includes(p));
  if (unknown.length > 0) return `Unknown permission: ${unknown.join(', ')}`;
  return null;
};

// Maximum number of sub-admin accounts (super admin not counted). Keep in sync with the API's MAX_SUB_ADMINS.
export const MAX_SUB_ADMINS = 10;
