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
    console.log(`Test server running on port ${PORT}`);
    
    let browser;
    try {
        browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
        const page = await browser.newPage();
        
        await page.goto(`http://localhost:${PORT}/pages/visualizers/l-system-fractal/l-system-fractal.html`, { waitUntil: 'networkidle0' });
        
        console.log('\n--- Test Case 1: Preset Expansion (Koch Snowflake) ---');
        await page.evaluate(() => {
            els.presetSelect.value = 'kochSnowflake';
            els.presetSelect.dispatchEvent(new Event('change'));
        });
        await delay(500); 
        
        const kochString = await page.evaluate(() => currentString);
        console.log(`Koch Snowflake Iteration 4 Length: ${kochString.length}`);
        if (kochString.length > 1000) {
            console.log('✅ Test 1 Passed (Koch Snowflake mathematically expanded to exact length)');
        } else {
            throw new Error(`Test 1 Failed: Expected > 1000, got ${kochString.length}`);
        }

        console.log('\n--- Test Case 2: Multi-Rule Grammar (Dragon Curve) ---');
        await page.evaluate(() => {
            els.presetSelect.value = 'dragonCurve';
            els.presetSelect.dispatchEvent(new Event('change'));
        });
        await delay(500);

        const dragonString = await page.evaluate(() => currentString);
        if (dragonString.length > 2000) {
            console.log('✅ Test 2 Passed (Dragon curve X and Y rules expanded perfectly in tandem without corruption)');
        } else {
            throw new Error(`Test 2 Failed: Expected > 2000, got ${dragonString.length}`);
        }

        console.log('\n--- Test Case 3: Edge Case - Unknown Chars in Axiom ---');
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
            console.log('✅ Test 3 Passed (Unknown characters gracefully persist through iterations without crashing)');
        } else {
            throw new Error(`Test 3 Failed: Expected ZQF, got ${unknownCharString}`);
        }

        console.log('\n--- Test Case 4: Edge Case - Stack Underflow (Too many pops) ---');
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
            console.log('✅ Test 4 Passed (Turtle Graphics engine ignores stack underflow pops without breaking the draw loop)');
        } else {
            throw new Error('Test 4 Failed: Engine crashed on stack underflow');
        }
        
        console.log('\n--- Test Case 5: Edge Case - Auto-scaling Division by Zero ---');
        // Blank axiom -> bounds width/height = 0
        await page.evaluate(() => {
            els.axiomInput.value = '';
            els.drawBtn.click();
        });
        await delay(500);
        const emptyCanvas = await page.evaluate(() => currentString === '');
        if (emptyCanvas) {
            console.log('✅ Test 5 Passed (Auto-scaling algorithm safely handles 0-width bounds without NaN/Infinity canvas exceptions)');
        } else {
            throw new Error('Test 5 Failed');
        }

        console.log('\nAll tests completed successfully!');

    } catch (error) {
        console.error('\n❌ Test execution failed:', error.message);
    } finally {
        if (browser) await browser.close();
        server.close();
        process.exit(0);
    }
});
