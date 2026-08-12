import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateInviteModal } from '@/components/equipo/create-invite-modal';

const mockMutate = vi.fn();

vi.mock('@/hooks/mutations/use-create-invite', () => ({
  useCreateInvite: () => ({ mutate: mockMutate, isPending: false, data: undefined }),
}));
vi.mock('@/hooks/queries/use-locations-query', () => ({
  useLocationsQuery: () => ({ data: [] }),
}));

beforeEach(() => vi.clearAllMocks());

describe('CreateInviteModal', () => {
  it('invita por correo sin pedir ni enviar nombre', async () => {
    const user = userEvent.setup();
    render(<CreateInviteModal open onClose={vi.fn()} businessId="biz-1" />);

    await user.click(screen.getByRole('button', { name: /Por correo/i }));
    expect(screen.queryByText(/Nombre \(opcional\)/i)).not.toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('juan@empresa.com'), 'ana@test.com');
    await user.click(screen.getByRole('button', { name: /Enviar invitación/i }));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ businessId: 'biz-1', email: 'ana@test.com', maxUses: 1 }),
      expect.any(Object)
    );
    expect(mockMutate.mock.calls[0][0]).not.toHaveProperty('inviteeName');
  });
});
