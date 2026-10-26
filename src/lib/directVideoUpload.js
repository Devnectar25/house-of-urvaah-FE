import { apiClient } from './apiClient';
import { supabase, BUCKET_NAME } from './supabase';

/**
 * Uploads a video straight from the browser to storage and returns its public URL.
 *
 * Videos are too large to pass through the API on the hosting platform (serverless request bodies
 * are capped at ~4.5 MB), so the API only issues a one-time signed upload link (admin only) and the
 * file goes directly to the storage bucket.
 */
export async function uploadVideoDirect(file, folderName = 'products/videos') {
  if (!file) throw new Error('No video selected.');
  const res = await apiClient('/api/upload/video-upload-url', {
    method: 'POST',
    isAdmin: true,
    body: JSON.stringify({ fileName: file.name, contentType: file.type, folderName })
  });
  const info = res?.data;
  if (!info?.path || !info?.token) throw new Error('Could not prepare the video upload. Please try again.');

  const { error } = await supabase.storage
    .from(info.bucket || BUCKET_NAME)
    .uploadToSignedUrl(info.path, info.token, file, { contentType: file.type || 'video/mp4' });
  if (error) throw new Error(error.message || 'Video upload failed.');

  return info.publicUrl;
}

export default uploadVideoDirect;
