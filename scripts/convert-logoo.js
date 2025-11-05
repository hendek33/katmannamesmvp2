import sharp from 'sharp';

sharp('attached_assets/logoo.png')
  .webp({ quality: 90 })
  .toFile('attached_assets/logoo.webp')
  .then(info => {
    console.log('✅ logoo.png → logoo.webp dönüştürüldü');
    const reduction = ((1 - info.size / info.size) * 100).toFixed(1);
    console.log(`   Boyut: ${(info.size / 1024 / 1024).toFixed(2)} MB`);
  })
  .catch(err => {
    console.error('Hata:', err);
  });