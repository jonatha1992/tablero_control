import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from '@/hooks/protected-route';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/dashboard',
}));

// Mock auth context
const mockUseAuth = vi.fn();
vi.mock('@/hooks/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra loader mientras carga', () => {
    mockUseAuth.mockReturnValue({ loading: true, isAuthenticated: false, role: null });

    render(
      <ProtectedRoute>
        <p>Contenido</p>
      </ProtectedRoute>
    );

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
    expect(screen.queryByText('Contenido')).not.toBeInTheDocument();
  });

  it('redirige a /login cuando no está autenticado', () => {
    mockUseAuth.mockReturnValue({ loading: false, isAuthenticated: false, role: null });

    render(
      <ProtectedRoute>
        <p>Contenido</p>
      </ProtectedRoute>
    );

    expect(mockPush).toHaveBeenCalledWith('/login');
    expect(screen.queryByText('Contenido')).not.toBeInTheDocument();
  });

  it('redirige a una ruta personalizada cuando no está autenticado', () => {
    mockUseAuth.mockReturnValue({ loading: false, isAuthenticated: false, role: null });

    render(
      <ProtectedRoute redirectTo="/auth/login">
        <p>Contenido</p>
      </ProtectedRoute>
    );

    expect(mockPush).toHaveBeenCalledWith('/auth/login');
  });

  it('renderiza children cuando está autenticado sin requiredRole', () => {
    mockUseAuth.mockReturnValue({ loading: false, isAuthenticated: true, role: 'miembro' });

    render(
      <ProtectedRoute>
        <p>Contenido protegido</p>
      </ProtectedRoute>
    );

    expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
  });

  it('renderiza children cuando el rol del usuario cumple el requerido', () => {
    mockUseAuth.mockReturnValue({ loading: false, isAuthenticated: true, role: 'admin' });

    render(
      <ProtectedRoute requiredRole="responsable">
        <p>Solo responsable+</p>
      </ProtectedRoute>
    );

    expect(screen.getByText('Solo responsable+')).toBeInTheDocument();
  });

  it('no renderiza children cuando el rol es insuficiente', () => {
    mockUseAuth.mockReturnValue({ loading: false, isAuthenticated: true, role: 'viewer' });

    render(
      <ProtectedRoute requiredRole="admin">
        <p>Solo admin</p>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Solo admin')).not.toBeInTheDocument();
  });

  it('redirige a / cuando el rol es insuficiente', () => {
    mockUseAuth.mockReturnValue({ loading: false, isAuthenticated: true, role: 'miembro' });

    render(
      <ProtectedRoute requiredRole="admin">
        <p>Solo admin</p>
      </ProtectedRoute>
    );

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('superadmin puede acceder a cualquier ruta protegida', () => {
    mockUseAuth.mockReturnValue({ loading: false, isAuthenticated: true, role: 'superadmin' });

    render(
      <ProtectedRoute requiredRole="admin">
        <p>Solo admin</p>
      </ProtectedRoute>
    );

    expect(screen.getByText('Solo admin')).toBeInTheDocument();
  });
});
