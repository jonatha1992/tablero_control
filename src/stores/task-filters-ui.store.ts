import { create } from 'zustand';
import type { TaskFilterState } from '@/types/ui/task-filters.ui';
import { EMPTY_TASK_FILTERS } from '@/types/ui/task-filters.ui';

export type TaskFilterView = 'agenda' | 'calendar';

/** Calendar hides done tasks by default — the grid mixes them with pending ones otherwise. */
const defaultCalendarFilters: TaskFilterState = {
  ...EMPTY_TASK_FILTERS,
  excludeStatuses: ['done'],
};

const defaultsByView: Record<TaskFilterView, TaskFilterState> = {
  agenda: EMPTY_TASK_FILTERS,
  calendar: defaultCalendarFilters,
};

interface TaskFiltersUIStore {
  // Filtros de UI (no server state — no se persisten)
  filters: Record<TaskFilterView, TaskFilterState>;
  setFilter: (view: TaskFilterView, patch: Partial<TaskFilterState>) => void;
  clearFilters: (view: TaskFilterView) => void;
}

export const useTaskFiltersUIStore = create<TaskFiltersUIStore>((set) => ({
  filters: {
    agenda: { ...defaultsByView.agenda },
    calendar: { ...defaultsByView.calendar },
  },
  setFilter: (view, patch) =>
    set((s) => ({ filters: { ...s.filters, [view]: { ...s.filters[view], ...patch } } })),
  clearFilters: (view) =>
    set((s) => ({ filters: { ...s.filters, [view]: { ...defaultsByView[view] } } })),
}));
