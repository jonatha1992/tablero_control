'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUpdateTask } from '@/hooks/mutations/use-update-task';
import { useMoveTask } from '@/hooks/mutations/use-move-task';
import { useDeleteTask } from '@/hooks/mutations/use-delete-task';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useMembersQuery } from '@/hooks/queries/use-members-query';
import { useLocationsQuery } from '@/hooks/queries/use-locations-query';
import { useProjectsQuery } from '@/hooks/queries/use-projects-query';
import { useAuth } from '@/hooks/auth-context';
import type { Task, TaskStatus, TaskPriority, TaskType } from '@/types';
import { Trash, Paperclip, Users, X, Repeat, MapPin, Save, ChevronDown, FolderKanban, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskAttachments } from './task-attachments';
import { TaskComments } from './task-comments';
import { TaskChecklist } from './task-checklist';
import { TaskSubtasks } from './task-subtasks';
import { TaskTimeTracking } from './task-time-tracking';
import type { RecurrenceConfig } from '@/types';
import { STATUS_OPTIONS, PRIORITY_OPTIONS, TYPE_OPTIONS } from '@/lib/constants/task-colors';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailModal({ task, open, onOpenChange }: TaskDetailModalProps) {
  const [subtaskOpen, setSubtaskOpen] = useState<Task | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editingAssignees, _setEditingAssignees] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [editLocationId, setEditLocationId] = useState('');
  const [editProjectId, setEditProjectId] = useState('');
  const [editAssigneeIds, setEditAssigneeIds] = useState<string[]>([]);
  const [editDueDate, setEditDueDate] = useState('');
  const [editDueTime, setEditDueTime] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurrenceConfig['frequency']>('weekly');
  const [interval, setIntervalValue] = useState(1);
  const [dayOfWeek, setDayOfWeek] = useState<number | undefined>(undefined);
  const [dayOfMonth, setDayOfMonth] = useState<number | undefined>(undefined);

  const updateTask = useUpdateTask();
  const moveTask = useMoveTask();
  const deleteTask = useDeleteTask();
  const { data: members = [] } = useMembersQuery();
  const { data: locations = [] } = useLocationsQuery();
  const { user } = useAuth();
  const { data: projects = [] } = useProjectsQuery(user?.businessId ?? '');

  if (!task) return null;

  const handleSave = () => {
    if (!title.trim()) return;
    updateTask.mutate(
      {
        id: task.id,
        data: {
          title,
          description,
          locationId: editLocationId || undefined,
          projectId: editProjectId || undefined,
          assigneeIds: editAssigneeIds,
          dueDate: editDueDate ? new Date(`${editDueDate}T${editDueTime || '00:00'}`) : undefined,
          recurrence: isRecurring ? {
            frequency,
            interval,
            dayOfWeek: frequency === 'weekly' ? dayOfWeek : undefined,
            dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined
          } : undefined
        }
      },
      { onSuccess: () => setEditing(false) }
    );
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    moveTask.mutate({ taskId: task.id, newStatus });
  };

  const handleDelete = () => {
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = () => {
    deleteTask.mutate(task.id, {
      onSuccess: () => {
        setShowConfirmDelete(false);
        onOpenChange(false);
      }
    });
  };

  const handlePriorityChange = (priority: TaskPriority) => {
    updateTask.mutate({ id: task.id, data: { priority } });
  };

  const handleTypeChange = (type: TaskType) => {
    updateTask.mutate({ id: task.id, data: { type } });
  };

  const toggleAssignee = (memberId: string) => {
    const current = task.assigneeIds ?? [];
    const next = current.includes(memberId)
      ? current.filter((id) => id !== memberId)
      : [...current, memberId];
    updateTask.mutate({ id: task.id, data: { assigneeIds: next } });
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4">
        <DialogHeader>
          <div className="pr-6">
            <div className="flex items-center gap-2 mb-0.5">
              <DialogTitle className={cn("text-xl leading-tight", editing && "sr-only")}>
                {editing ? `Editando: ${title}` : task.title}
              </DialogTitle>
              <span className="font-mono text-xs text-muted-foreground/60 shrink-0">
                #{task.id.slice(0, 6).toUpperCase()}
              </span>
            </div>
            <DialogDescription className={cn("mt-1", editing && "sr-only")}>
              {task.description || 'Detalles de la tarea seleccionada.'}
            </DialogDescription>
          </div>
          {editing ? (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Título</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  className="w-full text-lg font-medium bg-muted/30 rounded-lg px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descripción</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={2000}
                  className="w-full text-sm bg-muted/30 rounded-lg px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-primary/20"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fecha límite</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm"
                  />
                  <input
                    type="time"
                    value={editDueTime}
                    onChange={(e) => setEditDueTime(e.target.value)}
                    className="flex h-9 w-24 rounded-md border border-input bg-background px-2 py-1 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> Sector / Local
                </label>
                <select
                  value={editLocationId}
                  onChange={(e) => setEditLocationId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="">Sin sector</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <FolderKanban className="h-3.5 w-3.5" /> Tablero
                </label>
                <select
                  value={editProjectId}
                  onChange={(e) => setEditProjectId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="">Sin tablero</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>{proj.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> Asignados
                </label>
                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto border rounded-md p-1">
                  {members.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-2 py-1">Sin miembros disponibles</p>
                  ) : (
                    members.map((m) => {
                      const checked = editAssigneeIds.includes(m.id);
                      return (
                        <label key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => setEditAssigneeIds(checked ? editAssigneeIds.filter((id) => id !== m.id) : [...editAssigneeIds, m.id])}
                            className="rounded border-input h-4 w-4"
                          />
                          <Avatar className="h-5 w-5 shrink-0">
                            {m.avatar && <AvatarImage src={m.avatar} alt={m.name} />}
                            <AvatarFallback className="text-[9px]">{m.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span>{m.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                    />
                    <Repeat className="h-4 w-4" /> Tarea repetitiva
                  </label>
                </div>

                {isRecurring && (
                  <div className="grid grid-cols-2 gap-3 pl-6">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Frecuencia</label>
                      <select
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value as RecurrenceConfig['frequency'])}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      >
                        <option value="daily">Diaria</option>
                        <option value="weekly">Semanal</option>
                        <option value="biweekly">Quincenal</option>
                        <option value="monthly">Mensual</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Cada (intervalo)</label>
                      <input
                        type="number"
                        min={1}
                        value={interval}
                        onChange={(e) => setIntervalValue(Number(e.target.value))}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      />
                    </div>

                    {frequency === 'weekly' && (
                      <div className="col-span-2">
                        <label className="text-xs text-muted-foreground mb-1 block">Día de la semana</label>
                        <select
                          value={dayOfWeek ?? ''}
                          onChange={(e) => setDayOfWeek(e.target.value ? Number(e.target.value) : undefined)}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                        >
                          <option value="">Cualquier día</option>
                          <option value="1">Lunes</option>
                          <option value="2">Martes</option>
                          <option value="3">Miércoles</option>
                          <option value="4">Jueves</option>
                          <option value="5">Viernes</option>
                          <option value="6">Sábado</option>
                          <option value="0">Domingo</option>
                        </select>
                      </div>
                    )}

                    {frequency === 'monthly' && (
                      <div className="col-span-2">
                        <label className="text-xs text-muted-foreground mb-1 block">Día del mes (1-31)</label>
                        <input
                          type="number"
                          min={1}
                          max={31}
                          placeholder="Ej: 1"
                          value={dayOfMonth ?? ''}
                          onChange={(e) => setDayOfMonth(e.target.value ? Number(e.target.value) : undefined)}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="flex items-center gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setTitle(task.title);
                  setDescription(task.description);
                  const d = task.dueDate ? new Date(task.dueDate) : null;
                  setEditDueDate(d ? d.toISOString().split('T')[0] : '');
                  const h = d ? d.getHours() : 0;
                  const m = d ? d.getMinutes() : 0;
                  setEditDueTime(d && (h !== 0 || m !== 0) ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` : '');
                  setEditLocationId(task.locationId ?? '');
                  setEditProjectId(task.projectId ?? '');
                  setEditAssigneeIds(task.assigneeIds ?? []);
                  setIsRecurring(!!task.recurrence);
                  setFrequency(task.recurrence?.frequency ?? 'weekly');
                  setIntervalValue(task.recurrence?.interval ?? 1);
                  setDayOfWeek(task.recurrence?.dayOfWeek);
                  setDayOfMonth(task.recurrence?.dayOfMonth);
                  setEditing(true);
                }}
              >
                Editar
              </Button>
              {task.status === 'done' && (
                <Button
                  size="icon"
                  variant="outline"
                  className="h-9 w-9"
                  onClick={() => moveTask.mutate({ taskId: task.id, newStatus: 'archived' })}
                  title="Archivar tarea"
                >
                  <Archive className="h-4 w-4" />
                </Button>
              )}
              <Button size="icon" variant="destructive" className="h-9 w-9" onClick={handleDelete} disabled={deleteTask.isPending}>
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          )}
        </DialogHeader>

        {!editing && (
        <>
        {/* Status & Priority */}
        <div className="flex flex-wrap gap-3 py-3 border-y">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Estado</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-2 h-8 px-2.5 text-sm border border-input rounded-md bg-background hover:bg-accent">
                  <span className={cn('h-2 w-2 rounded-full shrink-0', STATUS_OPTIONS.find(o => o.value === task.status)?.dot)} />
                  {STATUS_OPTIONS.find(o => o.value === task.status)?.label}
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {STATUS_OPTIONS.map(opt => (
                  <DropdownMenuItem key={opt.value} onClick={() => handleStatusChange(opt.value)} className="gap-2">
                    <span className={cn('h-2 w-2 rounded-full shrink-0', opt.dot)} />
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Prioridad</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-2 h-8 px-2.5 text-sm border border-input rounded-md bg-background hover:bg-accent">
                  <span className={cn('h-2 w-2 rounded-full shrink-0', PRIORITY_OPTIONS.find(o => o.value === task.priority)?.dot)} />
                  {PRIORITY_OPTIONS.find(o => o.value === task.priority)?.label}
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {PRIORITY_OPTIONS.map(opt => (
                  <DropdownMenuItem key={opt.value} onClick={() => handlePriorityChange(opt.value)} className="gap-2">
                    <span className={cn('h-2 w-2 rounded-full shrink-0', opt.dot)} />
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Tipo</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-2 h-8 px-2.5 text-sm border border-input rounded-md bg-background hover:bg-accent">
                  <span className={cn('h-2 w-2 rounded-full shrink-0', TYPE_OPTIONS.find(o => o.value === task.type)?.dot)} />
                  {TYPE_OPTIONS.find(o => o.value === task.type)?.label ?? task.type}
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {TYPE_OPTIONS.map(opt => (
                  <DropdownMenuItem key={opt.value} onClick={() => handleTypeChange(opt.value)} className="gap-2">
                    <span className={cn('h-2 w-2 rounded-full shrink-0', opt.dot)} />
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {task.dueDate && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Fecha límite</p>
              <p className="text-sm">
                {new Date(task.dueDate).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                {(() => { const d = new Date(task.dueDate); return (d.getHours() !== 0 || d.getMinutes() !== 0) ? <span className="text-muted-foreground ml-1.5">· {d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</span> : null; })()}
              </p>
            </div>
          )}

          {task.recurrence && (
            <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md self-center">
              <Repeat className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">
                Se repite cada {task.recurrence.interval > 1 ? `${task.recurrence.interval} ` : ''}
                {task.recurrence.frequency === 'daily' ? 'día' :
                 task.recurrence.frequency === 'weekly' ? 'semana' :
                 task.recurrence.frequency === 'biweekly' ? 'quincena' : 'mes'}
                {task.recurrence.dayOfWeek !== undefined && ` los ${['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'][task.recurrence.dayOfWeek]}`}
                {task.recurrence.dayOfMonth !== undefined && ` el día ${task.recurrence.dayOfMonth}`}
              </span>
            </div>
          )}

          {task.locationId && locations.find((l) => l.id === task.locationId) && (
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> Sector
              </p>
              <p className="text-sm">
                {locations.find((l) => l.id === task.locationId)!.name}
              </p>
            </div>
          )}

          {task.projectId && projects.find((p) => p.id === task.projectId) && (
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <FolderKanban className="h-3.5 w-3.5" /> Tablero
              </p>
              <p className="text-sm">
                {projects.find((p) => p.id === task.projectId)!.name}
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
                    <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Checklist */}
            <div className="py-3 border-b">
              <TaskChecklist task={task} />
            </div>

            {/* Subtareas */}
            <div className="py-3 border-b">
              <TaskSubtasks task={task} onOpenSubtask={(sub) => setSubtaskOpen(sub)} />
            </div>

            {/* Registro de tiempos */}
            <div className="py-3 border-b">
              <TaskTimeTracking
                taskId={task.id}
                estimatedHours={task.estimatedHours}
                actualHours={task.actualHours}
              />
            </div>

          {/* Current assignees */}
          {task.assigneeIds?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {task.assigneeIds.map((id) => {
                const a = task.assignees?.find((x) => x.id === id);
                const member = members.find((m) => m.id === id);
                const name = a?.name ?? member?.name ?? id;
                const avatar = a?.avatar ?? member?.avatar;
                const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <div key={id} className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm bg-muted/50">
                    <Avatar className="h-6 w-6">
                      {avatar && <AvatarImage src={avatar} alt={name} />}
                      <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                    </Avatar>
                    {name.split(' ')[0]}
                    {editingAssignees && (
                      <button onClick={() => toggleAssignee(id)} className="ml-0.5 text-muted-foreground hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
        )}

        {/* Adjuntos */}
        <div className="py-3 border-b">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Paperclip className="h-3.5 w-3.5" /> Adjuntos
          </p>
          <TaskAttachments task={task} />
        </div>

        {/* Comentarios */}
        <div className="py-3 border-b">
          <TaskComments task={task} />
        </div>

        {/* Meta info */}
        <div className="pt-3 text-xs text-muted-foreground space-y-1">
          <p>Creada: {new Date(task.createdAt).toLocaleString('es')}</p>
          <p>Actualización: {new Date(task.updatedAt).toLocaleString('es')}</p>
          {task.completedDate && <p>Completada: {new Date(task.completedDate).toLocaleString('es')}</p>}
        </div>

        </div>

        {/* Save/Cancel footer — outside scroll area, always visible */}
        {editing && (
          <div className="shrink-0 flex gap-2 px-6 py-3 border-t bg-background">
            <Button size="sm" onClick={handleSave} disabled={updateTask.isPending} className="gap-1.5">
              <Save className="h-3.5 w-3.5" />
              {updateTask.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        )}
      </DialogContent>

      <ConfirmDialog
        open={showConfirmDelete}
        onOpenChange={setShowConfirmDelete}
        title="Eliminar tarea"
        description={`¿Estás seguro de eliminar la tarea "${task.title}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
        variant="destructive"
        loading={deleteTask.isPending}
      />
    </Dialog>

    {/* Modal anidado para subtarea */}
    <TaskDetailModal
      task={subtaskOpen}
      open={!!subtaskOpen}
      onOpenChange={(o) => { if (!o) setSubtaskOpen(null); }}
    />
    </>
  );
}
