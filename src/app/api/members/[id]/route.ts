import { NextRequest, NextResponse } from 'next/server';
import { teamService } from '@/services/team.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  const data = await request.json();
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
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { id } = await params;
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
}
