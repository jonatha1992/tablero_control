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
import { Plus, Filter, Search, Settings2 } from 'lucide-react';
import type { Task, TaskStatus, TaskPriority } from '@/types';
import { KanbanColumn } from './kanban-column';
import { KanbanCard } from './kanban-card';
import { TaskDetailModal } from './task-detail-modal';
import { useMoveTask } from '@/hooks/mutations/use-move-task';
import { useUpdateTask } from '@/hooks/mutations/use-update-task';
import { useLocationsQuery } from '@/hooks/queries/use-locations-query';
import { useKanbanUIStore } from '@/stores/kanban-ui.store';
import { useAuth } from '@/hooks/auth-context';

const COLUMN_ORDER_FULL: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'blocked'];

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
    openTaskDetail,
    closeTaskDetail,
    activeColumns,
    toggleColumn,
  } = useKanbanUIStore();

  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const moveTask = useMoveTask();
  const updateTask = useUpdateTask();
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
      for (const status of COLUMN_ORDER_FULL) {
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
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
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

    if (COLUMN_ORDER_FULL.includes(overId as TaskStatus)) {
      targetColumn = overId as TaskStatus;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) targetColumn = overTask.status;
    }

    if (targetColumn && targetColumn !== task.status) {
      moveTask.mutate({ taskId, newStatus: targetColumn });
    }
  };

  const handlePriorityChange = (taskId: string, priority: TaskPriority) => {
    updateTask.mutate({ id: taskId, data: { priority } });
  };

  const activeTask = dragState.draggedTaskId
    ? tasks.find((t) => t.id === dragState.draggedTaskId) ?? null
    : null;

  return (
    <div className="flex flex-col h-full min-h-0 min-w-0 w-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar tareas..."
            value={filters.searchQuery}
            onChange={(e) => setFilters({ searchQuery: e.target.value })}
            className="h-9 w-full rounded-md border border-input bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

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

        <div className="relative">
          <button
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="inline-flex items-center gap-2 h-9 px-3 text-sm border border-input rounded-md hover:bg-accent"
          >
            <Settings2 className="h-4 w-4" />
            Configurar Tablero
          </button>

          {isConfigOpen && (
            <div className="absolute top-full mt-2 left-0 w-56 rounded-md border bg-popover shadow-md z-50 p-2">
              <h4 className="text-sm font-semibold mb-2 px-2 text-popover-foreground">Columnas Visibles</h4>
              <div className="space-y-1">
                {COLUMN_ORDER_FULL.map((col) => (
                  <label key={col} className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeColumns.includes(col)}
                      onChange={() => toggleColumn(col)}
                      className="rounded border-gray-300"
                    />
                    <span>
                      {col === 'backlog' ? 'Backlog' :
                        col === 'todo' ? 'Por hacer' :
                          col === 'in_progress' ? 'En progreso' :
                            col === 'in_review' ? 'En revisión' :
                              col === 'done' ? 'Completada' : 'Bloqueada'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1" />

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

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-2 pt-1 flex-1 min-h-0 min-w-0 w-full">
          {COLUMN_ORDER_FULL.filter(c => activeColumns.includes(c)).map((column) => (
            <KanbanColumn
              key={column}
              status={column}
              tasks={columns[column]}
              onCardClick={(task) => openTaskDetail(task.id)}
              onPriorityChange={handlePriorityChange}
              onAddClick={openCreateModal}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="rotate-3 shadow-xl">
              <KanbanCard
                task={activeTask}
                column={activeTask.status}
                onMove={() => { }}
                onPriorityChange={() => { }}
                onClick={() => { }}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDetailModal
        task={selectedTask}
        open={isDetailModalOpen}
        onOpenChange={(open) => { if (!open) closeTaskDetail(); }}
      />
    </div>
  );
}
