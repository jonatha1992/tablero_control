import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProjectManagementPage from '@/app/dashboard/tareas/tableros/page';

const mutate = vi.fn();
const createMutate = vi.fn();
const replace = vi.fn();
const push = vi.fn();
const projectQuery = vi.hoisted(() => ({
  data: [
    {
      id: 'active-1', name: 'Operaciones', description: 'Trabajo diario',
      businessId: 'biz-1', status: 'active', _count: { tasks: 5 }, openTaskCount: 2,
    },
    {
      id: 'archived-1', name: 'Campaña 2025', description: null,
      businessId: 'biz-1', status: 'archived', _count: { tasks: 8 }, openTaskCount: 0,
    },
  ],
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/hooks/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', businessId: 'biz-1', role: 'admin' },
    isAdmin: true,
  }),
}));

vi.mock('@/hooks/queries/use-projects-query', () => ({
  useProjectsQuery: () => ({
    isLoading: false,
    isError: false,
    data: projectQuery.data,
  }),
  useUpdateProject: () => ({ mutate, isPending: false }),
  useCreateProject: () => ({ mutate: createMutate, isPending: false }),
}));

describe('ProjectManagementPage', () => {
  beforeEach(() => {
    mutate.mockClear();
    createMutate.mockClear();
    replace.mockClear();
    push.mockClear();
    projectQuery.data = [
      {
        id: 'active-1', name: 'Operaciones', description: 'Trabajo diario',
        businessId: 'biz-1', status: 'active', _count: { tasks: 5 }, openTaskCount: 2,
      },
      {
        id: 'archived-1', name: 'Campaña 2025', description: null,
        businessId: 'biz-1', status: 'archived', _count: { tasks: 8 }, openTaskCount: 0,
      },
    ];
  });

  it('muestra el único proyecto activo (no redirige)', () => {
    projectQuery.data = [
      {
        id: 'active-1', name: 'Principal', description: null,
        businessId: 'biz-1', status: 'active', _count: { tasks: 3 }, openTaskCount: 1,
      },
    ];
    render(<ProjectManagementPage />);

    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByText('Principal')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver todo' })).toHaveAttribute('href', '/dashboard/tareas');
  });

  it('entra al Kanban del proyecto al hacer click en la fila', async () => {
    const user = userEvent.setup();
    render(<ProjectManagementPage />);

    await user.click(screen.getByText('Operaciones'));
    expect(push).toHaveBeenCalledWith('/dashboard/tareas?projectId=active-1');
  });

  it('separa proyectos activos y archivados', async () => {
    const user = userEvent.setup();
    render(<ProjectManagementPage />);

    expect(screen.getByText('Operaciones')).toBeInTheDocument();
    expect(screen.queryByText('Campaña 2025')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /Archivados/i }));
    expect(screen.getByText('Campaña 2025')).toBeInTheDocument();
    expect(screen.queryByText('Operaciones')).not.toBeInTheDocument();
  });

  it('advierte tareas pendientes antes de archivar', async () => {
    const user = userEvent.setup();
    render(<ProjectManagementPage />);

    await user.click(screen.getByRole('button', { name: 'Archivar Operaciones' }));

    expect(screen.getByText(/2 tareas pendientes/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirmar archivo' }));
    expect(mutate).toHaveBeenCalledWith(
      { id: 'active-1', data: { action: 'archive' } },
      expect.any(Object),
    );
  });

  it('restaura un proyecto archivado', async () => {
    const user = userEvent.setup();
    render(<ProjectManagementPage />);

    await user.click(screen.getByRole('tab', { name: /Archivados/i }));
    await user.click(screen.getByRole('button', { name: 'Restaurar Campaña 2025' }));

    expect(mutate).toHaveBeenCalledWith(
      { id: 'archived-1', data: { action: 'restore' } },
      expect.any(Object),
    );
  });

  it('crea un proyecto y entra al Kanban', async () => {
    const user = userEvent.setup();
    createMutate.mockImplementation((_data, opts?: { onSuccess?: (project: { id: string }) => void }) => {
      opts?.onSuccess?.({ id: 'new-1' });
    });
    render(<ProjectManagementPage />);

    await user.click(screen.getByRole('button', { name: 'Nuevo proyecto' }));
    await user.type(screen.getByLabelText('Nombre'), 'Causa Pérez');
    await user.click(screen.getByRole('button', { name: 'Crear y entrar' }));

    expect(createMutate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Causa Pérez', businessId: 'biz-1' }),
      expect.any(Object),
    );
    expect(push).toHaveBeenCalledWith('/dashboard/tareas?projectId=new-1');
  });
});
