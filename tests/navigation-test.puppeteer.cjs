const puppeteer = require('puppeteer');
const { exec } = require('child_process');

const PORT = 8085;
const BASE_URL = `http://localhost:${PORT}`;

(async () => {
  console.log('Starting local HTTP server...');
  const server = exec(`npx http-server -p ${PORT}`);
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Launching Puppeteer...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  let testsPassed = 0;
  let totalTests = 0;
  
  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      testsPassed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
    }
  }

  try {
    console.log('\n--- Test 1: Initial Load ---');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    
    // Give script.js time to attach event listeners
    await new Promise(r => setTimeout(r, 1000));
    
    const initialBreadcrumbs = await page.evaluate(() => document.getElementById('dynamic-breadcrumbs').innerText);
    assert(initialBreadcrumbs.includes('Home'), 'Breadcrumbs contain "Home"');
    
    console.log('\n--- Test 2: Filter Interaction ---');
    await page.evaluate(() => {
      const btn = document.querySelector('.practice-section .filter-btn[data-filter="hard"]');
      if (btn) btn.click();
      else console.error('Hard filter button not found');
    });
    
    await new Promise(r => setTimeout(r, 500));
    const urlAfterFilter = await page.evaluate(() => window.location.href);
    assert(urlAfterFilter.includes('filter=hard'), `URL updated with filter=hard (Got: ${urlAfterFilter})`);
    
    const breadcrumbsAfterFilter = await page.evaluate(() => document.getElementById('dynamic-breadcrumbs').innerText);
    assert(breadcrumbsAfterFilter.includes('Filter: Hard'), 'Breadcrumbs updated with "Filter: Hard"');
    
    console.log('\n--- Test 3: Search Interaction ---');
    await page.type('#searchInput', 'Array');
    
    await new Promise(r => setTimeout(r, 500));
    const urlAfterSearch = await page.evaluate(() => window.location.href);
    assert(urlAfterSearch.includes('filter=hard') && urlAfterSearch.includes('search=array'), `URL updated with search=array (Got: ${urlAfterSearch})`);
    
    const breadcrumbsAfterSearch = await page.evaluate(() => document.getElementById('dynamic-breadcrumbs').innerText);
    assert(breadcrumbsAfterSearch.includes('search: "array"'), 'Breadcrumbs updated with search query');
    
    console.log('\n--- Test 4: Browser Back Button ---');
    await page.goBack();
    await new Promise(r => setTimeout(r, 1000));
    
    const urlAfterBack = await page.evaluate(() => window.location.href);
    assert(urlAfterBack.includes('filter=hard') && !urlAfterBack.includes('search=array'), `URL reverted correctly (Got: ${urlAfterBack})`);
    
    const searchInputValue = await page.evaluate(() => document.getElementById('searchInput').value);
    assert(searchInputValue === '', `Search input cleared automatically (Got: "${searchInputValue}")`);
    
  } catch(e) {
    console.error('\n❌ Unhandled Exception during testing:');
    console.error(e);
  } finally {
    console.log(`\n=== RESULTS: ${testsPassed}/${totalTests} TESTS PASSED ===`);
    await browser.close();
    server.kill();
    process.exit(testsPassed === totalTests ? 0 : 1);
  }
})();
