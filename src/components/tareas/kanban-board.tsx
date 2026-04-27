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
import { Plus, Filter, Settings2, CheckSquare, Trash2 } from 'lucide-react';
import type { Task, TaskStatus, TaskPriority } from '@/types';
import { TASK_STATUS_LABELS } from '@/lib/constants/task';
import { cn } from '@/lib/utils';
import { KanbanColumn } from './kanban-column';
import { KanbanCard } from './kanban-card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
    selectedTaskId,
    setDraggedTask,
    clearDrag,
    setFilters,
    openCreateModal,
    closeCreateModal,
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

  const [isConfigOpen, setIsConfigOpen] = useState(false);
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

  const activeTask = dragState.draggedTaskId
    ? tasks.find((t) => t.id === dragState.draggedTaskId) ?? null
    : null;

  return (
    <div className="flex flex-col h-full min-h-0 min-w-0 w-full">
      {/* Toolbar */}
      <div className="shrink-0 sticky top-0 z-10 bg-background flex items-center gap-3 pb-4 mb-4 border-b">
        <select
          value={filters.locationId}
          onChange={(e) => setFilters({ locationId: e.target.value })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Todos los locales/sectores</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name} ({loc.type})
            </option>
          ))}
        </select>

        <select
          value={filters.priority}
          onChange={(e) => setFilters({ priority: e.target.value as TaskPriority | '' })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Todas las prioridades</option>
          <option value="urgent">Urgente</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>

        <button className="inline-flex items-center gap-2 h-9 px-3 text-sm border border-input rounded-md hover:bg-accent">
          <Filter className="h-4 w-4" />
          Más filtros
        </button>

        <div className="flex-1" />

        {/* Configurar Tablero — siempre visible */}
        <div className="relative">
          <button
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="inline-flex items-center gap-2 h-9 px-3 text-sm border border-input rounded-md hover:bg-accent"
          >
            <Settings2 className="h-4 w-4" />
            Configurar Tablero
          </button>

          {isConfigOpen && (
            <div className="absolute top-full mt-2 right-0 w-56 rounded-md border bg-popover shadow-md z-50 p-2">
              <h4 className="text-sm font-semibold mb-2 px-2 text-popover-foreground">Columnas Visibles</h4>
              <div className="space-y-1">
                {BOARD_COLUMNS.map((col) => (
                  <label key={col} className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeColumns.includes(col)}
                      onChange={() => toggleColumn(col)}
                      className="rounded border-gray-300"
                    />
                    <span>{TASK_STATUS_LABELS[col]}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Selección / bulk actions — cambia según el modo */}
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
                        <svg className="h-3 w-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
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
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Nueva tarea
              </button>
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
              onAddClick={openCreateModal}
              selectedTaskIds={selectedTaskIds}
              isSelectMode={isSelectMode}
              onSelectAll={selectAllInColumn}
              onBulkDelete={requestDelete}
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
                onMove={() => {}}
                onPriorityChange={() => {}}
                onClick={() => {}}
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
    </div>
  );
}
