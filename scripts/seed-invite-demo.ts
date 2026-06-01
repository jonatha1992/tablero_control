/**
 * Crea link de invitación de prueba + usuario colaborador demo (flujo nombre + contraseña).
 *
 * Uso:
 *   npm run seed:invite-demo
 *
 * Requiere DATABASE_URL en .env.local.
 * Para login Firebase: emulador activo (npm run dev:all) o Firebase producción según .env.local.
 *
 * Variables opcionales:
 *   INVITE_DEMO_BUSINESS_ID  — default: biz-restaurante-001 (seed-pg)
 *   INVITE_DEMO_NAME         — default: Invitado Demo
 *   INVITE_DEMO_PASSWORD     — default: test123
 */
import { config } from 'dotenv';
config({ path: '.env.local', override: true });

import { getAdminAuth } from '../src/lib/firebase/admin';
import { prisma } from '../src/lib/prisma';
import {
  ensureUniqueUsername,
  nameToUsernameBase,
  syntheticEmail,
} from '../src/lib/auth/invite-username';

const BUSINESS_ID = process.env.INVITE_DEMO_BUSINESS_ID ?? 'biz-restaurante-001';
const INVITEE_NAME = process.env.INVITE_DEMO_NAME ?? 'Invitado Demo';
const INVITEE_PASSWORD = process.env.INVITE_DEMO_PASSWORD ?? 'test123';
const ADMIN_UID = process.env.INVITE_DEMO_ADMIN_UID ?? 'usr-b1-admin';

async function resolveBusiness(): Promise<{ id: string; name: string; adminId: string | null }> {
  const preferred = await prisma.business.findUnique({
    where: { id: BUSINESS_ID },
    select: { id: true, name: true, adminId: true },
  });
  if (preferred) return preferred;

  const any = await prisma.business.findFirst({
    where: { status: 'active' },
    select: { id: true, name: true, adminId: true },
    orderBy: { createdAt: 'asc' },
  });

  if (!any) {
    throw new Error('No hay negocios en la base. Creá uno desde /register o corré seed:pg.');
  }

  console.log(`ℹ Usando negocio existente: ${any.name} (${any.id})`);
  return any;
}

async function ensureInviteLink(business: { id: string; name: string; adminId: string | null }): Promise<string> {
  const createdBy =
    business.adminId ??
    (
      await prisma.userBusiness.findFirst({
        where: { businessId: business.id, role: 'admin', isActive: true },
        select: { userId: true },
      })
    )?.userId ??
    ADMIN_UID;

  const invite = await prisma.businessInvite.create({
    data: {
      businessId: business.id,
      role: 'miembro',
      locationIds: [],
      maxUses: 0,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdBy,
      isActive: true,
    },
  });

  console.log(`✅ Link de invitación creado para "${business.name}"`);
  return invite.id;
}

async function ensureInviteeUser(businessId: string): Promise<{ username: string; email: string }> {
  const base = nameToUsernameBase(INVITEE_NAME);
  const username = await ensureUniqueUsername(prisma, base);
  const email = syntheticEmail(username);
  const auth = getAdminAuth();
  let uid: string;

  try {
    const existing = await auth.getUserByEmail(email);
    await auth.updateUser(existing.uid, {
      password: INVITEE_PASSWORD,
      displayName: INVITEE_NAME,
      emailVerified: true,
    });
    uid = existing.uid;
    console.log(`ℹ Firebase: invitado existente actualizado (${uid})`);
  } catch {
    const created = await auth.createUser({
      email,
      password: INVITEE_PASSWORD,
      displayName: INVITEE_NAME,
      emailVerified: true,
    });
    uid = created.uid;
    console.log(`✅ Firebase: invitado creado (${uid})`);
  }

  const prefs = {
    theme: 'system' as const,
    locale: 'es',
    timezone: 'America/Argentina/Buenos_Aires',
    notifications: { email: true, push: false, agentReports: false, agentAlerts: false },
    dashboardLayout: [] as string[],
    accountIntent: 'collaborator' as const,
    joinedViaInviteAt: new Date().toISOString(),
  };

  await prisma.user.upsert({
    where: { id: uid },
    update: {
      email,
      name: INVITEE_NAME,
      username,
      role: 'miembro',
      businessId,
      isActive: true,
      preferences: prefs,
    },
    create: {
      id: uid,
      email,
      name: INVITEE_NAME,
      username,
      role: 'miembro',
      businessId,
      preferences: prefs,
      isActive: true,
    },
  });

  await prisma.userBusiness.upsert({
    where: {
      userId_businessId: { userId: uid, businessId },
    },
    update: { role: 'miembro', isActive: true },
    create: {
      userId: uid,
      businessId,
      role: 'miembro',
      isActive: true,
    },
  });

  console.log(`✅ PostgreSQL: colaborador "${INVITEE_NAME}" en ${businessId}`);
  return { username, email };
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ Falta DATABASE_URL en .env.local');
    process.exit(1);
  }

  console.log('🔗 Seed invitación demo — Tablero de Control\n');

  const business = await resolveBusiness();
  const inviteToken = await ensureInviteLink(business);
  const { username, email } = await ensureInviteeUser(business.id);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const inviteUrl = `${appUrl}/i/${inviteToken}`;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Credenciales de prueba — flujo invitación\n');

  console.log('Admin (generar links / Equipo):');
  console.log('  Email:    admin@test.com');
  console.log('  Password: test123');
  console.log('  (requiere npm run seed:firebase con emulador activo)\n');

  console.log('Link de invitación (registro nuevo nombre + contraseña):');
  console.log(`  ${inviteUrl}\n`);
  console.log('  Ejemplo alta en el formulario:');
  console.log('  Nombre:     Cualquier nombre (ej. María Test)');
  console.log('  Contraseña: test123\n');

  console.log('Colaborador ya creado (login con nombre + contraseña):');
  console.log(`  Nombre:     ${INVITEE_NAME}`);
  console.log(`  Password:   ${INVITEE_PASSWORD}`);
  console.log(`  Username:   ${username}`);
  console.log(`  Email int.: ${email}`);
  console.log(`  URL login:  ${appUrl}/login\n`);

  console.log('Probar:');
  console.log('  1. Abrí el link → completá nombre + contraseña → Unirme al equipo');
  console.log('  2. O en /login usá nombre + contraseña del colaborador demo');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
