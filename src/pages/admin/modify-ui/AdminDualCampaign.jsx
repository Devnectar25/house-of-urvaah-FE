import React, { useState, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  Loader2,
  Trash2,
  Plus,
  Eye,
  Layers,
  Database
} from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import { getSupabaseMediaUrl, CDN_BASE_URL } from '../../../lib/supabase';

const SUPABASE_CDN = CDN_BASE_URL || 'https://fhbdceauisvlcpmuzpmf.supabase.co/storage/v1/object/public/houseofurvaah-media';

// Helper to normalize any path to an absolute Supabase CDN URL
const ensureSupabaseUrl = (path) => {
  if (!path || typeof path !== 'string' || path.trim() === '') return '';
  const clean = path.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
  let normalized = clean.replace(/^\/?(assets\/)?/, '');
  if (!normalized.startsWith('Images/') && !normalized.startsWith('products/') && !normalized.startsWith('campaign/')) {
    normalized = `Images/${normalized}`;
  }
  return `${SUPABASE_CDN}/${normalized}`;
};

const SECTION_CONFIGS = [
  {
    key: 'top_left',
    col: 'Left Column',
    posLabel: 'Top Left Card',
    badge: 'L1',
    productHint: 'Product: bs-102 (Blue Co-ord Set)',
    defaultImages: [
      `${SUPABASE_CDN}/Images/Blue_Halter.jpg`,
      `${SUPABASE_CDN}/Images/Blue02.png`,
      `${SUPABASE_CDN}/Images/Blue03.png`
    ]
  },
  {
    key: 'bottom_left',
    col: 'Left Column',
    posLabel: 'Bottom Left Card',
    badge: 'L2',
    productHint: 'Product: bs-104 (Peach Silk Ensemble)',
    defaultImages: [
      `${SUPABASE_CDN}/Images/Peach02.png`,
      `${SUPABASE_CDN}/Images/Peach01.png`,
      `${SUPABASE_CDN}/Images/Peach03.png`
    ]
  },
  {
    key: 'top_right',
    col: 'Right Column',
    posLabel: 'Top Right Card',
    badge: 'R1',
    productHint: 'Product: bs-101 (Brown Tailored Blazer)',
    defaultImages: [
      `${SUPABASE_CDN}/Images/Brown_Floral.jpg`,
      `${SUPABASE_CDN}/Images/Brown02.png`,
      `${SUPABASE_CDN}/Images/Brown03.png`
    ]
  },
  {
    key: 'bottom_right',
    col: 'Right Column',
    posLabel: 'Bottom Right Card',
    badge: 'R2',
    productHint: 'Product: bs-103 (Embroidered Corset Set)',
    defaultImages: [
      `${SUPABASE_CDN}/Images/Corset01.png`,
      `${SUPABASE_CDN}/Images/Corset02.png`,
      `${SUPABASE_CDN}/Images/Corset04.png`
    ]
  }
];

