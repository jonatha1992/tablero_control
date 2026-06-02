'use client';

import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X, Plus, Target, CheckCircle2, Clock, ListTodo, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useKanbanUIStore } from '@/stores/kanban-ui.store';
import { objectivesApi } from '@/lib/api/objectives';
import { taskKeys } from '@/hooks/queries/use-tasks-query';
import { objectiveKeys } from '@/hooks/queries/use-objectives-query';
import type { Objective } from '@/types/domain/objective';
import type { Task } from '@/types/domain/task';
import { cn } from '@/lib/utils';

const STATUS_LABEL: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'Por hacer',
  in_progress: 'En progreso',
  in_review: 'En revisión',
  done: 'Finalizado',
  blocked: 'Bloqueada',
  archived: 'Archivado',
};

const STATUS_COLOR: Record<string, string> = {
  backlog: 'text-muted-foreground',
  todo: 'text-blue-500',
  in_progress: 'text-amber-500',
  in_review: 'text-purple-500',
  done: 'text-green-500',
  blocked: 'text-red-500',
  archived: 'text-muted-foreground',
};

interface ObjectiveDetailModalProps {
  objective: Objective & { total: number; completed: number; progress: number };
  tasks: Task[];         // todas las tareas del negocio (para selector "asignar existente")
  open: boolean;
  onClose: () => void;
}

export function ObjectiveDetailModal({ objective, tasks, open, onClose }: ObjectiveDetailModalProps) {
  const queryClient = useQueryClient();
  const { openCreateModalWithDraft } = useKanbanUIStore();
  const [showAssignPanel, setShowAssignPanel] = useState(false);
  const [search, setSearch] = useState('');

  // Tareas ya asociadas al objetivo
  const objectiveTasks = useMemo(
    () => tasks.filter((t) => t.objectiveId === objective.id),
    [tasks, objective.id]
  );

  // Tareas disponibles para asignar (sin objectiveId o con otro objectiveId)
  const availableTasks = useMemo(() => {
    const q = search.toLowerCase();
    return tasks.filter(
      (t) =>
        t.objectiveId !== objective.id &&
        t.status !== 'done' &&
        t.status !== 'archived' &&
        (!q || t.title.toLowerCase().includes(q))
    );
  }, [tasks, objective.id, search]);

  const assignMutation = useMutation({
    mutationFn: (taskIds: string[]) => objectivesApi.assignTasks(objective.id, taskIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: objectiveKeys.all });
      toast.success('Tarea asignada al objetivo');
      setShowAssignPanel(false);
      setSearch('');
    },
    onError: (err: Error) => toast.error('Error al asignar tarea', { description: err.message }),
  });

  const removeMutation = useMutation({
    mutationFn: (taskId: string) => objectivesApi.removeTasks(objective.id, [taskId]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: objectiveKeys.all });
      toast.success('Tarea desvinculada del objetivo');
    },
    onError: (err: Error) => toast.error('Error al desvincular tarea', { description: err.message }),
  });

  const handleCreateTask = () => {
    onClose();
    // Precargar el objectiveId en el modal de creación de tarea
    openCreateModalWithDraft({ objectiveId: objective.id });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-3 p-5 border-b">
          <div
            className="h-10 w-10 rounded-lg shrink-0 flex items-center justify-center"
            style={{ backgroundColor: objective.color + '20' }}
          >
            <Target className="h-5 w-5" style={{ color: objective.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-base leading-tight truncate">{objective.name}</h2>
            {objective.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{objective.description}</p>
            )}
            {/* Barra de progreso */}
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{objective.completed} de {objective.total} completadas</span>
                <span className="font-medium">{objective.progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${objective.progress}%`, backgroundColor: objective.color }}
                />
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Acciones rápidas */}
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleCreateTask} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Crear tarea
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAssignPanel((v) => !v)}
              className="gap-1.5"
            >
              <ListTodo className="h-3.5 w-3.5" />
              Asignar existente
            </Button>
          </div>

          {/* Panel de asignación */}
          {showAssignPanel && (
            <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground">Buscar tareas para asignar</p>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título..."
                className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm"
                autoFocus
              />
              <div className="max-h-40 overflow-y-auto space-y-1">
                {availableTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground py-2 text-center">
                    {search ? 'Sin resultados' : 'No hay tareas disponibles'}
                  </p>
                )}
                {availableTasks.slice(0, 20).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => assignMutation.mutate([t.id])}
                    disabled={assignMutation.isPending}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left hover:bg-muted transition-colors"
                  >
                    {assignMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
                    ) : (
                      <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <span className="flex-1 truncate">{t.title}</span>
                    <span className={cn('text-[10px] shrink-0', STATUS_COLOR[t.status])}>
                      {STATUS_LABEL[t.status] ?? t.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tareas del objetivo */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              Tareas del objetivo ({objectiveTasks.length})
            </p>
            {objectiveTasks.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <Target className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Sin tareas asociadas.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Creá una nueva o asigná tareas existentes.
                </p>
              </div>
            ) : (
              <ul className="space-y-1">
                {objectiveTasks.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted/50 group"
                  >
                    {t.status === 'done' ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                    ) : (
                      <Clock className={cn('h-4 w-4 shrink-0', STATUS_COLOR[t.status])} />
                    )}
                    <span
                      className={cn(
                        'flex-1 text-sm truncate',
                        t.status === 'done' && 'line-through text-muted-foreground'
                      )}
                    >
                      {t.title}
                    </span>
                    <span className={cn('text-[10px] shrink-0', STATUS_COLOR[t.status])}>
                      {STATUS_LABEL[t.status] ?? t.status}
                    </span>
                    {/* Desvincular */}
                    <button
                      onClick={() => removeMutation.mutate(t.id)}
                      disabled={removeMutation.isPending}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-destructive transition-all"
                      title="Desvincular del objetivo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </div>
  );
}
