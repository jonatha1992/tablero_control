import { NextRequest, NextResponse } from 'next/server';
import { projectService, ProjectLimitError } from '@/services/project.service';
import { requireUser, requireRole, requireActiveSubscription } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { assertSameTenant } from '@/lib/permissions/tenant-guard';
import { handle } from '@/lib/api/route-handler';
import { prisma } from '@/lib/prisma';

export const GET = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { searchParams } = request.nextUrl;
  const businessId = searchParams.get('businessId');

  if (!businessId) {
    return NextResponse.json({ error: 'businessId requerido' }, { status: 400 });
  }

  assertSameTenant(user.data, { businessId });

  const projects = await projectService.getByBusiness(businessId);
  return NextResponse.json(projects);
});

export const POST = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const denied = requireRole(user, ['superadmin', 'admin']);
  if (denied) return denied;

  const subDenied = requireActiveSubscription(user, request);
  if (subDenied) return subDenied;

  const body = await request.json();
  const { name, description, teamId, businessId, startDate, endDate } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: 'name requerido' }, { status: 400 });
  }

  const targetBusinessId = user.role === 'superadmin' ? businessId ?? user.businessId : user.businessId;

  if (teamId) {
    const team = await prisma.team.findUnique({ where: { id: teamId }, select: { businessId: true } });
    if (!team || team.businessId !== targetBusinessId) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
  }

  // Get business plan for limit check
  const business = await prisma.business.findUnique({
    where: { id: targetBusinessId },
    select: { plan: true },
  });

  try {
    const project = await projectService.create(
      {
        name: name.trim(),
        description,
        teamId,
        businessId: targetBusinessId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
      user.role,
      business?.plan ?? 'free'
    );

    await writeAuditLog({
      actorId: user.uid,
      actorRole: user.role,
      businessId: targetBusinessId,
      action: 'project.create',
      targetType: 'PROJECT',
      targetId: project.id,
      metadata: { name: project.name },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof ProjectLimitError) {
      return NextResponse.json(
        { error: 'projects_limit_exceeded', limit: error.limit, current: error.current },
        { status: 429 }
      );
    }
    throw error;
  }
});
