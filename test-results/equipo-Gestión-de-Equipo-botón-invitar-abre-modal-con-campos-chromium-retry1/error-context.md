# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: equipo.spec.ts >> Gestión de Equipo >> botón invitar abre modal con campos
- Location: tests\equipo.spec.ts:32:7

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
  10  |   });
  11  | 
  12  |   test('página de equipo carga', async ({ page }) => {
  13  |     const searchInput = page.getByPlaceholder('Buscar por nombre o email...');
  14  |     await expect(searchInput).toBeVisible({ timeout: 10000 });
  15  |   });
  16  | 
  17  |   test('filtro "Todos" visible', async ({ page }) => {
  18  |     const todosBtn = page.locator('button:has-text("Todos"), [role="tab"]:has-text("Todos")');
  19  |     await expect(todosBtn.first()).toBeVisible({ timeout: 10000 });
  20  |   });
  21  | 
  22  |   test('filtros de roles visibles', async ({ page }) => {
  23  |     const roles = ['Admin', 'Responsable', 'Miembro', 'Viewer'];
  24  |     let found = 0;
  25  |     for (const role of roles) {
  26  |       const el = page.locator(`button:has-text("${role}"), [role="tab"]:has-text("${role}")`);
  27  |       if (await el.count() > 0) found++;
  28  |     }
  29  |     expect(found).toBeGreaterThanOrEqual(2);
  30  |   });
  31  | 
  32  |   test('botón invitar abre modal con campos', async ({ page }) => {
  33  |     const inviteBtn = page.locator('button:has-text("Invitar"), button:has-text("Nuevo miembro")');
  34  |     await inviteBtn.first().click();
  35  | 
  36  |     const modal = page.locator('[role="dialog"]').first();
  37  |     await expect(modal).toBeVisible({ timeout: 5000 });
  38  |     await expect(modal.locator('input[type="email"], input[name="email"]')).toBeVisible();
  39  |     
  40  |     // Verificar selector de locales
  41  |     const locationSelect = modal.locator('select').first();
  42  |     await expect(locationSelect).toBeVisible();
  43  | 
  44  |     await page.keyboard.press('Escape');
  45  |     await expect(modal).toBeHidden({ timeout: 5000 });
  46  |   });
  47  | 
  48  |   test('filtro de locales presente en la página', async ({ page }) => {
  49  |     const locationFilter = page.locator('select').filter({ hasText: /Todos los locales/ });
  50  |     await expect(locationFilter).toBeVisible();
  51  |   });
  52  | 
  53  |   test('invitar nuevo miembro — flujo completo', async ({ page }) => {
  54  |     const TEST_EMAIL = `test-${Date.now()}@example.com`;
  55  | 
  56  |     const inviteBtn = page.locator('button:has-text("Invitar"), button:has-text("Nuevo miembro")');
  57  |     await inviteBtn.first().click();
  58  | 
  59  |     const modal = page.locator('[role="dialog"]').first();
  60  |     await expect(modal).toBeVisible({ timeout: 5000 });
  61  | 
  62  |     // Llenar nombre
  63  |     const nameInput = modal.locator('input[name="name"], input[placeholder*="nombre"], input[placeholder*="Nombre"]');
  64  |     if (await nameInput.count() > 0) await nameInput.fill('Test Usuario E2E');
  65  | 
  66  |     // Llenar email
  67  |     await modal.locator('input[type="email"], input[name="email"]').fill(TEST_EMAIL);
  68  | 
  69  |     // Submit
  70  |     const submitBtn = modal.locator('button[type="submit"], button:has-text("Crear"), button:has-text("Invitar"), button:has-text("Guardar")').first();
  71  |     await submitBtn.click();
  72  | 
  73  |     // Modal debe mostrar step de éxito o cerrarse
  74  |     // Aumentar espera para mutación
  75  |     await expect(async () => {
  76  |       const modalVisible = await modal.isVisible();
  77  |       if (!modalVisible) return true;
  78  |       const successText = modal.locator('text=Usuario creado, text=Contraseña, text=Credenciales');
  79  |       return (await successText.count()) > 0;
  80  |     }).toPass({ timeout: 10000 });
  81  |     
  82  |     await page.keyboard.press('Escape');
  83  |   });
  84  | 
  85  |   test('editar miembro — abrir modal y cambiar rol', async ({ page }) => {
  86  |     // Esperar que carguen los miembros
  87  |     const cards = page.locator('.group.relative');
  88  |     await expect(cards.first()).toBeVisible({ timeout: 10000 });
  89  | 
  90  |     // Click en botón editar (lapiz)
  91  |     await cards.first().locator('button:has(svg.lucide-edit-2), button[title*="Editar"]').click();
  92  | 
  93  |     const modal = page.locator('[role="dialog"]').first();
  94  |     await expect(modal).toBeVisible({ timeout: 5000 });
  95  |     await expect(modal.locator('text=Editar miembro')).toBeVisible();
  96  | 
  97  |     // Cambiar rol
  98  |     await modal.locator('button:has-text("Viewer")').click();
  99  |     await modal.locator('button:has-text("Guardar")').click();
  100 | 
  101 |     await expect(modal).toBeHidden({ timeout: 5000 });
  102 |   });
  103 | });
  104 | 
```