# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tareas.spec.ts >> Gestión de Tareas — Kanban >> crear tarea nueva aparece en el board
- Location: tests\tareas.spec.ts:38:7

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
- generic:
  - generic:
    - generic:
      - complementary:
        - generic:
          - generic:
            - link:
              - /url: /
              - img
              - generic: Tablero Control
            - button:
              - img
          - navigation:
            - link:
              - /url: /dashboard
              - img
              - generic: Dashboard
            - link:
              - /url: /dashboard/sectores
              - img
              - generic: Departamentos
            - link:
              - /url: /dashboard/tareas
              - img
              - generic: Tareas
            - link:
              - /url: /dashboard/ciclos
              - img
              - generic: Períodos
            - link:
              - /url: /dashboard/objetivos
              - img
              - generic: Objetivos
            - link:
              - /url: /dashboard/calendario
              - img
              - generic: Calendario
            - link:
              - /url: /dashboard/cronograma
              - img
              - generic: Cronograma
            - link:
              - /url: /dashboard/equipo
              - img
              - generic: Equipo
            - link:
              - /url: /dashboard/billing
              - img
              - generic: Facturación
            - link:
              - /url: /dashboard/config
              - img
              - generic: Configuración
            - generic:
              - paragraph: Administración
              - generic:
                - link:
                  - /url: /superadmin
                  - img
                  - generic: Plataforma
                - link:
                  - /url: /superadmin/businesses
                  - img
                  - generic: Negocios
                - link:
                  - /url: /superadmin/users
                  - img
                  - generic: Usuarios
                - link:
                  - /url: /superadmin/subscriptions
                  - img
                  - generic: Suscripciones
                - link:
                  - /url: /superadmin/planes
                  - img
                  - generic: Planes
                - link:
                  - /url: /superadmin/audit
                  - img
                  - generic: Auditoría
          - generic:
            - paragraph: v0.1.0 · En desarrollo
      - generic:
        - banner:
          - generic:
            - generic:
              - heading [level=1]: Tareas
            - generic:
              - generic:
                - img
                - textbox:
                  - /placeholder: Buscar tareas...
          - generic:
            - generic:
              - button:
                - img
            - generic:
              - generic:
                - generic: TA
              - generic:
                - generic: TecnoFusión Admin
                - generic: Super Admin
            - button:
              - img
        - main:
          - generic:
            - generic:
              - generic:
                - generic:
                  - button:
                    - img
                    - text: Tablero
                  - button:
                    - img
                    - text: Calendario
                - button:
                  - img
                  - generic: Todas las tareas
                  - img
            - generic:
              - generic:
                - generic:
                  - button:
                    - generic: Todos los locales/sectores
                    - img
                  - button:
                    - generic: Todas las prioridades
                    - img
                  - button:
                    - generic: Todos los objetivos
                    - img
                  - button:
                    - img
                    - text: Más filtros
                  - button:
                    - img
                    - text: Configurar Tablero
                  - generic:
                    - button:
                      - img
                      - text: Selección
                    - button [expanded]:
                      - img
                      - text: Nueva tarea
                      - img
                - generic:
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - heading [level=3]: Por hacer
                          - generic: "0"
                        - button:
                          - img
                      - generic:
                        - generic:
                          - paragraph: Sin tareas
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - heading [level=3]: En progreso
                          - generic: "0"
                        - button:
                          - img
                      - generic:
                        - generic:
                          - paragraph: Sin tareas
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - heading [level=3]: Finalizado
                          - generic: "0"
                        - button:
                          - img
                      - generic:
                        - generic:
                          - paragraph: Sin tareas
                - status
        - contentinfo:
          - generic:
            - paragraph: © 2026 Tablero de Control. Todos los derechos reservados.
            - generic:
              - generic: Hecho con
              - img
              - generic: por
              - link:
                - /url: https://tecnofusion-it.web.app/
                - text: TecnoFusión.it
                - img
    - generic:
      - button:
        - img
  - button "Open Next.js Dev Tools" [ref=e6] [cursor=pointer]:
    - img [ref=e7]
  - alert
  - region "Notifications alt+T"
  - menu "Nueva tarea" [active] [ref=e10]:
    - menuitem "Formulario Campo por campo" [ref=e11] [cursor=pointer]:
      - generic [ref=e12]:
        - img
      - generic [ref=e13]:
        - paragraph [ref=e14]: Formulario
        - paragraph [ref=e15]: Campo por campo
    - menuitem "Crear con IA Chat o voz" [ref=e16] [cursor=pointer]:
      - generic [ref=e17]:
        - img
      - generic [ref=e18]:
        - paragraph [ref=e19]: Crear con IA
        - paragraph [ref=e20]: Chat o voz
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
> 45  |     await expect(modal).toBeVisible({ timeout: 8000 });
      |                         ^ Error: expect(locator).toBeVisible() failed
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