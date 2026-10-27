import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://fhbdceauisvlcpmuzpmf.supabase.co";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYmRjZWF1aXN2bGNwbXV6cG1mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTU3OTkyNSwiZXhwIjoyMTA1MTU1OTI1fQ.LwQdS-cmhZxUhvLVL-dcMOv0eRIUWa0RK3VQ2gJ0DJk";
export const BUCKET_NAME = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "houseofurvaah-media";
export const CDN_BASE_URL = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}`;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

/**
 * Ensures 100% of images and videos are loaded directly from Supabase Storage CDN
 */
export const getSupabaseMediaUrl = (path) => {
  if (!path || typeof path !== 'string' || path.trim() === '') {
    return `${CDN_BASE_URL}/Images/Blue02.png`;
  }

  let cleanPath = path.trim();

  // If already absolute URL, data URL, or local blob preview URL
  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://") || cleanPath.startsWith("data:") || cleanPath.startsWith("blob:")) {
    return cleanPath;
  }

  // Handle localhost links
  if (cleanPath.includes("localhost:")) {
    cleanPath = cleanPath.replace(/^https?:\/\/localhost(:\d+)?\/?/, "");
  }

  // Strip leading slash
  if (cleanPath.startsWith("/")) {
    cleanPath = cleanPath.slice(1);
  }

  // Remove "assets/" prefix if present to route directly to Supabase CDN bucket
  if (cleanPath.startsWith("assets/")) {
    cleanPath = cleanPath.replace(/^assets\//, "");
  }

  // Handle legacy broken Corset_Blue1 reference
  if (cleanPath.includes("Corset_Blue1")) {
    cleanPath = "Images/Blue02.png";
  }

  // Handle HOU_desktop aliases
  if (cleanPath.includes("HOU_desktop")) {
    return `${CDN_BASE_URL}/videos/HOU_desktop%20video.mp4.mp4`;
  }

  // Handle HOU_mobile aliases
  if (cleanPath.includes("HOU_mobile") || cleanPath.includes("HOU_Desktop_Video_916")) {
    return `${CDN_BASE_URL}/videos/HOU_Desktop_Video_916.mp4`;
  }

  // Normalize "video/" to "videos/" to match Supabase bucket folder
  if (cleanPath.startsWith("video/")) {
    cleanPath = cleanPath.replace(/^video\//, "videos/");
  }

  return `${CDN_BASE_URL}/${cleanPath}`;
};

/**
 * Resized, compressed copy of a storage image (Supabase image transformations). Browsers that
 * accept WebP get WebP automatically: a 1.6 MB PNG becomes ~70 KB at width 600. Non-storage URLs
 * (blob previews, other hosts, videos) are returned unchanged.
 */
export const getOptimizedImageUrl = (path, width = 800, quality = 75) => {
  const url = getSupabaseMediaUrl(path);
  const marker = '/storage/v1/object/public/';
  if (!url.includes(marker) || /\.(mp4|webm|mov|m4v|gif|svg)(\?|$)/i.test(url)) return url;
  const sep = url.includes('?') ? '&' : '?';
  // resize=contain keeps the whole photo: without it Supabase keeps the original height and crops
  // the width to a thin centre strip
  return `${url.replace(marker, '/storage/v1/render/image/public/')}${sep}width=${width}&quality=${quality}&resize=contain`;
};

/** A stored media value that can actually be loaded by other visitors (not a tab-local preview) */
export const isPersistentMediaUrl = (path) =>
  typeof path === 'string' && path.trim() !== '' && !/^blob:/i.test(path.trim());
