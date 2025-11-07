// Obfuscation configuration for production builds
// This file configures JavaScript obfuscation to protect source code

export const obfuscationConfig = {
  // Basic obfuscation settings
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  debugProtection: true,
  debugProtectionInterval: true,
  disableConsoleOutput: true,
  
  // String encoding
  rotateStringArray: true,
  selfDefending: true,
  stringArray: true,
  stringArrayEncoding: ['base64', 'rc4'],
  stringArrayThreshold: 0.75,
  
  // Variable renaming
  renameGlobals: false, // Keep false to avoid breaking imports
  identifierNamesGenerator: 'hexadecimal',
  
  // Domain locking
  domainLock: [
    '.replit.app',
    '.repl.co',
    'localhost'
  ],
  
  // Reserved names (don't obfuscate these)
  reservedNames: [
    'React',
    'ReactDOM',
    'useState',
    'useEffect',
    'useContext'
  ]
};

// Usage note: This configuration should be used with a build tool like
// webpack-obfuscator or javascript-obfuscator during production builds