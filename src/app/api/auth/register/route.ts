import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/firebase/admin';
import { userRepository, businessRepository } from '@/repositories';
import { MailService } from '@/services/mail.service';
import { handle } from '@/lib/api/route-handler';
import type { UserRole } from '@/types/domain/user';

const DEFAULT_PREFERENCES = {
  theme: 'system' as const,
  locale: 'es',
  timezone: 'America/Argentina/Buenos_Aires',
  notifications: { email: true, push: true, agentReports: true, agentAlerts: true },
  dashboardLayout: [],
};

export const POST = handle(async (request: NextRequest) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let decoded: Awaited<ReturnType<typeof verifyToken>>;
  try {
    decoded = await verifyToken(token);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Idempotent: if user already exists, return them
  const existing = await userRepository.findById(decoded.uid);
  if (existing) return NextResponse.json(existing);

  if (decoded.email) {
    const byEmail = await userRepository.findByEmail(decoded.email);
    if (byEmail) {
      try {
        const linked = await userRepository.updateId(byEmail.id, decoded.uid);
        return NextResponse.json(linked);
      } catch {
        return NextResponse.json(byEmail);
      }
    }
  }

  let body: { businessName?: string } = {};
  try {
    body = await request.json();
  } catch {
    // body is optional
  }

  const email = (decoded.email ?? '').toLowerCase().trim();
  const name = decoded.name ?? email.split('@')[0] ?? 'Usuario';
  const superadminEmails = (process.env.SUPERADMIN_EMAILS ?? '').split(',').map(e => e.trim());
  const isSuperadmin = superadminEmails.includes(email);
  const role = isSuperadmin ? 'superadmin' : 'admin';

  // User must exist before Business (FK: Business.ownerId → User.id)
  const user = await userRepository.create({
    id: decoded.uid,
    email,
    name,
    role,
    businessId: undefined,
    avatar: decoded.picture ?? undefined,
    teamIds: [],
    customRoleIds: [],
    preferences: DEFAULT_PREFERENCES,
    isActive: true,
  } as Parameters<typeof userRepository.create>[0]);

  const business = await businessRepository.create({
    name: body.businessName?.trim() || (isSuperadmin ? 'TecnoFusión (Master)' : `Empresa de ${name}`),
    adminId: decoded.uid,
    ownerId: decoded.uid,
    plan: 'free',
    status: 'active',
    settings: {
      maxLocations: 1,
      maxUsers: 5,
      theme: 'system',
      language: 'es',
      timezone: 'America/Argentina/Buenos_Aires',
      notifications: { email: true },
      features: { customBranding: false, advancedReports: false, apiAccess: false },
      localeTypes: [],
    },
    featureFlags: {},
    locationIds: [],
    teamIds: [],
  });

<<<<<<< HEAD
  await userRepository.update(decoded.uid, { businessId: business.id });
=======
  const user = await userRepository.create({
    id: decoded.uid,
    email,
    name,
    role,
    businessId: business.id,
    avatar: decoded.picture ?? undefined,
    teamIds: [],
    customRoleIds: [],
    preferences: DEFAULT_PREFERENCES,
    isActive: true,
  } as Parameters<typeof userRepository.create>[0]);
>>>>>>> a202b269733a744a9afd9d9fab9b95249e4de8bb

  await userRepository.addMembership({
    userId: user.id,
    businessId: business.id,
    role: role as UserRole,
    isActive: true,
  });

  // Recargar user con memberships
  const userWithMemberships = await userRepository.findById(user.id);

  MailService.sendWelcomeEmail(email, name).catch(() => { });

  return NextResponse.json(userWithMemberships ?? user, { status: 201 });
});
