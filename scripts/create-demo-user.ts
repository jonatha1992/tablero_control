/**
 * Crea (o actualiza) un usuario demo completo: Firebase Auth + negocio en PostgreSQL + datos de muestra.
 *
 * Uso:
 *   npm run seed:demo-user
 *
 * Variables opcionales en .env.local:
 *   DEMO_USER_EMAIL, DEMO_USER_PASSWORD, DEMO_USER_NAME, DEMO_BUSINESS_NAME
 */
import { config } from 'dotenv';
config({ path: '.env.local', override: true });

import { getAdminAuth } from '../src/lib/firebase/admin';
import { initSystemRoles } from '../src/lib/firebase/init-system-roles';
import { prisma } from '../src/lib/prisma';

const EMAIL = (process.env.DEMO_USER_EMAIL ?? 'demo@tablerocontrol.test').toLowerCase().trim();
const PASSWORD = process.env.DEMO_USER_PASSWORD ?? 'DemoTablero2026!';
const NAME = process.env.DEMO_USER_NAME ?? 'Usuario Demo QA';
const BUSINESS_NAME = process.env.DEMO_BUSINESS_NAME ?? 'Negocio Demo QA';

const DEFAULT_PREFERENCES = {
  theme: 'system' as const,
  locale: 'es',
  timezone: 'America/Argentina/Buenos_Aires',
  notifications: { email: true, push: true, agentReports: true, agentAlerts: true },
  dashboardLayout: [] as string[],
};

async function ensureFirebaseUser(): Promise<string> {
  const auth = getAdminAuth();
  try {
    const existing = await auth.getUserByEmail(EMAIL);
    await auth.updateUser(existing.uid, {
      password: PASSWORD,
      displayName: NAME,
      emailVerified: true,
    });
    console.log(`ℹ Firebase: usuario existente actualizado (${existing.uid})`);
    return existing.uid;
  } catch {
    const created = await auth.createUser({
      email: EMAIL,
      password: PASSWORD,
      displayName: NAME,
      emailVerified: true,
    });
    console.log(`✅ Firebase: usuario creado (${created.uid})`);
    return created.uid;
  }
}

async function ensureDemoTenant(uid: string): Promise<{ businessId: string; locationId: string }> {
  const existing = await prisma.user.findUnique({
    where: { id: uid },
    include: { memberships: true },
  });

  if (existing?.businessId) {
    const loc = await prisma.location.findFirst({
      where: { businessId: existing.businessId },
      select: { id: true },
    });
    console.log(`ℹ PostgreSQL: usuario ya vinculado a negocio ${existing.businessId}`);
    return { businessId: existing.businessId, locationId: loc?.id ?? '' };
  }

  const byEmail = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (byEmail && byEmail.id !== uid) {
    await prisma.user.update({ where: { id: byEmail.id }, data: { id: uid } }).catch(() => {
      throw new Error(`Email ${EMAIL} ya existe en PG con otro UID (${byEmail.id})`);
    });
  }

  await prisma.user.upsert({
    where: { id: uid },
    update: { email: EMAIL, name: NAME, role: 'admin', isActive: true },
    create: {
      id: uid,
      email: EMAIL,
      name: NAME,
      role: 'admin',
      preferences: DEFAULT_PREFERENCES,
      isActive: true,
    },
  });

  const business = await prisma.business.create({
    data: {
      name: BUSINESS_NAME,
      adminId: uid,
      ownerId: uid,
      plan: 'pro',
      status: 'active',
      settings: {
        maxLocations: 10,
        maxUsers: 30,
        theme: 'system',
        language: 'es',
        timezone: 'America/Argentina/Buenos_Aires',
        notifications: { email: true },
        features: { customBranding: false, advancedReports: true, apiAccess: false },
        localeTypes: ['local', 'sector'],
      },
      featureFlags: { canExportReports: true },
    },
  });

  await prisma.user.update({
    where: { id: uid },
    data: { businessId: business.id },
  });

  await prisma.userBusiness.create({
    data: {
      userId: uid,
      businessId: business.id,
      role: 'admin',
      isActive: true,
    },
  });

  try {
    await initSystemRoles(business.id);
  } catch (err) {
    console.warn('⚠ Firestore roles no inicializados (¿emulador/Firestore off?):', (err as Error).message);
  }

  const location = await prisma.location.create({
    data: {
      businessId: business.id,
      name: 'Local Demo',
      type: 'local',
      address: 'Demo 123, CABA',
      managerId: uid,
      status: 'active',
      metadata: {},
    },
  });

  console.log(`✅ PostgreSQL: negocio "${BUSINESS_NAME}" + local Demo`);
  return { businessId: business.id, locationId: location.id };
}

async function seedSampleTasks(businessId: string, locationId: string, creatorId: string) {
  const count = await prisma.task.count({
    where: { creator: { businessId } },
  });
  if (count > 0) {
    console.log(`ℹ Ya hay ${count} tareas en el negocio demo — omitiendo seed de tareas`);
    return;
  }

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  await prisma.task.createMany({
    data: [
      {
        title: 'Tarea para hoy — demo',
        description: 'Probar kanban y agenda',
        status: 'todo',
        priority: 'high',
        type: 'task',
        creatorId,
        locationId,
        dueDate: today,
        tags: ['demo'],
        checklist: [{ id: 'c1', text: 'Marcar checklist', done: false }],
        position: 1,
      },
      {
        title: 'Tarea programada — demo',
        description: 'Aparece en Esta semana',
        status: 'todo',
        priority: 'medium',
        type: 'task',
        creatorId,
        locationId,
        dueDate: tomorrow,
        tags: ['demo'],
        position: 2,
      },
      {
        title: 'Rutina diaria — demo',
        description: 'Al finalizar crea la del día siguiente',
        status: 'todo',
        priority: 'medium',
        type: 'task',
        creatorId,
        locationId,
        dueDate: today,
        recurrence: { frequency: 'daily', interval: 1 },
        checklist: [{ id: 'r1', text: 'Paso rutina', done: false }],
        position: 3,
      },
      {
        title: 'Backlog demo',
        status: 'backlog',
        priority: 'low',
        type: 'task',
        creatorId,
        locationId,
        tags: ['demo'],
        position: 4,
      },
    ],
  });

  console.log('✅ 4 tareas demo creadas (hoy, futura, recurrente, backlog)');
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ Falta DATABASE_URL en .env.local');
    process.exit(1);
  }

  console.log('🚀 Creando usuario demo — Tablero de Control\n');

  const uid = await ensureFirebaseUser();
  const { businessId, locationId } = await ensureDemoTenant(uid);
  if (locationId) {
    await seedSampleTasks(businessId, locationId, uid);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Usuario demo listo\n');
  console.log(`  URL:      ${appUrl}/login`);
  console.log(`  Email:    ${EMAIL}`);
  console.log(`  Password: ${PASSWORD}`);
  console.log(`  Rol:      admin`);
  console.log(`  Negocio:  ${BUSINESS_NAME}`);
  console.log('\nProbar: login → dashboard → tareas → finalizar rutina diaria → invite desde Equipo');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
