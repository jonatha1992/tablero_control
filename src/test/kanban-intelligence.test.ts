import { describe, expect, it } from 'vitest';
import {
  buildSmartCreateDraft,
  DEFAULT_KANBAN_COLUMNS,
  visibleKanbanColumns,
} from '@/lib/tasks/kanban-intelligence';

describe('visibleKanbanColumns', () => {
  it('en tab Backlog muestra solo la columna backlog aunque esté oculta', () => {
    expect(visibleKanbanColumns(['todo', 'done'], 'backlog')).toEqual(['backlog']);
  });

  it('en Todas respeta el orden canónico y las columnas activas', () => {
    expect(visibleKanbanColumns(['done', 'backlog', 'todo'], 'board')).toEqual([
      'backlog',
      'todo',
      'done',
    ]);
  });
});

describe('buildSmartCreateDraft', () => {
  it('columna backlog: estado backlog y sin fecha', () => {
    const draft = buildSmartCreateDraft({
      columnStatus: 'backlog',
      viewMode: 'board',
      selectedSprintId: 'cycle-1',
    });
    expect(draft.status).toBe('backlog');
    expect(draft.dueDate).toBe('');
    expect(draft.cycleId).toBe('');
  });

  it('tab Backlog sin columna: backlog y sin fecha', () => {
    const draft = buildSmartCreateDraft({
      viewMode: 'backlog',
      selectedSprintId: 'cycle-1',
    });
    expect(draft.status).toBe('backlog');
    expect(draft.dueDate).toBe('');
  });

  it('columna todo + período activo: todo y cycleId', () => {
    const draft = buildSmartCreateDraft({
      columnStatus: 'todo',
      viewMode: 'board',
      selectedSprintId: 'cycle-1',
      objectiveId: 'obj-1',
      locationId: 'loc-1',
    });
    expect(draft.status).toBe('todo');
    expect(draft.dueDate).toBeUndefined();
    expect(draft.cycleId).toBe('cycle-1');
    expect(draft.objectiveId).toBe('obj-1');
    expect(draft.locationId).toBe('loc-1');
  });

  it('copia projectId al draft cuando el Kanban está en un proyecto', () => {
    const draft = buildSmartCreateDraft({
      columnStatus: 'todo',
      viewMode: 'board',
      selectedSprintId: null,
      projectId: 'proj-1',
    });
    expect(draft.projectId).toBe('proj-1');
  });

  it('columnas por defecto incluyen backlog', () => {
    expect(DEFAULT_KANBAN_COLUMNS).toContain('backlog');
  });
});
