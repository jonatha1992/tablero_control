import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { Sidebar } from '@/components/layout/sidebar';

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
  useSpaceLabels: () => ({ site: 'Sede', sites: 'Sedes', objective: 'Objetivo', objectives: 'Objetivos' }),
}));
vi.mock('@/lib/permissions', () => ({ can: () => true }));

function renderSidebar() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <Sidebar collapsed={false} onCollapse={vi.fn()} />
    </QueryClientProvider>,
  );
}

describe('Sidebar — Proyectos', () => {
  it('siempre muestra Proyectos junto al Kanban', () => {
    renderSidebar();

    expect(screen.getByRole('link', { name: 'Kanban' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Proyectos' })).toHaveAttribute(
      'href',
      '/dashboard/tareas/tableros',
    );
  });
});
