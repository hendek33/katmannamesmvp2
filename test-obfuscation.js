// Test file to verify obfuscation
import JavaScriptObfuscator from 'javascript-obfuscator';

const testCode = `
function testFunction() {
  console.log("This is a test");
  const secretKey = "SUPER_SECRET_KEY";
  const apiUrl = "https://api.example.com";
  return secretKey + apiUrl;
}
`;

console.log("🧪 Testing obfuscation...\n");
console.log("Original code:");
console.log(testCode);
console.log("\n" + "=".repeat(50) + "\n");

const obfuscationResult = JavaScriptObfuscator.obfuscate(testCode, {
  compact: true,
  controlFlowFlattening: true,
  deadCodeInjection: true,
  debugProtection: true,
  disableConsoleOutput: true,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75
});

console.log("Obfuscated code:");
console.log(obfuscationResult.getObfuscatedCode());
console.log("\n✅ Obfuscation test successful!");
console.log("📊 Size comparison:");
console.log(`  Original: ${testCode.length} bytes`);
console.log(`  Obfuscated: ${obfuscationResult.getObfuscatedCode().length} bytes`);