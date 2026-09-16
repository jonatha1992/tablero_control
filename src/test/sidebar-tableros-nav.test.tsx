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
  it('muestra Proyectos como ítem principal, antes de Tareas', () => {
    renderSidebar();

    const projects = screen.getByRole('link', { name: 'Proyectos' });
    const tasks = screen.getByRole('link', { name: 'Tareas' });

    expect(projects).toHaveAttribute('href', '/dashboard/tareas/tableros');
    expect(projects.compareDocumentPosition(tasks) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Kanban' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Roadmap' })).toBeInTheDocument();
  });
});
