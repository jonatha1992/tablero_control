'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateLocation, useUpdateLocation } from '@/hooks/mutations/use-locations';
import type { Location } from '@/types/domain/location';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useSpaceLabels } from '@/hooks/use-space-labels';
import { useBusinessQuery } from '@/hooks/queries/use-business-query';
import { useLocationsQuery } from '@/hooks/queries/use-locations-query';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/auth-context';
import {
  defaultLocationType,
  normalizeLocationTypeSlug,
  resolveLocationTypeOptions,
} from '@/lib/location-types';
import { persistLocaleType } from '@/lib/persist-locale-type';
import { LocationTypeSelect } from '@/components/sectores/location-type-select';

export const SECTOR_ICONS: { name: string; icon: LucideIcon }[] = [
  { name: 'MapPin',        icon: LucideIcons.MapPin },
  { name: 'Building2',     icon: LucideIcons.Building2 },
  { name: 'Home',          icon: LucideIcons.Home },
  { name: 'Store',         icon: LucideIcons.Store },
  { name: 'Warehouse',     icon: LucideIcons.Warehouse },
  { name: 'Briefcase',     icon: LucideIcons.Briefcase },
  { name: 'Users',         icon: LucideIcons.Users },
  { name: 'Code',          icon: LucideIcons.Code },
  { name: 'Server',        icon: LucideIcons.Server },
  { name: 'Database',      icon: LucideIcons.Database },
  { name: 'Globe',         icon: LucideIcons.Globe },
  { name: 'ShoppingCart',  icon: LucideIcons.ShoppingCart },
  { name: 'Package',       icon: LucideIcons.Package },
  { name: 'Truck',         icon: LucideIcons.Truck },
  { name: 'GraduationCap', icon: LucideIcons.GraduationCap },
  { name: 'BookOpen',      icon: LucideIcons.BookOpen },
  { name: 'Stethoscope',   icon: LucideIcons.Stethoscope },
  { name: 'ChefHat',       icon: LucideIcons.ChefHat },
  { name: 'Coffee',        icon: LucideIcons.Coffee },
  { name: 'Hammer',        icon: LucideIcons.Hammer },
  { name: 'Wrench',        icon: LucideIcons.Wrench },
  { name: 'BarChart2',     icon: LucideIcons.BarChart2 },
  { name: 'DollarSign',    icon: LucideIcons.DollarSign },
  { name: 'Megaphone',     icon: LucideIcons.Megaphone },
  { name: 'Mail',          icon: LucideIcons.Mail },
  { name: 'Scissors',      icon: LucideIcons.Scissors },
  { name: 'Palette',       icon: LucideIcons.Palette },
  { name: 'Car',           icon: LucideIcons.Car },
  { name: 'Music',         icon: LucideIcons.Music },
  { name: 'Dumbbell',      icon: LucideIcons.Dumbbell },
];

interface Props {
  open: boolean;
  onClose: () => void;
  businessId: string;
  location?: Location;
}

