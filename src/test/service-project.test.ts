import { describe, it, expect, vi, beforeEach } from 'vitest';
import { projectService } from '@/services/project.service';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/mercadopago/plan-config', () => ({
  getEffectivePlanConfig: vi.fn(),
}));

import { getEffectivePlanConfig } from '@/lib/mercadopago/plan-config';

const mockGetPlanConfig = vi.mocked(getEffectivePlanConfig);

const mockProject = {
  id: 'proj-1',
  name: 'Proyecto Alpha',
  businessId: 'biz-1',
  status: 'active',
  _count: { tasks: 0 },
};

const planWithLimit = { limits: { projects: 3 } };
const planUnlimited = { limits: { projects: -1 } };

beforeEach(() => vi.clearAllMocks());

describe('ProjectService.getByBusiness', () => {
  it('retorna proyectos del negocio', async () => {
    vi.mocked(prisma.project.findMany).mockResolvedValueOnce([mockProject] as never);
    const result = await projectService.getByBusiness('biz-1');
    expect(result).toHaveLength(1);
    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { businessId: 'biz-1' } })
    );
  });
});

describe('ProjectService.getById', () => {
  it('retorna proyecto por id', async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValueOnce(mockProject as never);
    const result = await projectService.getById('proj-1');
    expect(result?.id).toBe('proj-1');
  });

  it('retorna null si no existe', async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValueOnce(null as never);
    const result = await projectService.getById('nope');
    expect(result).toBeNull();
  });
});

describe('ProjectService.create — límites de plan', () => {
  it('crea proyecto si no se supera el límite', async () => {
    mockGetPlanConfig.mockResolvedValueOnce(planWithLimit as never);
    vi.mocked(prisma.project.count).mockResolvedValueOnce(2 as never);
    vi.mocked(prisma.project.create).mockResolvedValueOnce(mockProject as never);

    const result = await projectService.create(
      { name: 'Proyecto Alpha', businessId: 'biz-1' },
      'admin',
      'basic'
    );
    expect(result.id).toBe('proj-1');
    expect(prisma.project.create).toHaveBeenCalledOnce();
  });

  it('lanza projects_limit_exceeded si se supera el límite', async () => {
    mockGetPlanConfig.mockResolvedValueOnce(planWithLimit as never);
    vi.mocked(prisma.project.count).mockResolvedValueOnce(3 as never);

    const error = await projectService
      .create({ name: 'Nuevo', businessId: 'biz-1' }, 'admin', 'basic')
      .catch((e) => e);

    expect(error.message).toBe('projects_limit_exceeded');
    expect((error as any).limit).toBe(3);
    expect((error as any).current).toBe(3);
    expect(prisma.project.create).not.toHaveBeenCalled();
  });

  it('no verifica límite con plan ilimitado (-1)', async () => {
    mockGetPlanConfig.mockResolvedValueOnce(planUnlimited as never);
    vi.mocked(prisma.project.create).mockResolvedValueOnce(mockProject as never);

    await projectService.create({ name: 'Sin límite', businessId: 'biz-1' }, 'admin', 'pro');
    expect(prisma.project.count).not.toHaveBeenCalled();
    expect(prisma.project.create).toHaveBeenCalledOnce();
  });

  it('superadmin bypasea límites', async () => {
    vi.mocked(prisma.project.create).mockResolvedValueOnce(mockProject as never);

    await projectService.create(
      { name: 'Proyecto SA', businessId: 'biz-1' },
      'superadmin',
      'free'
    );
    expect(mockGetPlanConfig).not.toHaveBeenCalled();
    expect(prisma.project.count).not.toHaveBeenCalled();
    expect(prisma.project.create).toHaveBeenCalledOnce();
  });
});

describe('ProjectService.update', () => {
  it('actualiza proyecto', async () => {
    const updated = { ...mockProject, name: 'Proyecto Beta' };
    vi.mocked(prisma.project.update).mockResolvedValueOnce(updated as never);
    const result = await projectService.update('proj-1', { name: 'Proyecto Beta' });
    expect(result.name).toBe('Proyecto Beta');
    expect(prisma.project.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'proj-1' } })
    );
  });
});

describe('ProjectService.delete', () => {
  it('elimina proyecto', async () => {
    vi.mocked(prisma.project.delete).mockResolvedValueOnce(mockProject as never);
    await projectService.delete('proj-1');
    expect(prisma.project.delete).toHaveBeenCalledWith({ where: { id: 'proj-1' } });
  });
});
