import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple static file server
const PORT = 3456;
const server = http.createServer((req, res) => {
    void 0;
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
            if(error.code == 'ENOENT'){
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
        void 0;

        browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        
        // Forward console logs from page
        page.on('console', msg => void 0);
        page.on('pageerror', error => void 0);
        
        // Mock the window.showToast if necessary since it relies on main script
        await page.evaluateOnNewDocument(() => {
            window.showToast = (msg, type) => void 0;
        });

        // Navigate to the simulator
        await page.goto(`http://localhost:${PORT}/pages/visualizers/map-reduce-simulator/map-reduce-simulator.html`, { waitUntil: 'networkidle0' });
        
        void 0;
        // Clear input and enter custom text
        await page.evaluate(() => document.getElementById('dataInput').value = 'hello world hello map');
        
        // Start simulation directly to bypass UI issues
        await page.evaluate(() => window.mrSimulator.startJob());
        
        // Wait for completion
        await page.waitForFunction(() => document.getElementById('statStatus').textContent === 'Completed', { timeout: 15000 });
        
        // Verify results
        const finalOutputCount = await page.evaluate(() => document.querySelectorAll('.output-item').length);
        void 0;
        
        const outputTexts = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.output-item')).map(el => {
                return {
                    key: el.querySelector('.out-key').textContent,
                    value: el.querySelector('.out-val').textContent
                };
            });
        });
        void 0;
        
        const passed1 = outputTexts.find(o => o.key === 'hello' && o.value === '2') &&
                        outputTexts.find(o => o.key === 'world' && o.value === '1') &&
                        outputTexts.find(o => o.key === 'map' && o.value === '1');
        
        if (passed1) void 0;
        else console.error("❌ Test 1 Failed", outputTexts);

        void 0;
        await page.evaluate(() => {
            document.getElementById('btnResetAll').click();
            document.getElementById('dataInput').value = 'Apple, apple! orange? APPLE.';
            window.mrSimulator.startJob();
        });
        await page.waitForFunction(() => document.getElementById('statStatus').textContent === 'Completed', { timeout: 15000 });
        
        const outputTexts2 = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.output-item')).map(el => {
                return { key: el.querySelector('.out-key').textContent, value: el.querySelector('.out-val').textContent };
            });
        });
        
        const passed2 = outputTexts2.find(o => o.key === 'apple' && o.value === '3') &&
                        outputTexts2.find(o => o.key === 'orange' && o.value === '1') &&
                        outputTexts2.length === 2;
        if (passed2) void 0;
        else console.error("❌ Test 2 Failed", outputTexts2);

        void 0;
        await page.evaluate(() => {
            document.getElementById('btnResetAll').click();
            document.getElementById('dataInput').value = '!@# $%^';
            window.mrSimulator.startJob();
        });
        await page.waitForFunction(() => document.getElementById('statStatus').textContent === 'Completed', { timeout: 15000 });
        
        const outputTexts3 = await page.evaluate(() => document.querySelectorAll('.output-item').length);
        if (outputTexts3 === 0) void 0;
        else console.error("❌ Test 3 Failed", outputTexts3);
        
        void 0;
        // Set mappers to 8, but words to 2
        await page.evaluate(() => {
            document.getElementById('btnResetAll').click();
            const slider = document.getElementById('mapperCount');
            slider.value = 8;
            slider.dispatchEvent(new Event('input'));
            document.getElementById('dataInput').value = 'one two';
            window.mrSimulator.startJob();
        });
        await page.waitForFunction(() => document.getElementById('statStatus').textContent === 'Completed', { timeout: 15000 });
        
        const outputTexts4 = await page.evaluate(() => document.querySelectorAll('.output-item').length);
        if (outputTexts4 === 2) void 0;
        else console.error("❌ Test 4 Failed");
        
        void 0;

    } catch (e) {
        console.error("Test execution failed:", e);
    } finally {
        if (browser) await browser.close();
        server.close();
    }
}

runTests();
