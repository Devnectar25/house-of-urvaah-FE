import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  Video,
  Image as ImageIcon,
  Play,
  Eye,
  X,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';

export const AdminHeroSection = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [previewMediaUrl, setPreviewMediaUrl] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    heading: '',
    subheading: '',
    desktop_image: '',
    mobile_image: '',
    media_type: 'video',
    button_text: 'EXPLORE COLLECTION',
    button_link: '/clothing',
    is_active: true
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchSlides = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient('/api/ui/admin/hero');
      if (res && res.success) {
        setSlides(res.data || []);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('urvaah_hero_updated'));
        }
      } else {
        throw new Error(res?.message || 'Failed to fetch hero slides');
      }
    } catch (err) {
      console.error('Error fetching hero slides:', err);
      setError(err.message || 'Could not connect to API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const openAddModal = () => {
    setEditingSlide(null);
    setFormData({
      heading: '',
      subheading: '',
      desktop_image: '',
      mobile_image: '',
      media_type: 'video',
      button_text: '',
      button_link: '',
      is_active: true
    });
    setUploadError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (slide) => {
    setEditingSlide(slide);
    setFormData({
      heading: '',
      subheading: '',
      desktop_image: slide.desktop_image || '',
      mobile_image: slide.mobile_image || '',
      media_type: slide.media_type || (slide.desktop_image?.endsWith('.mp4') ? 'video' : 'image'),
      button_text: '',
      button_link: '',
      is_active: slide.is_active ?? true
    });
    setUploadError(null);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (type === 'video' && !isVideo) {
      setUploadError('Please select a valid video file (MP4, WebM, QuickTime).');
      return;
    }
    if (type === 'image' && !isImage) {
      setUploadError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    // Size check: Video up to 100MB, Image up to 15MB
    const maxBytes = isVideo ? 100 * 1024 * 1024 : 15 * 1024 * 1024;
    if (file.size > maxBytes) {
      setUploadError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max allowed: ${isVideo ? '100MB' : '15MB'}.`);
      return;
    }

    setUploadingFile(true);
    try {
      const uploadData = new FormData();
      uploadData.append(isVideo ? 'video' : 'file', file);
      if (!isVideo) uploadData.append('folder', 'hero');

      const API_BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
      const token = localStorage.getItem('urvaah_token');
      const endpoint = isVideo ? `${API_BASE}/api/upload/upload-video` : `${API_BASE}/api/upload/upload-image`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: uploadData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'File upload failed');
      }

      const uploadedUrl = data.url || data.videoUrl || data.filePath || data.data?.url;
      if (!uploadedUrl) throw new Error('No media URL returned by server');

      setFormData((prev) => ({
        ...prev,
        desktop_image: uploadedUrl,
        media_type: isVideo ? 'video' : 'image'
      }));
      showToast('success', `${isVideo ? 'Video' : 'Image'} uploaded successfully!`);
    } catch (err) {
      console.error('Hero file upload error:', err);
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleSaveSlide = async (e) => {
    e.preventDefault();
    if (!formData.desktop_image.trim()) {
      setUploadError('Media file or URL is required.');
      return;
    }

    setSaving(true);
    try {
      if (formData.is_active) {
        // Enforce single-active rule: deactivate all other slides
        const otherActive = slides.filter((s) => s.id !== editingSlide?.id && s.is_active);
        await Promise.all(
          otherActive.map((s) =>
            apiClient(`/api/ui/admin/hero/${s.id}`, {
              method: 'PUT',
              body: JSON.stringify({ ...s, is_active: false })
            })
          )
        );
      }

      if (editingSlide) {
        const res = await apiClient(`/api/ui/admin/hero/${editingSlide.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        if (!res?.success) throw new Error(res?.message || 'Update failed');
        showToast('success', 'Hero slide updated successfully!');
      } else {
        const res = await apiClient('/api/ui/admin/hero', {
          method: 'POST',
          body: JSON.stringify({
            ...formData,
            display_order: slides.length + 1
          })
        });
        if (!res?.success) throw new Error(res?.message || 'Create failed');
        showToast('success', 'Hero slide created successfully!');
      }
      setIsModalOpen(false);
      fetchSlides();
    } catch (err) {
      console.error('Error saving slide:', err);
      showToast('error', err.message || 'Failed to save slide');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlide = async () => {
    if (!deleteTargetId) return;
    try {
      const res = await apiClient(`/api/ui/admin/hero/${deleteTargetId}`, {
        method: 'DELETE'
      });
      if (!res?.success) throw new Error(res?.message || 'Delete failed');
      showToast('success', 'Hero slide removed successfully!');
      setDeleteTargetId(null);
      fetchSlides();
    } catch (err) {
      console.error('Error deleting slide:', err);
      showToast('error', err.message || 'Failed to delete slide');
    }
  };

  const handleMoveSlide = async (index, direction) => {
    const newSlides = [...slides];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= newSlides.length) return;

    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIdx];
    newSlides[targetIdx] = temp;

    const items = newSlides.map((slide, idx) => ({
      id: slide.id,
      display_order: idx + 1
    }));

    setSlides(newSlides);

    try {
      await apiClient('/api/ui/admin/hero/reorder', {
        method: 'PUT',
        body: JSON.stringify({ items })
      });
      showToast('success', 'Slides reordered successfully!');
    } catch (err) {
      console.error('Reorder error:', err);
      fetchSlides();
    }
  };

  const handleToggleActive = async (targetSlide) => {
    const newIsActive = !targetSlide.is_active;

    try {
      if (newIsActive) {
        // Single active rule: deactivate all other active slides first
        const otherActive = slides.filter((s) => s.id !== targetSlide.id && s.is_active);
        await Promise.all(
          otherActive.map((s) =>
            apiClient(`/api/ui/admin/hero/${s.id}`, {
              method: 'PUT',
              body: JSON.stringify({ ...s, is_active: false })
            })
          )
        );

        // Activate the target slide
        const res = await apiClient(`/api/ui/admin/hero/${targetSlide.id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...targetSlide, is_active: true })
        });

        if (res?.success) {
          setSlides((prev) =>
            prev.map((s) => ({
              ...s,
              is_active: s.id === targetSlide.id
            }))
          );
          showToast('success', 'Hero video activated! (Other videos set to inactive)');
        }
      } else {
        // Deactivate target slide
        const res = await apiClient(`/api/ui/admin/hero/${targetSlide.id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...targetSlide, is_active: false })
        });
        if (res?.success) {
          setSlides((prev) =>
            prev.map((s) => (s.id === targetSlide.id ? { ...s, is_active: false } : s))
          );
          showToast('success', 'Hero video set to inactive.');
        }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('urvaah_hero_updated'));
      }
    } catch (err) {
      console.error('Toggle error:', err);
      showToast('error', 'Failed to toggle slide status');
      fetchSlides();
    }
  };

  const firstActiveIdx = slides.findIndex((s) => s.is_active);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-admin border bg-neutral-950 text-white min-w-[320px] max-w-[460px] animate-in fade-in slide-in-from-bottom-5 ${
            toast.type === 'success' ? 'border-emerald-500/40' : 'border-rose-500/40'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="font-medium text-xs sm:text-sm text-white">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase bg-[#F4F1EA] text-neutral-800">
              Modify UI
            </span>
            <span className="text-xs text-neutral-400">•</span>
            <span className="text-xs font-semibold text-neutral-500">Storefront Section</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-admin font-bold text-neutral-950 tracking-tight mt-1">
            Hero Section
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-sans mt-1">
            Configure looping background videos, responsive hero banners, typography, and call-to-actions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchSlides}
            disabled={loading}
            className="p-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl transition-all cursor-pointer shadow-2xs"
            title="Refresh Slides"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-neutral-900' : ''}`} />
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-all shadow-sm cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Hero Slide</span>
          </button>
        </div>
      </div>

      {/* Hero Slides List */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-admin font-bold text-neutral-950 uppercase tracking-wider">
              Configured Hero Media & Slides ({slides.length})
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Reorder slides or edit content. When multiple active slides exist, storefront can carousel through them.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-neutral-400 space-y-3">
            <Loader2 className="w-7 h-7 animate-spin text-neutral-900" />
            <p className="text-xs font-medium">Loading hero slides...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-600 space-y-3">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-sm font-semibold">{error}</p>
            <button
              onClick={fetchSlides}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold"
            >
              Try Again
            </button>
          </div>
        ) : slides.length === 0 ? (
          <div className="p-16 text-center text-neutral-400 space-y-3">
            <Video className="w-10 h-10 mx-auto text-neutral-300 stroke-[1.5]" />
            <p className="text-sm font-medium text-neutral-600">No Hero slides configured yet.</p>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Click "Add Hero Slide" above to configure your homepage hero video or banner.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {slides.map((slide, idx) => {
              const isVideo =
                slide.media_type === 'video' ||
                slide.desktop_image?.endsWith('.mp4') ||
                slide.desktop_image?.includes('/videos/');
              const isLiveStorefront = slide.is_active && idx === firstActiveIdx;

                return (
                  <div
                    key={slide.id}
                    className={`p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors ${
                      isLiveStorefront ? 'bg-emerald-50/40 hover:bg-emerald-50/60' : 'hover:bg-neutral-50/60'
                    }`}
                  >
                    {/* Left: Media Thumbnail + Details */}
                    <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                      {/* Media Thumbnail Container with Preview Trigger */}
                      <div
                        onClick={() => setPreviewMediaUrl(slide.desktop_image)}
                        className={`relative w-28 sm:w-36 h-20 rounded-xl bg-neutral-900 overflow-hidden shrink-0 border group cursor-pointer shadow-2xs ${
                          isLiveStorefront ? 'border-emerald-400 ring-2 ring-emerald-400/20' : 'border-neutral-200'
                        }`}
                        title="Click to preview media"
                      >
                        {isVideo ? (
                          <video
                            src={slide.desktop_image}
                            className="w-full h-full object-cover opacity-80"
                            muted
                            loop
                          />
                        ) : (
                          <img
                            src={slide.desktop_image}
                            alt={slide.heading || 'Hero'}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                          {isVideo ? (
                            <Play className="w-5 h-5 text-white fill-white/80 group-hover:scale-110 transition-transform" />
                          ) : (
                            <Eye className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                          )}
                        </div>
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-xs">
                          {isVideo ? 'VIDEO' : 'IMAGE'}
                        </span>
                      </div>

                      {/* Metadata text */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-admin tracking-wider uppercase bg-neutral-100 text-neutral-700">
                            Order #{idx + 1}
                          </span>
                          {isLiveStorefront ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-emerald-600 text-white shadow-xs flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                              CURRENTLY LIVE ON HERO
                            </span>
                          ) : slide.is_active ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-admin tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ACTIVE (STANDBY)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-admin tracking-wider uppercase bg-rose-50 text-rose-700 border border-rose-200">
                              INACTIVE
                            </span>
                          )}
                        </div>

                      <h3 className="text-sm sm:text-base font-bold text-neutral-950 font-admin truncate mt-1">
                        {slide.heading || `Hero Looping Background Slide #${idx + 1}`}
                      </h3>

                      <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-400">
                        <span className="truncate max-w-[240px] sm:max-w-md font-mono text-[11px] text-neutral-500">
                          {slide.desktop_image}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: Reorder + Toggle + Edit + Delete */}
                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0">


                    {/* Toggle Switch */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 border border-neutral-200/90 rounded-xl">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(slide)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          slide.is_active ? 'bg-emerald-500' : 'bg-neutral-300 hover:bg-neutral-400'
                        }`}
                        role="switch"
                        aria-checked={slide.is_active}
                        title={slide.is_active ? 'Active on Storefront' : 'Click to activate as sole hero video'}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            slide.is_active ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className={`text-xs font-bold tracking-tight ${slide.is_active ? 'text-emerald-700' : 'text-neutral-500'}`}>
                        {slide.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => openEditModal(slide)}
                      className="p-2 bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-800 rounded-xl transition-all cursor-pointer shadow-2xs"
                      title="Edit slide content"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => setDeleteTargetId(slide.id)}
                      className="p-2 bg-white border border-neutral-200 hover:bg-rose-50 hover:border-rose-200 text-neutral-500 hover:text-rose-600 rounded-xl transition-all cursor-pointer shadow-2xs"
                      title="Delete slide"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Slide Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-neutral-200/90 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-admin font-bold text-lg text-neutral-950">
                  {editingSlide ? 'Edit Hero Slide' : 'Add New Hero Slide'}
                </h3>
                <p className="text-xs text-neutral-500">
                  Upload an MP4 video or high-res image for the background.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlide} className="p-6 space-y-5">
              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Media Upload / URL Section */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-neutral-900 uppercase tracking-wider font-admin">
                  Hero Media Asset (Video or Image) *
                </label>

                {/* Upload Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center justify-center gap-2 p-3.5 border-2 border-dashed border-neutral-200 hover:border-neutral-900 rounded-xl cursor-pointer bg-neutral-50/70 hover:bg-neutral-50 transition-all">
                    <Video className="w-4 h-4 text-neutral-600" />
                    <span className="text-xs font-semibold text-neutral-800">
                      {uploadingFile ? 'Uploading Video...' : 'Upload Video (.mp4, max 100MB)'}
                    </span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      className="hidden"
                      disabled={uploadingFile}
                      onChange={(e) => handleFileUpload(e, 'video')}
                    />
                  </label>

                  <label className="flex items-center justify-center gap-2 p-3.5 border-2 border-dashed border-neutral-200 hover:border-neutral-900 rounded-xl cursor-pointer bg-neutral-50/70 hover:bg-neutral-50 transition-all">
                    <ImageIcon className="w-4 h-4 text-neutral-600" />
                    <span className="text-xs font-semibold text-neutral-800">
                      {uploadingFile ? 'Uploading Image...' : 'Upload Image (JPEG/PNG/WebP)'}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={uploadingFile}
                      onChange={(e) => handleFileUpload(e, 'image')}
                    />
                  </label>
                </div>

                {uploadingFile && (
                  <div className="flex items-center gap-2 text-xs text-neutral-600 pt-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-900" />
                    <span>Processing file upload to Supabase CDN... Please wait.</span>
                  </div>
                )}

                {/* Direct Media URL Input */}
                <div className="mt-2">
                  <span className="text-[11px] font-semibold text-neutral-400 block mb-1">
                    Or specify direct Supabase CDN / Asset Path:
                  </span>
                  <input
                    type="text"
                    value={formData.desktop_image}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        desktop_image: val,
                        media_type: val.endsWith('.mp4') ? 'video' : prev.media_type
                      }));
                    }}
                    placeholder="https://... or /assets/video/Hero-section-video-two.mp4"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all font-mono"
                  />
                </div>

                {/* Media Preview inside Modal */}
                {formData.desktop_image && (
                  <div className="mt-3 p-3 bg-neutral-100 rounded-xl border border-neutral-200">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-500 mb-2">
                      <span>Media Live Preview</span>
                      <span className="uppercase font-mono text-[10px]">
                        Type: {formData.media_type}
                      </span>
                    </div>
                    <div className="w-full h-44 rounded-lg bg-neutral-900 overflow-hidden relative">
                      {formData.media_type === 'video' || formData.desktop_image.endsWith('.mp4') ? (
                        <video
                          src={formData.desktop_image}
                          className="w-full h-full object-cover"
                          autoPlay
                          muted
                          loop
                          playsInline
                        />
                      ) : (
                        <img
                          src={formData.desktop_image}
                          alt="Hero Preview"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Option: Active or Inactive */}
              <div className="pt-2">
                <label className="text-xs font-bold text-neutral-900 block mb-2">
                  Status Option:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: true })}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      formData.is_active
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-2 ring-emerald-400/20'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Active</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: false })}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      !formData.is_active
                        ? 'bg-rose-50 text-rose-800 border-rose-400 ring-2 ring-rose-400/20'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Inactive</span>
                  </button>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingFile}
                  className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-800 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-all shadow-sm cursor-pointer flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingSlide ? 'Update Hero Slide' : 'Save Slide'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-neutral-200/90 rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h3 className="font-admin font-bold text-lg text-neutral-950">Delete Hero Slide?</h3>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                This will remove the slide from the storefront. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSlide}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-all shadow-sm cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Video / Image Modal Preview */}
      {previewMediaUrl && (
        <div
          onClick={() => setPreviewMediaUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl border border-neutral-800"
          >
            <button
              onClick={() => setPreviewMediaUrl(null)}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="aspect-video w-full flex items-center justify-center bg-black">
              {previewMediaUrl.endsWith('.mp4') || previewMediaUrl.includes('/videos/') ? (
                <video
                  src={previewMediaUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={previewMediaUrl}
                  alt="Hero Preview"
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
