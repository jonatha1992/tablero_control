import { NextRequest, NextResponse } from 'next/server';
import { objectiveService } from '@/services/objective.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { assertSameTenant } from '@/lib/permissions/tenant-guard';
import { handle } from '@/lib/api/route-handler';
import { prisma } from '@/lib/prisma';

export const GET = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { searchParams } = request.nextUrl;
  const businessId = searchParams.get('businessId') ?? user.businessId;

  if (!businessId) {
    return NextResponse.json({ error: 'businessId requerido' }, { status: 400 });
  }

  assertSameTenant(user.data, { businessId });

  const objectives = await objectiveService.getObjectivesByBusiness(businessId);
  return NextResponse.json(objectives);
});

export const POST = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  if (!user.businessId) {
    return NextResponse.json({ error: 'Sin negocio asociado' }, { status: 400 });
  }

  const body = await request.json();

  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
  }

  const toDateTime = (d: string | undefined | null): Date | undefined =>
    d ? new Date(d.includes('T') ? d : `${d}T00:00:00.000Z`) : undefined;

  let projectId: string | undefined;
  if (typeof body.projectId === 'string' && body.projectId.trim()) {
    const proj = await prisma.project.findUnique({
      where: { id: body.projectId },
      select: { businessId: true },
    });
    if (!proj || proj.businessId !== user.businessId) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    projectId = body.projectId;
  }

  const objective = await objectiveService.createObjective({
    name: body.name.trim(),
    description: typeof body.description === 'string' ? body.description : undefined,
    color: typeof body.color === 'string' ? body.color : undefined,
    targetDate: toDateTime(body.targetDate as string | null),
    projectId,
    businessId: user.businessId,
  });

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'objective.create',
    targetType: 'OBJECTIVE',
    targetId: objective.id,
    metadata: { name: objective.name },
  });

  return NextResponse.json(objective, { status: 201 });
});
