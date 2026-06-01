/**
 * Crea cuentas de prueba en el Firebase Auth Emulator.
 *
 * REQUIERE que el emulador esté corriendo:
 *   npm run emulators  (o npm run dev:all)
 *
 * Uso:
 *   npm run seed:firebase
 *
 * Los UIDs coinciden con los IDs de seed-pg.ts para que el perfil
 * resuelva al usuario PostgreSQL correcto al hacer login.
 */

// Forzar modo emulador — debe quedar antes de cualquier llamada al Admin SDK
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.NEXT_PUBLIC_USE_EMULATOR = 'true';

import { getAdminAuth } from '../src/lib/firebase/admin';

const TEST_USERS = [
  {
    uid: 'CLtfsgAw6fUYZVTxP1ad2lVPplG2',
    email: 'superadmin@test.com',
    password: 'test123',
    name: 'TecnoFusión Admin',
  },
  {
    uid: 'usr-b1-admin',
    email: 'admin@test.com',
    password: 'test123',
    name: 'Martín Rodríguez',
  },
  {
    uid: 'usr-b1-resp1',
    email: 'responsable@test.com',
    password: 'test123',
    name: 'Sofía Méndez',
  },
  {
    uid: 'usr-b1-m1',
    email: 'miembro@test.com',
    password: 'test123',
    name: 'Lucía Fernández',
  },
  {
    uid: 'usr-b1-viewer',
    email: 'viewer@test.com',
    password: 'test123',
    name: 'Roberto Contador',
  },
];

async function main() {
  console.log('🔥 Seed — Firebase Auth Emulator');
  console.log('   http://localhost:9099  |  UI: http://localhost:4000');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const auth = getAdminAuth();

  for (const u of TEST_USERS) {
    try {
      const existing = await auth.getUserByEmail(u.email);
      await auth.updateUser(existing.uid, {
        password: u.password,
        displayName: u.name,
        emailVerified: true,
      });
      console.log(`  ℹ  ${u.email.padEnd(30)} ya existía — password actualizado`);
    } catch {
      await auth.createUser({
        uid: u.uid,
        email: u.email,
        password: u.password,
        displayName: u.name,
        emailVerified: true,
      });
      console.log(`  ✅ ${u.email.padEnd(30)} creado (uid: ${u.uid})`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Firebase Auth Emulator seeded!\n');
  console.log('🔑 Credenciales (todas con password: test123):');
  TEST_USERS.forEach(u =>
    console.log(`   ${u.email.padEnd(32)} ${u.name}`),
  );
  console.log('\nℹ  UIDs coindicen con los IDs de seed-pg.ts (perfil PostgreSQL resuelve OK)');
}

main().catch(err => {
  console.error('\n❌ Error:', err.message ?? err);
  console.error('   ¿Están corriendo los emuladores? → npm run emulators');
  process.exit(1);
});
