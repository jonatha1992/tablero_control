# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> Dashboard principal >> dashboard carga con 4 KPI cards
- Location: tests\dashboard.spec.ts:11:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Pendientes')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('text=Pendientes')

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
          - heading "Dashboard de Negocio" [level=1] [ref=e105]
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
              - generic [ref=e125]:
                - img [ref=e127]
                - heading "Tareas Activas" [level=3] [ref=e131]
                - generic [ref=e132]:
                  - generic [ref=e133]: "0"
                  - paragraph [ref=e134]:
                    - img [ref=e135]
                    - text: Tareas activas
              - generic [ref=e138]:
                - img [ref=e140]
                - heading "Tareas Completadas" [level=3] [ref=e144]
                - generic [ref=e145]:
                  - generic [ref=e146]: "0"
                  - paragraph [ref=e147]: Eficiencia histórica
              - generic [ref=e148]:
                - img [ref=e150]
                - heading "Bloqueadas" [level=3] [ref=e153]
                - generic [ref=e154]:
                  - generic [ref=e155]: "0"
                  - paragraph [ref=e156]: Requieren atención
              - generic [ref=e157]:
                - img [ref=e159]
                - heading "Urgentes" [level=3] [ref=e162]
                - generic [ref=e163]:
                  - generic [ref=e164]: "0"
                  - paragraph [ref=e165]: Prioridad inmediata
            - generic [ref=e166]:
              - generic [ref=e167]:
                - heading "Análisis de Operaciones" [level=2] [ref=e168]
                - generic [ref=e169]:
                  - generic [ref=e170]:
                    - generic [ref=e171]:
                      - heading "Burndown (7d)" [level=3] [ref=e172]
                      - paragraph [ref=e173]: Trabajo restante vs ideal
                    - application [ref=e178]:
                      - generic [ref=e191]:
                        - generic [ref=e192]:
                          - generic [ref=e194]: mar 28
                          - generic [ref=e196]: jue 30
                          - generic [ref=e198]: sáb 2
                          - generic [ref=e200]: lun 4
                        - generic [ref=e201]:
                          - generic [ref=e203]: "0"
                          - generic [ref=e205]: "1"
                          - generic [ref=e207]: "2"
                          - generic [ref=e209]: "3"
                          - generic [ref=e211]: "4"
                  - generic [ref=e212]:
                    - generic [ref=e213]:
                      - heading "Tendencia" [level=3] [ref=e214]
                      - paragraph [ref=e215]: Resolución semanal
                    - application [ref=e220]:
                      - generic [ref=e224]:
                        - generic [ref=e225]:
                          - generic [ref=e227]: 6 abr
                          - generic [ref=e229]: 20 abr
                          - generic [ref=e231]: 4 may
                        - generic [ref=e232]:
                          - generic [ref=e234]: "0"
                          - generic [ref=e236]: "1"
                          - generic [ref=e238]: "2"
                          - generic [ref=e240]: "3"
                          - generic [ref=e242]: "4"
                  - generic [ref=e243]:
                    - generic [ref=e244]:
                      - heading "Distribución" [level=3] [ref=e245]
                      - paragraph [ref=e246]: Estado actual global
                    - application [ref=e252]
              - generic [ref=e253]:
                - heading "Resumen por Local/Sector" [level=2] [ref=e254]
                - paragraph [ref=e258]: No hay datos disponibles.
        - contentinfo [ref=e259]:
          - generic [ref=e260]:
            - paragraph [ref=e261]: © 2026 Tablero de Control. Todos los derechos reservados.
            - generic [ref=e262]:
              - generic [ref=e263]: Hecho con
              - img [ref=e264]
              - generic [ref=e266]: por
              - link "TecnoFusión.it" [ref=e267] [cursor=pointer]:
                - /url: https://tecnofusion-it.web.app/
                - text: TecnoFusión.it
                - img [ref=e268]
    - button "Crear tarea" [ref=e273]:
      - img [ref=e274]
  - button "Open Next.js Dev Tools" [ref=e280] [cursor=pointer]:
    - img [ref=e281]
  - alert [ref=e284]
  - region "Notifications alt+T"
  - generic [ref=e285]: "20"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { loginAsSuperAdmin } from './helpers/auth';
  3  | 
  4  | test.describe('Dashboard principal', () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await loginAsSuperAdmin(page);
  7  |     await page.goto('/dashboard');
  8  |     await page.waitForLoadState('networkidle');
  9  |   });
  10 | 
  11 |   test('dashboard carga con 4 KPI cards', async ({ page }) => {
> 12 |     await expect(page.locator('text=Pendientes')).toBeVisible({ timeout: 10000 });
     |                                                   ^ Error: expect(locator).toBeVisible() failed
  13 |     await expect(page.locator('text=Finalizadas')).toBeVisible();
  14 |     await expect(page.locator('text=Bloqueadas')).toBeVisible();
  15 |     await expect(page.locator('text=Urgentes')).toBeVisible();
  16 |   });
  17 | 
  18 |   test('KPIs muestran números (no NaN ni undefined)', async ({ page }) => {
  19 |     await page.waitForLoadState('networkidle');
  20 |     const kpiNumbers = await page.locator('.text-3xl').allTextContents();
  21 |     for (const num of kpiNumbers) {
  22 |       expect(num).not.toContain('NaN');
  23 |       expect(num).not.toContain('undefined');
  24 |       expect(num.trim()).not.toBe('');
  25 |     }
  26 |   });
  27 | 
  28 |   test('sidebar con links de navegación', async ({ page }) => {
  29 |     const tareasLink = page.locator('a[href*="/dashboard/tareas"], a:has-text("Tareas")');
  30 |     await expect(tareasLink).toBeVisible({ timeout: 10000 });
  31 |   });
  32 | 
  33 |   test('no hay errores de consola críticos', async ({ page }) => {
  34 |     const errors: string[] = [];
  35 |     page.on('console', msg => {
  36 |       if (msg.type() === 'error') errors.push(msg.text());
  37 |     });
  38 |     await page.reload();
  39 |     await page.waitForLoadState('networkidle');
  40 | 
  41 |     const critical = errors.filter(e =>
  42 |       !e.includes('favicon') && !e.includes('chunk') && !e.includes('Warning')
  43 |     );
  44 |     expect(critical).toHaveLength(0);
  45 |   });
  46 | 
  47 |   test('Resumen de Proyectos visible', async ({ page }) => {
  48 |     const section = page.getByRole('heading', { name: 'Resumen de Proyectos', exact: false });
  49 |     await expect(section.first()).toBeVisible({ timeout: 10000 });
  50 |   });
  51 | });
  52 | 
```