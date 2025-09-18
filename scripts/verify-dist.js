#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

console.log('🔍 Verifying dist build output...');

// Check if dist/index.html exists
const indexPath = './dist/index.html';
try {
  const indexContent = readFileSync(indexPath, 'utf8');
  console.log('✅ dist/index.html exists');
  
  // Print first ~20 lines
  const lines = indexContent.split('\n');
  console.log('\n📄 First 20 lines of dist/index.html:');
  console.log('─'.repeat(50));
  lines.slice(0, 20).forEach((line, i) => {
    console.log(`${String(i + 1).padStart(2)}|${line}`);
  });
  console.log('─'.repeat(50));
  
} catch (error) {
  console.error('❌ dist/index.html not found');
  process.exit(1);
}

// Check if dist/assets directory exists and has JS files
const assetsPath = './dist/assets';
try {
  const assetsFiles = readdirSync(assetsPath);
  const jsFiles = assetsFiles.filter(file => file.endsWith('.js'));
  
  if (jsFiles.length === 0) {
    console.error('❌ No JS files found in dist/assets/');
    process.exit(1);
  }
  
  console.log(`✅ Found ${jsFiles.length} JS file(s) in dist/assets/:`);
  jsFiles.forEach(file => console.log(`   - ${file}`));
  
} catch (error) {
  console.error('❌ dist/assets/ directory not found');
  process.exit(1);
}

// Check if index.html references /assets/ JS files
try {
  const indexContent = readFileSync('./dist/index.html', 'utf8');
  const hasAssetsRef = indexContent.includes('/assets/') && indexContent.includes('type="module"');
  
  if (!hasAssetsRef) {
    console.error('❌ dist/index.html does not reference /assets/ JS files with type="module"');
    process.exit(1);
  }
  
  console.log('✅ dist/index.html references /assets/ JS files');
  
} catch (error) {
  console.error('❌ Could not verify assets references in index.html');
  process.exit(1);
}

console.log('\n🎉 All dist verification checks passed!');
