import { describe, it, expect, vi, beforeEach } from 'vitest';
import { objectiveService } from '@/services/objective.service';

vi.mock('@/repositories', () => ({
  objectiveRepository: {
    findByBusiness: vi.fn(),
    findActiveByBusiness: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    assignTasks: vi.fn(),
    removeTasks: vi.fn(),
  },
}));

import { objectiveRepository } from '@/repositories';

const mockRepo = vi.mocked(objectiveRepository);

const mockObjective = {
  id: 'obj-1',
  name: 'Lanzar v2',
  status: 'active',
  businessId: 'biz-1',
  progress: 0,
};

beforeEach(() => vi.clearAllMocks());

describe('ObjectiveService.getObjectivesByBusiness', () => {
  it('delega a repository', async () => {
    mockRepo.findByBusiness.mockResolvedValueOnce([mockObjective] as never);
    const result = await objectiveService.getObjectivesByBusiness('biz-1');
    expect(result).toHaveLength(1);
    expect(mockRepo.findByBusiness).toHaveBeenCalledWith('biz-1');
  });
});

describe('ObjectiveService.getActiveObjectives', () => {
  it('retorna solo objetivos activos', async () => {
    mockRepo.findActiveByBusiness.mockResolvedValueOnce([mockObjective] as never);
    await objectiveService.getActiveObjectives('biz-1');
    expect(mockRepo.findActiveByBusiness).toHaveBeenCalledWith('biz-1');
  });
});

describe('ObjectiveService.getObjectiveById', () => {
  it('retorna objetivo por id', async () => {
    mockRepo.findById.mockResolvedValueOnce(mockObjective as never);
    const result = await objectiveService.getObjectiveById('obj-1');
    expect(result?.id).toBe('obj-1');
  });

  it('retorna null si no existe', async () => {
    mockRepo.findById.mockResolvedValueOnce(null as never);
    const result = await objectiveService.getObjectiveById('nope');
    expect(result).toBeNull();
  });
});

describe('ObjectiveService.createObjective', () => {
  it('crea objetivo con nombre válido', async () => {
    mockRepo.create.mockResolvedValueOnce(mockObjective as never);
    const result = await objectiveService.createObjective({ name: 'Lanzar v2', businessId: 'biz-1' });
    expect(result.id).toBe('obj-1');
    expect(mockRepo.create).toHaveBeenCalledOnce();
  });

  it('lanza error si nombre vacío', async () => {
    await expect(
      objectiveService.createObjective({ name: '   ', businessId: 'biz-1' })
    ).rejects.toThrow('El nombre del objetivo es requerido');
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('lanza error si nombre solo espacios', async () => {
    await expect(
      objectiveService.createObjective({ name: '\t\n', businessId: 'biz-1' })
    ).rejects.toThrow('El nombre del objetivo es requerido');
  });
});

describe('ObjectiveService.updateObjective', () => {
  it('delega update al repository', async () => {
    const updated = { ...mockObjective, name: 'Lanzar v3' };
    mockRepo.update.mockResolvedValueOnce(updated as never);
    const result = await objectiveService.updateObjective('obj-1', { name: 'Lanzar v3' });
    expect(result.name).toBe('Lanzar v3');
    expect(mockRepo.update).toHaveBeenCalledWith('obj-1', { name: 'Lanzar v3' });
  });
});

describe('ObjectiveService.deleteObjective', () => {
  it('delega delete al repository', async () => {
    mockRepo.delete.mockResolvedValueOnce(undefined as never);
    await objectiveService.deleteObjective('obj-1');
    expect(mockRepo.delete).toHaveBeenCalledWith('obj-1');
  });
});

describe('ObjectiveService estado — completeObjective / archiveObjective', () => {
  it('completeObjective establece status completed', async () => {
    mockRepo.update.mockResolvedValueOnce({ ...mockObjective, status: 'completed' } as never);
    const result = await objectiveService.completeObjective('obj-1');
    expect(mockRepo.update).toHaveBeenCalledWith('obj-1', { status: 'completed' });
    expect(result.status).toBe('completed');
  });

  it('archiveObjective establece status archived', async () => {
    mockRepo.update.mockResolvedValueOnce({ ...mockObjective, status: 'archived' } as never);
    const result = await objectiveService.archiveObjective('obj-1');
    expect(mockRepo.update).toHaveBeenCalledWith('obj-1', { status: 'archived' });
    expect(result.status).toBe('archived');
  });
});

describe('ObjectiveService.assignTasks / removeTasks', () => {
  it('asigna tareas al objetivo', async () => {
    mockRepo.assignTasks.mockResolvedValueOnce(undefined as never);
    await objectiveService.assignTasks('obj-1', ['t-1', 't-2']);
    expect(mockRepo.assignTasks).toHaveBeenCalledWith('obj-1', ['t-1', 't-2']);
  });

  it('quita tareas del objetivo', async () => {
    mockRepo.removeTasks.mockResolvedValueOnce(undefined as never);
    await objectiveService.removeTasks('obj-1', ['t-1']);
    expect(mockRepo.removeTasks).toHaveBeenCalledWith('obj-1', ['t-1']);
  });
});
