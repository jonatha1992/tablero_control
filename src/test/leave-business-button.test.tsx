import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LeaveBusinessButton } from '@/components/equipo/leave-business-button';
import { useAuth } from '@/hooks/auth-context';
import { useMembersQuery } from '@/hooks/queries/use-members-query';
import { useLeaveBusiness } from '@/hooks/mutations/use-leave-business';

vi.mock('@/hooks/auth-context', () => ({ useAuth: vi.fn() }));
vi.mock('@/hooks/queries/use-members-query', () => ({ useMembersQuery: vi.fn() }));
vi.mock('@/hooks/mutations/use-leave-business', () => ({ useLeaveBusiness: vi.fn() }));
vi.mock('@/components/ui/confirm-dialog', () => ({
  ConfirmDialog: ({ open, children, onConfirm }: { open: boolean; children?: React.ReactNode; onConfirm: () => void }) =>
    open ? <div>{children}<button onClick={onConfirm}>Confirmar salida</button></div> : null,
}));

const mutate = vi.fn();
const mockAuth = vi.mocked(useAuth);
const mockMembers = vi.mocked(useMembersQuery);
const mockLeave = vi.mocked(useLeaveBusiness);

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockReturnValue({ user: { id: 'owner-1', businessId: 'biz-1' }, isOwner: true, isAdmin: true } as never);
  mockMembers.mockReturnValue({ data: [
    { id: 'owner-1', name: 'TecnoFusión', role: 'admin', isActive: true },
    { id: 'admin-2', name: 'Ana', role: 'admin', isActive: true },
    { id: 'inactive-3', name: 'Pedro', role: 'admin', isActive: false },
    { id: 'member-4', name: 'Luis', role: 'miembro', isActive: true },
  ] } as never);
  mockLeave.mockReturnValue({ mutate, isPending: false } as never);
});

describe('LeaveBusinessButton', () => {
  it('permite al propietario elegir un admin activo antes de salir', () => {
    render(<LeaveBusinessButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Salir del espacio' }));
    const selector = screen.getByLabelText('Nuevo propietario');
    expect(selector).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Ana' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Pedro' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Luis' })).not.toBeInTheDocument();
    fireEvent.change(selector, { target: { value: 'admin-2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar salida' }));
    expect(mutate).toHaveBeenCalledWith('admin-2');
  });

  it('no envía salida del propietario sin sucesor elegido', () => {
    render(<LeaveBusinessButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Salir del espacio' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar salida' }));
    expect(mutate).not.toHaveBeenCalled();
  });
});
