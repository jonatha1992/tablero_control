import { test, expect } from '@playwright/test';
import { SUPERADMIN, loginAs } from './helpers/auth';

test.describe('Autenticación', () => {
  test.beforeEach(async ({ page }) => {
    // Asegurar que no hay sesión activa
    await page.goto('/login');
    await page.waitForSelector('input#email', { state: 'visible', timeout: 10000 });
  });

  test('login con credenciales válidas redirige a dashboard o superadmin', async ({ page }) => {
    await loginAs(page, SUPERADMIN.email, SUPERADMIN.password);
    await expect(page).toHaveURL(/\/(dashboard|superadmin)/);
  });

  test('login con contraseña incorrecta muestra error', async ({ page }) => {
    await page.fill('input#email', SUPERADMIN.email);
    await page.fill('input#password', 'contraseña-incorrecta-123');
    await page.click('button[type="submit"]');

    const errorMsg = page.locator('text=Email o contraseña incorrectos');
    await expect(errorMsg).toBeVisible({ timeout: 8000 });
    await expect(page).toHaveURL('/login');
  });

  test('login con email inexistente muestra error', async ({ page }) => {
    await page.fill('input#email', 'usuario-inexistente@nowhere.com');
    await page.fill('input#password', 'cualquier-cosa');
    await page.click('button[type="submit"]');

    const errorMsg = page.locator('text=Email o contraseña incorrectos');
    await expect(errorMsg).toBeVisible({ timeout: 8000 });
  });

  test('dashboard sin auth redirige a login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('/login', { timeout: 15000 });
    await expect(page).toHaveURL('/login');
  });

  test('superadmin sin auth redirige a login', async ({ page }) => {
    await page.goto('/superadmin');
    await page.waitForURL('/login', { timeout: 15000 });
    await expect(page).toHaveURL('/login');
  });

  test('página de registro carga correctamente', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Crear Cuenta', exact: false })).toBeVisible();
    await expect(page.locator('input#name, input[placeholder*="nombre"], input[name="name"]')).toBeVisible();
    await expect(page.locator('input#email, input[type="email"]')).toBeVisible();
    await expect(page.locator('input#password, input[type="password"]').first()).toBeVisible();
  });

  test('register con contraseñas distintas muestra error', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input#name, input[placeholder*="nombre"], input[name="name"]', 'Test User');
    await page.fill('input#email, input[type="email"]', 'test@example.com');

    const passwords = page.locator('input[type="password"]');
    await passwords.nth(0).fill('password123');
    await passwords.nth(1).fill('diferente456');

    await page.click('button[type="submit"]');
    await expect(page.locator('text=Las contraseñas no coinciden')).toBeVisible({ timeout: 5000 });
  });

  test('página de login tiene botón de Google', async ({ page }) => {
    await expect(page.locator('text=Continuar con Google')).toBeVisible();
  });
});
