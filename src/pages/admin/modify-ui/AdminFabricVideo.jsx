import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  Loader2,
  Upload,
  ExternalLink,
  Film,
  Sparkles,
  Layers,
  Eye,
  Type,
  Link2,
  RotateCcw,
  Play,
  Pause,
  Clock,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { apiClient, getAdminAuthToken } from '../../../lib/apiClient';
import { AdminPageHeader } from '../../../components/admin/AdminPageHeader';
import Swal from 'sweetalert2';
import { uploadVideoDirect } from '../../../lib/directVideoUpload';
import { FabricProductPicker } from '../../../components/admin/FabricProductPicker';

// Helper to safely inspect video duration client-side before upload without hanging
const getVideoDuration = (file) => {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      const objectUrl = URL.createObjectURL(file);

      let isCleaned = false;
      const cleanUp = () => {
        if (!isCleaned) {
          isCleaned = true;
          try {
            URL.revokeObjectURL(objectUrl);
          } catch (_) {}
        }
      };

      // 2-second timeout to ensure upload NEVER hangs on mobile or non-standard codecs
      const timeoutId = setTimeout(() => {
        cleanUp();
        resolve(0);
      }, 2000);

      video.onloadedmetadata = () => {
        clearTimeout(timeoutId);
        const duration = video.duration;
        cleanUp();
        if (typeof duration === 'number' && !isNaN(duration) && isFinite(duration)) {
          resolve(duration);
        } else {
          resolve(0);
        }
      };

      video.onerror = () => {
        clearTimeout(timeoutId);
        cleanUp();
        resolve(0);
      };

      video.src = objectUrl;
    } catch (err) {
      resolve(0);
    }
  });
};

const DEFAULT_VIDEOS = [
  {
    id: 'blush-pink',
    tag: 'PETAL THREADWORK',
    slug: 'petal-threadwork',
    fabric_slug: 'petal-threadwork',
    title: 'Blush Pink Embroidered Floral Co-Ord Set',
    video_url: 'https://fhbdceauisvlcpmuzpmf.supabase.co/storage/v1/object/public/houseofurvaah-media/videos/Blush%20Pink%20Embroidered%20Floral%20Co-Ord%20Set_h264.mp4',
    badge: 'Card 1 (Left)',
    slotLabel: 'Left Video Card'
  },
  {
    id: 'mocha-brown',
    tag: 'HERITAGE WEAVE',
    slug: 'heritage-weave',
    fabric_slug: 'heritage-weave',
    title: 'Mocha Brown Embroidered Co-Ord Set',
    video_url: 'https://fhbdceauisvlcpmuzpmf.supabase.co/storage/v1/object/public/houseofurvaah-media/videos/Mocha%20Brown%20Embroidered%20Co-Ord%20Set_h264.mp4',
    badge: 'Card 2 (Center)',
    slotLabel: 'Center Video Card'
  },
  {
    id: 'teal',
    tag: 'OCEAN BLOOM',
    slug: 'ocean-bloom',
    fabric_slug: 'ocean-bloom',
    title: 'Teal Embroidered Floral Co-Ord Set',
    video_url: 'https://fhbdceauisvlcpmuzpmf.supabase.co/storage/v1/object/public/houseofurvaah-media/videos/Teal%20Embroidered%20Floral%20Co-Ord%20Set_h264.mp4',
    badge: 'Card 3 (Right)',
    slotLabel: 'Right Video Card'
  }
];

