import { NextRequest, NextResponse } from 'next/server';
import { teamService } from '@/services/team.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { can, assertSameTenant } from '@/lib/permissions';
import { userRepository, businessRepository } from '@/repositories';
import { handle } from '@/lib/api/route-handler';
import { prisma } from '@/lib/prisma';

export const PATCH = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  if (!can(user.data, 'business.users.crud')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const target = await userRepository.findById(id);
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  assertSameTenant(user.data, { businessId: target.businessId });

  const operatingBusinessId = target.businessId;
  if (!operatingBusinessId) return NextResponse.json({ error: 'No business' }, { status: 400 });

  const data = await request.json();

  if (data.reactivate === true) {
    await teamService.reactivateMember(id, operatingBusinessId);
    await writeAuditLog({
      actorId: user.uid,
      actorRole: user.role,
      businessId: user.businessId,
      action: 'user.reactivate',
      targetType: 'USER',
      targetId: id,
    });
    const reactivated = await userRepository.findById(id);
    return NextResponse.json(reactivated);
  }

  if (data.role) {
    if (user.role !== 'superadmin' && data.role === 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await teamService.changeRole(id, operatingBusinessId, data.role);
  }

  if (data.locationAssignments?.length) {
    const locationIds = (data.locationAssignments as { locationId: string }[]).map((a) => a.locationId);
    const validCount = await prisma.location.count({
      where: { id: { in: locationIds }, businessId: operatingBusinessId },
    });
    if (validCount !== locationIds.length) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
  }

  const member = await teamService.updateMember(id, data, operatingBusinessId);

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'user.update',
    targetType: 'USER',
    targetId: id,
    metadata: { ...data },
  });

  return NextResponse.json(member);
});

export const DELETE = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  if (!can(user.data, 'business.users.crud')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const target = await userRepository.findById(id);
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  assertSameTenant(user.data, { businessId: target.businessId });

  if (!target.businessId) {
    return NextResponse.json({ error: 'No business' }, { status: 400 });
  }

  // Prevent removing the owner
  const business = await businessRepository.findById(target.businessId);
  if (business?.ownerId === id) {
    return NextResponse.json({ error: 'cannot_remove_owner' }, { status: 403 });
  }

  await teamService.removeMember(id, target.businessId);

  if (target.role === 'admin' && target.businessId) {
    await teamService.handleManagerDeletion(id, target.businessId);
  }

  void writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'user.deactivate',
    targetType: 'USER',
    targetId: id,
  });

  return NextResponse.json({ ok: true });
});
