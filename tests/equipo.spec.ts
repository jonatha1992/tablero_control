import { test, expect } from '@playwright/test';
import { loginAsSuperAdmin } from './helpers/auth';

test.describe('Gestión de Equipo', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/dashboard/equipo');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);
  });

  test('página de equipo carga', async ({ page }) => {
    // Placeholder puede decir "email" o "correo"
    const searchInput = page.getByPlaceholder(/nombre|email|correo/i);
    await expect(searchInput.first()).toBeVisible({ timeout: 10000 });
  });

  test('filtro "Todos" visible', async ({ page }) => {
    const todosBtn = page.locator(
      'button:has-text("Todos"), [role="tab"]:has-text("Todos")'
    );
    await expect(todosBtn.first()).toBeVisible({ timeout: 10000 });
  });

  test('filtros de roles visibles', async ({ page }) => {
    // Nombres de roles en español
    const roles = ['Admin', 'Administrador', 'Responsable', 'Miembro', 'Viewer', 'Visualizador'];
    let found = 0;
    for (const role of roles) {
      const el = page.locator(
        `button:has-text("${role}"), [role="tab"]:has-text("${role}")`
      );
      if (await el.count() > 0) found++;
    }
    expect(found).toBeGreaterThanOrEqual(2);
  });

  test('botón crear/invitar usuario abre modal', async ({ page }) => {
    // El botón puede llamarse "Invitar", "Nuevo miembro", "Crear usuario", etc.
    const actionBtn = page.locator(
      'button:has-text("Invitar"), button:has-text("Nuevo miembro"), button:has-text("Crear usuario"), button:has-text("Crear Usuario")'
    );
    await expect(actionBtn.first()).toBeVisible({ timeout: 10000 });
    await actionBtn.first().click();

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 8000 });

    // Debe tener campo de email o nombre
    const emailInput = modal.locator('input[type="email"], input[name="email"]');
    const nameInput = modal.locator('input[name="name"], input[placeholder*="nombre"], input[placeholder*="Nombre"]');
    const hasEmail = await emailInput.count() > 0;
    const hasName = await nameInput.count() > 0;
    expect(hasEmail || hasName).toBeTruthy();

    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden({ timeout: 5000 });
  });

  test('filtro de locales o selector presente en la página', async ({ page }) => {
    // Puede ser <select> o un dropdown con texto "Todos los locales" / "Todos los sectores"
    const locationFilter = page.locator(
      'select, [role="combobox"]',
    ).filter({ hasText: /local|sector|departamento/i });
    const dropdownText = page.locator('text=/Todos los locales|Todos los sectores/i');

    const hasSelect = await locationFilter.count() > 0;
    const hasText = await dropdownText.count() > 0;
    expect(hasSelect || hasText).toBeTruthy();
  });

  test('crear usuario nuevo — flujo completo', async ({ page }) => {
    const TEST_EMAIL = `test-${Date.now()}@example.com`;

    const actionBtn = page.locator(
      'button:has-text("Invitar"), button:has-text("Nuevo miembro"), button:has-text("Crear usuario"), button:has-text("Crear Usuario")'
    );
    await actionBtn.first().click();

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 8000 });

    // Llenar nombre si existe
    const nameInput = modal.locator('input[name="name"], input[placeholder*="nombre"], input[placeholder*="Nombre"]');
    if (await nameInput.count() > 0) await nameInput.first().fill('Test Usuario E2E');

    // Llenar email
    const emailInput = modal.locator('input[type="email"], input[name="email"]');
    if (await emailInput.count() > 0) await emailInput.first().fill(TEST_EMAIL);

    // Submit
    const submitBtn = modal.locator(
      'button[type="submit"], button:has-text("Crear"), button:has-text("Invitar"), button:has-text("Guardar")'
    ).first();
    await submitBtn.click();

    // Modal debe mostrar paso de éxito o cerrarse
    await expect(async () => {
      const modalVisible = await modal.isVisible();
      if (!modalVisible) return;
      const successText = modal.locator('text=/creado|Contraseña|Credenciales|éxito|exitoso/i');
      expect(await successText.count()).toBeGreaterThan(0);
    }).toPass({ timeout: 15000 });

    await page.keyboard.press('Escape');
  });

  test('sección de invitaciones visible (link de invitación)', async ({ page }) => {
    // Verificar que hay botón "Link de invitación" o sección similar
    const linkBtn = page.locator(
      'button:has-text("Link de invitación"), button:has-text("Generar link"), text=Links de invitación'
    );
    await expect(linkBtn.first()).toBeVisible({ timeout: 10000 });
  });
});
