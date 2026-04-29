import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/firebase/admin';
import { userRepository, businessRepository } from '@/repositories';
import { MailService } from '@/services/mail.service';

const DEFAULT_PREFERENCES = {
  theme: 'system' as const,
  locale: 'es',
  timezone: 'America/Argentina/Buenos_Aires',
  notifications: { email: true, push: true, agentReports: true, agentAlerts: true },
  dashboardLayout: [],
};

export async function POST(request: NextRequest) {
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

  const email = decoded.email ?? '';
  const name = decoded.name ?? email.split('@')[0] ?? 'Usuario';
  const superadminEmails = (process.env.SUPERADMIN_EMAILS ?? '').split(',').map(e => e.trim());
  const isSuperadmin = superadminEmails.includes(email);
  const role = isSuperadmin ? 'superadmin' : 'admin';

  const business = await businessRepository.create({
    name: body.businessName?.trim() || (isSuperadmin ? 'TecnoFusión (Master)' : `Negocio de ${name}`),
    adminId: decoded.uid,
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

  const user = await userRepository.create({
    id: decoded.uid,
    email,
    name,
    role,
    businessId: business.id,
    avatar: decoded.picture ?? undefined,
    teamIds: [],
    preferences: DEFAULT_PREFERENCES,
    isActive: true,
  } as Parameters<typeof userRepository.create>[0]);

  MailService.sendWelcomeEmail(email, name).catch(() => {});

  return NextResponse.json(user, { status: 201 });
}
