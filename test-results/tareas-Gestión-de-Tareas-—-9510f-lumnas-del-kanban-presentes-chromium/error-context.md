# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tareas.spec.ts >> Gestión de Tareas — Kanban >> al menos 3 columnas del kanban presentes
- Location: tests\tareas.spec.ts:16:7

# Error details

```
Error: expect(received).toBeGreaterThanOrEqual(expected)

Expected: >= 3
Received:    2
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
            - generic [ref=e131]:
              - generic [ref=e132]:
                - button "Tablero" [ref=e133]:
                  - img [ref=e134]
                  - text: Tablero
                - button "Calendario" [ref=e139]:
                  - img [ref=e140]
                  - text: Calendario
              - button "Todas las tareas" [ref=e142]:
                - img [ref=e143]
                - generic [ref=e145]: Todas las tareas
                - img [ref=e146]
            - generic [ref=e149]:
              - generic [ref=e150]:
                - button "Todos los locales/sectores" [ref=e151]:
                  - generic [ref=e152]: Todos los locales/sectores
                  - img [ref=e153]
                - button "Todas las prioridades" [ref=e155]:
                  - generic [ref=e156]: Todas las prioridades
                  - img [ref=e157]
                - button "Todos los objetivos" [ref=e159]:
                  - generic [ref=e160]: Todos los objetivos
                  - img [ref=e161]
                - button "Más filtros" [ref=e163]:
                  - img [ref=e164]
                  - text: Más filtros
                - button "Configurar Tablero" [ref=e166]:
                  - img [ref=e167]
                  - text: Configurar Tablero
                - generic [ref=e170]:
                  - button "Selección" [ref=e171]:
                    - img [ref=e172]
                    - text: Selección
                  - button "Nueva tarea" [ref=e175]:
                    - img [ref=e176]
                    - text: Nueva tarea
                    - img [ref=e177]
              - generic [ref=e179]:
                - generic [ref=e181]:
                  - generic [ref=e182]:
                    - generic [ref=e183]:
                      - heading "Por hacer" [level=3] [ref=e185]
                      - generic [ref=e186]: "0"
                    - button [ref=e187]:
                      - img [ref=e188]
                  - paragraph [ref=e191]: Sin tareas
                - generic [ref=e193]:
                  - generic [ref=e194]:
                    - generic [ref=e195]:
                      - heading "En progreso" [level=3] [ref=e197]
                      - generic [ref=e198]: "0"
                    - button [ref=e199]:
                      - img [ref=e200]
                  - paragraph [ref=e203]: Sin tareas
                - generic [ref=e205]:
                  - generic [ref=e206]:
                    - generic [ref=e207]:
                      - heading "Finalizado" [level=3] [ref=e209]
                      - generic [ref=e210]: "0"
                    - button [ref=e211]:
                      - img [ref=e212]
                  - paragraph [ref=e215]: Sin tareas
              - status [ref=e216]
        - contentinfo [ref=e217]:
          - generic [ref=e218]:
            - paragraph [ref=e219]: © 2026 Tablero de Control. Todos los derechos reservados.
            - generic [ref=e220]:
              - generic [ref=e221]: Hecho con
              - img [ref=e222]
              - generic [ref=e224]: por
              - link "TecnoFusión.it" [ref=e225] [cursor=pointer]:
                - /url: https://tecnofusion-it.web.app/
                - text: TecnoFusión.it
                - img [ref=e226]
    - button "Crear tarea" [ref=e231]:
      - img [ref=e232]
  - button "Open Next.js Dev Tools" [ref=e238] [cursor=pointer]:
    - img [ref=e239]
  - alert [ref=e242]
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
> 22  |     expect(found).toBeGreaterThanOrEqual(3);
      |                   ^ Error: expect(received).toBeGreaterThanOrEqual(expected)
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
```