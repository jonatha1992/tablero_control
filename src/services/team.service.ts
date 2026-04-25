import { userRepository } from '@/repositories';
import type { User, UserRole } from '@/types/domain/user';
import type { InviteMemberDTO, UpdateMemberDTO } from '@/types/dto/team.dto';

class TeamService {
  async getMembersByBusiness(businessId: string): Promise<User[]> {
    return userRepository.findByBusiness(businessId);
  }

  async inviteMember(dto: InviteMemberDTO, businessId: string): Promise<User> {
    const existing = await userRepository.findByEmail(dto.email);
    if (existing) throw new Error('Ya existe un usuario con este email');

    return userRepository.create({
      name: dto.name,
      email: dto.email,
      role: dto.role,
      businessId,
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
}

export const teamService = new TeamService();
