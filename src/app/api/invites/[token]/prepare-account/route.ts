import { NextRequest, NextResponse } from 'next/server';
import { handle } from '@/lib/api/route-handler';
import { prisma } from '@/lib/prisma';
import {
  ensureUniqueUsername,
  nameToUsernameBase,
  syntheticEmail,
} from '@/lib/auth/invite-username';
import {
  inviteErrorCode,
  inviteErrorStatus,
  validateInvite,
} from '@/lib/invites/validate-invite';

export const POST = handle(async (request: NextRequest, { params }: { params: Promise<{ token: string }> }) => {
  const { token: inviteToken } = await params;

  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const name = body.name?.trim() ?? '';
  if (name.length < 2) {
    return NextResponse.json({ error: 'invalid_name' }, { status: 400 });
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

  const base = nameToUsernameBase(name);
  const username = await ensureUniqueUsername(prisma, base);
  const email = syntheticEmail(username);

  return NextResponse.json({ username, email });
});
