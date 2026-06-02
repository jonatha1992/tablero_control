import { NextRequest, NextResponse } from 'next/server';
import { commentService } from '@/services/comment.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { assertResourceBelongsToBusiness } from '@/lib/permissions/tenant-guard';
import { handle } from '@/lib/api/route-handler';
import { prisma } from '@/lib/prisma';

async function getCommentWithBusinessId(commentId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      authorId: true,
      task: {
        select: {
          businessId: true,
          project: { select: { businessId: true } },
          location: { select: { businessId: true } },
          creator: { select: { businessId: true } },
        },
      },
    },
  });
  if (!comment) return null;
  const businessId = comment.task?.businessId ?? comment.task?.project?.businessId ?? comment.task?.location?.businessId ?? comment.task?.creator?.businessId ?? null;
  return { authorId: comment.authorId, businessId };
}

export const DELETE = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { id } = await params;

  const comment = await getCommentWithBusinessId(id);
  if (!comment) {
    return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 });
  }
  assertResourceBelongsToBusiness(user.data, comment.businessId);

  const isOwner = comment.authorId === user.uid;
  const canDeleteAny = user.role === 'admin' || user.role === 'superadmin' || user.role === 'responsable';
  if (!isOwner && !canDeleteAny) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  await commentService.removeComment(id);

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'comment.delete',
    targetType: 'COMMENT',
    targetId: id,
  });

  return NextResponse.json({ ok: true });
});
