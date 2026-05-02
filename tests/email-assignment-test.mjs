import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const EMAIL = 'opercrev@gmail.com';    // usuario admin del negocio
const PASS  = '';                       // completar si es necesario

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();

  const logs = [];
  page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`));

  try {
    // ── 1. Login ────────────────────────────────────────────────────────────
    console.log('→ navegando a /login');
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'tests/screenshots/01-login.png' });

    await page.fill('input[type="email"]', EMAIL);
    if (PASS) await page.fill('input[type="password"]', PASS);
    console.log('⚠ Completá la contraseña en el browser y presioná Sign in');

    // esperar redirect a dashboard
    await page.waitForURL('**/dashboard**', { timeout: 60_000 });
    console.log('✓ Login OK');
    await page.screenshot({ path: 'tests/screenshots/02-dashboard.png' });

    // ── 2. Ir a Tareas ──────────────────────────────────────────────────────
    await page.goto(`${BASE}/dashboard/tareas`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'tests/screenshots/03-tareas.png' });
    console.log('✓ Página de tareas cargada');

    // ── 3. Abrir primera tarea ──────────────────────────────────────────────
    const card = page.locator('[class*="kanban-card"], .group.relative.rounded-lg').first();
    const cardCount = await card.count();
    if (cardCount === 0) {
      console.log('✗ No hay tarjetas kanban visibles');
    } else {
      await card.dblclick();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      await page.screenshot({ path: 'tests/screenshots/04-task-modal.png' });
      console.log('✓ Modal de tarea abierto');

      // ── 4. Click en Editar ────────────────────────────────────────────────
      const editBtn = page.getByRole('button', { name: 'Editar' });
      if (await editBtn.count() > 0) {
        await editBtn.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'tests/screenshots/05-edit-mode.png' });
        console.log('✓ Modo edición activo');

        // ── 5. Verificar campos Sector y Asignados ────────────────────────
        const sectorSelect = page.locator('select').filter({ hasText: /sin sector/i }).first();
        const sectorVisible = await sectorSelect.isVisible().catch(() => false);
        console.log(sectorVisible ? '✓ Campo Sector visible' : '✗ Campo Sector NO visible');

        const assigneeCheckbox = page.locator('input[type="checkbox"]').first();
        const cbVisible = await assigneeCheckbox.isVisible().catch(() => false);
        console.log(cbVisible ? '✓ Checkboxes de asignados visibles' : '✗ Checkboxes de asignados NO visibles');

        // ── 6. Marcar primer asignado y guardar ───────────────────────────
        const checkboxes = page.locator('label').filter({ has: page.locator('input[type="checkbox"]') });
        const cbCount = await checkboxes.count();
        console.log(`→ ${cbCount} miembros disponibles para asignar`);

        if (cbCount > 0) {
          await checkboxes.first().click();
          await page.waitForTimeout(300);
          const saveBtn = page.getByRole('button', { name: /guardar/i });
          await saveBtn.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: 'tests/screenshots/06-after-save.png' });
          console.log('✓ Guardado con asignado — revisar consola del servidor para [mail] logs');
        } else {
          console.log('⚠ No hay miembros para asignar (pueden no existir en este negocio)');
        }

        await page.getByRole('button', { name: /cancelar/i }).click().catch(() => {});
      } else {
        console.log('✗ Botón Editar no encontrado');
      }
    }

    // ── 7. Probar "Configurar Tablero" ──────────────────────────────────────
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    const configBtn = page.getByRole('button', { name: /configurar tablero/i });
    if (await configBtn.count() > 0) {
      await configBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'tests/screenshots/07-config-dropdown.png' });
      const dropdownVisible = await page.locator('[role="menu"]').isVisible().catch(() => false);
      console.log(dropdownVisible ? '✓ Dropdown Configurar Tablero visible' : '✗ Dropdown Configurar Tablero NO visible');
    }

    console.log('\n── Logs del browser ──');
    logs.filter(l => l.includes('error') || l.includes('warn')).forEach(l => console.log(l));

  } catch (err) {
    console.error('ERROR:', err.message);
    await page.screenshot({ path: 'tests/screenshots/error.png' });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
})();
