const url = "https://fhbdceauisvlcpmuzpmf.supabase.co/storage/v1/object/public/houseofurvaah-media/Images/Kurti_1.png";

async function check() {
  console.log('Fetching:', url);
  const res = await fetch(url);
  console.log('HTTP Status:', res.status, res.statusText);
  console.log('Content-Type:', res.headers.get('content-type'));
}

check();
