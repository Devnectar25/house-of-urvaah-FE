const testPaths = [
  '/assets/video/Hero-section-video-two.mp4',
  '/assets/Images/Blue_Halter.jpg',
  '/assets/Images/Blue01.png',
  '/assets/Images/Blue02.png',
  '/assets/Images/Blue03.png',
  '/assets/Images/Blue04.png',
  '/assets/Images/Brown_Floral.jpg',
  '/assets/Images/Brown01.png',
  '/assets/Images/Brown02.png',
  '/assets/Images/Brown03.png',
  '/assets/Images/Brown04.png',
  '/assets/Images/Corset01.png',
  '/assets/Images/Corset02.png',
  '/assets/Images/Corset03.png',
  '/assets/Images/Corset04.png',
  '/assets/Images/Peach01.png',
  '/assets/Images/Peach02.png',
  '/assets/Images/Peach03.png',
  '/assets/Images/Peach04.png',
  '/assets/Images/Outfit_Collage.png',
  '/assets/brand-logo.png',
  '/assets/logo.png'
];

async function checkUrl(url) {
  try {
    const res = await fetch(url);
    return res.status;
  } catch (err) {
    return `ERR: ${err.message}`;
  }
}

async function runTests() {
  console.log("Checking Supabase CDN & Vercel URLs...");
  const cdnBase = "https://fhbdceauisvlcpmuzpmf.supabase.co/storage/v1/object/public/house-ofvaah";
  const vercelBase = "https://house-of-urvaah-one.vercel.app";

  for (const p of testPaths) {
    const localUrl = vercelBase + p;
    const supabasePath = p.replace('/assets/', '');
    const cdnUrl = `${cdnBase}/${supabasePath}`;

    const localStatus = await checkUrl(localUrl);
    const cdnStatus = await checkUrl(cdnUrl);

    console.log(`${p.padEnd(42)} | Vercel: ${localStatus} | Supabase CDN: ${cdnStatus}`);
  }
}

runTests();
