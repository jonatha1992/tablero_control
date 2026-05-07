import { test, expect } from '@playwright/test';
import { loginAsSuperAdmin, gotoAuthenticated } from './helpers/auth';
import * as fs from 'fs';
import * as path from 'path';

const REPORT_DIR = process.env.REPORT_DIR || 'screenshots-review/reporte-latest';
const OUTPUT_DIR = path.join(process.cwd(), REPORT_DIR);

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const ROUTES = [
  // ── Auth ──
  { path: '/login', name: '01-auth-login', auth: false, section: 'Auth' },
  { path: '/register', name: '02-auth-register', auth: false, section: 'Auth' },
  { path: '/forgot-password', name: '03-auth-forgot', auth: false, section: 'Auth' },

  // ── Dashboard Core ──
  { path: '/dashboard', name: '10-dash-home', auth: true, section: 'Dashboard' },
  { path: '/dashboard/tareas', name: '11-tareas-kanban', auth: true, section: 'Tareas' },
  { path: '/dashboard/tareas/agenda', name: '12-tareas-agenda', auth: true, section: 'Tareas' },
  { path: '/dashboard/tareas/calendario', name: '13-tareas-calendario', auth: true, section: 'Tareas' },
  { path: '/dashboard/tareas/cronograma', name: '14-tareas-cronograma', auth: true, section: 'Tareas' },

  // ── Planificación ──
  { path: '/dashboard/planificacion', name: '20-plan-periodos', auth: true, section: 'Planificacion' },
  { path: '/dashboard/planificacion/objetivos', name: '21-plan-objetivos', auth: true, section: 'Planificacion' },
  { path: '/dashboard/ciclos', name: '22-ciclos', auth: true, section: 'Planificacion' },
  { path: '/dashboard/objetivos', name: '23-objetivos', auth: true, section: 'Planificacion' },
  { path: '/dashboard/cronograma', name: '24-cronograma', auth: true, section: 'Planificacion' },
  { path: '/dashboard/calendario', name: '25-calendario', auth: true, section: 'Planificacion' },

  // ── Equipo ──
  { path: '/dashboard/equipo', name: '30-equipo-miembros', auth: true, section: 'Equipo' },
  { path: '/dashboard/equipo/roles', name: '31-equipo-roles', auth: true, section: 'Equipo' },
  { path: '/dashboard/equipo/sectores', name: '32-equipo-sectores', auth: true, section: 'Equipo' },
  { path: '/dashboard/sectores', name: '33-sectores', auth: true, section: 'Equipo' },

  // ── Reportes y Billing ──
  { path: '/dashboard/reportes', name: '40-reportes', auth: true, section: 'Reportes' },
  { path: '/dashboard/billing', name: '41-billing', auth: true, section: 'Billing' },

  // ── Configuración ──
  { path: '/dashboard/config', name: '50-config-perfil', auth: true, section: 'Config' },
  { path: '/dashboard/config/roles', name: '51-config-roles', auth: true, section: 'Config' },

  // ── Superadmin ──
  { path: '/superadmin', name: '60-sa-plataforma', auth: true, section: 'Superadmin' },
  { path: '/superadmin/businesses', name: '61-sa-negocios', auth: true, section: 'Superadmin' },
  { path: '/superadmin/users', name: '62-sa-usuarios', auth: true, section: 'Superadmin' },
  { path: '/superadmin/subscriptions', name: '63-sa-suscripciones', auth: true, section: 'Superadmin' },
  { path: '/superadmin/planes', name: '64-sa-planes', auth: true, section: 'Superadmin' },
  { path: '/superadmin/audit', name: '65-sa-auditoria', auth: true, section: 'Superadmin' },

  // ── Otras ──
  { path: '/pending', name: '70-pending', auth: true, section: 'Otras' },
];

test.describe('Reporte Visual Completo', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  for (const route of ROUTES) {
    test(`${route.section} — ${route.name}`, async ({ page }) => {
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
