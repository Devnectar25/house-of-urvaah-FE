import React, { useState, useEffect } from 'react';
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
import { apiClient } from '../../lib/apiClient';

export const AddProductModal = ({ isOpen, onClose, onProductCreated }) => {
  if (!isOpen) return null;

  // Form State initialized empty/default
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    subCategory: '',
    shortDescription: '',
    description: '',
    originalPrice: '',
    discountPercent: '',
    price: '',
    stockQuantity: 0,
    active: true,
    promoted: false,
    sizes: [],
    colors: [],
    specifications: [{ label: '', value: '' }],
    careInstructions: '',
    images: []
  });

  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [creating, setCreating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Size, Color & Image URL input buffers
  const [sizeInput, setSizeInput] = useState('');
  const [colorInput, setColorInput] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Fetch categories on open
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await apiClient('/api/categories');
        const list = Array.isArray(res) ? res : (res?.data || []);
        setCategories(list);
      } catch (err) {
        console.error('Failed to load categories in Add modal:', err);
      }
    };
    fetchCats();
  }, []);

  // Validation handler
  const validateField = (field, value) => {
    let err = '';
    if (field === 'name') {
      if (!value || !value.trim()) err = 'Product Name is required';
    } else if (field === 'category_id') {
      if (!value) err = 'Category selection is required';
    } else if (field === 'price') {
      if (value === '' || value === null || isNaN(value) || Number(value) < 0) {
        err = 'Valid current price is required';
      }
    }
    setErrors(prev => ({ ...prev, [field]: err }));
    return !err;
  };

  const handleBlur = (field) => {
    validateField(field, formData[field]);
  };

  // Price & Discount auto-calculation logic
  const handleOriginalPriceChange = (e) => {
    const orig = parseFloat(e.target.value) || 0;
    const disc = parseFloat(formData.discountPercent) || 0;
    const calcPrice = disc > 0 ? Math.round(orig * (1 - disc / 100)) : orig;
    setFormData(prev => ({
      ...prev,
      originalPrice: e.target.value,
      price: calcPrice > 0 ? calcPrice : (prev.price || '')
    }));
    if (calcPrice > 0) validateField('price', calcPrice);
  };

  const handleDiscountChange = (e) => {
    const discVal = e.target.value;
    const disc = Math.min(100, Math.max(0, parseFloat(discVal) || 0));
    const orig = parseFloat(formData.originalPrice) || 0;
    const calcPrice = orig > 0 ? Math.round(orig * (1 - disc / 100)) : formData.price;
    setFormData(prev => ({
      ...prev,
      discountPercent: discVal,
      price: calcPrice > 0 ? calcPrice : prev.price
    }));
    if (calcPrice > 0) validateField('price', calcPrice);
  };

  const handlePriceChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, price: val }));
    validateField('price', val);
  };

  // Size tag handlers
  const handleAddSize = (e) => {
    if ((e.type === 'keydown' && e.key !== 'Enter' && e.key !== ',') || !sizeInput.trim()) return;
    e.preventDefault();
    const newSize = sizeInput.trim().toUpperCase();
    if (!formData.sizes.includes(newSize)) {
      setFormData(prev => ({ ...prev, sizes: [...prev.sizes, newSize] }));
    }
    setSizeInput('');
  };

  const handleRemoveSize = (sizeToRemove) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.filter(s => s !== sizeToRemove)
    }));
  };

  // Color tag handlers
  const handleAddColor = (e) => {
    if ((e.type === 'keydown' && e.key !== 'Enter' && e.key !== ',') || !colorInput.trim()) return;
    e.preventDefault();
    const newColor = colorInput.trim();
    if (!formData.colors.includes(newColor)) {
      setFormData(prev => ({ ...prev, colors: [...prev.colors, newColor] }));
    }
    setColorInput('');
  };

  const handleRemoveColor = (colorToRemove) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter(c => c !== colorToRemove)
    }));
  };

  // Specification Key-Value Pair Handlers
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
      specifications: prev.specifications.filter((_, i) => i !== index)
    }));
  };

  // Image Upload / Removal Handlers
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
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('folder', 'products');

      const API_BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
      const token = localStorage.getItem('urvaah_token');

      const res = await fetch(`${API_BASE}/api/upload/upload-image`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: uploadData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Image upload failed');
      }

      const uploadedUrl = data.url || data.data?.url || data.filePath;
      if (uploadedUrl) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, uploadedUrl]
        }));
      }
    } catch (err) {
      console.error('Upload failed:', err);
      // Fallback preview using Object URL
      const objectUrl = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, objectUrl]
      }));
    } finally {
      setUploadingImage(false);
      e.target.value = '';
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

  // Submit / Create Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    const isNameValid = validateField('name', formData.name);
    const isCategoryValid = validateField('category_id', formData.category_id);
    const isPriceValid = validateField('price', formData.price);

    if (!isNameValid || !isCategoryValid || !isPriceValid) {
      setSubmitError('Please fill in all required fields highlighted below.');
      return;
    }

    setCreating(true);
    setSubmitError(null);

    try {
      // Filter out empty specifications
      const validSpecs = formData.specifications.filter(s => s.label.trim() || s.value.trim());

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
        sizes: formData.sizes.length > 0 ? formData.sizes : ['XS', 'S', 'M', 'L'],
        colors: formData.colors.length > 0 ? formData.colors : ['Default'],
        specifications: validSpecs,
        care_instructions: formData.careInstructions,
        images: formData.images,
        image: formData.images[0] || ''
      };

      const res = await apiClient('/api/products', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res?.success || res?.data) {
        onProductCreated(res.data || payload);
        onClose();
      } else {
        throw new Error(res?.message || 'Failed to create product');
      }
    } catch (err) {
      console.error('Failed to create product:', err);
      setSubmitError(err.message || 'Failed to create new product. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-neutral-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/80 sticky top-0 z-20">
          <div>
            <h2 className="text-lg font-bold font-serif text-brand-dark">Add Product</h2>
            <p className="text-xs text-neutral-500 font-sans">
              Create a new luxury item in your House of Urvaah catalog.
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
          <form id="add-product-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Submit / General Error Banner */}
            {submitError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span className="flex-1 font-medium">{submitError}</span>
              </div>
            )}

            {/* 1. Product Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, name: e.target.value }));
                  validateField('name', e.target.value);
                }}
                onBlur={() => handleBlur('name')}
                placeholder="e.g. Silk Anarkali Kurta"
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
                  placeholder="Select or type subcategory (e.g. Dupattas)"
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
                placeholder="Brief summary"
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-sans text-brand-dark focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-dark transition-all"
              />
            </div>

            {/* 4. Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                Description
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description..."
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
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-sans font-medium text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-neutral-600 uppercase tracking-wider">
                  Discount %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discountPercent}
                  onChange={handleDiscountChange}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-sans font-medium text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-neutral-600 uppercase tracking-wider">
                  Price (Current ₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handlePriceChange}
                  onBlur={() => handleBlur('price')}
                  placeholder="0.00"
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
              {/* Active Checkbox */}
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
                  placeholder="Type size (e.g. S, M, L) & press Enter..."
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
                  placeholder="Type color (e.g. Royal Blue) & press Enter..."
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
                  <Plus className="w-4.5 h-4.5 stroke-[2.5]" /> Add Row
                </button>
              </div>
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
                      placeholder="Value (e.g. Cotton Silk)"
                      className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-sans text-brand-dark focus:outline-none focus:bg-white"
                    />
                    {formData.specifications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecification(idx)}
                        className="p-2 text-neutral-400 hover:text-rose-600 transition-colors"
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
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

              {/* Option to paste Image URL directly */}
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
        </div>

        {/* Modal Sticky Footer (Matching exact button styling and alignment) */}
        <div className="px-6 py-4 border-t border-neutral-200 bg-white sticky bottom-0 z-20 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            className="px-4 py-2 bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-product-form"
            disabled={creating}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-brand-dark text-white hover:bg-black rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Create Product
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddProductModal;
