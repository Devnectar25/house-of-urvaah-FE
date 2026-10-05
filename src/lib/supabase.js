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

  // If already absolute URL or data URL
  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://") || cleanPath.startsWith("data:")) {
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

  // Normalize "video/" to "videos/" to match Supabase bucket folder
  if (cleanPath.startsWith("video/")) {
    cleanPath = cleanPath.replace(/^video\//, "videos/");
  }

  return `${CDN_BASE_URL}/${cleanPath}`;
};
