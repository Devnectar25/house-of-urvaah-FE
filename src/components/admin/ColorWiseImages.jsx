import React, { useState } from 'react';
import {
  Upload,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Film,
  Trash2,
  Package
} from 'lucide-react';
import { getSwatchCss, getColorName } from '../../utils/colorValidator';
import { uploadVideoDirect } from '../../lib/directVideoUpload';

export default function ColorWiseImages({
  colors = [],
  sizes = [],
  colorImages = [],
  onChange
}) {
  const [uploadingColor, setUploadingColor] = useState(null);
  const [uploadingVideoColor, setUploadingVideoColor] = useState(null);
  const [urlInputs, setUrlInputs] = useState({});
  const [showUrlInputs, setShowUrlInputs] = useState({});
  const [videoUrlInputs, setVideoUrlInputs] = useState({});
  const [showVideoUrlInputs, setShowVideoUrlInputs] = useState({});
  const [errorMessages, setErrorMessages] = useState({});

  // Helper to match a colour entry in colorImages
  const findEntryIndex = (colorName) => {
    if (!colorName) return -1;
    const clean = colorName.trim().toLowerCase();
    const targetDisplayName = (getColorName(colorName) || colorName).trim().toLowerCase();
    return (colorImages || []).findIndex((item) => {
      if (!item?.color) return false;
      const itemClean = item.color.trim().toLowerCase();
      const itemDisplayName = (getColorName(item.color) || item.color).trim().toLowerCase();
      return (
        itemClean === clean ||
        itemDisplayName === targetDisplayName ||
        itemClean === targetDisplayName ||
        itemDisplayName === clean
      );
    });
  };

  const getEntryForColor = (colorName) => {
    const idx = findEntryIndex(colorName);
    return idx >= 0 ? colorImages[idx] : null;
  };

  // Helper to update any part of a colour's entry (images, video, sizeStock)
  const updateEntryForColor = (colorName, mutator) => {
    const cleanColor = colorName.trim();
    const targetDisplayName = getColorName(cleanColor) || cleanColor;
    const existingIndex = findEntryIndex(cleanColor);

    let next = Array.isArray(colorImages) ? [...colorImages] : [];
    let currentEntry = existingIndex >= 0
      ? { ...next[existingIndex] }
      : {
          color: targetDisplayName,
          images: [],
          video: '',
          sizeStock: {}
        };

    const updated = mutator(currentEntry);

    const hasImages = Array.isArray(updated.images) && updated.images.length > 0;
    const hasVideo = typeof updated.video === 'string' && updated.video.trim().length > 0;
    const hasSizeStock =
      updated.sizeStock &&
      typeof updated.sizeStock === 'object' &&
      Object.keys(updated.sizeStock).length > 0;

    if (existingIndex >= 0) {
      if (!hasImages && !hasVideo && !hasSizeStock) {
        next.splice(existingIndex, 1);
      } else {
        next[existingIndex] = {
          ...updated,
          color: targetDisplayName
        };
      }
    } else if (hasImages || hasVideo || hasSizeStock) {
      next.push({
        ...updated,
        color: targetDisplayName
      });
    }

    if (onChange) {
      onChange(next);
    }
  };

  // --- OUTFIT IMAGES ---
  const getImagesForColor = (colorName) => {
    const entry = getEntryForColor(colorName);
    return Array.isArray(entry?.images) ? entry.images : [];
  };

  const updateImagesForColor = (colorName, newImages) => {
    updateEntryForColor(colorName, (prev) => ({
      ...prev,
      images: newImages
    }));
  };

  const handleFileUpload = async (colorName, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const currentImages = getImagesForColor(colorName);
    if (currentImages.length >= 5) {
      setErrorMessages((prev) => ({
        ...prev,
        [colorName]: 'Maximum 5 images allowed per colour.'
      }));
      return;
    }

    setUploadingColor(colorName);
    setErrorMessages((prev) => ({ ...prev, [colorName]: null }));

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('image', file);
      uploadData.append('folder', 'products');

      const API_BASE = (
        import.meta.env.VITE_API_URL ||
        import.meta.env.VITE_API_BASE_URL ||
        'http://localhost:4000'
      ).replace(/\/$/, '');
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
        updateImagesForColor(colorName, [...currentImages, uploadedUrl]);
        setErrorMessages((prev) => ({ ...prev, [colorName]: null }));
      } else {
        throw new Error('No image URL returned from server.');
      }
    } catch (err) {
      console.error(`Upload failed for color ${colorName}:`, err);
      setErrorMessages((prev) => ({
        ...prev,
        [colorName]: err.message || 'Image upload failed. Please try again or provide a direct URL.'
      }));
    } finally {
      setUploadingColor(null);
      e.target.value = '';
    }
  };

  const handleAddUrl = (colorName) => {
    const url = (urlInputs[colorName] || '').trim();
    if (!url) return;

    const currentImages = getImagesForColor(colorName);
    if (currentImages.length >= 5) {
      setErrorMessages((prev) => ({
        ...prev,
        [colorName]: 'Maximum 5 images allowed per colour.'
      }));
      return;
    }

    updateImagesForColor(colorName, [...currentImages, url]);
    setUrlInputs((prev) => ({ ...prev, [colorName]: '' }));
    setShowUrlInputs((prev) => ({ ...prev, [colorName]: false }));
    setErrorMessages((prev) => ({ ...prev, [colorName]: null }));
  };

  const handleRemoveImage = (colorName, index) => {
    const currentImages = getImagesForColor(colorName);
    const updated = currentImages.filter((_, idx) => idx !== index);
    updateImagesForColor(colorName, updated);
  };

  const handleMoveLeft = (colorName, index) => {
    if (index <= 0) return;
    const currentImages = [...getImagesForColor(colorName)];
    const [moved] = currentImages.splice(index, 1);
    currentImages.splice(index - 1, 0, moved);
    updateImagesForColor(colorName, currentImages);
  };

  const handleMoveRight = (colorName, index) => {
    const currentImages = [...getImagesForColor(colorName)];
    if (index >= currentImages.length - 1) return;
    const [moved] = currentImages.splice(index, 1);
    currentImages.splice(index + 1, 0, moved);
    updateImagesForColor(colorName, currentImages);
  };

  // --- FABRIC VIDEO ---
  const getVideoForColor = (colorName) => {
    const entry = getEntryForColor(colorName);
    return typeof entry?.video === 'string'
      ? entry.video
      : typeof entry?.video_url === 'string'
      ? entry.video_url
      : '';
  };

  const updateVideoForColor = (colorName, videoUrl) => {
    updateEntryForColor(colorName, (prev) => ({
      ...prev,
      video: videoUrl || '',
      video_url: videoUrl || ''
    }));
  };

  const handleVideoUpload = async (colorName, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideoColor(colorName);
    setErrorMessages((prev) => ({ ...prev, [colorName]: null }));

    try {
      const uploadedUrl = await uploadVideoDirect(file, 'products/videos');
      if (uploadedUrl) {
        updateVideoForColor(colorName, uploadedUrl);
        setErrorMessages((prev) => ({ ...prev, [colorName]: null }));
      } else {
        throw new Error('No video URL returned.');
      }
    } catch (err) {
      console.error(`Fabric video upload failed for color ${colorName}:`, err);
      setErrorMessages((prev) => ({
        ...prev,
        [colorName]:
          err.message ||
          'Fabric video upload failed. Please try again or provide a direct video URL.'
      }));
    } finally {
      setUploadingVideoColor(null);
      e.target.value = '';
    }
  };

  const handleAddVideoUrl = (colorName) => {
    const url = (videoUrlInputs[colorName] || '').trim();
    if (!url) return;
    updateVideoForColor(colorName, url);
    setVideoUrlInputs((prev) => ({ ...prev, [colorName]: '' }));
    setShowVideoUrlInputs((prev) => ({ ...prev, [colorName]: false }));
    setErrorMessages((prev) => ({ ...prev, [colorName]: null }));
  };

  const handleRemoveVideo = (colorName) => {
    updateVideoForColor(colorName, '');
  };

  // --- SIZE INVENTORY ---
  const getSizeStockForColor = (colorName) => {
    const entry = getEntryForColor(colorName);
    return entry?.sizeStock && typeof entry.sizeStock === 'object'
      ? entry.sizeStock
      : entry?.size_stock && typeof entry.size_stock === 'object'
      ? entry.size_stock
      : {};
  };

  const handleSizeStockChange = (colorName, sizeKey, val) => {
    const cleanSz = String(sizeKey).trim();
    updateEntryForColor(colorName, (prev) => {
      const currentStock = { ...(prev.sizeStock || prev.size_stock || {}) };
      if (val === '' || val === null || val === undefined) {
        delete currentStock[cleanSz];
      } else {
        const num = Math.max(0, parseInt(val, 10) || 0);
        currentStock[cleanSz] = num;
      }
      return {
        ...prev,
        sizeStock: currentStock,
        size_stock: currentStock
      };
    });
  };

  return (
    <div className="space-y-4 pt-3 border-t border-neutral-100">
      <div>
        <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
          Colour-Wise Images, Fabric Video &amp; Inventory (Optional)
        </label>
        <p className="text-[11px] text-neutral-400 mt-0.5">
          Configure outfit images, fabric video, and size-specific stock for each colour. When a shopper selects this colour, its images and fabric video replace the main gallery, and its size inventory is applied.
        </p>
      </div>

      {!colors || colors.length === 0 ? (
        <div className="p-4 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 text-center text-xs text-neutral-400">
          Add colours in &apos;Colors Available&apos; to configure colour-specific images, fabric video, and inventory.
        </div>
      ) : (
        <div className="space-y-4">
          {colors.map((rawColor) => {
            const displayName = getColorName(rawColor) || rawColor;
            const swatchCss = getSwatchCss(rawColor);
            const images = getImagesForColor(rawColor);
            const currentVideo = getVideoForColor(rawColor);
            const sizeStock = getSizeStockForColor(rawColor);
            const isUploading = uploadingColor === rawColor;
            const isUploadingVideo = uploadingVideoColor === rawColor;
            const error = errorMessages[rawColor];
            const isShowingUrl = showUrlInputs[rawColor];
            const isShowingVideoUrl = showVideoUrlInputs[rawColor];

            return (
              <div
                key={rawColor}
                className="rounded-xl border border-neutral-200 bg-neutral-50/40 p-4 space-y-4 shadow-2xs"
              >
                {/* Colour Block Header */}
                <div className="flex items-center justify-between pb-2 border-b border-neutral-200/60">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full border border-neutral-300 shadow-2xs shrink-0"
                      style={{ background: swatchCss }}
                    />
                    <span className="text-xs font-bold text-neutral-800 tracking-wide uppercase">
                      {displayName}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-medium text-neutral-500">
                    {images.length} / 5 images
                  </span>
                </div>

                {error && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium p-2 bg-rose-50 border border-rose-200 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* 1. OUTFIT IMAGES */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider">
                      Outfit Images
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      Up to 5 images • First is cover
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 p-1 rounded-xl">
                    {images.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="relative group aspect-3/4 bg-white rounded-xl overflow-hidden border border-neutral-200 shadow-2xs"
                      >
                        <img
                          src={imgUrl}
                          alt={`${displayName} preview ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />

                        {/* Cover Badge on Index 0 */}
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 bg-brand-dark/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase">
                            Cover
                          </span>
                        )}

                        {/* Reorder Arrows */}
                        <div className="absolute bottom-1 right-1 flex items-center gap-0.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleMoveLeft(rawColor, idx)}
                              className="p-1 bg-black/75 hover:bg-black text-white rounded cursor-pointer"
                              title="Move earlier"
                            >
                              <ChevronLeft className="w-2.5 h-2.5" />
                            </button>
                          )}
                          {idx < images.length - 1 && (
                            <button
                              type="button"
                              onClick={() => handleMoveRight(rawColor, idx)}
                              className="p-1 bg-black/75 hover:bg-black text-white rounded cursor-pointer"
                              title="Move later"
                            >
                              <ChevronRight className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(rawColor, idx)}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Remove image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {/* Add Image Tile */}
                    {images.length < 5 && (
                      <label className="aspect-3/4 border-2 border-dashed border-neutral-300 hover:border-brand-dark rounded-xl flex flex-col items-center justify-center cursor-pointer bg-white hover:bg-neutral-100/60 transition-all p-2 text-center">
                        {isUploading ? (
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
                          onChange={(e) => handleFileUpload(rawColor, e)}
                          disabled={isUploading}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Direct URL Input Row */}
                  <div className="pt-1">
                    {!isShowingUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          setShowUrlInputs((prev) => ({ ...prev, [rawColor]: true }))
                        }
                        className="text-[11px] font-semibold text-neutral-500 hover:text-brand-dark transition-colors cursor-pointer"
                        style={{ textDecoration: 'none' }}
                      >
                        + Or add image via direct URL
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={urlInputs[rawColor] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setUrlInputs((prev) => ({ ...prev, [rawColor]: val }));
                          }}
                          placeholder="https://example.com/color-image.jpg"
                          className="flex-1 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddUrl(rawColor)}
                          className="px-3 py-1.5 bg-brand-dark text-white text-xs font-semibold rounded-lg hover:bg-black transition-colors cursor-pointer"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setShowUrlInputs((prev) => ({ ...prev, [rawColor]: false }))
                          }
                          className="text-xs text-neutral-400 hover:text-neutral-600 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. FABRIC VIDEO (OPTIONAL) */}
                <div className="pt-3 border-t border-neutral-200/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider">
                        Fabric Video (Optional)
                      </span>
                      <p className="text-[10px] text-neutral-400">
                        Upload 1 showcase video of the fabric for this colour
                      </p>
                    </div>
                    {currentVideo && (
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        1 video attached
                      </span>
                    )}
                  </div>

                  {currentVideo ? (
                    <div className="relative w-full max-w-xs rounded-xl overflow-hidden border border-neutral-300 bg-black shadow-xs group">
                      <video
                        src={currentVideo}
                        controls
                        muted
                        playsInline
                        className="w-full max-h-44 object-contain bg-black"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveVideo(rawColor)}
                        className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow transition-all cursor-pointer"
                        title="Remove fabric video"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="h-9 px-3 border border-dashed border-neutral-300 hover:border-brand-dark rounded-lg flex items-center gap-2 cursor-pointer bg-white hover:bg-neutral-100/60 transition-all text-xs font-semibold text-neutral-700">
                        {isUploadingVideo ? (
                          <Loader2 className="w-4 h-4 animate-spin text-brand-dark" />
                        ) : (
                          <>
                            <Film className="w-3.5 h-3.5 text-neutral-400" />
                            <span className="text-[10px] uppercase tracking-wide">
                              + Upload Fabric Video
                            </span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => handleVideoUpload(rawColor, e)}
                          disabled={isUploadingVideo}
                          className="hidden"
                        />
                      </label>

                      {!isShowingVideoUrl ? (
                        <button
                          type="button"
                          onClick={() =>
                            setShowVideoUrlInputs((prev) => ({ ...prev, [rawColor]: true }))
                          }
                          className="text-[11px] font-semibold text-neutral-500 hover:text-brand-dark cursor-pointer ml-1"
                        >
                          + Or add video via URL
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-1 max-w-sm">
                          <input
                            type="url"
                            value={videoUrlInputs[rawColor] || ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              setVideoUrlInputs((prev) => ({ ...prev, [rawColor]: v }));
                            }}
                            placeholder="https://example.com/fabric-video.mp4"
                            className="flex-1 px-2.5 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddVideoUrl(rawColor)}
                            className="px-2.5 py-1.5 bg-brand-dark text-white text-xs font-semibold rounded-lg hover:bg-black transition-colors cursor-pointer"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setShowVideoUrlInputs((prev) => ({ ...prev, [rawColor]: false }))
                            }
                            className="text-xs text-neutral-400 hover:text-neutral-600 cursor-pointer px-1"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. SIZE INVENTORY (OPTIONAL) */}
                <div className="pt-3 border-t border-neutral-200/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider">
                        Size Inventory (Optional)
                      </span>
                      <p className="text-[10px] text-neutral-400">
                        Set stock per size for {displayName}. Leave empty to use product stock.
                      </p>
                    </div>
                  </div>

                  {sizes && sizes.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {sizes.map((sz) => {
                        const currentVal = sizeStock[sz] !== undefined ? sizeStock[sz] : '';
                        return (
                          <div
                            key={sz}
                            className="flex flex-col items-center bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 min-w-[64px]"
                          >
                            <span className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                              {sz}
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={currentVal}
                              onChange={(e) =>
                                handleSizeStockChange(rawColor, sz, e.target.value)
                              }
                              placeholder="0"
                              className="w-12 text-center px-1 py-0.5 text-xs font-mono font-medium border border-neutral-200 rounded focus:border-brand-dark focus:outline-none"
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-neutral-400 italic">
                      Select sizes in &apos;Sizes Available&apos; above to manage size-wise stock for this colour.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
