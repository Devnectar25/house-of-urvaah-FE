import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Upload,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import { apiClient, clearAuthSession } from '../../lib/apiClient';

export const EditProductModal = ({ product, isOpen, onClose, onProductUpdated, onProductDeleted }) => {
  if (!isOpen || !product) return null;

  // Form State initialized from product prop
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    subCategory: '',
    shortDescription: '',
    description: '',
    originalPrice: 0,
    discountPercent: 0,
    price: 0,
    stockQuantity: 0,
    active: true,
    promoted: false,
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Default'],
    specifications: [],
    careInstructions: '',
    images: []
  });

  const DEFAULT_CATEGORIES = [
    { id: 1, category_id: 1, name: 'CORSET TOPS' },
    { id: 2, category_id: 2, name: 'CO-ORD SETS' },
    { id: 3, category_id: 3, name: 'SUMMER DRESSES' },
    { id: 4, category_id: 4, name: 'PARTY WEAR' }
  ];

  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [errors, setErrors] = useState({});
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Delete confirmation step state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Size & Color input buffers for tag creation
  const [sizeInput, setSizeInput] = useState('');
  const [colorInput, setColorInput] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Refs for focusing first invalid field on submit validation
  const nameRef = useRef(null);
  const categoryRef = useRef(null);
  const priceRef = useRef(null);
  const discountRef = useRef(null);

  // Fetch available categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await apiClient('/api/categories');
        const list = Array.isArray(res) ? res : (res?.data || []);
        setCategories(list.length > 0 ? list : DEFAULT_CATEGORIES);
      } catch (err) {
        console.error('Failed to load categories in modal:', err);
      }
    };
    fetchCats();
  }, []);

  // Populate or fetch detailed product data when product ID changes
  useEffect(() => {
    if (!product?.id) return;

    const loadFullProduct = async () => {
      setFetchingDetail(true);
      setSubmitError(null);
      setShowDeleteConfirm(false);
      try {
        const res = await apiClient(`/api/products/${product.id}`);
        const data = res?.data || res || {};
        
        let specsArr = [];
        if (Array.isArray(data.specifications)) {
          specsArr = data.specifications;
        } else if (data.specifications && typeof data.specifications === 'object') {
          specsArr = Object.entries(data.specifications).map(([label, value]) => ({ label, value }));
        }

        setFormData({
          name: data.title || data.productname || product.name || '',
          category_id: data.category_id || product.category_id || '',
          subCategory: data.subcategory_name || data.subCategory || product.subCategory || '',
          shortDescription: data.shortdescription || data.shortDescription || product.shortDescription || '',
          description: data.description || product.description || '',
          originalPrice: Number(data.originalprice || data.originalPrice || product.originalPrice || product.price || 0),
          discountPercent: Number(data.discount || data.discountPercent || product.discountPercent || 0),
          price: Number(data.price || product.price || 0),
          stockQuantity: Number(data.stock_quantity ?? data.quantity ?? product.stockQuantity ?? 0),
          active: Boolean(data.is_active ?? data.active ?? product.active ?? true),
          promoted: Boolean(data.promoted ?? product.promoted ?? false),
          sizes: Array.isArray(data.sizes) ? data.sizes : (product.sizes || ['XS', 'S', 'M', 'L']),
          colors: Array.isArray(data.colors) ? data.colors : (product.colors || ['Default']),
          specifications: specsArr,
          careInstructions: data.care_instructions || data.careInstructions || product.careInstructions || '',
          images: Array.isArray(data.images) && data.images.length > 0
            ? data.images 
            : (data.image ? [data.image] : (product.images || []))
        });
      } catch (err) {
        console.error('Error loading full product details:', err);
        setFormData({
          name: product.name || '',
          category_id: product.category_id || '',
          subCategory: product.subCategory || '',
          shortDescription: product.shortDescription || '',
          description: product.description || '',
          originalPrice: Number(product.originalPrice || product.price || 0),
          discountPercent: Number(product.discountPercent || 0),
          price: Number(product.price || 0),
          stockQuantity: Number(product.stockQuantity || 0),
          active: product.active ?? true,
          promoted: product.promoted ?? false,
          sizes: product.sizes || ['XS', 'S', 'M', 'L'],
          colors: product.colors || ['Default'],
          specifications: [],
          careInstructions: product.careInstructions || '',
          images: product.images || []
        });
      } finally {
        setFetchingDetail(false);
      }
    };

    loadFullProduct();
  }, [product]);

  // Real-time Field Validation
  const validateField = (field, value) => {
    let err = null;
    if (field === 'name') {
      if (!value || !value.trim()) err = 'Product name is required';
    } else if (field === 'category_id') {
      if (!value) err = 'Please select a category';
    } else if (field === 'price') {
      if (value === '' || value === null || isNaN(value) || Number(value) < 0) {
        err = 'Valid current price is required';
      }
    } else if (field === 'discountPercent') {
      const num = Number(value);
      if (isNaN(num) || num < 0 || num > 100) {
        err = 'Discount % must be between 0 and 100';
      }
    }
    setErrors(prev => ({ ...prev, [field]: err }));
    return !err;
  };

  const handleBlur = (field) => {
    validateField(field, formData[field]);
  };

  // Automatic recalculation for Pricing
  const handleOriginalPriceChange = (e) => {
    const orig = parseFloat(e.target.value) || 0;
    const disc = formData.discountPercent || 0;
    const calcPrice = disc > 0 ? orig * (1 - disc / 100) : orig;
    setFormData(prev => ({
      ...prev,
      originalPrice: orig,
      price: Number(calcPrice.toFixed(2))
    }));
    validateField('price', calcPrice);
  };

  const handleDiscountChange = (e) => {
    const disc = parseFloat(e.target.value) || 0;
    const orig = formData.originalPrice || formData.price || 0;
    const calcPrice = orig > 0 ? orig * (1 - disc / 100) : formData.price;
    setFormData(prev => ({
      ...prev,
      discountPercent: disc,
      price: Number(calcPrice.toFixed(2))
    }));
    validateField('discountPercent', disc);
    validateField('price', calcPrice);
  };

  const handlePriceChange = (e) => {
    const p = parseFloat(e.target.value) || 0;
    setFormData(prev => ({ ...prev, price: p }));
    validateField('price', p);
  };

  // Sizes tag handler
  const handleAddSize = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newSize = sizeInput.trim().toUpperCase();
      if (newSize && !formData.sizes.includes(newSize)) {
        setFormData(prev => ({ ...prev, sizes: [...prev.sizes, newSize] }));
      }
      setSizeInput('');
    }
  };

  const handleRemoveSize = (sizeToRemove) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.filter(s => s !== sizeToRemove)
    }));
  };

  // Colors tag handler
  const handleAddColor = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newColor = colorInput.trim();
      if (newColor && !formData.colors.includes(newColor)) {
        setFormData(prev => ({ ...prev, colors: [...prev.colors, newColor] }));
      }
      setColorInput('');
    }
  };

  const handleRemoveColor = (colorToRemove) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter(c => c !== colorToRemove)
    }));
  };

  // Specifications Key-Value handler
  const handleAddSpecification = () => {
    setFormData(prev => ({
      ...prev,
      specifications: [...prev.specifications, { label: '', value: '' }]
    }));
  };

  const handleSpecChange = (index, key, val) => {
    setFormData(prev => {
      const updated = [...prev.specifications];
      updated[index] = { ...updated[index], [key]: val };
      return { ...prev, specifications: updated };
    });
  };

  const handleRemoveSpecification = (index) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, idx) => idx !== index)
    }));
  };

  // File / Image Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (formData.images.length >= 5) {
      setSubmitError('Maximum 5 images allowed per product.');
      return;
    }

    setUploadingImage(true);
    setSubmitError(null);

    try {
      const data = new FormData();
      data.append('file', file);

      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_BASE}/api/upload/upload-image`, {
        method: 'POST',
        body: data
      });
      const resData = await res.json();

      if (!res.ok || !resData.success) {
        throw new Error(resData.message || 'Image upload failed');
      }

      const uploadedUrl = resData.data?.url || resData.url;
      if (uploadedUrl) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, uploadedUrl]
        }));
      }
    } catch (err) {
      console.error('Image upload error:', err);
      // Local fallback blob URL
      const localUrl = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, localUrl]
      }));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    if (formData.images.length >= 5) {
      setSubmitError('Maximum 5 images allowed per product.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, imageUrlInput.trim()]
    }));
    setImageUrlInput('');
    setShowUrlInput(false);
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  // Submit / Update Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (updating || deleting) return;

    setSubmitError(null);

    // Full field validation
    const isNameValid = validateField('name', formData.name);
    const isCategoryValid = validateField('category_id', formData.category_id);
    const isPriceValid = validateField('price', formData.price);
    const isDiscountValid = validateField('discountPercent', formData.discountPercent);

    if (!isNameValid || !isCategoryValid || !isPriceValid || !isDiscountValid) {
      setSubmitError('Please fix the highlighted required fields before saving.');
      if (!isNameValid) {
        nameRef.current?.focus();
      } else if (!isCategoryValid) {
        categoryRef.current?.focus();
      } else if (!isPriceValid) {
        priceRef.current?.focus();
      } else if (!isDiscountValid) {
        discountRef.current?.focus();
      }
      return;
    }

    setUpdating(true);
    setSubmitError(null);

    try {
      const payload = {
        title: formData.name.trim(),
        productname: formData.name.trim(),
        category_id: formData.category_id,
        subcategory_name: formData.subCategory,
        shortdescription: formData.shortDescription.trim(),
        description: formData.description.trim(),
        originalprice: Number(formData.originalPrice) || Number(formData.price),
        discount: Number(formData.discountPercent) || 0,
        price: Number(formData.price),
        stock_quantity: Number(formData.stockQuantity) || 0,
        quantity: Number(formData.stockQuantity) || 0,
        instock: Number(formData.stockQuantity) > 0,
        active: formData.active,
        is_active: formData.active,
        promoted: formData.promoted,
        sizes: formData.sizes,
        colors: formData.colors,
        specifications: formData.specifications,
        care_instructions: formData.careInstructions,
        images: formData.images,
        image: formData.images[0] || ''
      };

      const res = await apiClient(`/api/products/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      const updatedProduct = res?.data || res;
      onProductUpdated(updatedProduct || { ...product, ...payload });
      onClose();
    } catch (err) {
      console.error('Failed to update product:', err);
      if (err.status === 401 || err.status === 403) {
        clearAuthSession();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('urvaah:auth:unauthorized', { detail: { status: err.status } }));
        }
        return;
      }

      if (err.status === 400 || (err.status >= 400 && err.status < 500)) {
        setSubmitError(err.message || err.data?.message || 'Invalid product data provided. Please check all fields.');
      } else {
        setSubmitError(err.message || 'Failed to save product updates. Please try again.');
      }
    } finally {
      setUpdating(false);
    }
  };

  // Delete Handler with Confirmation
  const handleDeleteConfirm = async () => {
    if (deleting || updating) return;

    setDeleting(true);
    setSubmitError(null);

    try {
      const res = await apiClient(`/api/products/${product.id}`, {
        method: 'DELETE'
      });

      onProductDeleted(product.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete product:', err);
      if (err.status === 401 || err.status === 403) {
        clearAuthSession();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('urvaah:auth:unauthorized', { detail: { status: err.status } }));
        }
        return;
      }

      if (err.status === 400 || (err.status >= 400 && err.status < 500)) {
        setSubmitError(err.message || err.data?.message || 'This product cannot be deleted due to existing orders or constraints.');
      } else {
        setSubmitError(err.message || 'Could not delete product. Server error.');
      }
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-neutral-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/80 sticky top-0 z-20">
          <div>
            <h2 className="text-lg font-bold font-serif text-brand-dark">Edit Product</h2>
            <p className="text-xs text-neutral-500 font-sans">
              ID: #{product.id} {formData.name ? `• ${formData.name}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-brand-dark hover:bg-neutral-200/60 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {fetchingDetail ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-brand-dark mx-auto" />
              <p className="text-xs text-neutral-500 font-medium">Loading product details...</p>
            </div>
          ) : (
            <form id="edit-product-form" onSubmit={handleSubmit} className="space-y-6">
              
              {/* Submit / General Error Banner */}
              {submitError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span className="flex-1 font-medium">{submitError}</span>
                </div>
              )}

              {/* Delete Confirmation Warning Box */}
              {showDeleteConfirm && (
                <div className="p-4 bg-rose-50/90 border border-rose-300 rounded-xl space-y-3 text-rose-900 animate-in fade-in shadow-xs">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <h4 className="text-xs font-bold font-serif uppercase tracking-wider text-rose-900">
                      Confirm Product Deletion
                    </h4>
                  </div>
                  <p className="text-xs text-rose-800 leading-relaxed font-sans">
                    Are you sure you want to permanently delete <strong className="font-semibold text-rose-950">"{formData.name || product.name}"</strong> (ID: #{product.id})? This action cannot be undone.
                  </p>
                  <div className="flex items-center gap-2.5 pt-1 border-t border-rose-200/80">
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={handleDeleteConfirm}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <span>Yes, Delete Product</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* 1. Product Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={nameRef}
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, name: e.target.value }));
                    validateField('name', e.target.value);
                  }}
                  onBlur={() => handleBlur('name')}
                  placeholder="e.g. Silk Zari Embroidered Anarkali"
                  className={`w-full px-3.5 py-2.5 bg-neutral-50 border rounded-xl text-xs font-sans text-brand-dark focus:outline-none focus:bg-white focus:ring-1 transition-all ${
                    errors.name ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30' : 'border-neutral-200 focus:ring-brand-dark'
                  }`}
                />
                {errors.name && <p className="text-[11px] text-rose-600 font-medium">{errors.name}</p>}
              </div>

              {/* 2. Category & Subcategory Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    ref={categoryRef}
                    value={formData.category_id}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, category_id: e.target.value }));
                      validateField('category_id', e.target.value);
                    }}
                    onBlur={() => handleBlur('category_id')}
                    className={`w-full px-3.5 py-2.5 bg-neutral-50 border rounded-xl text-xs font-sans text-brand-dark focus:outline-none focus:bg-white focus:ring-1 transition-all ${
                      errors.category_id ? 'border-rose-400 focus:ring-rose-400' : 'border-neutral-200 focus:ring-brand-dark'
                    }`}
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.category_id || cat.id} value={cat.category_id || cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.category_id && <p className="text-[11px] text-rose-600 font-medium">{errors.category_id}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    Subcategory (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.subCategory}
                    onChange={(e) => setFormData(prev => ({ ...prev, subCategory: e.target.value }))}
                    placeholder="e.g. Festive Lehengas, Dupattas"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-sans text-brand-dark focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-dark transition-all"
                  />
                </div>
              </div>

              {/* 3. Short Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Short Description
                </label>
                <input
                  type="text"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                  placeholder="Single-line summary for product card hover/subtitles"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-sans text-brand-dark focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-dark transition-all"
                />
              </div>

              {/* 4. Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Full Description
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed product story, craft details, silhouette, and design features..."
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-sans text-brand-dark focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-dark transition-all resize-y"
                />
              </div>

              {/* 5. Pricing & Stock Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-50/60 p-4 rounded-xl border border-neutral-200/80">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-neutral-600 uppercase tracking-wider">
                    Original Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.originalPrice}
                    onChange={handleOriginalPriceChange}
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-sans font-medium text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-neutral-600 uppercase tracking-wider">
                    Discount %
                  </label>
                  <input
                    ref={discountRef}
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discountPercent}
                    onChange={handleDiscountChange}
                    className={`w-full px-3 py-2 bg-white border rounded-lg text-xs font-sans font-medium text-brand-dark focus:outline-none focus:ring-1 ${
                      errors.discountPercent ? 'border-rose-400 focus:ring-rose-400 bg-rose-50' : 'border-neutral-200 focus:ring-brand-dark'
                    }`}
                  />
                  {errors.discountPercent && <p className="text-[10px] text-rose-600">{errors.discountPercent}</p>}
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-neutral-600 uppercase tracking-wider">
                    Price (Current ₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    ref={priceRef}
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handlePriceChange}
                    onBlur={() => handleBlur('price')}
                    className={`w-full px-3 py-2 bg-white border rounded-lg text-xs font-sans font-semibold text-brand-dark focus:outline-none focus:ring-1 ${
                      errors.price ? 'border-rose-400 focus:ring-rose-400 bg-rose-50' : 'border-neutral-200 focus:ring-brand-dark'
                    }`}
                  />
                  {errors.price && <p className="text-[10px] text-rose-600">{errors.price}</p>}
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-neutral-600 uppercase tracking-wider">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-sans font-medium text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                  />
                </div>
              </div>

              {/* 6. Status Checkboxes Row */}
              <div className="flex flex-wrap items-center gap-6 p-4 bg-neutral-50/60 rounded-xl border border-neutral-200/80">
                {/* Active Toggle Checkbox */}
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                    className="w-4 h-4 rounded text-brand-dark focus:ring-brand-dark border-neutral-300"
                  />
                  <span className="text-xs font-medium text-brand-dark">Active (Visible on storefront)</span>
                </label>

                {/* Read-only Auto In-Stock Checkbox */}
                <label className="inline-flex items-center gap-2 cursor-not-allowed opacity-80" title="Auto-updated based on Stock Quantity">
                  <input
                    type="checkbox"
                    checked={Number(formData.stockQuantity) > 0}
                    disabled
                    className="w-4 h-4 rounded text-emerald-600 border-neutral-300 cursor-not-allowed"
                  />
                  <span className="text-xs font-medium text-neutral-600">
                    In Stock <span className="text-[10px] text-neutral-400 font-normal">(Auto-updated)</span>
                  </span>
                </label>

                {/* Promoted Checkbox */}
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.promoted}
                    onChange={(e) => setFormData(prev => ({ ...prev, promoted: e.target.checked }))}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-neutral-300"
                  />
                  <span className="text-xs font-medium text-brand-dark">Promoted / Featured</span>
                </label>
              </div>

              {/* 7. Available Sizes (Tag/Chip Input) */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Sizes Available
                </label>
                <div className="flex flex-wrap items-center gap-2 p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl min-h-[44px]">
                  {formData.sizes.map((sz) => (
                    <span
                      key={sz}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-neutral-200 text-brand-dark text-xs font-semibold rounded-md shadow-2xs"
                    >
                      {sz}
                      <button
                        type="button"
                        onClick={() => handleRemoveSize(sz)}
                        className="text-neutral-400 hover:text-rose-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={sizeInput}
                    onChange={(e) => setSizeInput(e.target.value)}
                    onKeyDown={handleAddSize}
                    placeholder="Type size (e.g. XL) & press Enter..."
                    className="flex-1 min-w-[140px] bg-transparent text-xs text-brand-dark focus:outline-none placeholder-neutral-400"
                  />
                </div>
              </div>

              {/* 8. Available Colors (Tag/Chip Input) */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Colors Available
                </label>
                <div className="flex flex-wrap items-center gap-2 p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl min-h-[44px]">
                  {formData.colors.map((col) => (
                    <span
                      key={col}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-neutral-200 text-brand-dark text-xs font-semibold rounded-md shadow-2xs"
                    >
                      {col}
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(col)}
                        className="text-neutral-400 hover:text-rose-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    onKeyDown={handleAddColor}
                    placeholder="Type color (e.g. Emerald Green) & press Enter..."
                    className="flex-1 min-w-[160px] bg-transparent text-xs text-brand-dark focus:outline-none placeholder-neutral-400"
                  />
                </div>
              </div>

              {/* 9. Specifications (Repeatable Key-Value List) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    Specifications (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSpecification}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-dark hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </button>
                </div>
                {formData.specifications.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic">No specifications added yet. Click "+ Add Row" for key details like Fabric, Fit, or Length.</p>
                ) : (
                  <div className="space-y-2">
                    {formData.specifications.map((spec, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={spec.label}
                          onChange={(e) => handleSpecChange(idx, 'label', e.target.value)}
                          placeholder="Label (e.g. Fabric)"
                          className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-sans text-brand-dark focus:outline-none focus:bg-white"
                        />
                        <input
                          type="text"
                          value={spec.value}
                          onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                          placeholder="Value (e.g. 100% Chanderi Silk)"
                          className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-sans text-brand-dark focus:outline-none focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecification(idx)}
                          className="p-2 text-neutral-400 hover:text-rose-600 transition-colors"
                          title="Remove specification"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 10. Care Instructions */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Care Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formData.careInstructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, careInstructions: e.target.value }))}
                  placeholder="e.g. Dry clean only. Iron on low heat on reverse side."
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-sans text-brand-dark focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-dark transition-all"
                />
              </div>

              {/* 11. Product Images */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Product Images
                    </label>
                    <p className="text-[11px] text-neutral-400">
                      Upload up to 5 images. The first image will be the main cover photo.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-neutral-500 font-medium">
                    {formData.images.length} / 5 selected
                  </span>
                </div>

                {/* Images Thumbnail Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {formData.images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="relative group aspect-3/4 bg-neutral-100 rounded-xl overflow-hidden border border-neutral-200 shadow-2xs"
                    >
                      <img
                        src={imgUrl}
                        alt={`Product preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 bg-brand-dark/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase">
                          Main
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* Add Image Tile */}
                  {formData.images.length < 5 && (
                    <label className="aspect-3/4 border-2 border-dashed border-neutral-300 hover:border-brand-dark rounded-xl flex flex-col items-center justify-center cursor-pointer bg-neutral-50 hover:bg-neutral-100/60 transition-all p-2 text-center">
                      {uploadingImage ? (
                        <Loader2 className="w-5 h-5 animate-spin text-brand-dark" />
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-neutral-400 mb-1" />
                          <span className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wide">
                            + Add Image
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Option to paste Image URL directly if local uploading is unavailable */}
                <div className="pt-1">
                  {!showUrlInput ? (
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(true)}
                      className="text-[11px] font-semibold text-neutral-500 hover:text-brand-dark underline"
                    >
                      + Or add image via direct URL
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        placeholder="https://example.com/product-image.jpg"
                        className="flex-1 px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="px-3 py-1.5 bg-brand-dark text-white text-xs font-semibold rounded-lg"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowUrlInput(false)}
                        className="text-xs text-neutral-400 hover:text-neutral-600"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Modal Sticky Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 bg-white sticky bottom-0 z-20 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={updating || deleting}
            className="px-4 py-2 bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={updating || deleting || showDeleteConfirm}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-600 text-white hover:bg-rose-700 rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Product</span>
          </button>
          <button
            type="submit"
            form="edit-product-form"
            disabled={updating || deleting || fetchingDetail}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-brand-dark text-white hover:bg-black rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 min-w-[130px]"
          >
            {updating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Update Details</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default EditProductModal;
