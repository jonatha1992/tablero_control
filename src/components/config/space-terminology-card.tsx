'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Building2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { auth } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/auth-context';
import { useBusinessQuery } from '@/hooks/queries/use-business-query';
import {
  DEFAULT_LABELS,
  LOCATION_PRESET_OPTIONS,
  resolveSpaceLabels,
} from '@/lib/terminology';
import type { LocationLabelPreset, SpaceTerminology } from '@/types/domain/business';

type SaveState = 'idle' | 'loading' | 'saved' | 'error';

export function SpaceTerminologyCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: business, isLoading } = useBusinessQuery(user?.businessId);

  const [preset, setPreset] = useState<LocationLabelPreset>('sede');
  const [customSingular, setCustomSingular] = useState('');
  const [customPlural, setCustomPlural] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');

  useEffect(() => {
    const t = business?.settings?.terminology;
    setPreset(t?.locationPreset ?? 'sede');
    setCustomSingular(t?.locationSingular ?? '');
    setCustomPlural(t?.locationPlural ?? '');
  }, [business?.settings?.terminology]);

  const preview = resolveSpaceLabels({
    terminology: {
      locationPreset: preset,
      locationSingular: customSingular,
      locationPlural: customPlural,
    },
  });

  async function handleSave() {
    if (!user?.businessId || saveState === 'loading') return;

    const terminology: SpaceTerminology = {
      locationPreset: preset,
      ...(preset === 'custom' && {
        locationSingular: customSingular.trim() || DEFAULT_LABELS.site,
        locationPlural: customPlural.trim() || `${customSingular.trim() || DEFAULT_LABELS.site}s`,
      }),
    };

    setSaveState('loading');
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/business/config', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: {
            ...business?.settings,
            terminology,
          },
        }),
      });

      if (!res.ok) throw new Error('save_failed');

      await queryClient.invalidateQueries({ queryKey: ['business', user.businessId] });
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch {
      setSaveState('error');
    }
  }

  if (isLoading) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Cargando configuración del espacio…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <CardTitle className="text-base font-semibold">Nomenclatura del espacio</CardTitle>
        </div>
        <CardDescription className="text-xs">
          El nivel superior siempre se llama <strong>Espacio</strong>. Acá elegís cómo nombrar las unidades
          internas (sucursales, departamentos, sectores, etc.) en menús, formularios y mensajes.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Vista previa</p>
          <ul className="text-sm space-y-1 text-foreground/90">
            <li>Menú Equipo → <strong>{preview.sites}</strong></li>
            <li>Botón: Agregar {preview.site.toLowerCase()}</li>
            <li>Formulario de tarea: {preview.site} (opcional)</li>
          </ul>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">¿Cómo llamás a tus unidades?</label>
          <div className="grid gap-2 sm:grid-cols-2">
            {LOCATION_PRESET_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPreset(opt.id)}
                className={cn(
                  'rounded-lg border p-3 text-left transition-colors',
                  preset === opt.id
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'hover:bg-accent/50'
                )}
              >
                <p className="text-sm font-medium">{opt.plural}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPreset('custom')}
              className={cn(
                'rounded-lg border p-3 text-left transition-colors sm:col-span-2',
                preset === 'custom'
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'hover:bg-accent/50'
              )}
            >
              <p className="text-sm font-medium">Personalizado</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Definí singular y plural a mano (ej. Casa matriz / Casas matriz).
              </p>
            </button>
          </div>
        </div>

        {preset === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Singular</label>
              <Input
                value={customSingular}
                onChange={(e) => setCustomSingular(e.target.value)}
                placeholder="Ej: Casa matriz"
                maxLength={40}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Plural</label>
              <Input
                value={customPlural}
                onChange={(e) => setCustomPlural(e.target.value)}
                placeholder="Ej: Casas matriz"
                maxLength={40}
              />
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t bg-muted/20 py-3 flex items-center gap-3">
        <Button size="sm" onClick={handleSave} disabled={saveState === 'loading'}>
          {saveState === 'loading' ? 'Guardando…' : 'Guardar nomenclatura'}
        </Button>
        {saveState === 'saved' && (
          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Guardado
          </span>
        )}
        {saveState === 'error' && (
          <span className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5" /> Error al guardar
          </span>
        )}
      </CardFooter>
    </Card>
  );
}