export function SectorModal({ open, onClose, businessId, location }: Props) {
  const labels = useSpaceLabels();
  const site = labels.site.toLowerCase();
  const sites = labels.sites.toLowerCase();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const { data: business } = useBusinessQuery(businessId);
  const { data: locations = [] } = useLocationsQuery();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('local');
  const [icon, setIcon] = useState('MapPin');
  const [limitInfo, setLimitInfo] = useState<{ limit: number; current: number } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const typeOptions = useMemo(
    () =>
      resolveLocationTypeOptions(
        business?.settings?.localeTypes,
        [
          ...locations.map((loc) => loc.type),
          ...(location?.type ? [location.type] : []),
        ],
      ),
    [business?.settings?.localeTypes, locations, location?.type],
  );

  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();
  const wasOpenRef = useRef(false);
  const lastLocationIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      return;
    }

    const locationId = location?.id;
    const shouldInitialize = !wasOpenRef.current || locationId !== lastLocationIdRef.current;
    if (!shouldInitialize) return;

    wasOpenRef.current = true;
    lastLocationIdRef.current = locationId;

    const fallbackType = defaultLocationType(typeOptions, business?.settings?.localeTypes);
    if (location) {
      setName(location.name);
      setDescription(location.description || '');
      setType(normalizeLocationTypeSlug(location.type) || fallbackType);
      setIcon((location.metadata?.icon as string) || 'MapPin');
    } else {
      setName('');
      setDescription('');
      setType(fallbackType);
      setIcon('MapPin');
    }
    setLimitInfo(null);
    setErrors({});
  }, [open, location, typeOptions, business?.settings?.localeTypes]);

  async function ensureLocaleTypePersisted(nextType: string) {
    if (!isAdmin) return;
    const slug = normalizeLocationTypeSlug(nextType);
    if (!slug || !businessId) return;
    const configured = (business?.settings?.localeTypes ?? []).map(normalizeLocationTypeSlug);
    if (configured.includes(slug)) return;
    await persistLocaleType(business?.settings, slug);
    await queryClient.invalidateQueries({ queryKey: ['business', businessId] });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    const trimmedName = name.trim();
    const normalizedType = normalizeLocationTypeSlug(type);

    if (!trimmedName) nextErrors.name = 'El nombre es obligatorio';
    if (!normalizedType) nextErrors.type = 'Elegí o ingresá un tipo';
    setErrors(nextErrors);

    if (!trimmedName || !normalizedType || !businessId) {
      if (!businessId) {
        toast.error('Error de sesión', {
          description: 'No se pudo identificar tu espacio. Por favor, recargá la página.',
        });
      }
      return;
    }

    try {
      await ensureLocaleTypePersisted(normalizedType);
    } catch {
      toast.error('No se pudo guardar el tipo nuevo', {
        description: 'Podés reintentar o elegir un tipo de la lista.',
      });
      return;
    }

    const data = {
      name: trimmedName,
      description: description.trim() || undefined,
      type: normalizedType,
      businessId,
      metadata: { icon },
    };

    if (location) {
      updateMutation.mutate(
        { id: location.id, data },
        { onSuccess: onClose }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: onClose,
        onError: (err) => {
          const e = err as Error & { limit?: number; current?: number };
          if (e.message === 'locations_limit_exceeded') {
            setLimitInfo({ limit: e.limit ?? 0, current: e.current ?? 0 });
          }
        },
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const SelectedIcon = SECTOR_ICONS.find((i) => i.name === icon)?.icon ?? LucideIcons.MapPin;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SelectedIcon className="h-5 w-5 text-primary" />
            {location ? `Editar ${site}` : `Nueva ${site}`}
          </DialogTitle>
          <DialogDescription>
            {location
              ? `Modificá la información de la ${site} seleccionada.`
              : `Completá los datos para crear una nueva ${site} en tu espacio.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Ícono</label>
            <div className="grid grid-cols-10 gap-1 rounded-lg border p-2 bg-muted/20 max-h-32 overflow-y-auto">
              {SECTOR_ICONS.map(({ name: iName, icon: Icon }) => (
                <button
                  key={iName}
                  type="button"
                  title={iName}
                  onClick={() => setIcon(iName)}
                  className={cn(
                    'flex items-center justify-center rounded-md p-1.5 transition-colors',
                    icon === iName
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nombre</label>
            <Input
              placeholder="Ej: Departamento de IT, Salón Principal, etc."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
              maxLength={100}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tipo</label>
            <LocationTypeSelect
              value={type}
              options={typeOptions}
              onChange={setType}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Elegí un tipo del espacio o agregá uno nuevo si no está en la lista.
            </p>
            {errors.type && <p className="text-xs text-destructive">{errors.type}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Descripción (opcional)</label>
            <Textarea
              placeholder={`Breve descripción de la ${site}...`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none"
              rows={3}
              disabled={isLoading}
              maxLength={500}
            />
          </div>
          {limitInfo && (
            <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3 space-y-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p className="text-sm font-medium">Límite de {sites} alcanzado</p>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Tu plan permite hasta <strong>{limitInfo.limit}</strong> {sites} y ya tenés <strong>{limitInfo.current}</strong> activas.
                Actualizá tu plan para agregar más.
              </p>
              <Link
                href="/dashboard/billing"
                onClick={onClose}
                className="inline-block text-sm font-medium text-amber-800 dark:text-amber-300 underline underline-offset-2"
              >
                Ver planes disponibles
              </Link>
            </div>
          )}
          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {location ? 'Guardar cambios' : `Crear ${site}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
