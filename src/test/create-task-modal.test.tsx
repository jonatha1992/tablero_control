import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateTaskModal } from '@/components/tareas/create-task-modal';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockMutate = vi.fn();

vi.mock('@/hooks/mutations/use-create-task', () => ({
  useCreateTask: vi.fn(() => ({
    mutate: mockMutate,
    isPending: false,
  })),
}));

vi.mock('@/hooks/queries/use-members-query', () => ({
  useMembersQuery: vi.fn(() => ({
    data: [
      { id: 'mem-1', name: 'Ana García', email: 'ana@biz.com', role: 'miembro', businessId: 'biz-1' },
      { id: 'mem-2', name: 'Bob Pérez', email: 'bob@biz.com', role: 'responsable', businessId: 'biz-1' },
    ],
  })),
  memberKeys: { all: ['members'], byBusiness: (b: string) => ['members', b] },
}));

vi.mock('@/hooks/auth-context', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-1', businessId: 'biz-1', role: 'admin' },
    isSuperAdmin: false,
  })),
}));

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('CreateTaskModal', () => {
  it('no renderiza cuando open=false', () => {
    render(<CreateTaskModal {...defaultProps} open={false} />);
    expect(screen.queryByText('Crear Nueva Tarea')).not.toBeInTheDocument();
  });

  it('renderiza cuando open=true', () => {
    render(<CreateTaskModal {...defaultProps} />);
    expect(screen.getByText('Crear Nueva Tarea')).toBeInTheDocument();
  });

  it('estado por defecto es "todo"', () => {
    render(<CreateTaskModal {...defaultProps} />);
    const statusSelect = screen.getByDisplayValue('Por hacer');
    expect(statusSelect).toBeInTheDocument();
  });

  it('prioridad por defecto es "medium"', () => {
    render(<CreateTaskModal {...defaultProps} />);
    const prioritySelect = screen.getByDisplayValue('Media');
    expect(prioritySelect).toBeInTheDocument();
  });

  it('defaultStatus prop se aplica correctamente', () => {
    render(<CreateTaskModal {...defaultProps} defaultStatus="in_progress" />);
    const statusSelect = screen.getByDisplayValue('En progreso');
    expect(statusSelect).toBeInTheDocument();
  });

  it('submit disabled si título vacío', () => {
    render(<CreateTaskModal {...defaultProps} />);
    const submitBtn = screen.getByRole('button', { name: /Crear tarea/i });
    expect(submitBtn).toBeDisabled();
  });

  it('submit habilitado cuando hay título', async () => {
    render(<CreateTaskModal {...defaultProps} />);
    const titleInput = screen.getByPlaceholderText('Título de la tarea');
    await userEvent.type(titleInput, 'Mi tarea');
    const submitBtn = screen.getByRole('button', { name: /Crear tarea/i });
    expect(submitBtn).not.toBeDisabled();
  });

  it('clic en assignee lo agrega a assigneeIds', async () => {
    render(<CreateTaskModal {...defaultProps} />);
    const anaBtn = screen.getByRole('button', { name: /Ana/i });
    fireEvent.click(anaBtn);
    // Aparece indicador de cantidad
    expect(screen.getByText('(1)')).toBeInTheDocument();
  });

  it('segundo clic en assignee lo quita de assigneeIds', async () => {
    render(<CreateTaskModal {...defaultProps} />);
    const anaBtn = screen.getByRole('button', { name: /Ana/i });
    fireEvent.click(anaBtn);
    fireEvent.click(anaBtn);
    expect(screen.queryByText('(1)')).not.toBeInTheDocument();
  });

  it('submit llama mutate con datos correctos', async () => {
    render(<CreateTaskModal {...defaultProps} />);
    const titleInput = screen.getByPlaceholderText('Título de la tarea');
    await userEvent.type(titleInput, 'Mi nueva tarea');

    const submitBtn = screen.getByRole('button', { name: /Crear tarea/i });
    fireEvent.click(submitBtn);

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Mi nueva tarea',
        status: 'todo',
        priority: 'medium',
      }),
      expect.any(Object)
    );
  });

  it('tags separadas por coma → array sin vacíos', async () => {
    render(<CreateTaskModal {...defaultProps} />);
    const titleInput = screen.getByPlaceholderText('Título de la tarea');
    await userEvent.type(titleInput, 'Test');

    const tagsInput = screen.getByPlaceholderText('frontend, ui, bug');
    await userEvent.type(tagsInput, 'frontend, ui, , bug');

    const submitBtn = screen.getByRole('button', { name: /Crear tarea/i });
    fireEvent.click(submitBtn);

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: ['frontend', 'ui', 'bug'], // sin el vacío
      }),
      expect.any(Object)
    );
  });

  it('llama onOpenChange(false) en onSuccess del mutate', async () => {
    const onOpenChange = vi.fn();
    render(<CreateTaskModal {...defaultProps} onOpenChange={onOpenChange} />);
    const titleInput = screen.getByPlaceholderText('Título de la tarea');
    await userEvent.type(titleInput, 'Tarea X');
    fireEvent.click(screen.getByRole('button', { name: /Crear tarea/i }));

    // Simular onSuccess siendo llamado
    const onSuccess = mockMutate.mock.calls[0][1].onSuccess;
    onSuccess();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
