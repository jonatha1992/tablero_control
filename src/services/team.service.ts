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
    const existing = await userRepository.findByEmail(normalizedEmail);
    if (existing) throw new Error('Ya existe un usuario con este email');

    return userRepository.create({
      id,
      name: dto.name,
      email: normalizedEmail,
      role: dto.role,
      businessId,
      locationId: dto.locationId,
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
  }

  async updateMember(id: string, dto: UpdateMemberDTO): Promise<User> {
    return userRepository.update(id, dto);
  }

  async changeRole(userId: string, role: UserRole): Promise<void> {
    return userRepository.updateRole(userId, role);
  }

  async removeMember(userId: string): Promise<void> {
    return userRepository.deactivate(userId);
  }

  async reactivateMember(userId: string): Promise<void> {
    return userRepository.reactivate(userId);
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
