import { NextRequest, NextResponse } from 'next/server';
import { commentService } from '@/services/comment.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { assertResourceBelongsToBusiness } from '@/lib/permissions/tenant-guard';
import { handle } from '@/lib/api/route-handler';
import { prisma } from '@/lib/prisma';

async function getCommentBusinessId(commentId: string): Promise<string | null> {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      task: {
        select: {
          project: { select: { businessId: true } },
          location: { select: { businessId: true } },
          creator: { select: { businessId: true } },
        },
      },
    },
  });
  return comment?.task?.project?.businessId ?? comment?.task?.location?.businessId ?? comment?.task?.creator?.businessId ?? null;
}

export const DELETE = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { id } = await params;

  const businessId = await getCommentBusinessId(id);
  assertResourceBelongsToBusiness(user.data, businessId);

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
