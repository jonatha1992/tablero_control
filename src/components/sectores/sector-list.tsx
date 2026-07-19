'use client';

import { useMemo } from 'react';
import { Archive, Edit2, Eye, MapPin, MoreVertical, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Location } from '@/types/domain/location';
import { useMembersQuery } from '@/hooks/queries/use-members-query';
import { useTasksQuery } from '@/hooks/queries/use-tasks-query';
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

const STATUS_META: Record<Location['status'], { label: string; className: string; dotClassName: string }> = {
  active: {
    label: 'Activo',
    className: 'text-green-600',
    dotClassName: 'bg-green-600',
  },
  inactive: {
    label: 'Inactivo',
    className: 'text-muted-foreground',
    dotClassName: 'bg-muted-foreground',
  },
  maintenance: {
    label: 'Mantenimiento',
    className: 'text-amber-600',
    dotClassName: 'bg-amber-600',
  },
  closed: {
    label: 'Archivado',
    className: 'text-amber-600',
    dotClassName: 'bg-amber-600',
  },
  incident: {
    label: 'Incidente',
    className: 'text-red-600',
    dotClassName: 'bg-red-600',
  },
};

export function SectorList({ sectors, onEdit, onDelete, onSelect, onCreate, isLoading }: Props) {
  const { data: allMembers = [] } = useMembersQuery();
  const { data: tasks = [], isLoading: tasksLoading } = useTasksQuery();
  const labels = useSpaceLabels();

  const memberCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const member of allMembers) {
      if (member.locationAssignments?.length) {
        for (const assignment of member.locationAssignments) {
          counts.set(assignment.locationId, (counts.get(assignment.locationId) ?? 0) + 1);
        }
        continue;
      }

      if (!member.locationId) continue;
      counts.set(member.locationId, (counts.get(member.locationId) ?? 0) + 1);
    }
    return counts;
  }, [allMembers]);

  const taskCounts = useMemo(() => {
    const counts = new Map<string, { total: number; completed: number }>();
    for (const task of tasks) {
      if (!task.locationId) continue;
      const current = counts.get(task.locationId) ?? { total: 0, completed: 0 };
      current.total += 1;
      if (task.status === 'done' || task.status === 'archived') {
        current.completed += 1;
      }
      counts.set(task.locationId, current);
    }
    return counts;
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card border-b">
              <tr>
                {['Nombre', 'Tipo', 'Estado', 'Miembros', 'Tareas', 'Finalizadas', 'Acciones'].map((column) => (
                  <th
                    key={column}
                    className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: 7 }).map((_, index) => (
                    <td key={index} className="px-4 py-3">
                      <div className="h-5 rounded bg-muted/40 animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
    <div className="rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Listado de {labels.sites.toLowerCase()} con miembros y tareas asociadas.
          </caption>
          <thead className="sticky top-0 z-10 bg-card border-b">
            <tr>
              {['Nombre', 'Tipo', 'Estado', 'Miembros', 'Tareas', 'Finalizadas', 'Acciones'].map((column) => (
                <th
                  key={column}
                  className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sectors.map((sector) => {
              const memberCount = memberCounts.get(sector.id) ?? 0;
              const counts = taskCounts.get(sector.id) ?? { total: 0, completed: 0 };
              const statusMeta = STATUS_META[sector.status];
              const iconName = sector.metadata?.icon as string | undefined;
              const entry = SECTOR_ICONS.find((icon) => icon.name === iconName);
              const Icon = entry?.icon ?? MapPin;

              return (
                <tr
                  key={sector.id}
                  className="cursor-pointer border-b transition-colors hover:bg-muted/30"
                  onClick={() => onSelect(sector)}
                >
                  <td className="px-4 py-3">
                    <div className="flex min-w-[240px] items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{sector.name}</p>
                        {sector.description ? (
                          <p className="truncate text-xs text-muted-foreground">{sector.description}</p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                      {formatLocationTypeLabel(sector.type)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${statusMeta.className}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClassName}`} />
                      {statusMeta.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {memberCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {tasksLoading ? <span className="text-muted-foreground">...</span> : counts.total}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {tasksLoading ? <span className="text-muted-foreground">...</span> : counts.completed}
                  </td>
                  <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onSelect(sector)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(sector)}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-amber-700 focus:text-amber-700"
                          onClick={() => onDelete(sector.id)}
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          Archivar o eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
