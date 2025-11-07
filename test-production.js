#!/usr/bin/env node

// Production build'i test etmek için basit server
const express = require('express');
const path = require('path');
const fs = require('fs');

// dist klasörünün varlığını kontrol et
if (!fs.existsSync('./dist')) {
  console.error('❌ dist klasörü bulunamadı! Önce build yapın:');
  console.error('   ./build-with-obfuscation.sh');
  process.exit(1);
}

const app = express();
const PORT = 5001;

// Static dosyaları sun
app.use(express.static(path.join(__dirname, 'dist/public')));

// API istekleri için backend'e yönlendir
app.all('/api/*', (req, res) => {
  res.status(503).json({ 
    error: 'API backend bu test sunucusunda aktif değil. Sadece obfuscation testi için kullanın.' 
  });
});

// SPA için tüm route'ları index.html'e yönlendir
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/public/index.html'));
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║     🔐 OBFUSCATED PRODUCTION TEST SERVER 🔐       ║
╠════════════════════════════════════════════════════╣
║                                                    ║
║  Sunucu başlatıldı: http://localhost:${PORT}         ║
║                                                    ║
║  Bu sunucu obfuscate edilmiş production build'i   ║
║  test etmek içindir.                              ║
║                                                    ║
║  ✅ Tarayıcıda DevTools açın (F12)                ║
║  ✅ Sources sekmesine gidin                       ║
║  ✅ index-*.js dosyasını inceleyin                ║
║  ✅ GameTimer.tsx artık görünmez!                 ║
║  ✅ Kod tamamen şifrelenmiş!                      ║
║                                                    ║
║  Durdurmak için: Ctrl+C                           ║
╚════════════════════════════════════════════════════╝
  `);
});