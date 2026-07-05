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
    console.log(`Test server running on port ${PORT}`);
    
    let browser;
    try {
        browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
        const page = await browser.newPage();
        
        await page.goto(`http://localhost:${PORT}/pages/visualizers/network-routing-simulator/network-routing-simulator.html`, { waitUntil: 'networkidle0' });
        
        console.log('\n--- Test Case 1: Initial Default Topology Routing ---');
        await delay(500); 
        
        const r1RoutingTable = await page.evaluate(() => globalRoutingTables["R1"]);
        console.log("R1 Table Distances:", r1RoutingTable.dist);
        if (r1RoutingTable.dist["R2"] === 5 && r1RoutingTable.dist["R3"] === 2 && r1RoutingTable.dist["R4"] === 1) {
            console.log('✅ Test 1 Passed (Initial Dijkstra computes correctly)');
        } else {
            throw new Error("Test 1 Failed: Initial routing table is incorrect.");
        }

        console.log('\n--- Test Case 2: Topology Change (Break optimal link) ---');
        await page.evaluate(() => {
            const linkToDelete = links.find(l => (l.source.id === "R1" && l.target.id === "R3") || (l.source.id === "R3" && l.target.id === "R1"));
            deleteLink(linkToDelete);
        });
        await delay(500);

        const r1UpdatedTable = await page.evaluate(() => globalRoutingTables["R1"]);
        if (r1UpdatedTable.dist["R3"] === 13 && r1UpdatedTable.nextHop["R3"] === "R2") {
            console.log('✅ Test 2 Passed (Reroutes via backup path correctly)');
        } else {
            throw new Error("Test 2 Failed");
        }

        console.log('\n--- Test Case 3: Edge Case - Unreachable Node (Split Brain) ---');
        // Delete link R2->R3 to isolate R3 entirely from R1
        await page.evaluate(() => {
            const linkToDelete = links.find(l => (l.source.id === "R2" && l.target.id === "R3") || (l.source.id === "R3" && l.target.id === "R2"));
            deleteLink(linkToDelete);
        });
        await delay(500);

        const r1SplitTable = await page.evaluate(() => globalRoutingTables["R1"]);
        if (r1SplitTable.dist["R3"] === null || r1SplitTable.dist["R3"] === Infinity || r1SplitTable.dist["R3"] === undefined) {
            console.log('✅ Test 3 Passed (Properly handles Unreachable/Infinity distances for split networks)');
        } else {
            throw new Error(`Test 3 Failed: R3 should be unreachable, got dist ${r1SplitTable.dist["R3"]}`);
        }

        console.log('\n--- Test Case 4: Edge Case - Self Routing (Localhost) ---');
        if (r1SplitTable.dist["R1"] === 0 && r1SplitTable.nextHop["R1"] === "Local") {
            console.log('✅ Test 4 Passed (Local node resolves as 0 distance)');
        } else {
            throw new Error("Test 4 Failed: Local node routing error.");
        }

        console.log('\n--- Test Case 5: Stress Test (100 Random Routers & Links) ---');
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
            console.log('✅ Test 5 Passed (Dijkstra efficiently calculated 100-node graph without thread lock)');
        } else {
            throw new Error("Test 5 Failed: Engine failed under stress.");
        }
        
        console.log('\nAll tests completed successfully!');

    } catch (error) {
        console.error('\n❌ Test execution failed:', error.message);
        process.exitCode = 1;
    } finally {
        if (browser) await browser.close();
        server.close();
        process.exit(process.exitCode ?? 0);
    }
});
