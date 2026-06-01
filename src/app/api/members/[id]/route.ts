import { NextRequest, NextResponse } from 'next/server';
import { teamService } from '@/services/team.service';
import { requireUser, requireActiveSubscription } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { canManageBusinessUsers } from '@/lib/permissions';
import { isBusinessMemberRole, isPlatformSuperAdmin } from '@/lib/platform-superadmin';
import { userRepository, businessRepository } from '@/repositories';
import { handle } from '@/lib/api/route-handler';
import { sendNotification } from '@/lib/notifications';

export const PATCH = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const operatingBusinessId = user.data.businessId;
  if (!operatingBusinessId) return NextResponse.json({ error: 'No business' }, { status: 400 });

  const business = await businessRepository.findById(operatingBusinessId);
  if (!canManageBusinessUsers(user.data, business?.ownerId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const subDenied = requireActiveSubscription(user, request);
  if (subDenied) return subDenied;

  const { id } = await params;
  const target = await userRepository.findById(id);
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });

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
    if (!isBusinessMemberRole(data.role)) {
      return NextResponse.json(
        { error: 'invalid_business_role', detail: 'El rol de empresa no puede ser superadmin del sistema.' },
        { status: 400 }
      );
    }
    try {
      await teamService.changeRole(id, operatingBusinessId, data.role);
    } catch {
      return NextResponse.json({ error: 'invalid_business_role' }, { status: 400 });
    }
    sendNotification({ userId: id, title: 'Tu rol fue actualizado', body: `Tu rol cambió a ${data.role}`, type: 'info', link: '/dashboard' }).catch(() => {});
  }

  const member = await teamService.updateMember(id, data);
  const refreshed = await userRepository.findById(id);
  const membershipRole = refreshed?.memberships?.find(
    (m) => m.businessId === operatingBusinessId && m.isActive
  )?.role;
  const displayRole =
    membershipRole === 'superadmin' ? 'admin' : membershipRole ?? member.role;
  const responseMember = {
    ...(refreshed ?? member),
    role: displayRole,
    isPlatformSuperAdmin: refreshed ? isPlatformSuperAdmin(refreshed) : false,
  };

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'user.update',
    targetType: 'USER',
    targetId: id,
    metadata: { ...data },
  });

  return NextResponse.json(responseMember);
});

export const DELETE = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const operatingBusinessId = user.data.businessId;
  if (!operatingBusinessId) return NextResponse.json({ error: 'No business' }, { status: 400 });

  const business = await businessRepository.findById(operatingBusinessId);
  if (!canManageBusinessUsers(user.data, business?.ownerId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const subDenied = requireActiveSubscription(user, request);
  if (subDenied) return subDenied;

  const { id } = await params;

  if (id === user.uid) {
    return NextResponse.json({ error: 'cannot_remove_self' }, { status: 400 });
  }

  const target = await userRepository.findById(id);
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const membership = target.memberships?.find((m) => m.businessId === operatingBusinessId && m.isActive);
  if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 });

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
