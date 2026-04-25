import { test, expect } from '@playwright/test';
import { loginAsSuperAdmin } from './helpers/auth';

test.describe('Acceso a rutas autenticadas', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
  });

  test('puede navegar a /dashboard/tareas', async ({ page }) => {
    await page.goto('/dashboard/tareas');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/dashboard/tareas');
    await expect(page.locator('text=Cargando tareas..., text=Backlog')).toBeVisible({ timeout: 15000 });
  });

  test('puede navegar a /dashboard/equipo', async ({ page }) => {
    await page.goto('/dashboard/equipo');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/dashboard/equipo');
  });

  test('puede navegar a /dashboard/sectores', async ({ page }) => {
    await page.goto('/dashboard/sectores');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/dashboard/sectores');
  });

  test('puede navegar a /dashboard/billing', async ({ page }) => {
    await page.goto('/dashboard/billing');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/dashboard/billing');
    await expect(page.locator('text=500, text=Error del servidor')).toHaveCount(0);
  });

  test('puede navegar a /dashboard/calendario', async ({ page }) => {
    await page.goto('/dashboard/calendario');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/dashboard/calendario');
  });

  test('puede navegar a /dashboard/config', async ({ page }) => {
    await page.goto('/dashboard/config');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/dashboard/config');
  });

  test('puede navegar a /dashboard/equipo/roles', async ({ page }) => {
    await page.goto('/dashboard/equipo/roles');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/dashboard/equipo/roles');
  });
});

test.describe('API endpoints — estructura', () => {
  test('GET /api/tasks no devuelve 404', async ({ request }) => {
    const res = await request.get('/api/tasks');
    expect([200, 401, 403]).toContain(res.status());
  });

  test('GET /api/locations no devuelve 404', async ({ request }) => {
    const res = await request.get('/api/locations');
    expect([200, 401, 403]).toContain(res.status());
  });

  test('GET /api/members no devuelve 404', async ({ request }) => {
    const res = await request.get('/api/members');
    expect([200, 401, 403]).toContain(res.status());
  });

  test('ruta inexistente devuelve 404 no 500', async ({ request }) => {
    const res = await request.get('/api/ruta-que-no-existe');
    expect(res.status()).toBe(404);
  });
});
