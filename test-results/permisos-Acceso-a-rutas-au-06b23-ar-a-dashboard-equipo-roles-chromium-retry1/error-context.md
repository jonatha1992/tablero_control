# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: permisos.spec.ts >> Acceso a rutas autenticadas >> puede navegar a /dashboard/equipo/roles
- Location: tests\permisos.spec.ts:47:7

# Error details

```
Test timeout of 40000ms exceeded.
```

```
Error: page.waitForLoadState: Test timeout of 40000ms exceeded.
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
          - heading "Roles y Permisos" [level=1] [ref=e105]
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
            - navigation "Secciones del equipo" [ref=e125]:
              - link "Miembros" [ref=e126] [cursor=pointer]:
                - /url: /dashboard/equipo
                - img [ref=e127]
                - text: Miembros
              - link "Roles y Permisos" [ref=e132] [cursor=pointer]:
                - /url: /dashboard/equipo/roles
                - img [ref=e133]
                - text: Roles y Permisos
            - generic [ref=e136]:
              - paragraph [ref=e138]: Diseñá roles personalizados para tu equipo. Los roles del sistema no se pueden editar.
              - generic [ref=e139]:
                - heading "Roles personalizados" [level=2] [ref=e140]
                - generic [ref=e141]:
                  - img [ref=e142]
                  - paragraph [ref=e145]: Todavía no creaste roles personalizados
                  - paragraph [ref=e146]: Cloná un rol base y ajustá los permisos exactos que necesita tu equipo.
                  - button "Crear primer rol" [ref=e147]
        - contentinfo [ref=e148]:
          - generic [ref=e149]:
            - paragraph [ref=e150]: © 2026 Tablero de Control. Todos los derechos reservados.
            - generic [ref=e151]:
              - generic [ref=e152]: Hecho con
              - img [ref=e153]
              - generic [ref=e155]: por
              - link "TecnoFusión.it" [ref=e156] [cursor=pointer]:
                - /url: https://tecnofusion-it.web.app/
                - text: TecnoFusión.it
                - img [ref=e157]
    - button "Crear tarea" [ref=e162]:
      - img [ref=e163]
  - button "Open Next.js Dev Tools" [ref=e169] [cursor=pointer]:
    - img [ref=e170]
  - alert [ref=e173]
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { loginAsSuperAdmin } from './helpers/auth';
  3  | 
  4  | test.describe('Acceso a rutas autenticadas', () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await loginAsSuperAdmin(page);
  7  |   });
  8  | 
  9  |   test('puede navegar a /dashboard/tareas', async ({ page }) => {
  10 |     await page.goto('/dashboard/tareas');
  11 |     await page.waitForLoadState('networkidle');
  12 |     await expect(page).toHaveURL('/dashboard/tareas');
  13 |     await expect(page.locator('text=Cargando tareas..., text=Backlog')).toBeVisible({ timeout: 15000 });
  14 |   });
  15 | 
  16 |   test('puede navegar a /dashboard/equipo', async ({ page }) => {
  17 |     await page.goto('/dashboard/equipo');
  18 |     await page.waitForLoadState('networkidle');
  19 |     await expect(page).toHaveURL('/dashboard/equipo');
  20 |   });
  21 | 
  22 |   test('puede navegar a /dashboard/sectores', async ({ page }) => {
  23 |     await page.goto('/dashboard/sectores');
  24 |     await page.waitForLoadState('networkidle');
  25 |     await expect(page).toHaveURL('/dashboard/sectores');
  26 |   });
  27 | 
  28 |   test('puede navegar a /dashboard/billing', async ({ page }) => {
  29 |     await page.goto('/dashboard/billing');
  30 |     await page.waitForLoadState('networkidle');
  31 |     await expect(page).toHaveURL('/dashboard/billing');
  32 |     await expect(page.locator('text=500, text=Error del servidor')).toHaveCount(0);
  33 |   });
  34 | 
  35 |   test('puede navegar a /dashboard/calendario', async ({ page }) => {
  36 |     await page.goto('/dashboard/calendario');
  37 |     await page.waitForLoadState('networkidle');
  38 |     await expect(page).toHaveURL('/dashboard/calendario');
  39 |   });
  40 | 
  41 |   test('puede navegar a /dashboard/config', async ({ page }) => {
  42 |     await page.goto('/dashboard/config');
  43 |     await page.waitForLoadState('networkidle');
  44 |     await expect(page).toHaveURL('/dashboard/config');
  45 |   });
  46 | 
  47 |   test('puede navegar a /dashboard/equipo/roles', async ({ page }) => {
  48 |     await page.goto('/dashboard/equipo/roles');
> 49 |     await page.waitForLoadState('networkidle');
     |                ^ Error: page.waitForLoadState: Test timeout of 40000ms exceeded.
  50 |     await expect(page).toHaveURL('/dashboard/equipo/roles');
  51 |   });
  52 | });
  53 | 
  54 | test.describe('API endpoints — estructura', () => {
  55 |   test('GET /api/tasks no devuelve 404', async ({ request }) => {
  56 |     const res = await request.get('/api/tasks');
  57 |     expect([200, 401, 403]).toContain(res.status());
  58 |   });
  59 | 
  60 |   test('GET /api/locations no devuelve 404', async ({ request }) => {
  61 |     const res = await request.get('/api/locations');
  62 |     expect([200, 401, 403]).toContain(res.status());
  63 |   });
  64 | 
  65 |   test('GET /api/members no devuelve 404', async ({ request }) => {
  66 |     const res = await request.get('/api/members');
  67 |     expect([200, 401, 403]).toContain(res.status());
  68 |   });
  69 | 
  70 |   test('ruta inexistente devuelve 404 no 500', async ({ request }) => {
  71 |     const res = await request.get('/api/ruta-que-no-existe');
  72 |     expect(res.status()).toBe(404);
  73 |   });
  74 | });
  75 | 
```