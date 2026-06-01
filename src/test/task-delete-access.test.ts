import { describe, it, expect } from 'vitest';
import { canDeleteTask } from '@/lib/task-delete-access';
import type { User } from '@/types/domain/user';

const baseUser = (role: User['role'], overrides?: Partial<User>): User => ({
  id: 'u-1',
  email: 'a@b.com',
  name: 'Test',
  role,
  businessId: 'biz-1',
  teamIds: [],
  memberships: [{ id: 'm-1', userId: 'u-1', businessId: 'biz-1', role, isActive: true, createdAt: new Date(), updatedAt: new Date() }],
  customRoleIds: [],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('canDeleteTask', () => {
  it('admin puede eliminar cualquier tarea del negocio', () => {
    expect(canDeleteTask(baseUser('admin'), { locationId: 'loc-x' })).toBe(true);
  });

  it('miembro no puede eliminar', () => {
    expect(canDeleteTask(baseUser('miembro'), { locationId: null })).toBe(false);
  });

  it('superadmin con businessId puede eliminar', () => {
    expect(canDeleteTask(baseUser('superadmin'), { locationId: null })).toBe(true);
  });

  it('superadmin sin businessId no puede eliminar', () => {
    expect(canDeleteTask(baseUser('superadmin', { businessId: undefined }), { locationId: null })).toBe(false);
  });

  it('responsable con sector no puede eliminar tarea de otro sector', () => {
    const user = baseUser('responsable', {
      memberships: [{
        id: 'm-1',
        userId: 'u-1',
        businessId: 'biz-1',
        role: 'responsable',
        locationId: 'loc-a',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }],
    });
    expect(canDeleteTask(user, { locationId: 'loc-b' })).toBe(false);
    expect(canDeleteTask(user, { locationId: 'loc-a' })).toBe(true);
  });
});
