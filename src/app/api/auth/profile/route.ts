import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/firebase/admin';
import { userRepository, businessRepository } from '@/repositories';
import { prisma } from '@/lib/prisma';
import { handle } from '@/lib/api/route-handler';
import { DEFAULT_BUSINESS_SETTINGS } from '@/lib/business-defaults';
import { ensureDefaultBoard } from '@/lib/default-board';
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
          role: 'superadmin' as UserRole,
          isActive: true,
        });
        user = await userRepository.findById(user.id) ?? user;
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'not_invited' }, { status: 404 });
    }

    const memberships = user.memberships ?? [];
    const activeMemberships = memberships.filter((m) => m.isActive);

    if (activeMemberships.length === 0) {
      return NextResponse.json({ error: 'not_invited' }, { status: 404 });
    }

    const activeMembership = activeMemberships.find((m) => m.businessId === user?.businessId);

    if (!activeMembership) {
      const fallback = activeMemberships[0];
      user = await userRepository.update(user.id, {
        businessId: fallback.businessId,
        role: fallback.role,
        ...(!user.avatar && decoded.picture ? { avatar: decoded.picture } : {}),
      });
      user = await userRepository.findById(user.id) ?? user;
    } else if (!user.avatar && decoded.picture) {
      user = await userRepository.update(user.id, { avatar: decoded.picture });
    }

    const [ownedCount, business] = await Promise.all([
      prisma.business.count({ where: { ownerId: user.id } }),
      user.businessId ? businessRepository.findById(user.businessId) : Promise.resolve(null),
    ]);
    const hasOwnedBusiness = ownedCount > 0;
    const isOwner = Boolean(user.businessId && business?.ownerId === user.id);

    if (process.env.NODE_ENV !== 'production') {
      const elapsedMs = Date.now() - startedAt;
      console.debug(`[perf] profile GET ${elapsedMs}ms`);
    }

    return NextResponse.json({
      ...user,
      isOwner,
      hasOwnedBusiness,
      canCreateOwnBusiness: true,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
});
