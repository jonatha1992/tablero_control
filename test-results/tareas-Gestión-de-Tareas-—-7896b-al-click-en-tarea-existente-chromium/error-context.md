# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tareas.spec.ts >> Gestión de Tareas — Kanban >> modal detalle abre al click en tarea existente
- Location: tests\tareas.spec.ts:66:7

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
          - generic [ref=e103]:
            - heading "Tareas" [level=1] [ref=e105]
            - generic [ref=e107]:
              - img [ref=e108]
              - textbox "Buscar tareas..." [ref=e111]
          - generic [ref=e112]:
            - button "Notificaciones" [ref=e114]:
              - img [ref=e115]
            - generic [ref=e118]:
              - generic [ref=e120]: TA
              - generic [ref=e121]:
                - generic [ref=e122]: TecnoFusión Admin
                - generic [ref=e123]: Super Admin
            - button "Cerrar sesión" [ref=e124]:
              - img [ref=e125]
        - main [ref=e128]:
          - generic [ref=e129]:
            - generic [ref=e130]:
              - generic [ref=e131]:
                - generic [ref=e132]:
                  - button "Tablero" [ref=e133]:
                    - img [ref=e134]
                    - text: Tablero
                  - button "Calendario" [active] [ref=e139]:
                    - img [ref=e140]
                    - text: Calendario
                - button "Todas las tareas" [ref=e142]:
                  - img [ref=e143]
                  - generic [ref=e145]: Todas las tareas
                  - img [ref=e146]
              - button "Nueva tarea" [ref=e148]:
                - img [ref=e149]
                - text: Nueva tarea
            - generic [ref=e153]:
              - generic [ref=e154]:
                - generic [ref=e155]:
                  - generic [ref=e156]:
                    - button "Previous month" [ref=e157] [cursor=pointer]:
                      - img [ref=e158]: 
                    - button "Next month" [ref=e159] [cursor=pointer]:
                      - img [ref=e160]: 
                  - button "today" [disabled] [ref=e161]
                - heading "mayo de 2026" [level=2] [ref=e163]
                - generic [ref=e165]:
                  - button "month" [pressed] [ref=e166] [cursor=pointer]
                  - button "week" [ref=e167] [cursor=pointer]
                  - button "list" [ref=e168] [cursor=pointer]
              - generic "mayo de 2026" [ref=e169]:
                - grid [ref=e171]:
                  - rowgroup [ref=e172]:
                    - row "domingo lunes martes miércoles jueves viernes sábado" [ref=e176]:
                      - columnheader "domingo" [ref=e177]:
                        - generic "domingo" [ref=e179]: dom
                      - columnheader "lunes" [ref=e180]:
                        - generic "lunes" [ref=e182]: lun
                      - columnheader "martes" [ref=e183]:
                        - generic "martes" [ref=e185]: mar
                      - columnheader "miércoles" [ref=e186]:
                        - generic "miércoles" [ref=e188]: mié
                      - columnheader "jueves" [ref=e189]:
                        - generic "jueves" [ref=e191]: jue
                      - columnheader "viernes" [ref=e192]:
                        - generic "viernes" [ref=e194]: vie
                      - columnheader "sábado" [ref=e195]:
                        - generic "sábado" [ref=e197]: sáb
                  - rowgroup [ref=e198]:
                    - generic [ref=e201]:
                      - row "26 de abril de 2026 27 de abril de 2026 28 de abril de 2026 29 de abril de 2026 30 de abril de 2026 1 de mayo de 2026 2 de mayo de 2026" [ref=e203]:
                        - gridcell "26 de abril de 2026" [ref=e204]:
                          - generic "26 de abril de 2026" [ref=e207]: "26"
                        - gridcell "27 de abril de 2026" [ref=e209]:
                          - generic "27 de abril de 2026" [ref=e212]: "27"
                        - gridcell "28 de abril de 2026" [ref=e214]:
                          - generic "28 de abril de 2026" [ref=e217]: "28"
                        - gridcell "29 de abril de 2026" [ref=e219]:
                          - generic "29 de abril de 2026" [ref=e222]: "29"
                        - gridcell "30 de abril de 2026" [ref=e224]:
                          - generic "30 de abril de 2026" [ref=e227]: "30"
                        - gridcell "1 de mayo de 2026" [ref=e229]:
                          - generic "1 de mayo de 2026" [ref=e232]: "1"
                        - gridcell "2 de mayo de 2026" [ref=e234]:
                          - generic "2 de mayo de 2026" [ref=e237]: "2"
                      - row "3 de mayo de 2026 4 de mayo de 2026 5 de mayo de 2026 6 de mayo de 2026 7 de mayo de 2026 8 de mayo de 2026 9 de mayo de 2026" [ref=e239]:
                        - gridcell "3 de mayo de 2026" [ref=e240]:
                          - generic "3 de mayo de 2026" [ref=e243]: "3"
                        - gridcell "4 de mayo de 2026" [ref=e245]:
                          - generic "4 de mayo de 2026" [ref=e248]: "4"
                        - gridcell "5 de mayo de 2026" [ref=e250]:
                          - generic "5 de mayo de 2026" [ref=e253]: "5"
                        - gridcell "6 de mayo de 2026" [ref=e255]:
                          - generic "6 de mayo de 2026" [ref=e258]: "6"
                        - gridcell "7 de mayo de 2026" [ref=e260]:
                          - generic "7 de mayo de 2026" [ref=e263]: "7"
                        - gridcell "8 de mayo de 2026" [ref=e265]:
                          - generic "8 de mayo de 2026" [ref=e268]: "8"
                        - gridcell "9 de mayo de 2026" [ref=e270]:
                          - generic "9 de mayo de 2026" [ref=e273]: "9"
                      - row "10 de mayo de 2026 11 de mayo de 2026 12 de mayo de 2026 13 de mayo de 2026 14 de mayo de 2026 15 de mayo de 2026 16 de mayo de 2026" [ref=e275]:
                        - gridcell "10 de mayo de 2026" [ref=e276]:
                          - generic "10 de mayo de 2026" [ref=e279]: "10"
                        - gridcell "11 de mayo de 2026" [ref=e281]:
                          - generic "11 de mayo de 2026" [ref=e284]: "11"
                        - gridcell "12 de mayo de 2026" [ref=e286]:
                          - generic "12 de mayo de 2026" [ref=e289]: "12"
                        - gridcell "13 de mayo de 2026" [ref=e291]:
                          - generic "13 de mayo de 2026" [ref=e294]: "13"
                        - gridcell "14 de mayo de 2026" [ref=e296]:
                          - generic "14 de mayo de 2026" [ref=e299]: "14"
                        - gridcell "15 de mayo de 2026" [ref=e301]:
                          - generic "15 de mayo de 2026" [ref=e304]: "15"
                        - gridcell "16 de mayo de 2026" [ref=e306]:
                          - generic "16 de mayo de 2026" [ref=e309]: "16"
                      - row "17 de mayo de 2026 18 de mayo de 2026 19 de mayo de 2026 20 de mayo de 2026 21 de mayo de 2026 22 de mayo de 2026 23 de mayo de 2026" [ref=e311]:
                        - gridcell "17 de mayo de 2026" [ref=e312]:
                          - generic "17 de mayo de 2026" [ref=e315]: "17"
                        - gridcell "18 de mayo de 2026" [ref=e317]:
                          - generic "18 de mayo de 2026" [ref=e320]: "18"
                        - gridcell "19 de mayo de 2026" [ref=e322]:
                          - generic "19 de mayo de 2026" [ref=e325]: "19"
                        - gridcell "20 de mayo de 2026" [ref=e327]:
                          - generic "20 de mayo de 2026" [ref=e330]: "20"
                        - gridcell "21 de mayo de 2026" [ref=e332]:
                          - generic "21 de mayo de 2026" [ref=e335]: "21"
                        - gridcell "22 de mayo de 2026" [ref=e337]:
                          - generic "22 de mayo de 2026" [ref=e340]: "22"
                        - gridcell "23 de mayo de 2026" [ref=e342]:
                          - generic "23 de mayo de 2026" [ref=e345]: "23"
                      - row "24 de mayo de 2026 25 de mayo de 2026 26 de mayo de 2026 27 de mayo de 2026 28 de mayo de 2026 29 de mayo de 2026 30 de mayo de 2026" [ref=e347]:
                        - gridcell "24 de mayo de 2026" [ref=e348]:
                          - generic "24 de mayo de 2026" [ref=e351]: "24"
                        - gridcell "25 de mayo de 2026" [ref=e353]:
                          - generic "25 de mayo de 2026" [ref=e356]: "25"
                        - gridcell "26 de mayo de 2026" [ref=e358]:
                          - generic "26 de mayo de 2026" [ref=e361]: "26"
                        - gridcell "27 de mayo de 2026" [ref=e363]:
                          - generic "27 de mayo de 2026" [ref=e366]: "27"
                        - gridcell "28 de mayo de 2026" [ref=e368]:
                          - generic "28 de mayo de 2026" [ref=e371]: "28"
                        - gridcell "29 de mayo de 2026" [ref=e373]:
                          - generic "29 de mayo de 2026" [ref=e376]: "29"
                        - gridcell "30 de mayo de 2026" [ref=e378]:
                          - generic "30 de mayo de 2026" [ref=e381]: "30"
                      - row "31 de mayo de 2026 1 de junio de 2026 2 de junio de 2026 3 de junio de 2026 4 de junio de 2026 5 de junio de 2026 6 de junio de 2026" [ref=e383]:
                        - gridcell "31 de mayo de 2026" [ref=e384]:
                          - generic "31 de mayo de 2026" [ref=e387]: "31"
                        - gridcell "1 de junio de 2026" [ref=e389]:
                          - generic "1 de junio de 2026" [ref=e392]: "1"
                        - gridcell "2 de junio de 2026" [ref=e394]:
                          - generic "2 de junio de 2026" [ref=e397]: "2"
                        - gridcell "3 de junio de 2026" [ref=e399]:
                          - generic "3 de junio de 2026" [ref=e402]: "3"
                        - gridcell "4 de junio de 2026" [ref=e404]:
                          - generic "4 de junio de 2026" [ref=e407]: "4"
                        - gridcell "5 de junio de 2026" [ref=e409]:
                          - generic "5 de junio de 2026" [ref=e412]: "5"
                        - gridcell "6 de junio de 2026" [ref=e414]:
                          - generic "6 de junio de 2026" [ref=e417]: "6"
        - contentinfo [ref=e419]:
          - generic [ref=e420]:
            - paragraph [ref=e421]: © 2026 Tablero de Control. Todos los derechos reservados.
            - generic [ref=e422]:
              - generic [ref=e423]: Hecho con
              - img [ref=e424]
              - generic [ref=e426]: por
              - link "TecnoFusión.it" [ref=e427] [cursor=pointer]:
                - /url: https://tecnofusion-it.web.app/
                - text: TecnoFusión.it
                - img [ref=e428]
    - button "Crear tarea" [ref=e433]:
      - img [ref=e434]
  - button "Open Next.js Dev Tools" [ref=e440] [cursor=pointer]:
    - img [ref=e441]
  - alert [ref=e444]
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
  42  |     await page.locator('button:has-text("Nueva tarea")').click();
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
> 78  |     await expect(modal).toBeVisible({ timeout: 8000 });
      |                         ^ Error: expect(locator).toBeVisible() failed
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