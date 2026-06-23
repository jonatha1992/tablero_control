import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const patchTimings = [];
page.on('request', (req) => {
  if (req.url().includes('/api/tasks/') && req.method() === 'PATCH') {
    req._start = Date.now();
  }
});
page.on('requestfinished', async (req) => {
  if (req.url().includes('/api/tasks/') && req.method() === 'PATCH' && req._start) {
    patchTimings.push({ ms: Date.now() - req._start, url: req.url() });
  }
});
page.on('console', (msg) => {
  if (msg.type() === 'error') console.log('[console error]', msg.text());
});

console.log('1) Login...');
await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
await page.fill('#login', 'demo@tablerocontrol.test');
await page.fill('#password', 'DemoTablero2026!');
await page.click('button[type="submit"]');
await page.waitForURL('**/dashboard**', { timeout: 15000 });
console.log('   OK');

console.log('2) Abriendo tarea "Tarea para hoy — demo"...');
await page.goto('http://localhost:3000/dashboard/tareas', { waitUntil: 'networkidle' });
await page.locator('h4:has-text("Tarea para hoy — demo")').dblclick();
await page.waitForTimeout(1000);
await page.screenshot({ path: 'scripts/manual/artifacts/02-task-detail.png', fullPage: true });

console.log('3) Agregando 6 items al checklist...');
for (let i = 1; i <= 6; i++) {
  await page.getByText('Agregar ítem', { exact: false }).click();
  const input = page.locator('input[placeholder="Nuevo ítem..."]');
  await input.waitFor({ state: 'visible' });
  await input.fill(`Item de prueba ${i}`);
  await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/tasks/') && r.request().method() === 'PATCH'),
    page.keyboard.press('Enter'),
  ]);
  await page.waitForTimeout(200);
}
await page.screenshot({ path: 'scripts/manual/artifacts/03-checklist-filled.png', fullPage: true });

console.log('4) Tildando todos los checkboxes RAPIDO en secuencia (sin esperar)...');
const checkboxes = page.locator('input[type="checkbox"]');
const checkboxCount = await checkboxes.count();
console.log('   checkboxes encontrados:', checkboxCount);

const clickStart = Date.now();
for (let i = 0; i < checkboxCount; i++) {
  await checkboxes.nth(i).click({ force: true, timeout: 5000 });
}
const clickEnd = Date.now();
console.log(`   Tiempo total para disparar ${checkboxCount} clicks: ${clickEnd - clickStart}ms`);

// esperar a que terminen las requests pendientes
await page.waitForTimeout(3000);
await page.screenshot({ path: 'scripts/manual/artifacts/04-checklist-toggled.png', fullPage: true });

console.log('--- PATCH timings ---');
patchTimings.forEach((t, i) => console.log(`  PATCH #${i + 1}: ${t.ms}ms`));
console.log('Total PATCH requests:', patchTimings.length);
console.log('Promedio:', patchTimings.length ? (patchTimings.reduce((a, b) => a + b.ms, 0) / patchTimings.length).toFixed(1) + 'ms' : 'n/a');

await browser.close();
console.log('DONE');
