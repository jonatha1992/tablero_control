import { describe, it, expect } from 'vitest';
import { canUpdateTask } from '@/lib/task-update-access';
import type { User } from '@/types/domain/user';

const preferences: User['preferences'] = {
  theme: 'system',
  locale: 'es',
  timezone: 'America/Argentina/Buenos_Aires',
  notifications: {
    email: true,
    push: true,
    agentReports: true,
    agentAlerts: true,
  },
  dashboardLayout: [],
};

const baseUser = (role: User['role'], overrides?: Partial<User>): User => ({
  id: 'u-1',
  email: 'a@b.com',
  name: 'Test',
  role,
  businessId: 'biz-1',
  teamIds: [],
  memberships: [{
    id: 'm-1',
    userId: 'u-1',
    businessId: 'biz-1',
    role,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...(overrides?.memberships?.[0] ?? {}),
  }],
  customRoleIds: [],
  preferences,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('canUpdateTask', () => {
  it('miembro puede editar tarea que creó sin estar asignado', () => {
    expect(
      canUpdateTask(baseUser('miembro'), {
        creatorId: 'u-1',
        assigneeIds: [],
        locationId: null,
      }),
    ).toBe(true);
  });

  it('miembro no puede editar tarea ajena sin asignación', () => {
    expect(
      canUpdateTask(baseUser('miembro'), {
        creatorId: 'other',
        assigneeIds: ['other'],
        locationId: null,
      }),
    ).toBe(false);
  });

  it('responsable con sector no edita tarea de otro sector', () => {
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
    expect(
      canUpdateTask(user, {
        creatorId: 'u-1',
        assigneeIds: [],
        locationId: 'loc-b',
      }),
    ).toBe(false);
  });
});
