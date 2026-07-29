/**
 * Route Discoverability Audit
 * ----------------------------------------------------------------------------
 * Guards against issue #2767: "Some pages and learning modules are not
 * discoverable through the main navigation."
 *
 * Every public page (visualizer, tool, editor, learning module, etc.) is
 * expected to be reachable from at least one other place in the codebase —
 * a navbar link, a hub-page registry entry (visualizers.js, tools.js,
 * editors.js, learning-topics.js, languages.js, ai-tools.js, interview.js),
 * or a direct link from another page.
 *
 * This test scans every text-based source file for a literal reference to
 * each public page's path. A page with zero references is "orphaned" —
 * it exists and works, but a user can never click their way to it.
 *
 * Known, reviewed exceptions live in ALLOWLIST below. Anything added there
 * should have a one-line reason — this file is meant to shrink over time,
 * not grow.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

/** Directories to skip when walking the repo for candidate PAGES. */
const SKIP_DIRS = new Set(['node_modules', '.git', 'backend', 'templates', 'partials', 'tests']);

/**
 * Directories to skip when scanning for LINK SOURCES (i.e. the text corpus
 * searched for inbound references). This must be narrower than SKIP_DIRS:
 * partials/ (navbar.html, footer.html, etc.) are excluded from the page
 * list because they're fragments, not routes — but they still contain real
 * links to other pages and must stay in the source corpus, or anything
 * linked only from the navbar/footer would incorrectly show up as orphaned.
 */
const SKIP_SOURCE_DIRS = new Set(['node_modules', '.git', 'backend', 'templates', 'tests']);

/** Specific files that are never counted as "pages needing a nav link". */
const SKIP_FILES = new Set(['404.html', 'offline.html', 'test-storage.html']);

/**
 * Pages that are intentionally excluded from the discoverability check.
 * Each entry must have a reason so future readers know why it's here.
 */
const ALLOWLIST = new Map([
  [
    'loading-animation/playground.html',
    'Internal dev playground for tuning the splash/loading animation — not a user-facing route.',
  ],
  [
    'markdown-demo.html',
    'Internal developer demo of the markdown parser module — not a user-facing route.',
  ],
  [
    'pages/escape-room/room.html',
    'Reached via a client-side `window.location.href` redirect built at runtime from ' +
      'pages/escape-room/index.html, so no static link exists — this is expected.',
  ],
  [
    'pages/community/support/index.html',
    'FOLLOW-UP NEEDED: appears to duplicate support-page/index.html (which is the one linked ' +
      'from the navbar). Needs a maintainer decision on which is canonical before removing/redirecting.',
  ],
  [
    'beginner-roadmap.html',
    'Legacy URL kept as a client-side redirect stub to /pages/roadmaps/roadmaps.html?tab=beginner ' +
      'for old bookmarks/indexed links — intentionally has no inbound nav link of its own.',
  ],
  [
    'advanced-roadmap.html',
    'Legacy URL kept as a client-side redirect stub to /pages/roadmaps/roadmaps.html?tab=advanced ' +
      'for old bookmarks/indexed links — intentionally has no inbound nav link of its own.',
  ],
]);

function walk(dir, exts, out, skipDirs) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) continue;
      walk(full, exts, out, skipDirs);
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      out.push(full);
    }
  }
}

function collectPages() {
  const files = [];
  walk(ROOT, ['.html'], files, SKIP_DIRS);
  return files
    .map((f) => path.relative(ROOT, f).replace(/\\/g, '/'))
    .filter((rel) => !SKIP_FILES.has(path.basename(rel)));
}

function loadAllSourceText() {
  const files = [];
  walk(ROOT, ['.html', '.js', '.json', '.jsx'], files, SKIP_SOURCE_DIRS);
  const contents = new Map();
  for (const f of files) {
    const rel = path.relative(ROOT, f).replace(/\\/g, '/');
    try {
      contents.set(rel, fs.readFileSync(f, 'utf8'));
    } catch {
      // unreadable file (binary, permissions, etc.) — skip
    }
  }
  return contents;
}

function findOrphans() {
  const pages = collectPages();
  const sources = loadAllSourceText();
  const orphans = [];

  for (const page of pages) {
    if (ALLOWLIST.has(page)) continue;

    let referenced = false;
    for (const [srcPath, content] of sources) {
      if (srcPath === page) continue;
      if (content.includes(page) || content.includes(`/${page}`)) {
        referenced = true;
        break;
      }
    }
    if (!referenced) orphans.push(page);
  }
  return orphans;
}

describe('Route discoverability (issue #2767)', () => {
  test('every public page has at least one inbound reference', () => {
    const orphans = findOrphans();
    if (orphans.length > 0) {
      const details = orphans.map((o) => `  - ${o}`).join('\n');
      throw new Error(
        `Found ${orphans.length} page(s) with no inbound link anywhere in the codebase:\n${details}\n\n` +
          `Add a link/registry entry pointing to each page, or if it's intentionally ` +
          `internal-only, add it to ALLOWLIST in tests/routeDiscoverability.test.js with a reason.`
      );
    }
    expect(orphans).toEqual([]);
  });

  test('ALLOWLIST entries are still valid (fail loudly if a page is deleted or fixed)', () => {
    for (const page of ALLOWLIST.keys()) {
      const full = path.join(ROOT, page);
      expect(fs.existsSync(full)).toBe(true);
    }
  });
});