import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// 1. Build ES module bundle
await esbuild.build({
  entryPoints: [path.join(root, 'scripts/entry-legacy.mjs')],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2020'],
  external: ['firebase/*', 'acorn'],
  outfile: path.join(root, 'dist/legacy-bundle.mjs'),
  allowOverwrite: true,
  logLevel: 'warning',
});

// Read the bundled output to check it
const bundlePath = path.join(root, 'dist/legacy-bundle.mjs');
const bundleContent = fs.readFileSync(bundlePath, 'utf8');
const lines = bundleContent.split('\n').length;
const size = (Buffer.byteLength(bundleContent, 'utf8') / 1024).toFixed(1);

console.log(`✓ dist/legacy-bundle.mjs built: ${lines} lines, ${size}KB`);
