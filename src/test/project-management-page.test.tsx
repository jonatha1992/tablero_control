import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProjectManagementPage from '@/app/dashboard/tareas/tableros/page';

const mutate = vi.fn();

vi.mock('@/hooks/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', businessId: 'biz-1', role: 'admin' },
    isAdmin: true,
  }),
}));

vi.mock('@/hooks/queries/use-projects-query', () => ({
  useProjectsQuery: () => ({
    isLoading: false,
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
  }),
  useUpdateProject: () => ({ mutate, isPending: false }),
}));

describe('ProjectManagementPage', () => {
  beforeEach(() => mutate.mockClear());

  it('separa tableros activos y archivados', async () => {
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

  it('restaura un tablero archivado', async () => {
    const user = userEvent.setup();
    render(<ProjectManagementPage />);

    await user.click(screen.getByRole('tab', { name: /Archivados/i }));
    await user.click(screen.getByRole('button', { name: 'Restaurar Campaña 2025' }));

    expect(mutate).toHaveBeenCalledWith(
      { id: 'archived-1', data: { action: 'restore' } },
      expect.any(Object),
    );
  });
});
