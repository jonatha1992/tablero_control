import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cycleService } from '@/services/cycle.service';

vi.mock('@/repositories', () => ({
  cycleRepository: {
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

import { cycleRepository } from '@/repositories';

const mockRepo = vi.mocked(cycleRepository);

const mockCycle = {
  id: 'cycle-1',
  name: 'Sprint 1',
  status: 'planning',
  businessId: 'biz-1',
  startDate: new Date('2026-05-01'),
  endDate: new Date('2026-05-15'),
};

beforeEach(() => vi.clearAllMocks());

describe('CycleService.getCyclesByBusiness', () => {
  it('delega a repository', async () => {
    mockRepo.findByBusiness.mockResolvedValueOnce([mockCycle] as never);
    const result = await cycleService.getCyclesByBusiness('biz-1');
    expect(result).toHaveLength(1);
    expect(mockRepo.findByBusiness).toHaveBeenCalledWith('biz-1');
  });
});

describe('CycleService.getActiveCycles', () => {
  it('retorna solo ciclos activos', async () => {
    mockRepo.findActiveByBusiness.mockResolvedValueOnce([mockCycle] as never);
    await cycleService.getActiveCycles('biz-1');
    expect(mockRepo.findActiveByBusiness).toHaveBeenCalledWith('biz-1');
  });
});

describe('CycleService.getCycleById', () => {
  it('retorna ciclo por id', async () => {
    mockRepo.findById.mockResolvedValueOnce(mockCycle as never);
    const result = await cycleService.getCycleById('cycle-1');
    expect(result?.id).toBe('cycle-1');
  });

  it('retorna null si no existe', async () => {
    mockRepo.findById.mockResolvedValueOnce(null as never);
    const result = await cycleService.getCycleById('nope');
    expect(result).toBeNull();
  });
});

describe('CycleService.createCycle', () => {
  it('crea ciclo con datos válidos', async () => {
    mockRepo.create.mockResolvedValueOnce(mockCycle as never);
    const result = await cycleService.createCycle({
      name: 'Sprint 1',
      businessId: 'biz-1',
      status: 'planning',
      startDate: new Date('2026-05-01'),
      endDate: new Date('2026-05-15'),
    });
    expect(result.id).toBe('cycle-1');
    expect(mockRepo.create).toHaveBeenCalledOnce();
  });

  it('lanza error si nombre vacío', async () => {
    await expect(cycleService.createCycle({ name: '  ', businessId: 'biz-1', status: 'planning' })).rejects.toThrow(
      'El nombre del período es requerido'
    );
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('lanza error si endDate <= startDate', async () => {
    await expect(
      cycleService.createCycle({
        name: 'Sprint',
        businessId: 'biz-1',
        status: 'planning',
        startDate: new Date('2026-05-10'),
        endDate: new Date('2026-05-01'),
      })
    ).rejects.toThrow('La fecha de fin debe ser posterior');
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('lanza error si endDate === startDate', async () => {
    const same = new Date('2026-05-10');
    await expect(
      cycleService.createCycle({ name: 'X', businessId: 'biz-1', status: 'planning', startDate: same, endDate: same })
    ).rejects.toThrow('La fecha de fin debe ser posterior');
  });

  it('permite creación sin fechas', async () => {
    mockRepo.create.mockResolvedValueOnce(mockCycle as never);
    await cycleService.createCycle({ name: 'Sin fecha', businessId: 'biz-1', status: 'planning' });
    expect(mockRepo.create).toHaveBeenCalledOnce();
  });
});

describe('CycleService.updateCycle', () => {
  it('delega update al repository', async () => {
    const updated = { ...mockCycle, name: 'Sprint Actualizado' };
    mockRepo.update.mockResolvedValueOnce(updated as never);
    const result = await cycleService.updateCycle('cycle-1', { name: 'Sprint Actualizado' });
    expect(result.name).toBe('Sprint Actualizado');
    expect(mockRepo.update).toHaveBeenCalledWith('cycle-1', { name: 'Sprint Actualizado' });
  });
});

describe('CycleService.deleteCycle', () => {
  it('delega delete al repository', async () => {
    mockRepo.delete.mockResolvedValueOnce(undefined as never);
    await cycleService.deleteCycle('cycle-1');
    expect(mockRepo.delete).toHaveBeenCalledWith('cycle-1');
  });
});

describe('CycleService estado — startCycle / completeCycle / closeCycle', () => {
  it('startCycle establece status active', async () => {
    mockRepo.update.mockResolvedValueOnce({ ...mockCycle, status: 'active' } as never);
    const result = await cycleService.startCycle('cycle-1');
    expect(mockRepo.update).toHaveBeenCalledWith('cycle-1', { status: 'active' });
    expect(result.status).toBe('active');
  });

  it('completeCycle establece status completed', async () => {
    mockRepo.update.mockResolvedValueOnce({ ...mockCycle, status: 'completed' } as never);
    await cycleService.completeCycle('cycle-1');
    expect(mockRepo.update).toHaveBeenCalledWith('cycle-1', { status: 'completed' });
  });

  it('closeCycle establece status closed', async () => {
    mockRepo.update.mockResolvedValueOnce({ ...mockCycle, status: 'closed' } as never);
    await cycleService.closeCycle('cycle-1');
    expect(mockRepo.update).toHaveBeenCalledWith('cycle-1', { status: 'closed' });
  });
});

describe('CycleService.assignTasks / removeTasks', () => {
  it('asigna tareas al ciclo', async () => {
    mockRepo.assignTasks.mockResolvedValueOnce(undefined as never);
    await cycleService.assignTasks('cycle-1', ['t-1', 't-2']);
    expect(mockRepo.assignTasks).toHaveBeenCalledWith('cycle-1', ['t-1', 't-2']);
  });

  it('quita tareas del ciclo', async () => {
    mockRepo.removeTasks.mockResolvedValueOnce(undefined as never);
    await cycleService.removeTasks('cycle-1', ['t-1']);
    expect(mockRepo.removeTasks).toHaveBeenCalledWith('cycle-1', ['t-1']);
  });
});
