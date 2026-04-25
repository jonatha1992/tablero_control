# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tareas.spec.ts >> Gestión de Tareas — Kanban >> crear tarea nueva aparece en el board
- Location: tests\tareas.spec.ts:38:7

# Error details

```
Test timeout of 40000ms exceeded.
```

```
Error: locator.click: Test timeout of 40000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Nueva tarea")')

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
            - link "Calendario" [ref=e32] [cursor=pointer]:
              - /url: /dashboard/calendario
              - img [ref=e33]
              - generic [ref=e35]: Calendario
            - link "Equipo" [ref=e36] [cursor=pointer]:
              - /url: /dashboard/equipo
              - img [ref=e37]
              - generic [ref=e42]: Equipo
            - link "Facturación" [ref=e43] [cursor=pointer]:
              - /url: /dashboard/billing
              - img [ref=e44]
              - generic [ref=e46]: Facturación
            - link "Configuración" [ref=e47] [cursor=pointer]:
              - /url: /dashboard/config
              - img [ref=e48]
              - generic [ref=e51]: Configuración
          - paragraph [ref=e53]: v0.1.0 · En desarrollo
      - generic [ref=e54]:
        - banner [ref=e55]:
          - generic [ref=e57]:
            - heading "Tareas" [level=1] [ref=e58]
            - paragraph [ref=e59]: Kanban con drag & drop
          - generic [ref=e61]:
            - img [ref=e62]
            - textbox "Buscar tareas, proyectos..." [ref=e65]
          - generic [ref=e66]:
            - button [ref=e67]:
              - img [ref=e68]
            - generic [ref=e71]:
              - img "TecnoFusión Admin" [ref=e73]
              - generic [ref=e74]:
                - generic [ref=e75]: TecnoFusión Admin
                - generic [ref=e76]: Solo lectura
            - button "Cerrar sesión" [ref=e77]:
              - img [ref=e78]
        - main [ref=e81]:
          - generic [ref=e84]:
            - generic [ref=e85]:
              - generic [ref=e86]:
                - img [ref=e87]
                - textbox "Buscar tareas..." [ref=e90]
              - combobox [ref=e91]:
                - option "Todos los locales/sectores" [selected]
                - option "Sector E2E 1777114401781 (department)"
                - option "Sector E2E 1777114414364 (department)"
                - option "Sector E2E 1777114460809 (department)"
                - option "Sector E2E 1777114473266 (department)"
                - option "Sector E2E 1777114653437 (department)"
                - option "Sector E2E 1777115216442 (department)"
                - option "Sector E2E 1777115557819 (department)"
              - combobox [ref=e92]:
                - option "Todas las prioridades" [selected]
                - option "Urgente"
                - option "Alta"
                - option "Media"
                - option "Baja"
              - button "Más filtros" [ref=e93]:
                - img [ref=e94]
                - text: Más filtros
              - button "Configurar Tablero" [ref=e97]:
                - img [ref=e98]
                - text: Configurar Tablero
            - generic [ref=e101]:
              - generic [ref=e102]:
                - generic [ref=e103]:
                  - generic [ref=e104]:
                    - heading "Por hacer" [level=3] [ref=e106]
                    - generic [ref=e107]: "14"
                  - button [ref=e108]:
                    - img [ref=e109]
                - generic [ref=e110]:
                  - button "E2E Tarea 1777061537485 Media 23 abr" [ref=e111]:
                    - generic [ref=e112]:
                      - generic [ref=e113]:
                        - img [ref=e114]
                        - heading "E2E Tarea 1777061537485" [level=4] [ref=e121]
                      - button [ref=e122]:
                        - img [ref=e123]
                    - generic [ref=e127]:
                      - button "Media" [ref=e128]:
                        - img [ref=e129]
                        - text: Media
                      - generic [ref=e132]:
                        - img [ref=e133]
                        - generic [ref=e136]: 23 abr
                  - button "E2E Tarea 1777061698687 Media 23 abr" [ref=e137]:
                    - generic [ref=e138]:
                      - generic [ref=e139]:
                        - img [ref=e140]
                        - heading "E2E Tarea 1777061698687" [level=4] [ref=e147]
                      - button [ref=e148]:
                        - img [ref=e149]
                    - generic [ref=e153]:
                      - button "Media" [ref=e154]:
                        - img [ref=e155]
                        - text: Media
                      - generic [ref=e158]:
                        - img [ref=e159]
                        - generic [ref=e162]: 23 abr
                  - button "E2E Tarea 1777061708880 Media 23 abr" [ref=e163]:
                    - generic [ref=e164]:
                      - generic [ref=e165]:
                        - img [ref=e166]
                        - heading "E2E Tarea 1777061708880" [level=4] [ref=e173]
                      - button [ref=e174]:
                        - img [ref=e175]
                    - generic [ref=e179]:
                      - button "Media" [ref=e180]:
                        - img [ref=e181]
                        - text: Media
                      - generic [ref=e184]:
                        - img [ref=e185]
                        - generic [ref=e188]: 23 abr
                  - button "Test Task Edited Media 23 abr" [ref=e189]:
                    - generic [ref=e190]:
                      - generic [ref=e191]:
                        - img [ref=e192]
                        - heading "Test Task Edited" [level=4] [ref=e199]
                      - button [ref=e200]:
                        - img [ref=e201]
                    - generic [ref=e205]:
                      - button "Media" [ref=e206]:
                        - img [ref=e207]
                        - text: Media
                      - generic [ref=e210]:
                        - img [ref=e211]
                        - generic [ref=e214]: 23 abr
                  - button "E2E Tarea 1777063966035 Media 23 abr" [ref=e215]:
                    - generic [ref=e216]:
                      - generic [ref=e217]:
                        - img [ref=e218]
                        - heading "E2E Tarea 1777063966035" [level=4] [ref=e225]
                      - button [ref=e226]:
                        - img [ref=e227]
                    - generic [ref=e231]:
                      - button "Media" [ref=e232]:
                        - img [ref=e233]
                        - text: Media
                      - generic [ref=e236]:
                        - img [ref=e237]
                        - generic [ref=e240]: 23 abr
                  - button "E2E Tarea 1777114527683 Media 24 abr" [ref=e241]:
                    - generic [ref=e242]:
                      - generic [ref=e243]:
                        - img [ref=e244]
                        - heading "E2E Tarea 1777114527683" [level=4] [ref=e251]
                      - button [ref=e252]:
                        - img [ref=e253]
                    - generic [ref=e257]:
                      - button "Media" [ref=e258]:
                        - img [ref=e259]
                        - text: Media
                      - generic [ref=e262]:
                        - img [ref=e263]
                        - generic [ref=e266]: 24 abr
                  - button "E2E Tarea 1777114539987 Media 24 abr" [ref=e267]:
                    - generic [ref=e268]:
                      - generic [ref=e269]:
                        - img [ref=e270]
                        - heading "E2E Tarea 1777114539987" [level=4] [ref=e277]
                      - button [ref=e278]:
                        - img [ref=e279]
                    - generic [ref=e283]:
                      - button "Media" [ref=e284]:
                        - img [ref=e285]
                        - text: Media
                      - generic [ref=e288]:
                        - img [ref=e289]
                        - generic [ref=e292]: 24 abr
                  - button "E2E Tarea 1777114715341 Media 24 abr" [ref=e293]:
                    - generic [ref=e294]:
                      - generic [ref=e295]:
                        - img [ref=e296]
                        - heading "E2E Tarea 1777114715341" [level=4] [ref=e303]
                      - button [ref=e304]:
                        - img [ref=e305]
                    - generic [ref=e309]:
                      - button "Media" [ref=e310]:
                        - img [ref=e311]
                        - text: Media
                      - generic [ref=e314]:
                        - img [ref=e315]
                        - generic [ref=e318]: 24 abr
                  - button "E2E Tarea 1777114739355 Media 24 abr" [ref=e319]:
                    - generic [ref=e320]:
                      - generic [ref=e321]:
                        - img [ref=e322]
                        - heading "E2E Tarea 1777114739355" [level=4] [ref=e329]
                      - button [ref=e330]:
                        - img [ref=e331]
                    - generic [ref=e335]:
                      - button "Media" [ref=e336]:
                        - img [ref=e337]
                        - text: Media
                      - generic [ref=e340]:
                        - img [ref=e341]
                        - generic [ref=e344]: 24 abr
                  - button "E2E Tarea 1777114949791 Media 24 abr" [ref=e345]:
                    - generic [ref=e346]:
                      - generic [ref=e347]:
                        - img [ref=e348]
                        - heading "E2E Tarea 1777114949791" [level=4] [ref=e355]
                      - button [ref=e356]:
                        - img [ref=e357]
                    - generic [ref=e361]:
                      - button "Media" [ref=e362]:
                        - img [ref=e363]
                        - text: Media
                      - generic [ref=e366]:
                        - img [ref=e367]
                        - generic [ref=e370]: 24 abr
                  - button "E2E Tarea 1777114973585 Media 24 abr" [ref=e371]:
                    - generic [ref=e372]:
                      - generic [ref=e373]:
                        - img [ref=e374]
                        - heading "E2E Tarea 1777114973585" [level=4] [ref=e381]
                      - button [ref=e382]:
                        - img [ref=e383]
                    - generic [ref=e387]:
                      - button "Media" [ref=e388]:
                        - img [ref=e389]
                        - text: Media
                      - generic [ref=e392]:
                        - img [ref=e393]
                        - generic [ref=e396]: 24 abr
                  - button "E2E Tarea 1777114997494 Media 24 abr" [ref=e397]:
                    - generic [ref=e398]:
                      - generic [ref=e399]:
                        - img [ref=e400]
                        - heading "E2E Tarea 1777114997494" [level=4] [ref=e407]
                      - button [ref=e408]:
                        - img [ref=e409]
                    - generic [ref=e413]:
                      - button "Media" [ref=e414]:
                        - img [ref=e415]
                        - text: Media
                      - generic [ref=e418]:
                        - img [ref=e419]
                        - generic [ref=e422]: 24 abr
                  - button "E2E Tarea 1777115021604 Media 24 abr" [ref=e423]:
                    - generic [ref=e424]:
                      - generic [ref=e425]:
                        - img [ref=e426]
                        - heading "E2E Tarea 1777115021604" [level=4] [ref=e433]
                      - button [ref=e434]:
                        - img [ref=e435]
                    - generic [ref=e439]:
                      - button "Media" [ref=e440]:
                        - img [ref=e441]
                        - text: Media
                      - generic [ref=e444]:
                        - img [ref=e445]
                        - generic [ref=e448]: 24 abr
                  - button "Final verify toast Baja 23 abr" [ref=e449]:
                    - generic [ref=e450]:
                      - generic [ref=e451]:
                        - img [ref=e452]
                        - heading "Final verify toast" [level=4] [ref=e459]
                      - button [ref=e460]:
                        - img [ref=e461]
                    - generic [ref=e465]:
                      - button "Baja" [ref=e466]:
                        - img [ref=e467]
                        - text: Baja
                      - generic [ref=e470]:
                        - img [ref=e471]
                        - generic [ref=e474]: 23 abr
              - generic [ref=e475]:
                - generic [ref=e476]:
                  - generic [ref=e477]:
                    - heading "En progreso" [level=3] [ref=e479]
                    - generic [ref=e480]: "0"
                  - button [ref=e481]:
                    - img [ref=e482]
                - paragraph [ref=e485]: Sin tareas
              - generic [ref=e486]:
                - generic [ref=e487]:
                  - generic [ref=e488]:
                    - heading "Completada" [level=3] [ref=e490]
                    - generic [ref=e491]: "2"
                  - button [ref=e492]:
                    - img [ref=e493]
                - generic [ref=e494]:
                  - button "Tarea de prueba ABM Alta 23 abr" [ref=e495]:
                    - generic [ref=e496]:
                      - generic [ref=e497]:
                        - img [ref=e498]
                        - heading "Tarea de prueba ABM" [level=4] [ref=e505]
                      - button [ref=e506]:
                        - img [ref=e507]
                    - generic [ref=e511]:
                      - button "Alta" [ref=e512]:
                        - img [ref=e513]
                        - text: Alta
                      - generic [ref=e516]:
                        - img [ref=e517]
                        - generic [ref=e520]: 23 abr
                  - button "Toast test task Media 23 abr" [ref=e521]:
                    - generic [ref=e522]:
                      - generic [ref=e523]:
                        - img [ref=e524]
                        - heading "Toast test task" [level=4] [ref=e531]
                      - button [ref=e532]:
                        - img [ref=e533]
                    - generic [ref=e537]:
                      - button "Media" [ref=e538]:
                        - img [ref=e539]
                        - text: Media
                      - generic [ref=e542]:
                        - img [ref=e543]
                        - generic [ref=e546]: 23 abr
            - status [ref=e547]
        - contentinfo [ref=e548]:
          - generic [ref=e549]:
            - paragraph [ref=e550]: © 2026 Tablero de Control. Todos los derechos reservados.
            - generic [ref=e551]:
              - generic [ref=e552]: Hecho con
              - img [ref=e553]
              - generic [ref=e555]: por
              - link "TecnoFusión.it" [ref=e556] [cursor=pointer]:
                - /url: https://tecnofusion-it.web.app/
                - text: TecnoFusión.it
                - img [ref=e557]
    - button "Agregar una tarea rápidamente" [ref=e561]:
      - img [ref=e562]
  - button "Open Next.js Dev Tools" [ref=e568] [cursor=pointer]:
    - img [ref=e569]
  - alert [ref=e572]
  - region "Notifications alt+T"
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { loginAsSuperAdmin } from './helpers/auth';
  3   | 
  4   | test.describe('Gestión de Tareas — Kanban', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await loginAsSuperAdmin(page);
  7   |     await page.goto('/dashboard/tareas');
  8   |     await page.waitForLoadState('networkidle');
  9   |     await page.waitForSelector('text=Cargando tareas...', { state: 'hidden', timeout: 15000 }).catch(() => {});
  10  |   });
  11  | 
  12  |   test('kanban board carga — columna "Por hacer" visible', async ({ page }) => {
  13  |     await expect(page.locator('text=Por hacer')).toBeVisible({ timeout: 15000 });
  14  |   });
  15  | 
  16  |   test('al menos 3 columnas del kanban presentes', async ({ page }) => {
  17  |     const columnNames = ['Por hacer', 'En progreso', 'Completada', 'Backlog', 'Bloqueado', 'En revisión'];
  18  |     let found = 0;
  19  |     for (const name of columnNames) {
  20  |       if (await page.locator(`text=${name}`).count() > 0) found++;
  21  |     }
  22  |     expect(found).toBeGreaterThanOrEqual(3);
  23  |   });
  24  | 
  25  |   test('input de búsqueda filtra tareas', async ({ page }) => {
  26  |     // Usar el input del kanban (no el del header)
  27  |     const searchInput = page.locator('input[placeholder="Buscar tareas..."]');
  28  |     await expect(searchInput).toBeVisible({ timeout: 10000 });
  29  | 
  30  |     await searchInput.fill('xyz-test-busqueda-inexistente-abc');
  31  |     await page.waitForTimeout(600);
  32  |     // Columnas deben mostrar "Sin tareas" o estar vacías
  33  |     const sinTareas = page.locator('text=Sin tareas');
  34  |     await expect(sinTareas.first()).toBeVisible({ timeout: 5000 });
  35  |     await searchInput.clear();
  36  |   });
  37  | 
  38  |   test('crear tarea nueva aparece en el board', async ({ page }) => {
  39  |     const TITLE = `E2E Tarea ${Date.now()}`;
  40  | 
  41  |     // Botón "Nueva tarea" en esquina superior derecha
> 42  |     await page.locator('button:has-text("Nueva tarea")').click();
      |                                                          ^ Error: locator.click: Test timeout of 40000ms exceeded.
  43  | 
  44  |     const modal = page.locator('[role="dialog"]').first();
  45  |     await expect(modal).toBeVisible({ timeout: 8000 });
  46  | 
  47  |     // Título
  48  |     const titleInput = modal.locator('input[placeholder*="título"], input[placeholder*="Título"], input[name="title"]').first();
  49  |     await titleInput.fill(TITLE);
  50  |     await expect(titleInput).toHaveValue(TITLE);
  51  | 
  52  |     // Submit
  53  |     const submitBtn = modal.locator('button[type="submit"]').filter({ hasText: /Crear/ });
  54  |     await expect(submitBtn).toBeEnabled();
  55  |     await submitBtn.click();
  56  |     
  57  |     await expect(modal).toBeHidden({ timeout: 15000 });
  58  | 
  59  |     // Tarea aparece en el board. Buscamos el texto exacto.
  60  |     // Usamos retry para manejar hidratación o delay en el refresh de React Query
  61  |     const card = page.getByText(TITLE, { exact: true });
  62  |     await expect(card.first()).toBeVisible({ timeout: 20000 });
  63  |     await card.first().scrollIntoViewIfNeeded();
  64  |   });
  65  | 
  66  |   test('modal detalle abre al click en tarea existente', async ({ page }) => {
  67  |     // Esperar que carguen las tareas
  68  |     await expect(page.locator('text=Por hacer')).toBeVisible({ timeout: 15000 });
  69  | 
  70  |     // Buscar cualquier card de tarea (tienen clase específica o data-testid)
  71  |     const cards = page.locator('[data-testid="kanban-card"], .group.cursor-pointer, [class*="rounded-lg"][class*="border"]').filter({ hasText: /\w/ });
  72  |     const count = await cards.count();
  73  | 
  74  |     if (count === 0) { test.skip(); return; }
  75  | 
  76  |     await cards.first().click();
  77  |     const modal = page.locator('[role="dialog"]').first();
  78  |     await expect(modal).toBeVisible({ timeout: 8000 });
  79  |     
  80  |     // Probar edición de título
  81  |     await modal.locator('button:has-text("Editar")').click();
  82  |     const titleInput = modal.locator('input[type="text"]').first();
  83  |     const oldTitle = await titleInput.inputValue();
  84  |     const NEW_TITLE = `${oldTitle} MOD`;
  85  |     await titleInput.fill(NEW_TITLE);
  86  |     await modal.locator('button:has-text("Guardar")').click();
  87  |     await expect(modal.locator('button:has-text("Guardar")')).toBeHidden();
  88  |     
  89  |     // Probar cambio de estado
  90  |     const statusSelect = modal.locator('select').first();
  91  |     await statusSelect.selectOption('in_progress');
  92  |     await page.waitForTimeout(1000); // Esperar mutación
  93  | 
  94  |     await page.keyboard.press('Escape');
  95  |     await expect(modal).toBeHidden({ timeout: 5000 });
  96  |     
  97  |     // Verificar que aparece en la columna En Progreso (opcional si hay tiempo)
  98  |     await expect(page.locator('[data-testid="kanban-card"], .group.cursor-pointer').filter({ hasText: NEW_TITLE })).toBeVisible();
  99  |   });
  100 | 
  101 |   test('eliminar tarea desde el modal', async ({ page }) => {
  102 |     await expect(page.locator('text=Por hacer')).toBeVisible({ timeout: 15000 });
  103 |     const cards = page.locator('[data-testid="kanban-card"], .group.cursor-pointer, [class*="rounded-lg"][class*="border"]').filter({ hasText: /\w/ });
  104 |     if (await cards.count() === 0) { test.skip(); return; }
  105 | 
  106 |     const taskTitle = await cards.first().innerText();
  107 |     await cards.first().click();
  108 |     const modal = page.locator('[role="dialog"]').first();
  109 |     await expect(modal).toBeVisible({ timeout: 8000 });
  110 | 
  111 |     // Click en botón basura (destructive)
  112 |     await modal.locator('button.bg-destructive, button:has(svg.lucide-trash)').click();
  113 |     
  114 |     // ConfirmDialog
  115 |     const confirmDialog = page.locator('[role="alertdialog"], [role="dialog"]').last();
  116 |     await expect(confirmDialog).toBeVisible({ timeout: 5000 });
  117 |     await confirmDialog.locator('button:has-text("Eliminar")').click();
  118 | 
  119 |     await expect(confirmDialog).toBeHidden();
  120 |     await expect(modal).toBeHidden();
  121 |     
  122 |     // Verificar que ya no está (puede tardar un poco en actualizar)
  123 |     await expect(page.locator(`text=${taskTitle}`)).toBeHidden({ timeout: 10000 });
  124 |   });
  125 | 
  126 |   test('botón "Configurar Tablero" existe', async ({ page }) => {
  127 |     await expect(page.locator('button:has-text("Configurar Tablero")')).toBeVisible({ timeout: 10000 });
  128 |   });
  129 | 
  130 |   test('botón FAB "+" existe para crear tarea rápida', async ({ page }) => {
  131 |     // FAB en esquina inferior derecha
  132 |     const fab = page.locator('button.fixed.bottom-10, button[class*="fixed"][class*="rounded-full"]');
  133 |     await expect(fab.first()).toBeVisible({ timeout: 5000 });
  134 |   });
  135 | });
  136 | 
```