import { where } from 'firebase/firestore';
import { getById, getAll, create, update, remove } from '@/lib/firebase/firestore';
import type { ITeamRepository } from '../interfaces/ITeamRepository';
import type { Team } from '@/types/domain/team';

const COLLECTION = 'teams';

export class FirebaseTeamRepository implements ITeamRepository {
  async findById(id: string): Promise<Team | null> {
    return getById<Team>(COLLECTION, id);
  }

  async findByBusiness(businessId: string): Promise<Team[]> {
    return getAll<Team>(COLLECTION, [where('businessId', '==', businessId)]);
  }

  async create(data: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team> {
    const id = await create(COLLECTION, data as Record<string, unknown>);
    return { id, ...data } as unknown as Team;
  }

  async update(id: string, data: Partial<Team>): Promise<Team> {
    await update(COLLECTION, id, data as Record<string, unknown>);
    const updated = await this.findById(id);
    if (!updated) throw new Error(`Team ${id} not found after update`);
    return updated;
  }

  async addMember(teamId: string, userId: string): Promise<void> {
    const team = await this.findById(teamId);
    if (!team) throw new Error(`Team ${teamId} not found`);
    if (!team.memberIds.includes(userId)) {
      await update(COLLECTION, teamId, { memberIds: [...team.memberIds, userId] });
    }
  }

  async removeMember(teamId: string, userId: string): Promise<void> {
    const team = await this.findById(teamId);
    if (!team) throw new Error(`Team ${teamId} not found`);
    await update(COLLECTION, teamId, {
      memberIds: team.memberIds.filter((id) => id !== userId),
    });
  }

  async delete(id: string): Promise<void> {
    return remove(COLLECTION, id);
  }
}
