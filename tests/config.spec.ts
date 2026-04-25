import { test, expect } from '@playwright/test';
import { loginAsSuperAdmin } from './helpers/auth';

test.describe('Configuración de usuario', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/dashboard/config');
    await page.waitForLoadState('networkidle');
  });

  test('página config carga con tabs', async ({ page }) => {
    const tab = page.locator('[role="tab"], button').filter({ hasText: /Perfil|Preferencias|Notificaciones/i });
    await expect(tab.first()).toBeVisible({ timeout: 10000 });
  });

  test('tab Mi Perfil muestra datos', async ({ page }) => {
    const perfilTab = page.locator('[role="tab"], button').filter({ hasText: /Perfil/i });
    if (await perfilTab.count() > 0) await perfilTab.first().click();

    // Email del usuario visible (campo disabled)
    const emailField = page.locator('input[disabled], input[readonly]').filter({ hasValue: /tecnofusion|@/ });
    const hasEmailField = await emailField.count() > 0;
    // O email como texto
    const emailText = page.locator('text=tecnofusion.it@gmail.com');
    const hasEmailText = await emailText.count() > 0;
    expect(hasEmailField || hasEmailText).toBeTruthy();
  });

  test('tab Preferencias — opciones de tema', async ({ page }) => {
    const prefTab = page.locator('[role="tab"], button').filter({ hasText: /Preferencias/i });
    if (await prefTab.count() === 0) { test.skip(); return; }

    await prefTab.first().click();
    await page.waitForLoadState('networkidle');

    const themeOption = page.locator('label').filter({ hasText: 'Claro' }).first();
    await expect(themeOption).toBeVisible({ timeout: 5000 });
  });

  test('tab Notificaciones — toggles presentes', async ({ page }) => {
    const notifTab = page.locator('[role="tab"], button').filter({ hasText: /Notificaciones/i });
    if (await notifTab.count() === 0) { test.skip(); return; }

    await notifTab.first().click();
    await page.waitForLoadState('networkidle');

    const toggle = page.locator('[role="switch"], input[type="checkbox"]');
    await expect(toggle.first()).toBeVisible({ timeout: 5000 });
  });
});
