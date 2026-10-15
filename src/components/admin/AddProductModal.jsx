import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Upload,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import {
  normalizeSize,
  isValidSize,
  filterValidSizes,
  STANDARD_QUICK_SIZES
} from '../../utils/sizeValidator';
import {
  validateColorInput,
  normalizeColor,
  getSwatchCss,
  filterValidColors,
  POPULAR_FASHION_COLORS
} from '../../utils/colorValidator';
import RichDescriptionEditor from './RichDescriptionEditor';


const DEFAULT_ADDITIONAL_INFO_TEMPLATE = [
  { label: 'Fabric', value: 'Embroidered fabric with sequin detailing' },
  { label: 'Skirt hem', value: 'Hand-finished potli trim' },
  { label: 'Closure', value: 'Adjustable tie-back (top), side zip on left of skirt' },
  { label: 'Lining', value: 'Fully lined (top and skirt)' },
  { label: 'Top', value: 'Lightly Padded' }
];

export const AddProductModal = ({ isOpen, onClose, onProductCreated }) => {
  useModalScrollLock(isOpen, onClose);

  const imagesRef = useRef(null);

  // Form State initialized empty/default
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    subCategory: '',
    shortDescription: '',
    description: '',
    fullDescription: '',
    nameOptions: [''],
    productDetails: [{ label: '', value: '' }],
    originalPrice: '',
    discountPercent: '',
    price: '',
    stockQuantity: 0,
    sizeStock: {},
    active: true,
    promoted: false,
    is_recommended: true,
    sizes: [],
    colors: [],
    specifications: DEFAULT_ADDITIONAL_INFO_TEMPLATE.map(row => ({ ...row })),
    careInstructions: '',
    images: []
  });