export const AdminDualCampaign = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'left', 'right'
  const [toast, setToast] = useState(null);

  // Loading states per section
  const [savingSections, setSavingSections] = useState({
    top_left: false,
    bottom_left: false,
    top_right: false,
    bottom_right: false
  });
  const [savingAll, setSavingAll] = useState(false);

  // Uploading state: { [sectionKey_slotIndex]: boolean }
  const [uploadingSlots, setUploadingSlots] = useState({});

  // Image form states for all 4 sections (Supabase CDN URLs only)
  const [sections, setSections] = useState({
    top_left: {
      images: SECTION_CONFIGS[0].defaultImages,
      is_active: true
    },
    bottom_left: {
      images: SECTION_CONFIGS[1].defaultImages,
      is_active: true
    },
    top_right: {
      images: SECTION_CONFIGS[2].defaultImages,
      is_active: true
    },
    bottom_right: {
      images: SECTION_CONFIGS[3].defaultImages,
      is_active: true
    }
  });

  // Live preview carousel indices for each section
  const [previewIndices, setPreviewIndices] = useState({
    top_left: 0,
    bottom_left: 0,
    top_right: 0,
    bottom_right: 0
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchBanners = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient('/api/ui/admin/dual-campaign');
      if (res && res.success && Array.isArray(res.data)) {
        const nextSections = { ...sections };

        SECTION_CONFIGS.forEach((cfg) => {
          const item = res.data.find(
            (b) =>
              b.position === cfg.key ||
              (cfg.key === 'top_left' && b.position === 'left') ||
              (cfg.key === 'top_right' && b.position === 'right')
          );

          if (item) {
            let itemImages = [];
            if (Array.isArray(item.images) && item.images.length > 0) {
              itemImages = item.images.filter(Boolean).map(ensureSupabaseUrl);
            } else if (item.image) {
              itemImages = [ensureSupabaseUrl(item.image)];
            } else {
              itemImages = cfg.defaultImages;
            }

            nextSections[cfg.key] = {
              images: itemImages.length > 0 ? itemImages : cfg.defaultImages,
              is_active: item.is_active ?? true
            };
          }
        });

        setSections(nextSections);
      } else {
        throw new Error(res?.message || 'Failed to load campaign sections');
      }
    } catch (err) {
      console.error('Error fetching campaign sections:', err);
      setError(err.message || 'Could not connect to API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Live crossfade simulation for previews in admin cards (2.5s cycle)
  useEffect(() => {
    const timer = setInterval(() => {
      setPreviewIndices((prev) => {
        const next = { ...prev };
        SECTION_CONFIGS.forEach((cfg) => {
          const count = sections[cfg.key]?.images?.length || 1;
          next[cfg.key] = (prev[cfg.key] + 1) % count;
        });
        return next;
      });
    }, 2500);
    return () => clearInterval(timer);
  }, [sections]);

  // Update specific image URL in slot (ensuring Supabase CDN URL)
  const handleImageUrlChange = (sectionKey, slotIndex, url) => {
    setSections((prev) => {
      const curImages = [...(prev[sectionKey]?.images || [])];
      curImages[slotIndex] = url ? ensureSupabaseUrl(url) : '';
      return {
        ...prev,
        [sectionKey]: {
          ...prev[sectionKey],
          images: curImages
        }
      };
    });
  };

  // Add new image slot (up to 3)
  const handleAddImageSlot = (sectionKey) => {
    const curImages = sections[sectionKey]?.images || [];
    if (curImages.length >= 3) {
      showToast('error', 'Maximum 3 images allowed per section.');
      return;
    }
    setSections((prev) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        images: [...curImages, '']
      }
    }));
  };

  // Remove image slot
  const handleRemoveImageSlot = (sectionKey, slotIndex) => {
    const curImages = sections[sectionKey]?.images || [];
    if (curImages.length <= 1) {
      showToast('error', 'Each section must have at least one image slot.');
      return;
    }
    const nextImages = curImages.filter((_, idx) => idx !== slotIndex);
    setSections((prev) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        images: nextImages
      }
    }));
    setPreviewIndices((prev) => ({ ...prev, [sectionKey]: 0 }));
  };

  // Upload replacement image file directly to Supabase Storage CDN
  const handleUploadImageFile = async (e, sectionKey, slotIndex) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please select a valid image (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showToast('error', 'Image size must be smaller than 15MB.');
      return;
    }

    const uploadKey = `${sectionKey}_${slotIndex}`;
    setUploadingSlots((prev) => ({ ...prev, [uploadKey]: true }));

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('folder', 'campaign');

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

      const uploadedUrl = data.url || data.filePath || data.data?.url;
      if (!uploadedUrl) throw new Error('No Supabase CDN URL returned by server');

      const finalSupabaseUrl = ensureSupabaseUrl(uploadedUrl);
      handleImageUrlChange(sectionKey, slotIndex, finalSupabaseUrl);
      showToast('success', `Slide image ${slotIndex + 1} uploaded to Supabase CDN!`);
    } catch (err) {
      console.error('Upload error:', err);
      showToast('error', err.message || 'Image upload failed');
    } finally {
      setUploadingSlots((prev) => ({ ...prev, [uploadKey]: false }));
      e.target.value = '';
    }
  };

  // Save single section to database
  const handleSaveSection = async (sectionKey) => {
    const data = sections[sectionKey];
    const validImages = (data.images || [])
      .map((img) => (img ? ensureSupabaseUrl(img) : ''))
      .filter(Boolean);

    if (validImages.length === 0) {
      showToast('error', 'Please provide at least one valid Supabase image.');
      return;
    }

    setSavingSections((prev) => ({ ...prev, [sectionKey]: true }));

    try {
      const payload = {
        image: validImages[0],
        images: validImages,
        is_active: data.is_active
      };

      const res = await apiClient(`/api/ui/admin/dual-campaign/${sectionKey}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (!res?.success) throw new Error(res?.message || 'Update failed');
      showToast('success', `${sectionKey.replace('_', ' ').toUpperCase()} images saved to Supabase!`);
    } catch (err) {
      console.error(`Error saving ${sectionKey}:`, err);
      showToast('error', err.message || `Failed to save ${sectionKey}`);
    } finally {
      setSavingSections((prev) => ({ ...prev, [sectionKey]: false }));
    }
  };

  // Save all 4 sections at once
  const handleSaveAll = async () => {
    setSavingAll(true);
    let successCount = 0;
    try {
      for (const cfg of SECTION_CONFIGS) {
        const data = sections[cfg.key];
        const validImages = (data.images || [])
          .map((img) => (img ? ensureSupabaseUrl(img) : ''))
          .filter(Boolean);
        if (validImages.length === 0) continue;

        const payload = {
          image: validImages[0],
          images: validImages,
          is_active: data.is_active
        };

        const res = await apiClient(`/api/ui/admin/dual-campaign/${cfg.key}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        if (res?.success) successCount++;
      }
      showToast('success', `Saved ${successCount} of 4 campaign sections to Supabase!`);
    } catch (err) {
      console.error('Error saving all sections:', err);
      showToast('error', err.message || 'Failed to save all sections');
    } finally {
      setSavingAll(false);
    }
  };

  // Filter sections by selected column tab
  const displayedConfigs = SECTION_CONFIGS.filter((cfg) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'left') return cfg.col === 'Left Column';
    if (activeTab === 'right') return cfg.col === 'Right Column';
    return true;
  });

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
            <span className="text-xs text-neutral-400">•</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              <Database className="w-3 h-3" />
              <span>Supabase Storage CDN</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-admin font-bold text-neutral-950 tracking-tight mt-1">
            Dual Campaign Banner
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-sans mt-1">
            Manage the 4 campaign banner cards (Left Column Top & Bottom, Right Column Top & Bottom). All images are loaded directly from Supabase Storage with up to 3 crossfading slides per section.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchBanners}
            disabled={loading || savingAll}
            className="p-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-2 text-xs font-semibold"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-neutral-900' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={loading || savingAll}
            className="px-4 py-2.5 bg-neutral-950 hover:bg-neutral-800 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-all shadow-sm cursor-pointer flex items-center gap-2"
          >
            {savingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save All 4 Sections</span>
          </button>
        </div>
      </div>

      {/* Column Filter Tabs */}
      <div className="flex items-center gap-2 p-1 bg-neutral-100/80 rounded-xl w-fit border border-neutral-200/60">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'all'
              ? 'bg-white text-neutral-950 shadow-2xs'
              : 'text-neutral-600 hover:text-neutral-950'
          }`}
        >
          All 4 Sections
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('left')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'left'
              ? 'bg-white text-neutral-950 shadow-2xs'
              : 'text-neutral-600 hover:text-neutral-950'
          }`}
        >
          Left Column (Top & Bottom)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('right')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'right'
              ? 'bg-white text-neutral-950 shadow-2xs'
              : 'text-neutral-600 hover:text-neutral-950'
          }`}
        >
          Right Column (Top & Bottom)
        </button>
      </div>

      {loading ? (
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-16 flex flex-col items-center justify-center text-neutral-400 space-y-3">
          <Loader2 className="w-7 h-7 animate-spin text-neutral-900" />
          <p className="text-xs font-medium">Loading campaign sections from Supabase...</p>
        </div>
      ) : error ? (
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-12 text-center text-rose-600 space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto" />
          <p className="text-sm font-semibold">{error}</p>
          <button
            onClick={fetchBanners}
            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold"
          >
            Try Again
          </button>
        </div>
      ) : (
        /* Grid of 4 Campaign Banner Cards */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {displayedConfigs.map((cfg) => {
            const data = sections[cfg.key] || {};
            const curImages = data.images || [];
            const activePreviewIdx = previewIndices[cfg.key] || 0;
            const isSaving = savingSections[cfg.key];

            return (
              <div
                key={cfg.key}
                className="bg-white border border-neutral-200/90 rounded-2xl shadow-2xs overflow-hidden flex flex-col transition-all hover:border-neutral-300"
              >
                {/* Section Header */}
                <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center text-xs font-bold font-mono">
                      {cfg.badge}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-admin font-bold text-neutral-950 uppercase tracking-wider">
                          {cfg.posLabel}
                        </h2>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-200/70 font-semibold text-neutral-700">
                          {cfg.col}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                        {cfg.productHint}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      data.is_active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {data.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <div className="p-6 space-y-6 flex-1">
                  {/* Clean Visual Crossfade Preview (No fake text overlay) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-neutral-900 uppercase tracking-wider font-admin flex items-center gap-2">
                        <Eye className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Live Crossfade Preview ({curImages.length} Supabase images)</span>
                      </label>
                      <span className="text-[10px] text-neutral-400 font-medium">
                        Auto-crossfades every 2.5s
                      </span>
                    </div>

                    <div className="w-full h-80 rounded-xl bg-neutral-900 border border-neutral-200 overflow-hidden relative group select-none">
                      {curImages.length > 0 ? (
                        curImages.map((src, i) => (
                          <img
                            key={`${src}-${i}`}
                            src={src ? ensureSupabaseUrl(src) : ''}
                            alt={`Preview ${i}`}
                            className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-1000 ease-in-out ${
                              i === activePreviewIdx ? 'opacity-100' : 'opacity-0'
                            }`}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `${SUPABASE_CDN}/Images/Blue02.png`;
                            }}
                          />
                        ))
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 bg-neutral-100">
                          <ImageIcon className="w-8 h-8 mb-1" />
                          <span className="text-xs">No images configured</span>
                        </div>
                      )}

                      {/* Clickable Slide Indicator Dots */}
                      {curImages.length > 1 && (
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full z-10 shadow-sm">
                          {curImages.map((_, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setPreviewIndices((prev) => ({ ...prev, [cfg.key]: i }))}
                              className={`h-2 rounded-full transition-all cursor-pointer ${
                                i === activePreviewIdx ? 'w-4 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
                              }`}
                              title={`View slide ${i + 1}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Supabase Storage Images Management (Up to 3 Slots) */}
                  <div className="space-y-3 bg-neutral-50/70 p-4 rounded-xl border border-neutral-200/70">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-neutral-700" />
                        <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider font-admin">
                          Supabase Media Slides ({curImages.length} of 3)
                        </span>
                      </div>
                      {curImages.length < 3 && (
                        <button
                          type="button"
                          onClick={() => handleAddImageSlot(cfg.key)}
                          className="px-2.5 py-1 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Slide ({curImages.length + 1}/3)</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {curImages.map((imgUrl, slotIdx) => {
                        const uploadKey = `${cfg.key}_${slotIdx}`;
                        const isUploading = uploadingSlots[uploadKey];

                        return (
                          <div
                            key={slotIdx}
                            className="p-3 bg-white border border-neutral-200 rounded-xl space-y-2.5 relative group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md bg-neutral-100 border border-neutral-200 flex items-center justify-center font-mono text-[10px]">
                                  {slotIdx + 1}
                                </span>
                                {slotIdx === 0 ? 'Slide 1 (Primary / Cover)' : `Slide ${slotIdx + 1}`}
                              </span>

                              {curImages.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImageSlot(cfg.key, slotIdx)}
                                  className="text-neutral-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                                  title="Remove this slide"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <div className="flex gap-3 items-center">
                              {/* Thumbnail preview */}
                              <div className="w-12 h-14 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0 relative">
                                {imgUrl ? (
                                  <img
                                    src={ensureSupabaseUrl(imgUrl)}
                                    alt={`Slide ${slotIdx + 1}`}
                                    className="w-full h-full object-cover object-top"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = `${SUPABASE_CDN}/Images/Blue02.png`;
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                    <ImageIcon className="w-4 h-4" />
                                  </div>
                                )}
                              </div>

                              {/* Controls */}
                              <div className="flex-1 space-y-1.5">
                                <input
                                  type="text"
                                  value={imgUrl}
                                  onChange={(e) => handleImageUrlChange(cfg.key, slotIdx, e.target.value)}
                                  placeholder="https://fhbdceauisvlcpmuzpmf.supabase.co/..."
                                  className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 font-mono truncate"
                                />

                                <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors">
                                  <Upload className="w-3 h-3" />
                                  <span>{isUploading ? 'Uploading to Supabase...' : 'Upload Image File'}</span>
                                  <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    disabled={isUploading}
                                    onChange={(e) => handleUploadImageFile(e, cfg.key, slotIdx)}
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Storefront Toggle */}
                  <div className="flex items-center gap-3 pt-1">
                    <input
                      type="checkbox"
                      id={`active_${cfg.key}`}
                      checked={data.is_active}
                      onChange={(e) =>
                        setSections((prev) => ({
                          ...prev,
                          [cfg.key]: {
                            ...prev[cfg.key],
                            is_active: e.target.checked
                          }
                        }))
                      }
                      className="w-4 h-4 rounded text-neutral-950 focus:ring-neutral-900 border-neutral-300 cursor-pointer"
                    />
                    <label htmlFor={`active_${cfg.key}`} className="text-xs font-bold text-neutral-900 cursor-pointer">
                      Display {cfg.posLabel} on Storefront
                    </label>
                  </div>
                </div>

                {/* Section Footer / Save Button */}
                <div className="p-5 border-t border-neutral-100 bg-neutral-50/50 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSaveSection(cfg.key)}
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-800 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-all shadow-sm cursor-pointer flex items-center gap-2"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save {cfg.posLabel}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
