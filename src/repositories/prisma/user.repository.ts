import { prisma } from '@/lib/prisma';
import type { IUserRepository } from '../interfaces/IUserRepository';
import type { User, UserRole } from '@/types/domain/user';
import type { Prisma } from '@prisma/client';

type PrismaUser = Prisma.UserGetPayload<{ include: { teams: true } }>;

function toDomain(u: PrismaUser): User {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role as UserRole,
    businessId: u.businessId ?? undefined,
    locationId: u.locationId ?? undefined,
    customRoleId: u.customRoleId ?? undefined,
    avatar: u.avatar ?? undefined,
    phone: u.phone ?? undefined,
    teamIds: u.teams.map((t: { teamId: string }) => t.teamId),
    preferences: u.preferences as unknown as User['preferences'],
    isActive: u.isActive,
    lastLogin: u.lastLogin ?? undefined,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

const include = { teams: true } satisfies Prisma.UserInclude;

export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const u = await prisma.user.findUnique({ where: { id }, include });
    return u ? toDomain(u) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const u = await prisma.user.findUnique({ where: { email }, include });
    return u ? toDomain(u) : null;
  }

  async findByBusiness(businessId: string): Promise<User[]> {
    const users = await prisma.user.findMany({ where: { businessId }, include });
    return users.map(toDomain);
  }

  async create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<User> {
    const { teamIds, id, ...rest } = data;
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
    const { teamIds: _teamIds, ...rest } = data;
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

  async updateId(oldId: string, newId: string): Promise<User> {
    const u = await prisma.user.update({
      where: { id: oldId },
      data: { id: newId },
      include,
    });
    return toDomain(u);
  }
}
