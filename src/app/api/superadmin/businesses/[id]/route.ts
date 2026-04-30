import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
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

  const projects = await prisma.project.findMany({
    where: { businessId: id },
    include: {
      _count: {
        select: { tasks: true }
      }
    }
  });

  return NextResponse.json({ business, users, locations, teams, projects });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const denied = requireRole(user, ['superadmin']);
  if (denied) return denied;

  const { id } = await params;

  const business = await prisma.business.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!business) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  try {
    await prisma.$transaction(async (tx) => {
      // Location→Task relation is SetNull (not Cascade), so delete location-only tasks explicitly
      const locationIds = (await tx.location.findMany({
        where: { businessId: id },
        select: { id: true },
      })).map((l) => l.id);

      if (locationIds.length > 0) {
        await tx.task.deleteMany({
          where: { locationId: { in: locationIds }, projectId: null },
        });
      }

      // Invoice has no cascade on Business → delete manually
      await tx.invoice.deleteMany({ where: { businessId: id } });

      // Unlink users (don't delete them — they may have data elsewhere)
      await tx.user.updateMany({
        where: { businessId: id },
        data: { businessId: null, locationId: null },
      });

      // Business delete cascades: Location, Team → TeamMember, Project → Task → Comment/Attachment, Subscription
      await tx.business.delete({ where: { id } });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'delete_failed', message }, { status: 500 });
  }

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'business.delete',
    targetType: 'BUSINESS',
    targetId: id,
    metadata: { name: business.name },
  });

  return NextResponse.json({ ok: true });
}
