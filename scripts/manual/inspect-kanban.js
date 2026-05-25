/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  await page.route('**/api/tasks?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        Array.from({ length: 20 }, (_, i) => ({
          id: `t${i}`,
          title: `Tarea de prueba ${i + 1} con título largo para ocupar espacio`,
          status: i < 12 ? 'todo' : 'in_progress',
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
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[{"id":"p1","name":"Proyecto Demo","_count":{"tasks":20}}]' });
  });

  await page.route('**/api/objectives?**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await page.goto('http://localhost:3000/dashboard/tareas');
  await page.waitForTimeout(3000);

  const info = await page.evaluate(() => {
    const rect = (el) => el ? { tag: el.tagName, class: el.className, height: el.getBoundingClientRect().height, clientHeight: el.clientHeight, scrollHeight: el.scrollHeight, offsetHeight: el.offsetHeight } : null;

    const main = document.querySelector('main');
    const pageRoot = main?.firstElementChild;
    const viewContainer = pageRoot?.children[1];
    const boardRoot = viewContainer?.firstElementChild;
    const toolbar = boardRoot?.children[0];
    const boardWrapper = boardRoot?.children[1];
    const columnsContainer = boardWrapper?.firstElementChild;
    const firstColumn = columnsContainer?.firstElementChild;
    const columnHeader = firstColumn?.children[0];
    const scrollArea = firstColumn?.children[1];
    const taskList = scrollArea?.firstElementChild;

    return {
      main: rect(main),
      pageRoot: rect(pageRoot),
      viewContainer: rect(viewContainer),
      boardRoot: rect(boardRoot),
      toolbar: rect(toolbar),
      boardWrapper: rect(boardWrapper),
      columnsContainer: rect(columnsContainer),
      firstColumn: rect(firstColumn),
      columnHeader: rect(columnHeader),
      scrollArea: rect(scrollArea),
      taskList: rect(taskList),
    };
  });

  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
