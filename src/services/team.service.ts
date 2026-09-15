import { userRepository, locationRepository } from '@/repositories';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getAdminAuth } from '@/lib/firebase/admin';
import type { User, UserRole } from '@/types/domain/user';
import type { InviteMemberDTO, UpdateMemberDTO } from '@/types/dto/team.dto';
import {
  cachedUserRoleForBusiness,
  isBusinessMemberRole,
} from '@/lib/platform-superadmin';

class TeamService {
  async getMembersByBusiness(businessId: string): Promise<User[]> {
    return userRepository.findByBusiness(businessId);
  }

  async inviteMember(dto: InviteMemberDTO, businessId: string, id?: string): Promise<User> {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const assignments =
      dto.locationAssignments ??
      (dto.locationId ? [{ locationId: dto.locationId, role: dto.role as UserRole }] : []);
    const primaryLocationId = assignments[0]?.locationId ?? dto.locationId ?? null;

    const existing = await userRepository.findByEmail(normalizedEmail);
    if (existing) {
      // User already exists → add or update membership
      const existingMembership = await prisma.userBusiness.findUnique({
        where: { userId_businessId: { userId: existing.id, businessId } },
      });
      if (existingMembership) {
        await prisma.userBusiness.update({
          where: { userId_businessId: { userId: existing.id, businessId } },
          data: { role: dto.role, locationId: primaryLocationId, isActive: true },
        });
      } else {
        await userRepository.addMembership({
          userId: existing.id,
          businessId,
          role: dto.role as UserRole,
          locationId: primaryLocationId ?? undefined,
          isActive: true,
        });
      }
      if (assignments.length > 0) {
        await userRepository.setLocationAssignments(existing.id, assignments);
        await prisma.user.update({
          where: { id: existing.id },
          data: { locationId: primaryLocationId },
        });
      }
      // Update active business cache to the invited one
      await userRepository.updateActiveBusiness(existing.id, businessId, dto.role as UserRole);
      const refreshed = await userRepository.findById(existing.id);
      return refreshed ?? existing;
    }

    const user = await userRepository.create({
      id,
      name: dto.name,
      email: normalizedEmail,
      role: dto.role,
      businessId,
      locationId: primaryLocationId ?? undefined,
      teamIds: [],
      customRoleIds: [],
      isActive: true,
      preferences: {
        theme: 'system',
        locale: 'es',
        timezone: 'America/Argentina/Buenos_Aires',
        notifications: { email: true, push: false, agentReports: false, agentAlerts: false },
        dashboardLayout: [],
      },
    });

    await userRepository.addMembership({
      userId: user.id,
      businessId,
      role: dto.role as UserRole,
      locationId: primaryLocationId ?? undefined,
      isActive: true,
    });

    if (assignments.length > 0) {
      await userRepository.setLocationAssignments(user.id, assignments);
    }

    const refreshed = await userRepository.findById(user.id);
    return refreshed ?? user;
  }

  async updateMember(id: string, dto: UpdateMemberDTO): Promise<User> {
    const { locationAssignments, role: _role, ...rest } = dto;
    const updated = await userRepository.update(id, rest);
    if (locationAssignments !== undefined) {
      await userRepository.setLocationAssignments(id, locationAssignments);
      const primary = locationAssignments[0]?.locationId ?? null;
      await prisma.user.update({ where: { id }, data: { locationId: primary } });
      if (updated.businessId) {
        await prisma.userBusiness.update({
          where: { userId_businessId: { userId: id, businessId: updated.businessId } },
          data: { locationId: primary },
        });
      }
      const refreshed = await userRepository.findById(id);
      return refreshed ?? updated;
    }
    return updated;
  }

  async changeRole(userId: string, businessId: string, role: UserRole): Promise<void> {
    if (!isBusinessMemberRole(role)) {
      throw new Error('invalid_business_role');
    }

    await prisma.userBusiness.update({
      where: { userId_businessId: { userId, businessId } },
      data: { role },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { businessId: true, email: true, role: true },
    });
    if (user?.businessId === businessId) {
      const cachedRole = cachedUserRoleForBusiness(
        user.email,
        user.role as UserRole,
        role
      );
      await prisma.user.update({ where: { id: userId }, data: { role: cachedRole } });

      // Sync Firebase custom claims so Firestore rules see the new role immediately.
      // requireUser() reads role from PostgreSQL, but firestore.rules prefer the token
      // claim — a stale claim would keep a demoted user's elevated Firestore access
      // until their next token refresh. See docs/permissions.md (role change steps).
      try {
        await getAdminAuth().setCustomUserClaims(userId, {
          role: cachedRole,
          businessId,
        });
      } catch (err) {
        console.error('[changeRole] setCustomUserClaims failed (non-fatal):', err);
      }
    }
  }

