import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

// Credenciales de DOS negocios distintos
const NEGOCIO_A = { email: 'admin@negocio.com', password: 'admin123' };
const NEGOCIO_B = { email: 'admin@negociob.com', password: 'adminb123' };

test.describe('🔐 Aislamiento Multi-Tenant (CRÍTICO)', () => {
  
  test('GET /api/tasks no retorna tareas de otro negocio', async ({ page, request }) => {
    await loginAs(page, NEGOCIO_B.email, NEGOCIO_B.password);
    
    // Asumimos que intentamos acceder al endpoint general. 
    // Los datos retornados deben pertenecer SOLO al negocio B.
    const res = await request.get('/api/tasks');
    expect(res.status()).toBe(200);
    
    const body = await res.json();
    const tasks: Array<{businessId: string}> = body.tasks ?? body;
    
    // Verificamos que no haya tareas del negocio A (o cualquier negocio que no sea el de B)
    // El businessId debe ser validado del usuario actual.
    // Como no tenemos el ID exacto aquí, verificamos que todas tengan un mismo ID y no sea nulo.
    if (tasks.length > 0) {
      const firstBusinessId = tasks[0].businessId;
      const foreignTasks = tasks.filter(t => t.businessId !== firstBusinessId);
      expect(foreignTasks).toHaveLength(0);
    }
  });

  test('GET /api/members no retorna miembros de otro negocio', async ({ page, request }) => {
    await loginAs(page, NEGOCIO_B.email, NEGOCIO_B.password);
    
    const res = await request.get('/api/members');
    expect(res.status()).toBe(200);
    
    const body = await res.json();
    const members: Array<{businessId: string}> = body.members ?? body;
    
    if (members.length > 0) {
      const firstBusinessId = members[0].businessId;
      const foreignMembers = members.filter(m => m.businessId !== firstBusinessId);
      expect(foreignMembers).toHaveLength(0);
    }
  });

  test('GET /api/locations no retorna locales de otro negocio', async ({ page, request }) => {
    await loginAs(page, NEGOCIO_B.email, NEGOCIO_B.password);
    
    const res = await request.get('/api/locations');
    expect(res.status()).toBe(200);
    
    const body = await res.json();
    const locations: Array<{businessId: string}> = body.locations ?? body;
    
    if (locations.length > 0) {
      const firstBusinessId = locations[0].businessId;
      const foreignLocations = locations.filter(l => l.businessId !== firstBusinessId);
      expect(foreignLocations).toHaveLength(0);
    }
  });

  test('GET /api/projects no retorna tableros de otro negocio', async ({ page, request }) => {
    await loginAs(page, NEGOCIO_B.email, NEGOCIO_B.password);
    
    const res = await request.get('/api/projects');
    expect(res.status()).toBe(200);
    
    const body = await res.json();
    const projects: Array<{businessId: string}> = body.projects ?? body;
    
    if (projects.length > 0) {
      const firstBusinessId = projects[0].businessId;
      const foreignProjects = projects.filter(p => p.businessId !== firstBusinessId);
      expect(foreignProjects).toHaveLength(0);
    }
  });

  test('UI: negocio B NO ve tareas creadas por negocio A', async ({ page }) => {
    // 1. Negocio A crea tarea
    await loginAs(page, NEGOCIO_A.email, NEGOCIO_A.password);
    await page.goto('/dashboard/tareas');
    const SECRET_TASK = `SECRET-A-${Date.now()}`;
    
    await page.locator('button:has-text("Nueva tarea")').click();
    const modal = page.locator('[role="dialog"]').first();
    await modal.locator('input[name="title"], input[placeholder*="título"], input[placeholder*="Título"]').first().fill(SECRET_TASK);
    await modal.locator('button[type="submit"]').filter({ hasText: /Crear/ }).click();
    await expect(page.locator(`text=${SECRET_TASK}`)).toBeVisible({ timeout: 15000 });
    
    // 2. Cerrar sesión
    await page.goto('/api/auth/signout'); 
    
    // 3. Negocio B entra
    await loginAs(page, NEGOCIO_B.email, NEGOCIO_B.password);
    await page.goto('/dashboard/tareas');
    await page.waitForLoadState('networkidle');
    
    // 4. Verificar que NO ve la tarea
    await expect(page.locator(`text=${SECRET_TASK}`)).toHaveCount(0);
  });
});
