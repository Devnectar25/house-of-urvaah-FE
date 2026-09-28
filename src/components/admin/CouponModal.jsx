import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Lock,
  Tag,
  RefreshCw,
  Search,
  Users,
  Check,
  Calendar,
  Layers,
  ShoppingBag
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import couponService from '../../services/couponService';

export const CouponModal = ({ isOpen, onClose, coupon, onCouponSaved }) => {
  if (!isOpen) return null;

  const isEdit = Boolean(coupon && coupon.id);
  const isUsed = Boolean(coupon && (coupon.times_used > 0 || coupon.used_count > 0));

  // ── Code Generation Helper ──────────────────────────────────────────────────
  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude lookalike characters 0, O, 1, I
    let code = 'HOM';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // ── State Declaration ───────────────────────────────────────────────────────
  const [codeMode, setCodeMode] = useState('manual'); // 'manual' | 'auto'
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    max_discount: '',
    min_order_value: '0',
    usage_limit: '',
    per_user_limit: '',
    starts_at: '',
    expiry_date: '',
    apply_to: 'all', // 'all' | 'categories' | 'products'
    category_ids: [],
    product_ids: [],
    customer_ids: [],
    is_restricted: false,
    active: true
  });

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [targetUsers, setTargetUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Search states for multi-selects
  const [categorySearch, setCategorySearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [scopeSwitchConfirm, setScopeSwitchConfirm] = useState(null);

  // ── Format Date Helpers ─────────────────────────────────────────────────────
  const formatDateTimeLocal = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '';
      const pad = (n) => (n < 10 ? '0' + n : n);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  const getDefaultExpiryStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    d.setHours(23, 59, 0, 0);
    return formatDateTimeLocal(d);
  };

  const getDefaultStartStr = () => {
    const d = new Date();
    return formatDateTimeLocal(d);
  };

  // ── Form Population & Reset ────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setSubmitError(null);
      setCategorySearch('');
      setProductSearch('');
      setUserSearch('');
      setScopeSwitchConfirm(null);

      if (coupon) {
        setCodeMode('manual');
        const catIds = Array.isArray(coupon.category_ids) ? coupon.category_ids : (coupon.category_id ? [coupon.category_id] : []);
        const prodIds = Array.isArray(coupon.product_ids) ? coupon.product_ids : (coupon.product_id ? [coupon.product_id] : []);
        const custIds = Array.isArray(coupon.customer_ids) ? coupon.customer_ids : [];

        const scope = coupon.applies_to || coupon.apply_to || (catIds.length > 0 ? 'categories' : (prodIds.length > 0 ? 'products' : 'all'));
        const normalizedScope = (scope === 'category') ? 'categories' : ((scope === 'product') ? 'products' : scope);

        setFormData({
          code: coupon.code || '',
          description: coupon.description || '',
          discount_type: coupon.discount_type || 'percentage',
          discount_value: coupon.discount_value !== undefined ? String(coupon.discount_value) : '',
          max_discount: coupon.max_discount !== undefined && coupon.max_discount !== null ? String(coupon.max_discount) : '',
          min_order_value: coupon.min_order_value !== undefined ? String(coupon.min_order_value) : '0',
          usage_limit: coupon.usage_limit ? String(coupon.usage_limit) : '',
          per_user_limit: coupon.per_user_limit ? String(coupon.per_user_limit) : '',
          starts_at: formatDateTimeLocal(coupon.starts_at || new Date()),
          expiry_date: formatDateTimeLocal(coupon.expires_at || coupon.expiry_date || getDefaultExpiryStr()),
          apply_to: normalizedScope,
          category_ids: catIds,
          product_ids: prodIds,
          customer_ids: custIds,
          is_restricted: Boolean(coupon.is_private || coupon.is_restricted),
          active: coupon.is_active !== undefined ? Boolean(coupon.is_active) : (coupon.active !== undefined ? Boolean(coupon.active) : true)
        });
      } else {
        setCodeMode('manual');
        setFormData({
          code: '',
          description: '',
          discount_type: 'percentage',
          discount_value: '',
          max_discount: '',
          min_order_value: '0',
          usage_limit: '',
          per_user_limit: '',
          starts_at: getDefaultStartStr(),
          expiry_date: getDefaultExpiryStr(),
          apply_to: 'all',
          category_ids: [],
          product_ids: [],
          customer_ids: [],
          is_restricted: false,
          active: true
        });
      }
    }
  }, [isOpen, coupon]);

  // ── Auto Code Mode Toggle ──────────────────────────────────────────────────
  const handleCodeModeChange = (mode) => {
    if (isEdit) return;
    setCodeMode(mode);
    if (mode === 'auto') {
      const generated = generateRandomCode();
      setFormData((prev) => ({ ...prev, code: generated }));
      setErrors((prev) => ({ ...prev, code: '' }));
    }
  };

  const handleRegenerateCode = () => {
    const generated = generateRandomCode();
    setFormData((prev) => ({ ...prev, code: generated }));
    setErrors((prev) => ({ ...prev, code: '' }));
  };

  // ── Load Target Options (Categories, Products, Users) ─────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const fetchOptions = async () => {
      setLoadingData(true);
      try {
        const [catRes, prodRes, userRes] = await Promise.all([
          apiClient('/api/categories').catch(() => []),
          apiClient('/api/products?limit=200').catch(() => ({ data: [] })),
          couponService.getAvailableTargetUsers().catch(() => [])
        ]);

        const catList = Array.isArray(catRes) ? catRes : (catRes?.data || []);
        const prodList = Array.isArray(prodRes) ? prodRes : (prodRes?.data || prodRes?.products || []);
        const userList = Array.isArray(userRes) ? userRes : (userRes?.data || []);

        setCategories(catList);
        setProducts(prodList);
        setTargetUsers(userList);
      } catch (err) {
        console.error('Failed to load target options:', err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchOptions();
  }, [isOpen]);

  // ── Validation Rules ───────────────────────────────────────────────────────
  const validateField = (name, value) => {
    if (name === 'code') {
      const codeVal = (value || '').trim().toUpperCase();
      if (!codeVal) return 'Coupon code is required';
      const codeRegex = /^[A-Z0-9_-]{4,20}$/;
      if (!codeRegex.test(codeVal)) {
        return 'Code must be 4-20 characters using uppercase letters, numbers, - or _';
      }
      return '';
    }

    if (name === 'discount_value') {
      if (formData.discount_type === 'bogo') return '';
      const num = parseFloat(value);
      if (value === '' || value === null || value === undefined || isNaN(num)) {
        return 'Discount value is required';
      }
      if (num <= 0) return 'Discount value must be greater than 0';
      if (formData.discount_type === 'percentage' && num > 100) {
        return 'Percentage discount cannot exceed 100%';
      }
      if (formData.discount_type === 'fixed') {
        const minVal = parseFloat(formData.min_order_value || 0);
        if (minVal > 0 && num >= minVal) {
          return 'Fixed discount cannot be equal to or greater than minimum order value';
        }
      }
      return '';
    }

    if (name === 'max_discount' && formData.discount_type === 'percentage') {
      if (value !== '' && value !== null) {
        const num = parseFloat(value);
        if (isNaN(num) || num < 0) return 'Maximum discount cap cannot be negative';
      }
      return '';
    }

    if (name === 'min_order_value') {
      if (value !== '' && value !== null) {
        const num = parseFloat(value);
        if (isNaN(num) || num < 0) return 'Minimum order value cannot be negative';
      }
      return '';
    }

    if (name === 'expiry_date') {
      if (!value) return 'Expiry date & time is required';
      const expDate = new Date(value);
      if (isNaN(expDate.getTime())) return 'Invalid expiry date';

      const startDate = formData.starts_at ? new Date(formData.starts_at) : new Date();
      if (expDate <= startDate) return 'Expiry date must be later than start date';
      if (!isEdit && expDate <= new Date()) return 'Expiry date must be in the future';
      return '';
    }

    if (name === 'usage_limit' && value !== '') {
      const limitNum = parseInt(value, 10);
      if (isNaN(limitNum) || limitNum < 1) {
        return 'Usage limit must be a positive integer';
      }
      if (isEdit && coupon?.times_used > 0 && limitNum < coupon.times_used) {
        return `Usage limit cannot be lower than times already used (${coupon.times_used})`;
      }
      return '';
    }

    if (name === 'per_user_limit' && value !== '') {
      const perUserNum = parseInt(value, 10);
      if (isNaN(perUserNum) || perUserNum < 1) {
        return 'Per-user limit must be a positive integer';
      }
      if (formData.usage_limit !== '') {
        const totalLimit = parseInt(formData.usage_limit, 10);
        if (!isNaN(totalLimit) && perUserNum > totalLimit) {
          return 'Per-user limit cannot exceed total usage limit';
        }
      }
      return '';
    }

    if (name === 'description' && value) {
      if (String(value).trim().length > 120) {
        return 'Description cannot exceed 120 characters';
      }
      return '';
    }

    if (name === 'category_ids' && (formData.apply_to === 'categories' || formData.apply_to === 'category')) {
      if (!Array.isArray(value) || value.length === 0) {
        return 'Please select at least one category';
      }
      return '';
    }

    if (name === 'product_ids' && (formData.apply_to === 'products' || formData.apply_to === 'product')) {
      if (!Array.isArray(value) || value.length === 0) {
        return 'Please select at least one product';
      }
      return '';
    }

    return '';
  };

  // ── Field Change Handler ───────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;

    if (name === 'code') {
      newValue = value.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    }

    if (name === 'discount_type') {
      // Reset discount value if invalid for new type
      if (value === 'bogo') {
        setFormData((prev) => ({ ...prev, discount_type: value, discount_value: '0', max_discount: '' }));
      } else {
        setFormData((prev) => ({ ...prev, discount_type: value, max_discount: value === 'fixed' ? '' : prev.max_discount }));
      }
      if (submitError) setSubmitError(null);
      return;
    }

    if (name === 'apply_to') {
      const hasSelections = (formData.category_ids.length > 0 || formData.product_ids.length > 0);
      if (hasSelections && value !== formData.apply_to) {
        setScopeSwitchConfirm(value);
        return;
      }
      setFormData((prev) => ({ ...prev, apply_to: value }));
      if (submitError) setSubmitError(null);
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));
    if (submitError) setSubmitError(null);

    // Live re-validation
    if (errors[name]) {
      const err = validateField(name, newValue);
      setErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const handleBlur = (field) => {
    const err = validateField(field, formData[field]);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const confirmScopeSwitch = (newScope) => {
    setFormData((prev) => ({
      ...prev,
      apply_to: newScope,
      category_ids: [],
      product_ids: []
    }));
    setScopeSwitchConfirm(null);
  };

  // ── Multi-Select Helpers ───────────────────────────────────────────────────
  const toggleCategorySelection = (catId) => {
    const numId = parseInt(catId, 10);
    setFormData((prev) => {
      const exists = prev.category_ids.includes(numId);
      const updated = exists ? prev.category_ids.filter((id) => id !== numId) : [...prev.category_ids, numId];
      if (errors.category_ids) {
        setErrors((errs) => ({ ...errs, category_ids: updated.length === 0 ? 'Please select at least one category' : '' }));
      }
      return { ...prev, category_ids: updated };
    });
  };

  const toggleProductSelection = (prodId) => {
    const numId = parseInt(prodId, 10);
    setFormData((prev) => {
      const exists = prev.product_ids.includes(numId);
      const updated = exists ? prev.product_ids.filter((id) => id !== numId) : [...prev.product_ids, numId];
      if (errors.product_ids) {
        setErrors((errs) => ({ ...errs, product_ids: updated.length === 0 ? 'Please select at least one product' : '' }));
      }
      return { ...prev, product_ids: updated };
    });
  };

  const toggleCustomerSelection = (userId) => {
    const strId = String(userId);
    setFormData((prev) => {
      const exists = prev.customer_ids.includes(strId);
      const updated = exists ? prev.customer_ids.filter((id) => id !== strId) : [...prev.customer_ids, strId];
      return { ...prev, customer_ids: updated };
    });
  };

  // Filter lists for multi-select search
  const filteredCategories = useMemo(() => {
    const q = categorySearch.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter((c) => (c.name || '').toLowerCase().includes(q));
  }, [categories, categorySearch]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    if (!q) return products;
    return products.filter((p) =>
      (p.title || p.productname || p.name || '').toLowerCase().includes(q) ||
      (p.style_code || '').toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const filteredTargetUsers = useMemo(() => {
    const q = userSearch.toLowerCase().trim();
    if (!q) return targetUsers;
    return targetUsers.filter((u) =>
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || u.emailid || '').toLowerCase().includes(q) ||
      (u.fullname || '').toLowerCase().includes(q)
    );
  }, [targetUsers, userSearch]);

  // ── Form Submission ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate all fields
    const codeErr = validateField('code', formData.code);
    const valueErr = validateField('discount_value', formData.discount_value);
    const maxDiscountErr = validateField('max_discount', formData.max_discount);
    const minOrderErr = validateField('min_order_value', formData.min_order_value);
    const expiryErr = validateField('expiry_date', formData.expiry_date);
    const limitErr = validateField('usage_limit', formData.usage_limit);
    const perUserErr = validateField('per_user_limit', formData.per_user_limit);
    const descErr = validateField('description', formData.description);
    const catErr = validateField('category_ids', formData.category_ids);
    const prodErr = validateField('product_ids', formData.product_ids);

    const newErrors = {
      code: codeErr,
      discount_value: valueErr,
      max_discount: maxDiscountErr,
      min_order_value: minOrderErr,
      expiry_date: expiryErr,
      usage_limit: limitErr,
      per_user_limit: perUserErr,
      description: descErr,
      category_ids: catErr,
      product_ids: prodErr
    };

    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some(Boolean);
    if (hasErrors) {
      setSubmitError('Please fix the validation errors highlighted below.');
      setTimeout(() => {
        const firstInvalid = document.querySelector('#coupon-form [aria-invalid="true"], #coupon-form input.border-rose-500, #coupon-form select.border-rose-500');
        if (firstInvalid) firstInvalid.focus();
      }, 50);
      return;
    }

    setSubmitting(true);

    let retryCount = 0;
    const maxAutoRetries = (codeMode === 'auto' && !isEdit) ? 3 : 1;

    while (retryCount < maxAutoRetries) {
      try {
        const payload = {
          code: formData.code.trim().toUpperCase(),
          description: formData.description.trim(),
          discount_type: formData.discount_type,
          discount_value: formData.discount_type === 'bogo' ? 0 : parseFloat(formData.discount_value),
          max_discount: (formData.discount_type === 'percentage' && formData.max_discount) ? parseFloat(formData.max_discount) : null,
          min_order_value: parseFloat(formData.min_order_value) || 0,
          usage_limit: formData.usage_limit ? parseInt(formData.usage_limit, 10) : null,
          per_user_limit: formData.per_user_limit ? parseInt(formData.per_user_limit, 10) : null,
          starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : new Date().toISOString(),
          expires_at: new Date(formData.expiry_date).toISOString(),
          expiry_date: formData.expiry_date,
          applies_to: formData.apply_to,
          category_ids: formData.apply_to === 'categories' ? formData.category_ids : [],
          product_ids: formData.apply_to === 'products' ? formData.product_ids : [],
          customer_ids: formData.is_restricted ? formData.customer_ids : [],
          is_private: formData.is_restricted,
          is_restricted: formData.is_restricted,
          is_active: formData.active,
          active: formData.active
        };

        let result;
        if (isEdit) {
          result = await couponService.updateCoupon(coupon.id, payload);
        } else {
          result = await couponService.createCoupon(payload);
        }

        const savedCoupon = result?.data || result?.coupon || result;
        onCouponSaved(savedCoupon, isEdit);
        onClose();
        break; // Success exit loop
      } catch (err) {
        const errMsg = err.message || 'Failed to save coupon. Please try again.';
        const isDuplicate = errMsg.toLowerCase().includes('already exists') || errMsg.toLowerCase().includes('duplicate');

        if (isDuplicate && codeMode === 'auto' && !isEdit && retryCount < maxAutoRetries - 1) {
          // Auto regenerate code on collision and retry
          retryCount++;
          const newAutoCode = generateRandomCode();
          setFormData((prev) => ({ ...prev, code: newAutoCode }));
          continue;
        }

        console.error('Failed to save coupon:', err);
        if (isDuplicate) {
          setErrors((prev) => ({ ...prev, code: 'This coupon code already exists' }));
        }
        setSubmitError(errMsg);
        break;
      }
    }

    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 font-admin">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-neutral-200">
        
        {/* ── Modal Header ──────────────────────────────────────────────────── */}
        <div className="px-6 py-4.5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/80 sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-neutral-200/70 text-brand-dark border border-neutral-300">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-dark">
                {isEdit ? 'Edit Coupon' : 'Create New Coupon'}
              </h2>
              <p className="text-xs text-neutral-500 font-sans">
                Configure discount, scope and validity.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-brand-dark hover:bg-neutral-200/60 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Modal Body ────────────────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          
          {/* Scope Change Confirmation Dialog */}
          {scopeSwitchConfirm && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3 font-sans animate-fadeIn">
              <div className="flex items-start gap-2.5 text-xs text-amber-900">
                <AlertCircle className="w-4.5 h-4.5 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Switching <strong>Apply To</strong> scope to <strong>{scopeSwitchConfirm}</strong> will clear your current selections. Do you want to proceed?
                </span>
              </div>
              <div className="flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setScopeSwitchConfirm(null)}
                  className="px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => confirmScopeSwitch(scopeSwitchConfirm)}
                  className="px-3 py-1.5 bg-brand-dark text-white rounded-lg font-semibold hover:bg-black cursor-pointer"
                >
                  Confirm & Clear
                </button>
              </div>
            </div>
          )}

          {/* Form Error Banner */}
          {submitError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs font-sans animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="flex-1 font-medium">{submitError}</span>
            </div>
          )}

          {/* Used Coupon Lock Notice */}
          {isUsed && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900 text-xs font-sans">
              <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                Coupon Code, Discount Type, and Discount Value are locked because this coupon has already been redeemed by customers.
              </span>
            </div>
          )}

          <form id="coupon-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
            
            {/* ── Code Generation Mode Radio Switch (Create Mode Only) ────────── */}
            {!isEdit && (
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
                <span className="text-xs font-semibold text-neutral-700">Code Generation Mode</span>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="codeMode"
                      checked={codeMode === 'manual'}
                      onChange={() => handleCodeModeChange('manual')}
                      className="w-4 h-4 accent-brand-dark cursor-pointer"
                    />
                    <span>Manual Entry</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="codeMode"
                      checked={codeMode === 'auto'}
                      onChange={() => handleCodeModeChange('auto')}
                      className="w-4 h-4 accent-brand-dark cursor-pointer"
                    />
                    <span>Auto Generate</span>
                  </label>
                </div>
              </div>
            )}

            {/* ── ROW 1: Coupon Code & Discount Type ─────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Coupon Code Field */}
              <div>
                <label className="block text-xs font-bold text-brand-dark mb-1.5 uppercase tracking-wider">
                  Coupon Code <span className="text-rose-600">*</span>
                </label>

                {codeMode === 'auto' && !isEdit ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      readOnly
                      aria-invalid={Boolean(errors.code)}
                      className={`flex-1 px-3.5 py-2.5 bg-neutral-100 border rounded-xl text-xs font-mono font-bold tracking-wide text-brand-dark ${
                        errors.code ? 'border-rose-500' : 'border-neutral-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleRegenerateCode}
                      className="px-3 py-2.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-xl text-xs font-semibold text-brand-dark flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      title="Generate a new code"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Regenerate</span>
                    </button>
                  </div>
                ) : (
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    disabled={isUsed}
                    onChange={handleChange}
                    onBlur={() => handleBlur('code')}
                    placeholder="e.g. FESTIVE20"
                    aria-invalid={Boolean(errors.code)}
                    className={`w-full px-3.5 py-2.5 bg-neutral-50 border rounded-xl text-xs font-mono font-bold tracking-wide uppercase placeholder-neutral-400 focus:outline-none focus:bg-white focus:ring-1 transition-all ${
                      errors.code
                        ? 'border-rose-500 focus:ring-rose-500'
                        : 'border-neutral-200 focus:border-brand-dark focus:ring-brand-dark'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  />
                )}

                {errors.code && (
                  <p className="text-[11px] text-rose-600 font-sans mt-1">{errors.code}</p>
                )}
              </div>

              {/* Discount Type Select */}
              <div>
                <label className="block text-xs font-bold text-brand-dark mb-1.5 uppercase tracking-wider">
                  Discount Type <span className="text-rose-600">*</span>
                </label>
                <select
                  name="discount_type"
                  value={formData.discount_type}
                  disabled={isUsed}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-brand-dark focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-dark transition-all disabled:opacity-60 cursor-pointer"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                  <option value="bogo">BOGO (Buy 1 Get 1 Free)</option>
                </select>
              </div>
            </div>

            {/* ── ROW 2: Discount Value & Minimum Order Value ───────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Discount Value Input */}
              <div>
                <label className="block text-xs font-bold text-brand-dark mb-1.5 uppercase tracking-wider">
                  Discount Value {formData.discount_type !== 'bogo' && <span className="text-rose-600">*</span>}
                </label>

                {formData.discount_type === 'bogo' ? (
                  <div className="px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold font-sans">
                    Buy 1 Get 1 Free on eligible items
                  </div>
                ) : (
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-500">
                      {formData.discount_type === 'percentage' ? '%' : '₹'}
                    </span>
                    <input
                      type="number"
                      name="discount_value"
                      step="0.01"
                      min="0"
                      value={formData.discount_value}
                      disabled={isUsed}
                      onChange={handleChange}
                      onBlur={() => handleBlur('discount_value')}
                      placeholder={formData.discount_type === 'percentage' ? '15' : '200'}
                      aria-invalid={Boolean(errors.discount_value)}
                      className={`w-full pl-8 pr-3.5 py-2.5 bg-neutral-50 border rounded-xl text-xs font-semibold text-brand-dark placeholder-neutral-400 focus:outline-none focus:bg-white focus:ring-1 transition-all ${
                        errors.discount_value
                          ? 'border-rose-500 focus:ring-rose-500'
                          : 'border-neutral-200 focus:border-brand-dark focus:ring-brand-dark'
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                    />
                  </div>
                )}

                {errors.discount_value && (
                  <p className="text-[11px] text-rose-600 font-sans mt-1">{errors.discount_value}</p>
                )}
              </div>

              {/* Minimum Order Value Input */}
              <div>
                <label className="block text-xs font-bold text-brand-dark mb-1.5 uppercase tracking-wider">
                  Minimum Order Value (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    name="min_order_value"
                    step="0.01"
                    min="0"
                    value={formData.min_order_value}
                    onChange={handleChange}
                    onBlur={() => handleBlur('min_order_value')}
                    placeholder="0 (no minimum order)"
                    aria-invalid={Boolean(errors.min_order_value)}
                    className={`w-full pl-8 pr-3.5 py-2.5 bg-neutral-50 border rounded-xl text-xs font-semibold text-brand-dark placeholder-neutral-400 focus:outline-none focus:bg-white focus:ring-1 transition-all ${
                      errors.min_order_value
                        ? 'border-rose-500 focus:ring-rose-500'
                        : 'border-neutral-200 focus:border-brand-dark focus:ring-brand-dark'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-neutral-400 font-sans mt-1">
                  Enter 0 for no minimum order requirement.
                </p>
                {errors.min_order_value && (
                  <p className="text-[11px] text-rose-600 font-sans mt-1">{errors.min_order_value}</p>
                )}
              </div>
            </div>

            {/* ── Max Discount Cap Field (Shown Only for Percentage Discount) ── */}
            {formData.discount_type === 'percentage' && (
              <div>
                <label className="block text-xs font-bold text-brand-dark mb-1.5 uppercase tracking-wider">
                  Maximum Discount Cap (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    name="max_discount"
                    step="0.01"
                    min="0"
                    value={formData.max_discount}
                    onChange={handleChange}
                    onBlur={() => handleBlur('max_discount')}
                    placeholder="Optional max discount cap (e.g. 500)"
                    aria-invalid={Boolean(errors.max_discount)}
                    className={`w-full pl-8 pr-3.5 py-2.5 bg-neutral-50 border rounded-xl text-xs font-semibold text-brand-dark placeholder-neutral-400 focus:outline-none focus:bg-white focus:ring-1 transition-all ${
                      errors.max_discount
                        ? 'border-rose-500 focus:ring-rose-500'
                        : 'border-neutral-200 focus:border-brand-dark focus:ring-brand-dark'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-neutral-400 font-sans mt-1">
                  Leave blank for unlimited percentage discount.
                </p>
                {errors.max_discount && (
                  <p className="text-[11px] text-rose-600 font-sans mt-1">{errors.max_discount}</p>
                )}
              </div>
            )}

            {/* ── ROW 3: Apply To Scope & Conditional Multi-Select ───────────── */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-brand-dark mb-1.5 uppercase tracking-wider">
                  Apply To Scope <span className="text-rose-600">*</span>
                </label>
                <select
                  name="apply_to"
                  value={formData.apply_to}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-brand-dark focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-dark transition-all cursor-pointer"
                >
                  <option value="all">All Products</option>
                  <option value="categories">Specific Categories</option>
                  <option value="products">Specific Products</option>
                </select>
              </div>

              {/* Conditional Multi-Select Selector for Categories */}
              {(formData.apply_to === 'categories' || formData.apply_to === 'category') && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-neutral-500" />
                      Select Eligible Categories <span className="text-rose-600">*</span>
                    </span>
                    <span className="text-[11px] font-semibold text-neutral-500">
                      {formData.category_ids.length} selected
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      placeholder="Search categories..."
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs font-sans text-brand-dark placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-brand-dark"
                    />
                  </div>

                  {/* Selected Category Badges */}
                  {formData.category_ids.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {formData.category_ids.map((id) => {
                        const catObj = categories.find((c) => Number(c.id || c.category_id) === Number(id));
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 bg-white border border-neutral-300 text-brand-dark text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-2xs"
                          >
                            <span>{catObj?.name || `Category #${id}`}</span>
                            <button
                              type="button"
                              onClick={() => toggleCategorySelection(id)}
                              className="text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Categories Options Scroll Box */}
                  <div className="max-h-36 overflow-y-auto border border-neutral-200 rounded-lg bg-white divide-y divide-neutral-100 text-xs">
                    {filteredCategories.length === 0 ? (
                      <div className="p-3 text-neutral-400 text-center text-[11px]">
                        No matching categories found
                      </div>
                    ) : (
                      filteredCategories.map((c) => {
                        const cId = Number(c.id || c.category_id);
                        const isSelected = formData.category_ids.includes(cId);
                        return (
                          <button
                            key={cId}
                            type="button"
                            onClick={() => toggleCategorySelection(cId)}
                            className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected ? 'bg-neutral-100 font-semibold text-brand-dark' : 'hover:bg-neutral-50 text-neutral-700'
                            }`}
                          >
                            <span>{c.name}</span>
                            {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {errors.category_ids && (
                    <p className="text-[11px] text-rose-600 font-sans mt-1">{errors.category_ids}</p>
                  )}
                </div>
              )}

              {/* Conditional Multi-Select Selector for Products */}
              {(formData.apply_to === 'products' || formData.apply_to === 'product') && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-neutral-500" />
                      Select Eligible Products <span className="text-rose-600">*</span>
                    </span>
                    <span className="text-[11px] font-semibold text-neutral-500">
                      {formData.product_ids.length} selected
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search products by title or style code..."
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs font-sans text-brand-dark placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-brand-dark"
                    />
                  </div>

                  {/* Selected Product Badges */}
                  {formData.product_ids.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {formData.product_ids.map((id) => {
                        const prodObj = products.find((p) => Number(p.id) === Number(id));
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 bg-white border border-neutral-300 text-brand-dark text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-2xs"
                          >
                            <span>{prodObj?.title || prodObj?.name || `Product #${id}`}</span>
                            <button
                              type="button"
                              onClick={() => toggleProductSelection(id)}
                              className="text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Products Options Scroll Box */}
                  <div className="max-h-44 overflow-y-auto border border-neutral-200 rounded-lg bg-white divide-y divide-neutral-100 text-xs">
                    {filteredProducts.length === 0 ? (
                      <div className="p-3 text-neutral-400 text-center text-[11px]">
                        No matching products found
                      </div>
                    ) : (
                      filteredProducts.map((p) => {
                        const pId = Number(p.id);
                        const isSelected = formData.product_ids.includes(pId);
                        const title = p.title || p.productname || p.name;
                        const thumb = (Array.isArray(p.images) && p.images[0]) || p.image_url || p.image;

                        return (
                          <button
                            key={pId}
                            type="button"
                            onClick={() => toggleProductSelection(pId)}
                            className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected ? 'bg-neutral-100 font-semibold text-brand-dark' : 'hover:bg-neutral-50 text-neutral-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {thumb ? (
                                <img src={thumb} alt={title} className="w-7 h-7 rounded object-cover border border-neutral-200 shrink-0" />
                              ) : (
                                <div className="w-7 h-7 rounded bg-neutral-100 border border-neutral-200 shrink-0 flex items-center justify-center text-neutral-400 text-[10px]">
                                  No Img
                                </div>
                              )}
                              <span className="truncate text-xs">{title}</span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {errors.product_ids && (
                    <p className="text-[11px] text-rose-600 font-sans mt-1">{errors.product_ids}</p>
                  )}
                </div>
              )}
            </div>

            {/* ── ROW 4: Usage Limit & Per-User Limit ────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Total Usage Limit */}
              <div>
                <label className="block text-xs font-bold text-brand-dark mb-1.5 uppercase tracking-wider">
                  Usage Limit (Total Redemptions)
                </label>
                <input
                  type="number"
                  name="usage_limit"
                  min="1"
                  step="1"
                  value={formData.usage_limit}
                  onChange={handleChange}
                  onBlur={() => handleBlur('usage_limit')}
                  placeholder="Leave blank for unlimited"
                  aria-invalid={Boolean(errors.usage_limit)}
                  className={`w-full px-3.5 py-2.5 bg-neutral-50 border rounded-xl text-xs font-semibold text-brand-dark placeholder-neutral-400 focus:outline-none focus:bg-white focus:ring-1 transition-all ${
                    errors.usage_limit
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-neutral-200 focus:border-brand-dark focus:ring-brand-dark'
                  }`}
                />
                <p className="text-[11px] text-neutral-400 font-sans mt-1">
                  Blank means unlimited total redemptions.
                </p>
                {errors.usage_limit && (
                  <p className="text-[11px] text-rose-600 font-sans mt-1">{errors.usage_limit}</p>
                )}
              </div>

              {/* Per-User Limit */}
              <div>
                <label className="block text-xs font-bold text-brand-dark mb-1.5 uppercase tracking-wider">
                  Per-User Limit
                </label>
                <input
                  type="number"
                  name="per_user_limit"
                  min="1"
                  step="1"
                  value={formData.per_user_limit}
                  onChange={handleChange}
                  onBlur={() => handleBlur('per_user_limit')}
                  placeholder="Leave blank for unlimited per customer"
                  aria-invalid={Boolean(errors.per_user_limit)}
                  className={`w-full px-3.5 py-2.5 bg-neutral-50 border rounded-xl text-xs font-semibold text-brand-dark placeholder-neutral-400 focus:outline-none focus:bg-white focus:ring-1 transition-all ${
                    errors.per_user_limit
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-neutral-200 focus:border-brand-dark focus:ring-brand-dark'
                  }`}
                />
                <p className="text-[11px] text-neutral-400 font-sans mt-1">
                  Max times a single customer can redeem.
                </p>
                {errors.per_user_limit && (
                  <p className="text-[11px] text-rose-600 font-sans mt-1">{errors.per_user_limit}</p>
                )}
              </div>
            </div>

            {/* ── ROW 5: Start Date & Time and Expiry Date & Time ───────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Start Date & Time */}
              <div>
                <label className="block text-xs font-bold text-brand-dark mb-1.5 uppercase tracking-wider">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="starts_at"
                  value={formData.starts_at}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-brand-dark focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-dark transition-all cursor-pointer font-sans"
                />
                <p className="text-[11px] text-neutral-400 font-sans mt-1">
                  Defaults to current timestamp if unedited.
                </p>
              </div>

              {/* Expiry Date & Time */}
              <div>
                <label className="block text-xs font-bold text-brand-dark mb-1.5 uppercase tracking-wider">
                  Expiry Date & Time <span className="text-rose-600">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="expiry_date"
                  value={formData.expiry_date}
                  onChange={handleChange}
                  onBlur={() => handleBlur('expiry_date')}
                  aria-invalid={Boolean(errors.expiry_date)}
                  className={`w-full px-3.5 py-2.5 bg-neutral-50 border rounded-xl text-xs font-medium text-brand-dark focus:outline-none focus:bg-white focus:ring-1 transition-all cursor-pointer font-sans ${
                    errors.expiry_date
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-neutral-200 focus:border-brand-dark focus:ring-brand-dark'
                  }`}
                />
                {errors.expiry_date && (
                  <p className="text-[11px] text-rose-600 font-sans mt-1">{errors.expiry_date}</p>
                )}
              </div>
            </div>

            {/* ── Description Field ───────────────────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">
                  Description
                </label>
                <span className="text-[11px] text-neutral-400 font-sans">
                  {formData.description.length} / 120
                </span>
              </div>
              <input
                type="text"
                name="description"
                maxLength={120}
                value={formData.description}
                onChange={handleChange}
                onBlur={() => handleBlur('description')}
                placeholder="Internal summary or promo details for customers (optional)"
                aria-invalid={Boolean(errors.description)}
                className={`w-full px-3.5 py-2.5 bg-neutral-50 border rounded-xl text-xs font-sans text-brand-dark placeholder-neutral-400 focus:outline-none focus:bg-white focus:ring-1 transition-all ${
                  errors.description
                    ? 'border-rose-500 focus:ring-rose-500'
                    : 'border-neutral-200 focus:border-brand-dark focus:ring-brand-dark'
                }`}
              />
              {errors.description && (
                <p className="text-[11px] text-rose-600 font-sans mt-1">{errors.description}</p>
              )}
            </div>

            {/* ── Private / Restricted Coupon Toggle & Customer Multi-Select ──── */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-3 font-sans">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-brand-dark uppercase tracking-wider">
                    Private / Restricted Coupon
                  </span>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    If enabled, only assigned customers can use this coupon.
                  </p>
                </div>
                
                {/* Switch Toggle */}
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    name="is_restricted"
                    checked={formData.is_restricted}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-dark"></div>
                </label>
              </div>

              {/* Conditional Customer Multi-Select Selector */}
              {formData.is_restricted && (
                <div className="pt-3 border-t border-neutral-200 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-neutral-500" />
                      Assign Customers
                    </span>
                    <span className="text-[11px] font-semibold text-neutral-500">
                      {formData.customer_ids.length} assigned
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-400">
                    Select customers now or assign them later from the coupon card.
                  </p>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search customers by name or email..."
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs font-sans text-brand-dark placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-brand-dark"
                    />
                  </div>

                  {/* Selected Customer Badges */}
                  {formData.customer_ids.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {formData.customer_ids.map((idStr) => {
                        const userObj = targetUsers.find((u) => String(u.username || u.id) === String(idStr));
                        const label = userObj?.fullname || userObj?.username || userObj?.email || `Customer ${idStr}`;
                        return (
                          <span
                            key={idStr}
                            className="inline-flex items-center gap-1 bg-white border border-neutral-300 text-brand-dark text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-2xs"
                          >
                            <span>{label}</span>
                            <button
                              type="button"
                              onClick={() => toggleCustomerSelection(idStr)}
                              className="text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Customer Options Scroll Box */}
                  <div className="max-h-36 overflow-y-auto border border-neutral-200 rounded-lg bg-white divide-y divide-neutral-100 text-xs">
                    {filteredTargetUsers.length === 0 ? (
                      <div className="p-3 text-neutral-400 text-center text-[11px]">
                        No matching customers found
                      </div>
                    ) : (
                      filteredTargetUsers.map((u) => {
                        const uId = String(u.username || u.id);
                        const isSelected = formData.customer_ids.includes(uId);
                        const name = u.fullname || u.username;
                        const email = u.email || u.emailid;

                        return (
                          <button
                            key={uId}
                            type="button"
                            onClick={() => toggleCustomerSelection(uId)}
                            className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected ? 'bg-neutral-100 font-semibold text-brand-dark' : 'hover:bg-neutral-50 text-neutral-700'
                            }`}
                          >
                            <div>
                              <span className="font-semibold block">{name}</span>
                              {email && <span className="text-[10px] text-neutral-400 block">{email}</span>}
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Active Status Toggle ────────────────────────────────────────── */}
            <div className="flex items-center justify-between bg-neutral-50 border border-neutral-200 rounded-xl p-4 font-sans">
              <div>
                <span className="block text-xs font-bold text-brand-dark uppercase tracking-wider">
                  Active Status
                </span>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Enable or disable coupon redemption immediately.
                </p>
              </div>

              {/* Active Switch */}
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

          </form>
        </div>

        {/* ── Modal Sticky Footer ────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50/90 sticky bottom-0 z-20 flex items-center justify-end gap-3 font-sans">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4.5 py-2.5 border border-neutral-300 text-neutral-700 rounded-xl text-xs font-semibold hover:bg-neutral-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="coupon-form"
            disabled={submitting}
            className="px-5 py-2.5 bg-brand-dark text-white rounded-xl text-xs font-semibold hover:bg-black transition-colors flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isEdit ? 'Updating...' : 'Creating...'}</span>
              </>
            ) : (
              <span>{isEdit ? 'Update Coupon' : 'Create Coupon'}</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CouponModal;
