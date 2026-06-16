import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-helpers';
import { prisma } from '@/lib/prisma';
import { handle } from '@/lib/api/route-handler';

// GET /api/notifications — últimas 30 notificaciones del usuario
export const GET = handle(async (req: NextRequest) => {
  const userOrResponse = await requireUser(req);
  if (userOrResponse instanceof NextResponse) return userOrResponse;
  const user = userOrResponse;

  const notifications = await prisma.notification.findMany({
    where: { userId: user.uid },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: user.uid, read: false },
  });

  return NextResponse.json({ notifications, unreadCount });
});

// PATCH /api/notifications — marcar todas como leídas
export const PATCH = handle(async (req: NextRequest) => {
  const userOrResponse = await requireUser(req);
  if (userOrResponse instanceof NextResponse) return userOrResponse;
  const user = userOrResponse;

  await prisma.notification.updateMany({
    where: { userId: user.uid, read: false },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
});
