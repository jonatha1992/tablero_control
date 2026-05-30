/**
 * Detecta y elimina negocios creados por error para usuarios que entraron por invitación
 * (auto-provision antiguo en GET /api/auth/profile o autoRegister en login).
 *
 * Uso:
 *   npx tsx --env-file=.env.local scripts/cleanup-invite-phantom-businesses.ts
 *   npx tsx --env-file=.env.local scripts/cleanup-invite-phantom-businesses.ts --execute
 */
import 'dotenv/config';
import { PrismaClient, type Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const EXECUTE = process.argv.includes('--execute');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

type UserPreferences = {
  accountIntent?: string;
};

function isEmpresaDeName(businessName: string, userName: string): boolean {
  const normalized = businessName.trim();
  if (/^empresa de\s+/i.test(normalized)) return true;
  const expected = `Empresa de ${userName.trim()}`;
  return normalized.toLowerCase() === expected.toLowerCase();
}

async function deleteBusiness(tx: Prisma.TransactionClient, businessId: string): Promise<void> {
  const locationIds = (
    await tx.location.findMany({
      where: { businessId },
      select: { id: true },
    })
  ).map((l) => l.id);

  if (locationIds.length > 0) {
    await tx.task.deleteMany({
      where: { locationId: { in: locationIds }, projectId: null },
    });
  }

  await tx.invoice.deleteMany({ where: { businessId } });
  await tx.userBusiness.deleteMany({ where: { businessId } });
  await tx.user.updateMany({
    where: { businessId },
    data: { businessId: null, locationId: null },
  });
  await tx.business.delete({ where: { id: businessId } });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL no configurada');
    process.exit(1);
  }

  const inviteJoins = await prisma.auditLog.findMany({
    where: { action: 'user.join_via_invite' },
    select: { targetId: true, businessId: true, createdAt: true },
  });

  const inviteUserIds = new Set(
    inviteJoins.map((j) => j.targetId).filter((id): id is string => !!id)
  );

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { id: { in: [...inviteUserIds] } },
        {
          preferences: {
            path: ['accountIntent'],
            equals: 'collaborator',
          },
        },
      ],
    },
    include: {
      memberships: { where: { isActive: true }, include: { business: { select: { id: true, name: true, ownerId: true } } } },
      ownedBusinesses: { select: { id: true, name: true, createdAt: true } },
    },
  });

  const candidates: Array<{
    userId: string;
    email: string;
    name: string;
    businessId: string;
    businessName: string;
    invitedBusinessId: string | null;
    reason: string;
  }> = [];

  for (const user of users) {
    const invitedBizIds = new Set(
      inviteJoins
        .filter((j) => j.targetId === user.id && j.businessId)
        .map((j) => j.businessId as string)
    );

    for (const owned of user.ownedBusinesses) {
      if (owned.name.includes('TecnoFusión')) continue;

      const otherMemberships = user.memberships.filter((m) => m.businessId !== owned.id);
      if (otherMemberships.length === 0) continue;

      const memberCount = await prisma.userBusiness.count({
        where: { businessId: owned.id, isActive: true },
      });

      const prefs = user.preferences as UserPreferences;
      const joinedViaInvite =
        inviteUserIds.has(user.id) || prefs.accountIntent === 'collaborator';
      const looksAutoProvisioned = isEmpresaDeName(owned.name, user.name);
      const soleMember = memberCount <= 1;

      if (!joinedViaInvite) continue;

      if (looksAutoProvisioned && soleMember && otherMemberships.length > 0) {
        const invited =
          otherMemberships.find((m) => invitedBizIds.has(m.businessId)) ??
          otherMemberships[0];
        candidates.push({
          userId: user.id,
          email: user.email,
          name: user.name,
          businessId: owned.id,
          businessName: owned.name,
          invitedBusinessId: invited?.businessId ?? null,
          reason: 'invite_user + Empresa de… + único miembro + membresía en otro negocio',
        });
      }
    }
  }

  const uniqueByBusiness = new Map(candidates.map((c) => [c.businessId, c]));

  console.log(`\nModo: ${EXECUTE ? 'EJECUCIÓN' : 'DRY-RUN (solo listar)'}\n`);
  console.log(`Usuarios con señal de invitación revisados: ${users.length}`);
  console.log(`Negocios fantasma candidatos: ${uniqueByBusiness.size}\n`);

  if (uniqueByBusiness.size === 0) {
    console.log('No se encontraron negocios fantasma con los criterios actuales.');
    return;
  }

  for (const c of uniqueByBusiness.values()) {
    console.log(`- [${c.businessId}] "${c.businessName}"`);
    console.log(`  usuario: ${c.name} <${c.email}> (${c.userId})`);
    console.log(`  mantener contexto en: ${c.invitedBusinessId ?? '(primera otra membresía)'}`);
    console.log(`  motivo: ${c.reason}\n`);
  }

  if (!EXECUTE) {
    console.log('Para eliminar, ejecutá con --execute\n');
    return;
  }

  let deleted = 0;
  const errors: string[] = [];

  for (const c of uniqueByBusiness.values()) {
    try {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: c.userId },
          include: { memberships: { where: { isActive: true } } },
        });
        if (!user) return;

        const fallback = user.memberships.find((m) => m.businessId !== c.businessId);
        if (user.businessId === c.businessId && fallback) {
          await tx.user.update({
            where: { id: c.userId },
            data: {
              businessId: fallback.businessId,
              role: fallback.role,
            },
          });
        } else if (user.businessId === c.businessId) {
          await tx.user.update({
            where: { id: c.userId },
            data: { businessId: null, locationId: null },
          });
        }

        await deleteBusiness(tx, c.businessId);
      });
      deleted++;
      console.log(`Eliminado: ${c.businessName} (${c.businessId})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${c.businessId}: ${msg}`);
      console.error(`Error al eliminar ${c.businessId}: ${msg}`);
    }
  }

  console.log(`\nEliminados: ${deleted}/${uniqueByBusiness.size}`);
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
