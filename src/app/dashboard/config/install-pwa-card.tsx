'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Smartphone } from 'lucide-react';
import { usePwaInstall } from '@/hooks/use-pwa-install';

export function InstallPwaCard() {
  const { canInstall, isInstalled, install } = usePwaInstall();

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center">
          <Download className="h-4 w-4 mr-2" /> Instalación de la Aplicación
        </CardTitle>
        <CardDescription className="text-xs">
          Instala Tablero de Control en tu dispositivo para acceder como aplicación nativa.
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
