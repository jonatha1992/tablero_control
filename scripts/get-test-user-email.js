// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Navegando a login de MP...');
    await page.goto('https://www.mercadopago.com.ar/hub/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: 'scripts/mp-login.png' });

    // Ingresar usuario
    const userInput = page.locator('input[name="user_id"], input[placeholder*="mail"], input[type="email"], input[type="text"]').first();
    await userInput.fill('TESTUSER8552126647218015422');
    await page.screenshot({ path: 'scripts/mp-login-user.png' });

    // Continuar
    const continueBtn = page.locator('button[type="submit"], button:has-text("Continuar"), button:has-text("Continue")').first();
    await continueBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'scripts/mp-login-after-user.png' });

    // Password
    const passInput = page.locator('input[type="password"]').first();
    if (await passInput.isVisible()) {
      await passInput.fill('zMntkL5BT5');
      const loginBtn = page.locator('button[type="submit"]').first();
      await loginBtn.click();
      await page.waitForTimeout(3000);
    }

    await page.screenshot({ path: 'scripts/mp-after-login.png' });
    console.log('URL después de login:', page.url());

    // Navegar al panel de test users
    await page.goto('https://www.mercadopago.com.ar/developers/panel/app/790893686372741/test-users', {
      waitUntil: 'networkidle', timeout: 30000
    });
    await page.screenshot({ path: 'scripts/mp-test-users.png' });
    console.log('URL panel:', page.url());

    const content = await page.textContent('body');
    // Buscar emails de test
    const emailMatches = content.match(/test_user_\d+@testuser\.com/g) || [];
    const nicknameMatches = content.match(/TESTUSER\w+/g) || [];
    console.log('Emails encontrados:', [...new Set(emailMatches)]);
    console.log('Nicknames encontrados:', [...new Set(nicknameMatches)].slice(0, 5));

  } catch (err) {
    console.error('Error:', err.message);
    await page.screenshot({ path: 'scripts/mp-error.png' }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
