#!/usr/bin/env node

import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function convertImage() {
  const inputPath = path.join(__dirname, '../client/public/acilmiskartgorsel/timoçin kırmızı.png');
  const outputPath = path.join(__dirname, '../client/public/acilmiskartgorsel/timoçin kırmızı.webp');
  
  try {
    console.log('🖼️ Converting timoçin kırmızı.png to WebP...');
    
    await sharp(inputPath)
      .webp({ quality: 80 })
      .toFile(outputPath);
    
    console.log('✅ Successfully converted to WebP!');
    console.log(`📁 Output: ${outputPath}`);
    
    // Get file sizes for comparison
    const fs = await import('fs/promises');
    const inputStats = await fs.stat(inputPath);
    const outputStats = await fs.stat(outputPath);
    
    const reduction = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);
    console.log(`📊 Size: ${(inputStats.size / 1024).toFixed(1)}KB → ${(outputStats.size / 1024).toFixed(1)}KB (${reduction}% reduction)`);
    
  } catch (error) {
    console.error('❌ Error converting image:', error.message);
    process.exit(1);
  }
}

convertImage();