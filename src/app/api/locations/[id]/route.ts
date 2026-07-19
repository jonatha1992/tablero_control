import { NextRequest, NextResponse } from 'next/server';
import { locationService } from '@/services/location.service';
import { requireUser, requireActiveSubscription } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { assertSameTenant } from '@/lib/permissions/tenant-guard';
import { canMutateLocation } from '@/lib/permissions/location-access';
import { handle } from '@/lib/api/route-handler';

interface Props {
  params: Promise<{ id: string }>;
}

export const GET = handle(async (request: NextRequest, { params }: Props) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  const location = await locationService.getById(id);
  if (!location) {
    return NextResponse.json({ error: 'Sector no encontrado' }, { status: 404 });
  }
  assertSameTenant(user.data, { businessId: location.businessId });
  return NextResponse.json(location);
});

export const PATCH = handle(async (request: NextRequest, { params }: Props) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const subDenied = requireActiveSubscription(user, request);
  if (subDenied) return subDenied;

  try {
    const { id } = await params;
    const location = await locationService.getById(id);
    if (!location) {
      return NextResponse.json({ error: 'Sector no encontrado' }, { status: 404 });
    }
    assertSameTenant(user.data, { businessId: location.businessId });

    if (!canMutateLocation(user.data, 'update', location)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const isArchiveAction = body?.action === 'archive';
    const updated = isArchiveAction
      ? await locationService.archive(id)
      : await locationService.update(id, body);

    await writeAuditLog({
      actorId: user.uid,
      actorRole: user.role,
      businessId: user.businessId,
      action: 'business.update',
      targetType: 'LOCATION',
      targetId: id,
      metadata: isArchiveAction
        ? { action: 'archive', status: 'closed' }
        : body,
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});

export const DELETE = handle(async (request: NextRequest, { params }: Props) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const subDenied = requireActiveSubscription(user, request);
  if (subDenied) return subDenied;

  try {
    const { id } = await params;
    const location = await locationService.getById(id);
    if (!location) {
      return NextResponse.json({ error: 'Sector no encontrado' }, { status: 404 });
    }
    assertSameTenant(user.data, { businessId: location.businessId });

    const body = await request.json().catch(() => null);
    const isArchiveAction = body?.action === 'archive';
    const requiredPermission = isArchiveAction ? 'update' : 'delete';

    if (!canMutateLocation(user.data, requiredPermission, location)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    if (isArchiveAction) {
      const archived = await locationService.archive(id);

      await writeAuditLog({
        actorId: user.uid,
        actorRole: user.role,
        businessId: user.businessId,
        action: 'business.update',
        targetType: 'LOCATION',
        targetId: id,
        metadata: { action: 'archive', status: 'closed' },
      });

      return NextResponse.json(archived);
    }

    await locationService.delete(id);

    await writeAuditLog({
      actorId: user.uid,
      actorRole: user.role,
      businessId: user.businessId,
      action: 'business.update',
      targetType: 'LOCATION',
      targetId: id,
      metadata: { deleted: true },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});
