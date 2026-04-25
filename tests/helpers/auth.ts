import type { Page } from '@playwright/test';

export const SUPERADMIN = {
  email: 'tecnofusion.it@gmail.com',
  password: 'TecnoFusion2024!',
};

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.waitForSelector('input#email', { state: 'visible', timeout: 10000 });
  await page.fill('input#email', email);
  await page.fill('input#password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|superadmin)/, { timeout: 25000 });
  // Esperar que el spinner de auth desaparezca
  await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 15000 }).catch(() => {});
  // Esperar que el header cargue el nombre del usuario (indica que auth + profile están listos)
  await page.waitForSelector('header, [class*="header"]', { state: 'visible', timeout: 10000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  // Pausa adicional para que React Query hydrate el user con businessId
  await page.waitForTimeout(1500);
}

export async function loginAsSuperAdmin(page: Page) {
  await loginAs(page, SUPERADMIN.email, SUPERADMIN.password);
}

/** Navega a una ruta y espera que el auth esté completamente hidratado */
export async function gotoAuthenticated(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(800);
}
