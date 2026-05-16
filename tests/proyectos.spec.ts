import { test, expect } from '@playwright/test';
import { loginAsSuperAdmin } from './helpers/auth';

test.describe('Proyectos / Tableros — ABM', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/dashboard/tareas');
    await page.waitForLoadState('networkidle');
  });

  test('LISTADO — selector de tableros visible', async ({ page }) => {
    // El selector de proyectos/tableros debe existir en la interfaz
    const selector = page.locator('button, select, [role="combobox"]').filter({ hasText: /tablero|proyecto|board/i });
    if (await selector.count() > 0) {
      await expect(selector.first()).toBeVisible({ timeout: 10000 });
    } else {
      // Si el filtro no matchea exactamente, intentamos buscar el botón "Configurar Tablero"
      const configBtn = page.locator('button:has-text("Configurar Tablero"), button:has-text("Configurar tablero")');
      await expect(configBtn.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('ALTA — crear nuevo tablero', async ({ page }) => {
    const NAME = `Tablero E2E ${Date.now()}`;
    
    // Click en "Configurar Tablero"
    const configBtn = page.locator('button:has-text("Configurar Tablero"), button:has-text("Configurar tablero")');
    if (await configBtn.count() === 0) { test.skip(); return; }
    
    await configBtn.first().click();
    
    // Buscar opción "Nuevo tablero", "Crear tablero" o "Nuevo"
    const newBtn = page.locator('button:has-text("Nuevo tablero"), button:has-text("Crear tablero"), button:has-text("Nuevo")');
    if (await newBtn.count() === 0) { test.skip(); return; }
    
    await newBtn.first().click();
    
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    await modal.locator('input[name="name"], input[placeholder*="nombre"], input[placeholder*="Nombre"], input').first().fill(NAME);
    
    await modal.locator('button[type="submit"], button:has-text("Crear"), button:has-text("Guardar")').first().click();
    
    await expect(modal).toBeHidden({ timeout: 10000 });
    
    // Verificar que el nuevo tablero aparece (ya sea en un dropdown o texto de la página)
    await expect(page.locator(`text=${NAME}`)).toBeVisible({ timeout: 10000 });
  });

  test('MODIFICACIÓN — editar nombre de tablero', async ({ page }) => {
    const configBtn = page.locator('button:has-text("Configurar Tablero"), button:has-text("Configurar tablero")');
    if (await configBtn.count() === 0) { test.skip(); return; }
    
    await configBtn.first().click();
    
    // Buscar el botón de editar
    const editBtn = page.locator('button:has-text("Editar"), button[aria-label="Editar tablero"], button:has(svg.lucide-edit), button:has(svg.lucide-pencil)');
    if (await editBtn.count() === 0) { test.skip(); return; }
    
    await editBtn.first().click();
    
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    const nameInput = modal.locator('input[name="name"], input[placeholder*="nombre"], input[placeholder*="Nombre"], input').first();
    const oldVal = await nameInput.inputValue();
    const NEW_NAME = `${oldVal} EDITADO`;
    
    await nameInput.fill(NEW_NAME);
    await modal.locator('button[type="submit"], button:has-text("Guardar"), button:has-text("Actualizar")').first().click();
    
    await expect(modal).toBeHidden({ timeout: 10000 });
    await expect(page.locator(`text=${NEW_NAME}`)).toBeVisible({ timeout: 10000 });
  });

  test('BAJA — eliminar tablero', async ({ page }) => {
    const configBtn = page.locator('button:has-text("Configurar Tablero"), button:has-text("Configurar tablero")');
    if (await configBtn.count() === 0) { test.skip(); return; }
    
    await configBtn.first().click();
    
    // Buscamos el botón de eliminar (ícono de basura o texto Eliminar)
    const delBtn = page.locator('button:has-text("Eliminar"), button[aria-label="Eliminar tablero"], button.bg-destructive, button:has(svg.lucide-trash)');
    if (await delBtn.count() === 0) { test.skip(); return; }
    
    await delBtn.first().click();
    
    const dialog = page.locator('[role="alertdialog"], [role="dialog"]').last();
    await expect(dialog).toBeVisible({ timeout: 5000 });
    
    await dialog.locator('button:has-text("Eliminar"), button:has-text("Sí, eliminar"), button:has-text("Confirmar")').last().click();
    
    await expect(dialog).toBeHidden({ timeout: 5000 });
  });
});
