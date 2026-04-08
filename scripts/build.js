#!/usr/bin/env node
'use strict';

/**
 * Build script for oathix.
 * Generates CJS and ESM output in dist/ from src/.
 * Zero external dependencies — uses only Node built-ins.
 */

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const DIST = path.join(__dirname, '..', 'dist');

// Clean dist/
if (fs.existsSync(DIST)) {
  fs.rmSync(DIST, { recursive: true });
}

/**
 * Recursively copies all files from src to dist,
 * creating CJS (.cjs.js) and ESM (.esm.js) versions of .js files,
 * and copying .d.ts files as-is.
 */
function buildDir(srcDir, distDir) {
  fs.mkdirSync(distDir, { recursive: true });

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const distPath = path.join(distDir, entry.name);

    if (entry.isDirectory()) {
      buildDir(srcPath, distPath);
      continue;
    }

    // Copy type definitions as-is
    if (entry.name.endsWith('.d.ts')) {
      fs.copyFileSync(srcPath, distPath);
      continue;
    }

    // Skip non-JS files
    if (!entry.name.endsWith('.js')) continue;

    const code = fs.readFileSync(srcPath, 'utf8');
    const baseName = entry.name.replace('.js', '');

    // --- CJS version ---
    // The source is already CommonJS, just copy with .cjs.js extension
    const cjsPath = path.join(distDir, `${baseName}.cjs.js`);
    // Fix require paths to use .cjs.js
    const cjsCode = fixRequirePaths(code);
    fs.writeFileSync(cjsPath, cjsCode);

    // --- ESM version ---
    const esmPath = path.join(distDir, `${baseName}.esm.js`);
    const esmCode = convertToESM(code);
    fs.writeFileSync(esmPath, esmCode);
  }
}

/**
 * Fixes require() paths to point to .cjs.js files.
 */
function fixRequirePaths(code) {
  return code.replace(
    /require\(['"](\.[^'"]+)['"]\)/g,
    (match, reqPath) => {
      // If it already has an extension, replace .js with .cjs.js
      if (reqPath.endsWith('.js')) {
        return `require('${reqPath.replace('.js', '.cjs.js')}')`;
      }
      // If no extension, append .cjs.js
      return `require('${reqPath}.cjs.js')`;
    }
  );
}

/**
 * Converts CommonJS code to ESM.
 * Handles require() → import and module.exports → export.
 */
function convertToESM(code) {
  let esm = code;

  // Remove 'use strict' (ESM is strict by default)
  esm = esm.replace(/^'use strict';\s*\n?/m, '');

  // Convert: const { x, y } = require('./path')
  esm = esm.replace(
    /const\s+\{([^}]+)\}\s*=\s*require\(['"]([^'"]+)['"]\);?/g,
    (match, imports, reqPath) => {
      const cleanPath = reqPath.endsWith('.js') ? reqPath.replace('.js', '.esm.js') : `${reqPath}.esm.js`;
      return `import {${imports}} from '${cleanPath}';`;
    }
  );

  // Convert: const x = require('./path')
  esm = esm.replace(
    /const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\);?/g,
    (match, name, reqPath) => {
      const cleanPath = reqPath.endsWith('.js') ? reqPath.replace('.js', '.esm.js') : `${reqPath}.esm.js`;
      return `import ${name} from '${cleanPath}';`;
    }
  );

  // Convert: module.exports = { x, y }
  esm = esm.replace(
    /module\.exports\s*=\s*\{([^}]+)\};?/g,
    (match, exports) => {
      const names = exports.split(',').map(n => n.trim()).filter(Boolean);
      return `export { ${names.join(', ')} };`;
    }
  );

  // Convert: if (typeof module !== 'undefined' && module.exports) { module.exports = { x } }
  esm = esm.replace(
    /\/\/.*Support both.*\n?if\s*\(typeof module.*\n?\s*module\.exports\s*=\s*\{([^}]+)\};?\s*\n?\}/g,
    (match, exports) => {
      const names = exports.split(',').map(n => n.trim()).filter(Boolean);
      return `export { ${names.join(', ')} };`;
    }
  );

  return esm;
}

// --- Run build ---
console.log('Building oathix...');
buildDir(SRC, DIST);

// Copy main types.d.ts as index.d.ts in dist root
const mainTypes = path.join(DIST, 'types.d.ts');
const indexTypes = path.join(DIST, 'index.d.ts');
if (fs.existsSync(mainTypes)) {
  fs.copyFileSync(mainTypes, indexTypes);
}

// Count output files
let fileCount = 0;
function countFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) countFiles(path.join(dir, entry.name));
    else fileCount++;
  }
}
countFiles(DIST);

console.log(`Done! ${fileCount} files written to dist/`);
