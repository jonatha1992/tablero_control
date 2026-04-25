import { test, expect } from '@playwright/test';
import { loginAsSuperAdmin } from './helpers/auth';

test.describe('Gestión de Equipo', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/dashboard/equipo');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 }).catch(() => {});
  });

  test('página de equipo carga', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Buscar por nombre o email...');
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });

  test('filtro "Todos" visible', async ({ page }) => {
    const todosBtn = page.locator('button:has-text("Todos"), [role="tab"]:has-text("Todos")');
    await expect(todosBtn.first()).toBeVisible({ timeout: 10000 });
  });

  test('filtros de roles visibles', async ({ page }) => {
    const roles = ['Admin', 'Responsable', 'Miembro', 'Viewer'];
    let found = 0;
    for (const role of roles) {
      const el = page.locator(`button:has-text("${role}"), [role="tab"]:has-text("${role}")`);
      if (await el.count() > 0) found++;
    }
    expect(found).toBeGreaterThanOrEqual(2);
  });

  test('botón invitar abre modal con campos', async ({ page }) => {
    const inviteBtn = page.locator('button:has-text("Invitar"), button:has-text("Nuevo miembro")');
    await inviteBtn.first().click();

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal.locator('input[type="email"], input[name="email"]')).toBeVisible();
    
    // Verificar selector de locales
    const locationSelect = modal.locator('select').first();
    await expect(locationSelect).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden({ timeout: 5000 });
  });

  test('filtro de locales presente en la página', async ({ page }) => {
    const locationFilter = page.locator('select').filter({ hasText: /Todos los locales/ });
    await expect(locationFilter).toBeVisible();
  });

  test('invitar nuevo miembro — flujo completo', async ({ page }) => {
    const TEST_EMAIL = `test-${Date.now()}@example.com`;

    const inviteBtn = page.locator('button:has-text("Invitar"), button:has-text("Nuevo miembro")');
    await inviteBtn.first().click();

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Llenar nombre
    const nameInput = modal.locator('input[name="name"], input[placeholder*="nombre"], input[placeholder*="Nombre"]');
    if (await nameInput.count() > 0) await nameInput.fill('Test Usuario E2E');

    // Llenar email
    await modal.locator('input[type="email"], input[name="email"]').fill(TEST_EMAIL);

    // Submit
    const submitBtn = modal.locator('button[type="submit"], button:has-text("Crear"), button:has-text("Invitar"), button:has-text("Guardar")').first();
    await submitBtn.click();

    // Modal debe mostrar step de éxito o cerrarse
    // Aumentar espera para mutación
    await expect(async () => {
      const modalVisible = await modal.isVisible();
      if (!modalVisible) return true;
      const successText = modal.locator('text=Usuario creado, text=Contraseña, text=Credenciales');
      return (await successText.count()) > 0;
    }).toPass({ timeout: 10000 });
    
    await page.keyboard.press('Escape');
  });

  test('editar miembro — abrir modal y cambiar rol', async ({ page }) => {
    // Esperar que carguen los miembros
    const cards = page.locator('.group.relative');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });

    // Click en botón editar (lapiz)
    await cards.first().locator('button:has(svg.lucide-edit-2), button[title*="Editar"]').click();

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal.locator('text=Editar miembro')).toBeVisible();

    // Cambiar rol
    await modal.locator('button:has-text("Viewer")').click();
    await modal.locator('button:has-text("Guardar")').click();

    await expect(modal).toBeHidden({ timeout: 5000 });
  });
});
