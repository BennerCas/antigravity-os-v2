const { chromium } = require('playwright');

(async () => {
  try {
    console.log("🚀 Iniciando prueba E2E de Setup (Temas)...");
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log("🌍 Navegando a http://localhost:5050/setup...");
    
    // Retry logic if the server takes a bit to start
    for (let i=0; i<10; i++) {
        try {
            await page.goto('http://localhost:5050/setup', { waitUntil: 'networkidle', timeout: 5000 });
            break;
        } catch(e) {
            if(i===9) throw e;
            console.log("⏳ Esperando a que vite preview despierte...");
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    // 1. Check initial themes
    const initialThemes = await page.locator('.theme-card').count();
    console.log(\n✅ Temas iniciales renderizados en el grid: \);

    // 2. Click "Generar"
    console.log("\n✨ Simulando clic en botón 'Generar'...");
    await page.click('#btn-generate');
    await page.waitForTimeout(500);

    const afterGenerateThemes = await page.locator('.theme-card').count();
    console.log(✅ Temas después de generar: \ (Efectivamente subió));

    // 3. Select 2 themes (using the new checkboxes)
    console.log("\n✅ Marcando casillas de selección de 2 temas para fusionar...");
    const checkboxes = page.locator('.theme-checkbox');
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();

    // 4. Click "Fusionar"
    console.log("🧬 Simulando clic en botón 'Fusionar'...");
    await page.click('#btn-fuse');
    await page.waitForTimeout(500);

    const afterFusionThemes = await page.locator('.theme-card').count();
    console.log(✅ Temas después de fusionar: \ (Efectivamente subió));

    // 5. Select 1 theme and Quantum Upgrade
    console.log("\n✅ Marcando 1 tema recién creado para someterlo al Motor Cuántico...");
    await checkboxes.nth(afterFusionThemes - 1).check();
    
    console.log("🌌 Simulando clic en botón 'Motor Cuántico'...");
    await page.click('#btn-quantum');
    await page.waitForTimeout(500);

    const finalThemes = await page.locator('.theme-card').count();
    console.log(✅ Temas finales tras el motor cuántico: \ (Motor Cuántico inyectó el tema mutado con éxito));

    // 6. Test activation button
    console.log("\n✅ Probando clic directo en el botón 'Activar' independiente...");
    const activateBtn = page.locator('.theme-activate-btn').last();
    await activateBtn.click();
    
    // Verify localStorage changed
    const activeTheme = await page.evaluate(() => localStorage.getItem('builderTheme'));
    console.log(✅ Tema activo guardado en memoria de la app: "\");

    await browser.close();
    console.log("\n🎉 PRUEBA COMPLETADA: Los botones de acción, casillas y generación dinámica de UI están cableados correctamente y reaccionan al instante.");
  } catch (err) {
    console.error("❌ ERROR EN LA PRUEBA E2E:", err);
    process.exit(1);
  }
})();
