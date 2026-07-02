const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function runTests() {
    console.log("Starting Puppeteer tests for Markdown Export...");
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--allow-file-access-from-files']
    });
    
    // We set up a download path
    const downloadPath = path.resolve(__dirname, 'downloads');
    if (!fs.existsSync(downloadPath)) {
        fs.mkdirSync(downloadPath);
    }
    
    const page = await browser.newPage();
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: downloadPath
    });

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // We'll test the export function directly on a blank page
    await page.goto('about:blank');

    console.log("\n--- Injecting Export Script ---");
    await page.addScriptTag({ path: path.resolve(__dirname, '../scripts/export-markdown.js') });

    console.log("\n--- Testing Markdown Download ---");
    await page.evaluate(() => {
        const problem = {
            title: "Two Sum",
            difficulty: "Easy",
            category: "Arrays",
            tags: ["Arrays", "Hash Table"],
            description: "Find two numbers that add up to target.",
            constraints: ["2 <= nums.length <= 10^4"]
        };
        const solution = {
            code: "function twoSum(nums, target) {\n  return [0, 1];\n}",
            lang: "javascript",
            date: new Date().toISOString()
        };
        // Mock showNotification
        window.showNotification = () => {};
        
        window.exportProblemAsMarkdown(problem, solution);
    });
    
    // Wait for download
    await new Promise(r => setTimeout(r, 2000));
    
    const files = fs.readdirSync(downloadPath);
    const mdFile = files.find(f => f.endsWith('.md'));
    
    if (mdFile) {
        console.log(`✅ Passed: Downloaded Markdown file: ${mdFile}`);
        const content = fs.readFileSync(path.join(downloadPath, mdFile), 'utf8');
        if (content.includes('function twoSum')) {
            console.log("✅ Passed: Markdown file contains the correct code snippet.");
        } else {
            console.error("❌ FAILED: Code snippet not found in Markdown.");
            process.exitCode = 1;
        }
        if (content.includes('## Constraints')) {
            console.log("✅ Passed: Markdown file contains formatting correctly.");
        }
    } else {
        console.error("❌ FAILED: Markdown file was not downloaded.");
        process.exitCode = 1;
    }

    // Cleanup
    if (mdFile) fs.unlinkSync(path.join(downloadPath, mdFile));
    fs.rmdirSync(downloadPath);

    if (process.exitCode !== 1) {
        console.log("\n🎉 All Markdown Export tests passed successfully!");
    }
    
    await browser.close();
}

runTests().catch(err => {
    console.error("Error running tests:", err);
    process.exit(1);
});
