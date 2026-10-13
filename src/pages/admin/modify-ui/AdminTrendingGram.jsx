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
  RefreshCw,
  ShoppingBag,
  Upload,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check
} from 'lucide-react';

const InstagramIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);
import { apiClient } from '../../../lib/apiClient';
import { AdminPageHeader } from '../../../components/admin/AdminPageHeader';
import { getSupabaseMediaUrl } from '../../../lib/supabase';

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
    is_active: true,
    product_image: '',
    product_name: '',
    product_price: '',
    product_id: '',
    product_gallery: []
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Right-side product states
  const [uploadingProductFile, setUploadingProductFile] = useState(false);
  const [productUploadError, setProductUploadError] = useState(null);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [selectedPreviewImg, setSelectedPreviewImg] = useState('');
  const [selectedGalleryIdx, setSelectedGalleryIdx] = useState(0);
  const [showReelConfigDrawer, setShowReelConfigDrawer] = useState(false);

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
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('urvaah_trending_gram_updated'));
          localStorage.setItem('urvaah_trending_gram_last_update', Date.now().toString());
        }
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

    // Fetch existing catalog products for quick linking
    apiClient('/api/products?limit=100')
      .then((res) => {
        if (res?.success && Array.isArray(res.data)) {
          setCatalogProducts(res.data);
        }
      })
      .catch((err) => console.warn('Could not load products catalog for Trending Gram:', err));
  }, []);

  const openAddModal = () => {
    setEditingPost(null);
    const defaultProductImage = '/assets/Images/Blue01.png';
    const defaultGallery = [
      '/assets/Images/Blue01.png',
      '/assets/Images/Blue02.png',
      '/assets/Images/Blue03.png',
      '/assets/Images/Blue04.png'
    ];
    setFormData({
      title: 'CORSET DETAIL',
      image: '',
      media_type: 'video',
      caption: 'STUDIO EDIT • Artisan embroidered structured look',
      post_link: 'https://www.instagram.com/houseofurvaah/',
      is_active: true,
      product_image: defaultProductImage,
      product_name: 'TEAL EMBROIDERED FLORAL CO-ORD SET',
      product_price: '₹ 10,990',
      product_id: 'bs-102',
      product_gallery: defaultGallery
    });
    setSelectedPreviewImg(defaultProductImage);
    setSelectedGalleryIdx(0);
    setShowReelConfigDrawer(false);
    setUploadError(null);
    setProductUploadError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (post) => {
    setEditingPost(post);
    let postGallery = [];
    if (Array.isArray(post.product_gallery) && post.product_gallery.length > 0) {
      postGallery = post.product_gallery;
    } else if (typeof post.product_gallery === 'string') {
      try {
        const parsed = JSON.parse(post.product_gallery);
        if (Array.isArray(parsed) && parsed.length > 0) postGallery = parsed;
      } catch (_) {}
    }

    const initialProductImage = post.product_image || '/assets/Images/Blue01.png';
    const initialGallery = postGallery.length > 0 ? postGallery : [
      initialProductImage,
      '/assets/Images/Blue02.png',
      '/assets/Images/Blue03.png',
      '/assets/Images/Blue04.png'
    ];

    setFormData({
      title: post.title || 'CORSET DETAIL',
      image: post.image || '',
      media_type: post.media_type || (post.image?.endsWith('.mp4') ? 'video' : 'image'),
      caption: post.caption || 'STUDIO EDIT • Artisan embroidered structured look',
      post_link: post.post_link || 'https://www.instagram.com/houseofurvaah/',
      is_active: post.is_active ?? true,
      product_image: post.product_image || initialProductImage,
      product_name: post.product_name || 'TEAL EMBROIDERED FLORAL CO-ORD SET',
      product_price: post.product_price || '₹ 10,990',
      product_id: post.product_id || 'bs-102',
      product_gallery: initialGallery
    });
    setSelectedPreviewImg(initialProductImage);
    setSelectedGalleryIdx(0);
    setShowReelConfigDrawer(false);
    setUploadError(null);
    setProductUploadError(null);
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

  const handleProductImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProductUploadError(null);
    if (!file.type.startsWith('image/')) {
      setProductUploadError('Please select a valid image format (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setProductUploadError(`File too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max allowed: 15MB.`);
      return;
    }

    setUploadingProductFile(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('folder', 'trending');

      const API_BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
      const token = localStorage.getItem('urvaah_token');
      const endpoint = `${API_BASE}/api/upload/upload-image`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: uploadData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Product image upload failed');
      }

      const uploadedUrl = data.url || data.filePath || data.data?.url;
      if (!uploadedUrl) throw new Error('No image URL returned by server');

      setFormData((prev) => {
        const currentGallery = Array.isArray(prev.product_gallery) ? prev.product_gallery : [];
        const newGallery = currentGallery.includes(uploadedUrl) ? currentGallery : [uploadedUrl, ...currentGallery];
        return {
          ...prev,
          product_image: uploadedUrl,
          product_gallery: newGallery
        };
      });
      setSelectedPreviewImg(uploadedUrl);
      setSelectedGalleryIdx(0);
      showToast('success', 'Right-side product image uploaded successfully!');
    } catch (err) {
      console.error('Product image upload error:', err);
      setProductUploadError(err.message || 'Upload failed');
    } finally {
      setUploadingProductFile(false);
      e.target.value = '';
    }
  };

  const handleSelectCatalogProduct = (prodId) => {
    if (!prodId) return;
    const prod = catalogProducts.find((p) => String(p.id) === String(prodId));
    if (!prod) return;

    const prodImg = (prod.images && prod.images.length > 0) ? prod.images[0] : (prod.image || '');
    const prodGallery = prod.images && Array.isArray(prod.images) && prod.images.length > 0
      ? prod.images
      : (prodImg ? [prodImg] : []);

    let formattedPrice = '';
    if (prod.price) {
      const pStr = String(prod.price).trim();
      formattedPrice = pStr.startsWith('₹') ? pStr : `₹ ${Number(pStr.replace(/[^\d.]/g, '')).toLocaleString('en-IN') || pStr}`;
    }

    setFormData((prev) => ({
      ...prev,
      product_id: String(prod.id || prod.slug || ''),
      product_name: prod.name || '',
      product_price: formattedPrice || prev.product_price,
      product_image: prodImg,
      product_gallery: prodGallery
    }));
    setSelectedPreviewImg(prodImg);
    setSelectedGalleryIdx(0);
    showToast('success', `Linked product: ${prod.name}`);
  };

  const handlePrevPreviewImg = () => {
    const gallery = formData.product_gallery || [];
    if (gallery.length <= 1) return;
    const nextIdx = (selectedGalleryIdx - 1 + gallery.length) % gallery.length;
    setSelectedGalleryIdx(nextIdx);
    setSelectedPreviewImg(gallery[nextIdx]);
    setFormData((prev) => ({ ...prev, product_image: gallery[nextIdx] }));
  };

  const handleNextPreviewImg = () => {
    const gallery = formData.product_gallery || [];
    if (gallery.length <= 1) return;
    const nextIdx = (selectedGalleryIdx + 1) % gallery.length;
    setSelectedGalleryIdx(nextIdx);
    setSelectedPreviewImg(gallery[nextIdx]);
    setFormData((prev) => ({ ...prev, product_image: gallery[nextIdx] }));
  };

  const handleAddGalleryImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please select an image file (JPEG, PNG, WebP)');
      return;
    }

    setUploadingProductFile(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('folder', 'trending');

      const API_BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
      const token = localStorage.getItem('urvaah_token');
      const endpoint = `${API_BASE}/api/upload/upload-image`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: uploadData
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Upload failed');
      const uploadedUrl = data.url || data.filePath || data.data?.url;

      setFormData((prev) => {
        const currentGallery = Array.isArray(prev.product_gallery) ? prev.product_gallery : [];
        return {
          ...prev,
          product_gallery: [...currentGallery, uploadedUrl]
        };
      });
      setSelectedPreviewImg(uploadedUrl);
      showToast('success', 'Thumbnail added to Selected Product list!');
    } catch (err) {
      console.error(err);
      showToast('error', err.message || 'Upload failed');
    } finally {
      setUploadingProductFile(false);
      e.target.value = '';
    }
  };

  const handleRemoveGalleryImage = (removeIdx) => {
    setFormData((prev) => {
      const currentGallery = Array.isArray(prev.product_gallery) ? prev.product_gallery : [];
      const updated = currentGallery.filter((_, idx) => idx !== removeIdx);
      const newImg = prev.product_image === currentGallery[removeIdx] ? (updated[0] || '') : prev.product_image;
      setSelectedPreviewImg(newImg);
      return {
        ...prev,
        product_gallery: updated,
        product_image: newImg
      };
    });
    showToast('success', 'Thumbnail removed');
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
        title="Trending on the Gram"
        subtitle="Manage Reels, videos, captions, and Instagram links shown in the 9:16 vertical card carousel."
        actions={
          <>
            <button
              type="button"
              onClick={fetchPosts}
              disabled={loading}
              className="p-2.5 bg-white border border-[#E5E0D5] hover:bg-neutral-50 text-neutral-700 rounded-xl transition-all cursor-pointer shadow-2xs"
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
          </>
        }
      />

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
                    onClick={() => openEditModal(post)}
                    className="relative w-full aspect-[9/16] bg-neutral-900 overflow-hidden cursor-pointer"
                    title="Click to open Live Split-Screen Look Editor"
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

                  {/* Right-Side Product Thumbnail Indicator */}
                  <div className="p-2.5 bg-neutral-100/70 border-t border-b border-neutral-100 flex items-center gap-2.5">
                    <div className="w-10 h-12 rounded-lg bg-neutral-200 overflow-hidden shrink-0 border border-neutral-200 flex items-center justify-center">
                      {post.product_image ? (
                        <img
                          src={post.product_image}
                          alt={post.product_name || 'Product'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[8px] font-bold text-neutral-400 uppercase text-center px-1">
                          Default Look
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block">
                        Right-Side Product
                      </span>
                      <p className="text-[11px] font-semibold text-neutral-800 truncate">
                        {post.product_name || (post.product_image ? 'Custom Product Image' : 'Default Fallback')}
                      </p>
                      {post.product_price && (
                        <span className="text-[10px] font-mono text-emerald-700 font-semibold block">
                          ₹{post.product_price}
                        </span>
                      )}
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

      {/* Live Storefront Split-Screen Editor Modal (Exact Match to Homepage Shop The Look Popup) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none animate-in fade-in">
          {/* Darkened Backdrop */}
          <div
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Floating Close Button on Top Right (Exact match to storefront popup) */}
          <button
            onClick={() => setIsModalOpen(false)}
            className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 w-10 h-10 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-white flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-lg border border-neutral-700/50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Center Modal Container - Exact Two-Column Layout from Screenshot 2 */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative z-40 w-full max-w-4xl lg:max-w-5xl bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-neutral-200/60 max-h-[94vh] md:h-[660px]"
          >
            {/* ======================================================== */}
            {/* LEFT COLUMN: REEL VIDEO / MEDIA (Matches Screenshot 2) */}
            {/* ======================================================== */}
            <div className="relative w-full md:w-[48%] h-[380px] sm:h-[440px] md:h-full bg-neutral-950 flex-shrink-0 overflow-hidden group flex flex-col justify-between">
              {/* Media Player */}
              <div className="absolute inset-0 z-0 bg-neutral-950">
                {formData.image ? (
                  formData.media_type === 'video' || formData.image.endsWith('.mp4') ? (
                    <video
                      key={formData.image}
                      src={formData.image.startsWith('http') || formData.image.startsWith('/') ? formData.image : getSupabaseMediaUrl(formData.image)}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={formData.image.startsWith('http') || formData.image.startsWith('/') ? formData.image : getSupabaseMediaUrl(formData.image)}
                      alt="Reel Media"
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-neutral-400 bg-neutral-900">
                    <Video className="w-12 h-12 stroke-[1.2] mb-3 text-neutral-500 animate-pulse" />
                    <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider font-admin">
                      No Reel Video Uploaded
                    </span>
                    <p className="text-[11px] text-neutral-500 mt-1 max-w-[200px]">
                      Use the upload button above to add an MP4 reel.
                    </p>
                  </div>
                )}
              </div>

              {/* Top Bar on Left Column */}
              <div className="relative z-30 p-3.5 flex items-center justify-between gap-2">
                {/* Reel Tag Badge (Exact match to screenshot 2) */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white/95 text-[10px] tracking-wider uppercase font-sans border border-white/10 shadow-sm">
                  <InstagramIcon />
                  <span>@houseofurvaah</span>
                </div>

                {/* Floating Upload Buttons directly on Left Reel */}
                <div className="flex items-center gap-1.5">
                  <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/70 hover:bg-black text-white text-[10px] font-bold tracking-wider uppercase cursor-pointer backdrop-blur-md border border-white/20 transition-all hover:scale-105 shadow-md">
                    <Video className="w-3 h-3 text-emerald-400" />
                    <span>{uploadingFile ? 'Uploading...' : 'Reel Video'}</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      className="hidden"
                      disabled={uploadingFile}
                      onChange={(e) => handleFileUpload(e, 'video')}
                    />
                  </label>

                  <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/70 hover:bg-black text-white text-[10px] font-bold tracking-wider uppercase cursor-pointer backdrop-blur-md border border-white/20 transition-all hover:scale-105 shadow-md">
                    <ImageIcon className="w-3 h-3 text-blue-400" />
                    <span>Photo</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={uploadingFile}
                      onChange={(e) => handleFileUpload(e, 'image')}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowReelConfigDrawer(!showReelConfigDrawer)}
                    className={`p-1.5 rounded-full transition-all cursor-pointer backdrop-blur-md border ${
                      showReelConfigDrawer
                        ? 'bg-white text-black border-white'
                        : 'bg-black/70 hover:bg-black text-white border-white/20'
                    }`}
                    title="Toggle Style Tag & Link settings"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Upload Error Banner if any */}
              {uploadError && (
                <div className="relative z-30 mx-3 p-2 bg-rose-950/80 border border-rose-500/50 rounded-xl text-[11px] text-rose-200 backdrop-blur-md flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Collapsible / Floating Reel Meta Overlay */}
              {showReelConfigDrawer ? (
                <div className="relative z-30 m-3 p-3.5 rounded-2xl bg-black/85 backdrop-blur-lg border border-white/20 text-white space-y-2.5 shadow-2xl animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 font-admin">
                      Reel Settings & Tags
                    </span>
                    <label className="flex items-center gap-1.5 text-[10px] font-bold cursor-pointer text-emerald-400">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-3.5 h-3.5 rounded bg-black/50 border-neutral-600 text-emerald-500"
                      />
                      <span>Active</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-white/60 block mb-0.5">Style Tag</span>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="CORSET TOPS"
                        className="w-full px-2.5 py-1 bg-white/10 border border-white/20 rounded-lg text-xs text-white placeholder-white/40 focus:outline-none focus:bg-white/20 font-admin uppercase"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-white/60 block mb-0.5">Caption</span>
                      <input
                        type="text"
                        value={formData.caption}
                        onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                        placeholder="STUDIO EDIT • ..."
                        className="w-full px-2.5 py-1 bg-white/10 border border-white/20 rounded-lg text-xs text-white placeholder-white/40 focus:outline-none focus:bg-white/20"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-white/60 block mb-0.5">Instagram Link</span>
                    <input
                      type="text"
                      value={formData.post_link}
                      onChange={(e) => setFormData({ ...formData, post_link: e.target.value })}
                      placeholder="https://www.instagram.com/houseofurvaah/"
                      className="w-full px-2.5 py-1 bg-white/10 border border-white/20 rounded-lg text-[11px] text-white placeholder-white/40 focus:outline-none focus:bg-white/20 font-mono"
                    />
                  </div>

                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-white/60 block mb-0.5">Media URL / Path</span>
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
                      placeholder="/assets/video/video6.mp4"
                      className="w-full px-2.5 py-1 bg-white/10 border border-white/20 rounded-lg text-[11px] text-white placeholder-white/40 focus:outline-none focus:bg-white/20 font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div className="relative z-30 p-3.5 flex items-end justify-between">
                  {/* Instagram Account Profile Pill (Exact match to screenshot 2) */}
                  <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/10 shadow-lg">
                    <img
                      src={getSupabaseMediaUrl('logo.png')}
                      alt="House of Urvaah"
                      className="w-6 h-6 rounded-full object-cover bg-white p-0.5"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/assets/logo.png';
                      }}
                    />
                    <div className="flex flex-col text-left leading-tight">
                      <div className="flex items-center gap-1 text-[11px] font-semibold tracking-wide text-white">
                        <span>houseofurvaah</span>
                        <svg className="w-3.5 h-3.5 text-blue-400 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7l-3.8-3.8 1.4-1.4 2.4 2.4 6.4-6.4 1.4 1.4-7.8 7.8z" />
                        </svg>
                      </div>
                      <span className="text-[9px] text-neutral-300 font-normal">House of Urvaah</span>
                    </div>
                  </div>

                  {/* Badge showing current Style Tag */}
                  <div className="hidden sm:block text-right">
                    <span className="text-[10px] tracking-widest uppercase text-white/70 block">
                      {formData.title || 'STYLE EDIT'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* RIGHT COLUMN: PRODUCT DETAILS (Matches Screenshot 2)     */}
            {/* ======================================================== */}
            <div className="w-full md:w-[52%] flex flex-col h-full overflow-hidden bg-white text-neutral-900 font-sans">
              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 md:p-7 space-y-4">

                {productUploadError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{productUploadError}</span>
                  </div>
                )}

                {/* Main Product Image Viewer with Carousel Controls (Exact match to screenshot 2) */}
                <div className="relative w-full h-[220px] sm:h-[250px] md:h-[270px] rounded-xl overflow-hidden bg-neutral-100 group shadow-xs flex items-center justify-center">
                  <img
                    src={getSupabaseMediaUrl(selectedPreviewImg || formData.product_image || '/assets/Images/Blue01.png')}
                    alt={formData.product_name || 'Product'}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = selectedPreviewImg || formData.product_image || '/assets/Images/Blue01.png';
                    }}
                    className="w-full h-full object-contain object-center transition-all duration-300 p-1"
                  />

                  {/* Floating Upload Product Image Button */}
                  <label className="absolute top-2.5 right-2.5 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 hover:bg-black text-white text-[10px] font-bold tracking-wider uppercase cursor-pointer backdrop-blur-md border border-white/20 transition-all hover:scale-105 shadow-md">
                    <Upload className="w-3 h-3 text-emerald-400" />
                    <span>{uploadingProductFile ? 'Uploading...' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={uploadingProductFile}
                      onChange={handleProductImageUpload}
                    />
                  </label>

                  {/* Carousel Chevrons if multiple images */}
                  {(formData.product_gallery || []).length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrevPreviewImg}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/85 hover:bg-white text-neutral-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextPreviewImg}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/85 hover:bg-white text-neutral-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      {/* Indicator dots */}
                      <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1">
                        {(formData.product_gallery || []).map((_, i) => (
                          <span
                            key={i}
                            className={`h-1.5 rounded-full transition-all ${
                              i === selectedGalleryIdx ? 'w-4 bg-neutral-800' : 'w-1.5 bg-neutral-400/60'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Direct Image URL / Path Input */}
                <div>
                  <input
                    type="text"
                    value={formData.product_image}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({ ...prev, product_image: val }));
                      setSelectedPreviewImg(val);
                    }}
                    placeholder="Or enter image URL (e.g. /assets/Images/Blue01.png)"
                    className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-mono text-neutral-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-black transition-all"
                  />
                </div>

                {/* Product Title & Formatted Price (Editable directly in place) */}
                <div className="space-y-1.5">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">
                      Product Title
                    </label>
                    <input
                      type="text"
                      value={formData.product_name}
                      onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                      placeholder="TEAL EMBROIDERED FLORAL CO-ORD SET"
                      className="w-full font-serif text-base sm:text-lg md:text-xl font-normal tracking-[0.04em] uppercase text-neutral-900 border-b border-transparent hover:border-neutral-300 focus:border-black focus:outline-none transition-all pb-0.5 bg-transparent"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 shrink-0">
                      Price:
                    </label>
                    <input
                      type="text"
                      value={formData.product_price}
                      onChange={(e) => setFormData({ ...formData, product_price: e.target.value })}
                      placeholder="₹ 10,990"
                      className="font-sans text-sm sm:text-base font-semibold text-neutral-900 border-b border-transparent hover:border-neutral-300 focus:border-black focus:outline-none transition-all bg-transparent w-40"
                    />
                  </div>
                </div>

                {/* Selected Product Section with Thumbnails (Exact match to screenshot 2) */}
                <div className="pt-2 border-t border-neutral-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-neutral-800 uppercase tracking-wider block font-sans">
                      Selected Product
                    </span>
                    <label className="text-[10px] font-bold text-neutral-700 hover:text-black flex items-center gap-1 cursor-pointer">
                      <Plus className="w-3 h-3 text-neutral-900" />
                      <span>Add Thumbnail</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={uploadingProductFile}
                        onChange={handleAddGalleryImage}
                      />
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                    {(formData.product_gallery || []).map((img, idx) => {
                      const isSelected = (selectedPreviewImg || formData.product_image) === img;
                      return (
                        <div key={idx} className="relative group">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPreviewImg(img);
                              setSelectedGalleryIdx(idx);
                              setFormData((prev) => ({ ...prev, product_image: img }));
                            }}
                            className={`relative w-12 h-14 sm:w-14 sm:h-16 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100 transition-all cursor-pointer flex items-center justify-center ${
                              isSelected
                                ? 'border-2 border-black ring-2 ring-black/10'
                                : 'border border-neutral-200 hover:border-neutral-400 opacity-75 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={getSupabaseMediaUrl(img)}
                              alt="Thumbnail"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = img;
                              }}
                              className="w-full h-full object-cover object-center"
                            />
                          </button>
                          {(formData.product_gallery || []).length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveGalleryImage(idx)}
                              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                              title="Remove image"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Product PDP Link ID */}
                <div className="pt-2 border-t border-neutral-100 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 shrink-0">
                    Product ID / Slug:
                  </span>
                  <input
                    type="text"
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    placeholder="bs-102 (opens /product/bs-102)"
                    className="w-full px-2.5 py-1 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-mono text-neutral-800 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              {/* Sticky Action Buttons Bar at the Bottom (Matches Screenshot 2) */}
              <div className="p-4 sm:px-6 md:px-7 bg-white border-t border-neutral-100 flex items-center gap-2 sm:gap-3 flex-shrink-0 z-10 shadow-xs">
                {/* Cancel button */}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 sm:py-3 px-3 border border-neutral-300 hover:border-black rounded-lg text-[11px] sm:text-xs tracking-wider uppercase font-semibold text-neutral-800 hover:text-black transition-colors text-center cursor-pointer"
                >
                  Cancel
                </button>

                {/* Save & Publish button (Sleek black button matching Add to Cart) */}
                <button
                  type="button"
                  onClick={handleSavePost}
                  disabled={saving || uploadingFile || uploadingProductFile}
                  className="flex-[2] py-2.5 sm:py-3 px-4 bg-neutral-950 hover:bg-black text-white rounded-lg text-[11px] sm:text-xs tracking-wider uppercase font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>{editingPost ? 'Update & Save Look' : 'Add & Publish Look'}</span>
                </button>
              </div>
            </div>
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