export const AdminFabricVideo = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [videoDurations, setVideoDurations] = useState({});

  // 3 Videos State
  const [videos, setVideos] = useState(DEFAULT_VIDEOS);

  // Editorial Copy State
  const [editorial, setEditorial] = useState({
    subheading: 'EDITORIAL VISION',
    heading: 'LUXURY TEXTILE ARTISTRY',
    description: 'Discover the sensory elegance of our mastercrafted fabrics: mulberry silk, structured linens, and couture jacquards.',
    button_text: 'EXPLORE FABRICS',
    button_link: '/explore-fabrics',
    secondary_button_text: 'VIEW CAMPAIGN FILM',
    secondary_button_link: '#campaign',
    is_active: true
  });

  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRefs = useRef([]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchFabricVideo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient('/api/ui/admin/fabric-video');
      if (res && res.success && res.data) {
        const data = res.data;

        // Populate up to 10 Videos from backend
        if (Array.isArray(data.videos) && data.videos.length > 0) {
          setVideos(
            data.videos.slice(0, 10).map((incoming, idx) => ({
              id: incoming.id || `video-${idx + 1}`,
              tag: incoming.tag !== undefined ? incoming.tag : '',
              title: incoming.title !== undefined ? incoming.title : (incoming.name !== undefined ? incoming.name : ''),
              video_url: incoming.video_url !== undefined ? incoming.video_url : (incoming.url !== undefined ? incoming.url : ''),
              badge: `Card ${idx + 1}`,
              slotLabel: incoming.title || `Video Card ${idx + 1}`
            }))
          );
        } else {
          setVideos(DEFAULT_VIDEOS);
        }

        // Populate Editorial text
        setEditorial({
          subheading: data.subheading || 'EDITORIAL VISION',
          heading: data.heading || 'LUXURY TEXTILE ARTISTRY',
          description: data.description || 'Discover the sensory elegance of our mastercrafted fabrics: mulberry silk, structured linens, and couture jacquards.',
          button_text: data.button_text || 'EXPLORE FABRICS',
          button_link: data.button_link || '/clothing',
          secondary_button_text: data.secondary_button_text || 'VIEW CAMPAIGN FILM',
          secondary_button_link: data.secondary_button_link || '#campaign',
          is_active: data.is_active ?? true
        });
      } else {
        throw new Error(res?.message || 'Failed to fetch fabric video configuration');
      }
    } catch (err) {
      console.error('Error fetching fabric video:', err);
      setError(err.message || 'Could not connect to API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFabricVideo();
  }, []);

  // Core persistence function used both on explicit save and auto-save on video upload
  const persistFabricConfig = async (videosList, editorialConfig) => {
    const listToSave = (videosList || videos).slice(0, 10).map((v, idx) => {
      const tag = typeof v?.tag === 'string' ? v.tag.trim() : '';
      const derivedSlug =
        v?.slug ||
        v?.fabric_slug ||
        (tag ? tag.toLowerCase().replace(/[^a-z0-9]+/g, '-') : (v?.id || `fabric-${idx + 1}`));
      return {
        id: v?.id || `video-${idx + 1}`,
        tag,
        slug: derivedSlug,
        fabric_slug: derivedSlug,
        title: v?.title || '',
        video_url: v?.video_url || '',
        description: v?.description || ''
      };
    });

    const ed = editorialConfig || editorial;
    const payload = {
      subheading: ed.subheading,
      heading: ed.heading,
      description: ed.description,
      button_text: ed.button_text,
      button_link: ed.button_link,
      secondary_button_text: ed.secondary_button_text,
      secondary_button_link: ed.secondary_button_link,
      is_active: ed.is_active,
      video_url: listToSave[0]?.video_url || '',
      videos: listToSave
    };

    const res = await apiClient('/api/ui/admin/fabric-video', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    if (!res?.success) throw new Error(res?.message || 'Update failed');

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('urvaah_fabric_video_updated'));
      localStorage.setItem('urvaah_fabric_video_last_update', Date.now().toString());
    }

    return res;
  };

  // Handle Video file upload for a specific card slot
  const handleVideoUpload = async (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const isVideo = (file.type && file.type.startsWith('video/')) || 
      Boolean(file.name && file.name.match(/\.(mp4|webm|mov|m4v|ogg|mkv|avi)$/i));
    if (!isVideo) {
      showToast('error', 'Please select a valid video file (MP4, WebM, QuickTime MOV, M4V).');
      return;
    }

    if (file.size > 250 * 1024 * 1024) {
      showToast('error', `Video size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds 250MB limit.`);
      return;
    }

    // 1. Instant zero-delay local preview: user immediately sees the video playing in this card!
    const localBlobUrl = URL.createObjectURL(file);
    setVideos((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], video_url: localBlobUrl };
      return next;
    });

    // 2. Non-blocking duration extraction
    getVideoDuration(file).then((dur) => {
      if (dur > 0) {
        setVideoDurations((prev) => ({ ...prev, [index]: dur }));
      }
    });

    setUploadingIndex(index);
    try {
      const uploadedUrl = await uploadVideoDirect(file, 'fabric/videos');

      // Update state with permanent remote URL
      const updatedVideos = videos.slice(0, 10).map((v, idx) => {
        if (idx === index) {
          return { ...v, video_url: uploadedUrl };
        }
        return v;
      });
      setVideos(updatedVideos);

      // Auto-persist directly to database so it's guaranteed saved
      try {
        await persistFabricConfig(updatedVideos, editorial);
        showToast('success', `Video ${index + 1} (${videos[index]?.tag || 'Card'}) uploaded & saved to live storefront!`);
      } catch (saveErr) {
        showToast('success', `Video ${index + 1} uploaded! Remember to click "Save All Changes".`);
      }
    } catch (err) {
      console.error('Video upload error:', err);
      setUploadError(err.message || 'Upload failed');
      showToast('error', err.message || 'Video upload failed');
    } finally {
      setUploadingIndex(null);
      if (e.target) e.target.value = '';
    }
  };

  const previewCarouselRef = useRef(null);

  const scrollPreviewPrev = () => {
    const el = previewCarouselRef.current;
    if (!el) return;
    const card = el.querySelector('[data-preview-card]');
    const cardWidth = card ? card.offsetWidth : 160;
    const scrollAmount = cardWidth + 8;
    if (el.scrollLeft <= 15) {
      el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
    } else {
      el.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollPreviewNext = () => {
    const el = previewCarouselRef.current;
    if (!el) return;
    const card = el.querySelector('[data-preview-card]');
    const cardWidth = card ? card.offsetWidth : 160;
    const scrollAmount = cardWidth + 8;
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 20) {
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleAddVideo = () => {
    if (videos.length >= 10) {
      showToast('error', 'Maximum limit of 10 videos reached.');
      return;
    }
    const nextNum = videos.length + 1;
    const newVideo = {
      id: `video-${Date.now()}-${nextNum}`,
      tag: `COLLECTION ${nextNum}`,
      title: `Fabric Showcase ${nextNum}`,
      video_url: '',
      badge: `Card ${nextNum}`,
      slotLabel: `Video Card ${nextNum}`
    };
    setVideos((prev) => [...prev, newVideo]);
    showToast('success', `Added Video Card ${nextNum}. Upload a video or enter a URL.`);
  };

  const handleRemoveVideo = async (index) => {
    if (videos.length <= 1) {
      showToast('error', 'You must keep at least 1 video card.');
      return;
    }
    const cardTitle = videos[index]?.title || `Card ${index + 1}`;
    const result = await Swal.fire({
      title: 'Remove Video Card?',
      text: `Are you sure you want to remove "${cardTitle}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#737373',
      confirmButtonText: 'Yes, Remove',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-2xl shadow-2xl font-admin border border-neutral-200',
        title: 'text-base font-bold text-neutral-900',
        confirmButton: 'rounded-xl text-xs font-bold uppercase tracking-wider px-5 py-2.5 shadow-sm',
        cancelButton: 'rounded-xl text-xs font-semibold px-4 py-2.5'
      }
    });

    if (!result.isConfirmed) return;

    setVideos((prev) => prev.filter((_, idx) => idx !== index));
    setVideoDurations((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    showToast('success', `Removed video card. Remember to click 'Save All Changes'.`);
  };

  const handleMoveVideo = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= videos.length) return;
    setVideos((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const handleVideoFieldChange = (index, field, value) => {
    setVideos((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleResetToDefaults = async () => {
    const confirmResult = await Swal.fire({
      title: 'Reset to Defaults?',
      text: 'Reset all videos and editorial text to the default curated values?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#171717',
      cancelButtonColor: '#737373',
      confirmButtonText: 'Yes, Reset',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-2xl shadow-2xl font-admin border border-neutral-200',
        title: 'text-base font-bold text-neutral-900',
        confirmButton: 'rounded-xl text-xs font-bold uppercase tracking-wider px-5 py-2.5 shadow-sm',
        cancelButton: 'rounded-xl text-xs font-semibold px-4 py-2.5'
      }
    });

    if (!confirmResult.isConfirmed) return;

    setVideos(DEFAULT_VIDEOS);
    setEditorial({
      subheading: 'EDITORIAL VISION',
      heading: 'LUXURY TEXTILE ARTISTRY',
      description: 'Discover the sensory elegance of our mastercrafted fabrics: mulberry silk, structured linens, and couture jacquards.',
      button_text: 'EXPLORE FABRICS',
      button_link: '/explore-fabrics',
      secondary_button_text: 'VIEW CAMPAIGN FILM',
      secondary_button_link: '#campaign',
      is_active: true
    });
    showToast('success', 'Reset to defaults. Remember to click Save Changes to persist.');
  };

  const handleSaveConfig = async (e) => {
    if (e) e.preventDefault();

    setSaving(true);
    try {
      await persistFabricConfig(videos, editorial);
      showToast('success', `${videos.length} Fabric Videos & Editorial settings saved successfully!`);
    } catch (err) {
      console.error('Save fabric video error:', err);
      showToast('error', err.message || 'Failed to update fabric video');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
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
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase bg-white/90 border border-[#E5E0D5] text-neutral-800 shadow-2xs">
              Edit Home page
            </span>
            <span className="text-xs text-neutral-400">•</span>
            <span className="text-xs font-semibold text-neutral-600">Storefront Section</span>
            <span className="text-xs text-neutral-400">•</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-800 bg-neutral-100 border border-neutral-300 px-2 py-0.5 rounded-md">
              <Film className="w-3 h-3 text-neutral-700" />
              <span>Up to 10 Videos Showcase Carousel</span>
            </span>
          </div>
        }
        title="Fabric Video Section"
        subtitle="Manage up to 10 vertical fabric showcase videos and the editorial narrative & buttons."
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="px-3 py-2 bg-white border border-[#E5E0D5] hover:bg-neutral-100 text-neutral-700 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 text-xs font-semibold"
              title="Reset to default 3 videos and copy"
            >
              <RotateCcw className="w-3.5 h-3.5 text-neutral-600" />
              <span>Defaults</span>
            </button>
            <button
              type="button"
              onClick={fetchFabricVideo}
              disabled={loading}
              className="p-2.5 bg-white border border-[#E5E0D5] hover:bg-neutral-50 text-neutral-700 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-2 text-xs font-semibold"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-neutral-900' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={saving}
              className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-2 text-xs font-bold"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4 text-white" />}
              <span>Save All Changes</span>
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-16 flex flex-col items-center justify-center text-neutral-400 space-y-3">
          <Loader2 className="w-7 h-7 animate-spin text-neutral-900" />
          <p className="text-xs font-medium">Loading fabric video configuration...</p>
        </div>
      ) : error ? (
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-12 text-center text-rose-600 space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto" />
          <p className="text-sm font-semibold">{error}</p>
          <button
            onClick={fetchFabricVideo}
            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Upload Error Alert */}
          {uploadError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* LIVE SECTION PREVIEW ACCORDION (Matches Storefront bg-brand-sand) */}
          <div className="bg-[#F5F5F0] border border-[#E5E5DE] rounded-2xl p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-xs font-admin font-bold tracking-wider uppercase text-neutral-900">
                  Live Storefront Visual Preview
                </h3>
                <span className="text-[10px] font-mono text-neutral-500 bg-neutral-200/80 px-2 py-0.5 rounded-md">
                  {videos.length} {videos.length === 1 ? 'Video' : 'Videos'}
                </span>
              </div>
              <span className="text-[11px] font-medium text-neutral-500">
                Exact replica of homepage Fabric Video section (Use arrows to slide)
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left Videos Carousel Preview */}
              <div className="lg:col-span-8 bg-[#F5F5F0] p-1.5 sm:p-2 rounded-sm border border-[#EBEBE6] relative group/preview overflow-hidden">
                {/* Preview Navigation Arrows */}
                {videos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={scrollPreviewPrev}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-neutral-900 shadow-md border border-neutral-300 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer"
                      title="Preview previous video"
                    >
                      <ChevronLeft className="w-4 h-4 text-neutral-900" />
                    </button>
                    <button
                      type="button"
                      onClick={scrollPreviewNext}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-neutral-900 shadow-md border border-neutral-300 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer"
                      title="Preview next video"
                    >
                      <ChevronRight className="w-4 h-4 text-neutral-900" />
                    </button>
                  </>
                )}

                <div
                  ref={previewCarouselRef}
                  className="flex gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none py-0.5"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {videos.map((vid, idx) => (
                    <div
                      key={vid.id || idx}
                      data-preview-card="true"
                      className="relative flex-shrink-0 w-[calc(33.333%-6px)] snap-start aspect-[9/14] overflow-hidden bg-neutral-900 rounded-sm shadow-xs group"
                    >
                      {/* Top Tag Badge */}
                      <div className="absolute top-2 left-2 z-20 bg-white/95 backdrop-blur-xs px-2 py-0.5 text-[7px] sm:text-[8px] md:text-[9px] tracking-[0.2em] font-serif uppercase text-neutral-900 shadow-xs pointer-events-none select-none truncate max-w-[85%]">
                        {vid.tag || `VIDEO ${idx + 1}`}
                      </div>

                      {/* Video Player */}
                      {vid.video_url ? (
                        <video
                          key={vid.video_url}
                          src={vid.video_url}
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-neutral-400">
                          <Video className="w-6 h-6 mb-1 opacity-50" />
                          <span className="text-[9px]">No Video</span>
                        </div>
                      )}

                      {/* Bottom Caption Overlay */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent pt-8 pb-2 px-1.5 sm:px-2 flex flex-col justify-end text-center pointer-events-none z-10">
                        <span className="font-serif text-[8px] sm:text-[9.5px] text-white/95 uppercase tracking-wider leading-tight line-clamp-2">
                          {vid.title || `Video ${idx + 1}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Editorial Copy Preview */}
              <div className="lg:col-span-4 px-3 sm:px-5 py-2 space-y-3 font-serif">
                <span className="text-[10px] tracking-[0.25em] uppercase text-neutral-500 block">
                  {editorial.subheading || 'EDITORIAL VISION'}
                </span>
                <h4 className="text-xl sm:text-2xl tracking-[0.1em] text-neutral-950 uppercase font-serif font-normal leading-tight">
                  {editorial.heading || 'LUXURY TEXTILE ARTISTRY'}
                </h4>
                <p className="text-xs text-neutral-600 tracking-wider leading-relaxed font-light">
                  {editorial.description || 'Discover the sensory elegance of our mastercrafted fabrics: mulberry silk, structured linens, and couture jacquards.'}
                </p>
                <div className="flex items-center gap-2.5 pt-2 flex-wrap">
                  <span className="px-3.5 py-1.5 bg-neutral-950 text-white text-[10px] tracking-widest uppercase font-sans font-semibold">
                    {editorial.button_text || 'EXPLORE FABRICS'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* EDIT FORM GRID: UP TO 10 VIDEO CARDS */}
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <h3 className="text-xs sm:text-sm font-admin font-bold text-neutral-950 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-neutral-700" />
                  <span>Fabric Showcase Videos</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-neutral-200 text-neutral-800 text-xs font-bold font-mono">
                  {videos.length} / 10 Max
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-neutral-500 hidden md:inline">
                  Upload up to 10 showcase videos
                </span>
                {videos.length < 10 ? (
                  <button
                    type="button"
                    onClick={handleAddVideo}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Video ({videos.length}/10)</span>
                  </button>
                ) : (
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                    10/10 Videos (Limit Reached)
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
              {videos.map((vid, idx) => {
                const isUploading = uploadingIndex === idx;

                  return (
                    <div
                      key={vid.id || idx}
                      className="bg-white border border-neutral-200/90 rounded-2xl shadow-2xs overflow-hidden flex flex-col"
                    >
                      {/* Card Header Bar */}
                      <div className="p-4 bg-[#F8FAFC] border-b border-neutral-200/80 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-neutral-950 text-white text-xs font-bold flex items-center justify-center font-mono">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-neutral-900 block leading-tight font-admin">
                              {vid.slotLabel || `Video Card ${idx + 1}`}
                            </span>
                            <span className="text-[10px] text-neutral-500 font-mono">
                              Card {idx + 1} of {videos.length}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Reorder Buttons */}
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleMoveVideo(idx, -1)}
                              className="p-1.5 hover:bg-neutral-200 rounded-lg text-neutral-600 transition-colors cursor-pointer"
                              title="Move left / earlier in carousel"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {idx < videos.length - 1 && (
                            <button
                              type="button"
                              onClick={() => handleMoveVideo(idx, 1)}
                              className="p-1.5 hover:bg-neutral-200 rounded-lg text-neutral-600 transition-colors cursor-pointer"
                              title="Move right / later in carousel"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Remove Button */}
                          {videos.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveVideo(idx)}
                              className="p-1.5 hover:bg-rose-100 rounded-lg text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer ml-1"
                              title="Remove this video card"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Video Duration Status Strip */}
                      <div className="px-4 py-2 bg-neutral-50/70 border-b border-neutral-100 flex items-center justify-between">
                        <span className="text-[10px] text-neutral-500 font-medium">Duration:</span>
                        {videoDurations[idx] !== undefined ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 bg-neutral-100 text-neutral-700 border border-neutral-200">
                            <Clock className="w-3 h-3 text-neutral-500" />
                            <span>{videoDurations[idx].toFixed(1)}s</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-500 border border-neutral-200 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-neutral-400" />
                            <span>Auto-detected</span>
                          </span>
                        )}
                      </div>

                      {/* Video Card Player Preview */}
                      <div className="p-4 space-y-4 flex-1 flex flex-col">
                        <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-neutral-950 border border-neutral-200 shadow-inner flex items-center justify-center group">
                          {vid.video_url ? (
                            <video
                              key={vid.video_url}
                              src={vid.video_url}
                              controls
                              muted
                              loop
                              playsInline
                              preload="metadata"
                              onLoadedMetadata={(e) => {
                                const dur = e.currentTarget.duration;
                                if (typeof dur === 'number' && !isNaN(dur) && isFinite(dur)) {
                                  setVideoDurations((prev) => ({ ...prev, [idx]: dur }));
                                }
                              }}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center text-neutral-500 p-4 space-y-2">
                              <Video className="w-8 h-8 mx-auto text-neutral-500 stroke-[1.5]" />
                              <p className="text-xs font-semibold">No video loaded</p>
                              <p className="text-[10px] text-neutral-400">Upload MP4 or paste link below</p>
                            </div>
                          )}

                          {/* Tag Overlay preview */}
                          {vid.tag && (
                            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-white/95 text-neutral-950 text-[8px] font-bold uppercase tracking-wider shadow-xs pointer-events-none">
                              {vid.tag}
                            </span>
                          )}

                          {/* Uploading progress overlay */}
                          {isUploading && (
                            <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white p-4 text-center">
                              <Loader2 className="w-8 h-8 animate-spin text-white" />
                              <span className="text-xs font-bold tracking-wider uppercase font-admin">Uploading Video...</span>
                              <span className="text-[10px] text-neutral-300">Saving to cloud storage</span>
                            </div>
                          )}
                        </div>

                        {/* Video Controls & Inputs */}
                        <div className="space-y-3.5 flex-1 flex flex-col justify-between">
                          {/* Tag / Category Badge */}
                          <div>
                            <label className="block text-[11px] font-bold text-neutral-800 uppercase tracking-wider mb-1 font-admin">
                              Top Tag / Badge Label
                            </label>
                            <input
                              type="text"
                              value={vid.tag}
                              onChange={(e) => handleVideoFieldChange(idx, 'tag', e.target.value)}
                              placeholder="e.g. PETAL THREADWORK"
                              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all font-admin uppercase"
                            />
                          </div>

                          {/* Product / Fabric Title */}
                          <div>
                            <label className="block text-[11px] font-bold text-neutral-800 uppercase tracking-wider mb-1 font-admin">
                              Video Title / Caption
                            </label>
                            <input
                              type="text"
                              value={vid.title}
                              onChange={(e) => handleVideoFieldChange(idx, 'title', e.target.value)}
                              placeholder="e.g. Blush Pink Embroidered Floral Co-Ord Set"
                              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all font-serif"
                            />
                          </div>

                          {/* Video Upload & URL */}
                          <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                            <label className="block text-[11px] font-bold text-neutral-800 uppercase tracking-wider font-admin">
                              Video Asset File / Link
                            </label>
                            <div className="flex items-center gap-2">
                              <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border-2 border-dashed border-neutral-200 hover:border-neutral-900 rounded-xl cursor-pointer bg-neutral-50/70 hover:bg-neutral-50 transition-all text-neutral-800">
                                {isUploading ? (
                                  <Loader2 className="w-3.5 h-3.5 text-neutral-700 animate-spin" />
                                ) : (
                                  <Upload className="w-3.5 h-3.5 text-neutral-700" />
                                )}
                                <span className="text-xs font-semibold">
                                  {isUploading ? 'Uploading...' : 'Upload MP4'}
                                </span>
                                <input
                                  type="file"
                                  ref={(el) => (fileInputRefs.current[idx] = el)}
                                  accept="video/mp4,video/webm,video/quicktime,video/*,.mp4,.webm,.mov,.m4v"
                                  className="hidden"
                                  disabled={isUploading}
                                  onChange={(e) => handleVideoUpload(idx, e)}
                                />
                              </label>

                              {vid.video_url && (
                                <a
                                  href={vid.video_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 border border-neutral-200 hover:bg-neutral-100 rounded-xl text-neutral-600 transition-colors"
                                  title="Open video URL in new tab"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}

                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await persistFabricConfig(videos, editorial);
                                    showToast('success', `Video Card ${idx + 1} saved to live storefront!`);
                                  } catch (err) {
                                    showToast('error', err.message || 'Failed to save card');
                                  }
                                }}
                                disabled={saving || isUploading}
                                className="px-3 py-2 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                                title="Save this card changes immediately"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Save</span>
                              </button>
                            </div>

                            <input
                              type="text"
                              value={vid.video_url}
                              onChange={(e) => handleVideoFieldChange(idx, 'video_url', e.target.value)}
                              placeholder="https://... or Supabase Storage URL"
                              className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-[11px] text-neutral-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all font-mono truncate"
                            />

                            <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-0.5">
                              <span className="flex items-center gap-1 font-medium text-neutral-600">
                                <Clock className="w-3 h-3 text-neutral-400" />
                                <span>{videoDurations[idx] !== undefined ? `${videoDurations[idx].toFixed(1)}s` : 'MP4, WebM'}</span>
                              </span>
                              <span className="text-neutral-400">Max 250MB</span>
                            </div>
                          </div>

                          {/* Related products: products made in this fabric (shown on its fabric page) */}
                          <FabricProductPicker
                            fabricSlug={vid.slug || vid.fabric_slug || (vid.tag ? vid.tag.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '')}
                            fabricLabel={vid.tag || vid.title}
                            onNotify={showToast}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* EDITORIAL NARRATIVE & BUTTONS CARD */}
            <div className="bg-white border border-neutral-200/90 rounded-2xl shadow-2xs p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <div>
                  <h3 className="text-sm font-admin font-bold text-neutral-950 uppercase tracking-wider flex items-center gap-2">
                    <Type className="w-4 h-4 text-neutral-700" />
                    <span>Editorial Narrative & Call-To-Action Buttons</span>
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Customize the right-hand headline, description copy, and navigation buttons.
                  </p>
                </div>
                <span className="text-xs text-neutral-400 font-mono">Storefront Column 2</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Eyebrow / Subheading */}
                <div>
                  <label className="block text-xs font-bold text-neutral-900 uppercase tracking-wider font-admin mb-1.5">
                    Subheading / Eyebrow Text
                  </label>
                  <input
                    type="text"
                    value={editorial.subheading}
                    onChange={(e) => setEditorial({ ...editorial, subheading: e.target.value })}
                    placeholder="EDITORIAL VISION"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all uppercase tracking-wider font-admin"
                  />
                </div>

                {/* Main Headline */}
                <div>
                  <label className="block text-xs font-bold text-neutral-900 uppercase tracking-wider font-admin mb-1.5">
                    Main Headline
                  </label>
                  <input
                    type="text"
                    value={editorial.heading}
                    onChange={(e) => setEditorial({ ...editorial, heading: e.target.value })}
                    placeholder="LUXURY TEXTILE ARTISTRY"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all uppercase tracking-wider font-admin"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-neutral-900 uppercase tracking-wider font-admin mb-1.5">
                  Editorial Story Description
                </label>
                <textarea
                  rows={3}
                  value={editorial.description}
                  onChange={(e) => setEditorial({ ...editorial, description: e.target.value })}
                  placeholder="Discover the sensory elegance of our mastercrafted fabrics: mulberry silk, structured linens, and couture jacquards."
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all resize-none leading-relaxed font-sans"
                />
              </div>

              {/* Buttons Grid */}
              <div className="pt-2 border-t border-neutral-100 max-w-lg">
                {/* Primary Button */}
                <div className="space-y-3 p-4 bg-[#F8FAFC] border border-neutral-200/80 rounded-xl">
                  <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider block font-admin">
                    Explore Fabrics Button
                  </span>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                      Button Label
                    </label>
                    <input
                      type="text"
                      value={editorial.button_text}
                      onChange={(e) => setEditorial({ ...editorial, button_text: e.target.value })}
                      placeholder="EXPLORE FABRICS"
                      className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 font-admin uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                      Destination Link
                    </label>
                    <input
                      type="text"
                      value={editorial.button_link}
                      onChange={(e) => setEditorial({ ...editorial, button_link: e.target.value })}
                      placeholder="/explore-fabrics"
                      className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

          {/* Static Bottom Actions Bar (Placed at the end of the page, non-floating) */}
          <div className="bg-neutral-950 text-white p-4 sm:p-5 rounded-2xl border border-neutral-800 flex items-center justify-between gap-4 flex-wrap mt-4">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <div>
                <span className="text-xs sm:text-sm font-bold font-admin block leading-tight">
                  Fabric Video Section Editor
                </span>
                <span className="text-[11px] text-neutral-400">
                  All {videos.length} videos and narrative changes sync live to the storefront homepage
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={fetchFabricVideo}
                disabled={loading || saving}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Discard Changes
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={saving}
                className="px-5 py-2.5 bg-white text-neutral-950 hover:bg-neutral-100 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                ) : (
                  <Save className="w-4 h-4 text-neutral-950" />
                )}
                <span>Save All {videos.length} Videos & Story</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFabricVideo;
