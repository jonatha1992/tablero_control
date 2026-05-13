import { NextRequest, NextResponse } from 'next/server';
import { teamService } from '@/services/team.service';
import { requireUser } from '@/lib/api/auth-helpers';
import { writeAuditLog } from '@/lib/api/audit';
import { assertSameTenant } from '@/lib/permissions/tenant-guard';
import { getAdminAuth } from '@/lib/firebase/admin';
import { MailService } from '@/services/mail.service';
import { handle } from '@/lib/api/route-handler';
import { businessRepository } from '@/repositories';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const GET = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { searchParams } = request.nextUrl;
  const businessId = searchParams.get('businessId');
  if (!businessId) return NextResponse.json({ error: 'businessId requerido' }, { status: 400 });

  assertSameTenant(user.data, { businessId });

  const [members, business] = await Promise.all([
    teamService.getMembersByBusiness(businessId),
    businessRepository.findById(businessId),
  ]);

  const membersWithOwner = members.map((m) => ({ ...m, isOwner: m.id === business?.ownerId }));
  return NextResponse.json(membersWithOwner);
});

export const POST = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const { dto, businessId } = await request.json();
  assertSameTenant(user.data, { businessId });

  const normalizedEmail = dto.email?.toLowerCase().trim() ?? '';
  const adminAuth = getAdminAuth();
  const tempPassword = crypto.randomUUID();

  let firebaseUid: string | undefined;
  try {
    const authUser = await adminAuth.createUser({
      email: normalizedEmail,
      password: tempPassword,
      displayName: dto.name?.trim(),
      emailVerified: true,
    });
    firebaseUid = authUser.uid;
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'auth/email-already-exists') {
      const existingAuth = await adminAuth.getUserByEmail(normalizedEmail);
      firebaseUid = existingAuth.uid;
    } else {
      console.error('[members] Firebase createUser failed:', err);
      return NextResponse.json({ error: 'auth_creation_failed' }, { status: 500 });
    }
  }

  const member = await teamService.inviteMember(dto, businessId, firebaseUid);

  // Generar link para establecer contraseña
  let resetLink: string | undefined;
  try {
    resetLink = await adminAuth.generatePasswordResetLink(normalizedEmail, {
      url: `${APP_URL}/login`,
    });
  } catch (err) {
    console.error('[members] generatePasswordResetLink failed:', err);
  }

  const teamName = user.data.name ?? 'el equipo';
  const inviterName = user.data.name ?? user.data.email ?? 'Un administrador';
  const inviterEmail = user.data.email;
  MailService.sendInviteEmail(normalizedEmail, inviterName, teamName, inviterEmail, resetLink).catch(() => { });

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: user.businessId,
    action: 'user.create',
    targetType: 'USER',
    targetId: member.id,
    metadata: { email: normalizedEmail, role: dto.role },
  });

  return NextResponse.json(member, { status: 201 });
});
