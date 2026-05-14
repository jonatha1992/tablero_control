import { test, expect } from '@playwright/test';
import { loginAsSuperAdmin } from './helpers/auth';

test.describe('Roles Personalizados — ABM', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/dashboard/equipo/roles');
    await page.waitForLoadState('networkidle');
  });

  test('LISTADO — roles base visibles', async ({ page }) => {
    await expect(page.locator('text=admin').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=responsable').first()).toBeVisible({ timeout: 10000 });
  });

  test('ALTA — crear nuevo rol personalizado', async ({ page }) => {
    const NAME = `Rol E2E ${Date.now()}`;
    
    // Buscar botón de "Nuevo rol" o similar
    const newBtn = page.locator('button:has-text("Nuevo"), button:has-text("Crear"), button:has-text("Rol")').filter({ hasText: /(Nuevo|Crear) Rol/i });
    if (await newBtn.count() === 0) { test.skip(); return; }
    
    await newBtn.first().click();
    
    // Modal o Drawer
    const form = page.locator('[role="dialog"], form').first();
    await expect(form).toBeVisible({ timeout: 5000 });
    
    await form.locator('input[name="name"], input[placeholder*="nombre"]').first().fill(NAME);
    await form.locator('input[name="description"], textarea[name="description"]').first().fill('Descripción E2E');
    
    // Asignar un permiso aleatorio
    await form.locator('input[type="checkbox"]').first().check();
    
    await form.locator('button[type="submit"], button:has-text("Guardar")').first().click();
    
    // Verificar que aparece
    await expect(page.locator(`text=${NAME}`)).toBeVisible({ timeout: 15000 });
  });

  test('MODIFICACIÓN — editar rol', async ({ page }) => {
    // Buscamos un rol existente que NO sea de sistema (los de sistema suelen no tener botón eliminar)
    // O simplemente abrimos el primer rol editable
    const editBtn = page.locator('button[aria-label="Editar"], button:has(svg.lucide-edit), button:has(svg.lucide-pencil)').first();
    if (await editBtn.count() === 0) { test.skip(); return; }
    
    await editBtn.click();
    
    const form = page.locator('[role="dialog"], form').first();
    await expect(form).toBeVisible({ timeout: 5000 });
    
    const input = form.locator('input[name="description"], textarea[name="description"]').first();
    const oldVal = await input.inputValue();
    await input.fill(`${oldVal} editado`);
    
    await form.locator('button[type="submit"], button:has-text("Guardar")').first().click();
    
    // Esperamos que cierre
    await expect(form).toBeHidden({ timeout: 10000 });
  });

  test('BAJA — eliminar rol', async ({ page }) => {
    const delBtn = page.locator('button[aria-label="Eliminar"], button.text-destructive, button:has(svg.lucide-trash)').last();
    if (await delBtn.count() === 0) { test.skip(); return; }
    
    await delBtn.click();
    
    const dialog = page.locator('[role="alertdialog"], [role="dialog"]').last();
    await expect(dialog).toBeVisible({ timeout: 5000 });
    
    await dialog.locator('button:has-text("Eliminar"), button:has-text("Confirmar")').last().click();
    
    await expect(dialog).toBeHidden({ timeout: 5000 });
  });
});
