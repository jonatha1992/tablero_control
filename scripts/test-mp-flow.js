// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('Browser error:', msg.text());
  });

  try {
    console.log('1. Navegando al dashboard/billing...');
    await page.goto('https://tablerocontrol-production.up.railway.app/dashboard/billing', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    const url = page.url();
    console.log('URL actual:', url);
    await page.screenshot({ path: 'scripts/ss-billing.png', fullPage: true });

    const title = await page.title();
    console.log('Título:', title);

    // Buscar cualquier link que apunte a MP
    const mpLinks = await page.locator('a[href*="mercadopago"], a[href*="init_point"]').all();
    console.log('Links MP encontrados:', mpLinks.length);

    for (const link of mpLinks) {
      const href = await link.getAttribute('href');
      console.log('MP link:', href);
    }

    // Buscar botones de suscribir/pagar
    const buttons = await page.locator('button, a').all();
    for (const btn of buttons) {
      const text = await btn.textContent().catch(() => '');
      if (text && /suscri|pagar|plan|upgrade|comprar/i.test(text)) {
        console.log('Botón relevante:', text.trim());
      }
    }

    // Chequear si redirige a login
    if (url.includes('/login') || url.includes('/register')) {
      console.log('Redirigió a login — app requiere auth');
    }

    await page.screenshot({ path: 'scripts/ss-final.png', fullPage: true });

  } catch (err) {
    console.error('Error:', err.message);
    await page.screenshot({ path: 'scripts/ss-error.png', fullPage: true }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
