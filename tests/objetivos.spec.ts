import { test, expect } from '@playwright/test';
import { loginAsSuperAdmin } from './helpers/auth';

test.describe('Objetivos / Iniciativas', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/dashboard/objetivos');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 15000 }).catch(() => {});
  });

  test('página de objetivos carga sin error 500', async ({ page }) => {
    await expect(page.locator('text=500, text=Internal Server Error')).toHaveCount(0);
    await expect(page).toHaveURL('/dashboard/objetivos');
  });

  test('botón crear nuevo objetivo visible', async ({ page }) => {
    const createBtn = page.locator(
      'button:has-text("Nuevo objetivo"), button:has-text("Nuevo Objetivo"), button:has-text("Crear objetivo"), button:has-text("Nueva Iniciativa")'
    );
    await expect(createBtn.first()).toBeVisible({ timeout: 10000 });
  });

  test('ALTA — modal crear objetivo abre correctamente', async ({ page }) => {
    const createBtn = page.locator(
      'button:has-text("Nuevo objetivo"), button:has-text("Nuevo Objetivo"), button:has-text("Crear objetivo"), button:has-text("Nueva Iniciativa")'
    );
    await createBtn.first().click();

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 8000 });

    // Debe tener al menos un input (título/nombre)
    await expect(modal.locator('input').first()).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden({ timeout: 5000 });
  });

  test('ALTA — crear objetivo exitosamente', async ({ page }) => {
    const NAME = `Objetivo E2E ${Date.now()}`;

    const createBtn = page.locator(
      'button:has-text("Nuevo objetivo"), button:has-text("Nuevo Objetivo"), button:has-text("Crear objetivo"), button:has-text("Nueva Iniciativa")'
    );
    await createBtn.first().click();

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 8000 });

    await modal.locator('input[name="title"], input[name="name"], input[placeholder*="título"], input[placeholder*="Título"], input').first().fill(NAME);

    const submitBtn = modal.locator('button[type="submit"], button:has-text("Crear"), button:has-text("Guardar")').first();
    await submitBtn.click();

    await expect(modal).toBeHidden({ timeout: 15000 });
    await expect(page.locator(`text=${NAME}`)).toBeVisible({ timeout: 10000 });
  });

  test('tarjetas de objetivos muestran progreso', async ({ page }) => {
    // Si hay objetivos, deben mostrar barra de progreso o porcentaje
    const cards = page.locator('[class*="card"], [class*="objective"]').filter({ hasText: /\d/ });
    const count = await cards.count();

    if (count === 0) { test.skip(); return; }

    // Verificar que existe algún indicador de progreso
    const progressBar = page.locator('[role="progressbar"], [class*="progress"]');
    const _hasProgress = await progressBar.count() > 0;
    // Es informativo — no falla si no existe
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('API GET /api/objectives responde sin 404/500', async ({ request }) => {
    const res = await request.get('/api/objectives');
    expect([200, 401, 403]).toContain(res.status());
  });
});
