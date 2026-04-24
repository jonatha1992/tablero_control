'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCreateTask } from '@/hooks/mutations/use-create-task';
import { useMembersQuery } from '@/hooks/queries/use-members-query';
import { X } from 'lucide-react';
import type { TaskStatus, TaskPriority, TaskType } from '@/types';

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStatus?: TaskStatus;
  defaultDueDate?: string;
}

export function CreateTaskModal({ open, onOpenChange, defaultStatus, defaultDueDate }: CreateTaskModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus ?? 'todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [type, setType] = useState<TaskType>('task');
  const [tags, setTags] = useState('');
  const [dueDate, setDueDate] = useState(defaultDueDate ?? today);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);

  const createTask = useCreateTask();
  const { data: members = [] } = useMembersQuery();

  const toggleAssignee = (id: string) => {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const reset = () => {
    setTitle(''); setDescription(''); setTags('');
    setDueDate(defaultDueDate ?? today); setAssigneeIds([]);
    setStatus(defaultStatus ?? 'todo'); setPriority('medium'); setType('task');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTask.mutate(
      {
        title, description, status, priority, type,
        assigneeIds,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        dueDate: dueDate ? new Date(dueDate) : undefined,
      },
      { onSuccess: () => { onOpenChange(false); reset(); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear Nueva Tarea</DialogTitle>
          <DialogDescription>
            Completa los detalles de la nueva tarea para tu equipo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la tarea"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe la tarea..."
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Estado</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="backlog">Backlog</option>
                <option value="todo">Por hacer</option>
                <option value="in_progress">En progreso</option>
                <option value="in_review">En revisión</option>
                <option value="done">Finalizado</option>
                <option value="blocked">Bloqueado</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Prioridad</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Tipo</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TaskType)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="task">Tarea</option>
                <option value="feature">Feature</option>
                <option value="bug">Bug</option>
                <option value="improvement">Mejora</option>
                <option value="documentation">Documentación</option>
              </select>
            </div>
          </div>

          {/* Asignados */}
          {members.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Asignados{assigneeIds.length > 0 && <span className="text-muted-foreground font-normal"> ({assigneeIds.length})</span>}
              </label>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => {
                  const selected = assigneeIds.includes(m.id);
                  const initials = m.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleAssignee(m.id)}
                      className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs transition-colors ${selected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-accent'
                        }`}
                    >
                      <Avatar className="h-4 w-4">
                        {m.avatar && <AvatarImage src={m.avatar} alt={m.name} />}
                        <AvatarFallback className="text-[8px]">{initials}</AvatarFallback>
                      </Avatar>
                      {m.name.split(' ')[0]}
                      {selected && <X className="h-3 w-3 ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Fecha límite</label>
              <input
                type="date"
                value={dueDate}
                min={today}
                onChange={(e) => setDueDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Tags (coma)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="frontend, ui, bug"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false); }}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!title || createTask.isPending}>
              {createTask.isPending ? 'Creando...' : 'Crear tarea'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
