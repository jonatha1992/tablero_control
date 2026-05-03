import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const schema = z.object({
  token: z.string().min(1),
  action: z.enum(['add', 'remove']),
});

export async function POST(req: Request) {
  try {
    const userOrResponse = await requireUser(req);
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse;
    }
    const user = userOrResponse;

    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_request', details: parsed.error.format() }, { status: 400 });
    }

    const { token, action } = parsed.data;

    const dbUser = await prisma.user.findUnique({
      where: { id: user.uid },
      select: { fcmTokens: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'user_not_found' }, { status: 404 });
    }

    let updatedTokens = dbUser.fcmTokens || [];

    if (action === 'add') {
      if (!updatedTokens.includes(token)) {
        updatedTokens.push(token);
      }
    } else if (action === 'remove') {
      updatedTokens = updatedTokens.filter((t) => t !== token);
    }

    await prisma.user.update({
      where: { id: user.uid },
      data: { fcmTokens: updatedTokens },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[FCM_TOKEN_POST]', error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
