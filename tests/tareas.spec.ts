import { test, expect } from '@playwright/test';
import { loginAsSuperAdmin } from './helpers/auth';

test.describe('Gestión de Tareas — Kanban', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/dashboard/tareas');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=Cargando tareas...', { state: 'hidden', timeout: 15000 }).catch(() => {});
  });

  test('kanban board carga — columna "Por hacer" visible', async ({ page }) => {
    await expect(page.locator('text=Por hacer')).toBeVisible({ timeout: 15000 });
  });

  test('al menos 3 columnas del kanban presentes', async ({ page }) => {
    const columnNames = ['Por hacer', 'En progreso', 'Completada', 'Backlog', 'Bloqueado', 'En revisión'];
    let found = 0;
    for (const name of columnNames) {
      if (await page.locator(`text=${name}`).count() > 0) found++;
    }
    expect(found).toBeGreaterThanOrEqual(3);
  });

  test('input de búsqueda filtra tareas', async ({ page }) => {
    // Usar el input del kanban (no el del header)
    const searchInput = page.locator('input[placeholder="Buscar tareas..."]');
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    await searchInput.fill('xyz-test-busqueda-inexistente-abc');
    await page.waitForTimeout(600);
    // Columnas deben mostrar "Sin tareas" o estar vacías
    const sinTareas = page.locator('text=Sin tareas');
    await expect(sinTareas.first()).toBeVisible({ timeout: 5000 });
    await searchInput.clear();
  });

  test('crear tarea nueva aparece en el board', async ({ page }) => {
    const TITLE = `E2E Tarea ${Date.now()}`;

    // Botón "Nueva tarea" en esquina superior derecha
    await page.locator('button:has-text("Nueva tarea")').click();

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 8000 });

    // Título
    const titleInput = modal.locator('input[placeholder*="título"], input[placeholder*="Título"], input[name="title"]').first();
    await titleInput.fill(TITLE);
    await expect(titleInput).toHaveValue(TITLE);

    // Submit
    const submitBtn = modal.locator('button[type="submit"]').filter({ hasText: /Crear/ });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();
    
    await expect(modal).toBeHidden({ timeout: 15000 });

    // Tarea aparece en el board. Buscamos el texto exacto.
    // Usamos retry para manejar hidratación o delay en el refresh de React Query
    const card = page.getByText(TITLE, { exact: true });
    await expect(card.first()).toBeVisible({ timeout: 20000 });
    await card.first().scrollIntoViewIfNeeded();
  });

  test('modal detalle abre al click en tarea existente', async ({ page }) => {
    // Esperar que carguen las tareas
    await expect(page.locator('text=Por hacer')).toBeVisible({ timeout: 15000 });

    // Buscar cualquier card de tarea (tienen clase específica o data-testid)
    const cards = page.locator('[data-testid="kanban-card"], .group.cursor-pointer, [class*="rounded-lg"][class*="border"]').filter({ hasText: /\w/ });
    const count = await cards.count();

    if (count === 0) { test.skip(); return; }

    await cards.first().click();
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 8000 });
    
    // Probar edición de título
    await modal.locator('button:has-text("Editar")').click();
    const titleInput = modal.locator('input[type="text"]').first();
    const oldTitle = await titleInput.inputValue();
    const NEW_TITLE = `${oldTitle} MOD`;
    await titleInput.fill(NEW_TITLE);
    await modal.locator('button:has-text("Guardar")').click();
    await expect(modal.locator('button:has-text("Guardar")')).toBeHidden();
    
    // Probar cambio de estado
    const statusSelect = modal.locator('select').first();
    await statusSelect.selectOption('in_progress');
    await page.waitForTimeout(1000); // Esperar mutación

    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden({ timeout: 5000 });
    
    // Verificar que aparece en la columna En Progreso (opcional si hay tiempo)
    await expect(page.locator('[data-testid="kanban-card"], .group.cursor-pointer').filter({ hasText: NEW_TITLE })).toBeVisible();
  });

  test('eliminar tarea desde el modal', async ({ page }) => {
    await expect(page.locator('text=Por hacer')).toBeVisible({ timeout: 15000 });
    const cards = page.locator('[data-testid="kanban-card"], .group.cursor-pointer, [class*="rounded-lg"][class*="border"]').filter({ hasText: /\w/ });
    if (await cards.count() === 0) { test.skip(); return; }

    const taskTitle = await cards.first().innerText();
    await cards.first().click();
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 8000 });

    // Click en botón basura (destructive)
    await modal.locator('button.bg-destructive, button:has(svg.lucide-trash)').click();
    
    // ConfirmDialog
    const confirmDialog = page.locator('[role="alertdialog"], [role="dialog"]').last();
    await expect(confirmDialog).toBeVisible({ timeout: 5000 });
    await confirmDialog.locator('button:has-text("Eliminar")').click();

    await expect(confirmDialog).toBeHidden();
    await expect(modal).toBeHidden();
    
    // Verificar que ya no está (puede tardar un poco en actualizar)
    await expect(page.locator(`text=${taskTitle}`)).toBeHidden({ timeout: 10000 });
  });

  test('botón "Configurar Tablero" existe', async ({ page }) => {
    await expect(page.locator('button:has-text("Configurar Tablero")')).toBeVisible({ timeout: 10000 });
  });

  test('botón FAB "+" existe para crear tarea rápida', async ({ page }) => {
    // FAB en esquina inferior derecha
    const fab = page.locator('button.fixed.bottom-10, button[class*="fixed"][class*="rounded-full"]');
    await expect(fab.first()).toBeVisible({ timeout: 5000 });
  });
});
