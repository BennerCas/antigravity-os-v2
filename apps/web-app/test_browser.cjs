const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`BROWSER ${msg.type().toUpperCase()}: ${msg.text()}`);
    }
  });
  
  page.on('pageerror', error => {
    console.log(`BROWSER EXCEPTION: ${error.message}`);
  });

  try {
    await page.goto('http://localhost:5174/academy', { waitUntil: 'networkidle', timeout: 10000 });
    console.log("Page loaded");
    
    // Wait a bit to see if graph renders
    await page.waitForTimeout(3000);
  } catch (e) {
    console.log(`Failed to load: ${e.message}`);
  }
  
  await browser.close();
})();
