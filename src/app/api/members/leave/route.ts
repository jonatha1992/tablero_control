import { NextRequest, NextResponse } from 'next/server';
import { teamService } from '@/services/team.service';
import { requireUser, invalidateAuthedUserCache } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { userRepository, businessRepository } from '@/repositories';
import { handle } from '@/lib/api/route-handler';
import { sendNotification } from '@/lib/notifications';
import { getAdminAuth } from '@/lib/firebase/admin';
import { isPlatformSuperAdmin } from '@/lib/platform-superadmin';

/**
 * POST /api/members/leave — self-service "leave business", distinct from the
 * admin-driven DELETE /api/members/[id] (which stays self-removal-blocked).
 * See docs/permissions.md and docs/decisions/ (leave-business).
 */
export const POST = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const businessId = user.data.businessId;
  if (!businessId) {
    return NextResponse.json({ error: 'no_business' }, { status: 400 });
  }

  const target = await userRepository.findById(user.uid);
  const membership = target?.memberships?.find((m) => m.businessId === businessId && m.isActive);
  if (!membership) {
    return NextResponse.json({ error: 'not_member' }, { status: 404 });
  }

  const business = await businessRepository.findById(businessId);
  const isOwner = business?.ownerId === user.uid;
  let newOwnerId: string | undefined;
  if (request.headers.get('Content-Type')?.includes('application/json')) {
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: 'invalid_body' }, { status: 400 }); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }
    const proposed = (body as Record<string, unknown>).newOwnerId;
    if (proposed !== undefined && (typeof proposed !== 'string' || !proposed.trim())) {
      return NextResponse.json({ error: 'invalid_new_owner' }, { status: 400 });
    }
    newOwnerId = typeof proposed === 'string' ? proposed.trim() : undefined;
  }
  if (isOwner && !newOwnerId) {
    return NextResponse.json({ error: 'cannot_leave_owner' }, { status: 403 });
  }
  if (!isOwner && newOwnerId) {
    return NextResponse.json({ error: 'not_business_owner' }, { status: 403 });
  }

  // membership.role here comes from findById's raw memberships (not normalized
  // like findByBusiness, which folds 'superadmin' into 'admin' for the client —
  // see leave-business-button.tsx hasOtherAdmin), so both values can appear.
  const isAdmin = membership.role === 'admin' || membership.role === 'superadmin';
  const otherAdmins = await userRepository.findActiveAdminOrSuperadminsByBusiness(businessId, user.uid);

  if (isOwner && !otherAdmins.some((admin) => admin.id === newOwnerId)) {
    return NextResponse.json({ error: 'invalid_new_owner' }, { status: 400 });
  }

  if (isAdmin && otherAdmins.length === 0) {
    return NextResponse.json({ error: 'last_admin_cannot_leave' }, { status: 409 });
  }

  // Reassign any locations the leaving user manages in THIS business only
  // (never touches other tenants — see docs/permissions.md known-issue re: handleManagerDeletion)
  // and deactivate the membership atomically in one transaction.
  const reassignTarget = newOwnerId ?? otherAdmins[0]?.id ?? business?.ownerId ?? null;
  try {
    if (newOwnerId) {
      await teamService.leaveBusiness(user.uid, businessId, reassignTarget, newOwnerId);
    } else {
      await teamService.leaveBusiness(user.uid, businessId, reassignTarget);
    }
  } catch (err) {
    if (err instanceof Error && ['invalid_new_owner', 'not_business_owner', 'cannot_leave_owner', 'not_member', 'last_admin_cannot_leave'].includes(err.message)) {
      const status = err.message === 'invalid_new_owner' ? 400 : err.message === 'not_member' ? 404 : 409;
      return NextResponse.json({ error: err.message }, { status });
    }
    throw err;
  }

  const refreshed = await userRepository.findById(user.uid);
  const remainingBusinesses = (refreshed?.memberships ?? []).filter((m) => m.isActive).length;

  try {
    await getAdminAuth().setCustomUserClaims(user.uid, {
      role: refreshed?.role ?? user.role,
      businessId: null,
    });
  } catch (err) {
    console.error('[leave] setCustomUserClaims failed (non-fatal):', err);
  }
  invalidateAuthedUserCache(user.uid);

  if (newOwnerId) {
    await writeAuditLog({
      actorId: user.uid,
      actorRole: user.role,
      businessId,
      action: 'business.update',
      targetType: 'BUSINESS',
      targetId: businessId,
      metadata: { previousOwnerId: user.uid, newOwnerId },
    });
  }

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId,
    action: 'user.leave',
    targetType: 'USER',
    targetId: user.uid,
  });

  for (const admin of otherAdmins) {
    sendNotification({
      userId: admin.id,
      title: 'Un miembro salió del espacio',
      body: `${user.data.name ?? 'Un usuario'} salió del equipo`,
      type: 'info',
      link: '/dashboard/equipo',
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, remainingBusinesses, isPlatformSuperAdmin: isPlatformSuperAdmin(refreshed ?? user.data) });
});
