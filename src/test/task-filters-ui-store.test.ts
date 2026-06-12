import { describe, it, expect, beforeEach } from 'vitest';
import { useTaskFiltersUIStore } from '@/stores/task-filters-ui.store';
import { EMPTY_TASK_FILTERS } from '@/types/ui/task-filters.ui';

// Resetear el store antes de cada test
beforeEach(() => {
  useTaskFiltersUIStore.setState({
    filters: {
      agenda: { ...EMPTY_TASK_FILTERS },
      calendar: { ...EMPTY_TASK_FILTERS, excludeStatuses: ['done'] },
    },
  });
});

describe('useTaskFiltersUIStore', () => {
  it('defaults: agenda sin filtros, calendario oculta finalizadas', () => {
    const { filters } = useTaskFiltersUIStore.getState();
    expect(filters.agenda).toEqual(EMPTY_TASK_FILTERS);
    expect(filters.calendar.excludeStatuses).toEqual(['done']);
  });

  it('setFilter mergea el patch solo en la vista indicada', () => {
    useTaskFiltersUIStore.getState().setFilter('agenda', { priority: 'high', assigneeIds: ['u-1'] });
    const { filters } = useTaskFiltersUIStore.getState();
    expect(filters.agenda.priority).toBe('high');
    expect(filters.agenda.assigneeIds).toEqual(['u-1']);
    expect(filters.agenda.locationId).toBe('');
    // Calendario intacto
    expect(filters.calendar.priority).toBe('');
    expect(filters.calendar.excludeStatuses).toEqual(['done']);
  });

  it('clearFilters restaura los defaults de cada vista', () => {
    useTaskFiltersUIStore.getState().setFilter('calendar', { priority: 'low', excludeStatuses: [] });
    useTaskFiltersUIStore.getState().setFilter('agenda', { locationId: 'loc-1' });

    useTaskFiltersUIStore.getState().clearFilters('calendar');
    useTaskFiltersUIStore.getState().clearFilters('agenda');

    const { filters } = useTaskFiltersUIStore.getState();
    // Calendario vuelve a ocultar finalizadas (no a vacío)
    expect(filters.calendar.excludeStatuses).toEqual(['done']);
    expect(filters.calendar.priority).toBe('');
    expect(filters.agenda).toEqual(EMPTY_TASK_FILTERS);
  });
});
