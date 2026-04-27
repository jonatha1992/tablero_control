'use client';

import { useState, useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('department');
  const [icon, setIcon] = useState('MapPin');

  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();

  useEffect(() => {
    if (location) {
      setName(location.name);
      setDescription(location.description || '');
      setType(location.type);
      setIcon((location.metadata?.icon as string) || 'MapPin');
    } else {
      setName('');
      setDescription('');
      setType('department');
      setIcon('MapPin');
    }
  }, [location, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !businessId) {
      if (!businessId) {
        toast.error('Error de sesión', {
          description: 'No se pudo identificar tu negocio. Por favor, recargá la página.',
        });
      }
      return;
    }

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      type,
      businessId,
      metadata: { icon },
    };

    if (location) {
      updateMutation.mutate(
        { id: location.id, data },
        { onSuccess: onClose }
      );
    } else {
      createMutation.mutate(data, { onSuccess: onClose });
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
            {location ? 'Editar Sector/Departamento' : 'Nuevo Sector/Departamento'}
          </DialogTitle>
          <DialogDescription>
            {location
              ? 'Modificá la información del sector seleccionado.'
              : 'Completá los datos para crear un nuevo sector en tu negocio.'}
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
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tipo</label>
            <Input
              placeholder="Ej: Oficina, Sector, Departamento"
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Descripción (opcional)</label>
            <Textarea
              placeholder="Breve descripción del sector..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none"
              rows={3}
              disabled={isLoading}
            />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {location ? 'Guardar cambios' : 'Crear sector'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
