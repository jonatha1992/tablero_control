import { describe, it, expect } from 'vitest';
import { resolveProjectTargets } from '@/lib/tasks/resolve-project-targets';

describe('resolveProjectTargets', () => {
  it('prioriza projectIds sobre projectId y default', () => {
    expect(
      resolveProjectTargets({
        projectIds: ['p1', 'p2'],
        projectId: 'p3',
        defaultProjectId: 'p4',
      }),
    ).toEqual(['p1', 'p2']);
  });

  it('usa projectId si no hay projectIds', () => {
    expect(resolveProjectTargets({ projectId: 'p1' })).toEqual(['p1']);
  });

  it('usa defaultProjectId si no hay otros', () => {
    expect(resolveProjectTargets({ defaultProjectId: 'p1' })).toEqual(['p1']);
  });

  it('devuelve undefined si no hay destinos', () => {
    expect(resolveProjectTargets({})).toEqual([undefined]);
  });
});
