import { test, expect } from '@playwright/test';
import { loginAsSuperAdmin } from './helpers/auth';

test.describe('Dashboard principal', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('dashboard carga con 4 KPI cards', async ({ page }) => {
    await expect(page.locator('text=Pendientes')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Finalizadas')).toBeVisible();
    await expect(page.locator('text=Bloqueadas')).toBeVisible();
    await expect(page.locator('text=Urgentes')).toBeVisible();
  });

  test('KPIs muestran números (no NaN ni undefined)', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const kpiNumbers = await page.locator('.text-3xl').allTextContents();
    for (const num of kpiNumbers) {
      expect(num).not.toContain('NaN');
      expect(num).not.toContain('undefined');
      expect(num.trim()).not.toBe('');
    }
  });

  test('sidebar con links de navegación', async ({ page }) => {
    const tareasLink = page.locator('a[href*="/dashboard/tareas"], a:has-text("Tareas")');
    await expect(tareasLink).toBeVisible({ timeout: 10000 });
  });

  test('no hay errores de consola críticos', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const critical = errors.filter(e =>
      !e.includes('favicon') && !e.includes('chunk') && !e.includes('Warning')
    );
    expect(critical).toHaveLength(0);
  });

  test('Resumen de Proyectos visible', async ({ page }) => {
    const section = page.getByRole('heading', { name: 'Resumen de Proyectos', exact: false });
    await expect(section.first()).toBeVisible({ timeout: 10000 });
  });
});
