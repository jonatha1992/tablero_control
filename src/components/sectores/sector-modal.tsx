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
import { MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';


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

  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();

  useEffect(() => {
    if (location) {
      setName(location.name);
      setDescription(location.description || '');
      setType(location.type);
    } else {
      setName('');
      setDescription('');
      setType('department');
    }
  }, [location, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !businessId) {
      if (!businessId) {
        toast.error('Error de sesión', {
          description: 'No se pudo identificar tu negocio. Por favor, recargá la página.',
        });
        console.error('[SectorModal] No se puede crear/editar: businessId ausente');
      }
      return;
    }

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      type,
      businessId,
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {location ? 'Editar Sector/Departamento' : 'Nuevo Sector/Departamento'}
          </DialogTitle>
          <DialogDescription>
            {location ? 'Modificá la información del sector seleccionado.' : 'Completá los datos para crear un nuevo sector en tu negocio.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
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
