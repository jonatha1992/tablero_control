import { userRepository } from '@/repositories';
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
}

export const teamService = new TeamService();
