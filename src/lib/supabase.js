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
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  let cleanPath = path.startsWith("/") ? path.slice(1) : path;

  // Handle HOU_desktop aliases
  if (cleanPath.includes("HOU_desktop")) {
    return `${CDN_BASE_URL}/videos/HOU_desktop%20video.mp4.mp4`;
  }

  // Remove "assets/" prefix if present
  if (cleanPath.startsWith("assets/")) {
    cleanPath = cleanPath.replace(/^assets\//, "");
  }

  // Normalize "video/" to "videos/" to match Supabase bucket folder
  if (cleanPath.startsWith("video/")) {
    cleanPath = cleanPath.replace(/^video\//, "videos/");
  }

  return `${CDN_BASE_URL}/${cleanPath}`;
};
