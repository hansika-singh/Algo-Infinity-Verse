import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Simple Static Server ---
const PORT = 3458;
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

server.on('error', (err) => {
    console.error('Test server failed to start:', err.message);
    process.exit(1);
});

const delay = ms => new Promise(r => setTimeout(r, ms));

server.listen(PORT, async () => {
    void 0;
    
    let browser;
    try {
        browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
        const page = await browser.newPage();
        
        await page.goto(`http://localhost:${PORT}/pages/visualizers/network-routing-simulator/network-routing-simulator.html`, { waitUntil: 'networkidle0' });
        
        void 0;
        await delay(500); 
        
        const r1RoutingTable = await page.evaluate(() => globalRoutingTables["R1"]);
        void 0;
        if (r1RoutingTable.dist["R2"] === 5 && r1RoutingTable.dist["R3"] === 2 && r1RoutingTable.dist["R4"] === 1) {
            void 0;
        } else {
            throw new Error("Test 1 Failed: Initial routing table is incorrect.");
        }

        void 0;
        await page.evaluate(() => {
            const linkToDelete = links.find(l => (l.source.id === "R1" && l.target.id === "R3") || (l.source.id === "R3" && l.target.id === "R1"));
            deleteLink(linkToDelete);
        });
        await delay(500);

        const r1UpdatedTable = await page.evaluate(() => globalRoutingTables["R1"]);
        if (r1UpdatedTable.dist["R3"] === 13 && r1UpdatedTable.nextHop["R3"] === "R2") {
            void 0;
        } else {
            throw new Error("Test 2 Failed");
        }

        void 0;
        // Delete link R2->R3 to isolate R3 entirely from R1
        await page.evaluate(() => {
            const linkToDelete = links.find(l => (l.source.id === "R2" && l.target.id === "R3") || (l.source.id === "R3" && l.target.id === "R2"));
            deleteLink(linkToDelete);
        });
        await delay(500);

        const r1SplitTable = await page.evaluate(() => globalRoutingTables["R1"]);
        if (r1SplitTable.dist["R3"] === null || r1SplitTable.dist["R3"] === Infinity || r1SplitTable.dist["R3"] === undefined) {
            void 0;
        } else {
            throw new Error(`Test 3 Failed: R3 should be unreachable, got dist ${r1SplitTable.dist["R3"]}`);
        }

        void 0;
        if (r1SplitTable.dist["R1"] === 0 && r1SplitTable.nextHop["R1"] === "Local") {
            void 0;
        } else {
            throw new Error("Test 4 Failed: Local node routing error.");
        }

        void 0;
        await page.evaluate(() => {
            // Clear net
            nodes = []; links = []; routerCounter = 1;
            
            // Add 100 routers
            for(let i=0; i<100; i++) {
                addNode(Math.random()*800, Math.random()*600);
            }
            
            // Add 150 random links
            for(let i=0; i<150; i++) {
                let s = nodes[Math.floor(Math.random()*100)];
                let t = nodes[Math.floor(Math.random()*100)];
                if(s && t && s !== t) addLink(s, t);
            }
        });
        await delay(1000); // Give graph time to compute
        const r1StressTable = await page.evaluate(() => globalRoutingTables["R1"]);
        if (r1StressTable && typeof r1StressTable.dist === 'object') {
            void 0;
        } else {
            throw new Error("Test 5 Failed: Engine failed under stress.");
        }
        
        void 0;

    } catch (error) {
        console.error('\n❌ Test execution failed:', error.message);
        process.exitCode = 1;
    } finally {
        if (browser) await browser.close();
        server.close();
        process.exit(process.exitCode ?? 0);
    }
});
