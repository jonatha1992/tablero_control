import type { Team } from '@/types/domain/team';

export interface ITeamRepository {
  findById(id: string): Promise<Team | null>;
  findByBusiness(businessId: string): Promise<Team[]>;
  create(data: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team>;
  update(id: string, data: Partial<Team>): Promise<Team>;
  addMember(teamId: string, userId: string): Promise<void>;
  removeMember(teamId: string, userId: string): Promise<void>;
  delete(id: string): Promise<void>;
}
