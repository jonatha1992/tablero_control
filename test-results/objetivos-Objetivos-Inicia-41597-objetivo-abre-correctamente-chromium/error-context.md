# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: objetivos.spec.ts >> Objetivos / Iniciativas >> ALTA — modal crear objetivo abre correctamente
- Location: tests\objetivos.spec.ts:24:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[role="dialog"]').first()
Expected: visible
Timeout: 8000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 8000ms
  - waiting for locator('[role="dialog"]').first()

```

# Page snapshot

```yaml
- generic [ref=e1]:
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
              - heading "Objetivos" [level=1] [ref=e125]
              - button "Nuevo objetivo" [active] [ref=e126]:
                - img [ref=e127]
                - text: Nuevo objetivo
            - generic [ref=e128]:
              - img [ref=e129]
              - paragraph [ref=e133]: Sin objetivos aún.
              - paragraph [ref=e134]: Creá uno para agrupar tareas en iniciativas grandes.
            - generic [ref=e136]:
              - generic [ref=e137]:
                - heading "Nuevo objetivo" [level=2] [ref=e138]
                - button [ref=e139]:
                  - img [ref=e140]
              - generic [ref=e143]:
                - generic [ref=e144]:
                  - generic [ref=e145]: Nombre
                  - 'textbox "Ej: Apertura Sucursal Palermo" [ref=e146]'
                - generic [ref=e147]:
                  - generic [ref=e148]: Descripción (opcional)
                  - 'textbox "Ej: Completar todos los pasos para abrir la nueva sucursal" [ref=e149]'
                - generic [ref=e150]:
                  - generic [ref=e151]:
                    - generic [ref=e152]: Color
                    - textbox [ref=e153]: "#3b82f6"
                  - generic [ref=e154]:
                    - generic [ref=e155]: Fecha objetivo
                    - textbox [ref=e156]
                - generic [ref=e157]:
                  - button "Cancelar" [ref=e158]
                  - button "Crear objetivo" [ref=e159]
        - contentinfo [ref=e160]:
          - generic [ref=e161]:
            - paragraph [ref=e162]: © 2026 Tablero de Control. Todos los derechos reservados.
            - generic [ref=e163]:
              - generic [ref=e164]: Hecho con
              - img [ref=e165]
              - generic [ref=e167]: por
              - link "TecnoFusión.it" [ref=e168] [cursor=pointer]:
                - /url: https://tecnofusion-it.web.app/
                - text: TecnoFusión.it
                - img [ref=e169]
    - button "Crear tarea" [ref=e174]:
      - img [ref=e175]
  - button "Open Next.js Dev Tools" [ref=e181] [cursor=pointer]:
    - img [ref=e182]
  - alert [ref=e185]
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { loginAsSuperAdmin } from './helpers/auth';
  3  | 
  4  | test.describe('Objetivos / Iniciativas', () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await loginAsSuperAdmin(page);
  7  |     await page.goto('/dashboard/objetivos');
  8  |     await page.waitForLoadState('networkidle');
  9  |     await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 15000 }).catch(() => {});
  10 |   });
  11 | 
  12 |   test('página de objetivos carga sin error 500', async ({ page }) => {
  13 |     await expect(page.locator('text=500, text=Internal Server Error')).toHaveCount(0);
  14 |     await expect(page).toHaveURL('/dashboard/objetivos');
  15 |   });
  16 | 
  17 |   test('botón crear nuevo objetivo visible', async ({ page }) => {
  18 |     const createBtn = page.locator(
  19 |       'button:has-text("Nuevo objetivo"), button:has-text("Nuevo Objetivo"), button:has-text("Crear objetivo"), button:has-text("Nueva Iniciativa")'
  20 |     );
  21 |     await expect(createBtn.first()).toBeVisible({ timeout: 10000 });
  22 |   });
  23 | 
  24 |   test('ALTA — modal crear objetivo abre correctamente', async ({ page }) => {
  25 |     const createBtn = page.locator(
  26 |       'button:has-text("Nuevo objetivo"), button:has-text("Nuevo Objetivo"), button:has-text("Crear objetivo"), button:has-text("Nueva Iniciativa")'
  27 |     );
  28 |     await createBtn.first().click();
  29 | 
  30 |     const modal = page.locator('[role="dialog"]').first();
> 31 |     await expect(modal).toBeVisible({ timeout: 8000 });
     |                         ^ Error: expect(locator).toBeVisible() failed
  32 | 
  33 |     // Debe tener al menos un input (título/nombre)
  34 |     await expect(modal.locator('input').first()).toBeVisible();
  35 | 
  36 |     await page.keyboard.press('Escape');
  37 |     await expect(modal).toBeHidden({ timeout: 5000 });
  38 |   });
  39 | 
  40 |   test('ALTA — crear objetivo exitosamente', async ({ page }) => {
  41 |     const NAME = `Objetivo E2E ${Date.now()}`;
  42 | 
  43 |     const createBtn = page.locator(
  44 |       'button:has-text("Nuevo objetivo"), button:has-text("Nuevo Objetivo"), button:has-text("Crear objetivo"), button:has-text("Nueva Iniciativa")'
  45 |     );
  46 |     await createBtn.first().click();
  47 | 
  48 |     const modal = page.locator('[role="dialog"]').first();
  49 |     await expect(modal).toBeVisible({ timeout: 8000 });
  50 | 
  51 |     await modal.locator('input[name="title"], input[name="name"], input[placeholder*="título"], input[placeholder*="Título"], input').first().fill(NAME);
  52 | 
  53 |     const submitBtn = modal.locator('button[type="submit"], button:has-text("Crear"), button:has-text("Guardar")').first();
  54 |     await submitBtn.click();
  55 | 
  56 |     await expect(modal).toBeHidden({ timeout: 15000 });
  57 |     await expect(page.locator(`text=${NAME}`)).toBeVisible({ timeout: 10000 });
  58 |   });
  59 | 
  60 |   test('tarjetas de objetivos muestran progreso', async ({ page }) => {
  61 |     // Si hay objetivos, deben mostrar barra de progreso o porcentaje
  62 |     const cards = page.locator('[class*="card"], [class*="objective"]').filter({ hasText: /\d/ });
  63 |     const count = await cards.count();
  64 | 
  65 |     if (count === 0) { test.skip(); return; }
  66 | 
  67 |     // Verificar que existe algún indicador de progreso
  68 |     const progressBar = page.locator('[role="progressbar"], [class*="progress"]');
  69 |     const hasProgress = await progressBar.count() > 0;
  70 |     // Es informativo — no falla si no existe
  71 |     expect(count).toBeGreaterThanOrEqual(0);
  72 |   });
  73 | 
  74 |   test('API GET /api/objectives responde sin 404/500', async ({ request }) => {
  75 |     const res = await request.get('/api/objectives');
  76 |     expect([200, 401, 403]).toContain(res.status());
  77 |   });
  78 | });
  79 | 
```