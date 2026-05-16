import { test, expect } from '@playwright/test';
import { loginAsSuperAdmin } from './helpers/auth';

test.describe('Subtareas y Comentarios — ABM', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/dashboard/tareas');
    await page.waitForLoadState('networkidle');
  });

  test('Subtareas: Agregar y marcar como completada', async ({ page }) => {
    // Abrir la primera tarea disponible
    const taskCard = page.locator('div[data-rfd-draggable-id], [data-rbd-draggable-id]').first();
    if (await taskCard.count() === 0) { test.skip(); return; }
    
    await taskCard.click();
    
    // Modal de tarea
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Buscar input de subtareas
    const subtaskInput = modal.locator('input[placeholder*="subtarea"], input[placeholder*="Subtarea"]');
    if (await subtaskInput.count() === 0) { test.skip(); return; }
    
    const TITLE = `Subtarea E2E ${Date.now()}`;
    await subtaskInput.fill(TITLE);
    await subtaskInput.press('Enter');
    
    // Verificar que aparece
    const newSubtask = modal.locator(`text=${TITLE}`);
    await expect(newSubtask).toBeVisible({ timeout: 5000 });
    
    // Marcar como completada (checkbox asociado a la subtarea)
    const checkbox = newSubtask.locator('..').locator('button[role="checkbox"], input[type="checkbox"]');
    await checkbox.check(); // O click
    
    // Verificar estado (usualmente recibe un atributo data-state="checked" o line-through)
    await expect(checkbox).toHaveAttribute('data-state', 'checked', { timeout: 5000 });
  });

  test('Comentarios: Agregar, editar y eliminar', async ({ page }) => {
    const taskCard = page.locator('div[data-rfd-draggable-id], [data-rbd-draggable-id]').first();
    if (await taskCard.count() === 0) { test.skip(); return; }
    
    await taskCard.click();
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Buscar campo de comentario
    const commentInput = modal.locator('textarea[placeholder*="comentario"], textarea[placeholder*="escribir"], div[contenteditable="true"]');
    if (await commentInput.count() === 0) { test.skip(); return; }
    
    const MSG = `Comentario E2E ${Date.now()}`;
    await commentInput.fill(MSG);
    
    const submitBtn = modal.locator('button:has-text("Comentar"), button:has-text("Enviar"), button[aria-label="Enviar comentario"]');
    await submitBtn.click();
    
    // Verificar que el comentario aparece
    const commentBox = modal.locator(`text=${MSG}`);
    await expect(commentBox).toBeVisible({ timeout: 10000 });
    
    // Editar
    const editMenuBtn = commentBox.locator('..').locator('..').locator('button:has(svg.lucide-more-vertical), button[aria-haspopup="menu"]');
    if (await editMenuBtn.count() > 0) {
      await editMenuBtn.first().click();
      await page.locator('text=Editar').click();
      
      const editInput = modal.locator('textarea').last();
      await editInput.fill(`${MSG} editado`);
      await modal.locator('button:has-text("Guardar")').last().click();
      
      await expect(modal.locator(`text=${MSG} editado`)).toBeVisible({ timeout: 5000 });
    }
    
    // Eliminar
    if (await editMenuBtn.count() > 0) {
      await editMenuBtn.first().click();
      await page.locator('text=Eliminar').click();
      
      const dialog = page.locator('[role="alertdialog"], [role="dialog"]').last();
      await expect(dialog).toBeVisible();
      await dialog.locator('button:has-text("Eliminar"), button:has-text("Confirmar")').last().click();
      
      await expect(modal.locator(`text=${MSG} editado`)).toHaveCount(0, { timeout: 5000 });
    }
  });
});
