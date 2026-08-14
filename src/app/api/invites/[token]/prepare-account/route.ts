import { NextRequest, NextResponse } from 'next/server';
import { handle } from '@/lib/api/route-handler';
import { prisma } from '@/lib/prisma';
import { ensureUniqueUsername, nameToUsernameBase } from '@/lib/auth/invite-username';
import {
  inviteErrorCode,
  inviteErrorStatus,
  validateInvite,
} from '@/lib/invites/validate-invite';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST = handle(async (request: NextRequest, { params }: { params: Promise<{ token: string }> }) => {
  const { token: inviteToken } = await params;

  let body: { name?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const name = body.name?.trim() ?? '';
  if (name.length < 2) {
    return NextResponse.json({ error: 'invalid_name' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? '';
  if (!email || !EMAIL_REGEX.test(email) || email.length > 150) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }

  const invite = await prisma.businessInvite.findUnique({
    where: { id: inviteToken },
  });

  const validation = validateInvite(invite);
  if (!validation.valid) {
    return NextResponse.json(
      { error: inviteErrorCode(validation.reason) },
      { status: inviteErrorStatus(validation.reason) },
    );
  }

  const emailTaken = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { id: true },
  });
  if (emailTaken) {
    return NextResponse.json({ error: 'email_already_exists' }, { status: 409 });
  }

  const base = nameToUsernameBase(name);
  const username = await ensureUniqueUsername(prisma, base);

  return NextResponse.json({ username, email });
});
