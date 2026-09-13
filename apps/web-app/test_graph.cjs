const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5174/academy', { waitUntil: 'networkidle', timeout: 10000 });
    
    // Close the joyride popup if it exists
    try {
        await page.click('button[title="Close"]', { timeout: 2000 });
    } catch(e) {}
    try {
        await page.click('text=Ver Grafo de Habilidades', { timeout: 2000 });
    } catch(e) {
        console.log("Could not find button");
    }
    
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'graph_view.png' });
    console.log("Screenshot saved.");
  } catch (e) {
    console.log(`Failed to load: ${e.message}`);
  }
  
  await browser.close();
})();
