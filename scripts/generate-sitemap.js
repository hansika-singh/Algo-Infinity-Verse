/**
 * Sitemap Generator
 *
 * Scans the project directory for public HTML pages and generates
 * a sitemap.xml at the repository root.
 *
 * Usage:  node scripts/generate-sitemap.js
 *         npm run generate-sitemap
 */

import { writeFileSync, globSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Configuration — update these as needed
// ---------------------------------------------------------------------------

const BASE_URL = process.env.SITEMAP_BASE_URL || 'https://algoinfinityverse.com';

/** Glob patterns for pages to INCLUDE */
const INCLUDE_PATTERNS = [
  '*.html',                                // Root-level pages
  'pages/**/*.html',                       // Feature pages
  'contributors/**/*.html',                // Contributor pages
  'support-page/**/*.html',                // Support pages
  'components/**/*.html',                  // Standalone component pages
  'code-visualizer/**/*.html',             // Code visualizers
  'ar-visualizer/**/*.html',               // AR visualizers
  'public/**/*.html',                      // Public static pages
  'Playground/**/*.html',                  // Playgrounds
];

/** Glob patterns for files/directories to EXCLUDE */
const EXCLUDE_PATTERNS = [
  'partials/**/*.html',                    // Dynamically-loaded HTML partials (not standalone)
  'node_modules/**',                       // Dependencies
  'tests/**/*.html',                       // Test pages
  '**/test*.html',                         // Any test-prefixed files (including root)
  '**/*.test.html',                        // Any .test.html files
  'test-storage.html',                     // Test/diagnostic page (explicit exclusion)
  'pages/auth/**',                        // Auth pages (login, signup, 2FA, etc. — not content)
  'pages/admin/**',                       // Admin pages
];

/** Default change frequency for pages */
const DEFAULT_CHANGEFREQ = 'monthly';

/** Default priority for most pages */
const DEFAULT_PRIORITY = '0.8';

/**
 * Priority and frequency overrides for specific page patterns.
 * Higher-priority pages (landing, roadmaps, core tools) get better priority.
 */
const PRIORITY_OVERRIDES = [
  { patterns: ['index.html'],                     priority: '1.0', changefreq: 'weekly' },
  { patterns: ['beginner-roadmap.html', 'advanced-roadmap.html'], priority: '0.9', changefreq: 'weekly' },
  { patterns: ['code-playground.html', 'cp-patterns.html'],     priority: '0.9', changefreq: 'weekly' },
  { patterns: ['execution-history.html'],          priority: '0.7', changefreq: 'monthly' },
  { patterns: ['intent-detector.html'],            priority: '0.6', changefreq: 'monthly' },
  { patterns: ['pages/tools/**'],                  priority: '0.8', changefreq: 'monthly' },
  { patterns: ['pages/learning/**'],               priority: '0.8', changefreq: 'monthly' },
  { patterns: ['pages/visualizers/**'],            priority: '0.8', changefreq: 'monthly' },
  { patterns: ['pages/ai-features/**'],            priority: '0.7', changefreq: 'monthly' },
  { patterns: ['pages/interview/**'],              priority: '0.8', changefreq: 'monthly' },
  { patterns: ['pages/editors/**'],                priority: '0.8', changefreq: 'monthly' },
  { patterns: ['pages/practice/problems.html'],    priority: '0.9', changefreq: 'weekly' },
  { patterns: ['pages/resources/**'],              priority: '0.6', changefreq: 'monthly' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalise a file path into a clean URL path relative to the project root.
 * Strips 'index.html' so the directory itself serves as the URL.
 */
function toUrlPath(filePath) {
  let urlPath = filePath.replace(/\\/g, '/');

  // Strip leading './' if present
  if (urlPath.startsWith('./')) {
    urlPath = urlPath.slice(2);
  }

  // Pretty URLs: /some/dir/index.html -> /some/dir/
  if (urlPath.endsWith('/index.html')) {
    urlPath = urlPath.slice(0, -'index.html'.length);
  }

  return `/${urlPath}`;
}

/**
 * Checks whether a file path matches any of the given minimatch-like patterns.
 * Supports '*' (single-segment) and '**' (multi-segment) wildcards.
 */
function matchesAny(filePath, patterns) {
  const normalized = filePath.replace(/\\/g, '/');
  return patterns.some((pattern) => {
    let re = pattern
      .replace(/\\/g, '/')
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '___DOUBLESTAR___')
      .replace(/\*/g, '[^/]*')
      .replace(/___DOUBLESTAR___/g, '.*');

    // When a pattern starts with **/ (e.g. **/test*.html), make the
    // directory prefix optional so root-level files also match.
    // E.g. **/foo → (?:.*/)?foo
    if (pattern.startsWith('**/')) {
      re = '(?:.*/)?' + re.slice(4);
    }

    return new RegExp(`^${re}$`).test(normalized);
  });
}

/**
 * Given a relative file path, determine its priority and change frequency
 * using the overlay rules above.
 */
function getMetadata(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  for (const override of PRIORITY_OVERRIDES) {
    if (matchesAny(normalized, override.patterns)) {
      return {
        priority: override.priority || DEFAULT_PRIORITY,
        changefreq: override.changefreq || DEFAULT_CHANGEFREQ,
      };
    }
  }
  return { priority: DEFAULT_PRIORITY, changefreq: DEFAULT_CHANGEFREQ };
}

/**
 * Escape special XML characters in a string.
 */
function xmlEscape(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function generateSitemap() {
  const projectRoot = resolve(fileURLToPath(import.meta.url), '..', '..');

  // Collect all matching files
  const allFiles = new Set();
  for (const pattern of INCLUDE_PATTERNS) {
    const matches = globSync(pattern, { cwd: projectRoot, nodir: true });
    for (const f of matches) {
      allFiles.add(f);
    }
  }

  // Filter out excluded files
  const includedFiles = [];
  for (const f of allFiles) {
    if (matchesAny(f, EXCLUDE_PATTERNS)) {
      continue;
    }
    includedFiles.push(f);
  }

  // Sort alphabetically for reproducible output
  includedFiles.sort();

  // Build XML
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const urlsetHeader = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  const urlEntries = includedFiles
    .map((filePath) => {
      const urlPath = toUrlPath(filePath);
      const fullUrl = `${BASE_URL}${urlPath}`;
      const meta = getMetadata(filePath);
      return `  <url>\n` +
        `    <loc>${xmlEscape(fullUrl)}</loc>\n` +
        `    <lastmod>${timestamp}</lastmod>\n` +
        `    <changefreq>${meta.changefreq}</changefreq>\n` +
        `    <priority>${meta.priority}</priority>\n` +
        `  </url>`;
    })
    .join('\n');

  const urlsetFooter = '\n</urlset>\n';

  const sitemapXml = urlsetHeader + urlEntries + urlsetFooter;

  // Write the sitemap to project root
  const sitemapPath = resolve(projectRoot, 'sitemap.xml');
  writeFileSync(sitemapPath, sitemapXml, 'utf-8');

  console.log(`✅ Sitemap generated at ${sitemapPath}`);
  console.log(`   Base URL:    ${BASE_URL}`);
  console.log(`   Total URLs:  ${includedFiles.length}`);
  console.log(`   Lastmod:     ${timestamp}`);
}

generateSitemap();
