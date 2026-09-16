import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Sidebar } from '@/components/layout/sidebar';

const nav = vi.hoisted(() => ({ pathname: '/dashboard' }));

vi.mock('next/navigation', () => ({
  usePathname: () => nav.pathname,
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
  useSpaceLabels: () => ({ site: 'Sede', sites: 'Sedes', objective: 'Objetivo', objectives: 'Objetivos' }),
}));
vi.mock('@/lib/permissions', () => ({ can: () => true }));
vi.mock('@/hooks/queries/use-projects-query', () => ({
  useProjectsQuery: () => ({ data: [], isLoading: false, isError: false }),
}));

function renderSidebar() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <Sidebar collapsed={false} onCollapse={vi.fn()} />
    </QueryClientProvider>,
  );
}

describe('Sidebar — Calendario unificado', () => {
  beforeEach(() => {
    nav.pathname = '/dashboard';
  });

  it('no muestra Eventos ni Agenda como ítems propios del menú', () => {
    nav.pathname = '/dashboard/tareas';
    renderSidebar();

    expect(screen.getByRole('link', { name: 'Calendario' })).toHaveAttribute('href', '/dashboard/tareas/calendario');
    expect(screen.queryByRole('link', { name: 'Eventos' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Agenda' })).not.toBeInTheDocument();
  });

  it.each(['/dashboard/eventos', '/dashboard/tareas/agenda', '/dashboard/tareas/calendario'])(
    'marca Calendario como activo en %s',
    (pathname) => {
      nav.pathname = pathname;
      renderSidebar();

      expect(screen.getByRole('link', { name: 'Calendario' })).toHaveClass('bg-primary');
      expect(screen.getByRole('link', { name: 'Tareas' })).not.toHaveClass('bg-primary');
    },
  );

  it('muestra Sprints y la etiqueta configurable de épicas bajo Planificación', () => {
    nav.pathname = '/dashboard/planificacion';
    renderSidebar();

    expect(screen.getByRole('link', { name: 'Sprints' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Objetivos' })).toHaveAttribute('href', '/dashboard/planificacion/objetivos');
  });
});
