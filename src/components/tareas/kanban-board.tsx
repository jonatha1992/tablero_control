'use client';

import { useState, useMemo } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Plus, Filter, Search, MapPin } from 'lucide-react';
import type { Task, TaskStatus, TaskPriority, Location } from '@/types';
import { KanbanColumn } from './kanban-column';
import { KanbanCard } from './kanban-card';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '@/lib/utils';
import { TaskDetailModal } from './task-detail-modal';
import { CreateTaskModal } from './create-task-modal';
import { useLocationStore } from '@/stores/location-store';

// Column order for Kanban
const COLUMN_ORDER: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'blocked'];

interface KanbanBoardProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
}

export function KanbanBoard({ tasks, onTasksChange }: KanbanBoardProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterLocation, setFilterLocation] = useState<string>('');
  const { locations } = useLocationStore();

  // Organize tasks by column
  const columns = useMemo(() => {
    const cols: Record<TaskStatus, Task[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      in_review: [],
      done: [],
      blocked: [],
    };

    tasks.forEach((task) => {
      if (cols[task.status]) {
        cols[task.status].push(task);
      }
    });

    // Apply filters
    if (searchQuery || filterPriority || filterLocation) {
      for (const status of COLUMN_ORDER) {
        cols[status] = cols[status].filter((task) => {
          const matchesSearch =
            !searchQuery ||
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesPriority = !filterPriority || task.priority === filterPriority;
          const matchesLocation = !filterLocation || task.locationId === filterLocation;
          return matchesSearch && matchesPriority && matchesLocation;
        });
      }
    }

    return cols;
  }, [tasks, searchQuery, filterPriority, filterLocation]);

  // Find task by id
  const findTask = (id: string) => tasks.find((t) => t.id === id) || null;

  // Update task status
  const updateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    const updatedTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, status: newStatus, updatedAt: new Date() } : t
    );
    onTasksChange(updatedTasks);
  };

  // Update task priority
  const updateTaskPriority = (taskId: string, newPriority: TaskPriority) => {
    const updatedTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, priority: newPriority, updatedAt: new Date() } : t
    );
    onTasksChange(updatedTasks);
  };

  // Drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Drag end - move task between columns
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const task = findTask(taskId);
    if (!task) return;

    // Determine target column from drop target
    let targetColumn: TaskStatus | null = null;

    // Check if dropped on a column
    const overId = over.id as string;
    if (COLUMN_ORDER.includes(overId as TaskStatus)) {
      targetColumn = overId as TaskStatus;
    }
    // Check if dropped on a card (get its column)
    else {
      const overTask = findTask(overId);
      if (overTask) {
        targetColumn = overTask.status;
      }
    }

    if (targetColumn && targetColumn !== task.status) {
      updateTaskStatus(taskId, targetColumn);
    }
  };

  // Get active task for overlay
  const activeTask = activeId ? findTask(activeId) : null;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar tareas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <select
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
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
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
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

        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nueva tarea
        </button>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {COLUMN_ORDER.map((column) => (
            <KanbanColumn
              key={column}
              status={column}
              tasks={columns[column]}
              onCardClick={(task) => {
                setSelectedTask(task);
                setShowDetail(true);
              }}
              onPriorityChange={updateTaskPriority}
            />
          ))}
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeTask ? (
            <div className="rotate-3 shadow-xl">
              <KanbanCard
                task={activeTask}
                column={activeTask.status}
                onMove={() => {}}
                onPriorityChange={() => {}}
                onClick={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Task detail modal */}
      <TaskDetailModal
        task={selectedTask}
        open={showDetail}
        onOpenChange={setShowDetail}
        onUpdate={(updates) => {
          if (selectedTask) {
            const updatedTasks = tasks.map((t) =>
              t.id === selectedTask.id ? { ...t, ...updates, updatedAt: new Date() } : t
            );
            onTasksChange(updatedTasks);
            setSelectedTask({ ...selectedTask, ...updates });
          }
        }}
      />

      {/* Create task modal */}
      <CreateTaskModal
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreate={(task) => {
          onTasksChange([...tasks, task]);
        }}
      />
    </div>
  );
}
