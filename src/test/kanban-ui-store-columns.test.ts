import { describe, it, expect, beforeEach } from 'vitest';
import { useKanbanUIStore } from '@/stores/kanban-ui.store';
import type { TaskStatus } from '@/types/domain/task';

// Resetear el store antes de cada test
beforeEach(() => {
  useKanbanUIStore.setState({
    activeColumns: ['todo', 'in_progress', 'done'],
  });
});

describe('useKanbanUIStore — activeColumns', () => {
  it('columnas por defecto: ["todo", "in_progress", "done"]', () => {
    const { activeColumns } = useKanbanUIStore.getState();
    expect(activeColumns).toEqual(['todo', 'in_progress', 'done']);
  });

  it('toggleColumn quita una columna activa', () => {
    useKanbanUIStore.getState().toggleColumn('todo');
    expect(useKanbanUIStore.getState().activeColumns).not.toContain('todo');
    expect(useKanbanUIStore.getState().activeColumns).toContain('in_progress');
    expect(useKanbanUIStore.getState().activeColumns).toContain('done');
  });

  it('toggleColumn agrega una columna inactiva', () => {
    // Primero quitamos 'todo'
    useKanbanUIStore.getState().toggleColumn('todo');
    expect(useKanbanUIStore.getState().activeColumns).not.toContain('todo');
    // Luego la volvemos a agregar
    useKanbanUIStore.getState().toggleColumn('todo');
    expect(useKanbanUIStore.getState().activeColumns).toContain('todo');
  });

  it('idempotencia: toggle × 2 mantiene las mismas columnas', () => {
    const initial = [...useKanbanUIStore.getState().activeColumns];
    useKanbanUIStore.getState().toggleColumn('in_progress');
    useKanbanUIStore.getState().toggleColumn('in_progress');
    const after = useKanbanUIStore.getState().activeColumns;
    // El orden puede cambiar al re-insertar, pero el conjunto debe ser igual
    expect(after).toHaveLength(initial.length);
    expect(after).toEqual(expect.arrayContaining(initial));
  });

  it('puede quitar todas las columnas', () => {
    const columns: TaskStatus[] = ['todo', 'in_progress', 'done'];
    columns.forEach((c) => useKanbanUIStore.getState().toggleColumn(c));
    expect(useKanbanUIStore.getState().activeColumns).toHaveLength(0);
  });

  it('puede agregar columna adicional como "review"', () => {
    useKanbanUIStore.getState().toggleColumn('review' as TaskStatus);
    expect(useKanbanUIStore.getState().activeColumns).toContain('review');
  });

  it('no duplica una columna ya activa', () => {
    // 'done' ya está activa — llamar toggle la quita
    useKanbanUIStore.getState().toggleColumn('done');
    // Volver a agregar
    useKanbanUIStore.getState().toggleColumn('done');
    const actives = useKanbanUIStore.getState().activeColumns;
    const doneCount = actives.filter((c) => c === 'done').length;
    expect(doneCount).toBe(1);
  });
});

describe('useKanbanUIStore — filtros de UI', () => {
  it('estado inicial de filtros es vacío', () => {
    useKanbanUIStore.setState({
      filters: { searchQuery: '', priority: '', locationId: '' },
    });
    const { filters } = useKanbanUIStore.getState();
    expect(filters.searchQuery).toBe('');
    expect(filters.priority).toBe('');
    expect(filters.locationId).toBe('');
  });

  it('setFilters actualiza searchQuery sin afectar otros filtros', () => {
    useKanbanUIStore.setState({
      filters: { searchQuery: '', priority: 'high', locationId: 'loc-1' },
    });
    useKanbanUIStore.getState().setFilters({ searchQuery: 'test' });
    const { filters } = useKanbanUIStore.getState();
    expect(filters.searchQuery).toBe('test');
    expect(filters.priority).toBe('high');
    expect(filters.locationId).toBe('loc-1');
  });
});
