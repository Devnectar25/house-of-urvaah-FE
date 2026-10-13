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
  Clock
} from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import { AdminPageHeader } from '../../../components/admin/AdminPageHeader';

// Helper to inspect video duration client-side before upload
const getVideoDuration = (file) => {
  return new Promise((resolve, reject) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      const objectUrl = URL.createObjectURL(file);

      const cleanUp = () => {
        URL.revokeObjectURL(objectUrl);
      };

      video.onloadedmetadata = () => {
        const duration = video.duration;
        cleanUp();
        if (typeof duration === 'number' && !isNaN(duration) && isFinite(duration)) {
          resolve(duration);
        } else {
          resolve(0);
        }
      };

      video.onerror = () => {
        cleanUp();
        reject(new Error('Unable to read video file metadata. Please verify that this is a supported video format.'));
      };

      video.src = objectUrl;
    } catch (err) {
      reject(err);
    }
  });
};

const DEFAULT_VIDEOS = [
  {
    id: 'blush-pink',
    tag: 'PETAL THREADWORK',
    title: 'Blush Pink Embroidered Floral Co-Ord Set',
    video_url: 'https://fhbdceauisvlcpmuzpmf.supabase.co/storage/v1/object/public/houseofurvaah-media/videos/Blush%20Pink%20Embroidered%20Floral%20Co-Ord%20Set_h264.mp4',
    badge: 'Card 1 (Left)',
    slotLabel: 'Left Video Card'
  },
  {
    id: 'mocha-brown',
    tag: 'HERITAGE WEAVE',
    title: 'Mocha Brown Embroidered Co-Ord Set',
    video_url: 'https://fhbdceauisvlcpmuzpmf.supabase.co/storage/v1/object/public/houseofurvaah-media/videos/Mocha%20Brown%20Embroidered%20Co-Ord%20Set_h264.mp4',
    badge: 'Card 2 (Center)',
    slotLabel: 'Center Video Card'
  },
  {
    id: 'teal',
    tag: 'OCEAN BLOOM',
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
    button_link: '/clothing',
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

        // Populate 3 Videos
        if (Array.isArray(data.videos) && data.videos.length > 0) {
          setVideos(
            DEFAULT_VIDEOS.map((def, idx) => {
              const incoming = data.videos[idx] || {};
              return {
                id: incoming.id || def.id,
                tag: incoming.tag !== undefined ? incoming.tag : def.tag,
                title: incoming.title !== undefined ? incoming.title : (incoming.name !== undefined ? incoming.name : def.title),
                video_url: incoming.video_url !== undefined ? incoming.video_url : (incoming.url !== undefined ? incoming.url : def.video_url),
                badge: def.badge,
                slotLabel: def.slotLabel
              };
            })
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

  // Handle Video file upload for a specific card slot
  const handleVideoUpload = async (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    if (!file.type.startsWith('video/')) {
      setUploadError('Please select a valid video file (MP4, WebM, QuickTime).');
      return;
    }

    if (file.size > 250 * 1024 * 1024) {
      setUploadError(`Video size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds 250MB limit.`);
      return;
    }

    setUploadingIndex(index);
    try {
      // Strict 7s video duration validation
      try {
        const duration = await getVideoDuration(file);
        if (duration > 7.5) {
          const errMsg = `Video duration is ${duration.toFixed(1)}s. Video time must be only 7s only. Please upload a video of 7s or shorter.`;
          setUploadError(errMsg);
          showToast('error', `Video is ${duration.toFixed(1)}s. Video time will be only 7s only.`);
          if (e.target) e.target.value = '';
          setUploadingIndex(null);
          return;
        }
        setVideoDurations((prev) => ({ ...prev, [index]: duration }));
      } catch (durErr) {
        console.warn('Could not inspect video duration:', durErr);
      }

      const uploadData = new FormData();
      uploadData.append('video', file);

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

      const uploadedUrl = data.url || data.videoUrl || data.filePath;
      if (!uploadedUrl) throw new Error('No video URL returned by server');

      setVideos((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], video_url: uploadedUrl };
        return next;
      });

      showToast('success', `Video ${index + 1} (${videos[index].tag || 'Card'}) uploaded successfully!`);
    } catch (err) {
      console.error('Video upload error:', err);
      setUploadError(err.message || 'Upload failed');
      showToast('error', err.message || 'Video upload failed');
    } finally {
      setUploadingIndex(null);
      if (e.target) e.target.value = '';
    }
  };

  const handleVideoFieldChange = (index, field, value) => {
    setVideos((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Reset all 3 videos and editorial text to the default curated values?')) {
      setVideos(DEFAULT_VIDEOS);
      setEditorial({
        subheading: 'EDITORIAL VISION',
        heading: 'LUXURY TEXTILE ARTISTRY',
        description: 'Discover the sensory elegance of our mastercrafted fabrics: mulberry silk, structured linens, and couture jacquards.',
        button_text: 'EXPLORE FABRICS',
        button_link: '/clothing',
        secondary_button_text: 'VIEW CAMPAIGN FILM',
        secondary_button_link: '#campaign',
        is_active: true
      });
      showToast('success', 'Reset to defaults. Remember to click Save Changes to persist.');
    }
  };

  const handleSaveConfig = async (e) => {
    if (e) e.preventDefault();

    // Strict 7s video validation check across all 3 videos before saving
    for (let i = 0; i < videos.length; i++) {
      const dur = videoDurations[i];
      if (dur && dur > 7.5) {
        const errMsg = `Cannot save: Video ${i + 1} (${videos[i].tag || 'Card'}) is ${dur.toFixed(1)}s. Video time must be only 7s only.`;
        setUploadError(errMsg);
        showToast('error', errMsg);
        return;
      }
    }
    setSaving(true);
    try {
      const payload = {
        subheading: editorial.subheading,
        heading: editorial.heading,
        description: editorial.description,
        button_text: editorial.button_text,
        button_link: editorial.button_link,
        secondary_button_text: editorial.secondary_button_text,
        secondary_button_link: editorial.secondary_button_link,
        is_active: editorial.is_active,
        video_url: videos[0]?.video_url || '',
        videos: videos.map((v) => ({
          id: v.id,
          tag: v.tag,
          title: v.title,
          video_url: v.video_url
        }))
      };

      const res = await apiClient('/api/ui/admin/fabric-video', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (!res?.success) throw new Error(res?.message || 'Update failed');

      showToast('success', 'All 3 Fabric Videos & Editorial settings saved successfully!');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('urvaah_fabric_video_updated'));
        localStorage.setItem('urvaah_fabric_video_last_update', Date.now().toString());
      }
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
              <span>3-Video Triple Card Carousel</span>
            </span>
          </div>
        }
        title="Fabric Video Section"
        subtitle="Manage the 3 vertical fabric showcase videos (Petal Threadwork, Heritage Weave, Ocean Bloom) and the editorial narrative & buttons."
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
              </div>
              <span className="text-[11px] font-medium text-neutral-500">
                Exact replica of homepage Fabric Video section
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left 3 Videos Showcase */}
              <div className="lg:col-span-8 bg-[#F5F5F0] p-1 sm:p-2 rounded-sm border border-[#EBEBE6]">
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {videos.map((vid, idx) => (
                    <div
                      key={vid.id || idx}
                      className="relative aspect-[9/14] overflow-hidden bg-neutral-900 rounded-sm shadow-xs group"
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
                  <span className="px-3 py-1.5 border border-neutral-950 text-neutral-950 text-[10px] tracking-widest uppercase font-sans font-semibold">
                    {editorial.secondary_button_text || 'VIEW CAMPAIGN FILM'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* EDIT FORM GRID: 3 VIDEO CARDS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-admin font-bold text-neutral-950 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-neutral-700" />
                <span>3 Editorial Fabric Videos</span>
              </h3>
              <span className="text-xs text-neutral-500">
                Click 'Upload Video' or paste an MP4 URL for each card
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {videos.map((vid, idx) => {
                const isUploading = uploadingIndex === idx;

                  return (
                    <div
                      key={vid.id || idx}
                      className="bg-white border border-neutral-200/90 rounded-2xl shadow-2xs overflow-hidden flex flex-col"
                    >
                      {/* Card Header Bar */}
                      <div className="p-4 bg-[#F8FAFC] border-b border-neutral-200/80 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-neutral-950 text-white text-xs font-bold flex items-center justify-center font-mono">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-neutral-900 block leading-tight font-admin">
                              {vid.slotLabel || `Video ${idx + 1}`}
                            </span>
                            <span className="text-[10px] text-neutral-500 font-mono">
                              Card {idx + 1} of 3
                            </span>
                          </div>
                        </div>
                        {videoDurations[idx] !== undefined ? (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                              videoDurations[idx] > 7.5
                                ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>
                              {videoDurations[idx] > 7.5
                                ? `${videoDurations[idx].toFixed(1)}s (Exceeds 7s)`
                                : `${videoDurations[idx].toFixed(1)}s • 7s Limit`}
                            </span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 border border-neutral-200 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Max 7s only</span>
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
                              <p className="text-[10px] text-neutral-400">Upload MP4 or paste link below (Max 7s)</p>
                            </div>
                          )}

                          {/* Tag Overlay preview */}
                          {vid.tag && (
                            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-white/95 text-neutral-950 text-[8px] font-bold uppercase tracking-wider shadow-xs pointer-events-none">
                              {vid.tag}
                            </span>
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
                              Video Asset File / Link (7s Only)
                            </label>
                            <div className="flex items-center gap-2">
                              <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border-2 border-dashed border-neutral-200 hover:border-neutral-900 rounded-xl cursor-pointer bg-neutral-50/70 hover:bg-neutral-50 transition-all text-neutral-800">
                                <Upload className="w-3.5 h-3.5 text-neutral-700" />
                                <span className="text-xs font-semibold">
                                  {isUploading ? 'Uploading...' : 'Upload MP4 (Max 7s)'}
                                </span>
                                <input
                                  type="file"
                                  ref={(el) => (fileInputRefs.current[idx] = el)}
                                  accept="video/mp4,video/webm,video/quicktime"
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
                            </div>

                            <input
                              type="text"
                              value={vid.video_url}
                              onChange={(e) => handleVideoFieldChange(idx, 'video_url', e.target.value)}
                              placeholder="https://... or Supabase Storage URL"
                              className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-[11px] text-neutral-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all font-mono truncate"
                            />

                            <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-0.5">
                              <span className="flex items-center gap-1 font-semibold text-neutral-700">
                                <Clock className="w-3 h-3 text-neutral-500" />
                                <span>Strict length: 7s only</span>
                              </span>
                              {videoDurations[idx] > 7.5 ? (
                                <span className="text-rose-600 font-bold flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>Exceeds 7s limit ({videoDurations[idx].toFixed(1)}s)</span>
                                </span>
                              ) : (
                                <span className="text-neutral-400">MP4, WebM (Max 250MB)</span>
                              )}
                            </div>
                          </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-neutral-100">
                {/* Primary Button */}
                <div className="space-y-3 p-4 bg-[#F8FAFC] border border-neutral-200/80 rounded-xl">
                  <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider block font-admin">
                    Primary Button (Black Fill)
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
                      placeholder="/clothing"
                      className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 font-mono"
                    />
                  </div>
                </div>

                {/* Secondary Button */}
                <div className="space-y-3 p-4 bg-[#F8FAFC] border border-neutral-200/80 rounded-xl">
                  <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider block font-admin">
                    Secondary Button (Curtain Reveal)
                  </span>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                      Button Label
                    </label>
                    <input
                      type="text"
                      value={editorial.secondary_button_text}
                      onChange={(e) => setEditorial({ ...editorial, secondary_button_text: e.target.value })}
                      placeholder="VIEW CAMPAIGN FILM"
                      className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 font-admin uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                      Destination Link
                    </label>
                    <input
                      type="text"
                      value={editorial.secondary_button_link}
                      onChange={(e) => setEditorial({ ...editorial, secondary_button_link: e.target.value })}
                      placeholder="#campaign"
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
                  All 3 videos and narrative changes sync live to the storefront homepage
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
                <span>Save All 3 Videos & Story</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFabricVideo;
