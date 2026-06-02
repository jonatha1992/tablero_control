import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTaskBusinessId } from '@/lib/api/task-business';
import { prisma } from '@/lib/prisma';

const mockFindUnique = vi.mocked(prisma.task.findUnique);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getTaskBusinessId', () => {
  it('returns project.businessId when task has a project', async () => {
    mockFindUnique.mockResolvedValue({
      project: { businessId: 'biz-from-project' },
      location: { businessId: 'biz-from-location' },
      creator: { businessId: 'biz-from-creator', memberships: [] },
    } as never);

    const result = await getTaskBusinessId('task-1');

    expect(result).toBe('biz-from-project');
  });

  it('returns location.businessId when task has no project but has location', async () => {
    mockFindUnique.mockResolvedValue({
      project: null,
      location: { businessId: 'biz-from-location' },
      creator: { businessId: 'biz-from-creator', memberships: [] },
    } as never);

    const result = await getTaskBusinessId('task-1');

    expect(result).toBe('biz-from-location');
  });

  it('returns null when task has no businessId, project or location', async () => {
    mockFindUnique.mockResolvedValue({
      businessId: null,
      project: null,
      location: null,
      creator: { businessId: 'biz-from-creator', memberships: [] },
    } as never);

    const result = await getTaskBusinessId('task-1');

    expect(result).toBeNull();
  });

  it("does not infer businessId from creator memberships", async () => {
    mockFindUnique.mockResolvedValue({
      businessId: null,
      project: null,
      location: null,
      creator: {
        businessId: null,
        memberships: [{ businessId: 'biz-from-membership' }],
      },
    } as never);

    const result = await getTaskBusinessId('task-1');

    expect(result).toBeNull();
  });

  it('returns null when task is not found', async () => {
    mockFindUnique.mockResolvedValue(null as never);

    const result = await getTaskBusinessId('nonexistent-task');

    expect(result).toBeNull();
  });

  it('returns null when task has no project, no location, creator has no businessId and no active memberships', async () => {
    mockFindUnique.mockResolvedValue({
      project: null,
      location: null,
      creator: { businessId: null, memberships: [] },
    } as never);

    const result = await getTaskBusinessId('task-1');

    expect(result).toBeNull();
  });

  it('respects priority order: task.businessId > project > location', async () => {
    // All sources present — project should win
    mockFindUnique.mockResolvedValue({
      businessId: 'biz-task',
      project: { businessId: 'biz-project' },
      location: { businessId: 'biz-location' },
      creator: {
        businessId: 'biz-creator',
        memberships: [{ businessId: 'biz-membership' }],
      },
    } as never);

    expect(await getTaskBusinessId('task-1')).toBe('biz-task');

    // No task businessId — project wins
    mockFindUnique.mockResolvedValue({
      businessId: null,
      project: { businessId: 'biz-project' },
      location: { businessId: 'biz-location' },
      creator: {
        businessId: 'biz-creator',
        memberships: [{ businessId: 'biz-membership' }],
      },
    } as never);

    expect(await getTaskBusinessId('task-1')).toBe('biz-project');

    // No task businessId, no project — location wins
    mockFindUnique.mockResolvedValue({
      businessId: null,
      project: null,
      location: { businessId: 'biz-location' },
      creator: {
        businessId: 'biz-creator',
        memberships: [{ businessId: 'biz-membership' }],
      },
    } as never);

    expect(await getTaskBusinessId('task-1')).toBe('biz-location');

    // No task businessId, no project, no location — do not infer by creator
    mockFindUnique.mockResolvedValue({
      businessId: null,
      project: null,
      location: null,
      creator: {
        businessId: 'biz-creator',
        memberships: [{ businessId: 'biz-membership' }],
      },
    } as never);

    expect(await getTaskBusinessId('task-1')).toBeNull();
  });
});
