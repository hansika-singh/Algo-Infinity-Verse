import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple static file server
const PORT = 3460;
const server = http.createServer((req, res) => {
  // Strip query string
  const urlWithoutQuery = req.url.split('?')[0];

  // Remove leading slash to prevent it from being treated as an absolute path on Windows root
  const requestPath = urlWithoutQuery === '/' ? 'index.html' : urlWithoutQuery.replace(/^\/+/, '');
  let filePath = path.join(__dirname, requestPath);
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code == 'ENOENT') {
        res.writeHead(404);
        res.end('Not Found');
      } else {
        res.writeHead(500);
        res.end('Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

async function runTests() {
  let browser;
  try {
    server.listen(PORT);
    console.log(`Server running on port ${PORT}`);

    browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    // Forward console logs from page
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', (error) => console.error('PAGE ERROR:', error.message));

    // Navigate to the visualizer
    await page.goto(
      `http://localhost:${PORT}/pages/visualizers/memcached-visualizer/memcached-visualizer.html`,
      { waitUntil: 'networkidle0' }
    );

    console.log('Testing Memcached Visualizer...');

    // Test Set operation
    await page.evaluate(() => {
      document.getElementById('input-set-k').value = 'user:1';
      document.getElementById('input-set-v').value = 'John Doe';
      document.getElementById('input-set-ttl').value = '10';
      document.getElementById('btn-set').click();
    });

    // Wait for animation
    await new Promise((r) => setTimeout(r, 2000));

    // Test Get operation (Hit)
    await page.evaluate(() => {
      document.getElementById('input-get-k').value = 'user:1';
      document.getElementById('btn-get').click();
    });

    await new Promise((r) => setTimeout(r, 2000));

    const hits = await page.evaluate(() => document.getElementById('metric-hits').textContent);
    if (hits === '1') console.log('✅ Cache Hit Test Passed');
    else console.error('❌ Cache Hit Test Failed', hits);

    // Test Get operation (Miss)
    await page.evaluate(() => {
      document.getElementById('input-get-k').value = 'user:2';
      document.getElementById('btn-get').click();
    });

    await new Promise((r) => setTimeout(r, 4000));

    const misses = await page.evaluate(() => document.getElementById('metric-misses').textContent);
    if (misses === '1') console.log('✅ Cache Miss Test Passed');
    else console.error('❌ Cache Miss Test Failed', misses);

    // Test Delete operation
    await page.evaluate(() => {
      document.getElementById('input-delete-k').value = 'user:1';
      document.getElementById('btn-delete').click();
    });

    await new Promise((r) => setTimeout(r, 2000));

    // Get deleted key (Miss)
    await page.evaluate(() => {
      document.getElementById('input-get-k').value = 'user:1';
      document.getElementById('btn-get').click();
    });

    await new Promise((r) => setTimeout(r, 4000));
    const missesAfterDelete = await page.evaluate(
      () => document.getElementById('metric-misses').textContent
    );
    if (missesAfterDelete === '2') console.log('✅ Delete Test Passed');
    else console.error('❌ Delete Test Failed', missesAfterDelete);

    console.log('All tests completed!');
  } catch (e) {
    console.error('Test execution failed:', e);
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

runTests();
