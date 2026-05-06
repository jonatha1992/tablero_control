import { NextRequest, NextResponse } from 'next/server';
import { commentService } from '@/services/comment.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { handle } from '@/lib/api/route-handler';

export const DELETE = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { id } = await params;

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
