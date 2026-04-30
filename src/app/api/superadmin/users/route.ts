import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const denied = requireRole(user, ['superadmin']);
  if (denied) return denied;

  const { searchParams } = req.nextUrl;
  const sort = searchParams.get('sort') ?? 'createdAt';
  const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

  const allowedSorts = ['name', 'email', 'role', 'isActive', 'createdAt'];
  const orderBy = allowedSorts.includes(sort)
    ? { [sort]: order }
    : { createdAt: 'desc' as const };

  const users = await prisma.user.findMany({
    orderBy,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      businessId: true,
      isActive: true,
      createdAt: true,
      business: {
        select: { name: true, plan: true, adminId: true },
      },
    },
  });

  return NextResponse.json({ users });
}
