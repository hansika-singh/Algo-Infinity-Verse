const puppeteer = require('puppeteer');
const path = require('path');

async function runTests() {
    console.log("Starting Puppeteer tests for Report an Issue...");
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--allow-file-access-from-files']
    });
    const page = await browser.newPage();

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    const filePath = `file:///${path.resolve(__dirname, '../pages/learning/python-learning/python-learning.html').replace(/\\/g, '/')}`;
    console.log(`Loading test page: ${filePath}`);
    
    await page.goto(filePath, { waitUntil: 'networkidle0' });

    console.log("\n--- Testing UI Rendering ---");
    
    // Simulate script.js injection using native Puppeteer method
    await page.addScriptTag({ path: path.resolve(__dirname, '../scripts/report-issue.js') });

    // Wait for the script to load and inject the button
    await new Promise(r => setTimeout(r, 1000));
    
    const btnExists = await page.$('#reportIssueBtn');
    if (btnExists) {
        console.log("✅ Passed: Report Issue button was injected successfully.");
    } else {
        console.error("❌ FAILED: Report Issue button not found.");
        process.exitCode = 1;
    }

    console.log("\n--- Testing Modal Interaction ---");
    await page.click('#reportIssueBtn');
    
    // Wait for animation
    await new Promise(r => setTimeout(r, 300));
    
    let isHidden = await page.$eval('#reportIssueModal', el => el.classList.contains('hidden'));
    if (!isHidden) {
        console.log("✅ Passed: Modal opened successfully.");
    } else {
        console.error("❌ FAILED: Modal did not open.");
        process.exitCode = 1;
    }

    console.log("\n--- Testing Form Submission ---");
    await page.select('#issueCategory', 'Typographical error');
    await page.type('#issueDescription', 'There is a typo in the second paragraph.');
    
    await page.click('#submitReportBtn');
    
    // Wait for mock API response (1000ms) + buffer
    await new Promise(r => setTimeout(r, 1200));

    isHidden = await page.$eval('#reportIssueModal', el => el.classList.contains('hidden'));
    if (isHidden) {
        console.log("✅ Passed: Modal closed automatically after successful submission.");
    } else {
        console.error("❌ FAILED: Modal did not close after submission.");
        process.exitCode = 1;
    }

    if (process.exitCode !== 1) {
        console.log("\n🎉 All Report an Issue tests passed successfully!");
    }
    
    await browser.close();
}

runTests().catch(err => {
    console.error("Error running tests:", err);
    process.exit(1);
});
