'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, RefreshCw } from 'lucide-react';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { forceAppUpdate } from '@/lib/pwa/force-app-update';
import { APP_VERSION, BUILD_DATE } from '@/config/version';

export function InstallPwaCard() {
  const { canInstall, isInstalled, install } = usePwaInstall();
  const [updating, setUpdating] = useState(false);

  const handleForceUpdate = async () => {
    setUpdating(true);
    try {
      await forceAppUpdate();
    } catch {
      setUpdating(false);
    }
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center">
          <Download className="h-4 w-4 mr-2" /> Instalación de la Aplicación
        </CardTitle>
        <CardDescription className="text-xs">
          Instala Tablero de Control en tu dispositivo para acceder como aplicación nativa.
          Versión actual: v{APP_VERSION} · {BUILD_DATE}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-2">
          <p>Al instalarla, podrás:</p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Acceder directamente desde un ícono en el escritorio o pantalla de inicio.</li>
            <li>Usar la aplicación a pantalla completa, sin la barra del navegador.</li>
            <li>Mejorar el rendimiento y tener acceso rápido.</li>
          </ul>

          <div className="bg-muted/50 p-3 rounded-md border mt-4">
            <h4 className="font-medium text-foreground flex items-center gap-2 mb-1.5">
              <Smartphone className="h-4 w-4 text-muted-foreground" /> Usuarios de iOS (iPhone/iPad)
            </h4>
            <p className="text-xs leading-relaxed">
              En Safari, toca el botón de <strong>Compartir</strong> (ícono de cuadrado con flecha hacia arriba) y selecciona <strong>&ldquo;Agregar a Inicio&rdquo;</strong>.
            </p>
          </div>

          <div className="bg-muted/50 p-3 rounded-md border mt-4">
            <h4 className="font-medium text-foreground flex items-center gap-2 mb-1.5">
              <RefreshCw className="h-4 w-4 text-muted-foreground" /> Después de un deploy (Vercel)
            </h4>
            <p className="text-xs leading-relaxed mb-3">
              Si ves una versión vieja (pie del sidebar distinto a <code className="text-[10px]">/version.json</code>),
              usá <strong>Actualizar app</strong>. Limpia el cache del Service Worker y recarga sin shell HTML cacheado.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleForceUpdate}
              disabled={updating}
              className="gap-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${updating ? 'animate-spin' : ''}`} />
              {updating ? 'Actualizando…' : 'Actualizar app (limpiar cache)'}
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/20 py-3">
        {isInstalled ? (
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            ✓ La aplicación ya está instalada
          </p>
        ) : (
          <Button
            size="sm"
            onClick={install}
            disabled={!canInstall}
            className="w-full sm:w-auto"
          >
            {canInstall ? 'Instalar ahora' : 'La instalación directa no está disponible en este navegador'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
