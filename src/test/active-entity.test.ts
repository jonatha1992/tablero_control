import { describe, expect, it } from 'vitest';
import {
  isArchivedLocationStatus,
  isArchivedProjectStatus,
  isTaskFromActiveEntities,
} from '@/lib/tasks/active-entity';

describe('active entity helpers', () => {
  it('detects archived project status', () => {
    expect(isArchivedProjectStatus('archived')).toBe(true);
    expect(isArchivedProjectStatus('active')).toBe(false);
    expect(isArchivedProjectStatus(undefined)).toBe(false);
  });

  it('detects archived location statuses', () => {
    expect(isArchivedLocationStatus('closed')).toBe(true);
    expect(isArchivedLocationStatus('inactive')).toBe(true);
    expect(isArchivedLocationStatus('active')).toBe(false);
    expect(isArchivedLocationStatus(undefined)).toBe(false);
  });

  it('keeps tasks without archived entities visible', () => {
    const projectsById = new Map([
      ['proj-active', { status: 'active' }],
    ]);
    const locationsById = new Map([
      ['loc-active', { status: 'active' }],
    ]);

    expect(
      isTaskFromActiveEntities(
        { projectId: 'proj-active', locationId: 'loc-active' },
        projectsById,
        locationsById,
      ),
    ).toBe(true);

    expect(
      isTaskFromActiveEntities(
        { projectId: 'proj-missing', locationId: 'loc-missing' },
        projectsById,
        locationsById,
      ),
    ).toBe(true);
  });

  it('hides tasks from archived project or location', () => {
    const projectsById = new Map([
      ['proj-archived', { status: 'archived' }],
      ['proj-active', { status: 'active' }],
    ]);
    const locationsById = new Map([
      ['loc-closed', { status: 'closed' }],
      ['loc-inactive', { status: 'inactive' }],
      ['loc-active', { status: 'active' }],
    ]);

    expect(
      isTaskFromActiveEntities(
        { projectId: 'proj-archived', locationId: 'loc-active' },
        projectsById,
        locationsById,
      ),
    ).toBe(false);

    expect(
      isTaskFromActiveEntities(
        { projectId: 'proj-active', locationId: 'loc-closed' },
        projectsById,
        locationsById,
      ),
    ).toBe(false);

    expect(
      isTaskFromActiveEntities(
        { locationId: 'loc-inactive' },
        projectsById,
        locationsById,
      ),
    ).toBe(false);
  });
});
