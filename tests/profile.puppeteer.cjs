const puppeteer = require('puppeteer');
const path = require('path');

async function runTests() {
    console.log("Starting Puppeteer tests for Profile Page...");
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // Use file protocol to load the local test file
    const filePath = `file:///${path.resolve(__dirname, '../pages/profile/profile.html').replace(/\\/g, '/')}`;
    console.log(`Loading test page: ${filePath}`);
    await page.goto(filePath, { waitUntil: 'networkidle0' });

    console.log("\n--- Testing Empty State ---");
    // Clear local storage and reload
    await page.evaluate(() => {
        localStorage.removeItem('algoInfinityVerse');
    });
    await page.reload({ waitUntil: 'networkidle0' });

    // Wait a bit for JS to execute initProfile
    await new Promise(r => setTimeout(r, 500));

    let isEmptyStateHidden = await page.$eval('#emptyState', el => el.classList.contains('hidden'));
    let isGridHidden = await page.$eval('#solvedGrid', el => el.classList.contains('hidden'));
    
    if (!isEmptyStateHidden && isGridHidden) {
        console.log("✅ Passed: Empty state is visible and grid is hidden.");
    } else {
        console.error("❌ FAILED: Empty state should be visible initially.");
        process.exitCode = 1;
    }

    console.log("\n--- Testing Populated State ---");
    // Mock user progress with 3 solved problems
    await page.evaluate(() => {
        localStorage.setItem('algoInfinityVerse', JSON.stringify({
            name: "Test User",
            level: 5,
            streak: 10,
            xp: 5000,
            completedProblems: [1, 4, 6]
        }));
    });
    await page.reload({ waitUntil: 'networkidle0' });

    // Wait a bit for JS to execute
    await new Promise(r => setTimeout(r, 500));

    isEmptyStateHidden = await page.$eval('#emptyState', el => el.classList.contains('hidden'));
    isGridHidden = await page.$eval('#solvedGrid', el => el.classList.contains('hidden'));
    
    if (isEmptyStateHidden && !isGridHidden) {
        console.log("✅ Passed: Grid is visible and empty state is hidden.");
    } else {
        console.error("❌ FAILED: Grid should be visible with mocked data.");
        process.exitCode = 1;
    }

    // Check count of rendered cards
    const cardCount = await page.$$eval('.problem-card', cards => cards.length);
    if (cardCount === 3) {
        console.log(`✅ Passed: Expected 3 problem cards, found ${cardCount}.`);
    } else {
        console.error(`❌ FAILED: Expected 3 problem cards, found ${cardCount}.`);
        process.exitCode = 1;
    }

    // Check user info rendered correctly
    const userName = await page.$eval('#userName', el => el.textContent);
    const solvedCount = await page.$eval('#solvedCount', el => el.textContent);
    if (userName === "Learner" && solvedCount === "3") {
        console.log("✅ Passed: User header info updated correctly.");
    } else {
        console.error(`❌ FAILED: Header info incorrect. Name: ${userName}, Solved: ${solvedCount}`);
        process.exitCode = 1;
    }

    if (process.exitCode !== 1) {
        console.log("\n🎉 All Puppeteer Profile tests passed successfully!");
    }
    
    await browser.close();
}

runTests().catch(err => {
    console.error("Error running tests:", err);
    process.exit(1);
});
