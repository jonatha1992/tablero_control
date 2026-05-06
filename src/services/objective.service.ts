import { objectiveRepository } from '@/repositories';
import type { CreateObjectiveDTO, UpdateObjectiveDTO } from '@/repositories/interfaces/IObjectiveRepository';
import type { Objective } from '@/types/domain/objective';

class ObjectiveService {
  async getObjectivesByBusiness(businessId: string): Promise<Objective[]> {
    return objectiveRepository.findByBusiness(businessId);
  }

  async getActiveObjectives(businessId: string): Promise<Objective[]> {
    return objectiveRepository.findActiveByBusiness(businessId);
  }

  async getObjectiveById(id: string): Promise<Objective | null> {
    return objectiveRepository.findById(id);
  }

  async createObjective(data: CreateObjectiveDTO): Promise<Objective> {
    if (!data.name.trim()) {
      throw new Error('El nombre del objetivo es requerido');
    }
    return objectiveRepository.create(data);
  }

  async updateObjective(id: string, data: UpdateObjectiveDTO): Promise<Objective> {
    return objectiveRepository.update(id, data);
  }

  async deleteObjective(id: string): Promise<void> {
    return objectiveRepository.delete(id);
  }

  async completeObjective(id: string): Promise<Objective> {
    return objectiveRepository.update(id, { status: 'completed' });
  }

  async archiveObjective(id: string): Promise<Objective> {
    return objectiveRepository.update(id, { status: 'archived' });
  }

  async assignTasks(objectiveId: string, taskIds: string[]): Promise<void> {
    return objectiveRepository.assignTasks(objectiveId, taskIds);
  }

  async removeTasks(objectiveId: string, taskIds: string[]): Promise<void> {
    return objectiveRepository.removeTasks(objectiveId, taskIds);
  }
}

export const objectiveService = new ObjectiveService();
