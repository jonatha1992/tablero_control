import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { getAdminAuth } from '@/lib/firebase/admin';
import { writeAuditLog } from '@/lib/api/audit';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  // Block if user has created tasks (FK without onDelete)
  const taskCount = await prisma.task.count({ where: { creatorId: id } });
  if (taskCount > 0) {
    return NextResponse.json({ error: 'user_has_tasks', count: taskCount }, { status: 409 });
  }

  // Clean up non-cascading FK references before hard delete
  await prisma.$transaction([
    prisma.comment.deleteMany({ where: { authorId: id } }),
    prisma.auditLog.deleteMany({ where: { actorId: id } }),
  ]);

  await prisma.user.delete({ where: { id } });

  // Delete from Firebase Auth (ignore if already gone)
  await getAdminAuth().deleteUser(id).catch(() => {});

  // Optionally delete empty business
  const deleteBusiness = request.nextUrl.searchParams.get('deleteBusiness') === 'true';
  if (deleteBusiness && target.businessId) {
    const otherUsers = await prisma.user.count({ where: { businessId: target.businessId } });
    if (otherUsers === 0) {
      await prisma.business.delete({ where: { id: target.businessId } });
    }
  }

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'user.delete',
    targetType: 'USER',
    targetId: id,
    metadata: { deleteBusiness },
  });

  return NextResponse.json({ ok: true });
}
