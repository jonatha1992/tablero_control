import { NextRequest, NextResponse } from 'next/server';
import { teamService } from '@/services/team.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { assertSameTenant } from '@/lib/permissions/tenant-guard';

export async function GET(request: NextRequest) {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { searchParams } = request.nextUrl;
  const businessId = searchParams.get('businessId');
  if (!businessId) return NextResponse.json({ error: 'businessId requerido' }, { status: 400 });

  assertSameTenant(user.data, { businessId });

  const members = await teamService.getMembersByBusiness(businessId);
  return NextResponse.json(members);
}

export async function POST(request: NextRequest) {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { dto, businessId } = await request.json();
  assertSameTenant(user.data, { businessId });

  const member = await teamService.inviteMember(dto, businessId);

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'user.create',
    targetType: 'USER',
    targetId: member.id,
    metadata: { email: dto.email, role: dto.role },
  });

  return NextResponse.json(member, { status: 201 });
}
