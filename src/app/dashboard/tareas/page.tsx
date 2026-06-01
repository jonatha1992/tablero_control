'use client';

import { useMemo, useState } from 'react';
import { KanbanBoard } from '@/components/tareas/kanban-board';
import { useTasksQuery } from '@/hooks/queries/use-tasks-query';
import { useProjectsQuery } from '@/hooks/queries/use-projects-query';
import { useCyclesQuery } from '@/hooks/queries/use-cycles-query';
import { useAuth } from '@/hooks/auth-context';
import { useBusinessQuery } from '@/hooks/queries/use-business-query';
import { hasMultipleBoards } from '@/lib/business-defaults';
import { useScrumUIStore } from '@/stores/scrum-ui.store';
import type { TaskFilters } from '@/types';
import { ChevronDown, FolderKanban, Timer } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export default function TareasPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const { user } = useAuth();
  const businessId = user?.businessId ?? '';
  const { data: business } = useBusinessQuery(businessId);
  const showBoardPicker = hasMultipleBoards(business?.settings);
  const { data: projects = [] } = useProjectsQuery(businessId);
  const { data: cycles = [] } = useCyclesQuery(businessId);
  const { selectedSprintId, viewMode: sprintMode, setSelectedSprint, setViewMode: setSprintMode } = useScrumUIStore();

  const activeCycle = cycles.find((c) => c.status === 'active');
  const otherCycles = cycles.filter((c) => c.status !== 'active');

  const taskFilters = useMemo((): TaskFilters | undefined => {
    const f: TaskFilters = {};
    if (selectedProjectId) f.projectId = [selectedProjectId];
    if (sprintMode === 'backlog') f.noCycle = true;
    else if (sprintMode === 'board' && selectedSprintId) f.cycleId = [selectedSprintId];
    return Object.keys(f).length > 0 ? f : undefined;
  }, [selectedProjectId, sprintMode, selectedSprintId]);

  const { data: tasks = [], isLoading, isError, error } = useTasksQuery(taskFilters);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-muted-foreground">Cargando tareas…</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-destructive">{(error as Error)?.message ?? 'Error al cargar las tareas'}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-hidden flex flex-col">

      {/* Selector de tablero — solo con múltiples tableros habilitados */}
      {showBoardPicker && projects.length > 0 && (
        <div className="shrink-0 flex items-center gap-3 px-4 py-2 border-b">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-2 h-9 px-3 text-sm border border-input rounded-md hover:bg-accent bg-background max-w-[220px]">
                <FolderKanban className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">
                  {selectedProjectId
                    ? projects.find((p) => p.id === selectedProjectId)?.name ?? 'Tablero'
                    : 'Todas las tareas'}
                </span>
                <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-w-[260px]">
              <DropdownMenuItem onClick={() => setSelectedProjectId('')}>
                <span className={cn('flex-1', !selectedProjectId && 'font-medium')}>Todas las tareas</span>
              </DropdownMenuItem>
              {projects.map((project) => (
                <DropdownMenuItem key={project.id} onClick={() => setSelectedProjectId(project.id)}>
                  <span className={cn('flex-1 truncate', selectedProjectId === project.id && 'font-medium')}>
                    {project.name}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2 shrink-0">{project._count?.tasks ?? 0}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Sprint tabs */}
      <div className="shrink-0 flex items-center gap-1 px-4 py-1.5 border-b bg-muted/20">
        <Timer className="h-3.5 w-3.5 text-muted-foreground mr-1 shrink-0" />

        <button
          onClick={() => { setSprintMode('board'); setSelectedSprint(null); }}
          className={cn(
            'inline-flex items-center h-7 px-3 text-xs rounded-md transition-colors',
            sprintMode === 'board' && !selectedSprintId
              ? 'bg-primary text-primary-foreground font-medium'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          Todas
        </button>

        <button
          onClick={() => { setSprintMode('backlog'); setSelectedSprint(null); }}
          className={cn(
            'inline-flex items-center h-7 px-3 text-xs rounded-md transition-colors',
            sprintMode === 'backlog'
              ? 'bg-primary text-primary-foreground font-medium'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          Backlog
        </button>

        {activeCycle && (
          <button
            onClick={() => { setSprintMode('board'); setSelectedSprint(activeCycle.id); }}
            className={cn(
              'inline-flex items-center gap-1.5 h-7 px-3 text-xs rounded-md transition-colors',
              sprintMode === 'board' && selectedSprintId === activeCycle.id
                ? 'bg-primary text-primary-foreground font-medium'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
            {activeCycle.name}
          </button>
        )}

        {otherCycles.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'inline-flex items-center gap-1 h-7 px-2 text-xs rounded-md transition-colors',
                  sprintMode === 'board' && selectedSprintId && selectedSprintId !== activeCycle?.id
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                {sprintMode === 'board' && selectedSprintId && selectedSprintId !== activeCycle?.id
                  ? (otherCycles.find((c) => c.id === selectedSprintId)?.name ?? 'Período')
                  : 'Otros'}
                <ChevronDown className="h-3 w-3 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-w-[220px]">
              {otherCycles.map((cycle) => (
                <DropdownMenuItem
                  key={cycle.id}
                  onClick={() => { setSprintMode('board'); setSelectedSprint(cycle.id); }}
                >
                  <span className={cn('flex-1 truncate', selectedSprintId === cycle.id && 'font-medium')}>
                    {cycle.name}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2 capitalize shrink-0">{cycle.status}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Kanban board — handles its own modals internally */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <KanbanBoard tasks={tasks} />
      </div>
    </div>
  );
}
