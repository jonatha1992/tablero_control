'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/auth-context';
import { Button } from '@/components/ui/button';
import { Clock, LogOut, RefreshCw, Loader2 } from 'lucide-react';

export default function PendingPage() {
  const { user, role, isAuthenticated, loading, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
    if (!loading && role && role !== 'pending') {
      router.push('/dashboard');
    }
  }, [loading, isAuthenticated, role, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || role !== 'pending') {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-lg text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/30">
          <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Esperando asignación</h1>
          <p className="text-muted-foreground">
            Tu cuenta fue creada exitosamente, pero todavía no tenés un rol asignado.
          </p>
        </div>

        <div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-2">
          <p>
            <span className="text-muted-foreground">Correo:</span>{' '}
            <span className="font-medium">{user?.email}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Negocio:</span>{' '}
            <span className="font-medium">{user?.businessId ? 'Registrado' : '—'}</span>
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Contactá al administrador de tu equipo para que te asigne un rol y puedas empezar a usar el sistema.
          </p>
          <Button
            className="w-full gap-2"
            disabled={checking}
            onClick={async () => {
              setChecking(true);
              await refreshProfile();
              setChecking(false);
            }}
          >
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Verificar estado
          </Button>
          <Button variant="outline" className="w-full gap-2" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  );
}
