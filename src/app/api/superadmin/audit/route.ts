import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { prisma } from '@/lib/prisma';
import { handle } from '@/lib/api/route-handler';

export const GET = handle(async (req: NextRequest) => {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const denied = requireRole(user, ['superadmin']);
  if (denied) return denied;

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      actor: {
        select: {
          name: true,
          email: true,
          role: true,
          isActive: true,
          avatar: true,
          phone: true,
          lastLogin: true,
          createdAt: true,
        },
      },
      business: { select: { name: true } },
    },
  });
  return NextResponse.json({ logs });
});
