import { describe, it, expect } from 'vitest';
import {
  EMPTY_TASK_FILTERS,
  hasActiveFilters,
  matchesTaskFilters,
  type TaskFilterState,
} from '@/types/ui/task-filters.ui';
import type { Task } from '@/types';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: 'Tarea de prueba',
  description: '',
  status: 'todo',
  priority: 'medium',
  type: 'task',
  assigneeIds: [],
  creatorId: 'user-1',
  tags: [],
  subtaskIds: [],
  subtasksCompleted: 0,
  checklist: [],
  attachmentUrls: [],
  commentCount: 0,
  position: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const filters = (overrides: Partial<TaskFilterState> = {}): TaskFilterState => ({
  ...EMPTY_TASK_FILTERS,
  ...overrides,
});

describe('matchesTaskFilters', () => {
  it('sin filtros activos: toda tarea pasa', () => {
    expect(matchesTaskFilters(makeTask(), EMPTY_TASK_FILTERS)).toBe(true);
    expect(matchesTaskFilters(makeTask({ status: 'done' }), EMPTY_TASK_FILTERS)).toBe(true);
  });

  describe('assigneeIds', () => {
    it('pasa si la tarea tiene alguno de los asignados filtrados', () => {
      const task = makeTask({ assigneeIds: ['u-1', 'u-2'] });
      expect(matchesTaskFilters(task, filters({ assigneeIds: ['u-2'] }))).toBe(true);
      expect(matchesTaskFilters(task, filters({ assigneeIds: ['u-3', 'u-1'] }))).toBe(true);
    });

    it('falla si la tarea no tiene ninguno de los asignados filtrados', () => {
      const task = makeTask({ assigneeIds: ['u-1'] });
      expect(matchesTaskFilters(task, filters({ assigneeIds: ['u-9'] }))).toBe(false);
    });

    it('falla para tareas sin asignados cuando hay filtro de persona', () => {
      expect(matchesTaskFilters(makeTask(), filters({ assigneeIds: ['u-1'] }))).toBe(false);
    });
  });

  describe('objectiveId', () => {
    it('pasa cuando coincide', () => {
      const task = makeTask({ objectiveId: 'obj-1' });
      expect(matchesTaskFilters(task, filters({ objectiveId: 'obj-1' }))).toBe(true);
    });

    it('falla cuando no coincide o la tarea no tiene objetivo', () => {
      expect(matchesTaskFilters(makeTask({ objectiveId: 'obj-2' }), filters({ objectiveId: 'obj-1' }))).toBe(false);
      expect(matchesTaskFilters(makeTask(), filters({ objectiveId: 'obj-1' }))).toBe(false);
    });
  });

  describe('priority', () => {
    it('pasa cuando coincide y falla cuando no', () => {
      expect(matchesTaskFilters(makeTask({ priority: 'high' }), filters({ priority: 'high' }))).toBe(true);
      expect(matchesTaskFilters(makeTask({ priority: 'low' }), filters({ priority: 'high' }))).toBe(false);
    });
  });

  describe('locationId', () => {
    it('pasa cuando coincide y falla cuando no o sin sector', () => {
      expect(matchesTaskFilters(makeTask({ locationId: 'loc-1' }), filters({ locationId: 'loc-1' }))).toBe(true);
      expect(matchesTaskFilters(makeTask({ locationId: 'loc-2' }), filters({ locationId: 'loc-1' }))).toBe(false);
      expect(matchesTaskFilters(makeTask(), filters({ locationId: 'loc-1' }))).toBe(false);
    });
  });

  describe('excludeStatuses', () => {
    it('excluye los estados listados', () => {
      expect(matchesTaskFilters(makeTask({ status: 'done' }), filters({ excludeStatuses: ['done'] }))).toBe(false);
      expect(matchesTaskFilters(makeTask({ status: 'todo' }), filters({ excludeStatuses: ['done'] }))).toBe(true);
      expect(matchesTaskFilters(makeTask({ status: 'archived' }), filters({ excludeStatuses: ['done', 'archived'] }))).toBe(false);
    });
  });

  describe('combinaciones (AND)', () => {
    it('exige que TODAS las dimensiones pasen', () => {
      const task = makeTask({ assigneeIds: ['u-1'], priority: 'high', locationId: 'loc-1', status: 'todo' });
      const f = filters({ assigneeIds: ['u-1'], priority: 'high', locationId: 'loc-1', excludeStatuses: ['done'] });
      expect(matchesTaskFilters(task, f)).toBe(true);
      expect(matchesTaskFilters(makeTask({ ...task, priority: 'low' }), f)).toBe(false);
      expect(matchesTaskFilters(makeTask({ ...task, status: 'done' }), f)).toBe(false);
    });
  });
});

describe('hasActiveFilters', () => {
  it('false para filtros vacíos', () => {
    expect(hasActiveFilters(EMPTY_TASK_FILTERS)).toBe(false);
  });

  it('true cuando cualquier dimensión está activa', () => {
    expect(hasActiveFilters(filters({ assigneeIds: ['u-1'] }))).toBe(true);
    expect(hasActiveFilters(filters({ objectiveId: 'obj-1' }))).toBe(true);
    expect(hasActiveFilters(filters({ priority: 'low' }))).toBe(true);
    expect(hasActiveFilters(filters({ locationId: 'loc-1' }))).toBe(true);
    expect(hasActiveFilters(filters({ excludeStatuses: ['done'] }))).toBe(true);
  });
});
