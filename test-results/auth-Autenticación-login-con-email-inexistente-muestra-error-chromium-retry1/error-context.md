# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Autenticación >> login con email inexistente muestra error
- Location: tests\auth.spec.ts:26:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Email o contraseña incorrectos')
Expected: visible
Timeout: 8000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 8000ms
  - waiting for locator('text=Email o contraseña incorrectos')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - img "Tablero de Control" [ref=e7]
      - heading "Tablero de Control" [level=1] [ref=e8]
      - paragraph [ref=e9]: Iniciá sesión para continuar
    - generic [ref=e10]:
      - generic [ref=e11]: Correo o contraseña incorrectos
      - button "Continuar con Google" [ref=e12]:
        - generic [ref=e13]:
          - img [ref=e14]
          - text: Continuar con Google
      - generic [ref=e23]: O continuá con correo
      - generic [ref=e24]:
        - generic [ref=e25]:
          - text: Correo
          - textbox "Correo" [ref=e26]:
            - /placeholder: tu@correo.com
            - text: usuario-inexistente@nowhere.com
        - generic [ref=e27]:
          - generic [ref=e28]:
            - generic [ref=e29]: Contraseña
            - link "¿Olvidaste tu contraseña?" [ref=e30] [cursor=pointer]:
              - /url: /forgot-password
          - textbox "Contraseña" [ref=e31]: cualquier-cosa
        - button "Iniciar sesión" [ref=e32]
      - paragraph [ref=e33]:
        - text: ¿No tenés cuenta?
        - link "Registrate" [ref=e34] [cursor=pointer]:
          - /url: /register
  - generic [ref=e39] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e40]:
      - img [ref=e41]
    - generic [ref=e44]:
      - button "Open issues overlay" [ref=e45]:
        - generic [ref=e46]:
          - generic [ref=e47]: "0"
          - generic [ref=e48]: "1"
        - generic [ref=e49]: Issue
      - button "Collapse issues badge" [ref=e50]:
        - img [ref=e51]
  - alert [ref=e53]
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { SUPERADMIN, loginAs } from './helpers/auth';
  3  | 
  4  | test.describe('Autenticación', () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     // Asegurar que no hay sesión activa
  7  |     await page.goto('/login');
  8  |     await page.waitForSelector('input#email', { state: 'visible', timeout: 10000 });
  9  |   });
  10 | 
  11 |   test('login con credenciales válidas redirige a dashboard o superadmin', async ({ page }) => {
  12 |     await loginAs(page, SUPERADMIN.email, SUPERADMIN.password);
  13 |     await expect(page).toHaveURL(/\/(dashboard|superadmin)/);
  14 |   });
  15 | 
  16 |   test('login con contraseña incorrecta muestra error', async ({ page }) => {
  17 |     await page.fill('input#email', SUPERADMIN.email);
  18 |     await page.fill('input#password', 'contraseña-incorrecta-123');
  19 |     await page.click('button[type="submit"]');
  20 | 
  21 |     const errorMsg = page.locator('text=Email o contraseña incorrectos');
  22 |     await expect(errorMsg).toBeVisible({ timeout: 8000 });
  23 |     await expect(page).toHaveURL('/login');
  24 |   });
  25 | 
  26 |   test('login con email inexistente muestra error', async ({ page }) => {
  27 |     await page.fill('input#email', 'usuario-inexistente@nowhere.com');
  28 |     await page.fill('input#password', 'cualquier-cosa');
  29 |     await page.click('button[type="submit"]');
  30 | 
  31 |     const errorMsg = page.locator('text=Email o contraseña incorrectos');
> 32 |     await expect(errorMsg).toBeVisible({ timeout: 8000 });
     |                            ^ Error: expect(locator).toBeVisible() failed
  33 |   });
  34 | 
  35 |   test('dashboard sin auth redirige a login', async ({ page }) => {
  36 |     await page.goto('/dashboard');
  37 |     await page.waitForURL('/login', { timeout: 15000 });
  38 |     await expect(page).toHaveURL('/login');
  39 |   });
  40 | 
  41 |   test('superadmin sin auth redirige a login', async ({ page }) => {
  42 |     await page.goto('/superadmin');
  43 |     await page.waitForURL('/login', { timeout: 15000 });
  44 |     await expect(page).toHaveURL('/login');
  45 |   });
  46 | 
  47 |   test('página de registro carga correctamente', async ({ page }) => {
  48 |     await page.goto('/register');
  49 |     await expect(page.getByRole('heading', { name: 'Crear Cuenta', exact: false })).toBeVisible();
  50 |     await expect(page.locator('input#name, input[placeholder*="nombre"], input[name="name"]')).toBeVisible();
  51 |     await expect(page.locator('input#email, input[type="email"]')).toBeVisible();
  52 |     await expect(page.locator('input#password, input[type="password"]').first()).toBeVisible();
  53 |   });
  54 | 
  55 |   test('register con contraseñas distintas muestra error', async ({ page }) => {
  56 |     await page.goto('/register');
  57 |     await page.fill('input#name, input[placeholder*="nombre"], input[name="name"]', 'Test User');
  58 |     await page.fill('input#email, input[type="email"]', 'test@example.com');
  59 | 
  60 |     const passwords = page.locator('input[type="password"]');
  61 |     await passwords.nth(0).fill('password123');
  62 |     await passwords.nth(1).fill('diferente456');
  63 | 
  64 |     await page.click('button[type="submit"]');
  65 |     await expect(page.locator('text=Las contraseñas no coinciden')).toBeVisible({ timeout: 5000 });
  66 |   });
  67 | 
  68 |   test('página de login tiene botón de Google', async ({ page }) => {
  69 |     await expect(page.locator('text=Continuar con Google')).toBeVisible();
  70 |   });
  71 | });
  72 | 
```