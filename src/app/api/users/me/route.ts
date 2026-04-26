import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-helpers';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/api/audit';

export async function PATCH(req: NextRequest) {
  const authed = await requireUser(req);
  if (authed instanceof NextResponse) return authed;

  const body = await req.json() as { name?: string; avatar?: string; phone?: string };

  const updated = await prisma.user.update({
    where: { id: authed.uid },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.avatar !== undefined && { avatar: body.avatar }),
      ...(body.phone !== undefined && { phone: body.phone }),
    },
    select: { id: true, name: true, email: true, role: true, avatar: true, phone: true },
  });

  await writeAuditLog({
    actorId: authed.uid,
    actorRole: authed.role,
    businessId: authed.businessId,
    action: 'user.update',
    targetType: 'USER',
    targetId: authed.uid,
    metadata: { fields: Object.keys(body).filter((k) => body[k as keyof typeof body] !== undefined) },
    ip: req.headers.get('x-forwarded-for') ?? undefined,
  });

  return NextResponse.json(updated);
}
