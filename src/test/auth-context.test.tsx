import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/hooks/auth-context';

// Mock onAuthStateChanged to simulate auth state
const mockOnAuthStateChanged = vi.fn();

vi.mock('firebase/auth', async () => {
  const actual = await vi.importActual('firebase/auth');
  return {
    ...actual,
    onAuthStateChanged: (auth: any, callback: (user: any) => void) => {
      mockOnAuthStateChanged.mockImplementation(callback);
      callback(null); // Start with no user
      return () => {};
    },
  };
});

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    getDoc: vi.fn(() => ({
      exists: () => false,
    })),
  };
});

// Test component that uses auth context
function AuthConsumer() {
  const { isAuthenticated, loading, user, signOut, role, isAdmin, isManager } = useAuth();

  return (
    <div>
      <p data-testid="loading">{loading ? 'loading' : 'ready'}</p>
      <p data-testid="authenticated">{isAuthenticated ? 'yes' : 'no'}</p>
      <p data-testid="user-name">{user?.name || 'none'}</p>
      <p data-testid="role">{role || 'none'}</p>
      <p data-testid="is-admin">{isAdmin ? 'yes' : 'no'}</p>
      <p data-testid="is-manager">{isManager ? 'yes' : 'no'}</p>
      <button onClick={signOut} data-testid="signout">Sign Out</button>
    </div>
  );
}

describe('Auth Context', () => {
  beforeEach(() => {
    mockOnAuthStateChanged.mockClear();
  });

  it('provides initial unauthenticated state', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
      expect(screen.getByTestId('user-name')).toHaveTextContent('none');
    });
  });

  it('throws error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleError = console.error;
    console.error = vi.fn();

    expect(() => render(<AuthConsumer />)).toThrow(
      'useAuth must be used within an AuthProvider'
    );

    console.error = consoleError;
  });
});
