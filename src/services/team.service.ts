import { userRepository, locationRepository } from '@/repositories';
import { prisma } from '@/lib/prisma';
import type { User, UserRole } from '@/types/domain/user';
import type { InviteMemberDTO, UpdateMemberDTO } from '@/types/dto/team.dto';

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
    const { locationAssignments, ...rest } = dto;
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
    await prisma.userBusiness.update({
      where: { userId_businessId: { userId, businessId } },
      data: { role },
    });
    // Update cache if this is the active business
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { businessId: true } });
    if (user?.businessId === businessId) {
      await prisma.user.update({ where: { id: userId }, data: { role } });
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
