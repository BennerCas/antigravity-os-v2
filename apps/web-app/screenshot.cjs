const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5174/academy', { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'graph_screenshot.png' });
    console.log("Screenshot saved.");
  } catch (e) {
    console.log(`Failed to load: ${e.message}`);
  }
  
  await browser.close();
})();
