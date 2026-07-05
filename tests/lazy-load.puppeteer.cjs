const puppeteer = require('puppeteer');
const path = require('path');

async function runTests() {
    console.log("Starting Puppeteer tests for lazy loading...");
    const browser = await puppeteer.launch({ headless: 'new' });
    try {
        const page = await browser.newPage();

        // Use file protocol to load the local test file
        const filePath = `file:///${path.resolve(__dirname, 'lazy-load-test.html').replace(/\\/g, '/')}`;
        console.log(`Loading test page: ${filePath}`);
        await page.goto(filePath, { waitUntil: 'networkidle0' });

        console.log("\n--- Checking initial state (offscreen) ---");
        
        // Check IntersectionObserver image
        let ioImgSrc = await page.$eval('#io-lazy-img', el => el.getAttribute('src'));
        let ioImgClass = await page.$eval('#io-lazy-img', el => el.className);
        console.log(`IO Image src: ${ioImgSrc || 'null'}`);
        console.log(`IO Image class: ${ioImgClass}`);
        if (ioImgSrc !== null || ioImgClass.includes('lazy-loaded')) {
            console.error("❌ FAILED: IO image should not be loaded initially.");
            process.exitCode = 1;
        } else {
            console.log("✅ Passed: IO image src is empty and not loaded.");
        }

        // Check IntersectionObserver background
        let ioBgStyle = await page.$eval('#io-lazy-bg', el => el.style.backgroundImage);
        let ioBgClass = await page.$eval('#io-lazy-bg', el => el.className);
        console.log(`IO Background style: ${ioBgStyle || 'empty'}`);
        if (ioBgStyle !== '' || ioBgClass.includes('lazy-loaded')) {
            console.error("❌ FAILED: IO background should not be loaded initially.");
            process.exitCode = 1;
        } else {
            console.log("✅ Passed: IO background is empty and not loaded.");
        }

        console.log("\n--- Scrolling to viewport ---");
        await page.evaluate(() => {
            document.getElementById('native-lazy').scrollIntoView();
        });

        // Wait for the onload to trigger and add the class
        try {
            await page.waitForFunction(() => {
                const img = document.getElementById('io-lazy-img');
                return img && img.classList.contains('lazy-loaded');
            }, { timeout: 5000 });
        } catch (e) {
            console.error("Timeout waiting for image to load");
        }

        console.log("\n--- Checking state after scrolling ---");

        // Check IntersectionObserver image
        ioImgSrc = await page.$eval('#io-lazy-img', el => el.getAttribute('src'));
        ioImgClass = await page.$eval('#io-lazy-img', el => el.className);
        console.log(`IO Image src after scroll: ${ioImgSrc}`);
        console.log(`IO Image class after scroll: ${ioImgClass}`);
        if (!ioImgSrc || !ioImgClass.includes('lazy-loaded')) {
            console.error("❌ FAILED: IO image should be loaded after scrolling.");
            process.exitCode = 1;
        } else {
            console.log("✅ Passed: IO image loaded correctly.");
        }

        // Check IntersectionObserver background
        ioBgStyle = await page.$eval('#io-lazy-bg', el => el.style.backgroundImage);
        ioBgClass = await page.$eval('#io-lazy-bg', el => el.className);
        console.log(`IO Background style after scroll: ${ioBgStyle}`);
        if (!ioBgStyle.includes('url') || !ioBgClass.includes('lazy-loaded')) {
            console.error("❌ FAILED: IO background should be loaded after scrolling.");
            process.exitCode = 1;
        } else {
            console.log("✅ Passed: IO background loaded correctly.");
        }

        if (process.exitCode !== 1) {
            console.log("\n🎉 All Puppeteer lazy-loading tests passed successfully!");
        }
    } finally {
        await browser.close();
    }
}

runTests().catch(err => {
    console.error("Error running tests:", err);
    process.exit(1);
});