  async removeMember(userId: string, businessId: string): Promise<void> {
    await prisma.userBusiness.update({
      where: { userId_businessId: { userId, businessId } },
      data: { isActive: false },
    });
    // Clear cache if this was the active business
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { businessId: true } });
    if (user?.businessId === businessId) {
      await prisma.user.update({ where: { id: userId }, data: { businessId: null } });
    }
  }

  async reactivateMember(userId: string, businessId: string): Promise<void> {
    await prisma.userBusiness.update({
      where: { userId_businessId: { userId, businessId } },
      data: { isActive: true },
    });
  }

  /**
   * Self-service "leave business": reassigns managed locations (scoped to this
   * business only — unlike handleManagerDeletion, never deletes locations/tasks)
   * and deactivates the membership atomically, so a crash mid-flow can never
   * leave locations pointing at a manager who is already deactivated.
   */
  async leaveBusiness(userId: string, businessId: string, reassignToUserId: string | null, newOwnerId?: string): Promise<void> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await prisma.$transaction(async (tx) => {
          const leavingMembership = await tx.userBusiness.findFirst({
            where: { userId, businessId, isActive: true, user: { isActive: true } },
            select: { id: true, role: true },
          });
          if (!leavingMembership) throw new Error('not_member');
          if (leavingMembership.role === 'admin' || leavingMembership.role === 'superadmin') {
            const otherAdminCount = await tx.userBusiness.count({
              where: {
                businessId, isActive: true, role: { in: ['admin', 'superadmin'] },
                userId: { not: userId }, user: { isActive: true },
              },
            });
            if (otherAdminCount === 0) throw new Error('last_admin_cannot_leave');
          }

          const business = await tx.business.findUnique({ where: { id: businessId }, select: { ownerId: true } });
          if (business?.ownerId === userId && !newOwnerId) throw new Error('cannot_leave_owner');
          if (newOwnerId) {
            if (business?.ownerId !== userId) throw new Error('not_business_owner');
            const successor = await tx.userBusiness.findUnique({
              where: { userId_businessId: { userId: newOwnerId, businessId } },
              select: { role: true, isActive: true, user: { select: { isActive: true } } },
            });
            if (newOwnerId === userId || !successor?.isActive || !successor.user.isActive ||
              !['admin', 'superadmin'].includes(successor.role)) throw new Error('invalid_new_owner');
            await tx.business.update({
              where: { id: businessId },
              data: { ownerId: newOwnerId, adminId: newOwnerId },
            });
          }

          if (reassignToUserId) {
            await tx.location.updateMany({
              where: { managerId: userId, businessId },
              data: { managerId: reassignToUserId },
            });
          }

          await tx.userBusiness.update({
            where: { userId_businessId: { userId, businessId } },
            data: { isActive: false },
          });

          // Clear cache if this was the active business (mirrors removeMember).
          const user = await tx.user.findUnique({ where: { id: userId }, select: { businessId: true } });
          if (user?.businessId === businessId) {
            await tx.user.update({ where: { id: userId }, data: { businessId: null } });
          }
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        return;
      } catch (err) {
        if (!(err && typeof err === 'object' && 'code' in err && err.code === 'P2034') || attempt === 2) throw err;
      }
    }
  }

  async handleManagerDeletion(userId: string, businessId: string): Promise<void> {
    const otherAdmins = await userRepository.findActiveAdminsByBusiness(businessId, userId);
    if (otherAdmins.length > 0) {
      await locationRepository.bulkUpdateManagerId(userId, otherAdmins[0].id);
    } else {
      const managed = await locationRepository.findByManagerId(userId);
      for (const loc of managed) {
        await prisma.task.deleteMany({ where: { locationId: loc.id, projectId: null } });
      }
      await locationRepository.deleteByManagerId(userId);
    }
  }

}

export const teamService = new TeamService();
