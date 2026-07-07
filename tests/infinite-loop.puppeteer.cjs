const puppeteer = require('puppeteer');
const path = require('path');

async function runTests() {
    console.log("Starting Puppeteer tests for Infinite Loop Detection...");
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--allow-file-access-from-files']
    });
    const page = await browser.newPage();

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    const filePath = `file:///${path.resolve(__dirname, '../Playground/playground.html').replace(/\\/g, '/')}`;
    console.log(`Loading test page: ${filePath}`);
    await page.goto(filePath, { waitUntil: 'networkidle0' });

    console.log("\n--- Testing Normal Execution ---");
    // Change editor content to normal JS
    await page.evaluate(() => {
        const editor = ace.edit("editor");
        editor.setValue('console.log("Hello Web Worker");', -1);
        document.getElementById('runBtn').click();
    });

    // Wait a bit
    await new Promise(r => setTimeout(r, 1000));
    let outputText = await page.$eval('#output', el => el.textContent);
    
    if (outputText.includes("Hello Web Worker")) {
        console.log("✅ Passed: Normal execution works via Web Worker.");
    } else {
        console.error("❌ FAILED: Normal execution failed. Output: " + outputText);
        process.exitCode = 1;
    }

    console.log("\n--- Testing Infinite Loop Execution ---");
    await page.evaluate(() => {
        const editor = ace.edit("editor");
        editor.setValue('while(true) {}', -1);
        document.getElementById('runBtn').click();
    });

    // Wait for timeout (3000ms + some buffer)
    await new Promise(r => setTimeout(r, 3500));
    outputText = await page.$eval('#output', el => el.textContent);
    
    if (outputText.includes("Timeout / Infinite Loop Detected")) {
        console.log("✅ Passed: Infinite loop was caught and terminated successfully.");
    } else {
        console.error("❌ FAILED: Infinite loop was not terminated properly. Output: " + outputText);
        process.exitCode = 1;
    }

    if (process.exitCode !== 1) {
        console.log("\n🎉 All Infinite Loop tests passed successfully!");
    }
    
    await browser.close();
}

runTests().catch(err => {
    console.error("Error running tests:", err);
    process.exit(1);
});
