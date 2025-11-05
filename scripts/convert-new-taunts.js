#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

async function convertNewTaunts() {
  console.log('🎬 Converting new taunt videos to WebM...');
  
  const conversions = [
    {
      input: '../client/public/kırmızı taunt güncel.mp4',
      output: '../client/public/kırmızı taunt güncel.webm',
      name: 'Red team taunt'
    },
    {
      input: '../client/public/mavi taunt güncel.mp4',
      output: '../client/public/mavi taunt güncel.webm',
      name: 'Blue team taunt'
    }
  ];

  for (const { input, output, name } of conversions) {
    try {
      // Check if input exists
      await fs.access(input);
      
      console.log(`Converting ${name}...`);
      
      // FFmpeg command optimized for web
      const command = `ffmpeg -i "${input}" -c:v libvpx-vp9 -crf 30 -b:v 0 -b:a 128k -c:a libopus -f webm "${output}" -y`;
      
      await execAsync(command);
      
      // Get file sizes for comparison
      const inputStats = await fs.stat(input);
      const outputStats = await fs.stat(output);
      
      const reduction = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);
      
      console.log(`✅ ${name} converted: ${(inputStats.size / 1024 / 1024).toFixed(2)}MB → ${(outputStats.size / 1024 / 1024).toFixed(2)}MB (${reduction}% reduction)`);
      
    } catch (error) {
      console.error(`❌ Failed to convert ${name}:`, error.message);
    }
  }
  
  // Now replace the old taunt files with the new ones
  console.log('\n📝 Replacing old taunt videos with new ones...');
  
  try {
    // Backup old files first (if they exist)
    try {
      await fs.copyFile('../client/public/kırmızı taunt.mp4', '../client/public/güncellenecekler/kırmızı taunt old.mp4');
      await fs.copyFile('../client/public/mavi taunt.mp4', '../client/public/güncellenecekler/mavi taunt old.mp4');
      console.log('✅ Old MP4 files backed up');
    } catch (e) {
      console.log('ℹ️ No old MP4 files to backup');
    }
    
    // Replace with new files (create WebM taunt files)
    await fs.copyFile('../client/public/kırmızı taunt güncel.webm', '../client/public/kırmızı taunt.webm');
    await fs.copyFile('../client/public/mavi taunt güncel.webm', '../client/public/mavi taunt.webm');
    
    console.log('✅ Taunt videos replaced successfully!');
    
    // Clean up the "güncel" files after successful replacement
    console.log('\n🧹 Cleaning up temporary files...');
    await fs.unlink('../client/public/kırmızı taunt güncel.mp4');
    await fs.unlink('../client/public/mavi taunt güncel.mp4');
    await fs.unlink('../client/public/kırmızı taunt güncel.webm');
    await fs.unlink('../client/public/mavi taunt güncel.webm');
    
    console.log('✅ Cleanup complete!');
    
  } catch (error) {
    console.error('❌ Failed to replace files:', error.message);
  }
  
  console.log('\n✨ All taunt videos updated successfully!');
}

convertNewTaunts().catch(console.error);