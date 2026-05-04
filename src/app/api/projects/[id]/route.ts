import { NextRequest, NextResponse } from 'next/server';
import { projectService } from '@/services/project.service';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { handle } from '@/lib/api/route-handler';

export const GET = handle(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const project = await projectService.getById(id);
  if (!project) {
    return NextResponse.json({ error: 'project_not_found' }, { status: 404 });
  }
  return NextResponse.json(project);
});

export const PATCH = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const denied = requireRole(user, ['superadmin', 'admin']);
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json();

  const project = await projectService.update(id, {
    name: body.name,
    description: body.description,
    teamId: body.teamId,
    status: body.status,
    startDate: body.startDate ? new Date(body.startDate) : body.startDate === null ? null : undefined,
    endDate: body.endDate ? new Date(body.endDate) : body.endDate === null ? null : undefined,
  });

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'project.update' as any,
    targetType: 'PROJECT',
    targetId: id,
    metadata: { name: project.name },
  });

  return NextResponse.json(project);
});

export const DELETE = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const denied = requireRole(user, ['superadmin', 'admin']);
  if (denied) return denied;

  const { id } = await params;
  await projectService.delete(id);

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'project.delete' as any,
    targetType: 'PROJECT',
    targetId: id,
  });

  return NextResponse.json({ ok: true });
});
