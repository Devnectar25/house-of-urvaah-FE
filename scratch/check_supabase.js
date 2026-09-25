import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://fhbdceauisvlcpmuzpmf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYmRjZWF1aXN2bGNwbXV6cG1mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTU3OTkyNSwiZXhwIjoyMTA1MTU1OTI1fQ.LwQdS-cmhZxUhvLVL-dcMOv0eRIUWa0RK3VQ2gJ0DJk";
const BUCKET_NAME = "houseofurvaah-media";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function listFiles() {
  try {
    const { data: rootFiles, error: rootErr } = await supabase.storage.from(BUCKET_NAME).list('');
    console.log('--- ROOT FILES ---');
    console.log(rootFiles ? rootFiles.map(f => f.name) : rootErr);

    const { data: imgFiles, error: imgErr } = await supabase.storage.from(BUCKET_NAME).list('Images');
    console.log('--- IMAGES FOLDER FILES ---');
    console.log(imgFiles ? imgFiles.map(f => f.name) : imgErr);

    const { data: prodFiles, error: prodErr } = await supabase.storage.from(BUCKET_NAME).list('products');
    console.log('--- PRODUCTS FOLDER FILES ---');
    console.log(prodFiles ? prodFiles.map(f => f.name) : prodErr);
  } catch (err) {
    console.error('Error listing storage:', err);
  }
}

listFiles();
