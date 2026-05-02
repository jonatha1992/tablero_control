import { NextRequest, NextResponse } from 'next/server';
import { teamService } from '@/services/team.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { can, assertSameTenant } from '@/lib/permissions';
import { userRepository } from '@/repositories';
import { handle } from '@/lib/api/route-handler';

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

  const data = await request.json();

  if (data.reactivate === true) {
    await teamService.reactivateMember(id);
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

  const member = await teamService.updateMember(id, data);

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

  await teamService.removeMember(id);

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'user.deactivate',
    targetType: 'USER',
    targetId: id,
  });

  return NextResponse.json({ ok: true });
});
