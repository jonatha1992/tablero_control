import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const denied = requireRole(user, ['superadmin']);
  if (denied) return denied;

  const { id } = await params;

  const business = await prisma.business.findUnique({ where: { id } });
  if (!business) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const users = await prisma.user.findMany({
    where: { businessId: id },
    select: { id: true, email: true, name: true, role: true, locationId: true, isActive: true, createdAt: true },
  });

  const locations = await prisma.location.findMany({
    where: { businessId: id },
    select: { id: true, name: true, type: true, status: true },
  });

  const teams = await prisma.team.findMany({
    where: { businessId: id },
    include: {
      _count: {
        select: { members: true }
      }
    }
  });

  return NextResponse.json({ business, users, locations, teams });
}
