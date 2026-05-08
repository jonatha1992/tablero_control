import { test, expect } from '@playwright/test';

test('kanban columns have independent scroll and top bars stay fixed', async ({ page }) => {
  // Login manual
  await page.goto('/login');
  await page.waitForSelector('input#email', { state: 'visible', timeout: 10000 });
  await page.fill('input#email', 'tecnofusion.it@gmail.com');
  await page.fill('input#password', 'TecnoFusion2024!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|superadmin)/, { timeout: 25000 });

  // Interceptar API de tareas con muchas tareas para forzar scroll en columna
  await page.route('**/api/tasks?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        Array.from({ length: 40 }, (_, i) => ({
          id: `t${i}`,
          title: `Tarea de prueba ${i + 1} con título largo para ocupar espacio`,
          status: i < 30 ? 'todo' : 'in_progress',
          priority: ['urgent', 'high', 'medium', 'low'][i % 4],
          startDate: null,
          dueDate: '2026-05-15T00:00:00.000Z',
          projectId: 'p1',
          objectiveId: null,
          assignees: [{ id: 'u1', name: 'Juan Pérez', email: 'juan@test.com' }],
          createdAt: '2026-04-20T00:00:00.000Z',
          locationId: null,
          customRoleIds: []
        }))
      )
    });
  });

  await page.route('**/api/projects?**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[{"id":"p1","name":"Proyecto Demo","_count":{"tasks":40}}]' });
  });

  await page.route('**/api/objectives?**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await page.goto('/dashboard/tareas');
  await page.waitForTimeout(3000);

  // Verificar que la primera columna tenga scroll
  const scrollInfo = await page.evaluate(() => {
    const scrollArea = document.querySelector('.overflow-y-auto') as HTMLElement;
    if (!scrollArea) return { scrollHeight: 0, clientHeight: 0, hasScroll: false };
    return {
      scrollHeight: scrollArea.scrollHeight,
      clientHeight: scrollArea.clientHeight,
      hasScroll: scrollArea.scrollHeight > scrollArea.clientHeight,
    };
  });

  console.log('Scroll info:', scrollInfo);
  expect(scrollInfo.hasScroll).toBe(true);

  // Screenshot inicial
  await page.screenshot({ path: 'screenshots-review/kanban-scroll-test-1.png', fullPage: false });

  // Scroll down inside the first column
  await page.evaluate(() => {
    const firstColumn = document.querySelector('.overflow-y-auto') as HTMLElement;
    if (firstColumn) firstColumn.scrollTop = firstColumn.scrollHeight;
  });
  await page.waitForTimeout(500);

  // Screenshot after scrolling column
  await page.screenshot({ path: 'screenshots-review/kanban-scroll-test-2.png', fullPage: false });

  // Verify the top bars are still visible (not scrolled away)
  const kanbanTab = page.locator('text=Kanban').first();
  await expect(kanbanTab).toBeVisible();
});
