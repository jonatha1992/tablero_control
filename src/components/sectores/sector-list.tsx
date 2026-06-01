'use client';

import { MapPin, Edit2, Trash2, MoreVertical, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Location } from '@/types/domain/location';
import { useMembersQuery } from '@/hooks/queries/use-members-query';
import { useSpaceLabels } from '@/hooks/use-space-labels';
import { formatLocationTypeLabel } from '@/lib/location-types';
import { SECTOR_ICONS } from './sector-modal';
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
  onSelect: (sector: Location) => void;
  onCreate?: () => void;
  isLoading: boolean;
}

export function SectorList({ sectors, onEdit, onDelete, onSelect, onCreate, isLoading }: Props) {
  const { data: allMembers = [] } = useMembersQuery();
  const labels = useSpaceLabels();
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
        <h3 className="text-lg font-medium">Aún no hay {labels.sites.toLowerCase()}</h3>
        <p className="max-w-xs text-sm text-muted-foreground mb-4">
          Agregá {labels.sites.toLowerCase()} para organizar mejor el trabajo de tu equipo.
        </p>
        {onCreate && (
          <Button onClick={onCreate}>
            <MapPin className="mr-2 h-4 w-4" />
            Agregar {labels.site.toLowerCase()}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sectors.map((sector) => {
        const memberCount = allMembers.filter((m) => m.locationId === sector.id).length;
        return (
          <Card
            key={sector.id}
            className="overflow-hidden border-border/50 bg-card/50 transition-all hover:border-primary/30 hover:bg-card cursor-pointer"
            onClick={() => onSelect(sector)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {(() => {
                      const iconName = sector.metadata?.icon as string | undefined;
                      const entry = SECTOR_ICONS.find((i) => i.name === iconName);
                      const Icon = entry?.icon ?? MapPin;
                      return <Icon className="h-5 w-5" />;
                    })()}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold leading-none">{sector.name}</h3>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                      {formatLocationTypeLabel(sector.type)}
                    </Badge>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(sector); }}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => { e.stopPropagation(); onDelete(sector.id); }}
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
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {memberCount} miembro{memberCount !== 1 ? 's' : ''}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
