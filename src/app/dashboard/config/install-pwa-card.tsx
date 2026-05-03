'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPwaCard() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

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
          <p>
            Puedes instalar esta aplicación web en tu computadora o teléfono. Al instalarla, podrás:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Acceder directamente desde un ícono en el escritorio o la pantalla de inicio.</li>
            <li>Usar la aplicación a pantalla completa, sin la barra del navegador.</li>
            <li>Mejorar el rendimiento y tener acceso rápido.</li>
          </ul>
          
          {/* Instrucciones para iOS */}
          <div className="bg-muted/50 p-3 rounded-md border mt-4">
            <h4 className="font-medium text-foreground flex items-center gap-2 mb-1.5">
              <Smartphone className="h-4 w-4 text-muted-foreground" /> Usuarios de iOS (iPhone/iPad)
            </h4>
            <p className="text-xs leading-relaxed">
              En Safari, toca el botón de <strong>Compartir</strong> (el ícono del cuadrado con la flecha hacia arriba) y luego selecciona <strong>"Agregar a Inicio"</strong>.
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
            onClick={handleInstallClick} 
            disabled={!isInstallable}
            className="w-full sm:w-auto"
          >
            {isInstallable ? 'Instalar ahora' : 'La instalación directa no está disponible'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
