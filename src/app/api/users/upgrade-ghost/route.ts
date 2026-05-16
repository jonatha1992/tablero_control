import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { prisma } from '@/lib/prisma';
import { handle } from '@/lib/api/route-handler';
import { MailService } from '@/services/mail.service';

export const POST = handle(async (req: NextRequest) => {
  const authed = await requireUser(req);
  if (authed instanceof NextResponse) return authed;

  const denied = requireRole(authed, ['superadmin', 'admin']);
  if (denied) return denied;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const { userId, email: rawEmail, password } = body;
  const email = rawEmail?.toLowerCase().trim() ?? '';

  if (!userId || !email || !password) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  // 1. Fetch the user and verify they are a ghost
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.json({ error: 'user_not_found' }, { status: 404 });
  }

  if (!user.isGuest) {
    return NextResponse.json({ error: 'user_not_ghost' }, { status: 400 });
  }

  // Check if they belong to the same business (unless superadmin)
  if (authed.role !== 'superadmin' && user.businessId !== authed.businessId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // 2. Check if email is already in use in DB
  const existingEmail = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' }, id: { not: userId } },
  });

  if (existingEmail) {
    return NextResponse.json({ error: 'email_already_exists' }, { status: 409 });
  }

  // 3. Create user in Firebase Auth using the existing PostgreSQL ID (UUID)
  const adminAuth = getAdminAuth();
  try {
    await adminAuth.createUser({
      uid: userId, // CRITICAL: Link Firebase Auth to the existing Postgres ID
      email: email,
      password: password,
      displayName: user.name,
      emailVerified: false,
    });
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'email_already_exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'auth_creation_failed' }, { status: 500 });
  }

  // 4. Update the user in PostgreSQL
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isGuest: false,
        email: email,
      },
    });
  } catch {
    // If DB update fails, we should ideally rollback Firebase Auth, but for now we log it.
    console.error(`[upgrade-ghost] Failed to update PostgreSQL for user ${userId}.`);
    return NextResponse.json({ error: 'db_write_failed' }, { status: 500 });
  }

  // 5. Set custom claims in Firebase
  try {
    await adminAuth.setCustomUserClaims(userId, { role: user.role, businessId: user.businessId });
  } catch (err) {
    console.error('[upgrade-ghost] setCustomUserClaims failed (non-fatal):', err);
  }

  // 6. Audit Log
  await writeAuditLog({
    actorId: authed.uid,
    actorRole: authed.role,
    businessId: authed.businessId,
    action: 'user.upgrade_ghost',
    targetType: 'USER',
    targetId: userId,
    metadata: { email, role: user.role },
  });

  // 7. Send Welcome/Invite Email
  if (user.businessId) {
    try {
      const biz = await prisma.business.findUnique({ where: { id: user.businessId }, select: { name: true } });
      const teamName = biz?.name ?? 'el equipo';
      const inviterName = authed.data.name ?? authed.data.email ?? 'Un administrador';
      const inviterEmail = authed.data.email;
      await MailService.sendInviteEmail(email, inviterName, teamName, inviterEmail);
    } catch {
      // Ignore mail errors
    }
  }

  return NextResponse.json({ success: true, uid: userId, email });
});
