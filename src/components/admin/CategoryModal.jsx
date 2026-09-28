import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  Trash2,
  Link as LinkIcon
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { getSupabaseMediaUrl } from '../../lib/supabase';

export const CategoryModal = ({ category, isOpen, onClose, onCategorySaved }) => {
  if (!isOpen) return null;

  const nameInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const isEdit = Boolean(category && (category.category_id || category.id));

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: true
  });

  // Category Image Management State
  const [initialImageUrl, setInitialImageUrl] = useState('');
  const [currentImagePreview, setCurrentImagePreview] = useState('');
  const [pendingImageFile, setPendingImageFile] = useState(null);
  const [isImageRemoved, setIsImageRemoved] = useState(false);
  const [imageError, setImageError] = useState(null);

  // URL Input State
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');

  // General Form Validation & Submission State
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Reset/populate form on open/category change
  useEffect(() => {
    if (isOpen) {
      if (category) {
        const rawImg = category.category_image || category.image_url || category.image || '';
        const existingImg = rawImg ? getSupabaseMediaUrl(rawImg) : '';
        setFormData({
          name: category.name || '',
          description: category.description || '',
          active: category.active !== undefined ? Boolean(category.active) : (category.is_active !== undefined ? Boolean(category.is_active) : true)
        });
        setInitialImageUrl(existingImg);
        setCurrentImagePreview(existingImg);
      } else {
        setFormData({
          name: '',
          description: '',
          active: true
        });
        setInitialImageUrl('');
        setCurrentImagePreview('');
      }
      setPendingImageFile(null);
      setIsImageRemoved(false);
      setImageError(null);
      setErrors({});
      setSubmitError(null);
      setShowUrlInput(false);
      setUrlInputValue('');
    }
  }, [isOpen, category]);

  // Clean up Object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (currentImagePreview && currentImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(currentImagePreview);
      }
    };
  }, [currentImagePreview]);

  // Field validation helper
  const validateField = (field, value) => {
    let errorMsg = '';
    if (field === 'name') {
      if (!value || !value.trim()) {
        errorMsg = 'Category name is required.';
      } else if (value.trim().length < 2) {
        errorMsg = 'Category name must be at least 2 characters.';
      }
    }
    setErrors((prev) => ({ ...prev, [field]: errorMsg }));
    return !errorMsg;
  };

  const handleBlur = (field) => {
    validateField(field, formData[field]);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      validateField(field, value);
    }
  };

  // Handle Client-Side File Selection with Validation
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(null);
    setSubmitError(null);

    // Accepted File Types Validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setImageError('Invalid image format. Please select a JPG, PNG, WEBP, GIF, or AVIF file.');
      e.target.value = '';
      return;
    }

    // File Size Validation (Max 5MB)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setImageError('Image file size exceeds the 5MB limit. Please choose a smaller image.');
      e.target.value = '';
      return;
    }

    // Create client-side preview URL without immediate upload
    const objectUrl = URL.createObjectURL(file);
    setPendingImageFile(file);
    setCurrentImagePreview(objectUrl);
    setIsImageRemoved(false);
    setShowUrlInput(false);
    e.target.value = '';
  };

  // Handle Image Removal
  const handleRemoveImage = () => {
    setPendingImageFile(null);
    setCurrentImagePreview('');
    setIsImageRemoved(true);
    setImageError(null);
    setShowUrlInput(false);
    setUrlInputValue('');
  };

  // Direct Image URL Handler
  const handleAddImageUrl = (e) => {
    e.preventDefault();
    const url = urlInputValue.trim();
    if (!url) return;

    setPendingImageFile(null);
    setCurrentImagePreview(url);
    setIsImageRemoved(false);
    setImageError(null);
    setShowUrlInput(false);
    setUrlInputValue('');
  };

  // Compute Image Status Line Text
  const getImageStatusText = () => {
    if (!currentImagePreview || isImageRemoved) {
      return 'No image selected';
    }
    if (pendingImageFile) {
      return 'Selected but not yet uploaded';
    }
    if (currentImagePreview !== initialImageUrl) {
      return 'URL provided (pending save)';
    }
    return 'Currently saved';
  };

  // Upload Pending File to Backend
  const uploadImageFile = async (file) => {
    setUploadingImage(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('folder', 'categories');

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

      return data.url || data.data?.url || data.filePath;
    } catch (err) {
      console.error('Failed to upload category image file:', err);
      throw new Error(`Image upload failed: ${err.message || 'Server error'}`);
    } finally {
      setUploadingImage(false);
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    const isNameValid = validateField('name', formData.name);
    if (!isNameValid) {
      if (nameInputRef.current) {
        nameInputRef.current.focus();
      }
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      let finalCategoryImageUrl = currentImagePreview;

      // 1. Upload pending image file if staged
      if (pendingImageFile) {
        finalCategoryImageUrl = await uploadImageFile(pendingImageFile);
      } else if (isImageRemoved) {
        finalCategoryImageUrl = '';
      }

      // 2. Prepare payload
      const categoryId = category?.category_id || category?.id;
      const endpoint = isEdit ? `/api/categories/${categoryId}` : '/api/categories';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category_image: finalCategoryImageUrl ? finalCategoryImageUrl.trim() : '',
        active: Boolean(formData.active)
      };

      // 3. Send request to backend
      const response = await apiClient(endpoint, {
        method,
        body: JSON.stringify(payload)
      });

      const savedCategory = response?.data || response;
      onCategorySaved(savedCategory, isEdit ? 'updated' : 'created');
      onClose();
    } catch (err) {
      console.error('Failed to save category:', err);
      setSubmitError(err.message || `Failed to ${isEdit ? 'update' : 'create'} category. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200 font-admin">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-neutral-200 my-8 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div>
            <h2 className="text-lg font-admin font-bold text-brand-dark tracking-tight">
              {isEdit ? 'Edit Category' : 'Add Category'}
            </h2>
            <p className="text-xs text-neutral-500 font-admin mt-0.5">
              {isEdit ? 'Update details for this product category.' : 'Create a new product category for your store catalog.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 text-neutral-400 hover:text-brand-dark hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Submit Error Banner */}
          {submitError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{submitError}</span>
            </div>
          )}

          {/* Category Name */}
          <div>
            <label className="block text-xs font-semibold text-brand-dark mb-1.5 uppercase tracking-wider">
              Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              placeholder="e.g. Corset Tops, Summer Dresses"
              className={`w-full px-3.5 py-2.5 bg-neutral-50 border rounded-xl text-xs text-brand-dark placeholder-neutral-400 focus:outline-none focus:ring-1 transition-all ${
                errors.name
                  ? 'border-rose-400 focus:ring-rose-500 focus:bg-rose-50/30'
                  : 'border-neutral-200 focus:ring-brand-dark focus:bg-white'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-brand-dark mb-1.5 uppercase tracking-wider">
              Description <span className="text-neutral-400 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Brief overview of products included in this category..."
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-brand-dark placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-brand-dark focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Category Image Section (Boxed Sub-section) */}
          <div className="border border-neutral-200/80 rounded-xl p-4 bg-neutral-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-brand-dark uppercase tracking-wider">
                Category Image
              </label>

              {!showUrlInput && (
                <button
                  type="button"
                  onClick={() => setShowUrlInput(true)}
                  className="text-[11px] text-neutral-500 hover:text-brand-dark flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>Paste URL</span>
                </button>
              )}
            </div>

            {/* Sub-Section Content: Thumbnail + Status & Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-1">
              {/* Thumbnail Area */}
              {currentImagePreview && !isImageRemoved ? (
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-xs flex-shrink-0 group">
                  <img
                    src={currentImagePreview}
                    alt="Category Thumbnail"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/150?text=Invalid+Image';
                    }}
                  />
                  {/* Uploading Overlay Spinner */}
                  {(uploadingImage || (submitting && pendingImageFile)) && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white text-[10px] gap-1 backdrop-blur-xs">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="font-medium">Uploading</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Empty Placeholder State */
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-100/60 flex flex-col items-center justify-center text-neutral-400 flex-shrink-0">
                  <ImageIcon className="w-6 h-6 stroke-[1.5]" />
                  <span className="text-[10px] text-neutral-400 mt-1 font-medium">No Image</span>
                </div>
              )}

              {/* Status & Side-by-Side Actions */}
              <div className="flex-1 space-y-2.5 w-full">
                <div>
                  <h4 className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    Current Image
                  </h4>
                  <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                    {getImageStatusText()}
                  </p>
                </div>

                {/* Side-by-Side Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Change Image / Add Image Button */}
                  <label className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 hover:border-neutral-300 text-neutral-700 hover:text-brand-dark rounded-lg text-xs font-medium shadow-2xs transition-colors cursor-pointer select-none">
                    <Upload className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{currentImagePreview && !isImageRemoved ? 'Change Image' : 'Add Image'}</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/avif"
                      onChange={handleFileSelect}
                      disabled={submitting || uploadingImage}
                      className="hidden"
                    />
                  </label>

                  {/* Remove Button */}
                  {currentImagePreview && !isImageRemoved && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={submitting || uploadingImage}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 rounded-lg text-xs font-medium shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Paste URL Input Collapsible */}
            {showUrlInput && (
              <div className="pt-2 border-t border-neutral-100 flex items-center gap-2 animate-in fade-in duration-150">
                <input
                  type="url"
                  value={urlInputValue}
                  onChange={(e) => setUrlInputValue(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs text-brand-dark placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-brand-dark"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-3 py-1.5 bg-brand-dark text-white rounded-lg text-xs font-medium hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Set URL
                </button>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(false)}
                  className="p-1.5 text-neutral-400 hover:text-brand-dark rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* File Validation Error Message */}
            {imageError && (
              <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 pt-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{imageError}</span>
              </p>
            )}
          </div>

          {/* Active Status Checkbox */}
          <div className="pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => handleChange('active', e.target.checked)}
                className="w-4 h-4 rounded border-neutral-300 text-brand-dark focus:ring-brand-dark cursor-pointer accent-brand-dark"
              />
              <span className="text-xs font-semibold text-brand-dark">
                Active Category
              </span>
            </label>
            <p className="text-[11px] text-neutral-500 ml-6.5 mt-0.5">
              Active categories are displayed in customer storefront filters and navigation.
            </p>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 border border-neutral-200 text-neutral-600 rounded-xl text-xs font-semibold hover:bg-neutral-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || uploadingImage}
              className="px-5 py-2.5 bg-brand-dark text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isEdit ? 'Updating Category...' : 'Creating Category...'}</span>
                </>
              ) : (
                <span>{isEdit ? 'Update Category' : 'Create Category'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
