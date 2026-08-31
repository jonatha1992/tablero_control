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
  useSpaceLabels: () => ({ site: 'Sede', sites: 'Sedes' }),
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

describe('Sidebar — Eventos top-level', () => {
  beforeEach(() => {
    nav.pathname = '/dashboard';
  });

  it('muestra Eventos como ítem principal entre Tareas y Calendario', () => {
    renderSidebar();

    const tasks = screen.getByRole('link', { name: 'Tareas' });
    const events = screen.getByRole('link', { name: 'Eventos' });
    const calendar = screen.getByRole('link', { name: 'Calendario' });

    expect(events).toHaveAttribute('href', '/dashboard/eventos');
    expect(tasks.compareDocumentPosition(events) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(events.compareDocumentPosition(calendar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('no anida Eventos bajo Planificación', () => {
    nav.pathname = '/dashboard/planificacion';
    renderSidebar();

    expect(screen.getByRole('link', { name: 'Períodos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Objetivos' })).toBeInTheDocument();

    const planning = screen.getByRole('link', { name: 'Planificación' });
    const events = screen.getByRole('link', { name: 'Eventos' });
    expect(events).toHaveAttribute('href', '/dashboard/eventos');
    expect(events.compareDocumentPosition(planning) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
