'use client';

import { ChevronDown, Flag, MapPin, Target, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { PRIORITY_OPTIONS } from '@/lib/constants/task-colors';
import { priorityIconClass, SEMANTIC_ICON } from '@/lib/constants/ui-icon-colors';
import { SECTOR_ICONS } from '@/components/sectores/sector-modal';
import { useMembersQuery } from '@/hooks/queries/use-members-query';
import { useLocationsQuery } from '@/hooks/queries/use-locations-query';
import { useObjectivesQuery } from '@/hooks/queries/use-objectives-query';
import { useAuth } from '@/hooks/auth-context';
import type { TaskFilterState } from '@/types/ui/task-filters.ui';
import { hasActiveFilters } from '@/types/ui/task-filters.ui';

interface TaskFilterBarProps {
  filters: TaskFilterState;
  onChange: (patch: Partial<TaskFilterState>) => void;
  onClear: () => void;
  /** Shows the "Ocultar finalizadas" toggle (used by the Calendar view). */
  showExcludeDoneToggle?: boolean;
}

export function TaskFilterBar({ filters, onChange, onClear, showExcludeDoneToggle = false }: TaskFilterBarProps) {
  const { user } = useAuth();
  const { data: members = [] } = useMembersQuery();
  const { data: locations = [] } = useLocationsQuery();
  const { data: objectives = [] } = useObjectivesQuery(user?.businessId ?? '');

  const toggleAssignee = (memberId: string) => {
    const next = filters.assigneeIds.includes(memberId)
      ? filters.assigneeIds.filter((id) => id !== memberId)
      : [...filters.assigneeIds, memberId];
    onChange({ assigneeIds: next });
  };

  const excludesDone = filters.excludeStatuses.includes('done');
  const toggleExcludeDone = () => {
    onChange({
      excludeStatuses: excludesDone
        ? filters.excludeStatuses.filter((s) => s !== 'done')
        : [...filters.excludeStatuses, 'done'],
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Assignee filter (multi-select) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex items-center gap-2 h-9 px-3 text-sm border border-input rounded-md hover:bg-accent bg-background max-w-[200px]">
            <Users className={cn('h-3.5 w-3.5 shrink-0', SEMANTIC_ICON.team)} />
            <span className="truncate">
              {filters.assigneeIds.length === 0
                ? 'Todas las personas'
                : filters.assigneeIds.length === 1
                  ? members.find((m) => m.id === filters.assigneeIds[0])?.name ?? '1 persona'
                  : `${filters.assigneeIds.length} personas`}
            </span>
            <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[200px]">
          <DropdownMenuItem onSelect={() => onChange({ assigneeIds: [] })}>
            <span className={cn('flex-1', filters.assigneeIds.length === 0 && 'font-medium')}>Todas las personas</span>
          </DropdownMenuItem>
          {members.map((m) => (
            <DropdownMenuCheckboxItem
              key={m.id}
              checked={filters.assigneeIds.includes(m.id)}
              onCheckedChange={() => toggleAssignee(m.id)}
              onSelect={(e) => e.preventDefault()}
            >
              <span className="truncate">{m.name}</span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Objective filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex items-center gap-2 h-9 px-3 text-sm border border-input rounded-md hover:bg-accent bg-background max-w-[180px]">
            <Target className={cn('h-3.5 w-3.5 shrink-0', SEMANTIC_ICON.objective)} />
            {filters.objectiveId ? (
              <span className="truncate">{objectives.find((o) => o.id === filters.objectiveId)?.name ?? 'Objetivo'}</span>
            ) : (
              <span>Todos los objetivos</span>
            )}
            <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-w-[240px]">
          <DropdownMenuItem onSelect={() => onChange({ objectiveId: '' })}>
            <span className={cn('flex-1', !filters.objectiveId && 'font-medium')}>Todos los objetivos</span>
          </DropdownMenuItem>
          {objectives.map((obj) => (
            <DropdownMenuItem key={obj.id} onSelect={() => onChange({ objectiveId: obj.id })}>
              <span className="h-2 w-2 rounded-full mr-2 shrink-0" style={{ backgroundColor: obj.color }} />
              <span className={cn('flex-1 truncate', filters.objectiveId === obj.id && 'font-medium')}>{obj.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Priority filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex items-center gap-2 h-9 px-3 text-sm border border-input rounded-md hover:bg-accent bg-background">
            {filters.priority ? (
              <>
                <Flag className={cn('h-3.5 w-3.5 shrink-0', priorityIconClass(filters.priority))} />
                <span className={cn('h-2 w-2 rounded-full shrink-0', PRIORITY_OPTIONS.find((p) => p.value === filters.priority)?.dot)} />
                <span>{PRIORITY_OPTIONS.find((p) => p.value === filters.priority)?.label}</span>
              </>
            ) : (
              <>
                <Flag className={cn('h-3.5 w-3.5 shrink-0', SEMANTIC_ICON.priorityDefault)} />
                <span>Todas las prioridades</span>
              </>
            )}
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => onChange({ priority: '' })}>
            <span className={cn('flex-1', !filters.priority && 'font-medium')}>Todas las prioridades</span>
          </DropdownMenuItem>
          {PRIORITY_OPTIONS.map((opt) => (
            <DropdownMenuItem key={opt.value} onSelect={() => onChange({ priority: opt.value })}>
              <span className={cn('h-2 w-2 rounded-full mr-2 shrink-0', opt.dot)} />
              <span className={cn('flex-1', filters.priority === opt.value && 'font-medium')}>{opt.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Location/Sector filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex items-center gap-2 h-9 px-3 text-sm border border-input rounded-md hover:bg-accent bg-background min-w-0 max-w-[200px]">
            {(() => {
              const loc = locations.find((l) => l.id === filters.locationId);
              if (!loc) {
                return (
                  <>
                    <MapPin className={cn('h-3.5 w-3.5 shrink-0', SEMANTIC_ICON.location)} />
                    <span className="truncate">Todos los locales/sectores</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                  </>
                );
              }
              const iconEntry = SECTOR_ICONS.find((i) => i.name === (loc.metadata?.icon as string));
              const Icon = iconEntry?.icon ?? MapPin;
              return (
                <>
                  <Icon className={cn('h-3.5 w-3.5 shrink-0', SEMANTIC_ICON.location)} />
                  <span className="truncate">{loc.name}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                </>
              );
            })()}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[200px]">
          <DropdownMenuItem onSelect={() => onChange({ locationId: '' })}>
            <span className={cn('flex-1', !filters.locationId && 'font-medium')}>Todos los locales/sectores</span>
          </DropdownMenuItem>
          {locations.map((loc) => {
            const iconEntry = SECTOR_ICONS.find((i) => i.name === (loc.metadata?.icon as string));
            const Icon = iconEntry?.icon ?? MapPin;
            return (
              <DropdownMenuItem key={loc.id} onSelect={() => onChange({ locationId: loc.id })}>
                <Icon className={cn('h-4 w-4 mr-2 shrink-0', SEMANTIC_ICON.location)} />
                <span className={cn('flex-1 truncate', filters.locationId === loc.id && 'font-medium')}>{loc.name}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Hide done toggle (Calendar) */}
      {showExcludeDoneToggle && (
        <button
          onClick={toggleExcludeDone}
          className={cn(
            'inline-flex items-center gap-2 h-9 px-3 text-sm border rounded-md',
            excludesDone
              ? 'border-primary/50 bg-primary/10 text-primary hover:bg-primary/15'
              : 'border-input bg-background hover:bg-accent'
          )}
        >
          Ocultar finalizadas
        </button>
      )}

      {/* Clear filters — when the done-toggle is exposed, excluding 'done' is not a "dirty" filter */}
      {hasActiveFilters(
        showExcludeDoneToggle
          ? { ...filters, excludeStatuses: filters.excludeStatuses.filter((s) => s !== 'done') }
          : filters
      ) && (
        <button
          onClick={onClear}
          className="inline-flex items-center gap-1.5 h-9 px-3 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-accent"
        >
          <X className="h-3.5 w-3.5" />
          Limpiar
        </button>
      )}
    </div>
  );
}
