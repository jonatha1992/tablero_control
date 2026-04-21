import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-helpers';
import { prisma } from '@/lib/prisma';

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

  return NextResponse.json(updated);
}
