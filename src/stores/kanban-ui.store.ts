import { create } from 'zustand';
import type { KanbanDragState, KanbanUIFilters } from '@/types/ui/kanban.ui';
import type { TaskStatus } from '@/types/domain/task';

interface KanbanUIStore {
  // Drag & drop — efímero, solo existe durante el gesto
  dragState: KanbanDragState;
  setDraggedTask: (taskId: string | null, from: TaskStatus | null) => void;
  setDragOver: (column: TaskStatus | null) => void;
  clearDrag: () => void;

  // Modales
  isCreateModalOpen: boolean;
  isDetailModalOpen: boolean;
  selectedTaskId: string | null;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  openTaskDetail: (taskId: string) => void;
  closeTaskDetail: () => void;

  // Filtros de UI (no server state — no se persisten)
  filters: KanbanUIFilters;
  setFilters: (filters: Partial<KanbanUIFilters>) => void;
  clearFilters: () => void;

  // View Settings
  activeColumns: TaskStatus[];
  toggleColumn: (column: TaskStatus) => void;
}

const defaultDragState: KanbanDragState = {
  draggedTaskId: null,
  draggedFrom: null,
  dragOverColumn: null,
};

const defaultFilters: KanbanUIFilters = {
  searchQuery: '',
  priority: '',
  locationId: '',
};

export const useKanbanUIStore = create<KanbanUIStore>((set) => ({
  dragState: defaultDragState,
  setDraggedTask: (taskId, from) =>
    set((s) => ({ dragState: { ...s.dragState, draggedTaskId: taskId, draggedFrom: from } })),
  setDragOver: (column) =>
    set((s) => ({ dragState: { ...s.dragState, dragOverColumn: column } })),
  clearDrag: () => set({ dragState: defaultDragState }),

  isCreateModalOpen: false,
  isDetailModalOpen: false,
  selectedTaskId: null,
  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),
  openTaskDetail: (taskId) => set({ isDetailModalOpen: true, selectedTaskId: taskId }),
  closeTaskDetail: () => set({ isDetailModalOpen: false, selectedTaskId: null }),

  filters: defaultFilters,
  setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters } })),
  clearFilters: () => set({ filters: defaultFilters }),

  activeColumns: ['todo', 'in_progress', 'done'],
  toggleColumn: (column) => set((s) => ({
    activeColumns: s.activeColumns.includes(column)
      ? s.activeColumns.filter((c) => c !== column)
      : [...s.activeColumns, column],
  })),
}));
