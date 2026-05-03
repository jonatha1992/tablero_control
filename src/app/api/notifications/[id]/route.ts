import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-helpers';
import { prisma } from '@/lib/prisma';

// PATCH /api/notifications/[id] — marcar una notificación como leída
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userOrResponse = await requireUser(req);
  if (userOrResponse instanceof NextResponse) return userOrResponse;
  const user = userOrResponse;

  const { id } = await params;

  await prisma.notification.updateMany({
    where: { id, userId: user.uid },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
