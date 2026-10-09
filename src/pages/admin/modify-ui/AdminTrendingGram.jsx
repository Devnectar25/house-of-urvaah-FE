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
  ExternalLink,
  X,
  Loader2,
  RefreshCw
} from 'lucide-react';

const InstagramIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);
import { apiClient } from '../../../lib/apiClient';

export const AdminTrendingGram = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Modal & Edit states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [previewMediaUrl, setPreviewMediaUrl] = useState(null);

  // Drag and drop / Form states
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    image: '',
    media_type: 'video',
    caption: '',
    post_link: 'https://www.instagram.com/houseofurvaah/',
    is_active: true
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient('/api/ui/admin/trending-gram');
      if (res && res.success) {
        setPosts(res.data || []);
      } else {
        throw new Error(res?.message || 'Failed to fetch Trending on Gram posts');
      }
    } catch (err) {
      console.error('Error fetching trending posts:', err);
      setError(err.message || 'Could not connect to API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const openAddModal = () => {
    setEditingPost(null);
    setFormData({
      title: 'CORSET DETAIL',
      image: '',
      media_type: 'video',
      caption: 'STUDIO EDIT • Artisan embroidered structured look',
      post_link: 'https://www.instagram.com/houseofurvaah/',
      is_active: true
    });
    setUploadError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title || '',
      image: post.image || '',
      media_type: post.media_type || (post.image?.endsWith('.mp4') ? 'video' : 'image'),
      caption: post.caption || '',
      post_link: post.post_link || 'https://www.instagram.com/houseofurvaah/',
      is_active: post.is_active ?? true
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
      setUploadError('Please select a valid video format (MP4, WebM, QuickTime).');
      return;
    }
    if (type === 'image' && !isImage) {
      setUploadError('Please select a valid image format (JPEG, PNG, WebP).');
      return;
    }

    const maxBytes = isVideo ? 100 * 1024 * 1024 : 15 * 1024 * 1024;
    if (file.size > maxBytes) {
      setUploadError(`File too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max allowed: ${isVideo ? '100MB' : '15MB'}.`);
      return;
    }

    setUploadingFile(true);
    try {
      const uploadData = new FormData();
      uploadData.append(isVideo ? 'video' : 'file', file);
      if (!isVideo) uploadData.append('folder', 'trending');

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
        throw new Error(data.message || 'Upload failed');
      }

      const uploadedUrl = data.url || data.videoUrl || data.filePath || data.data?.url;
      if (!uploadedUrl) throw new Error('No media URL returned by server');

      setFormData((prev) => ({
        ...prev,
        image: uploadedUrl,
        media_type: isVideo ? 'video' : 'image'
      }));
      showToast('success', `${isVideo ? 'Video' : 'Image'} uploaded successfully!`);
    } catch (err) {
      console.error('File upload error:', err);
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleSavePost = async (e) => {
    e.preventDefault();
    if (!formData.image.trim()) {
      setUploadError('Post media (video or image) is required.');
      return;
    }

    setSaving(true);
    try {
      if (editingPost) {
        const res = await apiClient(`/api/ui/admin/trending-gram/${editingPost.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        if (!res?.success) throw new Error(res?.message || 'Update failed');
        showToast('success', 'Post updated successfully!');
      } else {
        const res = await apiClient('/api/ui/admin/trending-gram', {
          method: 'POST',
          body: JSON.stringify({
            ...formData,
            display_order: posts.length + 1
          })
        });
        if (!res?.success) throw new Error(res?.message || 'Create failed');
        showToast('success', 'Instagram post added successfully!');
      }
      setIsModalOpen(false);
      fetchPosts();
    } catch (err) {
      console.error('Error saving post:', err);
      showToast('error', err.message || 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async () => {
    if (!deleteTargetId) return;
    try {
      const res = await apiClient(`/api/ui/admin/trending-gram/${deleteTargetId}`, {
        method: 'DELETE'
      });
      if (!res?.success) throw new Error(res?.message || 'Delete failed');
      showToast('success', 'Post removed successfully!');
      setDeleteTargetId(null);
      fetchPosts();
    } catch (err) {
      console.error('Error deleting post:', err);
      showToast('error', err.message || 'Failed to delete post');
    }
  };

  const handleMovePost = async (index, direction) => {
    const newPosts = [...posts];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= newPosts.length) return;

    const temp = newPosts[index];
    newPosts[index] = newPosts[targetIdx];
    newPosts[targetIdx] = temp;

    const items = newPosts.map((post, idx) => ({
      id: post.id,
      display_order: idx + 1
    }));

    setPosts(newPosts);

    try {
      await apiClient('/api/ui/admin/trending-gram/reorder', {
        method: 'PUT',
        body: JSON.stringify({ items })
      });
      showToast('success', 'Posts reordered successfully!');
    } catch (err) {
      console.error('Reorder error:', err);
      fetchPosts();
    }
  };

  // Drag and drop ordering handlers
  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
  };

  const handleDrop = async (e, targetIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) return;

    const updated = [...posts];
    const [movedItem] = updated.splice(draggedIdx, 1);
    updated.splice(targetIdx, 0, movedItem);

    setDraggedIdx(null);
    setPosts(updated);

    const items = updated.map((post, idx) => ({
      id: post.id,
      display_order: idx + 1
    }));

    try {
      await apiClient('/api/ui/admin/trending-gram/reorder', {
        method: 'PUT',
        body: JSON.stringify({ items })
      });
      showToast('success', 'Order updated by drag-and-drop!');
    } catch (err) {
      console.error('Reorder error:', err);
      fetchPosts();
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
          <h1 className="text-2xl sm:text-3xl font-admin font-bold text-neutral-950 tracking-tight mt-1 flex items-center gap-2.5">
            <span>Trending on the Gram</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-sans mt-1">
            Manage Reels, videos, captions, and Instagram links shown in the 9:16 vertical card carousel.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchPosts}
            disabled={loading}
            className="p-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl transition-all cursor-pointer shadow-2xs"
            title="Refresh Posts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-neutral-900' : ''}`} />
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-all shadow-sm cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add New Post</span>
          </button>
        </div>
      </div>

      {/* Posts Cards Grid / Reorder List */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-admin font-bold text-neutral-950 uppercase tracking-wider">
              Instagram Showcase Cards ({posts.length})
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Drag cards to reorder or use arrows. Video cards loop continuously on hover in storefront.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-neutral-400 space-y-3">
            <Loader2 className="w-7 h-7 animate-spin text-neutral-900" />
            <p className="text-xs font-medium">Loading posts...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-600 space-y-3">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-sm font-semibold">{error}</p>
            <button
              onClick={fetchPosts}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold"
            >
              Try Again
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="p-16 text-center text-neutral-400 space-y-3">
            <InstagramIcon className="w-10 h-10 mx-auto text-neutral-300 stroke-[1.5]" />
            <p className="text-sm font-medium text-neutral-600">No Instagram posts configured.</p>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Click "Add New Post" above to add your first Instagram Reel or outfit photo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 p-5">
            {posts.map((post, idx) => {
              const isVideo =
                post.media_type === 'video' ||
                post.image?.endsWith('.mp4') ||
                post.image?.includes('/videos/');

              return (
                <div
                  key={post.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  className={`border border-neutral-200/90 rounded-2xl bg-neutral-50/50 hover:bg-white transition-all overflow-hidden flex flex-col group shadow-2xs cursor-grab active:cursor-grabbing ${
                    draggedIdx === idx ? 'opacity-40 border-dashed border-neutral-900' : ''
                  }`}
                >
                  {/* Top Bar with Position badge & Order Arrows */}
                  <div className="p-3 border-b border-neutral-100 flex items-center justify-between bg-white">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono bg-neutral-100 text-neutral-700">
                      #{idx + 1}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMovePost(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 hover:bg-neutral-100 disabled:opacity-20 rounded text-neutral-600 cursor-pointer"
                        title="Move left"
                      >
                        <ArrowUp className="w-3 h-3 -rotate-90 sm:rotate-0" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMovePost(idx, 1)}
                        disabled={idx === posts.length - 1}
                        className="p-1 hover:bg-neutral-100 disabled:opacity-20 rounded text-neutral-600 cursor-pointer"
                        title="Move right"
                      >
                        <ArrowDown className="w-3 h-3 -rotate-90 sm:rotate-0" />
                      </button>
                    </div>
                  </div>

                  {/* 9:16 Aspect Ratio Media Box with Preview */}
                  <div
                    onClick={() => setPreviewMediaUrl(post.image)}
                    className="relative w-full aspect-[9/16] bg-neutral-900 overflow-hidden cursor-pointer"
                    title="Click to preview video / image"
                  >
                    {isVideo ? (
                      <video
                        src={post.image}
                        className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                        muted
                        loop
                      />
                    ) : (
                      <img
                        src={post.image}
                        alt={post.title || 'Post'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}

                    {/* Gradient & Overlay Info */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent p-3 flex flex-col justify-between pointer-events-none">
                      <div className="self-end">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-xs">
                          {isVideo ? 'REEL' : 'PHOTO'}
                        </span>
                      </div>
                      <div className="text-white space-y-0.5">
                        <span className="text-[10px] tracking-widest uppercase text-white/70 block">
                          @houseofurvaah
                        </span>
                        <h4 className="text-xs font-bold uppercase font-admin leading-snug truncate">
                          {post.title || '(No Title)'}
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* Caption & Actions Footer */}
                  <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between bg-white">
                    <p className="text-[11px] text-neutral-600 line-clamp-2 leading-relaxed">
                      {post.caption || '(No caption provided)'}
                    </p>

                    <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                      <a
                        href={post.post_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-neutral-500 hover:text-neutral-900 flex items-center gap-1 truncate max-w-[120px]"
                        title={post.post_link}
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span>Link</span>
                      </a>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(post)}
                          className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-800 transition-colors cursor-pointer"
                          title="Edit Post"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTargetId(post.id)}
                          className="p-1.5 rounded-lg border border-neutral-200 hover:bg-rose-50 hover:border-rose-200 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete Post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-neutral-200/90 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-admin font-bold text-lg text-neutral-950">
                  {editingPost ? 'Edit Instagram Post' : 'Add New Instagram Post'}
                </h3>
                <p className="text-xs text-neutral-500">
                  Provide an MP4 Reel video or outfit picture, title, and link.
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

            <form onSubmit={handleSavePost} className="p-6 space-y-5">
              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Upload Section */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-neutral-900 uppercase tracking-wider font-admin">
                  Post Media Asset (9:16 Video / Image) *
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-neutral-200 hover:border-neutral-900 rounded-xl cursor-pointer bg-neutral-50/70 hover:bg-neutral-50 transition-all">
                    <Video className="w-4 h-4 text-neutral-600" />
                    <span className="text-xs font-semibold text-neutral-800">
                      {uploadingFile ? 'Uploading...' : 'Upload Video'}
                    </span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      className="hidden"
                      disabled={uploadingFile}
                      onChange={(e) => handleFileUpload(e, 'video')}
                    />
                  </label>

                  <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-neutral-200 hover:border-neutral-900 rounded-xl cursor-pointer bg-neutral-50/70 hover:bg-neutral-50 transition-all">
                    <ImageIcon className="w-4 h-4 text-neutral-600" />
                    <span className="text-xs font-semibold text-neutral-800">
                      {uploadingFile ? 'Uploading...' : 'Upload Image'}
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

                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      image: val,
                      media_type: val.endsWith('.mp4') ? 'video' : prev.media_type
                    }));
                  }}
                  placeholder="Or media path (e.g. /assets/video/Video2.mp4)"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all font-mono"
                />

                {formData.image && (
                  <div className="w-28 h-44 rounded-lg bg-neutral-900 overflow-hidden relative mx-auto mt-2 border border-neutral-200">
                    {formData.media_type === 'video' || formData.image.endsWith('.mp4') ? (
                      <video src={formData.image} className="w-full h-full object-cover" autoPlay muted loop />
                    ) : (
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    )}
                  </div>
                )}
              </div>

              {/* Title / Heading */}
              <div>
                <label className="block text-xs font-bold text-neutral-900 uppercase tracking-wider font-admin mb-1.5">
                  Post Title / Style Tag
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="CORSET TOPS"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all font-admin uppercase"
                />
              </div>

              {/* Caption */}
              <div>
                <label className="block text-xs font-bold text-neutral-900 uppercase tracking-wider font-admin mb-1.5">
                  Caption / Description
                </label>
                <textarea
                  rows={3}
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  placeholder="STUDIO EDIT • Artisan embroidered structured look..."
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all resize-none"
                />
              </div>

              {/* Instagram URL */}
              <div>
                <label className="block text-xs font-bold text-neutral-900 uppercase tracking-wider font-admin mb-1.5">
                  Instagram Link
                </label>
                <input
                  type="text"
                  value={formData.post_link}
                  onChange={(e) => setFormData({ ...formData, post_link: e.target.value })}
                  placeholder="https://www.instagram.com/houseofurvaah/"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="gram_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-neutral-950 focus:ring-neutral-900 border-neutral-300"
                />
                <label htmlFor="gram_active" className="text-xs font-bold text-neutral-900 cursor-pointer">
                  Publish Post to Storefront Carousel
                </label>
              </div>

              {/* Submit Buttons */}
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
                  <span>{editingPost ? 'Update Post' : 'Add Post'}</span>
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
              <h3 className="font-admin font-bold text-lg text-neutral-950">Delete Instagram Post?</h3>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                Are you sure you want to remove this post from the storefront? This action cannot be undone.
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
                onClick={handleDeletePost}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-all shadow-sm cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Media Modal Preview */}
      {previewMediaUrl && (
        <div
          onClick={() => setPreviewMediaUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-md w-full aspect-[9/16] bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl border border-neutral-800"
          >
            <button
              onClick={() => setPreviewMediaUrl(null)}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            {previewMediaUrl.endsWith('.mp4') || previewMediaUrl.includes('/videos/') ? (
              <video src={previewMediaUrl} controls autoPlay className="w-full h-full object-contain" />
            ) : (
              <img src={previewMediaUrl} alt="Preview" className="w-full h-full object-contain" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
