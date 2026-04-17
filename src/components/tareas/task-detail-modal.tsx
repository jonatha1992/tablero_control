'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUpdateTask } from '@/hooks/mutations/use-update-task';
import { useMoveTask } from '@/hooks/mutations/use-move-task';
import { useDeleteTask } from '@/hooks/mutations/use-delete-task';
import type { Task, TaskStatus, TaskPriority } from '@/types';
import { Trash, Paperclip } from 'lucide-react';
import { TaskAttachments } from './task-attachments';

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailModal({ task, open, onOpenChange }: TaskDetailModalProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const updateTask = useUpdateTask();
  const moveTask = useMoveTask();
  const deleteTask = useDeleteTask();

  if (!task) return null;

  const handleSave = () => {
    updateTask.mutate(
      { id: task.id, data: { title, description } },
      { onSuccess: () => setEditing(false) }
    );
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    moveTask.mutate({ taskId: task.id, newStatus });
  };

  const handleDelete = () => {
    if (confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
      deleteTask.mutate(task.id, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const handlePriorityChange = (priority: TaskPriority) => {
    updateTask.mutate({ id: task.id, data: { priority } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {editing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xl font-bold bg-transparent border-b border-input pb-2 focus:outline-none"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-sm bg-transparent border border-input rounded p-2 focus:outline-none"
                rows={3}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={updateTask.isPending}>
                  {updateTask.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-xl">{task.title}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setTitle(task.title);
                    setDescription(task.description);
                    setEditing(true);
                  }}
                >
                  Editar
                </Button>
                <Button size="icon" variant="destructive" className="h-9 w-9" onClick={handleDelete} disabled={deleteTask.isPending}>
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogHeader>

        {/* Status & Priority */}
        <div className="flex flex-wrap gap-3 py-3 border-y">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Estado</p>
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
              className="h-8 rounded border border-input bg-background px-2 text-sm"
            >
              <option value="backlog">Backlog</option>
              <option value="todo">Por hacer</option>
              <option value="in_progress">En progreso</option>
              <option value="in_review">En revisión</option>
              <option value="done">Completada</option>
              <option value="blocked">Bloqueada</option>
            </select>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Prioridad</p>
            <select
              value={task.priority}
              onChange={(e) => handlePriorityChange(e.target.value as TaskPriority)}
              className="h-8 rounded border border-input bg-background px-2 text-sm"
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Tipo</p>
            <Badge variant="secondary">{task.type}</Badge>
          </div>

          {task.dueDate && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Fecha límite</p>
              <p className="text-sm">
                {new Date(task.dueDate).toLocaleDateString('es', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          )}
        </div>

        {/* Tags */}
        {task.tags?.length > 0 && (
          <div className="py-3 border-b">
            <p className="text-xs text-muted-foreground mb-2">Tags</p>
            <div className="flex flex-wrap gap-1">
              {task.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Adjuntos */}
        <div className="py-3 border-b">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Paperclip className="h-3.5 w-3.5" /> Adjuntos
          </p>
          <TaskAttachments task={task} />
        </div>

        {/* Meta info */}
        <div className="pt-3 text-xs text-muted-foreground space-y-1">
          <p>Creada: {new Date(task.createdAt).toLocaleString('es')}</p>
          <p>Actualización: {new Date(task.updatedAt).toLocaleString('es')}</p>
          {task.completedDate && (
            <p>Completada: {new Date(task.completedDate).toLocaleString('es')}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
