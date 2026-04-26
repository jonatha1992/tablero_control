import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemberCard } from '@/components/equipo/member-card';
import type { User } from '@/types';

vi.mock('@/hooks/mutations/use-update-member', () => ({
  useUpdateMember: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('@/hooks/auth-context', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-1', businessId: 'biz-1', role: 'admin' },
    isSuperAdmin: false,
  })),
}));

vi.mock('@/hooks/queries/use-locations-query', () => ({
  useLocationsQuery: vi.fn(() => ({
    data: [],
  })),
}));

// ─── Fixtures ───────────────────────────────────────────────────────────────

const activeMember: User = {
  id: 'mem-1',
  name: 'Ana García',
  email: 'ana@biz.com',
  role: 'miembro',
  businessId: 'biz-1',
  isActive: true,
  teamIds: [],
  preferences: {},
  createdAt: new Date(),
  updatedAt: new Date(),
} as unknown as User;

const inactiveMember: User = {
  ...activeMember,
  id: 'mem-2',
  name: 'Bob Pérez',
  email: 'bob@biz.com',
  role: 'responsable',
  isActive: false,
} as unknown as User;

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('MemberCard', () => {
  it('muestra el nombre del miembro', () => {
    render(<MemberCard member={activeMember} />);
    expect(screen.getByText('Ana García')).toBeInTheDocument();
  });

  it('muestra el email del miembro', () => {
    render(<MemberCard member={activeMember} />);
    expect(screen.getByText('ana@biz.com')).toBeInTheDocument();
  });

  it('muestra el badge de rol', () => {
    render(<MemberCard member={activeMember} />);
    // ROLE_LABELS['miembro'] debería estar visible
    const roleLabel = screen.getByText(/miembro/i, { exact: false });
    expect(roleLabel).toBeInTheDocument();
  });

  it('indicador verde cuando isActive=true', () => {
    const { container } = render(<MemberCard member={activeMember} />);
    const indicator = container.querySelector('.bg-green-500');
    expect(indicator).toBeInTheDocument();
  });

  it('indicador gris cuando isActive=false', () => {
    const { container } = render(<MemberCard member={inactiveMember} />);
    const indicator = container.querySelector('.bg-gray-300');
    expect(indicator).toBeInTheDocument();
  });

  it('muestra iniciales en AvatarFallback cuando no hay avatar', () => {
    render(<MemberCard member={activeMember} />);
    // getInitials('Ana García') → 'AG'
    expect(screen.getByText('AG')).toBeInTheDocument();
  });

  it('con canManage=false: no hay botones de acción', () => {
    render(<MemberCard member={activeMember} canManage={false} onRemove={vi.fn()} />);
    expect(screen.queryByTitle('Eliminar miembro')).not.toBeInTheDocument();
  });

  it('sin canManage: no hay botones de acción', () => {
    render(<MemberCard member={activeMember} onRemove={vi.fn()} />);
    expect(screen.queryByTitle('Eliminar miembro')).not.toBeInTheDocument();
  });

  it('con canManage=true y onRemove: botón eliminar está en el DOM', () => {
    render(<MemberCard member={activeMember} canManage={true} onRemove={vi.fn()} />);
    // El botón tiene `title="Eliminar miembro"`
    const removeBtn = screen.getByTitle('Eliminar miembro');
    expect(removeBtn).toBeInTheDocument();
  });

  it('con canManage=true: clic en eliminar abre ConfirmDialog', () => {
    render(<MemberCard member={activeMember} canManage={true} onRemove={vi.fn()} />);
    const removeBtn = screen.getByTitle('Eliminar miembro');
    fireEvent.click(removeBtn);
    // El ConfirmDialog con el título del miembro debe aparecer
    expect(screen.getByText(/¿Eliminar a Ana García\?/i)).toBeInTheDocument();
  });

  it('confirmar en ConfirmDialog llama onRemove con el id', () => {
    const onRemove = vi.fn();
    render(<MemberCard member={activeMember} canManage={true} onRemove={onRemove} />);
    fireEvent.click(screen.getByTitle('Eliminar miembro'));
    // Botón confirmar en el diálogo
    const confirmBtn = screen.getByText(/sí, eliminar/i);
    fireEvent.click(confirmBtn);
    expect(onRemove).toHaveBeenCalledWith('mem-1');
  });

  it('sin onRemove prop: botón eliminar no aparece aunque canManage=true', () => {
    render(<MemberCard member={activeMember} canManage={true} />);
    expect(screen.queryByTitle('Eliminar miembro')).not.toBeInTheDocument();
  });
});
