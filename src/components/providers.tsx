'use client';

import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { AuthProvider } from '@/hooks/auth-context';
import { ThemeProvider } from 'next-themes';
import { ApiError } from '@/lib/api/errors';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({
          onError: (error) => {
            if (error instanceof ApiError && error.status === 403) {
              toast.error('Acción no permitida', {
                description: 'Tu rol en este negocio no tiene permiso para realizar esta acción.',
              });
            }
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            // Cached modules should paint immediately; refetch in background if stale.
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  useEffect(() => {
    const onBusinessSwitched = () => {
      // Drop cached data that may belong to the previous business/tenant.
      // Cancel first so in-flight queries don't resolve into noisy 403s after the switch.
      void queryClient.cancelQueries();
      queryClient.clear();
    };
    window.addEventListener('business:switched', onBusinessSwitched as EventListener);
    return () => window.removeEventListener('business:switched', onBusinessSwitched as EventListener);
  }, [queryClient]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <AuthProvider onSignOut={() => queryClient.clear()}>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
