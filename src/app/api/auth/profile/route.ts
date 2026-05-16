import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/firebase/admin';
import { userRepository, businessRepository } from '@/repositories';
import { handle } from '@/lib/api/route-handler';
import type { UserRole } from '@/types/domain/user';

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
    const decodedEmail = decoded.email?.toLowerCase().trim();
    let user = await userRepository.findById(decoded.uid);
    console.log('[profile] findById:', user ? 'FOUND' : 'NOT FOUND');

    if (!user && decoded.email) {
      // Invited user: exists by email but has a different Firebase UID
      const existingByEmail = decodedEmail ? await userRepository.findByEmail(decodedEmail) : null;
      if (existingByEmail) {
        try {
          user = await userRepository.updateId(existingByEmail.id, decoded.uid);
          if (!user.avatar && decoded.picture) {
            user = await userRepository.update(user.id, { avatar: decoded.picture });
          }
        } catch (e) {
          console.error('[profile] updateId failed:', e);
          user = existingByEmail;
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
        user = await userRepository.create({
          id: decoded.uid,
          email: decodedEmail || decoded.email || '',
          name,
          role: 'superadmin',
          businessId: business.id,
          avatar: decoded.picture ?? undefined,
          teamIds: [],
          customRoleIds: [],
          preferences: DEFAULT_PREFERENCES,
          isActive: true,
        } as Parameters<typeof userRepository.create>[0]);
        await userRepository.addMembership({
          userId: user.id,
          businessId: business.id,
          role: 'superadmin' as UserRole,
          isActive: true,
        });
        user = await userRepository.findById(user.id) ?? user;
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'not_invited' }, { status: 404 });
    }

    // Validate active business membership
    const memberships = user.memberships ?? [];
    const activeMembership = memberships.find((m) => m.businessId === user?.businessId && m.isActive);

    if (user.businessId && !activeMembership) {
      // Try to fallback to another active membership
      const fallback = memberships.find((m) => m.isActive);
      if (fallback) {
        user = await userRepository.update(user.id, {
          businessId: fallback.businessId,
          role: fallback.role,
        });
      }
    }

    // Fix for existing users without businessId or without any membership
    if (!user.businessId || memberships.length === 0) {
      const email = decodedEmail ?? decoded.email ?? '';
      const name = decoded.name ?? email.split('@')[0] ?? 'Usuario';
      const superadminEmails = (process.env.SUPERADMIN_EMAILS ?? '').split(',').map(e => e.trim());
      const isSuperadmin = superadminEmails.includes(email);

      const business = await businessRepository.create({
        name: isSuperadmin ? 'TecnoFusión (Master)' : `Empresa de ${name}`,
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
      user = await userRepository.update(user.id, {
        businessId: business.id,
        role: isSuperadmin ? 'superadmin' : 'admin' as UserRole,
        ...(!user.avatar && decoded.picture ? { avatar: decoded.picture } : {}),
      });
      await userRepository.addMembership({
        userId: user.id,
        businessId: business.id,
        role: isSuperadmin ? 'superadmin' : 'admin' as UserRole,
        isActive: true,
      });
      user = await userRepository.findById(user.id) ?? user;
    }

    if (!user.avatar && decoded.picture) {
      user = await userRepository.update(user.id, { avatar: decoded.picture });
    }

    // Determine if user is owner of active business
    const isOwner = user.businessId
      ? (await businessRepository.findById(user.businessId))?.ownerId === user.id
      : false;

    return NextResponse.json({ ...user, isOwner });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
});
