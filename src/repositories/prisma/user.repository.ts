import { prisma } from '@/lib/prisma';
import type { IUserRepository } from '../interfaces/IUserRepository';
import type { User, UserRole, UserBusiness } from '@/types/domain/user';
import type { Prisma } from '@prisma/client';

type PrismaUser = Prisma.UserGetPayload<{ include: { teams: true; memberships: true } }>;
type PrismaUserBusiness = Prisma.UserBusinessGetPayload<Record<string, never>>;

function toDomainMembership(ub: PrismaUserBusiness): UserBusiness {
  return {
    id: ub.id,
    userId: ub.userId,
    businessId: ub.businessId,
    role: ub.role as UserRole,
    locationId: ub.locationId ?? undefined,
    isActive: ub.isActive,
    createdAt: ub.createdAt,
    updatedAt: ub.updatedAt,
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
    preferences: u.preferences as unknown as User['preferences'],
    isActive: u.isActive,
    lastLogin: u.lastLogin ?? undefined,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

const include = { teams: true, memberships: true } satisfies Prisma.UserInclude;

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
      include: { user: { include: { teams: true, memberships: true } } },
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
      include: { user: { include: { teams: true, memberships: true } } },
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
    const { teamIds, memberships: _memberships, id, ...rest } = data;
    const u = await prisma.user.create({
      data: {
        ...rest,
        id: id ?? crypto.randomUUID(),
        role: rest.role,
        preferences: rest.preferences as unknown as Prisma.InputJsonValue,
        teams: teamIds?.length
          ? { create: teamIds.map((teamId) => ({ teamId })) }
          : undefined,
      },
      include,
    });
    return toDomain(u);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const { teamIds: _teamIds, memberships: _memberships, ...rest } = data;
    const u = await prisma.user.update({
      where: { id },
      data: {
        ...rest,
        preferences: rest.preferences
          ? (rest.preferences as unknown as Prisma.InputJsonValue)
          : undefined,
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

  async updateId(oldId: string, newId: string): Promise<User> {
    const u = await prisma.user.update({
      where: { id: oldId },
      data: { id: newId },
      include,
    });
    return toDomain(u);
  }
}
