import fs from 'fs/promises';
import path from 'path';

const ROOT = process.argv[2]
  ? path.resolve(process.argv[2])
  : process.cwd();

const EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.ts']);

const patterns = [
  /\brg\b/i,
  /ripgrep/i,
  /ripgrep\.exe/i,
  /spawn\([^\)]*\brg\b/i,
  /spawnSync\([^\)]*\brg\b/i,
  /execa\([^\)]*\brg\b/i,
  /child_process\.exec\([^\)]*\brg\b/i,
  /\brg\s+-/i,
  /command.*\brg\b/i,
];

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function lineContainsAnyPattern(line) {
  return patterns.some((re) => re.test(line));
}

async function* walkFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip common heavy dirs
      if (
        entry.name === 'node_modules' ||
        entry.name === '.git' ||
        entry.name === 'dist' ||
        entry.name === 'build' ||
        entry.name === '.next'
      ) {
        continue;
      }
      yield* walkFiles(fullPath);
      continue;
    }

    if (!entry.isFile()) continue;

    const ext = path.extname(entry.name).toLowerCase();
    if (!EXTENSIONS.has(ext)) continue;

    yield fullPath;
  }
}

async function main() {
  const results = [];

  for await (const filePath of walkFiles(ROOT)) {
    let content;
    try {
      content = await fs.readFile(filePath, 'utf8');
    } catch {
      continue;
    }

    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      if (lineContainsAnyPattern(line)) {
        // Store a small snippet for context
        results.push({
          file: path.relative(ROOT, filePath),
          line: i + 1,
          text: line.trim().slice(0, 400),
        });
      }
    }
  }

  results.sort((a, b) => {
    if (a.file === b.file) return a.line - b.line;
    return a.file.localeCompare(b.file);
  });

  if (results.length === 0) {
    console.log('No ripgrep (rg) / ripgrep usages found in JS/TS source files.');
    process.exit(0);
  }

  console.log(`Found ${results.length} potential ripgrep usages:`);
  for (const r of results) {
    console.log(`- ${r.file}:${r.line}: ${r.text}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Scan failed:', err);
  process.exit(1);
});

