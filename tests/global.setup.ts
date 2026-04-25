import { test as setup } from '@playwright/test';
import { loginAsSuperAdmin, waitForDashboardReady } from './helpers/auth';
import * as fs from 'fs';
import * as path from 'path';

const STORAGE_PATH = 'tests/.auth/superadmin.json';

setup('autenticar superadmin y guardar sesión', async ({ page }) => {
  await loginAsSuperAdmin(page);
  await waitForDashboardReady(page);

  // Verificar que llegamos al dashboard (admin) o superadmin
  await page.waitForURL(/\/(dashboard|superadmin)/, { timeout: 15000 });

  // Guardar storage state para reusar en otros tests
  const dir = path.dirname(STORAGE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  await page.context().storageState({ path: STORAGE_PATH });

  console.log('✓ Sesión superadmin guardada');
});
