# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sectores.spec.ts >> Gestión de Sectores / ABM >> ALTA — crear sector exitosamente
- Location: tests\sectores.spec.ts:43:7

# Error details

```
Test timeout of 40000ms exceeded.
```

```
Error: locator.click: Test timeout of 40000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Nuevo Departamento")')

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
          - heading "Departamentos y Sectores" [level=1] [ref=e105]
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
          - generic [ref=e124]:
            - img [ref=e125]
            - heading "No hay sectores configurados" [level=3] [ref=e128]
            - paragraph [ref=e129]: Agregá departamentos o sectores para organizar mejor el trabajo de tu equipo.
            - button "Agregar Departamento" [ref=e130]:
              - img [ref=e131]
              - text: Agregar Departamento
        - contentinfo [ref=e134]:
          - generic [ref=e135]:
            - paragraph [ref=e136]: © 2026 Tablero de Control. Todos los derechos reservados.
            - generic [ref=e137]:
              - generic [ref=e138]: Hecho con
              - img [ref=e139]
              - generic [ref=e141]: por
              - link "TecnoFusión.it" [ref=e142] [cursor=pointer]:
                - /url: https://tecnofusion-it.web.app/
                - text: TecnoFusión.it
                - img [ref=e143]
    - button "Crear tarea" [ref=e148]:
      - img [ref=e149]
  - button "Open Next.js Dev Tools" [ref=e155] [cursor=pointer]:
    - img [ref=e156]
  - alert [ref=e159]
  - region "Notifications alt+T"
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { loginAsSuperAdmin } from './helpers/auth';
  3   | 
  4   | test.describe('Gestión de Sectores / ABM', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await loginAsSuperAdmin(page);
  7   |     await page.goto('/dashboard/sectores');
  8   |     await page.waitForLoadState('networkidle');
  9   |     await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 }).catch(() => {});
  10  |   });
  11  | 
  12  |   test('página carga con botón "Nuevo Departamento"', async ({ page }) => {
  13  |     await expect(page.locator('button:has-text("Nuevo Departamento")')).toBeVisible({ timeout: 10000 });
  14  |   });
  15  | 
  16  |   test('ALTA — modal abre correctamente', async ({ page }) => {
  17  |     await page.locator('button:has-text("Nuevo Departamento")').click();
  18  | 
  19  |     const modal = page.locator('[role="dialog"]').first();
  20  |     await expect(modal).toBeVisible({ timeout: 5000 });
  21  |     await expect(modal.locator('text=Nuevo Sector/Departamento')).toBeVisible();
  22  | 
  23  |     // Input nombre — primer input del modal
  24  |     await expect(modal.locator('input').first()).toBeVisible();
  25  | 
  26  |     await page.locator('button:has-text("Cancelar")').click();
  27  |     await expect(modal).toBeHidden({ timeout: 5000 });
  28  |   });
  29  | 
  30  |   test('ALTA — validación: sin nombre no cierra el modal', async ({ page }) => {
  31  |     await page.locator('button:has-text("Nuevo Departamento")').click();
  32  | 
  33  |     const modal = page.locator('[role="dialog"]').first();
  34  |     await expect(modal).toBeVisible({ timeout: 5000 });
  35  | 
  36  |     await page.locator('button:has-text("Crear sector")').click();
  37  |     await page.waitForTimeout(500);
  38  |     await expect(modal).toBeVisible();
  39  | 
  40  |     await page.locator('button:has-text("Cancelar")').click();
  41  |   });
  42  | 
  43  |   test('ALTA — crear sector exitosamente', async ({ page }) => {
  44  |     const NAME = `Sector E2E ${Date.now()}`;
  45  | 
> 46  |     await page.locator('button:has-text("Nuevo Departamento")').click();
      |                                                                 ^ Error: locator.click: Test timeout of 40000ms exceeded.
  47  | 
  48  |     const modal = page.locator('[role="dialog"]').first();
  49  |     await expect(modal).toBeVisible({ timeout: 5000 });
  50  | 
  51  |     // Primer input = Nombre (placeholder "Ej: Departamento de IT...")
  52  |     await modal.locator('input').first().fill(NAME);
  53  |     await page.locator('button:has-text("Crear sector")').click();
  54  | 
  55  |     await expect(modal).toBeHidden({ timeout: 10000 });
  56  |     // Usar h3 para evitar colisión con el texto del Toast
  57  |     await expect(page.locator('h3').filter({ hasText: NAME })).toBeVisible({ timeout: 10000 });
  58  |   });
  59  | 
  60  |   test('MODIFICACIÓN — dropdown de sector tiene opción Editar', async ({ page }) => {
  61  |     // Esperar cards
  62  |     const cards = page.locator('.overflow-hidden.border-border\\/50');
  63  |     await page.waitForTimeout(2000);
  64  | 
  65  |     if (await cards.count() === 0) { test.skip(); return; }
  66  | 
  67  |     // Click en botón MoreVertical (3 puntos) de la primera card
  68  |     const moreBtn = cards.first().locator('button').last();
  69  |     await moreBtn.click();
  70  | 
  71  |     // Dropdown debe mostrar "Editar"
  72  |     const editItem = page.locator('[role="menuitem"]:has-text("Editar")');
  73  |     await expect(editItem).toBeVisible({ timeout: 3000 });
  74  | 
  75  |     await editItem.click();
  76  | 
  77  |     // Modal de edición abre con datos
  78  |     const modal = page.locator('[role="dialog"]').first();
  79  |     await expect(modal).toBeVisible({ timeout: 5000 });
  80  | 
  81  |     const nameValue = await modal.locator('input').first().inputValue();
  82  |     expect(nameValue.length).toBeGreaterThan(0);
  83  | 
  84  |     const NEW_NAME = `${nameValue} EDITADO`;
  85  |     await modal.locator('input').first().fill(NEW_NAME);
  86  |     await modal.locator('button:has-text("Guardar"), button:has-text("Actualizar")').first().click();
  87  | 
  88  |     await expect(modal).toBeHidden({ timeout: 10000 });
  89  |     await expect(page.locator('h3').filter({ hasText: NEW_NAME })).toBeVisible({ timeout: 10000 });
  90  |   });
  91  | 
  92  |   test('BAJA — dropdown tiene opción Eliminar con confirm dialog', async ({ page }) => {
  93  |     const cards = page.locator('.overflow-hidden.border-border\\/50');
  94  |     await page.waitForTimeout(2000);
  95  | 
  96  |     if (await cards.count() === 0) { test.skip(); return; }
  97  | 
  98  |     const moreBtn = cards.first().locator('button').last();
  99  |     await moreBtn.click();
  100 | 
  101 |     const deleteItem = page.locator('[role="menuitem"]:has-text("Eliminar")');
  102 |     await expect(deleteItem).toBeVisible({ timeout: 3000 });
  103 |     await deleteItem.click();
  104 | 
  105 |     // Confirm dialog aparece
  106 |     const dialog = page.locator('[role="alertdialog"], [role="dialog"]').last();
  107 |     await expect(dialog).toBeVisible({ timeout: 5000 });
  108 | 
  109 |     // Confirmar eliminación
  110 |     await page.locator('button:has-text("Eliminar"), button:has-text("Sí, eliminar"), button:has-text("Confirmar")').last().click();
  111 |     await expect(dialog).toBeHidden({ timeout: 5000 });
  112 |     
  113 |     // Verificar que el toast de éxito aparece (opcional) o que la card ya no está
  114 |     // Aquí simplemente esperamos que la lista se actualice y el primer elemento ya no sea el mismo
  115 |     await page.waitForTimeout(2000);
  116 |   });
  117 | });
  118 | 
```