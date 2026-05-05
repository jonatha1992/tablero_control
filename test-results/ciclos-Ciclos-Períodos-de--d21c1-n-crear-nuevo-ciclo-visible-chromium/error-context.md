# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ciclos.spec.ts >> Ciclos / Períodos de Trabajo >> botón crear nuevo ciclo visible
- Location: tests\ciclos.spec.ts:17:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('button:has-text("Nuevo ciclo"), button:has-text("Crear ciclo"), button:has-text("Nuevo Ciclo")').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('button:has-text("Nuevo ciclo"), button:has-text("Crear ciclo"), button:has-text("Nuevo Ciclo")').first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - complementary [ref=e4]:
        - generic [ref=e5]:
          - generic [ref=e6]:
            - link "Tablero de Control Tablero Control" [ref=e7] [cursor=pointer]:
              - /url: /
              - img "Tablero de Control" [ref=e8]
              - generic [ref=e9]: Tablero Control
            - button [ref=e10]:
              - img [ref=e11]
          - navigation [ref=e13]:
            - link "Dashboard" [ref=e14] [cursor=pointer]:
              - /url: /dashboard
              - img [ref=e15]
              - generic [ref=e20]: Dashboard
            - link "Departamentos" [ref=e21] [cursor=pointer]:
              - /url: /dashboard/sectores
              - img [ref=e22]
              - generic [ref=e26]: Departamentos
            - link "Tareas" [ref=e27] [cursor=pointer]:
              - /url: /dashboard/tareas
              - img [ref=e28]
              - generic [ref=e31]: Tareas
            - link "Períodos" [ref=e32] [cursor=pointer]:
              - /url: /dashboard/ciclos
              - img [ref=e33]
              - generic [ref=e36]: Períodos
            - link "Objetivos" [ref=e37] [cursor=pointer]:
              - /url: /dashboard/objetivos
              - img [ref=e38]
              - generic [ref=e42]: Objetivos
            - link "Calendario" [ref=e43] [cursor=pointer]:
              - /url: /dashboard/calendario
              - img [ref=e44]
              - generic [ref=e46]: Calendario
            - link "Cronograma" [ref=e47] [cursor=pointer]:
              - /url: /dashboard/cronograma
              - img [ref=e48]
              - generic [ref=e49]: Cronograma
            - link "Equipo" [ref=e50] [cursor=pointer]:
              - /url: /dashboard/equipo
              - img [ref=e51]
              - generic [ref=e56]: Equipo
            - link "Facturación" [ref=e57] [cursor=pointer]:
              - /url: /dashboard/billing
              - img [ref=e58]
              - generic [ref=e60]: Facturación
            - link "Configuración" [ref=e61] [cursor=pointer]:
              - /url: /dashboard/config
              - img [ref=e62]
              - generic [ref=e65]: Configuración
            - generic [ref=e66]:
              - paragraph [ref=e67]: Administración
              - generic [ref=e68]:
                - link "Plataforma" [ref=e69] [cursor=pointer]:
                  - /url: /superadmin
                  - img [ref=e70]
                  - generic [ref=e73]: Plataforma
                - link "Negocios" [ref=e74] [cursor=pointer]:
                  - /url: /superadmin/businesses
                  - img [ref=e75]
                  - generic [ref=e79]: Negocios
                - link "Usuarios" [ref=e80] [cursor=pointer]:
                  - /url: /superadmin/users
                  - img [ref=e81]
                  - generic [ref=e86]: Usuarios
                - link "Suscripciones" [ref=e87] [cursor=pointer]:
                  - /url: /superadmin/subscriptions
                  - img [ref=e88]
                  - generic [ref=e90]: Suscripciones
                - link "Planes" [ref=e91] [cursor=pointer]:
                  - /url: /superadmin/planes
                  - img [ref=e92]
                  - generic [ref=e93]: Planes
                - link "Auditoría" [ref=e94] [cursor=pointer]:
                  - /url: /superadmin/audit
                  - img [ref=e95]
                  - generic [ref=e98]: Auditoría
          - paragraph [ref=e100]: v0.1.0 · En desarrollo
      - generic [ref=e101]:
        - banner [ref=e102]:
          - heading "Tablero de Control" [level=1] [ref=e105]
          - generic [ref=e106]:
            - button "Notificaciones" [ref=e108]:
              - img [ref=e109]
            - generic [ref=e112]:
              - generic [ref=e114]: TA
              - generic [ref=e115]:
                - generic [ref=e116]: TecnoFusión Admin
                - generic [ref=e117]: Super Admin
            - button "Cerrar sesión" [ref=e118]:
              - img [ref=e119]
        - main [ref=e122]:
          - generic [ref=e123]:
            - generic [ref=e124]:
              - heading "Períodos de Trabajo" [level=1] [ref=e125]
              - button "Nuevo período" [ref=e126]:
                - img [ref=e127]
                - text: Nuevo período
            - generic [ref=e128]:
              - img [ref=e129]
              - paragraph [ref=e131]: Sin períodos de trabajo aún.
              - paragraph [ref=e132]: Creá uno para planificar tareas por semanas, quincenas o meses.
        - contentinfo [ref=e133]:
          - generic [ref=e134]:
            - paragraph [ref=e135]: © 2026 Tablero de Control. Todos los derechos reservados.
            - generic [ref=e136]:
              - generic [ref=e137]: Hecho con
              - img [ref=e138]
              - generic [ref=e140]: por
              - link "TecnoFusión.it" [ref=e141] [cursor=pointer]:
                - /url: https://tecnofusion-it.web.app/
                - text: TecnoFusión.it
                - img [ref=e142]
    - button "Crear tarea" [ref=e147]:
      - img [ref=e148]
  - button "Open Next.js Dev Tools" [ref=e154] [cursor=pointer]:
    - img [ref=e155]
  - alert [ref=e158]
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { loginAsSuperAdmin } from './helpers/auth';
  3  | 
  4  | test.describe('Ciclos / Períodos de Trabajo', () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await loginAsSuperAdmin(page);
  7  |     await page.goto('/dashboard/ciclos');
  8  |     await page.waitForLoadState('networkidle');
  9  |     await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 15000 }).catch(() => {});
  10 |   });
  11 | 
  12 |   test('página de ciclos carga sin error 500', async ({ page }) => {
  13 |     await expect(page.locator('text=500, text=Internal Server Error')).toHaveCount(0);
  14 |     await expect(page).toHaveURL('/dashboard/ciclos');
  15 |   });
  16 | 
  17 |   test('botón crear nuevo ciclo visible', async ({ page }) => {
  18 |     const createBtn = page.locator(
  19 |       'button:has-text("Nuevo ciclo"), button:has-text("Crear ciclo"), button:has-text("Nuevo Ciclo")'
  20 |     );
> 21 |     await expect(createBtn.first()).toBeVisible({ timeout: 10000 });
     |                                     ^ Error: expect(locator).toBeVisible() failed
  22 |   });
  23 | 
  24 |   test('tabs de estado: Planning, Activo, Completado, Cerrado', async ({ page }) => {
  25 |     const expectedTabs = ['Planning', 'Activo', 'Completado', 'Cerrado'];
  26 |     let found = 0;
  27 |     for (const tab of expectedTabs) {
  28 |       const el = page.locator(`button:has-text("${tab}"), [role="tab"]:has-text("${tab}")`);
  29 |       if (await el.count() > 0) found++;
  30 |     }
  31 |     // Al menos 2 tabs de estado deben estar presentes
  32 |     expect(found).toBeGreaterThanOrEqual(2);
  33 |   });
  34 | 
  35 |   test('ALTA — modal crear ciclo abre con campos obligatorios', async ({ page }) => {
  36 |     const createBtn = page.locator(
  37 |       'button:has-text("Nuevo ciclo"), button:has-text("Crear ciclo"), button:has-text("Nuevo Ciclo")'
  38 |     );
  39 |     await createBtn.first().click();
  40 | 
  41 |     const modal = page.locator('[role="dialog"]').first();
  42 |     await expect(modal).toBeVisible({ timeout: 8000 });
  43 | 
  44 |     // Campo nombre/título
  45 |     const nameInput = modal.locator('input').first();
  46 |     await expect(nameInput).toBeVisible();
  47 | 
  48 |     await page.keyboard.press('Escape');
  49 |     await expect(modal).toBeHidden({ timeout: 5000 });
  50 |   });
  51 | 
  52 |   test('ALTA — crear ciclo completo', async ({ page }) => {
  53 |     const NAME = `Ciclo E2E ${Date.now()}`;
  54 | 
  55 |     const createBtn = page.locator(
  56 |       'button:has-text("Nuevo ciclo"), button:has-text("Crear ciclo"), button:has-text("Nuevo Ciclo")'
  57 |     );
  58 |     await createBtn.first().click();
  59 | 
  60 |     const modal = page.locator('[role="dialog"]').first();
  61 |     await expect(modal).toBeVisible({ timeout: 8000 });
  62 | 
  63 |     // Nombre
  64 |     await modal.locator('input[name="name"], input[placeholder*="nombre"], input[placeholder*="Nombre"]').first().fill(NAME);
  65 | 
  66 |     // Fechas (si existen)
  67 |     const dateInputs = modal.locator('input[type="date"]');
  68 |     const dateCount = await dateInputs.count();
  69 |     if (dateCount >= 2) {
  70 |       await dateInputs.nth(0).fill('2025-06-01');
  71 |       await dateInputs.nth(1).fill('2025-06-30');
  72 |     }
  73 | 
  74 |     // Submit
  75 |     const submitBtn = modal.locator('button[type="submit"], button:has-text("Crear"), button:has-text("Guardar")').first();
  76 |     await submitBtn.click();
  77 | 
  78 |     await expect(modal).toBeHidden({ timeout: 15000 });
  79 |     await expect(page.locator(`text=${NAME}`)).toBeVisible({ timeout: 10000 });
  80 |   });
  81 | 
  82 |   test('API GET /api/cycles responde sin 404/500', async ({ request }) => {
  83 |     const res = await request.get('/api/cycles');
  84 |     expect([200, 401, 403]).toContain(res.status());
  85 |   });
  86 | });
  87 | 
```