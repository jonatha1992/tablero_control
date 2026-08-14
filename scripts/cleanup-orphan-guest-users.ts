/**
 * Elimina usuarios con email sintético `@guest.local` que no dejaron rastro en el sistema.
 *
 * Solo borra los que tienen CERO referencias con FK `RESTRICT`
 * (Task.creatorId, AuditLog.actorId, Comment.authorId, CalendarEvent.creatorId, Business.ownerId).
 * Cualquier otro queda reportado como bloqueado y no se toca: la base rechazaría el DELETE.
 *
 * Las tablas con FK `CASCADE` (UserBusiness, Notification, UserLocation, TimeEntry,
 * TeamMember, _TaskAssignees) se borran junto con el usuario. El reporte las lista antes.
 *
 * Borra también la cuenta en Firebase Auth. Primero PostgreSQL: si el DELETE falla por FK,
 * la cuenta de Firebase queda intacta y el usuario sigue pudiendo entrar.
 *
 * Uso:
 *   npx tsx --env-file=.env.local scripts/cleanup-orphan-guest-users.ts
 *   npx tsx --env-file=.env.local scripts/cleanup-orphan-guest-users.ts --execute
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { getAdminAuth } from '../src/lib/firebase/admin';

const EXECUTE = process.argv.includes('--execute');
const GUEST_EMAIL_SUFFIX = '@guest.local';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

interface Blockers {
  tasksCreated: number;
  auditLogs: number;
  comments: number;
  calendarEvents: number;
  ownedBusinesses: number;
}

interface Cascades {
  memberships: number;
  notifications: number;
  userLocations: number;
  timeEntries: number;
  taskAssignments: number;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  blockers: Blockers;
  cascades: Cascades;
}

function totalBlockers(b: Blockers): number {
  return b.tasksCreated + b.auditLogs + b.comments + b.calendarEvents + b.ownedBusinesses;
}

function describeBlockers(b: Blockers): string {
  const parts: string[] = [];
  if (b.tasksCreated > 0) parts.push(`${b.tasksCreated} tarea(s) creada(s)`);
  if (b.auditLogs > 0) parts.push(`${b.auditLogs} audit log(s)`);
  if (b.comments > 0) parts.push(`${b.comments} comentario(s)`);
  if (b.calendarEvents > 0) parts.push(`${b.calendarEvents} evento(s)`);
  if (b.ownedBusinesses > 0) parts.push(`${b.ownedBusinesses} negocio(s) propio(s)`);
  return parts.join(', ');
}

function describeCascades(c: Cascades): string {
  const parts: string[] = [];
  if (c.memberships > 0) parts.push(`${c.memberships} membresía(s)`);
  if (c.notifications > 0) parts.push(`${c.notifications} notificación(es)`);
  if (c.userLocations > 0) parts.push(`${c.userLocations} ubicación(es)`);
  if (c.timeEntries > 0) parts.push(`${c.timeEntries} registro(s) de tiempo`);
  if (c.taskAssignments > 0) parts.push(`${c.taskAssignments} asignación(es) de tarea`);
  return parts.length > 0 ? parts.join(', ') : 'nada';
}

async function inspect(userId: string): Promise<{ blockers: Blockers; cascades: Cascades }> {
  const [
    tasksCreated,
    auditLogs,
    comments,
    calendarEvents,
    ownedBusinesses,
    memberships,
    notifications,
    userLocations,
    timeEntries,
    assignedTasks,
  ] = await Promise.all([
    prisma.task.count({ where: { creatorId: userId } }),
    prisma.auditLog.count({ where: { actorId: userId } }),
    prisma.comment.count({ where: { authorId: userId } }),
    prisma.calendarEvent.count({ where: { creatorId: userId } }),
    prisma.business.count({ where: { ownerId: userId } }),
    prisma.userBusiness.count({ where: { userId } }),
    prisma.notification.count({ where: { userId } }),
    prisma.userLocation.count({ where: { userId } }),
    prisma.timeEntry.count({ where: { userId } }),
    prisma.task.count({ where: { assignees: { some: { id: userId } } } }),
  ]);

  return {
    blockers: { tasksCreated, auditLogs, comments, calendarEvents, ownedBusinesses },
    cascades: {
      memberships,
      notifications,
      userLocations,
      timeEntries,
      taskAssignments: assignedTasks,
    },
  };
}

async function deleteFirebaseAccount(userId: string): Promise<string | null> {
  try {
    await getAdminAuth().deleteUser(userId);
    return null;
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'auth/user-not-found') return null;
    return err instanceof Error ? err.message : String(err);
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL no configurada');
    process.exit(1);
  }

  const users = await prisma.user.findMany({
    where: { email: { endsWith: GUEST_EMAIL_SUFFIX, mode: 'insensitive' } },
    select: { id: true, name: true, email: true },
    orderBy: { createdAt: 'asc' },
  });

  const candidates: Candidate[] = [];
  for (const user of users) {
    const { blockers, cascades } = await inspect(user.id);
    candidates.push({ ...user, blockers, cascades });
  }

  const deletable = candidates.filter((c) => totalBlockers(c.blockers) === 0);
  const blocked = candidates.filter((c) => totalBlockers(c.blockers) > 0);

  console.log(`\nModo: ${EXECUTE ? 'EJECUCIÓN' : 'DRY-RUN (solo listar)'}\n`);
  console.log(`Usuarios ${GUEST_EMAIL_SUFFIX} encontrados: ${candidates.length}`);
  console.log(`Borrables: ${deletable.length} · Bloqueados por FK: ${blocked.length}\n`);

  if (blocked.length > 0) {
    console.log('BLOQUEADOS (la base rechaza el DELETE, no se tocan):');
    for (const c of blocked) {
      console.log(`- ${c.name} <${c.email}>`);
      console.log(`  motivo: ${describeBlockers(c.blockers)}`);
    }
    console.log('  → estos necesitan cambio de correo, no borrado.\n');
  }

  if (deletable.length === 0) {
    console.log('No hay usuarios borrables.\n');
    return;
  }

  console.log('BORRABLES:');
  for (const c of deletable) {
    console.log(`- ${c.name} <${c.email}> (${c.id})`);
    console.log(`  se borra en cascada: ${describeCascades(c.cascades)}`);
  }
  console.log('');

  if (!EXECUTE) {
    console.log('Para eliminar, ejecutá con --execute\n');
    return;
  }

  let deleted = 0;
  const errors: string[] = [];

  for (const c of deletable) {
    try {
      await prisma.user.delete({ where: { id: c.id } });
      deleted++;
      console.log(`PostgreSQL OK: ${c.name} <${c.email}>`);

      const firebaseError = await deleteFirebaseAccount(c.id);
      if (firebaseError) {
        console.warn(`  Firebase Auth pendiente para ${c.email}: ${firebaseError}`);
        errors.push(`${c.email} (Firebase): ${firebaseError}`);
      } else {
        console.log(`  Firebase Auth OK`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${c.email} (PostgreSQL): ${msg}`);
      console.error(`Error al eliminar ${c.email}: ${msg}`);
    }
  }

  console.log(`\nEliminados de PostgreSQL: ${deleted}/${deletable.length}`);
  if (errors.length > 0) {
    console.log('Errores:', errors);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
