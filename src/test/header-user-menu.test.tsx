import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { HeaderUserMenu } from '@/components/layout/header-user-menu';

describe('HeaderUserMenu', () => {
  it('agrupa Configuración, Ayuda y Cerrar sesión bajo el usuario', async () => {
    const user = userEvent.setup();
    render(<HeaderUserMenu displayName="Ana Pérez" initials="AP" avatarColor="#123456" onSignOut={vi.fn()} />);

    expect(screen.queryByRole('link', { name: 'Configuración' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Abrir menú de Ana Pérez' }));

    expect(screen.getByRole('menuitem', { name: 'Configuración' })).toHaveAttribute('href', '/dashboard/config');
    expect(screen.getByRole('menuitem', { name: 'Ayuda' })).toHaveAttribute('href', '/dashboard/ayuda');
    expect(screen.getByRole('menuitem', { name: 'Cerrar sesión' })).toBeInTheDocument();
  });

  it('muestra Facturación en el menú solo a quienes pueden administrarla', async () => {
    const user = userEvent.setup();
    render(<HeaderUserMenu displayName="Ana Pérez" initials="AP" avatarColor="#123456" canManageBilling onSignOut={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Abrir menú de Ana Pérez' }));

    expect(screen.getByRole('menuitem', { name: 'Facturación' })).toHaveAttribute('href', '/dashboard/billing');
  });
});
