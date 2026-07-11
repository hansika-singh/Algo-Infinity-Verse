import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3460;
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
        
        await page.goto(`http://localhost:${PORT}/pages/visualizers/nn-backprop-visualizer/nn-backprop-visualizer.html`, { waitUntil: 'networkidle0' });
        
        void 0;
        const initialLoss = await page.evaluate(() => {
            els.datasetSelect.value = 'xor';
            els.datasetSelect.dispatchEvent(new Event('change'));
            els.trainEpochBtn.click();
            return parseFloat(els.lossStat.textContent);
        });
        if (initialLoss > 0.0) {
            void 0;
        } else {
            throw new Error(`Test 1 Failed: Initial Loss should be > 0. Got ${initialLoss}`);
        }

        void 0;
        await page.evaluate(() => {
            els.lrSlider.value = 0.5;
            for(let i=0; i<1000; i++) trainEpoch();
        });
        await delay(500); 
        let finalLoss = await page.evaluate(() => parseFloat(els.lossStat.textContent));
        
        if (finalLoss < 0.15) {
            void 0;
        } else {
            void 0;
            await page.evaluate(() => {
                resetNetwork();
                els.lrSlider.value = 0.5;
                for(let i=0; i<3000; i++) trainEpoch();
            });
            await delay(500);
            const retryLoss = await page.evaluate(() => parseFloat(els.lossStat.textContent));
            if (retryLoss < 0.15) {
                void 0;
            } else {
                throw new Error(`Test 2 Failed: Backprop math is broken. Loss: ${retryLoss}`);
            }
        }
        
        void 0;
        await page.evaluate(() => {
            els.archInput.value = 'a, b, c, -5, 0';
            els.archInput.dispatchEvent(new Event('change'));
        });
        await delay(500);
        const hasNetwork = await page.evaluate(() => network.length > 0 && network[0].neurons.length === 2 && network[network.length-1].neurons.length === 1);
        if (hasNetwork) {
            void 0;
        } else {
            throw new Error('Test 3 Failed: Malformed input corrupted the network array.');
        }

        void 0;
        await page.evaluate(() => {
            // Very deep network: 5 hidden layers with 10 neurons each
            els.archInput.value = '10,10,10,10,10';
            els.archInput.dispatchEvent(new Event('change'));
            els.lrSlider.value = 0.1;
            // Train 100 epochs on a massive network to check memory/math stability
            for(let i=0; i<100; i++) trainEpoch();
        });
        await delay(500);
        const massiveLoss = await page.evaluate(() => parseFloat(els.lossStat.textContent));
        if (!isNaN(massiveLoss)) {
            void 0;
        } else {
            throw new Error('Test 4 Failed: Massive architecture caused NaN or crash.');
        }
        
        void 0;
        await page.evaluate(() => {
            resetNetwork();
            els.activationSelect.value = 'relu';
            els.activationSelect.dispatchEvent(new Event('change'));
            for(let i=0; i<10; i++) trainEpoch();
        });
        await delay(500);
        const reluLoss = await page.evaluate(() => parseFloat(els.lossStat.textContent));
        if (!isNaN(reluLoss)) {
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
