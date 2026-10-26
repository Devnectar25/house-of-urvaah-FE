import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Upload,
  Loader2,
  AlertCircle,
  Star,
  Sparkles,
  Flame,
  ExternalLink,
  MessageSquare,
  Layers,
  Film,
  Play
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
import { fetchRecommendationStatus } from '../../constants/recommendations';
import { getLegacyDetailRows, productDetailsToRichText, richTextToProductDetails } from '../../utils/productDetailsContent';


const DEFAULT_CATEGORIES = [
  { id: 1, category_id: 1, name: 'CORSET TOPS' },
  { id: 2, category_id: 2, name: 'CO-ORD SETS' },
  { id: 3, category_id: 3, name: 'KURTI' },
  { id: 4, category_id: 4, name: 'PARTY WEAR' }
];

const DEFAULT_ADDITIONAL_INFO_TEMPLATE = [
  { label: 'Fabric', value: 'Embroidered fabric with sequin detailing' },
  { label: 'Skirt hem', value: 'Hand-finished potli trim' },
  { label: 'Closure', value: 'Adjustable tie-back (top), side zip on left of skirt' },
  { label: 'Lining', value: 'Fully lined (top and skirt)' },
  { label: 'Top', value: 'Lightly Padded' }
];

export const EditProductModal = ({ product, isOpen, onClose, onProductUpdated, onProductDeleted }) => {
  useModalScrollLock(Boolean(isOpen && product), onClose);

  // Refs for focusing first invalid field on submit validation
  const nameRef = useRef(null);
  const categoryRef = useRef(null);
  const priceRef = useRef(null);
  const discountRef = useRef(null);
  const imagesRef = useRef(null);

  // Form State initialized from product prop
  // Live status of the home page "Recommended for you" section (minimum product count)
  const [recommendationStatus, setRecommendationStatus] = useState(null);
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    fetchRecommendationStatus().then((st) => { if (active) setRecommendationStatus(st); }).catch(() => {});
    return () => { active = false; };
  }, [isOpen]);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    subCategory: '',
    shortDescription: '',
    description: '',
    fullDescription: '',
    nameOptions: [],
    productDetailsText: '',
    originalPrice: 0,
    discountPercent: 0,
    price: 0,
    stockQuantity: 0,
    sizeStock: {},
    active: true,
    promoted: false,
    is_recommended: false,
    rating: 0,
    reviews: 0,
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Default'],
    specifications: [],
    careInstructions: '',
    images: [],
    video_url: ''
  });

  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [errors, setErrors] = useState({});
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Delete confirmation step state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Size, Color, Image & Video input buffers
  const [sizeInput, setSizeInput] = useState('');
  const [sizeError, setSizeError] = useState(null);
  const [colorInput, setColorInput] = useState('');
  const [colorError, setColorError] = useState(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [showVideoUrlInput, setShowVideoUrlInput] = useState(false);

  // Fetch available categories
  useEffect(() => {
    let isMounted = true;
    const fetchCats = async () => {
      try {
        const res = await apiClient('/api/categories');
        const list = Array.isArray(res) ? res : (res?.data || []);
        if (isMounted) {
          setCategories(list.length > 0 ? list : DEFAULT_CATEGORIES);
        }
      } catch (err) {
        console.error('Failed to load categories in modal:', err);
      }
    };
    fetchCats();
    return () => {
      isMounted = false;
    };
  }, []);

  // Populate or fetch detailed product data when product ID changes or modal opens
  useEffect(() => {
    if (!isOpen || !product?.id) return;

    const loadFullProduct = async () => {
      setFetchingDetail(true);
      setSubmitError(null);
      setShowDeleteConfirm(false);
      setColorInput('');
      setColorError(null);
      try {
        const res = await apiClient(`/api/products/${product.id}`);
        const data = res?.data || res || product;

        // Map backend product data to modal state
        const origPrice = data.originalPrice ?? data.price ?? 0;
        const currPrice = data.price ?? 0;
        const calcDiscount = origPrice > 0 && origPrice > currPrice
          ? Math.round(((origPrice - currPrice) / origPrice) * 100)
          : (data.discount || 0);

        // Map specifications array or object
        let specPairs = [];
        if (Array.isArray(data.specifications) && data.specifications.length > 0) {
          specPairs = data.specifications.map(s => ({
            label: s.label || s.title || '',
            value: s.value || ''
          }));
        } else if (getLegacyDetailRows(data.productDetails || data.product_details).length > 0) {
          specPairs = getLegacyDetailRows(data.productDetails || data.product_details).map(s => ({
            label: s.label || s.title || '',
            value: s.value || ''
          }));
        } else if (data.specifications && typeof data.specifications === 'object' && !Array.isArray(data.specifications)) {
          specPairs = Object.entries(data.specifications).map(([label, value]) => ({ label, value: String(value || '') }));
        } else if (data.fabric || data.fitType) {
          if (data.fabric) specPairs.push({ label: 'Fabric', value: data.fabric });
          if (data.fitType) specPairs.push({ label: 'Fit Type', value: data.fitType });
        }

        let nameOpts = data.nameOptions || data.name_options || product?.nameOptions || product?.name_options || [];
        if (typeof nameOpts === 'string') {
          try { nameOpts = JSON.parse(nameOpts); } catch (e) { nameOpts = []; }
        }
        if (!Array.isArray(nameOpts)) nameOpts = [];

        let prodDetails = data.productDetails || data.product_details || product?.productDetails || product?.product_details || [];
        if (typeof prodDetails === 'string') {
          try { prodDetails = JSON.parse(prodDetails); } catch (e) { prodDetails = []; }
        }
        if (!Array.isArray(prodDetails)) prodDetails = [];

        const ratingVal = parseFloat(data.rating ?? product?.rating) || 0;
        const reviewsCount = parseInt(data.reviews ?? data.reviews_count ?? product?.reviews ?? product?.reviews_count) || 0;

        let sizeStock = data.sizeStock || data.size_stock || {};
        if (typeof sizeStock === 'string') {
          try { sizeStock = JSON.parse(sizeStock); } catch (e) { sizeStock = {}; }
        }
        if (!sizeStock || typeof sizeStock !== 'object') sizeStock = {};

        const validSizes = Array.isArray(data.sizes) && data.sizes.length > 0 ? (filterValidSizes(data.sizes).length > 0 ? filterValidSizes(data.sizes) : ['XS', 'S', 'M', 'L']) : ['XS', 'S', 'M', 'L'];
        const normalizedSizeStock = {};
        const totalStock = Number(data.stockQuantity ?? data.quantity ?? 0);
        validSizes.forEach(sz => {
          if (sizeStock[sz] !== undefined) {
            normalizedSizeStock[sz] = Math.max(0, parseInt(sizeStock[sz], 10) || 0);
          } else {
            const found = Object.keys(sizeStock).find(k => k.trim().toUpperCase() === sz.toUpperCase());
            if (found !== undefined) {
              normalizedSizeStock[sz] = Math.max(0, parseInt(sizeStock[found], 10) || 0);
            } else {
              normalizedSizeStock[sz] = totalStock > 0 ? Math.floor(totalStock / validSizes.length) : 0;
            }
          }
        });
        const computedTotalStock = Object.keys(normalizedSizeStock).length > 0
          ? Object.values(normalizedSizeStock).reduce((acc, v) => acc + v, 0)
          : totalStock;

        setFormData({
          name: data.name || data.title || '',
          category_id: data.categoryId || data.category_id || '',
          subCategory: data.subCategory || data.subcategory_name || '',
          shortDescription: data.shortDescription || data.shortdescription || '',
          description: data.fullDescription || data.full_description || data.fulldescription || data.description || '',
          fullDescription: data.fullDescription || data.full_description || data.fulldescription || data.description || '',
          nameOptions: nameOpts,
          productDetailsText: productDetailsToRichText(prodDetails, data.specifications),
          originalPrice: origPrice,
          discountPercent: calcDiscount,
          price: currPrice,
          stockQuantity: computedTotalStock,
          sizeStock: normalizedSizeStock,
          active: data.active !== false && data.is_active !== false,
          promoted: Boolean(data.promoted || data.is_featured),
          is_recommended: Boolean(data.is_recommended || data.isRecommended),
          rating: ratingVal,
          reviews: reviewsCount,
          sizes: validSizes,
          colors: Array.isArray(data.colors) && data.colors.length > 0 ? (filterValidColors(data.colors).length > 0 ? filterValidColors(data.colors) : data.colors) : ['Default'],
          specifications: specPairs,
          careInstructions: data.careInstructions || data.care_instructions || '',
          images: Array.isArray(data.images) && data.images.length > 0
            ? data.images
            : (data.image ? [data.image] : []),
          video_url: data.video_url || data.videoUrl || data.video || product?.video_url || product?.videoUrl || ''
        });
      } catch (err) {
        console.warn('Falling back to list row product data:', err);
        let nameOpts = product?.nameOptions || product?.name_options || [];
        if (typeof nameOpts === 'string') {
          try { nameOpts = JSON.parse(nameOpts); } catch (e) { nameOpts = []; }
        }
        if (!Array.isArray(nameOpts)) nameOpts = [];

        let prodDetails = product?.productDetails || product?.product_details || [];
        if (typeof prodDetails === 'string') {
          try { prodDetails = JSON.parse(prodDetails); } catch (e) { prodDetails = []; }
        }
        if (!Array.isArray(prodDetails)) prodDetails = [];

        const fallbackRating = parseFloat(product?.rating) || 0;
        const fallbackReviews = parseInt(product?.reviews ?? product?.reviews_count) || 0;

        let sizeStock = product?.sizeStock || product?.size_stock || {};
        if (typeof sizeStock === 'string') {
          try { sizeStock = JSON.parse(sizeStock); } catch (e) { sizeStock = {}; }
        }
        if (!sizeStock || typeof sizeStock !== 'object') sizeStock = {};

        const validSizes = Array.isArray(product.sizes) ? (filterValidSizes(product.sizes).length > 0 ? filterValidSizes(product.sizes) : ['XS', 'S', 'M', 'L']) : ['XS', 'S', 'M', 'L'];
        const normalizedSizeStock = {};
        const totalStock = Number(product.stockQuantity ?? product.quantity ?? 0);
        validSizes.forEach(sz => {
          if (sizeStock[sz] !== undefined) {
            normalizedSizeStock[sz] = Math.max(0, parseInt(sizeStock[sz], 10) || 0);
          } else {
            const found = Object.keys(sizeStock).find(k => k.trim().toUpperCase() === sz.toUpperCase());
            if (found !== undefined) {
              normalizedSizeStock[sz] = Math.max(0, parseInt(sizeStock[found], 10) || 0);
            } else {
              normalizedSizeStock[sz] = totalStock > 0 ? Math.floor(totalStock / validSizes.length) : 0;
            }
          }
        });
        const computedTotalStock = Object.keys(normalizedSizeStock).length > 0
          ? Object.values(normalizedSizeStock).reduce((acc, v) => acc + v, 0)
          : totalStock;

        setFormData({
          name: product.name || '',
          category_id: product.categoryId || product.category_id || '',
          subCategory: product.subCategory || '',
          shortDescription: product.shortDescription || '',
          description: product.fullDescription || product.full_description || product.fulldescription || product.description || '',
          fullDescription: product.fullDescription || product.full_description || product.fulldescription || product.description || '',
          nameOptions: nameOpts,
          productDetailsText: productDetailsToRichText(prodDetails, product?.specifications),
          originalPrice: product.originalPrice || product.price || 0,
          discountPercent: product.discount || 0,
          price: product.price || 0,
          stockQuantity: computedTotalStock,
          sizeStock: normalizedSizeStock,
          active: product.active !== false,
          promoted: Boolean(product.promoted),
          is_recommended: Boolean(product.is_recommended || product.isRecommended),
          rating: fallbackRating,
          reviews: fallbackReviews,
          sizes: validSizes,
          colors: Array.isArray(product.colors) ? (filterValidColors(product.colors).length > 0 ? filterValidColors(product.colors) : product.colors) : ['Default'],
          specifications: [],
          careInstructions: product.careInstructions || '',
          images: Array.isArray(product.images) ? product.images : (product.image ? [product.image] : []),
          video_url: product?.video_url || product?.videoUrl || product?.video || ''
        });
      } finally {
        setFetchingDetail(false);
      }
    };

    loadFullProduct();
  }, [isOpen, product]);

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
    } else if (field === 'discountPercent') {
      const num = Number(value);
      if (isNaN(num) || num < 0 || num > 100) {
        err = 'Discount % must be between 0 and 100';
      }
    } else if (field === 'images') {
      const list = Array.isArray(value) ? value.filter(img => typeof img === 'string' && img.trim().length > 0) : [];
      if (list.length === 0) {
        err = 'At least 1 product image is required';
      }
    }
    setErrors(prev => ({ ...prev, [field]: err }));
    return !err;
  };

  const handleBlur = (field) => {
    validateField(field, formData[field]);
  };

  // Name Options Handlers
  const handleAddNameOption = () => {
    setFormData(prev => ({ ...prev, nameOptions: [...(prev.nameOptions || []), ''] }));
  };

  const handleNameOptionChange = (index, value) => {
    setFormData(prev => {
      const updated = [...(prev.nameOptions || [])];
      updated[index] = value;
      return { ...prev, nameOptions: updated };
    });
  };

  const handleRemoveNameOption = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      nameOptions: (prev.nameOptions || []).filter((_, idx) => idx !== indexToRemove)
    }));
  };

  // Price & Discount auto-calculation logic
  const handleOriginalPriceChange = (e) => {
    const orig = parseFloat(e.target.value) || 0;
    const disc = formData.discountPercent || 0;
    const calcPrice = disc > 0 ? Math.round(orig * (1 - disc / 100)) : orig;
    setFormData(prev => ({
      ...prev,
      originalPrice: orig,
      price: calcPrice >= 0 ? calcPrice : 0
    }));
    validateField('price', calcPrice);
  };

  const handleDiscountChange = (e) => {
    const disc = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
    const orig = formData.originalPrice || 0;
    const calcPrice = orig > 0 ? Math.round(orig * (1 - disc / 100)) : formData.price;
    setFormData(prev => ({
      ...prev,
      discountPercent: disc,
      price: calcPrice >= 0 ? calcPrice : 0
    }));
    validateField('discountPercent', disc);
    validateField('price', calcPrice);
  };

  const handlePriceChange = (e) => {
    const val = parseFloat(e.target.value) || 0;
    setFormData(prev => ({ ...prev, price: val }));
    validateField('price', val);
  };

  // Size pill handlers
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

  // Color pill & preset handlers
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

  // Specification / Additional Information Key-Value Pair Handlers
  const handleAddSpecification = () => {
    setFormData(prev => ({
      ...prev,
      specifications: [...(prev.specifications || []), { label: '', value: '' }]
    }));
  };

  const handleSpecChange = (index, key, val) => {
    setFormData(prev => {
      const updated = [...(prev.specifications || [])];
      updated[index] = { ...updated[index], [key]: val };
      return { ...prev, specifications: updated };
    });
  };

  const handleRemoveSpecification = (index) => {
    setFormData(prev => ({
      ...prev,
      specifications: (prev.specifications || []).filter((_, i) => i !== index)
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
        throw new Error('No image URL returned by server');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setSubmitError(err.message || 'Image upload failed. Please try again.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    if (trimmed.startsWith('blob:')) {
      setSubmitError('Direct blob URLs are not permitted. Please provide a valid external image URL.');
      return;
    }
    if (formData.images.length >= 5) {
      setSubmitError('Maximum 5 images allowed per product.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, trimmed]
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
        setErrors(errs => ({ ...errs, images: 'At least 1 product image is required' }));
      }
      return {
        ...prev,
        images: nextImages
      };
    });
  };

  // Video Upload Handlers (Only 1 video allowed)
  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setSubmitError('Please select a valid video file (e.g. MP4, WebM, MOV).');
      return;
    }

    setUploadingVideo(true);
    setSubmitError(null);

    try {
      const uploadData = new FormData();
      uploadData.append('video', file);
      uploadData.append('folderName', 'products/videos');

      const API_BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
      const token = localStorage.getItem('urvaah_token');

      const res = await fetch(`${API_BASE}/api/upload/upload-video`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: uploadData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Video upload failed');
      }

      const uploadedUrl = data.url || data.data?.url || data.filePath;
      if (uploadedUrl) {
        setFormData(prev => ({ ...prev, video_url: uploadedUrl }));
        setSubmitError(null);
      } else {
        throw new Error('No video URL returned from server.');
      }
    } catch (err) {
      console.error('Video upload failed:', err);
      setSubmitError(err.message || 'Video upload failed. Please try again or provide a direct video URL.');
    } finally {
      setUploadingVideo(false);
      e.target.value = '';
    }
  };

  const handleAddVideoUrl = () => {
    const url = videoUrlInput.trim();
    if (!url) return;
    if (url.startsWith('blob:') || url.startsWith('data:')) {
      setSubmitError('Blob or Data URLs cannot be saved. Please enter a valid HTTP/HTTPS video URL.');
      return;
    }
    if (!/^https?:\/\/.+/i.test(url)) {
      setSubmitError('Please enter a valid HTTP/HTTPS video URL.');
      return;
    }
    setFormData(prev => ({ ...prev, video_url: url }));
    setVideoUrlInput('');
    setShowVideoUrlInput(false);
    setSubmitError(null);
  };

  const handleRemoveVideo = () => {
    setFormData(prev => ({ ...prev, video_url: '' }));
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
    const isImagesValid = validateField('images', formData.images);

    if (!isNameValid || !isCategoryValid || !isPriceValid || !isDiscountValid || !isImagesValid) {
      if (!isImagesValid && isNameValid && isCategoryValid && isPriceValid && isDiscountValid) {
        setSubmitError('At least 1 product image is required. Please upload or keep at least 1 image.');
        imagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setSubmitError('Please fix the highlighted required fields before saving.');
      }
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

    const hasBlobImage = formData.images.some(img => typeof img === 'string' && img.startsWith('blob:'));
    if (hasBlobImage) {
      setSubmitError('Temporary image previews cannot be saved. Please re-upload or remove them before saving.');
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

    setUpdating(true);
    setSubmitError(null);

    try {
      const validNameOptions = (formData.nameOptions || []).map(n => n.trim()).filter(Boolean);
      const validSpecs = (formData.specifications || []).filter(s => (s.label && s.label.trim()) || (s.value && s.value.trim()));
      const validProductDetails = richTextToProductDetails(formData.productDetailsText);

      const payload = {
        title: formData.name.trim(),
        productname: formData.name.trim(),
        category_id: formData.category_id,
        subcategory_name: formData.subCategory,
        shortDescription: formData.shortDescription.trim(),
        short_description: formData.shortDescription.trim(),
        description: (formData.fullDescription || formData.description || '').trim(),
        fullDescription: (formData.fullDescription || formData.description || '').trim(),
        full_description: (formData.fullDescription || formData.description || '').trim(),
        nameOptions: validNameOptions,
        name_options: validNameOptions,
        // Product Details are independent of Additional Information (specifications)
        productDetails: validProductDetails,
        product_details: validProductDetails,
        originalPrice: Number(formData.originalPrice) || Number(formData.price),
        originalprice: Number(formData.originalPrice) || Number(formData.price),
        discountPercent: Number(formData.discountPercent) || 0,
        discount: Number(formData.discountPercent) || 0,
        price: Number(formData.price),
        stockQuantity: Number(formData.stockQuantity) || 0,
        stock_quantity: Number(formData.stockQuantity) || 0,
        quantity: Number(formData.stockQuantity) || 0,
        instock: Number(formData.stockQuantity) > 0,
        sizeStock: formData.sizeStock || {},
        size_stock: formData.sizeStock || {},
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
        image: formData.images[0] || '',
        video_url: formData.video_url || '',
        videoUrl: formData.video_url || ''
      };

      const res = await apiClient(`/api/products/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (res?.success || res?.data) {
        const updatedProduct = res?.data || res;
        onProductUpdated(updatedProduct || { ...product, ...payload });
        onClose();
      } else if (res && !res.error && !res.message) {
        onProductUpdated(res || { ...product, ...payload });
        onClose();
      } else {
        throw new Error(res?.message || 'Failed to update product details');
      }
    } catch (err) {
      console.error('Failed to update product:', err);
      if (err.status === 401) {
        setSubmitError('Your admin session has expired. Please log in again.');
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

      if (res?.success || (res && !res.error && res.status !== 'error')) {
        setShowDeleteConfirm(false);
        onProductDeleted(product.id);
        onClose();
      } else {
        throw new Error(res?.message || 'Delete operation failed');
      }
    } catch (err) {
      console.error('Failed to delete product:', err);
      if (err.status === 401) {
        setSubmitError('Your admin session has expired. Please log in again.');
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

  if (!isOpen || !product) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 font-admin overscroll-contain"
      onClick={(e) => {
        if (e.target === e.currentTarget && !updating && !deleting) {
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
        <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50/90 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold font-admin text-brand-dark">Edit Product</h2>
                <span className="text-xs text-neutral-500 font-mono bg-neutral-200/70 px-2 py-0.5 rounded-md font-medium">
                  ID: #{product.id}
                </span>

                {/* Rating Badge */}
                {formData.reviews > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200/80 shadow-2xs">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                    <span>{Number(formData.rating || 5.0).toFixed(1)}</span>
                    <span className="text-neutral-500 font-normal">({formData.reviews} {formData.reviews === 1 ? 'review' : 'reviews'})</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 text-neutral-500 border border-neutral-200">
                    <Star className="w-2.5 h-2.5 text-neutral-400" />
                    No reviews yet
                  </span>
                )}

                {/* Promoted Badge */}
                {formData.promoted && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                    <Flame className="w-3 h-3 text-amber-600 fill-amber-500" />
                    Promoted
                  </span>
                )}

                {/* Recommended Badge */}
                {formData.is_recommended && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-2xs">
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    Recommended
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-600 font-admin truncate max-w-xl">
                {formData.name || 'Manage product details, pricing, inventory, and visibility'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-neutral-400 hover:text-brand-dark hover:bg-neutral-200/60 transition-colors shrink-0 cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
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

              {/* Product Status & Merchandising Highlights Overview Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-gradient-to-br from-neutral-50 to-neutral-100/70 rounded-2xl border border-neutral-200/90 shadow-2xs">
                {/* 1. Customer Rating & Reviews */}
                <div className="bg-white p-3.5 rounded-xl border border-neutral-200/80 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                        Customer Rating
                      </span>
                      <Star className={`w-4 h-4 ${formData.reviews > 0 ? 'text-amber-500 fill-amber-400' : 'text-neutral-300'}`} />
                    </div>
                    {formData.reviews > 0 ? (
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-xl font-extrabold text-neutral-900 font-admin">
                          {Number(formData.rating || 5.0).toFixed(1)}
                        </span>
                        <span className="text-xs text-neutral-400 font-medium">/ 5.0</span>
                      </div>
                    ) : (
                      <div className="text-xs font-semibold text-neutral-700 mt-1">
                        No reviews yet
                      </div>
                    )}
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      {formData.reviews > 0
                        ? `${formData.reviews} verified ${formData.reviews === 1 ? 'review' : 'reviews'}`
                        : 'Awaiting customer feedback'}
                    </p>
                  </div>
                  {formData.reviews > 0 ? (
                    <a
                      href={`/admin/reviews?search=${encodeURIComponent(formData.name || product.name || '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-dark hover:text-black no-underline hover:no-underline pt-2 border-t border-neutral-100 transition-colors"
                      style={{ textDecoration: 'none' }}
                    >
                      <MessageSquare className="w-3 h-3 text-neutral-500" />
                      <span>Manage Reviews</span>
                      <ExternalLink className="w-2.5 h-2.5 text-neutral-400 ml-auto" />
                    </a>
                  ) : (
                    <div className="mt-2.5 pt-2 border-t border-neutral-100 text-[10px] text-neutral-400">
                      Standard catalog rating
                    </div>
                  )}
                </div>

                {/* 2. Promoted Status */}
                <div className={`p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                  formData.promoted
                    ? 'bg-amber-50/80 border-amber-300 shadow-2xs'
                    : 'bg-white border-neutral-200/80'
                }`}>
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                        Promoted Status
                      </span>
                      <Flame className={`w-4 h-4 ${formData.promoted ? 'text-amber-600 fill-amber-500' : 'text-neutral-300'}`} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${
                        formData.promoted
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                      }`}>
                        {formData.promoted ? 'Promoted' : 'Not Promoted'}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                      {formData.promoted
                        ? 'Highlights product with PROMOTED tag on storefront.'
                        : 'Normal catalog positioning.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, promoted: !prev.promoted }))}
                    className={`mt-2.5 inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                      formData.promoted
                        ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-700'
                        : 'bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-300'
                    }`}
                  >
                    {formData.promoted ? 'Deactivate Promotion' : 'Set as Promoted'}
                  </button>
                </div>

                {/* 3. Recommended Status */}
                <div className={`p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                  formData.is_recommended
                    ? 'bg-indigo-50/80 border-indigo-300 shadow-2xs'
                    : 'bg-white border-neutral-200/80'
                }`}>
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                        Recommendation
                      </span>
                      <Sparkles className={`w-4 h-4 ${formData.is_recommended ? 'text-indigo-600' : 'text-neutral-300'}`} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${
                        formData.is_recommended
                          ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                          : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                      }`}>
                        {formData.is_recommended ? 'Recommended' : 'Standard'}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                      {formData.is_recommended
                        ? "Featured in 'Recommended For You' collections."
                        : 'Not featured in recommendation lists.'}
                    </p>
                    {recommendationStatus && (
                    <p className={`text-[11px] mt-1 leading-snug ${recommendationStatus.missing > 0 ? 'text-amber-700 font-semibold' : 'text-neutral-500'}`}>
                      {recommendationStatus.text}
                    </p>
                  )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_recommended: !prev.is_recommended }))}
                    className={`mt-2.5 inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                      formData.is_recommended
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700'
                        : 'bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-300'
                    }`}
                  >
                    {formData.is_recommended ? 'Remove Recommendation' : 'Set as Recommended'}
                  </button>
                </div>
              </div>

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

              {/* 4. Full Description with Rich Formatting Toolbar */}
              <div className="space-y-1.5">
                <RichDescriptionEditor
                  value={formData.fullDescription || formData.description}
                  onChange={(val) => setFormData(prev => ({ ...prev, fullDescription: val, description: val }))}
                  placeholder="Comprehensive product story, artisan detailing, styling ideas, and garment drape overview..."
                  title="FULL DESCRIPTION"
                  badgeText="RICH EDITOR"
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
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-dark hover:text-black no-underline hover:no-underline cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Add Name Option
                    </button>
                  </div>
                  <div className="space-y-2">
                    {!formData.nameOptions || formData.nameOptions.length === 0 ? (
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
                            className="p-2 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remove name option"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Product Details (Rich Editor) - hidden on the storefront when left empty */}
                <RichDescriptionEditor
                  id="productDetails"
                  value={formData.productDetailsText || ''}
                  onChange={(val) => setFormData(prev => ({ ...prev, productDetailsText: val }))}
                  placeholder="Fabric, fit, lining, closure, care notes... Use headings and bullet lists to structure the details."
                  title="PRODUCT DETAILS"
                  badgeText="RICH EDITOR"
                  rows={5}
                />

                {/* Product Details table (storefront) - shown under the rich details, hidden when empty */}
                <div className="space-y-3 pt-3 border-t border-neutral-200/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
                          Product Details Table
                        </label>
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-neutral-900 text-white rounded">
                          Shown in Product Details
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Rows shown as a table inside the "PRODUCT DETAILS" section on the product page. Leave empty to hide the table.
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
                      {(formData.specifications || []).length > 0 && (
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

                  {!formData.specifications || formData.specifications.length === 0 ? (
                    <div className="p-4 bg-neutral-50 border border-dashed border-neutral-200 rounded-xl text-center">
                      <p className="text-xs text-neutral-500 mb-2">No additional information rows configured yet.</p>
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
                    onBlur={() => handleBlur('discountPercent')}
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
                    onChange={(e) => {
                      const total = Math.max(0, parseInt(e.target.value) || 0);
                      setFormData(prev => {
                        const sizes = prev.sizes || [];
                        let nextSizeStock = { ...(prev.sizeStock || {}) };
                        if (sizes.length > 0) {
                          const base = Math.floor(total / sizes.length);
                          const rem = total % sizes.length;
                          sizes.forEach((sz, idx) => {
                            nextSizeStock[sz] = base + (idx < rem ? 1 : 0);
                          });
                        }
                        return {
                          ...prev,
                          stockQuantity: total,
                          sizeStock: nextSizeStock
                        };
                      });
                    }}
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-sans font-medium text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                  />
                </div>
              </div>

              {/* 6. Product Status & Visibility */}
              <div className="space-y-4 p-5 bg-neutral-50 rounded-2xl border border-neutral-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider font-admin">
                    Product Visibility, Badges & Merchandising
                  </h4>
                  <span className="text-[11px] text-neutral-500 font-medium">Controls storefront badges and placement</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {/* Active Storefront Card */}
                  <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                    formData.active
                      ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                      : 'bg-white border-neutral-200 text-neutral-600'
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 rounded text-brand-dark focus:ring-brand-dark border-neutral-300 cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-neutral-900 block">Active on Storefront</span>
                      <p className="text-[11px] text-neutral-500">
                        {formData.active ? 'Visible to customers across catalog and search' : 'Hidden from customers (draft mode)'}
                      </p>
                    </div>
                  </label>

                  {/* Read-only Auto In-Stock Card */}
                  <div className={`p-3.5 rounded-xl border flex items-start gap-3 opacity-90 ${
                    Number(formData.stockQuantity) > 0
                      ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                      : 'bg-rose-50/60 border-rose-300 text-rose-950'
                  }`} title="Auto-updated based on Stock Quantity">
                    <input
                      type="checkbox"
                      checked={Number(formData.stockQuantity) > 0}
                      disabled
                      className="mt-0.5 w-4 h-4 rounded text-emerald-600 border-neutral-300 cursor-not-allowed"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-neutral-900 block">
                        In Stock <span className="text-[10px] text-neutral-400 font-normal">(Auto calculated)</span>
                      </span>
                      <p className="text-[11px] text-neutral-500">
                        {Number(formData.stockQuantity) > 0
                          ? `In stock with ${formData.stockQuantity} units available`
                          : 'Marked out of stock (Stock quantity is 0)'}
                      </p>
                    </div>
                  </div>

                  {/* Promoted / Featured Card */}
                  <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                    formData.promoted
                      ? 'bg-amber-50/80 border-amber-300 text-amber-950 shadow-2xs'
                      : 'bg-white border-neutral-200 text-neutral-600'
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.promoted}
                      onChange={(e) => setFormData(prev => ({ ...prev, promoted: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-neutral-300 cursor-pointer"
                    />
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-900">Promoted / Featured</span>
                        {formData.promoted && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-200 text-amber-900 border border-amber-300">PROMOTED</span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        Displays 'PROMOTED' badge on product card and prioritizes in discovery
                      </p>
                    </div>
                  </label>

                  {/* Recommended for You Card */}
                  <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                    formData.is_recommended
                      ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 shadow-2xs'
                      : 'bg-white border-neutral-200 text-neutral-600'
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.is_recommended}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_recommended: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-neutral-300 cursor-pointer"
                    />
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-900">Recommended for You</span>
                        {formData.is_recommended && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-200 text-indigo-900 border border-indigo-300">RECOMMENDED</span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        Shows this item in the 'Recommended for You' section and suggestions
                      </p>
                    </div>
                  </label>
                </div>
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
                              placeholder="0"
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

                {/* Option to paste Image URL directly if local uploading is unavailable */}
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

              {/* 12. Product Video (Single Video) */}
              <div className="space-y-3 pt-3 border-t border-neutral-100">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Product Video (Optional)
                    </label>
                    <p className="text-[11px] text-neutral-400">
                      Upload 1 product showcase video. It will appear at the end of the image gallery.
                    </p>
                  </div>
                  <span className={`text-xs font-mono font-medium ${formData.video_url ? 'text-emerald-600 font-semibold' : 'text-neutral-500'}`}>
                    {formData.video_url ? '1 / 1 uploaded' : '0 / 1 selected'}
                  </span>
                </div>

                {formData.video_url ? (
                  <div className="relative w-full max-w-sm rounded-xl overflow-hidden border border-neutral-300 bg-black shadow-xs group">
                    <video
                      src={formData.video_url}
                      controls
                      muted
                      playsInline
                      className="w-full max-h-56 object-contain bg-black"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveVideo}
                      className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-md transition-all cursor-pointer"
                      title="Remove video"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-full max-w-sm">
                    <label className="h-28 border-2 border-dashed border-neutral-300 hover:border-brand-dark rounded-xl flex flex-col items-center justify-center cursor-pointer bg-neutral-50 hover:bg-neutral-100/60 transition-all p-3 text-center">
                      {uploadingVideo ? (
                        <Loader2 className="w-6 h-6 animate-spin text-brand-dark" />
                      ) : (
                        <>
                          <Film className="w-6 h-6 text-neutral-400 mb-1.5" />
                          <span className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wide">
                            + Upload Product Video
                          </span>
                          <span className="text-[10px] text-neutral-400 mt-0.5">
                            MP4, WebM or MOV (Max 1 video)
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        disabled={uploadingVideo}
                        className="hidden"
                      />
                    </label>

                    <div className="pt-2">
                      {!showVideoUrlInput ? (
                        <button
                          type="button"
                          onClick={() => setShowVideoUrlInput(true)}
                          className="text-[11px] font-semibold text-neutral-500 hover:text-brand-dark no-underline hover:no-underline transition-colors cursor-pointer"
                          style={{ textDecoration: 'none' }}
                        >
                          + Or add video via direct URL
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="url"
                            value={videoUrlInput}
                            onChange={(e) => setVideoUrlInput(e.target.value)}
                            placeholder="https://example.com/product-video.mp4"
                            className="flex-1 px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs"
                          />
                          <button
                            type="button"
                            onClick={handleAddVideoUrl}
                            className="px-3 py-1.5 bg-brand-dark text-white text-xs font-semibold rounded-lg"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowVideoUrlInput(false)}
                            className="text-xs text-neutral-400 hover:text-neutral-600"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Modal Sticky Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50/90 shrink-0 flex items-center justify-end gap-3 font-admin">
          <button
            type="button"
            onClick={onClose}
            disabled={updating || deleting}
            className="px-5 py-2.5 h-10 border border-neutral-300 text-neutral-700 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-neutral-100 hover:text-neutral-950 transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={updating || deleting || showDeleteConfirm}
            className="px-5 py-2.5 h-10 bg-red-600 text-white hover:bg-red-700 rounded-xl text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Product</span>
          </button>
          <button
            type="submit"
            form="edit-product-form"
            disabled={updating || deleting || fetchingDetail}
            className="px-6 py-2.5 h-10 bg-neutral-950 text-white hover:bg-black rounded-xl text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {updating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
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
