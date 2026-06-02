import { cycleRepository } from '@/repositories';
import type { CreateCycleDTO, UpdateCycleDTO } from '@/repositories/interfaces/ICycleRepository';
import type { Cycle } from '@/types/domain/cycle';

class CycleService {
  async getCyclesByBusiness(businessId: string): Promise<Cycle[]> {
    return cycleRepository.findByBusiness(businessId);
  }

  async getActiveCycles(businessId: string): Promise<Cycle[]> {
    return cycleRepository.findActiveByBusiness(businessId);
  }

  async getCycleById(id: string): Promise<Cycle | null> {
    return cycleRepository.findById(id);
  }

  async createCycle(data: CreateCycleDTO): Promise<Cycle> {
    if (!data.name.trim()) {
      throw new Error('El nombre del período es requerido');
    }
    if (data.startDate && data.endDate && data.endDate <= data.startDate) {
      throw new Error('La fecha de fin debe ser posterior a la de inicio');
    }
    return cycleRepository.create(data);
  }

  async updateCycle(id: string, data: UpdateCycleDTO): Promise<Cycle> {
    return cycleRepository.update(id, data);
  }

  async deleteCycle(id: string): Promise<void> {
    return cycleRepository.delete(id);
  }

  async startCycle(id: string): Promise<Cycle> {
    const cycle = await cycleRepository.findById(id);
    if (!cycle) throw new Error('Período no encontrado');

    // #16: constraint 1 activo por proyecto (o global si sin proyecto).
    const activeCycles = await cycleRepository.findActiveByProject(
      cycle.businessId,
      cycle.projectId ?? null,
    );
    if (activeCycles.length > 0) {
      const scope = cycle.projectId ? 'este tablero' : 'el espacio';
      throw new Error(`Ya existe un período activo en ${scope}. Completalo antes de iniciar uno nuevo.`);
    }
    return cycleRepository.update(id, { status: 'active' });
  }

  async completeCycle(id: string): Promise<Cycle> {
    return cycleRepository.update(id, { status: 'completed' });
  }

  async closeCycle(id: string): Promise<Cycle> {
    return cycleRepository.update(id, { status: 'closed' });
  }

  async assignTasks(cycleId: string, taskIds: string[]): Promise<void> {
    return cycleRepository.assignTasks(cycleId, taskIds);
  }

  async removeTasks(cycleId: string, taskIds: string[]): Promise<void> {
    return cycleRepository.removeTasks(cycleId, taskIds);
  }
}

export const cycleService = new CycleService();
