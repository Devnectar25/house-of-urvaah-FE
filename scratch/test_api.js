async function checkApi() {
  try {
    const res = await fetch('http://localhost:4000/api/products/featured');
    const data = await res.json();
    console.log('Featured API status:', res.status);
    console.log('Featured API count:', data?.data?.length || (Array.isArray(data) ? data.length : 'not array'));
    console.log('Featured API products:', data);
  } catch (e) {
    console.error('API fetch error:', e.message);
  }
}

checkApi();
