const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');
const crypto = require('crypto');

// Build hash'i oluştur
const buildHash = crypto.randomBytes(16).toString('hex');
const buildTime = new Date().toISOString();

// Güvenlik damgası ekle
const securityStamp = {
  buildHash,
  buildTime,
  version: '1.0.0',
  copyright: '© 2025 Katmannames. All rights reserved.',
  warning: 'Bu yazılımın izinsiz kopyalanması yasaktır.'
};

// Build metadata dosyası oluştur
fs.writeFileSync('build-metadata.json', JSON.stringify(securityStamp, null, 2));

// Frontend dosyalarını obfuscate et
function obfuscateJSFiles(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      obfuscateJSFiles(filePath);
    } else if (file.endsWith('.js') && !file.includes('.min.')) {
      console.log(`Obfuscating: ${filePath}`);
      
      const code = fs.readFileSync(filePath, 'utf8');
      const obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
        compact: true,
        controlFlowFlattening: true,
        deadCodeInjection: true,
        debugProtection: true,
        disableConsoleOutput: true,
        identifierNamesGenerator: 'hexadecimal',
        selfDefending: true,
        stringArray: true,
        stringArrayEncoding: ['base64'],
        transformObjectKeys: true
      });
      
      fs.writeFileSync(filePath, obfuscationResult.getObfuscatedCode());
    }
  });
}

// Anti-tamper kodu ekle
const antiTamperCode = `
(function() {
  const _0x1a2b = '${buildHash}';
  const checkIntegrity = () => {
    if (window.KATMANNAMES_BUILD !== _0x1a2b) {
      document.body.innerHTML = 'Güvenlik ihlali tespit edildi';
      throw new Error('Security violation');
    }
  };
  setInterval(checkIntegrity, 5000);
  window.KATMANNAMES_BUILD = _0x1a2b;
})();
`;

console.log('Secure build started...');
console.log('Build Hash:', buildHash);

// Build tamamlandıktan sonra obfuscation uygula
if (fs.existsSync('client/dist')) {
  // Anti-tamper kodu ekle
  const indexPath = 'client/dist/index.html';
  if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf8');
    html = html.replace('</head>', `<script>${antiTamperCode}</script></head>`);
    fs.writeFileSync(indexPath, html);
  }
  
  // JS dosyalarını obfuscate et
  obfuscateJSFiles('client/dist');
  
  console.log('✅ Secure build completed!');
} else {
  console.log('❌ Build directory not found. Run npm run build first.');
}