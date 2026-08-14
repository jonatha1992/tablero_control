/**
 * Borra usuarios `@guest.local` que están bloqueados por FK `RESTRICT`, destrabándolas primero.
 *
 * A diferencia de `cleanup-orphan-guest-users.ts` (que solo borra usuarios sin rastro),
 * este script actúa sobre usuarios CON historial:
 *
 *   1. Backup a JSON de todo lo que se modifica o borra.
 *   2. `Task.creatorId` se reasigna al usuario indicado en `--reassign-to`. Las tareas NO se borran.
 *   3. `AuditLog` del usuario se elimina (no es reasignable sin falsear la auditoría).
 *   4. El usuario se borra de PostgreSQL y de Firebase Auth.
 *
 * Aborta si el usuario tiene comentarios, eventos de calendario o negocios propios:
 * esos casos necesitan una decisión explícita, no un borrado automático.
 *
 * Uso:
 *   npx tsx --env-file=.env.local scripts/force-remove-guest-users.ts --reassign-to=<userId> --users=<id1>,<id2>
 *   npx tsx --env-file=.env.local scripts/force-remove-guest-users.ts --reassign-to=<userId> --users=<id1>,<id2> --execute
 */
import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { getAdminAuth } from '../src/lib/firebase/admin';

const EXECUTE = process.argv.includes('--execute');
const BACKUP_DIR = join(process.cwd(), 'backups');

function readArg(name: string): string | null {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : null;
}

const reassignTo = readArg('reassign-to');
const userIds = (readArg('users') ?? '').split(',').map((s) => s.trim()).filter(Boolean);

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL no configurada');
    process.exit(1);
  }
  if (!reassignTo || userIds.length === 0) {
    console.error('Uso: --reassign-to=<userId> --users=<id1>,<id2> [--execute]');
    process.exit(1);
  }

  const target = await prisma.user.findUnique({
    where: { id: reassignTo },
    select: { id: true, name: true, email: true },
  });
  if (!target) {
    console.error(`El usuario destino ${reassignTo} no existe. Abortado.`);
    process.exit(1);
  }
  if (userIds.includes(reassignTo)) {
    console.error('El usuario destino no puede estar en la lista a borrar. Abortado.');
    process.exit(1);
  }

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, role: true, businessId: true },
  });

  const missing = userIds.filter((id) => !users.some((u) => u.id === id));
  if (missing.length > 0) {
    console.error(`No existen en la base: ${missing.join(', ')}. Abortado.`);
    process.exit(1);
  }

  console.log(`\nModo: ${EXECUTE ? 'EJECUCIÓN' : 'DRY-RUN (solo listar)'}`);
  console.log(`Creador destino de las tareas: ${target.name} <${target.email}>\n`);

  // Bloqueos que este script NO resuelve automáticamente
  for (const u of users) {
    const [comments, events, owned] = await Promise.all([
      prisma.comment.count({ where: { authorId: u.id } }),
      prisma.calendarEvent.count({ where: { creatorId: u.id } }),
      prisma.business.count({ where: { ownerId: u.id } }),
    ]);
    if (comments > 0 || events > 0 || owned > 0) {
      console.error(
        `${u.name} tiene ${comments} comentario(s), ${events} evento(s), ${owned} negocio(s) propio(s).`,
      );
      console.error('Este script no decide qué hacer con eso. Abortado.');
      process.exit(1);
    }
  }

  const tasks = await prisma.task.findMany({
    where: { creatorId: { in: userIds } },
    select: { id: true, title: true, status: true, creatorId: true },
  });
  const auditLogs = await prisma.auditLog.findMany({
    where: { actorId: { in: userIds } },
  });
  const memberships = await prisma.userBusiness.findMany({
    where: { userId: { in: userIds } },
  });

  for (const u of users) {
    const t = tasks.filter((x) => x.creatorId === u.id).length;
    const a = auditLogs.filter((x) => x.actorId === u.id).length;
    console.log(`- ${u.name} <${u.email}>`);
    console.log(`  ${t} tarea(s) → se reasignan a ${target.name}`);
    console.log(`  ${a} audit log(s) → se BORRAN`);
  }
  console.log(`\nTotal: ${tasks.length} tarea(s) preservada(s), ${auditLogs.length} audit log(s) a borrar\n`);

  if (!EXECUTE) {
    console.log('Para ejecutar, agregá --execute\n');
    return;
  }

  // Backup antes de tocar nada
  mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = join(BACKUP_DIR, `force-remove-guest-users-${stamp}.json`);
  writeFileSync(
    backupPath,
    JSON.stringify({ createdAt: new Date().toISOString(), target, users, tasks, auditLogs, memberships }, null, 2),
    'utf-8',
  );
  console.log(`Backup: ${backupPath}\n`);

  await prisma.$transaction(async (tx) => {
    const reassigned = await tx.task.updateMany({
      where: { creatorId: { in: userIds } },
      data: { creatorId: target.id },
    });
    console.log(`Tareas reasignadas: ${reassigned.count}`);

    const removedLogs = await tx.auditLog.deleteMany({ where: { actorId: { in: userIds } } });
    console.log(`Audit logs borrados: ${removedLogs.count}`);

    const removedUsers = await tx.user.deleteMany({ where: { id: { in: userIds } } });
    console.log(`Usuarios borrados de PostgreSQL: ${removedUsers.count}`);
  });

  for (const u of users) {
    try {
      await getAdminAuth().deleteUser(u.id);
      console.log(`Firebase Auth OK: ${u.email}`);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/user-not-found') continue;
      console.warn(`Firebase Auth pendiente para ${u.email}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log('\nListo. Los usuarios deben registrarse de nuevo por el link de invitación.\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
