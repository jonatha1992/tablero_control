const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'tecnofusion.it@gmail.com');
  await page.fill('input[type="password"]', 'TecnoFusion2024!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|superadmin)/, { timeout: 15000 });

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

  await page.goto('http://localhost:3000/dashboard/tareas');
  await page.waitForTimeout(3000);

  const styles = await page.evaluate(() => {
    const getComputed = (el) => {
      if (!el) return null;
      const cs = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        class: el.className.slice(0, 200),
        clientHeight: el.clientHeight,
        scrollHeight: el.scrollHeight,
        offsetHeight: el.offsetHeight,
        height: cs.height,
        overflow: cs.overflow,
        overflowY: cs.overflowY,
        display: cs.display,
        flexDirection: cs.flexDirection,
      };
    };

    const allDivs = Array.from(document.querySelectorAll('div'));
    const pageRoot = allDivs.find(d => d.className === 'flex flex-col h-full overflow-hidden');
    const viewContainer = pageRoot?.querySelector('.flex-1.min-h-0.overflow-hidden');
    const kanbanRoot = viewContainer?.querySelector('[class*="flex flex-col flex-1 min-h-0 overflow-hidden w-full"]');
    const columnsContainer = kanbanRoot?.querySelector('[class*="flex gap-4 h-full overflow-x-auto"]');
    const firstColumn = columnsContainer?.firstElementChild;
    const scrollArea = firstColumn?.querySelector('.overflow-y-auto');

    return {
      pageRoot: getComputed(pageRoot),
      viewContainer: getComputed(viewContainer),
      kanbanRoot: getComputed(kanbanRoot),
      columnsContainer: getComputed(columnsContainer),
      firstColumn: getComputed(firstColumn),
      scrollArea: getComputed(scrollArea),
    };
  });

  console.log(JSON.stringify(styles, null, 2));
  await browser.close();
})();
