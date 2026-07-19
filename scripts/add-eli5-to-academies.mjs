/**
 * Add ELI5 toggle infrastructure to all academy HTML files.
 * Inserts the shared CSS link and JS script tag into each academy's HTML.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// All academy HTML files (excluding the 3 already wired)
const files = [
  'pages/angular-academy/angular-academy.html',
  'pages/typescript-academy/typescript-academy.html',
  'pages/firebase-academy/firebase-academy.html',
  'pages/nestjs-academy/nestjs-academy.html',
  'pages/tailwind-academy/tailwind-academy.html',
  'pages/sqlite-academy/sqlite-academy.html',
  'pages/go-academy/go-academy.html',
  'pages/express-academy/express-academy.html',
  'pages/supabase-academy/supabase-academy.html',
  'pages/elasticsearch-academy/elasticsearch-academy.html',
  'pages/kafka-academy/kafka-academy.html',
  'pages/docker-kubernetes-academy/docker-kubernetes-academy.html',
  'pages/neo4j-academy/neo4j-academy.html',
  'pages/mongodb-academy/index.html',
  'pages/rust-academy/rust-academy.html',
  'pages/fastapi-learning/fastapi-learning.html',
  'pages/postgresql-learning/postgresql-learning.html',
  'pages/nodejs-learning/nodejs-learning.html',
  'pages/svelte-learning/svelte-learning.html',
  'pages/vue-learning/vue-learning.html',
  'pages/bootstrap-learning/bootstrap-learning.html',
  'pages/mui-learning/mui-learning.html',
  'pages/react-mastery/react-mastery.html',
  'pages/ai-features/fail-academy/fail-academy.html',
  'pages/learning/threejs-academy/threejs-academy.html',
];

const CSS_LINK = '<link rel="stylesheet" href="/styles/eli5-toggle.css">';
const JS_SCRIPT = '  <script src="/modules/eli5-toggle.js"></script>';

let success = 0;
let skipped = 0;
let errors = [];

for (const relPath of files) {
  const fullPath = path.join(projectRoot, relPath);
  try {
    let content = fs.readFileSync(fullPath, 'utf-8');

    // Skip if already has the toggle infrastructure
    if (content.includes('eli5-toggle.css')) {
      skipped++;
      continue;
    }

    // 1. Add CSS link after the last existing .css link
    const cssRegex = /<link[^>]*\.css[^>]*>/gi;
    const cssMatches = [...content.matchAll(cssRegex)];
    if (cssMatches.length === 0) {
      errors.push(`${relPath}: no CSS link found`);
      continue;
    }
    const lastCss = cssMatches[cssMatches.length - 1];
    content = content.replace(lastCss[0], lastCss[0] + '\n  ' + CSS_LINK);

    // 2. Add JS script before the last academy-specific .js script
    const scriptRegex = /<script src="[^"]*\/?([a-zA-Z0-9_.-]+)\.js"><\/script>\n?/gi;
    const allMatches = [...content.matchAll(scriptRegex)];
    
    // Filter to academy-specific scripts (not CDN libraries)
    const academyScripts = allMatches.filter(m => {
      const full = m[0].toLowerCase();
      return !full.includes('tailwind') && 
             !full.includes('font-awesome') && 
             !full.includes('cdn') && 
             !full.includes('cdnjs') && 
             !full.includes('typescript@') &&
             !full.includes('chart.js');
    });

    if (academyScripts.length > 0) {
      const lastScript = academyScripts[academyScripts.length - 1];
      content = content.replace(lastScript[0], JS_SCRIPT + '\n' + lastScript[0]);
    } else {
      // Fallback: insert before </body>
      content = content.replace('</body>', JS_SCRIPT + '\n</body>');
    }

    fs.writeFileSync(fullPath, content, 'utf-8');
    success++;
  } catch (e) {
    errors.push(`${relPath}: ${e.message}`);
  }
}

console.log(`Done: ${success} modified, ${skipped} already had it, ${errors.length} errors.`);
if (errors.length > 0) {
  console.log('Errors:');
  errors.forEach(e => console.log('  - ' + e));
}
