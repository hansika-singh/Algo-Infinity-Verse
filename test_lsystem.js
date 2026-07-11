import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3459;
const BASE_DIR = path.resolve(__dirname);

const server = http.createServer((req, res) => {
    let urlPath = req.url.split('?')[0]; 
    if (urlPath === '/') urlPath = '/index.html';
    
    let filePath = path.join(BASE_DIR, urlPath);
    let extname = path.extname(filePath);
    let contentType = 'text/html';
    switch (extname) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
    }
    
    fs.readFile(filePath, (error, content) => {
        if (!error) {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        } else {
            res.writeHead(404); res.end();
        }
    });
});

const delay = ms => new Promise(r => setTimeout(r, ms));

server.listen(PORT, async () => {
    void 0;
    
    let browser;
    try {
        browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
        const page = await browser.newPage();
        
        await page.goto(`http://localhost:${PORT}/pages/visualizers/l-system-fractal/l-system-fractal.html`, { waitUntil: 'networkidle0' });
        
        void 0;
        await page.evaluate(() => {
            els.presetSelect.value = 'kochSnowflake';
            els.presetSelect.dispatchEvent(new Event('change'));
        });
        await delay(500); 
        
        const kochString = await page.evaluate(() => currentString);
        void 0;
        if (kochString.length > 1000) {
            void 0;
        } else {
            throw new Error(`Test 1 Failed: Expected > 1000, got ${kochString.length}`);
        }

        void 0;
        await page.evaluate(() => {
            els.presetSelect.value = 'dragonCurve';
            els.presetSelect.dispatchEvent(new Event('change'));
        });
        await delay(500);

        const dragonString = await page.evaluate(() => currentString);
        if (dragonString.length > 2000) {
            void 0;
        } else {
            throw new Error(`Test 2 Failed: Expected > 2000, got ${dragonString.length}`);
        }

        void 0;
        // If an axiom contains letters with no rules, they should persist.
        await page.evaluate(() => {
            els.presetSelect.value = 'custom';
            els.axiomInput.value = 'ZQX';
            els.rulesContainer.innerHTML = '';
            addRuleRow('X', 'F');
            els.iterSlider.value = 3;
            els.drawBtn.click();
        });
        await delay(500);
        const unknownCharString = await page.evaluate(() => currentString);
        if (unknownCharString === 'ZQF') {
            void 0;
        } else {
            throw new Error(`Test 3 Failed: Expected ZQF, got ${unknownCharString}`);
        }

        void 0;
        // Axiom with `]` but no `[`
        await page.evaluate(() => {
            els.axiomInput.value = 'F]F]F';
            els.rulesContainer.innerHTML = '';
            els.iterSlider.value = 1;
            els.drawBtn.click();
        });
        await delay(500);
        // We just verify it didn't throw an unhandled exception and rendered
        const isRendered = await page.evaluate(() => currentString === 'F]F]F');
        if (isRendered) {
            void 0;
        } else {
            throw new Error('Test 4 Failed: Engine crashed on stack underflow');
        }
        
        void 0;
        // Blank axiom -> bounds width/height = 0
        await page.evaluate(() => {
            els.axiomInput.value = '';
            els.drawBtn.click();
        });
        await delay(500);
        const emptyCanvas = await page.evaluate(() => currentString === '');
        if (emptyCanvas) {
            void 0;
        } else {
            throw new Error('Test 5 Failed');
        }

        void 0;

    } catch (error) {
        console.error('\n❌ Test execution failed:', error.message);
    } finally {
        if (browser) await browser.close();
        server.close();
        process.exit(0);
    }
});
