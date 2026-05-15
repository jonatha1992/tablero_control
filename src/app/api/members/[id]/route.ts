import { NextRequest, NextResponse } from 'next/server';
import { teamService } from '@/services/team.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { can } from '@/lib/permissions';
import { userRepository, businessRepository } from '@/repositories';
import { handle } from '@/lib/api/route-handler';
import { sendNotification } from '@/lib/notifications';

export const PATCH = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  if (!can(user.data, 'business.users.crud')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const target = await userRepository.findById(id);
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Use admin's businessId â€” target.businessId is a cached field that may point to a different active business
  const operatingBusinessId = user.data.businessId;
  if (!operatingBusinessId) return NextResponse.json({ error: 'No business' }, { status: 400 });

  const membership = target.memberships?.find((m) => m.businessId === operatingBusinessId);
  if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 });

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
    sendNotification({ userId: id, title: 'Tu rol fue actualizado', body: `Tu rol cambiÃ³ a ${data.role}`, type: 'info', link: '/dashboard' }).catch(() => {});
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

  // Use admin's businessId â€” target.businessId is a cached field that may point to a different active business
  const operatingBusinessId = user.data.businessId;
  if (!operatingBusinessId) return NextResponse.json({ error: 'No business' }, { status: 400 });

  const membership = target.memberships?.find((m) => m.businessId === operatingBusinessId && m.isActive);
  if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Prevent removing the owner
  const business = await businessRepository.findById(operatingBusinessId);
  if (business?.ownerId === id) {
    return NextResponse.json({ error: 'cannot_remove_owner' }, { status: 403 });
  }

  await teamService.removeMember(id, operatingBusinessId);
  sendNotification({ userId: id, title: 'Acceso al equipo removido', body: 'Fuiste removido del equipo', type: 'info', link: '/dashboard' }).catch(() => {});

  if (membership.role === 'admin') {
    await teamService.handleManagerDeletion(id, operatingBusinessId);
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
