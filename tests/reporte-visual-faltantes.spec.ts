import { test, expect } from '@playwright/test';
import { loginAsSuperAdmin, gotoAuthenticated } from './helpers/auth';
import * as path from 'path';

const REPORT_DIR = 'screenshots-review/reporte-2026-05-06-2243';
const OUTPUT_DIR = path.join(process.cwd(), REPORT_DIR);

const ROUTES = [
  { path: '/dashboard/config/roles', name: '51-config-roles', auth: true },
  { path: '/superadmin', name: '60-sa-plataforma', auth: true },
  { path: '/superadmin/businesses', name: '61-sa-negocios', auth: true },
  { path: '/superadmin/users', name: '62-sa-usuarios', auth: true },
  { path: '/superadmin/subscriptions', name: '63-sa-suscripciones', auth: true },
  { path: '/superadmin/planes', name: '64-sa-planes', auth: true },
  { path: '/superadmin/audit', name: '65-sa-auditoria', auth: true },
  { path: '/pending', name: '70-pending', auth: true },
];

test.describe('Reporte Visual — Faltantes', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  for (const route of ROUTES) {
    test(route.name, async ({ page }) => {
      if (route.auth) {
        await loginAsSuperAdmin(page);
      }
      await gotoAuthenticated(page, route.path);
      await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1200);

      const filePath = path.join(OUTPUT_DIR, `${route.name}.png`);
      await page.screenshot({ path: filePath, fullPage: true });

      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length).toBeGreaterThan(30);
    });
  }
});
