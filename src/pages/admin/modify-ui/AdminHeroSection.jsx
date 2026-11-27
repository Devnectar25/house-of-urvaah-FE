import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Video,
  Image as ImageIcon,
  Play,
  Eye,
  X,
  Loader2,
  RefreshCw,
  Smartphone,
  Monitor,
  Upload
} from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import { AdminPageHeader } from '../../../components/admin/AdminPageHeader';
import { useModalScrollLock } from '../../../hooks/useModalScrollLock';
import { getSupabaseMediaUrl } from '../../../lib/supabase';
import { uploadVideoDirect } from '../../../lib/directVideoUpload';

/*
 * Hero Section admin. Desktop and mobile hero slides are fully independent records
 * (one `device` per row). The Desktop / Mobile View toggle decides which device's slides
 * are listed, counted, added, edited, re-ordered and deleted; nothing on this page ever
 * touches the other device's slides or files.
 */

const VIDEO_MAX_BYTES = 100 * 1024 * 1024; // matches the server limit for hero videos
const IMAGE_MAX_BYTES = 10 * 1024 * 1024; // matches the server's image upload limit
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const DEVICE_META = {
  desktop: {
    label: 'Desktop',
    icon: Monitor,
    hint: 'Recommended: 16:9 landscape (e.g. 1920×1080).',
    listInfo: 'Desktop view: shown on laptops, desktops and tablets (768px and wider).',
    fallback: 'With no active desktop slide, the storefront plays the default House of Urvaah desktop video.'
  },
  mobile: {
    label: 'Mobile',
    icon: Smartphone,
    hint: 'Recommended: 9:20 vertical (e.g. 1080×2400) or 9:16 (1080×1920). Fills full mobile screen edge-to-edge.',
    listInfo: 'Mobile view: shown to phone visitors (screens under 768px).',
    fallback: 'With no active mobile slide, phones play the default House of Urvaah mobile video.'
  }
};

const EMPTY_FORM = { media_url: '', media_type: 'video', is_active: true };

const urlExt = (url) => {
  const last = String(url || '').split('?')[0].split('#')[0].trim().toLowerCase().split('/').pop() || '';
  return last.includes('.') ? last.split('.').pop() : '';
};

// Media type implied by a URL/path extension (null when it has no known extension)
const typeFromUrl = (url) => {
  const ext = urlExt(url);
  if (ext === 'mp4') return 'video';
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return 'image';
  return null;
};

// Client-side mirror of the server rules: video = .mp4 up to 100MB, image = JPEG/PNG/WebP
const validateFile = (file, kind) => {
  if (kind === 'video') {
    const isMp4 = file.type === 'video/mp4' || /\.mp4$/i.test(file.name);
    if (!isMp4) return 'Please choose an MP4 video (.mp4). Other video formats are not supported.';
    if (file.size > VIDEO_MAX_BYTES) {
      return `Video is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max allowed: 100MB.`;
    }
    return null;
  }
  if (!IMAGE_TYPES.includes(file.type)) return 'Please choose a JPEG, PNG or WebP image.';
  if (file.size > IMAGE_MAX_BYTES) {
    return `Image is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max allowed: 10MB.`;
  }
  return null;
};

