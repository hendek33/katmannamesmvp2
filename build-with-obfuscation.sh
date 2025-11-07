#!/bin/bash

echo "🔨 Building project..."
npm run build

echo "🔐 Obfuscating JavaScript files..."
node obfuscate-build.js

echo "✅ Build with obfuscation complete!"