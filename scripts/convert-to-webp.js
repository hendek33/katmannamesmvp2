import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inputDir = path.join(__dirname, '../client/public/acilmiskartgorsel');
const outputDir = inputDir; // Same directory

async function convertToWebP() {
  try {
    console.log('🖼️  PNG to WebP dönüşümü başlıyor...\n');
    
    // Read all files in directory
    const files = await fs.readdir(inputDir);
    const pngFiles = files.filter(file => file.endsWith('.png'));
    
    console.log(`📋 ${pngFiles.length} adet PNG dosyası bulundu.\n`);
    
    let totalOriginalSize = 0;
    let totalWebPSize = 0;
    const results = [];
    
    for (const file of pngFiles) {
      const inputPath = path.join(inputDir, file);
      const outputPath = path.join(outputDir, file.replace('.png', '.webp'));
      
      try {
        // Get original file size
        const stats = await fs.stat(inputPath);
        const originalSizeMB = (stats.size / 1024 / 1024).toFixed(2);
        totalOriginalSize += stats.size;
        
        // Convert to WebP with high quality
        await sharp(inputPath)
          .webp({ 
            quality: 85,  // High quality (0-100)
            effort: 6,    // Compression effort (0-6, higher = smaller file)
            lossless: false // Use lossy compression for smaller files
          })
          .toFile(outputPath);
        
        // Get new file size
        const webpStats = await fs.stat(outputPath);
        const webpSizeMB = (webpStats.size / 1024 / 1024).toFixed(2);
        totalWebPSize += webpStats.size;
        
        const reduction = ((1 - webpStats.size / stats.size) * 100).toFixed(1);
        
        results.push({
          file: file.replace('.png', ''),
          originalSize: originalSizeMB,
          webpSize: webpSizeMB,
          reduction: reduction
        });
        
        console.log(`✅ ${file}`);
        console.log(`   PNG: ${originalSizeMB} MB → WebP: ${webpSizeMB} MB (${reduction}% küçültüldü)`);
        
        // Optional: Delete original PNG file after successful conversion
        // await fs.unlink(inputPath);
        
      } catch (error) {
        console.error(`❌ Hata: ${file} - ${error.message}`);
      }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 DÖNÜŞÜM ÖZETİ:');
    console.log('='.repeat(60));
    
    const totalOriginalMB = (totalOriginalSize / 1024 / 1024).toFixed(2);
    const totalWebPMB = (totalWebPSize / 1024 / 1024).toFixed(2);
    const totalReduction = ((1 - totalWebPSize / totalOriginalSize) * 100).toFixed(1);
    
    console.log(`\nToplam PNG boyutu:  ${totalOriginalMB} MB`);
    console.log(`Toplam WebP boyutu: ${totalWebPMB} MB`);
    console.log(`Toplam kazanç:      ${totalReduction}% (${((totalOriginalSize - totalWebPSize) / 1024 / 1024).toFixed(2)} MB tasarruf)`);
    
    // Show largest reductions
    console.log('\n🏆 EN FAZLA KÜÇÜLEN DOSYALAR:');
    results
      .sort((a, b) => parseFloat(b.reduction) - parseFloat(a.reduction))
      .slice(0, 5)
      .forEach((result, index) => {
        console.log(`${index + 1}. ${result.file}: %${result.reduction} küçültüldü`);
      });
    
    console.log('\n✨ Tüm dönüşümler başarıyla tamamlandı!');
    console.log('📝 NOT: Orijinal PNG dosyaları korundu. İsterseniz silebilirsiniz.');
    
  } catch (error) {
    console.error('Hata:', error);
  }
}

// Run the conversion
convertToWebP();