import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/firebase/admin';
import { userRepository, businessRepository } from '@/repositories';
import { handle } from '@/lib/api/route-handler';

const DEFAULT_PREFERENCES = {
  theme: 'system' as const,
  locale: 'es',
  timezone: 'America/Argentina/Buenos_Aires',
  notifications: { email: true, push: true, agentReports: true, agentAlerts: true },
  dashboardLayout: [],
};

export const GET = handle(async (request: NextRequest) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded = await verifyToken(token);
    console.log('[profile] uid:', decoded.uid, '| email:', decoded.email);
    let user = await userRepository.findById(decoded.uid);
    console.log('[profile] findById:', user ? 'FOUND' : 'NOT FOUND');

    if (!user && decoded.email) {
      // Invited user: exists by email but has a different Firebase UID
      const existingByEmail = await userRepository.findByEmail(decoded.email);
      console.log('[profile] findByEmail:', existingByEmail ? `FOUND id=${existingByEmail.id}` : 'NOT FOUND');
      if (existingByEmail) {
        try {
          user = await userRepository.updateId(existingByEmail.id, decoded.uid);
          if (!user.avatar && decoded.picture) {
            user = await userRepository.update(user.id, { avatar: decoded.picture });
          }
        } catch (e) {
          console.error('[profile] updateId failed:', e);
          user = existingByEmail; // Fallback: allow login without UID update
        }
      }
    }

    if (!user && decoded.email) {
      const superadminEmails = (process.env.SUPERADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean);
      if (superadminEmails.includes(decoded.email)) {
        const name = decoded.name ?? decoded.email.split('@')[0] ?? 'Admin';
        const business = await businessRepository.create({
          name: 'TecnoFusión (Master)',
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
        user = await userRepository.create({
          id: decoded.uid,
          email: decoded.email,
          name,
          role: 'superadmin',
          businessId: business.id,
          avatar: decoded.picture ?? undefined,
          teamIds: [],
          preferences: DEFAULT_PREFERENCES,
          isActive: true,
        } as Parameters<typeof userRepository.create>[0]);
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'not_invited' }, { status: 404 });
    }

    // Fix for existing users without businessId
    if (!user.businessId) {
      const email = decoded.email ?? '';
      const name = decoded.name ?? email.split('@')[0] ?? 'Usuario';
      const superadminEmails = (process.env.SUPERADMIN_EMAILS ?? '').split(',').map(e => e.trim());
      const isSuperadmin = superadminEmails.includes(email);

      const business = await businessRepository.create({
        name: isSuperadmin ? 'TecnoFusión (Master)' : `Negocio de ${name}`,
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
      user = await userRepository.update(user.id, { businessId: business.id });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
});
