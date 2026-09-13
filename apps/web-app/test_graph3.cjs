const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));
  page.on('pageerror', err => console.log(`PAGE ERROR: ${err.message}`));
  
  try {
    await page.goto('http://localhost:5174/academy', { waitUntil: 'networkidle', timeout: 10000 });
    
    await page.waitForTimeout(4000);
  } catch (e) {
    console.log(`Failed to load: ${e.message}`);
  }
  
  await browser.close();
})();
