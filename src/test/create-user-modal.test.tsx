import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateUserModal } from '@/components/equipo/create-user-modal';

const mockMutate = vi.fn();

vi.mock('@/hooks/mutations/use-create-user', () => ({
  useCreateUser: vi.fn(() => ({ mutate: mockMutate, isPending: false })),
  EmailInactiveError: class EmailInactiveError extends Error {},
}));

vi.mock('@/hooks/queries/use-locations-query', () => ({
  useLocationsQuery: vi.fn(() => ({
    data: [
      { id: 'loc-1', name: 'Expense Tracker' },
      { id: 'loc-2', name: 'Match Analyzer' },
    ],
  })),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(() => ({ refetchQueries: vi.fn() })),
}));

vi.mock('@/lib/firebase/auth', () => ({
  getToken: vi.fn(() => Promise.resolve('token')),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  businessId: 'biz-1',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CreateUserModal — campos por modo', () => {
  it('modo email: selector compacto en una fila y contraseña única', () => {
    render(<CreateUserModal {...defaultProps} />);
    const modeGrid = screen.getByRole('button', { name: /Con correo/i }).parentElement;
    expect(modeGrid?.className).toMatch(/grid-cols-4/);
    expect(screen.getByText('Correo electrónico')).toBeInTheDocument();
    expect(screen.queryByText('Nombre de usuario')).not.toBeInTheDocument();
    expect(screen.getAllByText('Contraseña inicial')).toHaveLength(1);
    expect(screen.getAllByText('Crear acceso con contraseña')).toHaveLength(1);
  });

  it('modo username: sin email, con usuario y contraseña única', async () => {
    const user = userEvent.setup();
    render(<CreateUserModal {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /Con usuario/i }));

    expect(screen.queryByText('Correo electrónico')).not.toBeInTheDocument();
    expect(screen.getByText('Nombre de usuario')).toBeInTheDocument();
    expect(screen.getAllByText('Contraseña inicial')).toHaveLength(1);
    expect(screen.queryByText('Crear acceso con contraseña')).not.toBeInTheDocument();
  });

  it('modo google: gmail sin contraseña', async () => {
    const user = userEvent.setup();
    render(<CreateUserModal {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /Con Google/i }));

    expect(screen.getByText('Gmail')).toBeInTheDocument();
    expect(screen.queryByText('Contraseña inicial')).not.toBeInTheDocument();
  });

  it('submit username envía mode y username al API', async () => {
    const user = userEvent.setup();
    render(<CreateUserModal {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /Con usuario/i }));

    await user.type(screen.getByPlaceholderText('Juan García'), 'Juan Test');
    await user.type(screen.getByPlaceholderText('juan.garcia'), 'juan.test');
    await user.click(screen.getByRole('button', { name: /Crear usuario/i }));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'username',
        username: 'juan.test',
        name: 'Juan Test',
        email: undefined,
      }),
      expect.any(Object)
    );
  });

  it('sin sectores no envía locationAssignments', async () => {
    const user = userEvent.setup();
    render(<CreateUserModal {...defaultProps} />);

    await user.type(screen.getByPlaceholderText('Juan García'), 'Ana');
    await user.type(screen.getByPlaceholderText('juan@empresa.com'), 'ana@test.com');
    await user.click(screen.getByRole('button', { name: /Crear usuario/i }));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ locationAssignments: undefined }),
      expect.any(Object)
    );
  });

  it('envía locationAssignments con rol por sector al confirmar', async () => {
    const user = userEvent.setup();
    render(<CreateUserModal {...defaultProps} />);

    await user.type(screen.getByPlaceholderText('Juan García'), 'Ana Multi');
    await user.type(screen.getByPlaceholderText('juan@empresa.com'), 'ana@test.com');

    await user.click(screen.getByRole('button', { name: /Agregar sector/i }));
    const [sectorSelect, roleSelect] = screen.getAllByRole('combobox');
    await user.selectOptions(sectorSelect, 'loc-1');
    await user.selectOptions(roleSelect, 'responsable');
    await user.click(screen.getByRole('button', { name: /Confirmar sector/i }));

    await user.click(screen.getByRole('button', { name: /Crear usuario/i }));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Ana Multi',
        locationAssignments: [{ locationId: 'loc-1', role: 'responsable' }],
      }),
      expect.any(Object)
    );
  });
});
