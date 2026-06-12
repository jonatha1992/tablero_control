import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TaskFilterBar } from '@/components/tareas/task-filter-bar';
import { EMPTY_TASK_FILTERS, type TaskFilterState } from '@/types/ui/task-filters.ui';

// Mock DropdownMenu — en jsdom Radix no abre portales con fireEvent, renderizamos siempre el contenido
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuTrigger: ({ children, asChild: _asChild }: { children: React.ReactNode; asChild?: boolean }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onSelect }: { children: React.ReactNode; onSelect?: (e: Event) => void }) => (
    <button onClick={() => onSelect?.(new Event('select'))}>{children}</button>
  ),
  DropdownMenuCheckboxItem: ({ children, checked, onCheckedChange }: { children: React.ReactNode; checked?: boolean; onCheckedChange?: (c: boolean) => void; onSelect?: (e: Event) => void }) => (
    <button data-checked={checked} onClick={() => onCheckedChange?.(!checked)}>{children}</button>
  ),
}));

vi.mock('@/hooks/auth-context', () => ({
  useAuth: () => ({ user: { id: 'user-1', businessId: 'biz-1' } }),
}));

vi.mock('@/hooks/queries/use-members-query', () => ({
  useMembersQuery: () => ({ data: [
    { id: 'u-1', name: 'Ana' },
    { id: 'u-2', name: 'Bruno' },
  ] }),
}));

vi.mock('@/hooks/queries/use-locations-query', () => ({
  useLocationsQuery: () => ({ data: [
    { id: 'loc-1', name: 'Cocina', metadata: {} },
  ] }),
}));

vi.mock('@/hooks/queries/use-objectives-query', () => ({
  useObjectivesQuery: () => ({ data: [
    { id: 'obj-1', name: 'Objetivo Q2', color: '#fff' },
  ] }),
}));

const setup = (filters: Partial<TaskFilterState> = {}, props: { showExcludeDoneToggle?: boolean } = {}) => {
  const onChange = vi.fn();
  const onClear = vi.fn();
  render(
    <TaskFilterBar
      filters={{ ...EMPTY_TASK_FILTERS, ...filters }}
      onChange={onChange}
      onClear={onClear}
      {...props}
    />
  );
  return { onChange, onClear };
};

describe('TaskFilterBar', () => {
  it('renderiza los cuatro filtros con sus placeholders', () => {
    setup();
    // El mock renderiza trigger + contenido del menú, por eso aparecen duplicados
    expect(screen.getAllByText('Todas las personas').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Todos los objetivos').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Todas las prioridades').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Todos los locales/sectores').length).toBeGreaterThan(0);
  });

  it('seleccionar una persona llama onChange con assigneeIds', () => {
    const { onChange } = setup();
    fireEvent.click(screen.getByText('Ana'));
    expect(onChange).toHaveBeenCalledWith({ assigneeIds: ['u-1'] });
  });

  it('deseleccionar una persona ya filtrada la quita del array', () => {
    const { onChange } = setup({ assigneeIds: ['u-1', 'u-2'] });
    fireEvent.click(screen.getByText('Ana'));
    expect(onChange).toHaveBeenCalledWith({ assigneeIds: ['u-2'] });
  });

  it('seleccionar objetivo y prioridad llama onChange con el patch correcto', () => {
    const { onChange } = setup();
    fireEvent.click(screen.getByText('Objetivo Q2'));
    expect(onChange).toHaveBeenCalledWith({ objectiveId: 'obj-1' });
    fireEvent.click(screen.getByText('Alta'));
    expect(onChange).toHaveBeenCalledWith({ priority: 'high' });
  });

  it('seleccionar sector llama onChange con locationId', () => {
    const { onChange } = setup();
    fireEvent.click(screen.getByText('Cocina'));
    expect(onChange).toHaveBeenCalledWith({ locationId: 'loc-1' });
  });

  it('toggle "Ocultar finalizadas" agrega y quita done de excludeStatuses', () => {
    const { onChange } = setup({}, { showExcludeDoneToggle: true });
    fireEvent.click(screen.getByText('Ocultar finalizadas'));
    expect(onChange).toHaveBeenCalledWith({ excludeStatuses: ['done'] });
  });

  it('no muestra "Limpiar" sin filtros activos', () => {
    setup();
    expect(screen.queryByText('Limpiar')).not.toBeInTheDocument();
  });

  it('no muestra "Limpiar" cuando solo está el default de calendario (ocultar done)', () => {
    setup({ excludeStatuses: ['done'] }, { showExcludeDoneToggle: true });
    expect(screen.queryByText('Limpiar')).not.toBeInTheDocument();
  });

  it('muestra "Limpiar" con filtros activos y llama onClear', () => {
    const { onClear } = setup({ priority: 'high' });
    const clear = screen.getByText('Limpiar');
    fireEvent.click(clear);
    expect(onClear).toHaveBeenCalled();
  });
});
