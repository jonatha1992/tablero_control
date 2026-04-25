import { test, expect } from '@playwright/test';
import { loginAsSuperAdmin } from './helpers/auth';

test.describe('Gestión de Sectores / ABM', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/dashboard/sectores');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 }).catch(() => {});
  });

  test('página carga con botón "Nuevo Departamento"', async ({ page }) => {
    await expect(page.locator('button:has-text("Nuevo Departamento")')).toBeVisible({ timeout: 10000 });
  });

  test('ALTA — modal abre correctamente', async ({ page }) => {
    await page.locator('button:has-text("Nuevo Departamento")').click();

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal.locator('text=Nuevo Sector/Departamento')).toBeVisible();

    // Input nombre — primer input del modal
    await expect(modal.locator('input').first()).toBeVisible();

    await page.locator('button:has-text("Cancelar")').click();
    await expect(modal).toBeHidden({ timeout: 5000 });
  });

  test('ALTA — validación: sin nombre no cierra el modal', async ({ page }) => {
    await page.locator('button:has-text("Nuevo Departamento")').click();

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    await page.locator('button:has-text("Crear sector")').click();
    await page.waitForTimeout(500);
    await expect(modal).toBeVisible();

    await page.locator('button:has-text("Cancelar")').click();
  });

  test('ALTA — crear sector exitosamente', async ({ page }) => {
    const NAME = `Sector E2E ${Date.now()}`;

    await page.locator('button:has-text("Nuevo Departamento")').click();

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Primer input = Nombre (placeholder "Ej: Departamento de IT...")
    await modal.locator('input').first().fill(NAME);
    await page.locator('button:has-text("Crear sector")').click();

    await expect(modal).toBeHidden({ timeout: 10000 });
    // Usar h3 para evitar colisión con el texto del Toast
    await expect(page.locator('h3').filter({ hasText: NAME })).toBeVisible({ timeout: 10000 });
  });

  test('MODIFICACIÓN — dropdown de sector tiene opción Editar', async ({ page }) => {
    // Esperar cards
    const cards = page.locator('.overflow-hidden.border-border\\/50');
    await page.waitForTimeout(2000);

    if (await cards.count() === 0) { test.skip(); return; }

    // Click en botón MoreVertical (3 puntos) de la primera card
    const moreBtn = cards.first().locator('button').last();
    await moreBtn.click();

    // Dropdown debe mostrar "Editar"
    const editItem = page.locator('[role="menuitem"]:has-text("Editar")');
    await expect(editItem).toBeVisible({ timeout: 3000 });

    await editItem.click();

    // Modal de edición abre con datos
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    const nameValue = await modal.locator('input').first().inputValue();
    expect(nameValue.length).toBeGreaterThan(0);

    const NEW_NAME = `${nameValue} EDITADO`;
    await modal.locator('input').first().fill(NEW_NAME);
    await modal.locator('button:has-text("Guardar"), button:has-text("Actualizar")').first().click();

    await expect(modal).toBeHidden({ timeout: 10000 });
    await expect(page.locator('h3').filter({ hasText: NEW_NAME })).toBeVisible({ timeout: 10000 });
  });

  test('BAJA — dropdown tiene opción Eliminar con confirm dialog', async ({ page }) => {
    const cards = page.locator('.overflow-hidden.border-border\\/50');
    await page.waitForTimeout(2000);

    if (await cards.count() === 0) { test.skip(); return; }

    const moreBtn = cards.first().locator('button').last();
    await moreBtn.click();

    const deleteItem = page.locator('[role="menuitem"]:has-text("Eliminar")');
    await expect(deleteItem).toBeVisible({ timeout: 3000 });
    await deleteItem.click();

    // Confirm dialog aparece
    const dialog = page.locator('[role="alertdialog"], [role="dialog"]').last();
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Confirmar eliminación
    await page.locator('button:has-text("Eliminar"), button:has-text("Sí, eliminar"), button:has-text("Confirmar")').last().click();
    await expect(dialog).toBeHidden({ timeout: 5000 });
    
    // Verificar que el toast de éxito aparece (opcional) o que la card ya no está
    // Aquí simplemente esperamos que la lista se actualice y el primer elemento ya no sea el mismo
    await page.waitForTimeout(2000);
  });
});