const DEFAULT_CATEGORIES = [
  { id: 1, category_id: 1, name: 'CORSET TOPS' },
  { id: 2, category_id: 2, name: 'CO-ORD SETS' },
  { id: 3, category_id: 3, name: 'KURTI' },
  { id: 4, category_id: 4, name: 'PARTY WEAR' }
];

  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  const [errors, setErrors] = useState({});
  const [creating, setCreating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Size, Color & Image URL input buffers
  const [sizeInput, setSizeInput] = useState('');
  const [sizeError, setSizeError] = useState(null);
  const [colorInput, setColorInput] = useState('');
  const [colorError, setColorError] = useState(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Fetch categories on open
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await apiClient('/api/categories');
        const list = Array.isArray(res) ? res : (res?.data || []);

        setCategories(list.length > 0 ? list : DEFAULT_CATEGORIES);

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
    } else if (field === 'images') {
      const list = Array.isArray(value) ? value.filter(img => typeof img === 'string' && img.trim().length > 0) : [];
      if (list.length === 0) {
        err = 'At least 1 product image is required to create a product';
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
    if (e && e.type === 'keydown' && e.key !== 'Enter' && e.key !== ',') return;
    if (e) e.preventDefault();

    const raw = sizeInput.trim();
    if (!raw) return;

    const normalized = normalizeSize(raw);
    if (!isValidSize(normalized)) {
      setSizeError(`"${raw}" is not a recognized size. Please use standard apparel sizes (e.g. XS, S, M, L, XL, XXL, FREE SIZE or 26, 28, 30).`);
      return;
    }

    if (formData.sizes.includes(normalized)) {
      setSizeError(`Size "${normalized}" is already added.`);
      return;
    }

    setFormData(prev => {
      const nextSizes = [...prev.sizes, normalized];
      const nextSizeStock = { ...(prev.sizeStock || {}), [normalized]: 0 };
      const newTotal = Object.values(nextSizeStock).reduce((acc, v) => acc + (Math.max(0, parseInt(v, 10)) || 0), 0);
      return {
        ...prev,
        sizes: nextSizes,
        sizeStock: nextSizeStock,
        stockQuantity: newTotal > 0 ? newTotal : prev.stockQuantity
      };
    });
    setSizeInput('');
    setSizeError(null);
  };

  const handleTogglePresetSize = (sz) => {
    setSizeError(null);
    if (formData.sizes.includes(sz)) {
      handleRemoveSize(sz);
    } else {
      setFormData(prev => {
        const nextSizes = [...prev.sizes, sz];
        const nextSizeStock = { ...(prev.sizeStock || {}), [sz]: 0 };
        const newTotal = Object.values(nextSizeStock).reduce((acc, v) => acc + (Math.max(0, parseInt(v, 10)) || 0), 0);
        return {
          ...prev,
          sizes: nextSizes,
          sizeStock: nextSizeStock,
          stockQuantity: newTotal > 0 ? newTotal : prev.stockQuantity
        };
      });
    }
  };

  const handleRemoveSize = (sizeToRemove) => {
    setFormData(prev => {
      const nextSizes = prev.sizes.filter(s => s !== sizeToRemove);
      const nextSizeStock = { ...(prev.sizeStock || {}) };
      delete nextSizeStock[sizeToRemove];
      const newTotal = Object.values(nextSizeStock).reduce((acc, v) => acc + (Math.max(0, parseInt(v, 10)) || 0), 0);
      return {
        ...prev,
        sizes: nextSizes,
        sizeStock: nextSizeStock,
        stockQuantity: newTotal
      };
    });
    setSizeError(null);
  };

  // Color tag & preset handlers
  const handleTogglePresetColor = (colorName) => {
    const isSelected = formData.colors.some(
      c => c.toLowerCase() === colorName.toLowerCase()
    );
    if (isSelected) {
      setFormData(prev => ({
        ...prev,
        colors: prev.colors.filter(c => c.toLowerCase() !== colorName.toLowerCase())
      }));
    } else {
      const result = validateColorInput(colorName, formData.colors);
      if (result.valid) {
        setFormData(prev => ({
          ...prev,
          colors: [...prev.colors, result.normalized]
        }));
      }
    }
    setColorError(null);
  };

  const handleAddColor = (e) => {
    if (e && e.type === 'keydown' && e.key !== 'Enter' && e.key !== ',') return;
    if (e) e.preventDefault();
    const raw = colorInput.trim();
    if (!raw) return;

    const result = validateColorInput(raw, formData.colors);
    if (!result.valid) {
      setColorError(result.error);
      return;
    }

    setFormData(prev => ({ ...prev, colors: [...prev.colors, result.normalized] }));
    setColorInput('');
    setColorError(null);
  };

  const handleRemoveColor = (colorToRemove) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter(c => c !== colorToRemove)
    }));
    setColorError(null);
  };

  // Name Options Handlers
  const handleAddNameOption = () => {
    setFormData(prev => ({ ...prev, nameOptions: [...prev.nameOptions, ''] }));
  };

  const handleNameOptionChange = (index, value) => {
    setFormData(prev => {
      const updated = [...prev.nameOptions];
      updated[index] = value;
      return { ...prev, nameOptions: updated };
    });
  };

  const handleRemoveNameOption = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      nameOptions: prev.nameOptions.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  // Product Details Handlers
  const handleAddProductDetail = () => {
    setFormData(prev => ({
      ...prev,
      productDetails: [...prev.productDetails, { label: '', value: '' }]
    }));
  };

  const handleProductDetailChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.productDetails];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, productDetails: updated };
    });
  };

  const handleRemoveProductDetail = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      productDetails: prev.productDetails.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  // Specification / Additional Information Key-Value Pair Handlers
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

  const handleLoadAdditionalInfoTemplate = () => {
    setFormData(prev => ({
      ...prev,
      specifications: DEFAULT_ADDITIONAL_INFO_TEMPLATE.map(row => ({ ...row }))
    }));
  };

  const handleClearAdditionalInfo = () => {
    setFormData(prev => ({
      ...prev,
      specifications: []
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
      uploadData.append('image', file);
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
        setErrors(prev => ({ ...prev, images: '' }));
        setSubmitError(null);
      } else {
        throw new Error('No image URL returned from server.');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setSubmitError(err.message || 'Image upload failed. Please try again or provide a direct URL.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    if (url.startsWith('blob:') || url.startsWith('data:')) {
      setSubmitError('Blob or Data URLs cannot be saved. Please enter a valid HTTP/HTTPS image URL.');
      return;
    }
    if (!/^https?:\/\/.+/i.test(url)) {
      setSubmitError('Please enter a valid HTTP/HTTPS image URL.');
      return;
    }
    if (formData.images.length >= 5) {
      setSubmitError('Maximum 5 images allowed per product.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, url]
    }));
    setImageUrlInput('');
    setShowUrlInput(false);
    setSubmitError(null);
    setErrors(prev => ({ ...prev, images: '' }));
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData(prev => {
      const nextImages = prev.images.filter((_, idx) => idx !== indexToRemove);
      if (nextImages.length === 0) {
        setErrors(errs => ({ ...errs, images: 'At least 1 product image is required to create a product' }));
      }
      return {
        ...prev,
        images: nextImages
      };
    });
  };

  // Submit / Create Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    const isNameValid = validateField('name', formData.name);
    const isCategoryValid = validateField('category_id', formData.category_id);
    const isPriceValid = validateField('price', formData.price);
    const isImagesValid = validateField('images', formData.images);

    if (!isNameValid || !isCategoryValid || !isPriceValid || !isImagesValid) {
      if (!isImagesValid && isNameValid && isCategoryValid && isPriceValid) {
        setSubmitError('At least 1 product image is required to create a product.');
        imagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setSubmitError('Please fill in all required fields and upload at least 1 product image.');
      }
      return;
    }

    const hasBlob = formData.images.some(img => typeof img === 'string' && img.startsWith('blob:'));
    if (hasBlob) {
      setSubmitError('Temporary browser blob URLs cannot be saved. Please re-upload your images.');
      return;
    }

    // If user has a pending color in the input field, validate and commit it
    let currentColors = [...formData.colors];
    if (colorInput.trim()) {
      const check = validateColorInput(colorInput.trim(), currentColors);
      if (!check.valid) {
        setColorError(check.error);
        setSubmitError(`Invalid color: ${check.error}`);
        return;
      }
      currentColors.push(check.normalized);
      setFormData(prev => ({ ...prev, colors: currentColors }));
      setColorInput('');
      setColorError(null);
    }

    setCreating(true);
    setSubmitError(null);

    try {
      // Filter out empty specifications, name options, and product details
      const validSpecs = formData.specifications.filter(s => s.label.trim() || s.value.trim());
      const validNameOptions = formData.nameOptions.map(n => n.trim()).filter(Boolean);
      const validProductDetails = formData.productDetails.filter(d => d.label.trim() || d.value.trim());

      const payload = {
        title: formData.name.trim(),
        productname: formData.name.trim(),
        category_id: formData.category_id,
        subcategory_name: formData.subCategory,
        shortDescription: formData.shortDescription.trim(),
        short_description: formData.shortDescription.trim(),
        description: formData.description.trim(),
        fullDescription: formData.fullDescription.trim(),
        full_description: formData.fullDescription.trim(),
        nameOptions: validNameOptions,
        name_options: validNameOptions,
        productDetails: validSpecs.length > 0 ? validSpecs : validProductDetails,
        product_details: validSpecs.length > 0 ? validSpecs : validProductDetails,
        originalPrice: Number(formData.originalPrice) || Number(formData.price),
        originalprice: Number(formData.originalPrice) || Number(formData.price),
        discountPercent: Number(formData.discountPercent) || 0,
        discount: Number(formData.discountPercent) || 0,
        price: Number(formData.price),
        stockQuantity: Number(formData.stockQuantity) || 0,
        stock_quantity: Number(formData.stockQuantity) || 0,
        quantity: Number(formData.stockQuantity) || 0,
        sizeStock: formData.sizeStock || {},
        size_stock: formData.sizeStock || {},
        instock: Number(formData.stockQuantity) > 0,
        active: formData.active,
        is_active: formData.active,
        promoted: formData.promoted,
        is_recommended: formData.is_recommended,
        isRecommended: formData.is_recommended,
        sizes: filterValidSizes(formData.sizes).length > 0 ? filterValidSizes(formData.sizes) : ['XS', 'S', 'M', 'L'],
        colors: filterValidColors(currentColors).length > 0 ? filterValidColors(currentColors) : ['Default'],
        specifications: validSpecs,
        additionalInfo: validSpecs,
        additional_info: validSpecs,
        careInstructions: formData.careInstructions,
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 font-admin overscroll-contain"
      onClick={(e) => {
        if (e.target === e.currentTarget && !creating) {
          onClose();
        }
      }}
      onWheel={(e) => {
        if (e.target === e.currentTarget) {
          e.stopPropagation();
        }
      }}
    >
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[88vh] border border-neutral-200 overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/90 shrink-0">

          <div>
            <h2 className="text-lg font-bold font-admin text-brand-dark">Add Product</h2>
            <p className="text-xs text-neutral-500 font-admin">
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

            {/* 4. Description (Website Copy) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                Description (Website Copy)
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Everyday-easy piece that works two ways..."
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-sans text-brand-dark focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-dark transition-all resize-y"
              />
            </div>

            {/* 4.1 Full Description with Rich Formatting Toolbar */}
            <div className="space-y-1.5">
              <RichDescriptionEditor
                value={formData.fullDescription}
                onChange={(val) => setFormData(prev => ({ ...prev, fullDescription: val }))}
                placeholder="Comprehensive product story, artisan detailing, styling ideas, and garment drape overview..."
                title="OVERVIEW DESCRIPTION & DETAILS"
                badgeText="STANDARD SECTION"
                rows={6}
              />
            </div>


            {/* 4.5 PRODUCT CONTENT SECTION */}
            <div className="space-y-4 pt-3 pb-1 border-t border-b border-neutral-200/60 my-2">
              <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Product Content</h3>

              {/* Name Options (Dynamic List) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider">
                    Name Options (Alternative Customer Names)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddNameOption}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-dark hover:text-black no-underline hover:no-underline transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Add Name Option
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.nameOptions.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic">No name options added.</p>
                  ) : (
                    formData.nameOptions.map((nameOpt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={nameOpt}
                          onChange={(e) => handleNameOptionChange(idx, e.target.value)}
                          placeholder="e.g. Ivory Heart Kurti Dress"
                          className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-sans text-brand-dark focus:outline-none focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveNameOption(idx)}
                          className="p-2 text-neutral-400 hover:text-rose-600 transition-colors"
                          title="Remove name option"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Product Details (Dynamic Key/Value List) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider">
                    Product Details (Bullet Points)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddProductDetail}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-dark hover:text-black no-underline hover:no-underline transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Add Detail
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.productDetails.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic">No product details added.</p>
                  ) : (
                    formData.productDetails.map((detail, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={detail.label}
                          onChange={(e) => handleProductDetailChange(idx, 'label', e.target.value)}
                          placeholder="Label (e.g. Fabric)"
                          className="w-1/3 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-sans text-brand-dark focus:outline-none focus:bg-white"
                        />
                        <input
                          type="text"
                          value={detail.value}
                          onChange={(e) => handleProductDetailChange(idx, 'value', e.target.value)}
                          placeholder="Value (e.g. Cora cotton - breathable)"
                          className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-sans text-brand-dark focus:outline-none focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveProductDetail(idx)}
                          className="p-2 text-neutral-400 hover:text-rose-600 transition-colors"
                          title="Remove detail"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
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

              {/* Recommended for You Checkbox */}
              <label className="inline-flex items-center gap-2 cursor-pointer" title="Show this product in the Recommended for You section on the storefront.">
                <input
                  type="checkbox"
                  checked={formData.is_recommended}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_recommended: e.target.checked }))}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-neutral-300"
                />
                <span className="text-xs font-medium text-brand-dark">Recommended for You</span>
              </label>
            </div>

            {/* 7. Available Sizes (Tag/Chip Input with Presets & Strict Validation) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Sizes Available
                </label>
                <span className="text-[11px] text-neutral-400">
                  Quick-pick presets or enter custom size
                </span>
              </div>

              {/* Quick Add Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pb-0.5">
                <span className="text-[10px] uppercase font-semibold text-neutral-400 mr-0.5">Presets:</span>
                {STANDARD_QUICK_SIZES.map((sz) => {
                  const isSelected = formData.sizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => handleTogglePresetSize(sz)}
                      className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-all border ${
                        isSelected
                          ? 'bg-brand-dark text-white border-brand-dark shadow-2xs'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400 hover:text-black'
                      }`}
                    >
                      {isSelected ? `✓ ${sz}` : `+ ${sz}`}
                    </button>
                  );
                })}
              </div>

              <div className={`flex flex-wrap items-center gap-2 p-2.5 bg-neutral-50 border rounded-xl min-h-[44px] transition-colors ${
                sizeError ? 'border-rose-400 ring-1 ring-rose-400/20' : 'border-neutral-200 focus-within:border-neutral-400'
              }`}>
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
                <div className="flex-1 flex items-center min-w-[170px] gap-1.5">
                  <input
                    type="text"
                    value={sizeInput}
                    onChange={(e) => {
                      setSizeInput(e.target.value);
                      if (sizeError) setSizeError(null);
                    }}
                    onKeyDown={handleAddSize}
                    placeholder="Type size (e.g. XL or 28) & press Enter..."
                    className="flex-1 bg-transparent text-xs text-brand-dark focus:outline-none placeholder-neutral-400"
                  />
                  {sizeInput.trim() && (
                    <button
                      type="button"
                      onClick={handleAddSize}
                      className="shrink-0 px-2.5 py-1 text-xs font-semibold bg-brand-dark text-white rounded-md hover:bg-black transition-colors"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>

              {sizeError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{sizeError}</span>
                </div>
              )}

              {/* 7b. Size-Wise Inventory & Stock Management */}
              {formData.sizes.length > 0 && (
                <div className="mt-3 p-4 bg-white rounded-xl border border-neutral-200 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-neutral-700" />
                        <h5 className="text-xs font-bold text-neutral-800 uppercase tracking-wider font-admin">
                          Size-Wise Inventory & Stock
                        </h5>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Set available stock per size. Sizes with 0 units will automatically show as <span className="font-semibold text-rose-600">Out of Stock</span> on the storefront.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 rounded-lg text-xs font-bold text-neutral-800 self-start sm:self-auto">
                      <span className="text-[10px] text-neutral-500 uppercase font-semibold">Total:</span>
                      <span>{formData.stockQuantity} units</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {formData.sizes.map((sz) => {
                      const qty = formData.sizeStock?.[sz] !== undefined ? formData.sizeStock[sz] : 0;
                      const isOutOfStock = qty <= 0;

                      return (
                        <div
                          key={sz}
                          className={`p-2.5 rounded-lg border transition-all ${
                            isOutOfStock
                              ? 'bg-rose-50/50 border-rose-200'
                              : 'bg-neutral-50/70 border-neutral-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-neutral-900">Size {sz}</span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isOutOfStock
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isOutOfStock ? '0 (Out)' : `${qty} in stock`}
                            </span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            value={qty}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              const nextSizeStock = { ...(formData.sizeStock || {}), [sz]: val };
                              const newTotal = Object.values(nextSizeStock).reduce(
                                (acc, v) => acc + (Math.max(0, parseInt(v, 10)) || 0),
                                0
                              );
                              setFormData((prev) => ({
                                ...prev,
                                sizeStock: nextSizeStock,
                                stockQuantity: newTotal
                              }));
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded text-xs font-bold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black"
                            placeholder="Units"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 8. Available Colors (Tag/Chip Input) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Colors Available
                </label>
                <span className="text-[11px] text-neutral-400">
                  HEX (e.g. #8B0000) or apparel color name
                </span>
              </div>

              {/* Quick Add Color Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pb-0.5">
                <span className="text-[10px] uppercase font-semibold text-neutral-400 mr-0.5">Presets:</span>
                {POPULAR_FASHION_COLORS.map(({ name, hex }) => {
                  const isSelected = formData.colors.some(
                    c => c.toLowerCase() === name.toLowerCase() || c.toLowerCase() === hex.toLowerCase()
                  );
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => handleTogglePresetColor(name)}
                      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md font-semibold transition-all border ${
                        isSelected
                          ? 'bg-brand-dark text-white border-brand-dark shadow-2xs'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400 hover:text-black'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                        style={{ background: hex }}
                      />
                      <span>{isSelected ? `✓ ${name}` : `+ ${name}`}</span>
                    </button>
                  );
                })}
              </div>

              <div
                className={`flex flex-wrap items-center gap-2 p-2.5 bg-neutral-50 border rounded-xl min-h-[44px] transition-colors ${
                  colorError
                    ? 'border-rose-400 ring-1 ring-rose-400/20'
                    : 'border-neutral-200 focus-within:border-neutral-400'
                }`}
              >
                {formData.colors.map((col) => (
                  <span
                    key={col}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-neutral-200 text-brand-dark text-xs font-semibold rounded-md shadow-2xs"
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/20 shrink-0 shadow-2xs"
                      style={{ background: getSwatchCss(col) }}
                      aria-hidden="true"
                    />
                    <span>{col}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(col)}
                      className="text-neutral-400 hover:text-rose-600 transition-colors ml-0.5"
                      title={`Remove ${col}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <div className="flex-1 flex items-center min-w-[200px] gap-1.5">
                  <input
                    type="text"
                    value={colorInput}
                    onChange={(e) => {
                      setColorInput(e.target.value);
                      if (colorError) setColorError(null);
                    }}
                    onKeyDown={handleAddColor}
                    placeholder="Type color (e.g. Emerald Green) & press Enter..."
                    className="flex-1 bg-transparent text-xs text-brand-dark focus:outline-none placeholder-neutral-400"
                  />
                  {colorInput.trim() && (
                    <button
                      type="button"
                      onClick={handleAddColor}
                      className="shrink-0 px-2.5 py-1 text-xs font-semibold bg-brand-dark text-white rounded-md hover:bg-black transition-colors"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>

              {colorError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium pt-0.5 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{colorError}</span>
                </div>
              )}
            </div>

            {/* 9. Additional Information (Storefront Accordion) */}
            <div className="space-y-3 pt-3 border-t border-neutral-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
                      Additional Information
                    </label>
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-neutral-900 text-white rounded">
                      Storefront Accordion
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Dynamically customize rows displayed under the "ADDITIONAL INFORMATION" accordion on the product page.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={handleLoadAdditionalInfoTemplate}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-600 hover:text-black bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1 rounded transition-colors cursor-pointer"
                    title="Load standard luxury apparel preset rows (Fabric, Skirt hem, Closure, Lining, Top)"
                  >
                    Load Preset
                  </button>
                  {formData.specifications.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAdditionalInfo}
                      className="text-[11px] font-semibold text-neutral-400 hover:text-rose-600 px-1 py-1 transition-colors cursor-pointer"
                      title="Clear all rows"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAddSpecification}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-brand-dark hover:bg-neutral-800 px-2.5 py-1 rounded transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Add Row
                  </button>
                </div>
              </div>

              {formData.specifications.length === 0 ? (
                <div className="p-4 bg-neutral-50 border border-dashed border-neutral-200 rounded-xl text-center">
                  <p className="text-xs text-neutral-500 mb-2">No additional information rows added.</p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleLoadAdditionalInfoTemplate}
                      className="text-xs font-bold text-brand-dark hover:underline cursor-pointer"
                    >
                      Load Standard Preset Rows
                    </button>
                    <span className="text-neutral-300">•</span>
                    <button
                      type="button"
                      onClick={handleAddSpecification}
                      className="text-xs font-bold text-brand-dark hover:underline cursor-pointer"
                    >
                      + Add Custom Row
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="hidden sm:grid grid-cols-12 gap-2 px-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    <div className="col-span-4">Attribute / Title</div>
                    <div className="col-span-7">Value / Specification Detail</div>
                    <div className="col-span-1 text-center">Action</div>
                  </div>
                  {formData.specifications.map((spec, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 bg-neutral-50/80 rounded-lg border border-neutral-200/70">
                      <input
                        type="text"
                        value={spec.label}
                        onChange={(e) => handleSpecChange(idx, 'label', e.target.value)}
                        placeholder="e.g. Fabric, Closure, Lining, Care"
                        className="w-full sm:w-1/3 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-sans font-medium text-brand-dark focus:outline-none focus:border-brand-dark"
                      />
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                        placeholder="e.g. Embroidered fabric with sequin detailing"
                        className="w-full sm:flex-1 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-sans text-brand-dark focus:outline-none focus:border-brand-dark"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecification(idx)}
                        className="self-end sm:self-center p-2 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Remove row"
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
            <div ref={imagesRef} className="space-y-3 scroll-mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    Product Images <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <p className="text-[11px] text-neutral-400">
                    At least 1 product image is required. Upload up to 5 images. The first image will be the main cover photo.
                  </p>
                </div>
                <span className={`text-xs font-mono font-medium ${formData.images.length === 0 ? 'text-rose-600 font-semibold' : 'text-neutral-500'}`}>
                  {formData.images.length} / 5 selected
                </span>
              </div>

              {errors.images && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium p-2.5 bg-rose-50 border border-rose-200 rounded-xl">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.images}</span>
                </div>
              )}

              {/* Images Thumbnail Grid */}
              <div className={`grid grid-cols-3 sm:grid-cols-5 gap-3 p-1 rounded-xl transition-colors ${
                errors.images ? 'border border-dashed border-rose-400 bg-rose-50/10' : ''
              }`}>
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
                    className="text-[11px] font-semibold text-neutral-500 hover:text-brand-dark no-underline hover:no-underline transition-colors cursor-pointer"
                    style={{ textDecoration: 'none' }}
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

        {/* Modal Sticky Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50/90 shrink-0 flex items-center justify-end gap-3 font-admin">
          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            className="px-5 py-2.5 h-10 border border-neutral-300 text-neutral-700 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-neutral-100 hover:text-neutral-950 transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-product-form"
            disabled={creating}
            className="px-6 py-2.5 h-10 bg-neutral-950 text-white hover:bg-black rounded-xl text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Create Product</span>
          </button>
        </div>


      </div>
    </div>
  );
};

export default AddProductModal;
