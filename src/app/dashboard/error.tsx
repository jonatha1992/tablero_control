'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[dashboard-error]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center px-4">
      <p className="text-lg font-semibold">Algo salió mal</p>
      <p className="text-sm text-muted-foreground max-w-sm">
        Ocurrió un error inesperado. Podés intentar recargar o volver al inicio.
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => reset()}>
          Intentar de nuevo
        </Button>
        <Button variant="ghost" onClick={() => { window.location.href = '/dashboard'; }}>
          Ir al inicio
        </Button>
      </div>
    </div>
  );
}
