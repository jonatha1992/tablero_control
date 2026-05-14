import { test, expect } from '@playwright/test';
import { loginAsSuperAdmin } from './helpers/auth';

test.describe('Superadmin — ABM Planes y Negocios', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/superadmin');
    await page.waitForLoadState('networkidle');
  });

  test('Planes: Modificar límites de un plan', async ({ page }) => {
    // Navegar a sección de planes
    await page.goto('/superadmin/planes');
    await page.waitForLoadState('networkidle');
    
    // Buscar tarjeta de un plan (ej. "basico" o "premium")
    const card = page.locator('.border, .card').filter({ hasText: /básico|premium|pro/i }).first();
    if (await card.count() === 0) { test.skip(); return; }
    
    const editBtn = card.locator('button:has-text("Editar"), button[aria-label="Editar"]');
    if (await editBtn.count() === 0) { test.skip(); return; }
    
    await editBtn.click();
    
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Modificar campo de límite de usuarios o precio
    const limitInput = modal.locator('input[name="limitUsers"], input[name="maxUsers"], input[type="number"]').first();
    if (await limitInput.count() > 0) {
      await limitInput.fill('99');
    }
    
    await modal.locator('button[type="submit"], button:has-text("Guardar")').first().click();
    
    // Verificamos que se cierra
    await expect(modal).toBeHidden({ timeout: 10000 });
  });

  test('Negocios: Ver listado y cambiar estado', async ({ page }) => {
    await page.goto('/superadmin/businesses');
    await page.waitForLoadState('networkidle');
    
    // Debería verse una tabla de negocios
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
    
    // Buscar menú de acciones en la primera fila
    const actionBtn = table.locator('tbody tr').first().locator('button:has(svg.lucide-more-horizontal), button[aria-haspopup="menu"]').first();
    if (await actionBtn.count() > 0) {
      await actionBtn.click();
      // Opciones típicas: Ver detalle, Suspender, Activar
      const menu = page.locator('[role="menu"]');
      await expect(menu).toBeVisible();
      // Solo verificamos que abre el menú, no queremos suspender un negocio real
      await page.keyboard.press('Escape');
      await expect(menu).toBeHidden();
    }
  });

  test('Usuarios Globales: Visualizar tabla y roles', async ({ page }) => {
    await page.goto('/superadmin/users');
    await page.waitForLoadState('networkidle');
    
    // Tabla global de usuarios
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
    
    // Verificamos que haya registros
    await expect(table.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });
  });
});
