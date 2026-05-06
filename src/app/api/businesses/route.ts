import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-helpers';
import { businessRepository, userRepository } from '@/repositories';
import { handle } from '@/lib/api/route-handler';
import { writeAuditLog } from '@/lib/api/audit';
import type { UserRole } from '@/types/domain/user';

export const POST = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const body = await request.json() as { name?: string };
  const name = body.name?.trim() || `Negocio de ${user.data.name}`;

  const business = await businessRepository.create({
    name,
    adminId: user.uid,
    ownerId: user.uid,
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

  await userRepository.addMembership({
    userId: user.uid,
    businessId: business.id,
    role: 'admin' as UserRole,
    isActive: true,
  });

  await userRepository.updateActiveBusiness(user.uid, business.id, 'admin' as UserRole);

  await writeAuditLog({
    actorId: user.uid,
    actorRole: user.role,
    businessId: business.id,
    action: 'business.create',
    targetType: 'BUSINESS',
    targetId: business.id,
    metadata: { name },
  });

  return NextResponse.json(business, { status: 201 });
});
