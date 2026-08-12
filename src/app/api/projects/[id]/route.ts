import { NextRequest, NextResponse } from 'next/server';
import {
  LastActiveProjectError,
  ProjectLimitError,
  projectService,
} from '@/services/project.service';
import { requireUser, requireRole, requireActiveSubscription } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { assertResourceBelongsToBusiness } from '@/lib/permissions/tenant-guard';
import { handle } from '@/lib/api/route-handler';
import { prisma } from '@/lib/prisma';

const VALID_STATUSES = new Set(['planning', 'active', 'paused', 'completed', 'archived']);

export const GET = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  const project = await projectService.getById(id);
  if (!project) {
    return NextResponse.json({ error: 'project_not_found' }, { status: 404 });
  }

  assertResourceBelongsToBusiness(user.data, project.businessId);
  return NextResponse.json(project);
});

export const PATCH = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const denied = requireRole(user, ['superadmin', 'admin']);
  if (denied) return denied;

  const subDenied = requireActiveSubscription(user, request);
  if (subDenied) return subDenied;

  const { id } = await params;
  const project = await projectService.getById(id);
  if (!project) {
    return NextResponse.json({ error: 'project_not_found' }, { status: 404 });
  }

  assertResourceBelongsToBusiness(user.data, project.businessId);

  const body = await request.json();
  const action = body?.action;
  if (action !== undefined && action !== 'archive' && action !== 'restore') {
    return NextResponse.json({ error: 'invalid_action' }, { status: 400 });
  }
  if (body?.status !== undefined && !VALID_STATUSES.has(body.status)) {
    return NextResponse.json({ error: 'invalid_status' }, { status: 400 });
  }
  if (action === undefined && (body?.status === 'archived' || (project.status === 'archived' && body?.status))) {
    return NextResponse.json({ error: 'project_state_action_required' }, { status: 400 });
  }
  if (body?.teamId) {
    const team = await prisma.team.findUnique({ where: { id: body.teamId }, select: { businessId: true } });
    if (!team || team.businessId !== project.businessId) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
  }

  let updated;
  try {
    if (action === 'archive') {
      updated = await projectService.archive(id);
    } else if (action === 'restore') {
      const business = await prisma.business.findUnique({
        where: { id: project.businessId ?? undefined },
        select: { plan: true },
      });
      updated = await projectService.restore(id, user.role, business?.plan ?? 'free');
    } else {
      updated = await projectService.update(id, {
        name: body.name,
        description: body.description,
        teamId: body.teamId,
        status: body.status,
        startDate: body.startDate ? new Date(body.startDate) : body.startDate === null ? null : undefined,
        endDate: body.endDate ? new Date(body.endDate) : body.endDate === null ? null : undefined,
      });
    }
  } catch (error) {
    if (error instanceof LastActiveProjectError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof ProjectLimitError) {
      return NextResponse.json(
        { error: error.message, limit: error.limit, current: error.current },
        { status: 409 },
      );
    }
    throw error;
  }

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'project.update',
    targetType: 'PROJECT',
    targetId: id,
    metadata: action
      ? { action, status: updated.status, name: updated.name }
      : { name: updated.name },
  });

  return NextResponse.json(updated);
});

export const DELETE = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const denied = requireRole(user, ['superadmin', 'admin']);
  if (denied) return denied;

  const subDenied = requireActiveSubscription(user, request);
  if (subDenied) return subDenied;

  const { id } = await params;
  const project = await projectService.getById(id);
  if (!project) {
    return NextResponse.json({ error: 'project_not_found' }, { status: 404 });
  }

  assertResourceBelongsToBusiness(user.data, project.businessId);

  await projectService.delete(id);

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'project.delete',
    targetType: 'PROJECT',
    targetId: id,
  });

  return NextResponse.json({ ok: true });
});
