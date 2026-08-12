import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Sidebar } from '@/components/layout/sidebar';
import { prefetchDashboardRoute } from '@/lib/prefetch-dashboard';
import LegacySectoresPage from '@/app/dashboard/equipo/sectores/page';

const auth = vi.hoisted(() => ({
  role: 'admin',
  isAdmin: true,
}));
const redirect = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/sectores',
  redirect,
}));
vi.mock('next/image', () => ({ default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} /> }));
vi.mock('@/hooks/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'user-1', businessId: 'business-1', role: auth.role },
    isSuperAdmin: false,
    isAdmin: auth.isAdmin,
  }),
}));
vi.mock('@/hooks/use-space-labels', () => ({
  useSpaceLabels: () => ({ site: 'Sucursal', sites: 'Sucursales' }),
}));
vi.mock('@/lib/permissions', () => ({ can: () => true }));

function renderSidebar() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <Sidebar collapsed={false} onCollapse={vi.fn()} />
    </QueryClientProvider>,
  );
}

describe('Sedes como módulo central', () => {
  beforeEach(() => {
    auth.role = 'admin';
    auth.isAdmin = true;
  });

  it('muestra la etiqueta configurable como fila principal entre Planificación y Equipo', () => {
    renderSidebar();

    const planning = screen.getByRole('link', { name: 'Planificación' });
    const sites = screen.getByRole('link', { name: 'Sucursales' });
    const team = screen.getByRole('link', { name: 'Equipo' });

    expect(sites).toHaveAttribute('href', '/dashboard/sectores');
    expect(planning.compareDocumentPosition(sites) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(sites.compareDocumentPosition(team) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Sucursales', hidden: true })).toBe(sites);
  });

  it('oculta la fila a roles que no son admin ni superadmin', () => {
    auth.role = 'responsable';
    auth.isAdmin = false;
    renderSidebar();

    expect(screen.queryByRole('link', { name: 'Sucursales' })).not.toBeInTheDocument();
  });

  it('precarga las sedes desde la ruta canónica', () => {
    const prefetchQuery = vi.fn();

    prefetchDashboardRoute(
      { prefetchQuery } as unknown as QueryClient,
      '/dashboard/sectores',
      { businessId: 'business-1', userId: 'user-1' },
    );

    expect(prefetchQuery).toHaveBeenCalledTimes(1);
    expect(prefetchQuery.mock.calls[0]?.[0].queryKey).toEqual(['locations', 'business-1']);
  });

  it('redirige la ruta anterior hacia la ruta canónica', () => {
    LegacySectoresPage();

    expect(redirect).toHaveBeenCalledWith('/dashboard/sectores');
  });
});
