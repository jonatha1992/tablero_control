/**
 * Script de prueba de integracion para el flujo de invitacion por link.
 * Usa Firebase Admin SDK (produccion) + PostgreSQL (Railway).
 * Crea usuarios de prueba y los limpia al final.
 */

import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '.env.local', override: true });

const TEST_EMAIL_PREFIX = `test-invite-${Date.now()}`;
const ADMIN_EMAIL = `${TEST_EMAIL_PREFIX}-admin@example.com`;
const NEW_USER_EMAIL = `${TEST_EMAIL_PREFIX}-user@example.com`;
const TEST_PASSWORD = 'TestPassword123!';

async function getIdTokenFromCustomToken(customToken: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) throw new Error('Missing NEXT_PUBLIC_FIREBASE_API_KEY');

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to exchange custom token: ${err}`);
  }

  const data = await res.json();
  return data.idToken as string;
}

async function main() {
  console.log('?? Iniciando prueba de flujo de invitacion por link...\n');

  // Dynamic imports after env is configured
  const { getAdminAuth } = await import('../src/lib/firebase/admin');
  const { prisma } = await import('../src/lib/prisma');

  const adminAuth = getAdminAuth();
  let adminUid: string | null = null;
  let userUid: string | null = null;
  let businessId: string | null = null;

  try {
    // --- 1. Crear admin en Firebase ----------------------------------------
    console.log('1. Creando admin de prueba en Firebase...');
    const adminAuthUser = await adminAuth.createUser({
      email: ADMIN_EMAIL,
      password: TEST_PASSWORD,
      displayName: 'Test Admin',
      emailVerified: true,
    });
    adminUid = adminAuthUser.uid;
    console.log(`   ? Admin creado: ${adminUid}`);

    // --- 2. Crear negocio + admin en PostgreSQL ----------------------------
    console.log('2. Creando negocio y admin en PostgreSQL...');
    businessId = `biz-test-${Date.now()}`;
    await prisma.business.create({
      data: {
        id: businessId,
        name: 'Negocio de Prueba',
        adminId: adminUid,
        plan: 'free',
        status: 'active',
        settings: { maxLocations: 1, maxUsers: 5 },
      },
    });

    await prisma.user.create({
      data: {
        id: adminUid,
        email: ADMIN_EMAIL,
        name: 'Test Admin',
        role: 'admin',
        businessId,
        preferences: {
          theme: 'system',
          locale: 'es',
          timezone: 'America/Argentina/Buenos_Aires',
          notifications: { email: true, push: false, agentReports: false, agentAlerts: false },
          dashboardLayout: [],
        },
        isActive: true,
      },
    });
    console.log(`   ? Negocio creado: ${businessId}`);

    // --- 3. Generar link de invitacion -------------------------------------
    console.log('3. Generando link de invitacion...');
    const invite = await prisma.businessInvite.create({
      data: {
        businessId,
        role: 'pending',
        maxUses: 1,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: adminUid,
        isActive: true,
      },
    });
    console.log(`   ? Link generado: /i/${invite.id}`);

    // --- 4. Crear usuario nuevo en Firebase --------------------------------
    console.log('4. Creando usuario nuevo en Firebase...');
    const userAuthUser = await adminAuth.createUser({
      email: NEW_USER_EMAIL,
      password: TEST_PASSWORD,
      displayName: 'Test User',
      emailVerified: true,
    });
    userUid = userAuthUser.uid;
    console.log(`   ? Usuario creado: ${userUid}`);

    // --- 5. Obtener ID token del usuario nuevo -----------------------------
    console.log('5. Generando ID token...');
    const customToken = await adminAuth.createCustomToken(userUid);
    const idToken = await getIdTokenFromCustomToken(customToken);
    console.log(`   ? ID token obtenido`);

    // --- 6. Verificar link (publico) ---------------------------------------
    console.log('6. Verificando link via GET /api/invites/:token...');
    const validateRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/invites/${invite.id}`
    );
    const validateBody = await validateRes.text();
    console.log(`   Status: ${validateRes.status}, Body: ${validateBody.substring(0,200)}`);
    if (!validateRes.ok) throw new Error('GET /api/invites/:token failed');
    const validateData = JSON.parse(validateBody);
    if (!validateData.valid) throw new Error('Link invalido');
    if (validateData.businessName !== 'Negocio de Prueba') throw new Error('Business name incorrect');
    console.log(`   ? Link valido, negocio: ${validateData.businessName}`);

    // --- 7. Aceptar invitacion ---------------------------------------------
    console.log('7. Aceptando invitacion via POST /api/invites/:token/accept...');
    const acceptRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/invites/${invite.id}/accept`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      }
    );
    const acceptBody = await acceptRes.text();
    console.log(`   Status: ${acceptRes.status}, Body: ${acceptBody.substring(0,200)}`);
    if (!acceptRes.ok) {
      throw new Error(`POST accept failed: ${acceptBody}`);
    }
    const acceptData = JSON.parse(acceptBody);
    console.log(`   ? Invitacion aceptada, rol: ${acceptData.role}`);

    // --- 8. Verificar en PostgreSQL ----------------------------------------
    console.log('8. Verificando estado en PostgreSQL...');
    const dbUser = await prisma.user.findUnique({ where: { id: userUid } });
    if (!dbUser) throw new Error('Usuario no encontrado en DB');
    if (dbUser.role !== 'pending') throw new Error(`Rol incorrecto: ${dbUser.role}, esperaba: pending`);
    if (dbUser.businessId !== businessId) throw new Error('BusinessId no asignado');
    console.log(`   ? Usuario tiene rol: ${dbUser.role}, businessId: ${dbUser.businessId}`);

    // --- 9. Simular que el admin cambia el rol -----------------------------
    console.log('9. Cambiando rol a miembro (simulando admin)...');
    const updated = await prisma.user.update({
      where: { id: userUid },
      data: { role: 'miembro' },
    });
    if (updated.role !== 'miembro') throw new Error('Rol no cambio');
    console.log(`   ? Rol cambiado a: ${updated.role}`);

    // --- 10. Verificar que el invite uso un cupo ---------------------------
    console.log('10. Verificando contador de usos...');
    const usedInvite = await prisma.businessInvite.findUnique({ where: { id: invite.id } });
    if (usedInvite!.usedCount !== 1) throw new Error('Contador no incrementado');
    console.log(`   ? Usos: ${usedInvite!.usedCount}/${usedInvite!.maxUses}`);

    console.log('\n??? TODAS LAS PRUEBAS PASARON ???\n');

  } catch (err) {
    console.error('\n??? PRUEBA FALLIDA ???');
    console.error(err);
    process.exitCode = 1;
  } finally {
    // --- Limpieza ----------------------------------------------------------
    console.log('\n?? Limpiando datos de prueba...');
    try {
      if (userUid) {
        await prisma.user.deleteMany({ where: { id: userUid } });
        await adminAuth.deleteUser(userUid).catch(() => {});
        console.log('   ??? Usuario de prueba eliminado');
      }
      if (adminUid) {
        await prisma.user.deleteMany({ where: { id: adminUid } });
        await adminAuth.deleteUser(adminUid).catch(() => {});
        console.log('   ??? Admin de prueba eliminado');
      }
      if (businessId) {
        await prisma.businessInvite.deleteMany({ where: { businessId } });
        await prisma.business.deleteMany({ where: { id: businessId } });
        console.log('   ??? Negocio y links eliminados');
      }
      console.log('   ? Limpieza completada');
    } catch (cleanupErr) {
      console.error('   ?? Error en limpieza:', cleanupErr);
    }
  }
}

main();
