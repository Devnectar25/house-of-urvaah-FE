import React, { useState, useEffect } from 'react';
import {
  Video,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import { AdminPageHeader } from '../../../components/admin/AdminPageHeader';

export const AdminFabricVideo = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Form states
  const [config, setConfig] = useState({
    video_url: '',
    poster_url: '',
    heading: 'THE ART OF REFINED TAILORING',
    description: 'Defined by oversized silhouettes, fluid draping, and uncompromised material integrity. Designed for timeless elegance across seasonal transitions.',
    button_text: 'DISCOVER THE COLLECTION',
    button_link: '#lookbook',
    autoplay: true,
    muted: true,
    loop_video: true,
    is_active: true
  });

  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [uploadError, setUploadError] = useState(null);

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
        setConfig({
          video_url: res.data.video_url || '',
          poster_url: res.data.poster_url || '',
          heading: res.data.heading || 'THE ART OF REFINED TAILORING',
          description: res.data.description || '',
          button_text: res.data.button_text || 'DISCOVER THE COLLECTION',
          button_link: res.data.button_link || '#lookbook',
          autoplay: res.data.autoplay ?? true,
          muted: res.data.muted ?? true,
          loop_video: res.data.loop_video ?? true,
          is_active: res.data.is_active ?? true
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

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    if (!file.type.startsWith('video/')) {
      setUploadError('Please select a valid video file (MP4, WebM, QuickTime).');
      return;
    }

    if (file.size > 150 * 1024 * 1024) {
      setUploadError(`Video size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds 150MB limit.`);
      return;
    }

    setUploadingVideo(true);
    try {
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

      setConfig((prev) => ({ ...prev, video_url: uploadedUrl }));
      showToast('success', 'Fabric showcase video uploaded successfully!');
    } catch (err) {
      console.error('Video upload error:', err);
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploadingVideo(false);
      e.target.value = '';
    }
  };

  const handlePosterUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('Poster image must be smaller than 15MB.');
      return;
    }

    setUploadingPoster(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('folder', 'fabric-poster');

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
      if (!uploadedUrl) throw new Error('No image URL returned by server');

      setConfig((prev) => ({ ...prev, poster_url: uploadedUrl }));
      showToast('success', 'Poster image uploaded successfully!');
    } catch (err) {
      console.error('Poster upload error:', err);
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploadingPoster(false);
      e.target.value = '';
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    if (!config.video_url.trim()) {
      showToast('error', 'A video URL or file is required.');
      return;
    }

    setSaving(true);
    try {
      const res = await apiClient('/api/ui/admin/fabric-video', {
        method: 'PUT',
        body: JSON.stringify(config)
      });

      if (!res?.success) throw new Error(res?.message || 'Update failed');
      showToast('success', 'Fabric Video configuration updated successfully!');
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
              Modify UI
            </span>
            <span className="text-xs text-neutral-400">•</span>
            <span className="text-xs font-semibold text-neutral-600">Storefront Section</span>
          </div>
        }
        title="Fabric Video Section"
        subtitle="Manage the editorial fabric & tailored craft video showcase, poster image, title, and copy."
        actions={
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
            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold"
          >
            Try Again
          </button>
        </div>
      ) : (
        <form onSubmit={handleSaveConfig} className="grid grid-cols-1 lg:grid-cols-12 gap-7">
          {/* ======================================================== */}
          {/* LEFT COLUMN: INTERACTIVE VIDEO PREVIEW PLAYER (5 Cols)   */}
          {/* ======================================================== */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white border border-neutral-200/90 rounded-2xl shadow-2xs p-5">
              <h2 className="text-sm font-admin font-bold text-neutral-950 uppercase tracking-wider mb-1">
                Live Video Player Preview
              </h2>
              <p className="text-xs text-neutral-500 mb-4">
                Interactive video preview rendered with configured poster, loop, and playback options.
              </p>

              <div className="relative w-full aspect-[9/16] sm:aspect-video lg:aspect-[9/16] rounded-xl overflow-hidden bg-neutral-950 border border-neutral-200 shadow-inner group flex items-center justify-center">
                {config.video_url ? (
                  <video
                    key={config.video_url}
                    src={config.video_url}
                    poster={config.poster_url || undefined}
                    controls
                    autoPlay={config.autoplay}
                    muted={config.muted}
                    loop={config.loop_video}
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-neutral-500 p-6 space-y-2">
                    <Video className="w-10 h-10 mx-auto text-neutral-400 stroke-[1.5]" />
                    <p className="text-xs font-semibold">No video loaded</p>
                    <p className="text-[11px] text-neutral-400">Upload an MP4 video or paste URL on the right.</p>
                  </div>
                )}

                {config.poster_url && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-xs">
                    POSTER ATTACHED
                  </span>
                )}
              </div>

              {/* Poster Preview Thumb */}
              {config.poster_url && (
                <div className="mt-4 p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center gap-3">
                  <img
                    src={config.poster_url}
                    alt="Poster Preview"
                    className="w-12 h-12 object-cover rounded-lg border border-neutral-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-admin block">
                      Poster Image Asset
                    </span>
                    <span className="text-xs text-neutral-800 font-mono truncate block">
                      {config.poster_url}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: CONFIGURATION & EDIT FORM (7 Cols)         */}
          {/* ======================================================== */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-neutral-200/90 rounded-2xl shadow-2xs p-6 space-y-6">
              <div>
                <h2 className="text-sm font-admin font-bold text-neutral-950 uppercase tracking-wider">
                  Fabric Video Details & Media Assets
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Replace video, thumbnail poster, headline, description, and link button.
                </p>
              </div>

              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Video File / URL */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-neutral-900 uppercase tracking-wider font-admin">
                  Video File (MP4, WebM up to 150MB) *
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <label className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-neutral-200 hover:border-neutral-900 rounded-xl cursor-pointer bg-neutral-50/70 hover:bg-neutral-50 transition-all shrink-0">
                    <Video className="w-4 h-4 text-neutral-600" />
                    <span className="text-xs font-semibold text-neutral-800">
                      {uploadingVideo ? 'Uploading...' : 'Upload Video'}
                    </span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      className="hidden"
                      disabled={uploadingVideo}
                      onChange={handleVideoUpload}
                    />
                  </label>
                  <input
                    type="text"
                    value={config.video_url}
                    onChange={(e) => setConfig({ ...config, video_url: e.target.value })}
                    placeholder="https://... or /assets/video/video6.mp4"
                    className="flex-1 px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Poster File / URL */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-neutral-900 uppercase tracking-wider font-admin">
                  Poster / Video Thumbnail Image
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <label className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-neutral-200 hover:border-neutral-900 rounded-xl cursor-pointer bg-neutral-50/70 hover:bg-neutral-50 transition-all shrink-0">
                    <ImageIcon className="w-4 h-4 text-neutral-600" />
                    <span className="text-xs font-semibold text-neutral-800">
                      {uploadingPoster ? 'Uploading...' : 'Upload Poster'}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={uploadingPoster}
                      onChange={handlePosterUpload}
                    />
                  </label>
                  <input
                    type="text"
                    value={config.poster_url}
                    onChange={(e) => setConfig({ ...config, poster_url: e.target.value })}
                    placeholder="/assets/Images/Brown01.png"
                    className="flex-1 px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Title / Heading */}
              <div>
                <label className="block text-xs font-bold text-neutral-900 uppercase tracking-wider font-admin mb-1.5">
                  Headline / Title
                </label>
                <input
                  type="text"
                  value={config.heading}
                  onChange={(e) => setConfig({ ...config, heading: e.target.value })}
                  placeholder="THE ART OF REFINED TAILORING"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all font-admin uppercase"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-neutral-900 uppercase tracking-wider font-admin mb-1.5">
                  Editorial Description
                </label>
                <textarea
                  rows={3}
                  value={config.description}
                  onChange={(e) => setConfig({ ...config, description: e.target.value })}
                  placeholder="Defined by oversized silhouettes, fluid draping, and uncompromised material integrity..."
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all resize-none leading-relaxed"
                />
              </div>

              {/* CTA Button Text & Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-900 uppercase tracking-wider font-admin mb-1.5">
                    Button Label
                  </label>
                  <input
                    type="text"
                    value={config.button_text}
                    onChange={(e) => setConfig({ ...config, button_text: e.target.value })}
                    placeholder="DISCOVER THE COLLECTION"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-900 uppercase tracking-wider font-admin mb-1.5">
                    Button Link / Anchor
                  </label>
                  <input
                    type="text"
                    value={config.button_link}
                    onChange={(e) => setConfig({ ...config, button_link: e.target.value })}
                    placeholder="#lookbook or /clothing"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
                  />
                </div>
              </div>

              {/* Playback Toggles */}
              <div className="p-4 bg-neutral-50 border border-neutral-200/90 rounded-xl space-y-3">
                <span className="text-[11px] font-bold text-neutral-900 uppercase tracking-wider font-admin block">
                  Playback & Display Preferences
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-neutral-800">
                    <input
                      type="checkbox"
                      checked={config.autoplay}
                      onChange={(e) => setConfig({ ...config, autoplay: e.target.checked })}
                      className="w-4 h-4 rounded text-neutral-950 focus:ring-neutral-900 border-neutral-300"
                    />
                    <span>Autoplay on scroll</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-neutral-800">
                    <input
                      type="checkbox"
                      checked={config.loop_video}
                      onChange={(e) => setConfig({ ...config, loop_video: e.target.checked })}
                      className="w-4 h-4 rounded text-neutral-950 focus:ring-neutral-900 border-neutral-300"
                    />
                    <span>Loop video playback</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-neutral-800">
                    <input
                      type="checkbox"
                      checked={config.muted}
                      onChange={(e) => setConfig({ ...config, muted: e.target.checked })}
                      className="w-4 h-4 rounded text-neutral-950 focus:ring-neutral-900 border-neutral-300"
                    />
                    <span>Muted by default</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-neutral-800">
                    <input
                      type="checkbox"
                      checked={config.is_active}
                      onChange={(e) => setConfig({ ...config, is_active: e.target.checked })}
                      className="w-4 h-4 rounded text-neutral-950 focus:ring-neutral-900 border-neutral-300"
                    />
                    <span>Active on Storefront</span>
                  </label>
                </div>
              </div>

              {/* Submit Save Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving || uploadingVideo || uploadingPoster}
                  className="px-6 py-2.5 bg-neutral-950 hover:bg-neutral-800 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-all shadow-sm cursor-pointer flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Fabric Video Settings</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
