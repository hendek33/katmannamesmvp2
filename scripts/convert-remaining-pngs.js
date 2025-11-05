import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function convertToWebP() {
  try {
    console.log('🎨 Kalan PNG dosyalarını WebP formatına dönüştürülüyor...\n');
    
    const publicDir = path.join(__dirname, '../client/public');
    
    // Images to convert
    const images = [
      { name: 'ajan siyah.png', quality: 85 },
      { name: 'başla.png', quality: 90 },
      { name: 'kelime kartı arkaplan.png', quality: 85 },
      { name: 'kırmızı takım.png', quality: 85 },
      { name: 'mavi takım.png', quality: 85 }
    ];
    
    let totalOriginalSize = 0;
    let totalWebPSize = 0;
    const results = [];
    
    for (const image of images) {
      const inputPath = path.join(publicDir, image.name);
      const outputPath = path.join(publicDir, image.name.replace('.png', '.webp'));
      
      try {
        // Check if file exists
        await fs.access(inputPath);
        
        // Get original file size
        const stats = await fs.stat(inputPath);
        const originalSizeMB = (stats.size / 1024 / 1024).toFixed(2);
        totalOriginalSize += stats.size;
        
        console.log(`📷 ${image.name} işleniyor...`);
        
        // Convert to WebP with specified quality
        await sharp(inputPath)
          .webp({ 
            quality: image.quality,
            effort: 6,
            lossless: false
          })
          .toFile(outputPath);
        
        // Get new file size
        const webpStats = await fs.stat(outputPath);
        const webpSizeMB = (webpStats.size / 1024 / 1024).toFixed(2);
        totalWebPSize += webpStats.size;
        
        const reduction = ((1 - webpStats.size / stats.size) * 100).toFixed(1);
        
        results.push({
          file: image.name.replace('.png', ''),
          originalSize: originalSizeMB,
          webpSize: webpSizeMB,
          reduction: reduction
        });
        
        console.log(`✅ ${image.name}`);
        console.log(`   PNG: ${originalSizeMB} MB → WebP: ${webpSizeMB} MB (${reduction}% küçültüldü)\n`);
        
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.log(`⚠️  ${image.name} dosyası bulunamadı, atlanıyor...`);
        } else {
          console.error(`❌ Hata: ${image.name} - ${error.message}`);
        }
      }
    }
    
    // Print summary
    if (results.length > 0) {
      console.log('='.repeat(60));
      console.log('📊 DÖNÜŞÜM ÖZETİ:');
      console.log('='.repeat(60));
      
      const totalOriginalMB = (totalOriginalSize / 1024 / 1024).toFixed(2);
      const totalWebPMB = (totalWebPSize / 1024 / 1024).toFixed(2);
      const totalReduction = ((1 - totalWebPSize / totalOriginalSize) * 100).toFixed(1);
      
      console.log(`\nToplam PNG boyutu:  ${totalOriginalMB} MB`);
      console.log(`Toplam WebP boyutu: ${totalWebPMB} MB`);
      console.log(`Toplam kazanç:      ${totalReduction}% (${((totalOriginalSize - totalWebPSize) / 1024 / 1024).toFixed(2)} MB tasarruf)`);
      
      console.log('\n✨ Dönüşümler başarıyla tamamlandı!');
    }
    
  } catch (error) {
    console.error('Hata:', error);
  }
}

// Run the conversion
convertToWebP();