const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5174/academy', { waitUntil: 'networkidle', timeout: 10000 });
    
    // Close the joyride popup if it exists
    try {
        await page.click('.react-joyride__overlay', { force: true, timeout: 2000 });
    } catch(e) {}
    try {
        const skipBtn = await page.$('button[title="Skip"]');
        if (skipBtn) await skipBtn.click({force: true});
        const closeBtn = await page.$('button[title="Close"]');
        if (closeBtn) await closeBtn.click({force: true});
        const nextBtn = await page.$('button[title="Next"]');
        while (nextBtn) {
            await nextBtn.click({force: true});
            await page.waitForTimeout(500);
        }
    } catch(e) {}
    
    // Evaluate to click the 3d tab directly since playwright sometimes gets blocked
    await page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('button'));
        const target = tabs.find(t => t.textContent.includes('SKILL GRAPH & MASTERY'));
        if (target) target.click();
    });
    
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'graph_view2.png' });
    console.log("Screenshot saved.");
  } catch (e) {
    console.log(`Failed to load: ${e.message}`);
  }
  
  await browser.close();
})();
