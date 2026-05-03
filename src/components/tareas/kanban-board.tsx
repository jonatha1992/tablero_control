'use client';

import { useMemo, useState } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Plus, Filter, Settings2, CheckSquare, Trash2, ChevronDown, MapPin, MessageSquare } from 'lucide-react';
import type { Task, TaskStatus, TaskPriority } from '@/types';
import { TASK_STATUS_LABELS } from '@/lib/constants/task';
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '@/lib/constants/task-colors';
import { SECTOR_ICONS } from '@/components/sectores/sector-modal';
import { cn } from '@/lib/utils';
import { KanbanColumn } from './kanban-column';
import { KanbanCard } from './kanban-card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { TaskDetailModal } from './task-detail-modal';
import { CreateTaskModal } from './create-task-modal';
import { DictateTasksModal } from './dictate-tasks-modal';
import { useMoveTask } from '@/hooks/mutations/use-move-task';
import { useUpdateTask } from '@/hooks/mutations/use-update-task';
import { useBulkMoveTasks } from '@/hooks/mutations/use-bulk-move-tasks';
import { useBulkDeleteTasks } from '@/hooks/mutations/use-bulk-delete-tasks';
import { useLocationsQuery } from '@/hooks/queries/use-locations-query';
import { useKanbanUIStore } from '@/stores/kanban-ui.store';
import { useAuth } from '@/hooks/auth-context';
import { X } from 'lucide-react';

const BOARD_COLUMNS: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'blocked'];

interface KanbanBoardProps {
  tasks: Task[];
}

