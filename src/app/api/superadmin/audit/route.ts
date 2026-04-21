import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const denied = requireRole(user, ['superadmin']);
  if (denied) return denied;

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return NextResponse.json({ logs });
}
