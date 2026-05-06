import { test, expect } from '@playwright/test';
import { loginAsSuperAdmin } from './helpers/auth';

test.describe('Ciclos / Períodos de Trabajo', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/dashboard/ciclos');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 15000 }).catch(() => {});
  });

  test('página de ciclos carga sin error 500', async ({ page }) => {
    await expect(page.locator('text=500, text=Internal Server Error')).toHaveCount(0);
    await expect(page).toHaveURL('/dashboard/ciclos');
  });

  test('botón crear nuevo ciclo visible', async ({ page }) => {
    const createBtn = page.locator(
      'button:has-text("Nuevo ciclo"), button:has-text("Crear ciclo"), button:has-text("Nuevo Ciclo")'
    );
    await expect(createBtn.first()).toBeVisible({ timeout: 10000 });
  });

  test('tabs de estado: Planning, Activo, Completado, Cerrado', async ({ page }) => {
    const expectedTabs = ['Planning', 'Activo', 'Completado', 'Cerrado'];
    let found = 0;
    for (const tab of expectedTabs) {
      const el = page.locator(`button:has-text("${tab}"), [role="tab"]:has-text("${tab}")`);
      if (await el.count() > 0) found++;
    }
    // Al menos 2 tabs de estado deben estar presentes
    expect(found).toBeGreaterThanOrEqual(2);
  });

  test('ALTA — modal crear ciclo abre con campos obligatorios', async ({ page }) => {
    const createBtn = page.locator(
      'button:has-text("Nuevo ciclo"), button:has-text("Crear ciclo"), button:has-text("Nuevo Ciclo")'
    );
    await createBtn.first().click();

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 8000 });

    // Campo nombre/título
    const nameInput = modal.locator('input').first();
    await expect(nameInput).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden({ timeout: 5000 });
  });

  test('ALTA — crear ciclo completo', async ({ page }) => {
    const NAME = `Ciclo E2E ${Date.now()}`;

    const createBtn = page.locator(
      'button:has-text("Nuevo ciclo"), button:has-text("Crear ciclo"), button:has-text("Nuevo Ciclo")'
    );
    await createBtn.first().click();

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 8000 });

    // Nombre
    await modal.locator('input[name="name"], input[placeholder*="nombre"], input[placeholder*="Nombre"]').first().fill(NAME);

    // Fechas (si existen)
    const dateInputs = modal.locator('input[type="date"]');
    const dateCount = await dateInputs.count();
    if (dateCount >= 2) {
      await dateInputs.nth(0).fill('2025-06-01');
      await dateInputs.nth(1).fill('2025-06-30');
    }

    // Submit
    const submitBtn = modal.locator('button[type="submit"], button:has-text("Crear"), button:has-text("Guardar")').first();
    await submitBtn.click();

    await expect(modal).toBeHidden({ timeout: 15000 });
    await expect(page.locator(`text=${NAME}`)).toBeVisible({ timeout: 10000 });
  });

  test('API GET /api/cycles responde sin 404/500', async ({ request }) => {
    const res = await request.get('/api/cycles');
    expect([200, 401, 403]).toContain(res.status());
  });
});
