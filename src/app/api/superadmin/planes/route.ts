import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/api/audit';
import { getAllEffectivePlanConfigs } from '@/lib/mercadopago/plan-config';
import type { PlanId } from '@/types/domain/subscription';

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const denied = requireRole(user, ['superadmin']);
  if (denied) return denied;

  const plans = await getAllEffectivePlanConfigs();
  return NextResponse.json({ plans });
}

interface PatchBody {
  planId: PlanId;
  priceMonthly?: number;
  priceYearly?: number;
  limitUsers?: number;
  limitLocations?: number;
  limitProjects?: number;
  limitAttachments?: number;
}

export async function PATCH(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const denied = requireRole(user, ['superadmin']);
  if (denied) return denied;

  let body: PatchBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const { planId, ...fields } = body;
  if (!planId) return NextResponse.json({ error: 'planId requerido' }, { status: 400 });

  const updated = await prisma.planConfig.upsert({
    where: { planId },
    create: {
      planId,
      priceMonthly: fields.priceMonthly ?? 0,
      priceYearly: fields.priceYearly ?? 0,
      limitUsers: fields.limitUsers ?? -1,
      limitLocations: fields.limitLocations ?? -1,
      limitProjects: fields.limitProjects ?? -1,
      limitAttachments: fields.limitAttachments ?? -1,
      updatedBy: user.uid,
    },
    update: {
      ...(fields.priceMonthly !== undefined && { priceMonthly: fields.priceMonthly }),
      ...(fields.priceYearly !== undefined && { priceYearly: fields.priceYearly }),
      ...(fields.limitUsers !== undefined && { limitUsers: fields.limitUsers }),
      ...(fields.limitLocations !== undefined && { limitLocations: fields.limitLocations }),
      ...(fields.limitProjects !== undefined && { limitProjects: fields.limitProjects }),
      ...(fields.limitAttachments !== undefined && { limitAttachments: fields.limitAttachments }),
      updatedBy: user.uid,
    },
  });

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    action: 'plan_config.update',
    targetType: 'PlanConfig',
    targetId: planId,
    metadata: fields,
    ip: req.headers.get('x-forwarded-for') ?? undefined,
  });

  return NextResponse.json({ ok: true, updated });
}
