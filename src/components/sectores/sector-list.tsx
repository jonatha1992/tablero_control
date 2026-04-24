'use client';

import { MapPin, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Location } from '@/types/domain/location';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Props {
  sectors: Location[];
  onEdit: (sector: Location) => void;
  onDelete: (id: string) => void;
  onCreate?: () => void;
  isLoading: boolean;
}

export function SectorList({ sectors, onEdit, onDelete, onCreate, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-xl border bg-muted/20 animate-pulse" />
        ))}
      </div>
    );
  }

  if (sectors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12 text-center">
        <MapPin className="mb-4 h-12 w-12 text-muted-foreground/30" />
        <h3 className="text-lg font-medium">No hay sectores configurados</h3>
        <p className="max-w-xs text-sm text-muted-foreground mb-4">
          Agregá departamentos o sectores para organizar mejor el trabajo de tu equipo.
        </p>
        {onCreate && (
          <Button onClick={onCreate}>
            <MapPin className="mr-2 h-4 w-4" />
            Agregar Departamento
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sectors.map((sector) => (
        <Card key={sector.id} className="overflow-hidden border-border/50 bg-card/50 transition-all hover:border-primary/30 hover:bg-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold leading-none">{sector.name}</h3>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                    {sector.type}
                  </Badge>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(sector)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(sector.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {sector.description && (
              <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
                {sector.description}
              </p>
            )}

            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <span className="text-xs text-muted-foreground">
                {sector.status === 'active' ? (
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                    Activo
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                    Inactivo
                  </span>
                )}
              </span>
              <span className="text-[10px] text-muted-foreground/60 font-mono">
                {sector.id.slice(0, 8)}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
