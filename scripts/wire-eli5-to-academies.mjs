/**
 * Wire ELI5 toggle into all remaining academy JS files.
 * Handles 4 different lesson rendering patterns.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// ─── ACADEMY CONFIG ─────────────────────────────────────────────────
// Each entry: { file, academyId, pattern, contentVar, containerExpr }

const academies = [
  // Pattern A: renderLesson(lesson) with DOM.tabLesson.innerHTML = `... ${lesson.content} ...`
  { file: 'pages/angular-academy/angular-academy.js',       id: 'angular',   academyVar: 'angular',      dataVar: '' },
  { file: 'pages/typescript-academy/typescript-academy.js', id: 'typescript', academyVar: 'typescript',    dataVar: '' },
  { file: 'pages/nestjs-academy/nestjs-academy.js',         id: 'nestjs',     academyVar: 'nestjs',        dataVar: '' },
  { file: 'pages/tailwind-academy/tailwind-academy.js',     id: 'tailwind',   academyVar: 'tailwind',      dataVar: '' },
  { file: 'pages/express-academy/express-academy.js',       id: 'express',    academyVar: 'express',       dataVar: '' },
  { file: 'pages/react-mastery/react-mastery.js',           id: 'react',      academyVar: 'react',         dataVar: '' },
  { file: 'pages/fastapi-learning/fastapi-learning.js',     id: 'fastapi',    academyVar: 'fastapi',       dataVar: '' },
  { file: 'pages/nodejs-learning/nodejs-learning.js',       id: 'nodejs',     academyVar: 'nodejs',        dataVar: '' },
  { file: 'pages/svelte-learning/svelte-learning.js',       id: 'svelte',     academyVar: 'svelte',        dataVar: '' },
  { file: 'pages/vue-learning/vue-learning.js',             id: 'vue',        academyVar: 'vue',           dataVar: '' },
  { file: 'pages/bootstrap-learning/bootstrap-learning.js', id: 'bootstrap',  academyVar: 'bootstrap',     dataVar: '' },
  { file: 'pages/mui-learning/mui-learning.js',             id: 'mui',        academyVar: 'mui',           dataVar: '' },

  // Pattern B: loadLesson(mIndex, lIndex) with elements.lessonContent.innerHTML = lesson.content
  { file: 'pages/firebase-academy/firebase-academy.js',         id: 'firebase',         academyVar: 'firebase',         dataVar: '' },
  { file: 'pages/supabase-academy/supabase-academy.js',         id: 'supabase',         academyVar: 'supabase',         dataVar: '' },
  { file: 'pages/elasticsearch-academy/elasticsearch-academy.js', id: 'elasticsearch',  academyVar: 'elasticsearch',    dataVar: '' },
  { file: 'pages/neo4j-academy/neo4j-academy.js',               id: 'neo4j',            academyVar: 'neo4j',            dataVar: '' },
  { file: 'pages/sqlite-academy/sqlite-academy.js',             id: 'sqlite',           academyVar: 'sqlite',           dataVar: '' },
  { file: 'pages/mongodb-academy/script.js',                     id: 'mongodb',          academyVar: 'mongodb',          dataVar: '' },
  { file: 'pages/postgresql-learning/postgresql-learning.js',   id: 'postgresql',       academyVar: 'postgresql',       dataVar: '' },

  // Pattern C: renderLesson() with DOM.lessonContent.innerHTML = lesson.content
  { file: 'pages/go-academy/go-academy.js',     id: 'go',   academyVar: 'go',   dataVar: '' },
  { file: 'pages/rust-academy/rust-academy.js', id: 'rust', academyVar: 'rust', dataVar: '' },

  // Pattern D: loadLesson(index) with lessonBody.innerHTML = lesson.content
  { file: 'pages/kafka-academy/kafka-academy.js',               id: 'kafka',  academyVar: 'kafka',  dataVar: '' },
  { file: 'pages/docker-kubernetes-academy/docker-kubernetes-academy.js', id: 'docker-k8s', academyVar: 'docker-k8s', dataVar: '' },
];

// Additional academies with different patterns
const extraAcademies = [
  { file: 'pages/learning/threejs-academy/threejs-academy.js', id: 'threejs', academyVar: 'threejs' },
];

const allAcademies = [...academies, ...extraAcademies];

// ─── MODIFICATION LOGIC ─────────────────────────────────────────────

let modified = 0;
let errors = [];

for (const academy of allAcademies) {
  const fullPath = path.join(projectRoot, academy.file);
  try {
    let content = fs.readFileSync(fullPath, 'utf-8');

    // Skip if already wired
    if (content.includes('eli5Toggle.wrapContent')) {
      continue;
    }

    // Step 1: Find the lesson content assignment and wrap it
    // Replace `lesson.content` within innerHTML assignments
    // Pattern: .innerHTML = lesson.content  or  .innerHTML = `...${lesson.content}...`
    
    // Handle both assignment types:
    // Type 1: direct assignment: `elements.lessonContent.innerHTML = lesson.content;`
    // Type 2: template literal: `DOM.tabLesson.innerHTML = \`... ${lesson.content} ...\``

    let modifiedContent = content;

    // Type 1: Direct assignment (Pattern B, C, D)
    // Find: `.innerHTML = lesson.content`
    const directPattern = /(\w+)(\.innerHTML\s*=\s*)lesson\.content/g;
    modifiedContent = modifiedContent.replace(directPattern, (match, container) => {
      return `${container}.innerHTML = (window.eli5Toggle ? window.eli5Toggle.wrapContent(lesson.content, '') : lesson.content)`;
    });

    // Type 2: Template literal with ${lesson.content} or ${lesson.content.trim()}
    // Find: in template literals where lesson.content is interpolated
    const templatePattern = /\$\{lesson\.content(\s*\|\|\s*'')?\}/g;
    if (templatePattern.test(modifiedContent)) {
      templatePattern.lastIndex = 0;
      modifiedContent = modifiedContent.replace(templatePattern, (match) => {
        return `\${(window.eli5Toggle ? window.eli5Toggle.wrapContent(lesson.content, '') : lesson.content)}`;
      });
    }

    // Step 2: Add initToggle call after setting innerHTML
    // Find lines that set innerHTML with lesson content and add initToggle after
    const innerHtmlLines = [];
    const lines = modifiedContent.split('\n');
    const newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      newLines.push(line);
      
      // Check if this line (or next line end) sets innerHTML with lesson.content
      const trimmed = line.trim();
      if (trimmed.includes('.innerHTML') && trimmed.includes('lesson.content')) {
        // Add initToggle in the next lines
        // We need to find the container variable name
        const containerMatch = trimmed.match(/(\w+)\.innerHTML\s*=/);
        if (containerMatch) {
          const containerVar = containerMatch[1];
          // Add initToggle after a semicolon at end of line or on next line
          if (trimmed.endsWith(';') || trimmed.endsWith(');')) {
            newLines.push(`  if (window.eli5Toggle) {`);
            newLines.push(`    window.eli5Toggle.initToggle('${academy.id}', ${containerVar});`);
            newLines.push(`  }`);
          }
        }
      }
    }

    modifiedContent = newLines.join('\n');

    // Step 3: Handle the template literal pattern specifically
    // For Pattern A (renderLesson with template), the container is DOM.tabLesson
    // and innerHTML is set inside a template literal
    if (modifiedContent.includes('DOM.tabLesson.innerHTML') && 
        modifiedContent.includes('lesson.content') &&
        !modifiedContent.includes(`initToggle('${academy.id}'`)) {
      
      // Check if already has initToggle from step 2
      if (!modifiedContent.includes(`initToggle('${academy.id}'`)) {
        // Add after the template literal closing + semicolon
        modifiedContent = modifiedContent.replace(
          /(DOM\.tabLesson\.innerHTML\s*=\s*`[\s\S]*?`\s*;)\s*\n/,
          (match, assignment) => {
            return assignment + '\n\n  /* ELI5 toggle */\n  if (window.eli5Toggle) {\n    window.eli5Toggle.initToggle(\'' + academy.id + '\', DOM.tabLesson);\n  }\n';
          }
        );
      }
    }

    // Final check: skip if no changes were made
    if (modifiedContent === content) {
      errors.push(`${academy.file}: no changes applied`);
      continue;
    }

    fs.writeFileSync(fullPath, modifiedContent, 'utf-8');
    modified++;
  } catch (e) {
    errors.push(`${academy.file}: ${e.message}`);
  }
}

console.log(`Done: ${modified} modified, ${errors.length} errors.`);
if (errors.length > 0) {
  console.log('Errors:');
  errors.forEach(e => console.log('  - ' + e));
}
