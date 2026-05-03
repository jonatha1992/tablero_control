/**
 * Crea el superadmin inicial de TecnoFusión.
 * Uso: npm run seed:superadmin
 * Requiere en .env.local:
 *   SUPERADMIN_EMAIL
 *   SUPERADMIN_PASSWORD
 *   SUPERADMIN_NAME
 *   FIREBASE_PROJECT_ID (o FIRESTORE_EMULATOR_HOST si es local)
 */
import { getAdminApp, getAdminAuth, getAdminDb } from '../src/lib/firebase/admin';
import type { User } from '../src/types/domain/user';

async function main() {
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;
  const name = process.env.SUPERADMIN_NAME ?? 'TecnoFusión SuperAdmin';

  if (!email || !password) {
    console.error('❌ Faltan SUPERADMIN_EMAIL y SUPERADMIN_PASSWORD en .env.local');
    process.exit(1);
  }

  getAdminApp();
  const auth = getAdminAuth();
  const db = getAdminDb();

  let uid: string;
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    console.log(`ℹ Usuario ya existe (${uid}), actualizando password y claims.`);
    await auth.updateUser(uid, { password, displayName: name, emailVerified: true });
  } catch {
    const created = await auth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: true,
    });
    uid = created.uid;
    console.log(`✅ Superadmin creado: ${uid}`);
  }

  await auth.setCustomUserClaims(uid, { role: 'superadmin', businessId: null });

  const now = new Date();
  const userDoc: Omit<User, 'id'> = {
    name,
    email,
    role: 'superadmin',
    teamIds: [],
    preferences: {
      theme: 'system',
      locale: 'es-AR',
      timezone: 'America/Argentina/Buenos_Aires',
      notifications: { email: true, push: true, agentReports: true, agentAlerts: true },
      dashboardLayout: [],
    },
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection('users').doc(uid).set(userDoc, { merge: true });
  console.log('✅ Firestore users/{uid} actualizado con role=superadmin');
  console.log(`\n🎯 Login: ${email} / ${password}\n`);
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
