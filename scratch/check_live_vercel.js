async function checkVercel() {
  try {
    const res = await fetch('https://house-of-urvaah-fe.vercel.app/?t=' + Date.now(), {
      headers: { 'Cache-Control': 'no-cache' }
    });
    const html = await res.text();
    const jsMatch = html.match(/\/assets\/index-[^"]+\.js/);
    if (!jsMatch) {
      console.log('No JS bundle found in HTML');
      return false;
    }
    const jsUrl = 'https://house-of-urvaah-fe.vercel.app' + jsMatch[0] + '?t=' + Date.now();
    console.log('Fetching JS bundle:', jsUrl);
    const jsRes = await fetch(jsUrl, { headers: { 'Cache-Control': 'no-cache' } });
    const jsText = await jsRes.text();
    const pos = jsText.indexOf('CURATED ESSENTIALS');
    if (pos !== -1) {
      const snippet = jsText.substring(pos - 100, pos + 300);
      console.log('Found Best Sellers snippet:\n', snippet);
      if (snippet.includes('lg:grid-cols-5')) {
        console.log('SUCCESS: Deployed bundle contains lg:grid-cols-5!');
        return true;
      } else {
        console.log('STILL WAITING: Deployed bundle does NOT contain lg:grid-cols-5 yet.');
        return false;
      }
    } else {
      console.log('CURATED ESSENTIALS snippet not found in bundle');
      return false;
    }
  } catch (e) {
    console.error('Error fetching Vercel:', e.message);
    return false;
  }
}

checkVercel();
