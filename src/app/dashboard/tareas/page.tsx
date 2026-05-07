'use client';

import { useState, useMemo } from 'react';
import { KanbanBoard } from '@/components/tareas/kanban-board';
import { CalendarView } from '@/components/calendario/calendar-view';
import { TaskDetailModal } from '@/components/tareas/task-detail-modal';
import { CreateTaskModal } from '@/components/tareas/create-task-modal';
import { useTasksQuery } from '@/hooks/queries/use-tasks-query';
import { useUpdateTask } from '@/hooks/mutations/use-update-task';
import { useCreateTask } from '@/hooks/mutations/use-create-task';
import { useProjectsQuery } from '@/hooks/queries/use-projects-query';
import { useCyclesQuery } from '@/hooks/queries/use-cycles-query';
import { useAuth } from '@/hooks/auth-context';
import { useScrumUIStore } from '@/stores/scrum-ui.store';
import type { Task, TaskFilters } from '@/types';
import { LayoutGrid, Calendar, Plus, ChevronDown, FolderKanban, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useKanbanUIStore } from '@/stores/kanban-ui.store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type ActiveView = 'board' | 'calendar';

export default function TareasPage() {
  const [activeView, setActiveView] = useState<ActiveView>('board');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createInitialDate, setCreateInitialDate] = useState<Date | undefined>();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const { user } = useAuth();
  const businessId = user?.businessId ?? '';
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
  const updateTask = useUpdateTask();
  const _createTask = useCreateTask();
  const { openCreateModal } = useKanbanUIStore();

  const handleEventDrop = (taskId: string, newDate: Date) => {
    updateTask.mutate({ id: taskId, data: { dueDate: newDate } });
  };

  const handleEventClick = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) setSelectedTask(task);
  };

  const handleDateClick = (date: Date) => {
    setCreateInitialDate(date);
    setIsCreateOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-muted-foreground">Cargando tareas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-destructive">Error al cargar las tareas</p>
            <p className="text-xs text-muted-foreground">{(error as Error)?.message ?? 'Error desconocido'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
      {/* Toggle entre vistas */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border bg-muted p-1">
            <button
              onClick={() => setActiveView('board')}
              className={`inline-flex items-center gap-1.5 h-8 px-3 text-sm rounded-md transition-colors ${
                activeView === 'board'
                  ? 'bg-background shadow-sm font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Tablero
            </button>
            <button
              onClick={() => setActiveView('calendar')}
              className={`inline-flex items-center gap-1.5 h-8 px-3 text-sm rounded-md transition-colors ${
                activeView === 'calendar'
                  ? 'bg-background shadow-sm font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar className="h-4 w-4" />
              Calendario
            </button>
          </div>

          {/* Selector de Tablero */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-2 h-9 px-3 text-sm border border-input rounded-md hover:bg-accent bg-background max-w-[200px]">
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

        {activeView !== 'board' && (
          <Button size="sm" onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nueva tarea
          </Button>
        )}
      </div>

      {/* Tabs de sprint (solo en vista Tablero) */}
      {activeView === 'board' && (
        <div className="shrink-0 flex items-center gap-1 px-4 py-1.5 border-b bg-muted/20">
          <Timer className="h-3.5 w-3.5 text-muted-foreground mr-1 shrink-0" />

          {/* Todas */}
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

          {/* Backlog */}
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

          {/* Sprint activo */}
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

          {/* Otros ciclos */}
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
      )}

      {/* Vista activa */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {activeView === 'board' ? (
          <KanbanBoard tasks={tasks} />
        ) : (
          <div className="h-full p-4">
            <CalendarView
              tasks={tasks}
              onEventDrop={handleEventDrop}
              onEventClick={handleEventClick}
              onDateClick={handleDateClick}
            />
          </div>
        )}
      </div>

      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => { if (!open) setSelectedTask(null); }}
      />

      <CreateTaskModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        initialDate={createInitialDate}
      />
    </div>
  );
}
