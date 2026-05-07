import { prisma } from '@/lib/prisma';
import type { IUserRepository } from '../interfaces/IUserRepository';
import type { User, UserRole, UserBusiness, UserLocationAssignment } from '@/types/domain/user';
import type { LocationAssignmentInput } from '@/types/dto/team.dto';
import type { Prisma } from '@prisma/client';

type PrismaUser = Prisma.UserGetPayload<{
  include: {
    teams: true;
    memberships: { include: { business: true } };
    locationAssignments: { include: { location: true } };
  };
}>;
type PrismaUserBusinessWithBusiness = Prisma.UserBusinessGetPayload<{ include: { business: true } }>;
type PrismaUserBusiness = Prisma.UserBusinessGetPayload<Record<string, never>>;
type PrismaUserLocation = Prisma.UserLocationGetPayload<{ include: { location: true } }>;

function toDomainMembership(ub: PrismaUserBusiness | PrismaUserBusinessWithBusiness): UserBusiness {
  return {
    id: ub.id,
    userId: ub.userId,
    businessId: ub.businessId,
    role: ub.role as UserRole,
    locationId: ub.locationId ?? undefined,
    businessName: (ub as PrismaUserBusinessWithBusiness).business?.name,
    isActive: ub.isActive,
    createdAt: ub.createdAt,
    updatedAt: ub.updatedAt,
  };
}

function toDomainLocationAssignment(ul: PrismaUserLocation): UserLocationAssignment {
  return {
    id: ul.id,
    locationId: ul.locationId,
    locationName: ul.location.name,
    role: ul.role as UserRole,
    customRoleIds: ul.customRoleIds ?? [],
  };
}

