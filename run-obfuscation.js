#!/usr/bin/env node

// Simple obfuscation runner for manual use
console.log('\n🔐 KATMANNAMES KOD KORUMA SİSTEMİ\n');
console.log('Bu script build sonrası JavaScript dosyalarını obfuscate eder.');
console.log('Kullanım: npm run build && node run-obfuscation.js\n');

import('./obfuscate-build.js').catch(err => {
  console.error('❌ Obfuscation başlatılamadı:', err.message);
  process.exit(1);
});