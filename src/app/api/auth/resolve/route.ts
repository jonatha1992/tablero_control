import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handle } from '@/lib/api/route-handler';

export const GET = handle(async (request: NextRequest) => {
  const login = request.nextUrl.searchParams.get('login')?.trim();
  if (!login) {
    return NextResponse.json({ error: 'missing_login' }, { status: 400 });
  }

  const byUsernameOrEmail = await prisma.user.findFirst({
    where: {
      OR: [
        { username: { equals: login, mode: 'insensitive' } },
        { email: { equals: login, mode: 'insensitive' } },
      ],
    },
    select: { email: true },
  });

  if (byUsernameOrEmail) {
    return NextResponse.json({ email: byUsernameOrEmail.email });
  }

  const byName = await prisma.user.findMany({
    where: { name: { equals: login, mode: 'insensitive' } },
    select: { email: true },
    take: 2,
  });

  if (byName.length === 1) {
    return NextResponse.json({ email: byName[0].email });
  }

  if (byName.length > 1) {
    return NextResponse.json({ error: 'ambiguous_login' }, { status: 409 });
  }

  return NextResponse.json({ error: 'not_found' }, { status: 404 });
});