export function KanbanBoard({ tasks }: KanbanBoardProps) {
  const {
    dragState,
    filters,
    isCreateModalOpen,
    isDetailModalOpen,
    isDictateModalOpen,
    selectedTaskId,
    setDraggedTask,
    clearDrag,
    setFilters,
    openCreateModal,
    closeCreateModal,
    openDictateModal,
    closeDictateModal,
    openTaskDetail,
    closeTaskDetail,
    isSelectMode,
    toggleSelectMode,
    selectedTaskIds,
    toggleTaskSelection,
    selectAllInColumn,
    clearSelection,
    activeColumns,
    toggleColumn,
  } = useKanbanUIStore();

  const [pendingDelete, setPendingDelete] = useState<string[] | null>(null);

  const requestDelete = (taskIds: string[]) => setPendingDelete(taskIds);
  const confirmDelete = () => {
    if (!pendingDelete) return;
    bulkDelete.mutate(
      { taskIds: pendingDelete },
      { onSuccess: () => { clearSelection(); setPendingDelete(null); } }
    );
  };

  const moveTask = useMoveTask();
  const updateTask = useUpdateTask();
  const bulkMove = useBulkMoveTasks();
  const bulkDelete = useBulkDeleteTasks();
  const { data: locations = [] } = useLocationsQuery();
  const { user } = useAuth();

  const selectedTask = selectedTaskId ? (tasks.find((t) => t.id === selectedTaskId) ?? null) : null;

  const columns = useMemo(() => {
    const cols: Record<TaskStatus, Task[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      in_review: [],
      done: [],
      blocked: [],
    };

    for (const task of tasks) {
      if (cols[task.status]) cols[task.status].push(task);
    }

    const { searchQuery, priority, locationId } = filters;
    if (searchQuery || priority || locationId) {
      for (const status of BOARD_COLUMNS) {
        cols[status] = cols[status].filter((task) => {
          const matchesSearch =
            !searchQuery ||
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesPriority = !priority || task.priority === priority;
          const matchesLocation = !locationId || task.locationId === locationId;
          return matchesSearch && matchesPriority && matchesLocation;
        });
      }
    }

    return cols;
  }, [tasks, filters]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    setDraggedTask(taskId, task?.status ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    clearDrag();
    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const overId = over.id as string;
    let targetColumn: TaskStatus | null = null;

    if (BOARD_COLUMNS.includes(overId as TaskStatus)) {
      targetColumn = overId as TaskStatus;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) targetColumn = overTask.status;
    }

    if (targetColumn && targetColumn !== task.status) {
      if (selectedTaskIds.length > 1 && selectedTaskIds.includes(taskId)) {
        bulkMove.mutate(
          { taskIds: selectedTaskIds, newStatus: targetColumn },
          { onSuccess: () => clearSelection() }
        );
      } else {
        moveTask.mutate({ taskId, newStatus: targetColumn });
      }
    }
  };

  const handlePriorityChange = (taskId: string, priority: TaskPriority) => {
    updateTask.mutate({ id: taskId, data: { priority } });
  };

  const handleLocationChange = (taskId: string, locationId: string | null) => {
    updateTask.mutate({ id: taskId, data: { locationId } });
  };

  const activeTask = dragState.draggedTaskId
    ? tasks.find((t) => t.id === dragState.draggedTaskId) ?? null
    : null;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden w-full">
      {/* Toolbar */}
      <div className="shrink-0 flex items-center gap-3 pb-4 mb-4 border-b flex-wrap">
        {/* Location filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center gap-2 h-9 px-3 text-sm border border-input rounded-md hover:bg-accent bg-background min-w-0 max-w-[200px]">
              {(() => {
                const loc = locations.find((l) => l.id === filters.locationId);
                if (!loc) return <><span className="truncate">Todos los locales/sectores</span><ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" /></>;
                const iconEntry = SECTOR_ICONS.find((i) => i.name === (loc.metadata?.icon as string));
                const Icon = iconEntry?.icon ?? MapPin;
                return <><Icon className="h-3.5 w-3.5 shrink-0 text-primary" /><span className="truncate">{loc.name}</span><ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" /></>;
              })()}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[200px]">
            <DropdownMenuItem onClick={() => setFilters({ locationId: '' })}>
              <span className={cn('flex-1', !filters.locationId && 'font-medium')}>Todos los locales/sectores</span>
            </DropdownMenuItem>
            {locations.map((loc) => {
              const iconEntry = SECTOR_ICONS.find((i) => i.name === (loc.metadata?.icon as string));
              const Icon = iconEntry?.icon ?? MapPin;
              return (
                <DropdownMenuItem key={loc.id} onClick={() => setFilters({ locationId: loc.id })}>
                  <Icon className="h-4 w-4 mr-2 text-primary shrink-0" />
                  <span className={cn('flex-1 truncate', filters.locationId === loc.id && 'font-medium')}>{loc.name}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Priority filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center gap-2 h-9 px-3 text-sm border border-input rounded-md hover:bg-accent bg-background">
              {filters.priority ? (
                <>
                  <span className={cn('h-2 w-2 rounded-full shrink-0', PRIORITY_OPTIONS.find((p) => p.value === filters.priority)?.dot)} />
                  <span>{PRIORITY_OPTIONS.find((p) => p.value === filters.priority)?.label}</span>
                </>
              ) : (
                <span>Todas las prioridades</span>
              )}
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setFilters({ priority: '' as TaskPriority | '' })}>
              <span className={cn('flex-1', !filters.priority && 'font-medium')}>Todas las prioridades</span>
            </DropdownMenuItem>
            {PRIORITY_OPTIONS.map((opt) => (
              <DropdownMenuItem key={opt.value} onClick={() => setFilters({ priority: opt.value })}>
                <span className={cn('h-2 w-2 rounded-full mr-2 shrink-0', opt.dot)} />
                <span className={cn('flex-1', filters.priority === opt.value && 'font-medium')}>{opt.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button className="inline-flex items-center gap-2 h-9 px-3 text-sm border border-input rounded-md hover:bg-accent">
          <Filter className="h-4 w-4" />
          Más filtros
        </button>

        <div className="flex-1" />

        {/* Configurar Tablero */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center gap-2 h-9 px-3 text-sm border border-input rounded-md hover:bg-accent">
              <Settings2 className="h-4 w-4" />
              Configurar Tablero
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Columnas Visibles</DropdownMenuLabel>
            {BOARD_COLUMNS.map((col) => {
              const opt = STATUS_OPTIONS.find((o) => o.value === col);
              return (
                <DropdownMenuCheckboxItem
                  key={col}
                  checked={activeColumns.includes(col)}
                  onCheckedChange={() => toggleColumn(col)}
                >
                  <span className={cn('h-2 w-2 rounded-full shrink-0', opt?.dot ?? 'bg-slate-400')} />
                  {TASK_STATUS_LABELS[col]}
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Selección / bulk actions */}
        {isSelectMode ? (
          <div className="flex items-center gap-2">
            <div className={cn(
              'flex items-center gap-2 rounded-lg border h-9 px-3 transition-colors',
              selectedTaskIds.length > 0 ? 'border-primary/50 bg-primary/5' : 'border-border'
            )}>
              <CheckSquare className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-medium tabular-nums text-primary">
                {selectedTaskIds.length} seleccionada{selectedTaskIds.length !== 1 ? 's' : ''}
              </span>
              {selectedTaskIds.length > 0 && (
                <>
                  <div className="h-4 w-px bg-border" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="inline-flex items-center gap-1 h-7 px-2 text-sm rounded hover:bg-muted transition-colors text-foreground disabled:opacity-50"
                        disabled={bulkMove.isPending}
                      >
                        Mover a…
                        <svg className="h-3 w-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="z-[200]">
                      {BOARD_COLUMNS.map((col) => (
                        <DropdownMenuItem
                          key={col}
                          onClick={() => bulkMove.mutate(
                            { taskIds: selectedTaskIds, newStatus: col },
                            { onSuccess: () => clearSelection() }
                          )}
                        >
                          {TASK_STATUS_LABELS[col]}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <button
                    onClick={() => requestDelete(selectedTaskIds)}
                    className="h-7 px-2 flex items-center gap-1 rounded text-sm hover:bg-destructive/10 hover:text-destructive transition-colors"
                    title="Eliminar seleccionadas"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={clearSelection}
                    className="p-0.5 hover:bg-muted rounded transition-colors"
                    title="Deseleccionar todo"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </>
              )}
            </div>
            <button
              onClick={toggleSelectMode}
              className="inline-flex items-center h-9 px-3 text-sm border border-input rounded-md hover:bg-accent"
              title="Salir del modo selección"
            >
              Salir
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectMode}
              className="inline-flex items-center gap-2 h-9 px-3 text-sm border border-input rounded-md hover:bg-accent"
              title="Modo selección múltiple"
            >
              <CheckSquare className="h-4 w-4" />
              Selección
            </button>
            {user?.role !== 'viewer' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="h-4 w-4" />
                    Nueva tarea
                    <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={openCreateModal} className="gap-3 cursor-pointer py-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted shrink-0">
                      <Plus className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Formulario</p>
                      <p className="text-xs text-muted-foreground">Campo por campo</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={openDictateModal} className="gap-3 cursor-pointer py-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 shrink-0">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Crear con IA</p>
                      <p className="text-xs text-muted-foreground">Chat o voz</p>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-2 pt-1 flex-1 min-h-0 min-w-0 w-full overflow-y-hidden">
          {BOARD_COLUMNS.filter((c) => activeColumns.includes(c)).map((column) => (
            <KanbanColumn
              key={column}
              status={column}
              tasks={columns[column]}
              onCardClick={(task) => {
                if (isSelectMode) toggleTaskSelection(task.id);
                else openTaskDetail(task.id);
              }}
              onPriorityChange={handlePriorityChange}
              onLocationChange={handleLocationChange}
              onAddClick={openCreateModal}
              selectedTaskIds={selectedTaskIds}
              isSelectMode={isSelectMode}
              onSelectAll={selectAllInColumn}
              onBulkDelete={requestDelete}
              locations={locations}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="rotate-3 shadow-xl">
              <KanbanCard
                task={activeTask}
                isOverlay
                column={activeTask.status}
                onMove={() => { }}
                onPriorityChange={() => { }}
                onClick={() => { }}
                isSelected={false}
                isSelectMode={false}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Confirm delete */}
      <Dialog open={pendingDelete !== null} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Eliminar {pendingDelete?.length ?? 0} tarea{(pendingDelete?.length ?? 0) !== 1 ? 's' : ''}?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Las tareas eliminadas no se pueden recuperar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setPendingDelete(null)}
              className="inline-flex items-center justify-center h-9 px-4 text-sm rounded-md border border-input hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              disabled={bulkDelete.isPending}
              className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
            >
              {bulkDelete.isPending ? 'Eliminando…' : 'Eliminar'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TaskDetailModal
        task={selectedTask}
        open={isDetailModalOpen}
        onOpenChange={(open) => { if (!open) closeTaskDetail(); }}
      />

      <CreateTaskModal
        open={isCreateModalOpen}
        onOpenChange={(open) => {
          if (!open) closeCreateModal();
        }}
      />

      <DictateTasksModal
        open={isDictateModalOpen}
        onOpenChange={(open) => {
          if (!open) closeDictateModal();
        }}
      />
    </div>
  );
}