export const AdminHeroSection = () => {
  // Which device this page is working on: 'desktop' | 'mobile'
  const [heroViewMode, setHeroViewMode] = useState('desktop');
  const viewRef = useRef(heroViewMode);
  viewRef.current = heroViewMode;

  const [slides, setSlides] = useState([]); // slides of heroViewMode only
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Modal states. modalDevice is fixed when the modal opens.
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDevice, setModalDevice] = useState('desktop');
  const [editingSlide, setEditingSlide] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, device }
  const [deleting, setDeleting] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null); // { url, type, device }

  useModalScrollLock(Boolean(isModalOpen || deleteTarget || previewMedia), () => {
    if (previewMedia) setPreviewMedia(null);
    else if (isModalOpen) setIsModalOpen(false);
    else if (deleteTarget) setDeleteTarget(null);
  });

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [quickUpload, setQuickUpload] = useState(null); // slideId while replacing from the list

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const notifyStorefront = () => {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('urvaah_hero_updated'));
  };

  const fetchSlides = async (device = viewRef.current) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient(`/api/ui/admin/hero?device=${device}`);
      if (device !== viewRef.current) return; // the view changed while loading
      if (res && res.success) {
        setSlides((res.data || []).filter((s) => s.device === device));
      } else {
        throw new Error(res?.message || 'Failed to fetch hero slides');
      }
    } catch (err) {
      if (device !== viewRef.current) return;
      console.error('Error fetching hero slides:', err);
      setError(err.message || 'Could not connect to API');
    } finally {
      if (device === viewRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    setSlides([]); // never show the other device's slides while switching
    fetchSlides(heroViewMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroViewMode]);

  const openAddModal = () => {
    setEditingSlide(null);
    setModalDevice(heroViewMode);
    setFormData(EMPTY_FORM);
    setUploadError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (slide) => {
    setEditingSlide(slide);
    setModalDevice(slide.device);
    setFormData({
      media_url: slide.media_url || '',
      media_type: slide.media_type === 'image' ? 'image' : 'video',
      is_active: slide.is_active ?? true
    });
    setUploadError(null);
    setIsModalOpen(true);
  };

  // Uploads into the device's own folder (hero/desktop or hero/mobile); returns the public URL
  const uploadMediaFile = async (file, kind, device) => {
    const folder = `hero/${device}`;
    if (kind === 'video') return uploadVideoDirect(file, folder);

    const uploadData = new FormData();
    uploadData.append('folder', folder);
    uploadData.append('file', file);
    const API_BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
    const token = localStorage.getItem('urvaah_token');
    const res = await fetch(`${API_BASE}/api/upload/upload-image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: uploadData
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.message || data.error || 'Image upload failed');
    const uploadedUrl = data.url || data.data?.url;
    if (!uploadedUrl) throw new Error('No media URL returned by server');
    return uploadedUrl;
  };

  // Modal: upload a video or image for the modal's device
  const handleFileUpload = async (e, kind) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploadError(null);
    const problem = validateFile(file, kind);
    if (problem) {
      setUploadError(problem);
      return;
    }

    setUploadingFile(true);
    try {
      const uploadedUrl = await uploadMediaFile(file, kind, modalDevice);
      setFormData((prev) => ({ ...prev, media_url: uploadedUrl, media_type: kind }));
      showToast('success', `${DEVICE_META[modalDevice].label} ${kind} uploaded. Click "Save Slide" to apply it.`);
    } catch (err) {
      console.error('Hero file upload error:', err);
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploadingFile(false);
    }
  };

  // List: replace one slide's media (video or image) and save immediately
  const handleQuickReplace = async (slide, e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const kind = file.type.startsWith('image/') ? 'image' : 'video';
    const problem = validateFile(file, kind);
    if (problem) {
      showToast('error', problem);
      return;
    }

    setQuickUpload(slide.id);
    try {
      const uploadedUrl = await uploadMediaFile(file, kind, slide.device);
      const res = await apiClient(`/api/ui/admin/hero/${slide.id}?device=${slide.device}`, {
        method: 'PUT',
        body: JSON.stringify({ device: slide.device, media_url: uploadedUrl, media_type: kind })
      });
      if (!res?.success) throw new Error(res?.message || 'Update failed');
      setSlides((prev) => prev.map((s) => (s.id === slide.id ? { ...s, ...res.data } : s)));
      notifyStorefront();
      showToast('success', `${DEVICE_META[slide.device].label} hero ${kind} replaced.`);
    } catch (err) {
      console.error('Hero quick replace error:', err);
      showToast('error', err.message || 'Upload failed');
    } finally {
      setQuickUpload(null);
    }
  };

  const handleSaveSlide = async (e) => {
    e.preventDefault();
    const mediaUrl = formData.media_url.trim();
    if (!mediaUrl) {
      setUploadError(`Please upload a ${modalDevice} video or image, or enter its URL.`);
      return;
    }
    const implied = typeFromUrl(mediaUrl);
    const ext = urlExt(mediaUrl);
    if (!implied && ['webm', 'mov', 'm4v', 'ogg', 'mkv', 'avi'].includes(ext)) {
      setUploadError('Hero videos must be MP4 (.mp4).');
      return;
    }
    if (!implied && ['gif', 'avif', 'svg', 'bmp', 'heic'].includes(ext)) {
      setUploadError('Hero images must be JPEG, PNG or WebP.');
      return;
    }
    const mediaType = implied || formData.media_type;

    setSaving(true);
    try {
      const payload = { device: modalDevice, media_url: mediaUrl, media_type: mediaType, is_active: formData.is_active };
      const res = editingSlide
        ? await apiClient(`/api/ui/admin/hero/${editingSlide.id}?device=${modalDevice}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
          })
        : await apiClient(`/api/ui/admin/hero?device=${modalDevice}`, {
            method: 'POST',
            body: JSON.stringify(payload)
          });
      if (!res?.success) throw new Error(res?.message || (editingSlide ? 'Update failed' : 'Create failed'));
      showToast('success', `${DEVICE_META[modalDevice].label} hero slide ${editingSlide ? 'updated' : 'created'}.`);
      setIsModalOpen(false);
      notifyStorefront();
      if (modalDevice === viewRef.current) fetchSlides(modalDevice);
    } catch (err) {
      console.error('Error saving slide:', err);
      setUploadError(err.message || 'Failed to save slide');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlide = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { id, device } = deleteTarget;
      const res = await apiClient(`/api/ui/admin/hero/${id}?device=${device}`, { method: 'DELETE' });
      if (!res?.success) throw new Error(res?.message || 'Delete failed');
      showToast('success', `${DEVICE_META[device].label} hero slide deleted.`);
      setDeleteTarget(null);
      notifyStorefront();
      if (device === viewRef.current) fetchSlides(device);
    } catch (err) {
      console.error('Error deleting slide:', err);
      showToast('error', err.message || 'Failed to delete slide');
    } finally {
      setDeleting(false);
    }
  };

  // Server deactivates the other slides of the SAME device when one is activated
  const handleToggleActive = async (targetSlide) => {
    const newIsActive = !targetSlide.is_active;
    try {
      const res = await apiClient(`/api/ui/admin/hero/${targetSlide.id}?device=${targetSlide.device}`, {
        method: 'PUT',
        body: JSON.stringify({ device: targetSlide.device, is_active: newIsActive })
      });
      if (!res?.success) throw new Error(res?.message || 'Update failed');
      setSlides((prev) =>
        prev.map((s) =>
          newIsActive ? { ...s, is_active: s.id === targetSlide.id } : s.id === targetSlide.id ? { ...s, is_active: false } : s
        )
      );
      showToast(
        'success',
        newIsActive
          ? `${DEVICE_META[targetSlide.device].label} slide activated (other ${targetSlide.device} slides set to inactive).`
          : `${DEVICE_META[targetSlide.device].label} slide set to inactive.`
      );
      notifyStorefront();
    } catch (err) {
      console.error('Toggle error:', err);
      showToast('error', 'Failed to change slide status');
      fetchSlides();
    }
  };

  const firstActiveIdx = slides.findIndex((s) => s.is_active);
  const viewMeta = DEVICE_META[heroViewMode];
  const modalMeta = DEVICE_META[modalDevice];
  const ModalIcon = modalMeta.icon;
  const formIsVideo = (typeFromUrl(formData.media_url) || formData.media_type) === 'video';

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

      {/* Header Banner */}
      <AdminPageHeader
        badge={
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase bg-white/90 border border-[#E5E0D5] text-neutral-800 shadow-2xs">
              Edit Home page
            </span>
            <span className="text-xs text-neutral-400">•</span>
            <span className="text-xs font-semibold text-neutral-600">Storefront Section</span>
          </div>
        }
        title="Hero Section"
        subtitle="Configure looping background videos, responsive hero banners, typography, and call-to-actions."
        actions={
          <>
            <button
              type="button"
              onClick={() => fetchSlides()}
              disabled={loading}
              className="p-2.5 bg-white border border-[#E5E0D5] hover:bg-neutral-50 text-neutral-700 rounded-xl transition-all cursor-pointer shadow-2xs"
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
              <span>Add {viewMeta.label} Hero Slide</span>
            </button>
          </>
        }
      />

      {/* Hero Slides List (selected device only) */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-admin font-bold text-neutral-950 uppercase tracking-wider">
              Configured {viewMeta.label} Hero Media & Slides ({loading ? '…' : slides.length})
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">{viewMeta.listInfo} {viewMeta.hint}</p>
          </div>

          {/* Desktop / Mobile view switch */}
          <div className="inline-flex items-center p-1 bg-neutral-100 border border-neutral-200 rounded-xl self-start sm:self-auto shrink-0" role="tablist">
            {['desktop', 'mobile'].map((id) => {
              const Icon = DEVICE_META[id].icon;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={heroViewMode === id}
                  onClick={() => setHeroViewMode(id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    heroViewMode === id
                      ? 'bg-white text-neutral-950 shadow-xs border border-neutral-200'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {DEVICE_META[id].label} View
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-neutral-400 space-y-3">
            <Loader2 className="w-7 h-7 animate-spin text-neutral-900" />
            <p className="text-xs font-medium">Loading {heroViewMode} hero slides...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-600 space-y-3">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-sm font-semibold">{error}</p>
            <button
              onClick={() => fetchSlides()}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold"
            >
              Try Again
            </button>
          </div>
        ) : slides.length === 0 ? (
          <div className="p-16 text-center text-neutral-400 space-y-3">
            <Video className="w-10 h-10 mx-auto text-neutral-300 stroke-[1.5]" />
            <p className="text-sm font-medium text-neutral-600">No {heroViewMode} hero slides configured yet.</p>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Click "Add {viewMeta.label} Hero Slide" above to add one. {viewMeta.fallback}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {firstActiveIdx === -1 && (
              <div className="px-5 py-3 bg-amber-50 text-amber-800 text-xs font-medium border-b border-amber-100">
                No {heroViewMode} slide is active. {viewMeta.fallback}
              </div>
            )}
            {slides.map((slide, idx) => {
              const isMobileView = slide.device === 'mobile';
              const mediaUrl = getSupabaseMediaUrl(slide.media_url);
              const isVideo = slide.media_type !== 'image';
              const isLiveStorefront = slide.is_active && idx === firstActiveIdx;
              const isQuickUploading = quickUpload === slide.id;
              const SlideIcon = DEVICE_META[slide.device].icon;

              return (
                <div
                  key={slide.id}
                  className={`p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors ${
                    isLiveStorefront ? 'bg-emerald-50/40 hover:bg-emerald-50/60' : 'hover:bg-neutral-50/60'
                  }`}
                >
                  {/* Left: Media Thumbnail + Details */}
                  <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                    <div
                      onClick={() => setPreviewMedia({ url: mediaUrl, type: slide.media_type, device: slide.device })}
                      className={`relative rounded-xl bg-neutral-900 overflow-hidden shrink-0 border group cursor-pointer shadow-2xs ${
                        isMobileView ? 'w-[68px] h-[120px]' : 'w-28 sm:w-36 h-20'
                      } ${isLiveStorefront ? 'border-emerald-400 ring-2 ring-emerald-400/20' : 'border-neutral-200'}`}
                      title={`Click to preview ${slide.device} media`}
                    >
                      {isVideo ? (
                        <video
                          key={mediaUrl}
                          src={mediaUrl}
                          className="w-full h-full object-cover opacity-80"
                          muted
                          loop
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <img src={mediaUrl} alt={`${slide.device} hero`} className="w-full h-full object-cover" />
                      )}
                      {isQuickUploading && (
                        <div className="absolute inset-0 z-10 bg-black/60 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        </div>
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

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-admin tracking-wider uppercase bg-neutral-100 text-neutral-700">
                          Order #{idx + 1}
                        </span>
                        {isLiveStorefront ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-emerald-600 text-white shadow-xs flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            LIVE ON {slide.device.toUpperCase()} HERO
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
                        {DEVICE_META[slide.device].label} Hero Slide #{idx + 1}
                      </h3>

                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-neutral-400">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            isMobileView ? 'bg-sky-50 text-sky-800 border-sky-200' : 'bg-neutral-50 text-neutral-600 border-neutral-200'
                          }`}
                        >
                          <SlideIcon className="w-3 h-3" />
                          {DEVICE_META[slide.device].label} {isVideo ? 'video' : 'image'}
                        </span>
                        <span className="truncate max-w-[220px] sm:max-w-md font-mono text-[11px] text-neutral-500">
                          {slide.media_url}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: Replace + Toggle + Edit + Delete */}
                  <div className="flex flex-wrap items-center gap-2 self-end lg:self-center shrink-0">
                    <label
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all shadow-2xs ${
                        quickUpload
                          ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
                          : 'bg-neutral-950 hover:bg-black text-white border-neutral-950 cursor-pointer'
                      }`}
                      title={`Replace this ${slide.device} slide's media (MP4 video or JPEG/PNG/WebP image)`}
                    >
                      {isQuickUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <span>{isQuickUploading ? 'Uploading...' : `Replace ${DEVICE_META[slide.device].label} Media`}</span>
                      <input
                        type="file"
                        accept="video/mp4,image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={Boolean(quickUpload)}
                        onChange={(e) => handleQuickReplace(slide, e)}
                      />
                    </label>

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
                        title={slide.is_active ? `Active on ${slide.device} storefront` : `Click to make this the ${slide.device} hero`}
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

                    <button
                      type="button"
                      onClick={() => openEditModal(slide)}
                      className="p-2 bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-800 rounded-xl transition-all cursor-pointer shadow-2xs"
                      title={`Edit ${slide.device} slide`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ id: slide.id, device: slide.device })}
                      className="p-2 bg-white border border-neutral-200 hover:bg-rose-50 hover:border-rose-200 text-neutral-500 hover:text-rose-600 rounded-xl transition-all cursor-pointer shadow-2xs"
                      title={`Delete ${slide.device} slide`}
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

      {/* Add / Edit Slide Modal: ONLY the selected device's fields */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-neutral-200/90 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-admin font-bold text-lg text-neutral-950">
                  {editingSlide ? 'Edit' : 'Add'} {modalMeta.label} Hero Slide
                </h3>
                <p className="text-xs text-neutral-500">{modalMeta.hint}</p>
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

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 uppercase tracking-wider font-admin">
                  <ModalIcon className="w-3.5 h-3.5" />
                  {modalMeta.label} Hero Media (Video or Image) *
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`flex items-center justify-center gap-2 p-3.5 border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50/70 transition-all ${
                    uploadingFile ? 'opacity-60 cursor-not-allowed' : 'hover:border-neutral-900 hover:bg-neutral-50 cursor-pointer'
                  }`}>
                    <Video className="w-4 h-4 text-neutral-600" />
                    <span className="text-xs font-semibold text-neutral-800">Upload Video (.mp4, max 100MB)</span>
                    <input
                      type="file"
                      accept="video/mp4,.mp4"
                      className="hidden"
                      disabled={uploadingFile}
                      onChange={(e) => handleFileUpload(e, 'video')}
                    />
                  </label>

                  <label className={`flex items-center justify-center gap-2 p-3.5 border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50/70 transition-all ${
                    uploadingFile ? 'opacity-60 cursor-not-allowed' : 'hover:border-neutral-900 hover:bg-neutral-50 cursor-pointer'
                  }`}>
                    <ImageIcon className="w-4 h-4 text-neutral-600" />
                    <span className="text-xs font-semibold text-neutral-800">Upload Image (JPEG/PNG/WebP)</span>
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
                    <span>Uploading {modalDevice} media to Supabase CDN... Please wait.</span>
                  </div>
                )}

                <div className="mt-2">
                  <span className="text-[11px] font-semibold text-neutral-400 block mb-1">
                    Or specify direct URL / asset path:
                  </span>
                  <input
                    type="text"
                    value={formData.media_url}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({ ...prev, media_url: val, media_type: typeFromUrl(val) || prev.media_type }));
                    }}
                    placeholder={modalDevice === 'mobile' ? 'https://... or hero/mobile/my-video.mp4' : 'https://... or /assets/video/Hero-section-video-two.mp4'}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all font-mono"
                  />
                  {formData.media_url && !typeFromUrl(formData.media_url) && (
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-neutral-500">
                      <span>This path has no file extension. It is a:</span>
                      {['video', 'image'].map((t) => (
                        <label key={t} className="inline-flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="hero-media-type"
                            checked={formData.media_type === t}
                            onChange={() => setFormData((prev) => ({ ...prev, media_type: t }))}
                          />
                          {t === 'video' ? 'Video' : 'Image'}
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {formData.media_url && (
                  <div className="mt-3 p-3 bg-neutral-100 rounded-xl border border-neutral-200">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-500 mb-2">
                      <span>{modalMeta.label} Live Preview</span>
                      <span className="uppercase font-mono text-[10px]">Type: {formIsVideo ? 'video' : 'image'}</span>
                    </div>
                    <div className={`rounded-lg bg-neutral-900 overflow-hidden relative ${
                      modalDevice === 'mobile' ? 'w-36 aspect-[9/20] mx-auto' : 'w-full aspect-video'
                    }`}>
                      {formIsVideo ? (
                        <video
                          key={formData.media_url}
                          src={getSupabaseMediaUrl(formData.media_url)}
                          className="w-full h-full object-cover"
                          autoPlay
                          muted
                          loop
                          playsInline
                        />
                      ) : (
                        <img
                          key={formData.media_url}
                          src={getSupabaseMediaUrl(formData.media_url)}
                          alt={`${modalDevice} hero preview`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Option: Active or Inactive */}
              <div className="pt-2">
                <label className="text-xs font-bold text-neutral-900 block mb-2">Status Option:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, is_active: true }))}
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
                    onClick={() => setFormData((prev) => ({ ...prev, is_active: false }))}
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
                {formData.is_active && (
                  <p className="text-[11px] text-neutral-500 mt-2">
                    Saving as Active makes this the live {modalDevice} hero and sets the other {modalDevice} slides to inactive. {modalDevice === 'mobile' ? 'Desktop' : 'Mobile'} slides are not affected.
                  </p>
                )}
              </div>

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
                  <span>Save Slide</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-neutral-200/90 rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h3 className="font-admin font-bold text-lg text-neutral-950">
                Delete this {deleteTarget.device} slide?
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                {deleteTarget.device === 'mobile' ? 'Desktop' : 'Mobile'} slides will not be affected. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSlide}
                disabled={deleting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-all shadow-sm cursor-pointer flex items-center gap-2"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Video / Image Preview */}
      {previewMedia && (
        <div
          onClick={() => setPreviewMedia(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl border border-neutral-800 ${
              previewMedia.device === 'mobile' ? 'max-w-sm' : 'max-w-4xl'
            }`}
          >
            <button
              onClick={() => setPreviewMedia(null)}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className={`w-full flex items-center justify-center bg-black ${previewMedia.device === 'mobile' ? 'aspect-[9/20]' : 'aspect-video'}`}>
              {previewMedia.type !== 'image' ? (
                <video src={previewMedia.url} controls autoPlay className="w-full h-full object-contain" />
              ) : (
                <img src={previewMedia.url} alt="Hero Preview" className="w-full h-full object-contain" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
