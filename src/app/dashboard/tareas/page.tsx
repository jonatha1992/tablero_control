'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { KanbanBoard } from '@/components/tareas/kanban-board';
import { useTasksQuery } from '@/hooks/queries/use-tasks-query';
import { useProjectsQuery } from '@/hooks/queries/use-projects-query';
import { useLocationsQuery } from '@/hooks/queries/use-locations-query';
import { useCyclesQuery } from '@/hooks/queries/use-cycles-query';
import { useAuth } from '@/hooks/auth-context';
import { isArchivedProjectStatus, isTaskFromActiveEntities } from '@/lib/tasks/active-entity';
import { useScrumUIStore } from '@/stores/scrum-ui.store';
import type { TaskFilters } from '@/types';
import { ChevronDown, FolderKanban, Timer, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ProjectMultiPicker } from '@/components/tareas/project-multi-picker';

export default function TareasPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const projectIdFromUrl = searchParams.get('projectId');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(
    () => (projectIdFromUrl ? [projectIdFromUrl] : []),
  );

  useEffect(() => {
    setSelectedProjectIds(projectIdFromUrl ? [projectIdFromUrl] : []);
  }, [projectIdFromUrl]);

  const { user } = useAuth();
  const businessId = user?.businessId ?? '';
  const { data: projects = [], isLoading: isLoadingProjects } = useProjectsQuery(businessId);
  const { data: locations = [], isLoading: isLoadingLocations } = useLocationsQuery();
  const { data: cycles = [] } = useCyclesQuery(businessId);
  const { selectedSprintId, viewMode: sprintMode, setSelectedSprint, setViewMode: setSprintMode } = useScrumUIStore();
  const activeProjects = useMemo(
    () => projects.filter((project) => !isArchivedProjectStatus(project.status)),
    [projects],
  );
  const scopedProjectId = selectedProjectIds.length === 1 ? selectedProjectIds[0] : undefined;
  const scopedProject = scopedProjectId
    ? activeProjects.find((project) => project.id === scopedProjectId)
    : undefined;
  const visibleCycles = useMemo(() => {
    if (!scopedProjectId) return cycles;
    return cycles.filter((cycle) => !cycle.projectId || cycle.projectId === scopedProjectId);
  }, [cycles, scopedProjectId]);
  const projectsById = useMemo(
    () => new Map(projects.map((project) => [project.id, { status: project.status }])),
    [projects],
  );
  const locationsById = useMemo(
    () => new Map(locations.map((location) => [location.id, { status: location.status }])),
    [locations],
  );

  const activeCycle = visibleCycles.find((c) => c.status === 'active');
  const otherCycles = visibleCycles.filter((c) => c.status !== 'active');

  function applyProjectFilter(ids: string[]) {
    setSelectedProjectIds(ids);
    if (ids.length === 1) {
      router.replace(`${pathname}?projectId=${encodeURIComponent(ids[0])}`);
      return;
    }
    router.replace(pathname);
  }

  const taskFilters = useMemo((): TaskFilters | undefined => {
    const f: TaskFilters = {};
    if (selectedProjectIds.length) f.projectId = selectedProjectIds;
    if (sprintMode === 'backlog') f.status = ['backlog']; // A3: filtrar por status, no por cycleId (issue #14)
    else if (sprintMode === 'board' && selectedSprintId) f.cycleId = [selectedSprintId];
    return Object.keys(f).length > 0 ? f : undefined;
  }, [selectedProjectIds, sprintMode, selectedSprintId]);

  const { data: tasks = [], isLoading, isError, error } = useTasksQuery(taskFilters);
  const visibleTasks = useMemo(
    () => tasks.filter((task) => isTaskFromActiveEntities(task, projectsById, locationsById)),
    [tasks, projectsById, locationsById],
  );

  if (isLoading || isLoadingProjects || isLoadingLocations) {
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

      <div className="shrink-0 flex flex-wrap items-center gap-3 px-4 py-2 border-b">
        <FolderKanban className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <Link
          href="/dashboard/tareas/tableros"
          className="text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Proyectos
        </Link>
        <span className="text-muted-foreground/50" aria-hidden>
          /
        </span>
        <span className="text-xs font-medium">
          {scopedProject ? scopedProject.name : 'Todos los proyectos'}
        </span>
        {activeProjects.length > 1 && (
          <ProjectMultiPicker
            projects={activeProjects.map((p) => ({ id: p.id, name: p.name, status: p.status }))}
            value={selectedProjectIds}
            onChange={applyProjectFilter}
            size="md"
            placeholder="Todos los proyectos"
          />
        )}
        {selectedProjectIds.length > 0 && (
          <button
            type="button"
            onClick={() => applyProjectFilter([])}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            title="Ver todas las tareas"
          >
            <X className="h-3.5 w-3.5" />
            Ver todo
          </button>
        )}
      </div>

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
        <KanbanBoard tasks={visibleTasks} projectId={scopedProjectId} />
      </div>
    </div>
  );
}
