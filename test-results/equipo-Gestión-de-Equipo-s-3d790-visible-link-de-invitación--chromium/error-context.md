# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: equipo.spec.ts >> Gestión de Equipo >> sección de invitaciones visible (link de invitación)
- Location: tests\equipo.spec.ts:109:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: button:has-text("Link de invitación"), button:has-text("Generar link"), text=Links de invitación >> nth=0
Expected: visible
Error: Unexpected token "=" while parsing css selector "button:has-text("Link de invitación"), button:has-text("Generar link"), text=Links de invitación". Did you mean to CSS.escape it?

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for button:has-text("Link de invitación"), button:has-text("Generar link"), text=Links de invitación >> nth=0

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
            - link "Tareas" [ref=e21] [cursor=pointer]:
              - /url: /dashboard/tareas
              - img [ref=e22]
              - generic [ref=e25]: Tareas
            - link "Planificación" [ref=e26] [cursor=pointer]:
              - /url: /dashboard/planificacion
              - img [ref=e27]
              - generic [ref=e31]: Planificación
            - link "Equipo" [ref=e32] [cursor=pointer]:
              - /url: /dashboard/equipo
              - img [ref=e33]
              - generic [ref=e38]: Equipo
            - link "Reportes" [ref=e39] [cursor=pointer]:
              - /url: /dashboard/reportes
              - img [ref=e40]
              - generic [ref=e41]: Reportes
            - link "Configuración" [ref=e42] [cursor=pointer]:
              - /url: /dashboard/config
              - img [ref=e43]
              - generic [ref=e46]: Configuración
          - paragraph [ref=e48]: v0.1.0 · En desarrollo
      - generic [ref=e49]:
        - banner [ref=e50]:
          - heading "Equipo" [level=1] [ref=e53]
          - generic [ref=e54]:
            - generic [ref=e55]:
              - generic [ref=e57]: U
              - generic [ref=e59]: Usuario
            - button "Cerrar sesión" [ref=e60]:
              - img [ref=e61]
        - main [ref=e64]:
          - generic [ref=e65]:
            - navigation "Secciones del equipo" [ref=e67]:
              - link "Miembros" [ref=e68] [cursor=pointer]:
                - /url: /dashboard/equipo
                - img [ref=e69]
                - text: Miembros
            - generic [ref=e74]:
              - generic [ref=e76]:
                - textbox "Buscar por nombre o correo..." [ref=e77]
                - combobox [ref=e78]:
                  - option "Todos los sectores" [selected]
                - generic [ref=e79]:
                  - button "Todos" [ref=e80]
                  - button "Administrador" [ref=e81]
                  - button "Responsable" [ref=e82]
                  - button "Miembro" [ref=e83]
                  - button "Visualizador" [ref=e84]
              - generic [ref=e86]:
                - img [ref=e87]
                - paragraph [ref=e92]: No se encontraron miembros
        - contentinfo [ref=e93]:
          - generic [ref=e94]:
            - paragraph [ref=e95]: © 2026 Tablero de Control. Todos los derechos reservados.
            - generic [ref=e96]:
              - generic [ref=e97]: Hecho con
              - img [ref=e98]
              - generic [ref=e100]: por
              - link "TecnoFusión.it" [ref=e101] [cursor=pointer]:
                - /url: https://tecnofusion-it.web.app/
                - text: TecnoFusión.it
                - img [ref=e102]
    - button "Crear tarea" [ref=e107]:
      - img [ref=e108]
  - button "Open Next.js Dev Tools" [ref=e114] [cursor=pointer]:
    - img [ref=e115]
  - alert [ref=e118]
  - region "Notifications alt+T"
```

# Test source

```ts
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
  109 |   test('sección de invitaciones visible (link de invitación)', async ({ page }) => {
  110 |     // Verificar que hay botón "Link de invitación" o sección similar
  111 |     const linkBtn = page.locator(
  112 |       'button:has-text("Link de invitación"), button:has-text("Generar link"), text=Links de invitación'
  113 |     );
> 114 |     await expect(linkBtn.first()).toBeVisible({ timeout: 10000 });
      |                                   ^ Error: expect(locator).toBeVisible() failed
  115 |   });
  116 | });
  117 | 
```