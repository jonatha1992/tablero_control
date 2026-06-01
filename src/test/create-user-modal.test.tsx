import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateUserModal } from '@/components/equipo/create-user-modal';

const mockInviteMutate = vi.fn();
const mockCreateMutate = vi.fn();

vi.mock('@/hooks/mutations/use-invite-user', () => ({
  useInviteUser: vi.fn(() => ({ mutate: mockInviteMutate, isPending: false })),
}));

vi.mock('@/hooks/mutations/use-create-user', () => ({
  useCreateUser: vi.fn(() => ({ mutate: mockCreateMutate, isPending: false })),
}));

vi.mock('@/hooks/queries/use-locations-query', () => ({
  useLocationsQuery: vi.fn(() => ({
    data: [
      { id: 'loc-1', name: 'Expense Tracker' },
      { id: 'loc-2', name: 'Match Analyzer' },
    ],
  })),
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

describe('CreateUserModal — invitación por link', () => {
  it('muestra formulario simple sin pestañas de modo', () => {
    render(<CreateUserModal {...defaultProps} />);
    expect(screen.getByText('Invitar usuario')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Con correo/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Contraseña inicial')).not.toBeInTheDocument();
    expect(screen.getByText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enviar invitación/i })).toBeInTheDocument();
  });

  it('envía invitación personalizada con email y sectores', async () => {
    const user = userEvent.setup();
    render(<CreateUserModal {...defaultProps} />);

    await user.type(screen.getByPlaceholderText('Juan García'), 'Ana Multi');
    await user.type(screen.getByPlaceholderText('juan@empresa.com'), 'ana@test.com');

    // Seleccionar alcance "Sectores específicos" para mostrar el picker
    await user.click(screen.getByRole('button', { name: /Sectores específicos/i }));

    await user.click(screen.getByRole('button', { name: /Agregar sector/i }));
    const sectorSelect = screen
      .getAllByRole('combobox')
      .find((el) => Array.from((el as HTMLSelectElement).options).some((o) => o.value === 'loc-1'));
    expect(sectorSelect).toBeDefined();
    await user.selectOptions(sectorSelect!, 'loc-1');
    await user.click(screen.getByRole('button', { name: /Confirmar sector/i }));

    await user.click(screen.getByRole('button', { name: /Enviar invitación/i }));

    expect(mockInviteMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'biz-1',
        email: 'ana@test.com',
        inviteeName: 'Ana Multi',
        role: 'miembro',
        maxUses: 1,
        expiresInDays: 7,
        locationIds: ['loc-1'],
      }),
      expect.any(Object)
    );
    expect(mockCreateMutate).not.toHaveBeenCalled();
  });

  it('superadmin usa creación por correo sin link de equipo', async () => {
    const user = userEvent.setup();
    render(<CreateUserModal open onClose={vi.fn()} isSuperAdmin />);

    await user.type(screen.getByPlaceholderText('Juan García'), 'Super User');
    await user.type(screen.getByPlaceholderText('juan@empresa.com'), 'super@test.com');
    await user.click(screen.getByRole('button', { name: /Enviar invitación/i }));

    expect(mockCreateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Super User',
        email: 'super@test.com',
        mode: 'email',
      }),
      expect.any(Object)
    );
    expect(mockInviteMutate).not.toHaveBeenCalled();
  });
});
