import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Simple Static Server ---
const PORT = 3457;
const BASE_DIR = path.resolve(__dirname);

const server = http.createServer((req, res) => {
    let urlPath = req.url.split('?')[0]; // Strip query strings
    if (urlPath === '/') urlPath = '/index.html';
    
    let filePath = path.join(BASE_DIR, urlPath);
    let extname = path.extname(filePath);
    let contentType = 'text/html';
    switch (extname) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
        case '.json': contentType = 'application/json'; break;
        case '.png': contentType = 'image/png'; break;
        case '.jpg': contentType = 'image/jpg'; break;
    }
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

const delay = ms => new Promise(r => setTimeout(r, ms));

server.listen(PORT, async () => {
    console.log(`Test server running on port ${PORT}`);
    
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: 'new',
            args: ['--no-sandbox'] 
        });
        const page = await browser.newPage();
        
        // Expose a function to log from browser to Node console
        page.on('console', msg => {
            if(msg.type() === 'error') console.error('PAGE ERROR:', msg.text());
        });

        await page.goto(`http://localhost:${PORT}/pages/visualizers/quadtree-collision/quadtree-collision.html`, { waitUntil: 'networkidle0' });
        
        console.log('\n--- Test Case 1: Initial State (Quadtree, 500 particles) ---');
        await delay(500); // Let engine loop run a bit
        let stats1 = await page.evaluate(() => window.engineStats);
        console.log(`Initial Checks: ${stats1.checks}, Initial Collisions: ${stats1.collisions}`);
        if(stats1.checks > 0) console.log('✅ Test 1 Passed');
        else throw new Error('Test 1 Failed: Engine not running checks.');

        console.log('\n--- Test Case 2: Naive Math Verification (100 particles) ---');
        await page.evaluate(() => {
            document.getElementById('particleCount').value = 100;
            document.getElementById('particleCount').dispatchEvent(new Event('input'));
            mode = 'naive'; // Force mode switch directly
        });
        await delay(500);
        let stats2 = await page.evaluate(() => window.engineStats);
        // Math for 100 particles: 100 * 99 / 2 = 4950
        console.log(`Naive Checks (100 particles): ${stats2.checks}`);
        if(stats2.checks === 4950) console.log('✅ Test 2 Passed (Math is perfectly O(N²))');
        else throw new Error(`Test 2 Failed: Expected 4950, got ${stats2.checks}`);

        console.log('\n--- Test Case 3: Edge Case - 0/Min Particles ---');
        await page.evaluate(() => {
            document.getElementById('particleCount').value = 50; // Slider min is 50
            document.getElementById('particleCount').dispatchEvent(new Event('input'));
            mode = 'quadtree'; 
        });
        await delay(500);
        let stats3 = await page.evaluate(() => window.engineStats);
        console.log(`Quadtree Checks (50 particles): ${stats3.checks}`);
        if(stats3.checks < 1225) console.log('✅ Test 3 Passed (Quadtree handles low density without crashing)');
        else throw new Error('Test 3 Failed');

        console.log('\n--- Test Case 4: Extreme Stress Test (2500 particles in Naive) ---');
        await page.evaluate(() => {
            document.getElementById('particleCount').value = 2500;
            document.getElementById('particleCount').dispatchEvent(new Event('input'));
            mode = 'naive'; 
        });
        await delay(1000); // Let it crunch
        let stats4 = await page.evaluate(() => window.engineStats);
        // Math for 2500 particles: 2500 * 2499 / 2 = 3123750
        console.log(`Naive Checks (2500 particles): ${stats4.checks}`);
        if(stats4.checks === 3123750) console.log('✅ Test 4 Passed (UI handles 3M+ checks without breaking)');
        else throw new Error(`Test 4 Failed: Expected 3123750, got ${stats4.checks}`);

        console.log('\nAll tests completed successfully!');

    } catch (error) {
        console.error('\n❌ Test execution failed:', error.message);
    } finally {
        if (browser) await browser.close();
        server.close();
        process.exit(0);
    }
});
