import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Sidebar } from '@/components/layout/sidebar';
import type { Project } from '@/lib/api/projects';

const projects = vi.hoisted(() => ({ list: [] as Project[] }));

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/tareas',
}));
vi.mock('next/image', () => ({ default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} /> }));
vi.mock('@/hooks/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'user-1', businessId: 'business-1', role: 'admin' },
    isSuperAdmin: false,
    isAdmin: true,
  }),
}));
vi.mock('@/hooks/use-space-labels', () => ({
  useSpaceLabels: () => ({ site: 'Sede', sites: 'Sedes' }),
}));
vi.mock('@/lib/permissions', () => ({ can: () => true }));
vi.mock('@/hooks/queries/use-projects-query', () => ({
  useProjectsQuery: () => ({ data: projects.list, isLoading: false, isError: false }),
}));

function renderSidebar() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <Sidebar collapsed={false} onCollapse={vi.fn()} />
    </QueryClientProvider>,
  );
}

function board(id: string, status: string): Project {
  return {
    id,
    name: id,
    description: null,
    teamId: null,
    businessId: 'business-1',
    status,
    startDate: null,
    endDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('Sidebar — Tableros', () => {
  beforeEach(() => {
    projects.list = [];
  });

  it('oculta Tableros si hay un solo tablero activo', () => {
    projects.list = [board('principal', 'active')];
    renderSidebar();

    expect(screen.getByRole('link', { name: 'Kanban' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Tableros' })).not.toBeInTheDocument();
  });

  it('muestra Tableros si hay más de un tablero activo', () => {
    projects.list = [board('principal', 'active'), board('ventas', 'active')];
    renderSidebar();

    expect(screen.getByRole('link', { name: 'Tableros' })).toHaveAttribute(
      'href',
      '/dashboard/tareas/tableros',
    );
  });

  it('muestra Tableros si hay alguno archivado', () => {
    projects.list = [board('principal', 'active'), board('viejo', 'archived')];
    renderSidebar();

    expect(screen.getByRole('link', { name: 'Tableros' })).toBeInTheDocument();
  });
});
