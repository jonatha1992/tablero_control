# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: equipo.spec.ts >> Gestión de Equipo >> invitar nuevo miembro — flujo completo
- Location: tests\equipo.spec.ts:53:7

# Error details

```
Test timeout of 40000ms exceeded while running "beforeEach" hook.
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
          - heading "Equipo" [level=1] [ref=e105]
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
              - generic [ref=e137]:
                - button "Link de invitación" [ref=e138]:
                  - img [ref=e139]
                  - text: Link de invitación
                - button "Crear usuario" [ref=e142]:
                  - img [ref=e143]
                  - text: Crear usuario
              - generic [ref=e146]:
                - textbox "Buscar por nombre o correo..." [ref=e147]
                - combobox [ref=e148]:
                  - option "Todos los locales" [selected]
                - generic [ref=e149]:
                  - button "Todos" [ref=e150]
                  - button "Administrador" [ref=e151]
                  - button "Responsable" [ref=e152]
                  - button "Miembro" [ref=e153]
                  - button "Visualizador" [ref=e154]
              - generic [ref=e158]:
                - generic [ref=e161]: TA
                - generic [ref=e163]:
                  - generic [ref=e164]:
                    - paragraph [ref=e165]: TecnoFusión Admin
                    - generic [ref=e166]: Super Admin
                  - paragraph [ref=e167]: tecnofusion.it@gmail.com
                - generic [ref=e168]:
                  - button "Editar miembro" [ref=e169]:
                    - img [ref=e170]
                  - button "Enviar email" [ref=e172]:
                    - img [ref=e173]
                  - button "Eliminar miembro" [ref=e176]:
                    - img [ref=e177]
              - generic [ref=e182]:
                - heading "Links de invitación" [level=3] [ref=e184]:
                  - img [ref=e185]
                  - text: Links de invitación
                - paragraph [ref=e188]: No tenés links de invitación activos. Generá uno para compartir con tu equipo.
        - contentinfo [ref=e189]:
          - generic [ref=e190]:
            - paragraph [ref=e191]: © 2026 Tablero de Control. Todos los derechos reservados.
            - generic [ref=e192]:
              - generic [ref=e193]: Hecho con
              - img [ref=e194]
              - generic [ref=e196]: por
              - link "TecnoFusión.it" [ref=e197] [cursor=pointer]:
                - /url: https://tecnofusion-it.web.app/
                - text: TecnoFusión.it
                - img [ref=e198]
    - button "Crear tarea" [ref=e203]:
      - img [ref=e204]
  - button "Open Next.js Dev Tools" [ref=e210] [cursor=pointer]:
    - img [ref=e211]
  - alert [ref=e214]
  - region "Notifications alt+T"
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { loginAsSuperAdmin } from './helpers/auth';
  3   | 
  4   | test.describe('Gestión de Equipo', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await loginAsSuperAdmin(page);
  7   |     await page.goto('/dashboard/equipo');
> 8   |     await page.waitForLoadState('networkidle');
      |                ^ Error: page.waitForLoadState: Test timeout of 40000ms exceeded.
  9   |     await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 }).catch(() => {});
  10  |     await page.waitForTimeout(1000);
  11  |   });
  12  | 
  13  |   test('página de equipo carga', async ({ page }) => {
  14  |     // Placeholder puede decir "email" o "correo"
  15  |     const searchInput = page.getByPlaceholder(/nombre|email|correo/i);
  16  |     await expect(searchInput.first()).toBeVisible({ timeout: 10000 });
  17  |   });
  18  | 
  19  |   test('filtro "Todos" visible', async ({ page }) => {
  20  |     const todosBtn = page.locator(
  21  |       'button:has-text("Todos"), [role="tab"]:has-text("Todos")'
  22  |     );
  23  |     await expect(todosBtn.first()).toBeVisible({ timeout: 10000 });
  24  |   });
  25  | 
  26  |   test('filtros de roles visibles', async ({ page }) => {
  27  |     // Nombres de roles en español
  28  |     const roles = ['Admin', 'Administrador', 'Responsable', 'Miembro', 'Viewer', 'Visualizador'];
  29  |     let found = 0;
  30  |     for (const role of roles) {
  31  |       const el = page.locator(
  32  |         `button:has-text("${role}"), [role="tab"]:has-text("${role}")`
  33  |       );
  34  |       if (await el.count() > 0) found++;
  35  |     }
  36  |     expect(found).toBeGreaterThanOrEqual(2);
  37  |   });
  38  | 
  39  |   test('botón crear/invitar usuario abre modal', async ({ page }) => {
  40  |     // El botón puede llamarse "Invitar", "Nuevo miembro", "Crear usuario", etc.
  41  |     const actionBtn = page.locator(
  42  |       'button:has-text("Invitar"), button:has-text("Nuevo miembro"), button:has-text("Crear usuario"), button:has-text("Crear Usuario")'
  43  |     );
  44  |     await expect(actionBtn.first()).toBeVisible({ timeout: 10000 });
  45  |     await actionBtn.first().click();
  46  | 
  47  |     const modal = page.locator('[role="dialog"]').first();
  48  |     await expect(modal).toBeVisible({ timeout: 8000 });
  49  | 
  50  |     // Debe tener campo de email o nombre
  51  |     const emailInput = modal.locator('input[type="email"], input[name="email"]');
  52  |     const nameInput = modal.locator('input[name="name"], input[placeholder*="nombre"], input[placeholder*="Nombre"]');
  53  |     const hasEmail = await emailInput.count() > 0;
  54  |     const hasName = await nameInput.count() > 0;
  55  |     expect(hasEmail || hasName).toBeTruthy();
  56  | 
  57  |     await page.keyboard.press('Escape');
  58  |     await expect(modal).toBeHidden({ timeout: 5000 });
  59  |   });
  60  | 
  61  |   test('filtro de locales o selector presente en la página', async ({ page }) => {
  62  |     // Puede ser <select> o un dropdown con texto "Todos los locales" / "Todos los sectores"
  63  |     const locationFilter = page.locator(
  64  |       'select, [role="combobox"]',
  65  |     ).filter({ hasText: /local|sector|departamento/i });
  66  |     const dropdownText = page.locator('text=/Todos los locales|Todos los sectores/i');
  67  | 
  68  |     const hasSelect = await locationFilter.count() > 0;
  69  |     const hasText = await dropdownText.count() > 0;
  70  |     expect(hasSelect || hasText).toBeTruthy();
  71  |   });
  72  | 
  73  |   test('crear usuario nuevo — flujo completo', async ({ page }) => {
  74  |     const TEST_EMAIL = `test-${Date.now()}@example.com`;
  75  | 
  76  |     const actionBtn = page.locator(
  77  |       'button:has-text("Invitar"), button:has-text("Nuevo miembro"), button:has-text("Crear usuario"), button:has-text("Crear Usuario")'
  78  |     );
  79  |     await actionBtn.first().click();
  80  | 
  81  |     const modal = page.locator('[role="dialog"]').first();
  82  |     await expect(modal).toBeVisible({ timeout: 8000 });
  83  | 
  84  |     // Llenar nombre si existe
  85  |     const nameInput = modal.locator('input[name="name"], input[placeholder*="nombre"], input[placeholder*="Nombre"]');
  86  |     if (await nameInput.count() > 0) await nameInput.first().fill('Test Usuario E2E');
  87  | 
  88  |     // Llenar email
  89  |     const emailInput = modal.locator('input[type="email"], input[name="email"]');
  90  |     if (await emailInput.count() > 0) await emailInput.first().fill(TEST_EMAIL);
  91  | 
  92  |     // Submit
  93  |     const submitBtn = modal.locator(
  94  |       'button[type="submit"], button:has-text("Crear"), button:has-text("Invitar"), button:has-text("Guardar")'
  95  |     ).first();
  96  |     await submitBtn.click();
  97  | 
  98  |     // Modal debe mostrar paso de éxito o cerrarse
  99  |     await expect(async () => {
  100 |       const modalVisible = await modal.isVisible();
  101 |       if (!modalVisible) return;
  102 |       const successText = modal.locator('text=/creado|Contraseña|Credenciales|éxito|exitoso/i');
  103 |       expect(await successText.count()).toBeGreaterThan(0);
  104 |     }).toPass({ timeout: 15000 });
  105 | 
  106 |     await page.keyboard.press('Escape');
  107 |   });
  108 | 
```