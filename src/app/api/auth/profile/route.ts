import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/firebase/admin';
import { userRepository, businessRepository } from '@/repositories';
import { prisma } from '@/lib/prisma';
import { handle } from '@/lib/api/route-handler';
import { DEFAULT_BUSINESS_SETTINGS } from '@/lib/business-defaults';
import { ensureDefaultBoard } from '@/lib/default-board';
import type { UserRole } from '@/types/domain/user';
import {
  healPlatformSuperAdmin,
  isPlatformSuperAdmin,
  isPlatformSuperAdminEmail,
} from '@/lib/platform-superadmin';

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
    const startedAt = process.env.NODE_ENV !== 'production' ? Date.now() : 0;
    const decoded = await verifyToken(token);
    const decodedEmail = decoded.email?.toLowerCase().trim();
    let user = await userRepository.findById(decoded.uid);
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[profile] findById:', user ? 'FOUND' : 'NOT FOUND');
    }

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
      const superadminEmails = (process.env.SUPERADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
      if (decodedEmail && superadminEmails.includes(decodedEmail)) {
        const name = decoded.name ?? decoded.email.split('@')[0] ?? 'Admin';
        const business = await businessRepository.create({
          name: 'TecnoFusión (Master)',
          adminId: decoded.uid,
          ownerId: decoded.uid,
          plan: 'free',
          status: 'active',
          settings: { ...DEFAULT_BUSINESS_SETTINGS },
          featureFlags: {},
          locationIds: [],
          teamIds: [],
        });
        await ensureDefaultBoard(business.id);
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
          role: 'admin',
          isActive: true,
        });
        user = await userRepository.findById(user.id) ?? user;
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'not_invited' }, { status: 404 });
    }

    if (decodedEmail && isPlatformSuperAdminEmail(decodedEmail)) {
      await healPlatformSuperAdmin(user.id, decodedEmail);
      user = (await userRepository.findById(user.id)) ?? user;
    }

    const memberships = user.memberships ?? [];
    const activeMemberships = memberships.filter((m) => m.isActive);

    if (activeMemberships.length === 0) {
      if (isPlatformSuperAdmin(user)) {
        const ownedCount = await prisma.business.count({ where: { ownerId: user.id } });
        return NextResponse.json({
          ...user,
          businessId: null,
          role: 'superadmin',
          businessRole: undefined,
          isPlatformSuperAdmin: true,
          isOwner: false,
          hasOwnedBusiness: ownedCount > 0,
          canCreateOwnBusiness: true,
        });
      }
      return NextResponse.json({ error: 'not_invited' }, { status: 404 });
    }

    const activeMembership = activeMemberships.find((m) => m.businessId === user?.businessId);

    if (!activeMembership) {
      const fallback = activeMemberships[0];
      const fallbackRole =
        fallback.role === 'superadmin' ? 'admin' : (fallback.role as UserRole);
      const cachedRole = isPlatformSuperAdmin(user)
        ? 'superadmin'
        : fallbackRole;
      const shouldUpdateAvatar = !user.avatar && decoded.picture;
      const updatedUser = await userRepository.update(user.id, {
        businessId: fallback.businessId,
        role: cachedRole,
        ...(shouldUpdateAvatar ? { avatar: decoded.picture } : {}),
      });
      if (!updatedUser) {
        return NextResponse.json({ error: 'not_invited' }, { status: 404 });
      }
      user = await userRepository.findById(updatedUser.id) ?? updatedUser;
    } else if (!user.avatar && decoded.picture) {
      user = (await userRepository.update(user.id, { avatar: decoded.picture })) ?? user;
    }

    const [ownedCount, business] = await Promise.all([
      prisma.business.count({ where: { ownerId: user.id } }),
      user.businessId ? businessRepository.findById(user.businessId) : Promise.resolve(null),
    ]);
    const hasOwnedBusiness = ownedCount > 0;
    const isOwner = Boolean(user.businessId && business?.ownerId === user.id);

    const currentBusinessId = user.businessId;
    const membershipInCurrentBusiness = (user.memberships ?? []).find(
      (m) => m.businessId === currentBusinessId && m.isActive
    );

    const platformSuperAdmin = isPlatformSuperAdmin(user);
    const businessRole =
      membershipInCurrentBusiness?.role === 'superadmin'
        ? 'admin'
        : (membershipInCurrentBusiness?.role as UserRole | undefined);

    // Space creator should always be admin in their owned business (heals legacy misconfigured memberships)
    if (
      isOwner &&
      user.businessId &&
      membershipInCurrentBusiness &&
      membershipInCurrentBusiness.role !== 'admin' &&
      membershipInCurrentBusiness.role !== 'superadmin' &&
      !platformSuperAdmin
    ) {
      await prisma.userBusiness.update({
        where: {
          userId_businessId: { userId: user.id, businessId: user.businessId },
        },
        data: { role: 'admin' },
      });
      user = await userRepository.update(user.id, { role: 'admin' });
      user = (await userRepository.findById(user.id)) ?? user;
    } else if (
      isOwner &&
      platformSuperAdmin &&
      user.businessId &&
      membershipInCurrentBusiness &&
      membershipInCurrentBusiness.role !== 'admin'
    ) {
      await prisma.userBusiness.update({
        where: {
          userId_businessId: { userId: user.id, businessId: user.businessId },
        },
        data: { role: 'admin' },
      });
      user = (await userRepository.findById(user.id)) ?? user;
    }

    if (process.env.NODE_ENV !== 'production') {
      const elapsedMs = Date.now() - startedAt;
      console.debug(`[perf] profile GET ${elapsedMs}ms`);
    }

    const responseRole = platformSuperAdmin ? 'superadmin' : user.role;

    return NextResponse.json({
      ...user,
      role: responseRole,
      businessRole: platformSuperAdmin ? businessRole ?? 'admin' : undefined,
      isPlatformSuperAdmin: platformSuperAdmin,
      isOwner,
      hasOwnedBusiness,
      canCreateOwnBusiness: true,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
});
