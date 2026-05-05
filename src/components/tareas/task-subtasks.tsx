'use client';

import { useState } from 'react';
import { useSubtasksQuery } from '@/hooks/queries/use-subtasks-query';
import { useCreateSubtask } from '@/hooks/mutations/use-create-subtask';
import { useUpdateTask } from '@/hooks/mutations/use-update-task';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, ListTree } from 'lucide-react';
import type { Task } from '@/types';

interface TaskSubtasksProps {
  task: Task;
}

export function TaskSubtasks({ task }: TaskSubtasksProps) {
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { data: subtasks = [], isLoading } = useSubtasksQuery(task.id);
  const createSubtask = useCreateSubtask();
  const updateTask = useUpdateTask();

  const completedCount = subtasks.filter((s) => s.status === 'done').length;
  const progress = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0;

  const handleToggle = (subtask: Task) => {
    const nextStatus = subtask.status === 'done' ? 'todo' : 'done';
    updateTask.mutate({ id: subtask.id, data: { status: nextStatus } });
  };

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    createSubtask.mutate(
      { taskId: task.id, title: newTitle.trim() },
      { onSuccess: () => { setNewTitle(''); setIsAdding(false); } }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ListTree className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Subtareas</h3>
        {subtasks.length > 0 && (
          <span className="text-xs text-muted-foreground">
            ({completedCount}/{subtasks.length})
          </span>
        )}
      </div>

      {subtasks.length > 0 && (
        <div className="space-y-1">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground text-right">{progress}% completado</p>
        </div>
      )}

      {isLoading && (
        <p className="text-xs text-muted-foreground">Cargando subtareas...</p>
      )}

      <div className="space-y-1.5">
        {subtasks.map((subtask) => (
          <div
            key={subtask.id}
            className="flex items-center gap-2 rounded-md hover:bg-muted/50 px-1.5 py-1"
          >
            <Checkbox
              checked={subtask.status === 'done'}
              onChange={() => handleToggle(subtask)}
              className="h-4 w-4 shrink-0"
            />
            <span
              className={`text-sm flex-1 ${subtask.status === 'done' ? 'line-through text-muted-foreground' : ''}`}
            >
              {subtask.title}
            </span>
          </div>
        ))}
      </div>

      {isAdding ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') {
                setIsAdding(false);
                setNewTitle('');
              }
            }}
            placeholder="Nueva subtarea..."
            autoFocus
            maxLength={200}
            className="flex-1 h-8 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={handleAdd}
            disabled={!newTitle.trim() || createSubtask.isPending}
            className="h-8 px-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar subtarea
        </button>
      )}
    </div>
  );
}
