#!/usr/bin/env node
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execPromise = util.promisify(exec);

const sourceDir = path.join(__dirname, '../client/public/güncellenecekler');
const targetDir = path.join(__dirname, '../client/public');

// Files to update (source -> target mapping)
const imageFiles = [
  { source: 'kırmızı takım yeni.png', target: 'kırmızı takım.webp' },
  { source: 'mavi takım yeni.png', target: 'mavi takım.webp' }
];

const videoFiles = [
  { source: 'kahin bilgilendirme kırmızı yeni.mp4', target: 'kahin bilgilendirme kırmızı.webm' },
  { source: 'kahin bilgilendirme mavi yeni.mp4', target: 'kahin bilgilendirme mavi.webm' },
  { source: 'kırmızı takım normal kazanma yeni.mp4', target: 'kırmızı takım normal kazanma.webm' },
  { source: 'kırmızı takım video tur yeni.mp4', target: 'kırmızı takım video tur.webm' },
  { source: 'mavi takım normal kazanma yeni.mp4', target: 'mavi takım normal kazanma.webm' },
  { source: 'mavi takım video tur yeni.mp4', target: 'mavi takım video tur.webm' }
];

// Convert images to WebP
async function convertImages() {
  console.log('🖼️ Converting images to WebP...\n');
  
  for (const file of imageFiles) {
    const sourcePath = path.join(sourceDir, file.source);
    const targetPath = path.join(targetDir, file.target);
    
    try {
      console.log(`Converting: ${file.source} → ${file.target}`);
      
      await sharp(sourcePath)
        .webp({ 
          quality: 90, 
          effort: 6,
          lossless: false,
          nearLossless: false,
          smartSubsample: true,
          reductionEffort: 6
        })
        .toFile(targetPath);
      
      const sourceSize = fs.statSync(sourcePath).size;
      const targetSize = fs.statSync(targetPath).size;
      const reduction = ((sourceSize - targetSize) / sourceSize * 100).toFixed(1);
      
      console.log(`✅ Converted ${file.target}`);
      console.log(`   Size: ${(sourceSize / 1024 / 1024).toFixed(2)} MB → ${(targetSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Reduction: ${reduction}%\n`);
      
    } catch (error) {
      console.error(`❌ Error converting ${file.source}:`, error.message);
    }
  }
}

// Convert videos to WebM
async function convertVideos() {
  console.log('🎬 Converting videos to WebM...\n');
  
  for (const file of videoFiles) {
    const sourcePath = path.join(sourceDir, file.source);
    const targetPath = path.join(targetDir, file.target);
    
    try {
      console.log(`Converting: ${file.source} → ${file.target}`);
      
      // FFmpeg command for WebM conversion with VP9 codec
      const command = `ffmpeg -i "${sourcePath}" -c:v libvpx-vp9 -crf 30 -b:v 0 -b:a 128k -c:a libopus -f webm -y "${targetPath}"`;
      
      const { stdout, stderr } = await execPromise(command);
      
      const sourceSize = fs.statSync(sourcePath).size;
      const targetSize = fs.statSync(targetPath).size;
      const reduction = ((sourceSize - targetSize) / sourceSize * 100).toFixed(1);
      
      console.log(`✅ Converted ${file.target}`);
      console.log(`   Size: ${(sourceSize / 1024 / 1024).toFixed(2)} MB → ${(targetSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Reduction: ${reduction}%\n`);
      
    } catch (error) {
      console.error(`❌ Error converting ${file.source}:`, error.message);
    }
  }
}

// Main function
async function main() {
  console.log('🚀 Starting asset update process...\n');
  console.log('Source directory:', sourceDir);
  console.log('Target directory:', targetDir);
  console.log('─'.repeat(60) + '\n');
  
  // Check if source directory exists
  if (!fs.existsSync(sourceDir)) {
    console.error('❌ Source directory not found:', sourceDir);
    process.exit(1);
  }
  
  // Convert images
  await convertImages();
  
  console.log('─'.repeat(60) + '\n');
  
  // Convert videos
  await convertVideos();
  
  console.log('─'.repeat(60));
  console.log('\n✨ Asset update complete!\n');
  
  // Show summary
  console.log('📊 Summary:');
  console.log(`   - Images converted: ${imageFiles.length}`);
  console.log(`   - Videos converted: ${videoFiles.length}`);
  console.log('\nThe old files have been replaced with optimized WebP/WebM versions.');
  console.log('The original new files remain in:', sourceDir);
}

// Run the script
main().catch(console.error);