function toDomain(u: PrismaUser): User {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role as UserRole,
    businessId: u.businessId ?? undefined,
    locationId: u.locationId ?? undefined,
    customRoleIds: u.customRoleIds ?? [],
    avatar: u.avatar ?? undefined,
    phone: u.phone ?? undefined,
    teamIds: u.teams.map((t: { teamId: string }) => t.teamId),
    memberships: u.memberships?.map(toDomainMembership),
    locationAssignments: u.locationAssignments?.map(toDomainLocationAssignment),
    preferences: u.preferences as unknown as User['preferences'],
    isActive: u.isActive,
    lastLogin: u.lastLogin ?? undefined,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

const include = {
  teams: true,
  memberships: { include: { business: true } },
  locationAssignments: { include: { location: true } },
} satisfies Prisma.UserInclude;

export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const u = await prisma.user.findUnique({ where: { id }, include });
    return u ? toDomain(u) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const u = await prisma.user.findFirst({
      where: { email: { equals: email.toLowerCase().trim(), mode: 'insensitive' } },
      include,
    });
    return u ? toDomain(u) : null;
  }

  async findByBusiness(businessId: string): Promise<User[]> {
    const rows = await prisma.userBusiness.findMany({
      where: { businessId, isActive: true },
      include: { user: { include } },
    });
    return rows.map((r) => toDomain(r.user));
  }

  async findActiveAdminsByBusiness(businessId: string, excludeId: string): Promise<User[]> {
    const rows = await prisma.userBusiness.findMany({
      where: {
        businessId,
        role: 'admin',
        isActive: true,
        user: { isActive: true, id: { not: excludeId } },
      },
      include: { user: { include } },
    });
    return rows.map((r) => toDomain(r.user));
  }

  async findMemberships(userId: string): Promise<UserBusiness[]> {
    const rows = await prisma.userBusiness.findMany({ where: { userId } });
    return rows.map(toDomainMembership);
  }

  async addMembership(data: Omit<UserBusiness, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserBusiness> {
    const ub = await prisma.userBusiness.create({
      data: {
        userId: data.userId,
        businessId: data.businessId,
        role: data.role,
        locationId: data.locationId,
        isActive: data.isActive ?? true,
      },
    });
    return toDomainMembership(ub);
  }

  async updateMembership(
    userId: string,
    businessId: string,
    data: Partial<Pick<UserBusiness, 'role' | 'locationId' | 'isActive'>>
  ): Promise<UserBusiness> {
    const ub = await prisma.userBusiness.update({
      where: { userId_businessId: { userId, businessId } },
      data: {
        ...(data.role !== undefined && { role: data.role }),
        ...(data.locationId !== undefined && { locationId: data.locationId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    return toDomainMembership(ub);
  }

  async removeMembership(userId: string, businessId: string): Promise<void> {
    await prisma.userBusiness.delete({
      where: { userId_businessId: { userId, businessId } },
    });
  }

  async updateActiveBusiness(userId: string, businessId: string | null, role?: UserRole): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(businessId !== undefined && { businessId }),
        ...(role !== undefined && { role }),
      },
    });
  }

  async create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<User> {
    const { teamIds, memberships: _m, locationAssignments: _la, isOwner: _io, id, ...rest } = data;
    const u = await prisma.user.create({
      data: {
        id: id ?? crypto.randomUUID(),
        name: rest.name,
        email: rest.email,
        role: rest.role,
        businessId: rest.businessId ?? null,
        locationId: rest.locationId ?? null,
        customRoleIds: rest.customRoleIds ?? [],
        avatar: rest.avatar ?? null,
        phone: rest.phone ?? null,
        isActive: rest.isActive,
        preferences: rest.preferences as unknown as Prisma.InputJsonValue,
        fcmTokens: [],
        teams: teamIds?.length
          ? { create: teamIds.map((teamId) => ({ teamId })) }
          : undefined,
      },
      include,
    });
    return toDomain(u);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const { teamIds: _t, memberships: _m, locationAssignments: _la, isOwner: _io, ...rest } = data;
    const u = await prisma.user.update({
      where: { id },
      data: {
        ...(rest.name !== undefined && { name: rest.name }),
        ...(rest.email !== undefined && { email: rest.email }),
        ...(rest.role !== undefined && { role: rest.role }),
        ...(rest.businessId !== undefined && { businessId: rest.businessId }),
        ...(rest.locationId !== undefined && { locationId: rest.locationId }),
        ...(rest.customRoleIds !== undefined && { customRoleIds: rest.customRoleIds }),
        ...(rest.avatar !== undefined && { avatar: rest.avatar }),
        ...(rest.phone !== undefined && { phone: rest.phone }),
        ...(rest.isActive !== undefined && { isActive: rest.isActive }),
        ...(rest.lastLogin !== undefined && { lastLogin: rest.lastLogin }),
        ...(rest.preferences !== undefined && {
          preferences: rest.preferences as unknown as Prisma.InputJsonValue,
        }),
      },
      include,
    });
    return toDomain(u);
  }

  async updateRole(id: string, role: UserRole): Promise<void> {
    await prisma.user.update({ where: { id }, data: { role } });
  }

  async deactivate(id: string): Promise<void> {
    await prisma.user.update({ where: { id }, data: { isActive: false } });
  }

  async reactivate(id: string): Promise<void> {
    await prisma.user.update({ where: { id }, data: { isActive: true } });
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }

  async setLocationAssignments(userId: string, assignments: LocationAssignmentInput[]): Promise<void> {
    await prisma.userLocation.deleteMany({ where: { userId } });
    if (assignments.length > 0) {
      await prisma.userLocation.createMany({
        data: assignments.map((a) => ({
          userId,
          locationId: a.locationId,
          role: a.role,
          customRoleIds: a.customRoleIds ?? [],
        })),
        skipDuplicates: true,
      });
    }
  }

  async updateId(oldId: string, newId: string): Promise<User> {
    const u = await prisma.user.update({
      where: { id: oldId },
      data: { id: newId },
      include,
    });
    return toDomain(u);
  }
}
