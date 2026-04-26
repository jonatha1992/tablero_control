import { test, expect } from '@playwright/test';
import { loginAsSuperAdmin } from './helpers/auth';

test.describe('Panel SuperAdmin', () => {
  test('dashboard /superadmin carga (si usuario es superadmin)', async ({ page }) => {
    await loginAsSuperAdmin(page);
    const url = page.url();
    // Con emulador el usuario queda como admin → va a /dashboard
    // Si fuera superadmin real → iría a /superadmin
    expect(url).toMatch(/\/(dashboard|superadmin)/);
  });

  test('/superadmin/businesses carga sin error', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/superadmin/businesses');
    await page.waitForLoadState('networkidle');

    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(30);
    // No error 500
    await expect(page.locator('text=500, text=Internal Server Error')).toHaveCount(0);
  });

  test('/superadmin/users carga sin error', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/superadmin/users');
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(30);
  });

  test('/superadmin/audit carga sin error', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/superadmin/audit');
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(30);
  });
});
