'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Archive, Edit2, Eye, ListTodo, MapPin, MoreVertical, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Location } from '@/types/domain/location';
import { useMembersQuery } from '@/hooks/queries/use-members-query';
import { useTasksQuery } from '@/hooks/queries/use-tasks-query';
import { useSpaceLabels } from '@/hooks/use-space-labels';
import { formatLocationTypeLabel } from '@/lib/location-types';
import { isPending } from '@/lib/tasks/task-status';
import { SECTOR_ICONS } from './sector-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Props {
  sectors: Location[];
  onEdit: (sector: Location) => void;
  onArchive: (sector: Location) => void;
  onDelete: (sector: Location) => void;
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

export function SectorList({ sectors, onEdit, onArchive, onDelete, onSelect, onCreate, isLoading }: Props) {
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
    const counts = new Map<string, { total: number; pending: number; completed: number }>();
    for (const task of tasks) {
      if (!task.locationId) continue;
      const current = counts.get(task.locationId) ?? { total: 0, pending: 0, completed: 0 };
      current.total += 1;
      if (isPending(task)) {
        current.pending += 1;
      } else if (task.status === 'done' || task.status === 'archived') {
        current.completed += 1;
      }
      counts.set(task.locationId, current);
    }
    return counts;
  }, [tasks]);

  const TABLE_COLUMNS = [
    'Nombre',
    'Tipo',
    'Estado',
    'Miembros',
    'Tareas',
    'Pendientes',
    'Finalizadas',
    'Acciones',
  ] as const;

  if (isLoading) {
    return (
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card border-b">
              <tr>
                {TABLE_COLUMNS.map((column) => (
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
                  {Array.from({ length: TABLE_COLUMNS.length }).map((_, index) => (
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
        <table className="w-full text-sm" aria-label={`Listado de ${labels.sites.toLowerCase()} con miembros y tareas asociadas`}>
          <thead className="sticky top-0 z-10 bg-card border-b">
            <tr>
              {TABLE_COLUMNS.map((column) => (
                <th
                  key={column}
                  className={cn(
                    'px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground',
                    column === 'Acciones' ? 'text-right' : 'text-left',
                  )}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sectors.map((sector) => {
              const memberCount = memberCounts.get(sector.id) ?? 0;
              const counts = taskCounts.get(sector.id) ?? { total: 0, pending: 0, completed: 0 };
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
                    <Link
                      href={`/dashboard/equipo?locationId=${sector.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-muted hover:text-foreground"
                      title={`Ver miembros de ${sector.name}`}
                    >
                      <Users className="h-3.5 w-3.5" />
                      {memberCount}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {tasksLoading ? <span className="text-muted-foreground">...</span> : counts.total}
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums">
                    {tasksLoading ? (
                      <span className="text-muted-foreground">...</span>
                    ) : (
                      <Link
                        href={`/dashboard/tareas/agenda?locationId=${sector.id}`}
                        onClick={(event) => event.stopPropagation()}
                        className={cn(
                          'inline-flex min-w-[1.5rem] items-center rounded-md px-1.5 py-0.5 hover:bg-muted',
                          counts.pending > 0 ? 'font-medium text-amber-700' : 'text-muted-foreground',
                        )}
                        title={`Ver pendientes de ${sector.name} en Agenda`}
                      >
                        {counts.pending}
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground tabular-nums">
                    {tasksLoading ? (
                      <span className="text-muted-foreground">...</span>
                    ) : (
                      <Link
                        href={`/dashboard/tareas/agenda?locationId=${sector.id}&status=done`}
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex min-w-[1.5rem] items-center rounded-md px-1.5 py-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title={`Ver finalizadas de ${sector.name}`}
                      >
                        {counts.completed}
                      </Link>
                    )}
                  </td>
                  <td className="w-[1%] whitespace-nowrap px-2 py-3" onClick={(event) => event.stopPropagation()}>
                    <div className="flex items-center justify-end gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label={`Editar ${sector.name}`}
                        title="Editar"
                        onClick={() => onEdit(sector)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-amber-700 hover:text-amber-800"
                        aria-label={`Archivar ${sector.name}`}
                        title={sector.status === 'closed' ? 'Ya archivada' : 'Archivar'}
                        disabled={sector.status === 'closed'}
                        onClick={() => onArchive(sector)}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        aria-label={`Eliminar ${sector.name}`}
                        title="Eliminar"
                        onClick={() => onDelete(sector)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`Más acciones de ${sector.name}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onSelect(sector)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalle
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/equipo?locationId=${sector.id}`}>
                              <Users className="mr-2 h-4 w-4" />
                              Gestionar miembros
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/tareas/agenda?locationId=${sector.id}`}>
                              <ListTodo className="mr-2 h-4 w-4" />
                              Ver pendientes (Agenda)
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/tareas/agenda?locationId=${sector.id}&status=done`}>
                              <ListTodo className="mr-2 h-4 w-4" />
                              Ver finalizadas (Agenda)
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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
