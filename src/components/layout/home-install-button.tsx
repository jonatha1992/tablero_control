'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { usePwaInstall } from '@/hooks/use-pwa-install';

/**
 * Botón Instalar en el home público.
 * Visible siempre que la app no esté en modo standalone.
 * Con beforeinstallprompt → prompt nativo; si no → tip corto (iOS / otro browser).
 */
export function HomeInstallButton() {
  const { canInstall, isInstalled, install } = usePwaInstall();
  const [showTip, setShowTip] = useState(false);

  if (isInstalled) return null;

  const handleClick = () => {
    if (canInstall) {
      void install();
      return;
    }
    setShowTip((open) => !open);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        title="Instalar aplicación"
        className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 sm:px-4 text-sm font-medium hover:bg-accent whitespace-nowrap"
      >
        <Download className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">Instalar</span>
      </button>
      {showTip && (
        <div
          role="status"
          className="absolute right-0 top-full z-30 mt-2 w-64 rounded-md border bg-card p-3 text-xs text-muted-foreground shadow-md"
        >
          <p className="font-medium text-foreground mb-1">Cómo instalar</p>
          <p className="mb-2">
            En <strong>Chrome/Edge</strong> el navegador ofrece instalar cuando la app está lista.
          </p>
          <p>
            En <strong>iPhone/iPad</strong>: Safari → Compartir → Agregar a Inicio.
          </p>
          <button
            type="button"
            className="mt-2 text-foreground underline"
            onClick={() => setShowTip(false)}
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}
