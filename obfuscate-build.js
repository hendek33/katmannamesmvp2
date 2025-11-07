// Obfuscation script for production builds
import JavaScriptObfuscator from 'javascript-obfuscator';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const distDir = path.join(process.cwd(), 'dist/public');

// Obfuscator configuration
const obfuscatorOptions = {
  // Code transformation
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  debugProtection: true,
  debugProtectionInterval: 2000,
  disableConsoleOutput: true,
  
  // String encoding
  rotateStringArray: true,
  selfDefending: true,
  stringArray: true,
  stringArrayEncoding: ['base64', 'rc4'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 0.75,
  
  // Identifier renaming
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  
  // Domain locking
  domainLock: [
    '.replit.app',
    '.repl.co',
    '.onrender.com',
    'katmannames.onrender.com',
    'localhost'
  ],
  domainLockRedirectUrl: 'about:blank',
  
  // Other options
  seed: Date.now(),
  sourceMapMode: 'off',
  target: 'browser',
  transformObjectKeys: true,
  unicodeEscapeSequence: false
};

async function obfuscateFiles() {
  try {
    console.log('🔐 Starting JavaScript obfuscation...');
    
    // Find all JS files in dist folder
    const jsFiles = await glob(`${distDir}/**/*.js`, {
      ignore: ['**/node_modules/**', '**/*.min.js']
    });
    
    console.log(`📁 Found ${jsFiles.length} JavaScript files to obfuscate`);
    
    for (const filePath of jsFiles) {
      const relativePath = path.relative(distDir, filePath);
      console.log(`  🔒 Obfuscating: ${relativePath}`);
      
      try {
        // Read the original file
        const code = fs.readFileSync(filePath, 'utf8');
        
        // Skip already obfuscated or vendor files
        if (code.includes('/* Obfuscated */') || 
            filePath.includes('vendor') || 
            filePath.includes('chunk')) {
          console.log(`    ⏭️  Skipping (vendor/chunk file)`);
          continue;
        }
        
        // Obfuscate the code
        const obfuscationResult = JavaScriptObfuscator.obfuscate(code, obfuscatorOptions);
        const obfuscatedCode = `/* Obfuscated */\n${obfuscationResult.getObfuscatedCode()}`;
        
        // Write back to the same file
        fs.writeFileSync(filePath, obfuscatedCode);
        
        // Calculate size difference
        const originalSize = Buffer.byteLength(code);
        const obfuscatedSize = Buffer.byteLength(obfuscatedCode);
        const sizeRatio = ((obfuscatedSize / originalSize) * 100).toFixed(1);
        
        console.log(`    ✅ Success (${sizeRatio}% of original size)`);
      } catch (error) {
        console.error(`    ❌ Error obfuscating ${relativePath}:`, error.message);
      }
    }
    
    console.log('\n✨ Obfuscation complete!');
    console.log('🔒 Your code is now protected with:');
    console.log('  - Control flow flattening');
    console.log('  - Dead code injection');
    console.log('  - String encryption');
    console.log('  - Debug protection');
    console.log('  - Domain locking');
    console.log('  - Console output disabled');
    
  } catch (error) {
    console.error('❌ Obfuscation failed:', error);
    process.exit(1);
  }
}

// Run the obfuscation
obfuscateFiles();