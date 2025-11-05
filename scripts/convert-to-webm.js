import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Video files to convert
const videoFiles = [
  'mavi takım video tur.mp4',
  'kırmızı takım video tur.mp4',
  'siyah kelime seçme yeni.mp4',
  'mavi takım normal kazanma.mp4',
  'kırmızı takım normal kazanma.mp4'
];

async function convertToWebM() {
  console.log('🎬 MP4 videoları WebM formatına dönüştürülüyor...\n');
  
  let totalOriginalSize = 0;
  let totalWebMSize = 0;
  
  for (const videoFile of videoFiles) {
    const inputPath = path.join('client', 'public', videoFile);
    const outputPath = path.join('client', 'public', videoFile.replace('.mp4', '.webm'));
    
    // Check if input file exists
    if (!fs.existsSync(inputPath)) {
      console.log(`❌ Dosya bulunamadı: ${inputPath}`);
      continue;
    }
    
    // Get original file size
    const originalStats = fs.statSync(inputPath);
    const originalSizeMB = originalStats.size / (1024 * 1024);
    totalOriginalSize += originalStats.size;
    
    console.log(`📹 Dönüştürülüyor: ${videoFile}`);
    console.log(`   Original boyut: ${originalSizeMB.toFixed(2)} MB`);
    
    // FFmpeg command for WebM conversion with VP9 codec
    // -c:v libvpx-vp9: Use VP9 video codec
    // -crf 30: Constant Rate Factor (lower = better quality, 30 is good for web)
    // -b:v 0: Let CRF control the bitrate
    // -c:a libopus: Use Opus audio codec (WebM standard)
    // -b:a 128k: Audio bitrate
    // -cpu-used 8: Faster encoding (0-8, higher = faster but lower quality)
    // -deadline good: Balance between speed and quality
    // -row-mt 1: Enable row-based multithreading
    const ffmpegCommand = `ffmpeg -i "${inputPath}" -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus -b:a 128k -cpu-used 4 -deadline good -row-mt 1 -y "${outputPath}"`;
    
    try {
      // Execute conversion
      await execAsync(ffmpegCommand);
      
      // Get WebM file size
      const webmStats = fs.statSync(outputPath);
      const webmSizeMB = webmStats.size / (1024 * 1024);
      totalWebMSize += webmStats.size;
      
      // Calculate reduction
      const reduction = ((1 - webmStats.size / originalStats.size) * 100).toFixed(1);
      
      console.log(`   ✅ WebM boyut: ${webmSizeMB.toFixed(2)} MB`);
      console.log(`   📉 Boyut azalması: %${reduction}\n`);
      
    } catch (error) {
      console.error(`   ❌ Dönüştürme hatası: ${error.message}\n`);
    }
  }
  
  // Print summary
  console.log('━'.repeat(50));
  console.log('📊 ÖZET:');
  console.log(`Toplam MP4 boyutu: ${(totalOriginalSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Toplam WebM boyutu: ${(totalWebMSize / (1024 * 1024)).toFixed(2)} MB`);
  
  if (totalOriginalSize > 0) {
    const totalReduction = ((1 - totalWebMSize / totalOriginalSize) * 100).toFixed(1);
    console.log(`Toplam boyut azalması: %${totalReduction} 🎉`);
  }
}

// Run conversion
convertToWebM().catch(console.error);