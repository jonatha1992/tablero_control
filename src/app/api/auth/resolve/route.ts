import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/api/auth-helpers';
import { handle } from '@/lib/api/route-handler';

export const GET = handle(async (request: NextRequest) => {
  const authed = await requireUser(request);
  if (authed instanceof NextResponse) return authed;

  const login = request.nextUrl.searchParams.get('login')?.trim();
  if (!login) {
    return NextResponse.json({ error: 'missing_login' }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: { equals: login, mode: 'insensitive' } },
        { email: { equals: login, mode: 'insensitive' } },
      ],
    },
    select: { email: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ email: user.email });
});
