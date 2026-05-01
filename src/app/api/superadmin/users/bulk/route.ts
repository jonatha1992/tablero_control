import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { getAdminAuth } from '@/lib/firebase/admin';
import { writeAuditLog } from '@/lib/api/audit';
import { prisma } from '@/lib/prisma';
import { handle } from '@/lib/api/route-handler';
import type { Prisma } from '@prisma/client';

async function reassignUserTasks(tx: Prisma.TransactionClient, userId: string, fallbackCreatorId: string) {
  const tasks = await tx.task.findMany({
    where: { creatorId: userId },
    select: {
      id: true,
      location: { select: { businessId: true } },
      project: { select: { businessId: true } },
    },
  });

  const tasksByBusiness = new Map<string, string[]>();
  const orphanTaskIds: string[] = [];

  for (const task of tasks) {
    const bizId = task.location?.businessId ?? task.project?.businessId ?? null;
    if (bizId) {
      if (!tasksByBusiness.has(bizId)) tasksByBusiness.set(bizId, []);
      tasksByBusiness.get(bizId)!.push(task.id);
    } else {
      orphanTaskIds.push(task.id);
    }
  }

  for (const [bizId, taskIds] of tasksByBusiness) {
    const business = await tx.business.findUnique({
      where: { id: bizId },
      select: { adminId: true },
    });
    const adminId = business?.adminId;
    let newCreatorId = fallbackCreatorId;
    if (adminId && adminId !== userId) {
      const adminExists = await tx.user.findUnique({ where: { id: adminId }, select: { id: true } });
      if (adminExists) newCreatorId = adminId;
    }
    await tx.task.updateMany({
      where: { id: { in: taskIds } },
      data: { creatorId: newCreatorId },
    });
  }

  if (orphanTaskIds.length > 0) {
    await tx.task.updateMany({
      where: { id: { in: orphanTaskIds } },
      data: { creatorId: fallbackCreatorId },
    });
  }

  return { reassigned: tasks.length };
}

export const POST = handle(async (req: NextRequest) => {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const denied = requireRole(user, ['superadmin']);
  if (denied) return denied;

  const body = (await req.json()) as { ids?: string[]; deleteBusinesses?: boolean };
  const ids = body?.ids ?? [];
  const deleteBusinesses = body?.deleteBusinesses === true;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids requeridos' }, { status: 400 });
  }

  const results = { deleted: 0, errors: [] as Array<{ id: string; reason: string }> };

  for (const id of ids) {
    if (user.uid === id) {
      results.errors.push({ id, reason: 'No puedes eliminarte a ti mismo' });
      continue;
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, name: true },
    });

    if (!target) {
      results.errors.push({ id, reason: 'Usuario no encontrado' });
      continue;
    }

    if (target.role === 'superadmin') {
      results.errors.push({ id, reason: 'No se puede eliminar un superadmin' });
      continue;
    }

    try {
      await prisma.$transaction(async (tx) => {
        if (deleteBusinesses) {
          const businesses = await tx.business.findMany({
            where: { adminId: id },
            select: { id: true },
          });

          for (const biz of businesses) {
            const locationIds = (await tx.location.findMany({
              where: { businessId: biz.id },
              select: { id: true },
            })).map((l) => l.id);
            if (locationIds.length > 0) {
              await tx.task.deleteMany({
                where: { locationId: { in: locationIds }, projectId: null },
              });
            }

            await tx.invoice.deleteMany({ where: { businessId: biz.id } });
            await tx.auditLog.deleteMany({ where: { businessId: biz.id } });
            await tx.subscription.deleteMany({ where: { businessId: biz.id } });
            await tx.user.updateMany({
              where: { businessId: biz.id, id: { not: id } },
              data: { businessId: null },
            });
            await tx.business.delete({ where: { id: biz.id } });
          }
        }

        await reassignUserTasks(tx, id, user.uid);

        await tx.comment.deleteMany({ where: { authorId: id } });
        await tx.auditLog.deleteMany({ where: { actorId: id } });
        await tx.user.update({
          where: { id },
          data: { assignedTasks: { set: [] } },
        });
        await tx.user.delete({ where: { id } });
      });

      await getAdminAuth().deleteUser(id).catch(() => {});

      await writeAuditLog({
        actorId: user.uid,
        actorRole: user.role,
        businessId: user.businessId,
        action: 'user.delete',
        targetType: 'USER',
        targetId: id,
        metadata: { deleteBusinesses, bulk: true },
      });

      results.deleted++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.errors.push({ id, reason: message });
    }
  }

  return NextResponse.json(results);
});
