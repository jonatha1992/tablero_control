import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { getAdminAuth } from '@/lib/firebase/admin';
import { writeAuditLog } from '@/lib/api/audit';
import { prisma } from '@/lib/prisma';
import { handle } from '@/lib/api/route-handler';
import type { Prisma } from '@prisma/client';

async function reassignUserTasks(tx: Prisma.TransactionClient, userId: string, fallbackCreatorId: string) {
  // Find all tasks created by this user with their business context
  const tasks = await tx.task.findMany({
    where: { creatorId: userId },
    select: {
      id: true,
      location: { select: { businessId: true } },
      project: { select: { businessId: true } },
    },
  });

  // Group by business
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

  // Reassign grouped tasks to the business admin
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

  // Reassign orphan tasks to the fallback creator (superadmin doing the deletion)
  if (orphanTaskIds.length > 0) {
    await tx.task.updateMany({
      where: { id: { in: orphanTaskIds } },
      data: { creatorId: fallbackCreatorId },
    });
  }

  return { reassigned: tasks.length };
}

export const DELETE = handle(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;
  const denied = requireRole(user, ['superadmin']);
  if (denied) return denied;

  const { id } = await params;

  if (user.uid === id) {
    return NextResponse.json({ error: 'cannot_delete_self' }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, businessId: true, name: true },
  });
  if (!target) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  if (target.role === 'superadmin') {
    return NextResponse.json({ error: 'cannot_delete_superadmin' }, { status: 400 });
  }

  const deleteBusinesses = request.nextUrl.searchParams.get('deleteBusinesses') === 'true';

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Optionally delete businesses where this user is admin
      if (deleteBusinesses) {
        const businesses = await tx.business.findMany({
          where: { adminId: id },
          select: { id: true },
        });

        for (const biz of businesses) {
          // Delete location-only tasks first — Location→Task is SetNull (not Cascade),
          // so these orphan after business.delete() and block user deletion.
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

      // 2. Reassign tasks created by this user to the business admin
      await reassignUserTasks(tx, id, user.uid);

      // 2b. Cascade managed locations when deleting an admin without deleting the business
      if (target.role === 'admin' && target.businessId && !deleteBusinesses) {
        const otherAdmin = await tx.user.findFirst({
          where: { businessId: target.businessId, role: 'admin', isActive: true, id: { not: id } },
        });
        if (otherAdmin) {
          await tx.location.updateMany({ where: { managerId: id }, data: { managerId: otherAdmin.id } });
        } else {
          const locs = await tx.location.findMany({ where: { managerId: id }, select: { id: true } });
          const locIds = locs.map((l) => l.id);
          if (locIds.length > 0) {
            await tx.task.deleteMany({ where: { locationId: { in: locIds }, projectId: null } });
            await tx.location.deleteMany({ where: { id: { in: locIds } } });
          }
        }
      }

      // 3. Clean up non-cascading FK references
      await tx.comment.deleteMany({ where: { authorId: id } });
      await tx.auditLog.deleteMany({ where: { actorId: id } });
      // Transfer business ownership (Business.ownerId FK has no onDelete — Restrict by default)
      await tx.business.updateMany({
        where: { ownerId: id },
        data: { ownerId: user.uid },
      });
      // Delete calendar events (CalendarEvent.creatorId FK has no onDelete — Restrict by default)
      await tx.calendarEvent.deleteMany({ where: { creatorId: id } });
      // Disconnect from all assigned tasks
      await tx.user.update({
        where: { id },
        data: { assignedTasks: { set: [] } },
      });

      // 4. Delete user from Prisma
      await tx.user.delete({ where: { id } });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'delete_failed', message }, { status: 500 });
  }

  // 5. Delete from Firebase Auth (ignore if already gone)
  await getAdminAuth().deleteUser(id).catch(() => { });

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'user.delete',
    targetType: 'USER',
    targetId: id,
    metadata: { deleteBusinesses },
  });

  return NextResponse.json({ ok: true });
});
