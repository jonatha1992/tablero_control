import { describe, it, expect, beforeEach } from 'vitest';
import { useKanbanUIStore } from '@/stores/kanban-ui.store';
import type { TaskStatus } from '@/types';

describe('KanbanUIStore', () => {
  beforeEach(() => {
    useKanbanUIStore.setState({
      dragState: { draggedTaskId: null, draggedFrom: null, dragOverColumn: null },
      isCreateModalOpen: false,
      isDetailModalOpen: false,
      selectedTaskId: null,
      filters: { searchQuery: '', priority: '', locationId: '' },
    });
  });

  describe('drag state', () => {
    it('establece la tarea arrastrada', () => {
      useKanbanUIStore.getState().setDraggedTask('task-1', 'todo');
      const { dragState } = useKanbanUIStore.getState();
      expect(dragState.draggedTaskId).toBe('task-1');
      expect(dragState.draggedFrom).toBe('todo');
    });

    it('establece la columna sobre la que se arrastra', () => {
      useKanbanUIStore.getState().setDragOver('in_progress');
      expect(useKanbanUIStore.getState().dragState.dragOverColumn).toBe('in_progress');
    });

    it('limpia el estado de drag', () => {
      useKanbanUIStore.getState().setDraggedTask('task-1', 'todo');
      useKanbanUIStore.getState().clearDrag();
      const { dragState } = useKanbanUIStore.getState();
      expect(dragState.draggedTaskId).toBeNull();
      expect(dragState.draggedFrom).toBeNull();
      expect(dragState.dragOverColumn).toBeNull();
    });
  });

  describe('modales', () => {
    it('abre y cierra el modal de crear', () => {
      useKanbanUIStore.getState().openCreateModal();
      expect(useKanbanUIStore.getState().isCreateModalOpen).toBe(true);
      useKanbanUIStore.getState().closeCreateModal();
      expect(useKanbanUIStore.getState().isCreateModalOpen).toBe(false);
    });

    it('abre el detalle con el taskId correcto', () => {
      useKanbanUIStore.getState().openTaskDetail('task-42');
      expect(useKanbanUIStore.getState().isDetailModalOpen).toBe(true);
      expect(useKanbanUIStore.getState().selectedTaskId).toBe('task-42');
    });

    it('cierra el detalle y limpia el taskId', () => {
      useKanbanUIStore.getState().openTaskDetail('task-42');
      useKanbanUIStore.getState().closeTaskDetail();
      expect(useKanbanUIStore.getState().isDetailModalOpen).toBe(false);
      expect(useKanbanUIStore.getState().selectedTaskId).toBeNull();
    });
  });

  describe('filtros UI', () => {
    it('actualiza el query de búsqueda', () => {
      useKanbanUIStore.getState().setFilters({ searchQuery: 'bug fix' });
      expect(useKanbanUIStore.getState().filters.searchQuery).toBe('bug fix');
    });

    it('actualiza la prioridad', () => {
      useKanbanUIStore.getState().setFilters({ priority: 'high' });
      expect(useKanbanUIStore.getState().filters.priority).toBe('high');
    });

    it('actualiza el locationId', () => {
      useKanbanUIStore.getState().setFilters({ locationId: 'loc-001' });
      expect(useKanbanUIStore.getState().filters.locationId).toBe('loc-001');
    });

    it('merge parcial de filtros sin pisar los demás', () => {
      useKanbanUIStore.getState().setFilters({ searchQuery: 'fix', priority: 'urgent' });
      useKanbanUIStore.getState().setFilters({ locationId: 'loc-001' });
      const { filters } = useKanbanUIStore.getState();
      expect(filters.searchQuery).toBe('fix');
      expect(filters.priority).toBe('urgent');
      expect(filters.locationId).toBe('loc-001');
    });

    it('limpia todos los filtros', () => {
      useKanbanUIStore.getState().setFilters({ searchQuery: 'algo', priority: 'high' });
      useKanbanUIStore.getState().clearFilters();
      const { filters } = useKanbanUIStore.getState();
      expect(filters.searchQuery).toBe('');
      expect(filters.priority).toBe('');
      expect(filters.locationId).toBe('');
    });
  });
});
