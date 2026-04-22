import 'dotenv/config';
import * as fs from 'fs';
const envFile = fs.readFileSync('.env.local', 'utf-8');
const match = envFile.match(/FIREBASE_SERVICE_ACCOUNT="([\s\S]*?)"/);
if (match) {
  process.env.FIREBASE_SERVICE_ACCOUNT = match[1];
}

import { getAdminAuth } from '@/lib/firebase/admin';
import { prisma } from '@/lib/prisma';
import type { UserRole } from '@prisma/client';

const PASSWORD = 'Test2024!';
const BIZ_ID = 'biz-test-123';
const LOC_ID = 'loc-test-123';

const TEST_USERS = [
  { email: 'test.superadmin@example.com', name: 'Test Superadmin', role: 'superadmin' as UserRole, loc: false },
  { email: 'test.admin@example.com', name: 'Test Admin', role: 'admin' as UserRole, loc: false },
  { email: 'test.responsable@example.com', name: 'Test Responsable', role: 'responsable' as UserRole, loc: true },
  { email: 'test.miembro@example.com', name: 'Test Miembro', role: 'miembro' as UserRole, loc: true },
  { email: 'test.viewer@example.com', name: 'Test Viewer', role: 'viewer' as UserRole, loc: false },
];

async function syncUsers() {
  console.log('🔄 Sincronizando usuarios de prueba...');
  const auth = getAdminAuth();

  // Create test business and location first
  await prisma.business.upsert({
    where: { id: BIZ_ID },
    update: {},
    create: {
      id: BIZ_ID,
      name: 'Negocio de Pruebas Automáticas',
      adminId: 'temp',
      status: 'active',
      plan: 'pro'
    }
  });

  await prisma.location.upsert({
    where: { id: LOC_ID },
    update: {},
    create: {
      id: LOC_ID,
      businessId: BIZ_ID,
      name: 'Local de Pruebas',
      type: 'local',
      status: 'active'
    }
  });

  for (const tu of TEST_USERS) {
    try {
      // 1. Crear en Firebase Auth
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(tu.email);
        await auth.updateUser(userRecord.uid, { password: PASSWORD, displayName: tu.name });
      } catch (e: any) {
        if (e.code === 'auth/user-not-found') {
          userRecord = await auth.createUser({
            email: tu.email,
            password: PASSWORD,
            displayName: tu.name,
          });
        } else {
          throw e;
        }
      }

      // 2. Crear en Prisma
      await prisma.user.upsert({
        where: { id: userRecord.uid },
        update: {
          role: tu.role,
          businessId: tu.role === 'superadmin' ? null : BIZ_ID,
          locationId: tu.loc ? LOC_ID : null,
          isActive: true
        },
        create: {
          id: userRecord.uid,
          email: tu.email,
          name: tu.name,
          role: tu.role,
          businessId: tu.role === 'superadmin' ? null : BIZ_ID,
          locationId: tu.loc ? LOC_ID : null,
          isActive: true
        }
      });

      console.log(`✅ Creado/Actualizado: ${tu.email} (${tu.role})`);
    } catch (e) {
      console.error(`❌ Falló la creación de ${tu.email}:`, e);
    }
  }

  // Update business adminId to the created admin
  const adminUser = await prisma.user.findFirst({ where: { email: 'test.admin@example.com' } });
  if (adminUser) {
    await prisma.business.update({ where: { id: BIZ_ID }, data: { adminId: adminUser.id } });
  }

  console.log('✅ Sincronización completada.');
}

syncUsers().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
