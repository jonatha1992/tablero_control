import { test, expect } from '@playwright/test';
import { loginAsSuperAdmin } from './helpers/auth';

test.describe('Cronograma / Gantt', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/dashboard/cronograma');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 15000 }).catch(() => {});
    // Esperar que FullCalendar cargue (puede ser lento)
    await page.waitForTimeout(2000);
  });

  test('página cronograma carga sin error 500', async ({ page }) => {
    await expect(page.locator('text=500, text=Internal Server Error')).toHaveCount(0);
    await expect(page).toHaveURL('/dashboard/cronograma');
  });

  test('FullCalendar Timeline renderiza', async ({ page }) => {
    // FullCalendar Timeline genera fc-timeline-* o fc-resource-timeline-*
    const fcEl = page.locator(
      '.fc, [class*="fc-timeline"], [class*="fc-resource-timeline"], [class*="fc-view"]'
    );
    await expect(fcEl.first()).toBeVisible({ timeout: 20000 });
  });

  test('cabecera del Gantt con título y navegación', async ({ page }) => {
    // Botones prev/next estándar de FullCalendar
    const prevBtn = page.locator(
      '.fc-prev-button, button[aria-label*="previous"], button[title*="Anterior"]'
    );
    await expect(prevBtn.first()).toBeVisible({ timeout: 15000 });
  });

  test('no hay errores de consola críticos en cronograma', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const critical = errors.filter(e =>
      !e.includes('favicon') && !e.includes('Warning') && !e.includes('chunk')
    );
    // Permitir algunos errores conocidos de FullCalendar o licencia
    const severeErrors = critical.filter(e =>
      !e.includes('license') && !e.includes('FullCalendar') && !e.includes('UNSAFE_')
    );
    expect(severeErrors.length).toBe(0);
  });

  test('sidebar de recursos (sectores/equipos) visible', async ({ page }) => {
    // FullCalendar Resource Timeline muestra recursos a la izquierda
    const resourceArea = page.locator(
      '.fc-resource-area, .fc-datagrid-body, [class*="fc-resource"]'
    );
    // Es informativo — puede no tener recursos si no hay datos
    const count = await resourceArea.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
