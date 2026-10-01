const fs = require('fs');

const logoPng = 'c:/workspace/Urvaah latest/house-of-urvaah-FE/public/assets/logo.png';
const brandLogoPng = 'c:/workspace/Urvaah latest/house-of-urvaah-FE/public/assets/brand-logo.png';

console.log('logo.png size:', fs.statSync(logoPng).size);
console.log('brand-logo.png size:', fs.statSync(brandLogoPng).size);
