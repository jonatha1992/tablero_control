import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InviteClient } from '@/app/i/[token]/invite-client';

const mockPrepareAccount = vi.fn();
const mockRegister = vi.fn();
const mockAccept = vi.fn();
const mockRefreshProfile = vi.fn();

let authState: Record<string, unknown>;
let acceptState: Record<string, unknown>;

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/hooks/auth-context', () => ({ useAuth: () => authState }));
vi.mock('@/hooks/mutations/use-accept-invite', () => ({ useAcceptInvite: () => acceptState }));
vi.mock('@/lib/firebase/auth', () => ({
  register: (...args: unknown[]) => mockRegister(...args),
  login: vi.fn(),
  loginWithGoogle: vi.fn(),
}));
vi.mock('@/lib/api/invites', () => ({
  invitesApi: { prepareAccount: (...args: unknown[]) => mockPrepareAccount(...args) },
}));

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
  authState = {
    user: null,
    firebaseUser: null,
    isAuthenticated: false,
    loading: false,
    refreshProfile: mockRefreshProfile,
  };
  acceptState = { mutateAsync: mockAccept, isPending: false, isSuccess: false };
  mockPrepareAccount.mockResolvedValue({ username: 'ana.multi-2', email: 'ana.multi-2@invite.local' });
  mockRegister.mockResolvedValue(undefined);
  mockAccept.mockImplementation(async () => {
    acceptState.isSuccess = true;
    authState.isAuthenticated = true;
  });
});

describe('InviteClient', () => {
  it('muestra y permite copiar el username exacto solo después de aceptar el alta local', async () => {
    const user = userEvent.setup();
    const view = render(<InviteClient token="invite-1" businessName="Acme" />);

    expect(screen.queryByText('ana.multi-2')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Tu nombre'), 'Ana Multi');
    await user.type(screen.getByLabelText('Contraseña'), 'secret1');
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'secret1');
    await user.click(screen.getByRole('button', { name: /Unirme al equipo/i }));

    await waitFor(() => expect(mockAccept).toHaveBeenCalledWith({ token: 'invite-1', username: 'ana.multi-2' }));
    view.rerender(<InviteClient token="invite-1" businessName="Acme" />);

    expect(screen.getByText('Cuenta creada correctamente')).toBeInTheDocument();
    expect(screen.getByText('ana.multi-2')).toBeInTheDocument();
    expect(screen.getByText(/próxima vez ingresá con este usuario y tu contraseña/i)).toBeInTheDocument();

    const copySpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    await user.click(screen.getByRole('button', { name: /Copiar usuario/i }));
    expect(copySpy).toHaveBeenCalledWith('ana.multi-2');
  });

  it('indica a una cuenta Google aceptada cómo volver a entrar', async () => {
    authState = {
      ...authState,
      user: { email: 'ana@example.com' },
      firebaseUser: { email: 'ana@example.com', providerData: [{ providerId: 'google.com' }] },
      isAuthenticated: true,
    };
    acceptState = { mutateAsync: mockAccept, isPending: false, isSuccess: true };

    render(<InviteClient token="invite-1" businessName="Acme" />);

    expect(screen.getByText(/volver a entrar, usá Continuar con Google/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Copiar usuario/i })).not.toBeInTheDocument();
  });
});
