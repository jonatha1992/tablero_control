'use client';

import { useState, useRef, useEffect } from 'react';
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
import { useLocationsQuery } from '@/hooks/queries/use-locations-query';
import { useProjectsQuery } from '@/hooks/queries/use-projects-query';
import { useCyclesQuery } from '@/hooks/queries/use-cycles-query';
import { useAuth } from '@/hooks/auth-context';
import { useKanbanUIStore } from '@/stores/kanban-ui.store';
import { useScrumUIStore } from '@/stores/scrum-ui.store';
import { X, MapPin, Repeat, Mic, MicOff, Loader2, ChevronDown, Check, FolderKanban, Timer } from 'lucide-react';
import { tasksApi } from '@/lib/api/tasks';
import { getToken } from '@/lib/firebase/auth';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import type { TaskStatus, TaskPriority, TaskType, RecurrenceConfig } from '@/types';
import { STATUS_OPTIONS, PRIORITY_OPTIONS, TYPE_OPTIONS, type SelectOption } from '@/lib/constants/task-colors';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function ColoredSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (v: T) => void;
}) {
  const selected = options.find((o) => o.value === value) ?? options[0];

  return (
    <div>
      <label className="text-sm font-medium mb-1 block">{label}</label>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className={cn('h-2 w-2 rounded-full shrink-0', selected.dot)} />
              {selected.label}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-[var(--radix-dropdown-menu-trigger-width)]">
          {options.map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className="gap-2"
            >
              <span className={cn('h-2 w-2 rounded-full shrink-0', opt.dot)} />
              {opt.label}
              {opt.value === value && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStatus?: TaskStatus;
  defaultDueDate?: string;
  initialDate?: Date;
}

export function CreateTaskModal({ open, onOpenChange, defaultStatus, defaultDueDate, initialDate }: CreateTaskModalProps) {
  const today = initialDate?.toISOString().split('T')[0] ?? new Date().toISOString().split('T')[0];
  const { activeColumns } = useKanbanUIStore();
  const visibleStatusOptions = STATUS_OPTIONS.filter((o) => activeColumns.includes(o.value));
  const resolvedDefault: TaskStatus =
    defaultStatus && activeColumns.includes(defaultStatus)
      ? defaultStatus
      : (activeColumns[0] ?? 'todo');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(resolvedDefault);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [type, setType] = useState<TaskType>('task');
  const [tags, setTags] = useState('');
  const [dueDate, setDueDate] = useState(defaultDueDate ?? today);
  const [dueTime, setDueTime] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [locationId, setLocationId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [cycleId, setCycleId] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurrenceConfig['frequency']>('weekly');
  const [interval, setIntervalValue] = useState(1);
  const [dayOfWeek, setDayOfWeek] = useState<number | undefined>(undefined);
  const [dayOfMonth, setDayOfMonth] = useState<number | undefined>(undefined);
  const [estimatedHours, setEstimatedHours] = useState<number | undefined>(undefined);
  const [micState, setMicState] = useState<'idle' | 'recording' | 'processing'>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const createTask = useCreateTask();
  const { data: members = [] } = useMembersQuery();
  const { data: locations = [] } = useLocationsQuery();
  const { user } = useAuth();
  const { data: projects = [] } = useProjectsQuery(user?.businessId ?? '');
  const { data: cycles = [] } = useCyclesQuery(user?.businessId ?? '');
  const { selectedSprintId, viewMode: sprintMode } = useScrumUIStore();

  useEffect(() => {
    if (open && sprintMode === 'board' && selectedSprintId) {
      setCycleId(selectedSprintId);
    } else if (open) {
      setCycleId('');
    }
  }, [open, sprintMode, selectedSprintId]);

  const toggleAssignee = (id: string) => {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const reset = () => {
    setTitle(''); setDescription(''); setTags('');
    setDueDate(defaultDueDate ?? today); setDueTime(''); setAssigneeIds([]);
    setStatus(defaultStatus ?? 'todo'); setPriority('medium'); setType('task');
    setLocationId(''); setProjectId(''); setCycleId('');
    setEstimatedHours(undefined);
    setIsRecurring(false); setFrequency('weekly'); setIntervalValue(1);
    setDayOfWeek(undefined); setDayOfMonth(undefined);
  };

  const handleMicClick = async () => {
    if (micState === 'recording') {
      mediaRecorderRef.current?.stop();
      return;
    }
    if (micState === 'processing') return;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error('No se pudo acceder al micrófono');
      return;
    }

    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      setMicState('processing');
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const file = new File([blob], 'dictado.webm', { type: 'audio/webm' });
      try {
        const token = await getToken();
        if (!token) throw new Error('No autenticado');
        const result = await tasksApi.fromAudio(file, token);
        const task = result.tasks[0];
        if (task) {
          setTitle(task.title);
          if (task.description) setDescription(task.description);
          if (task.priority) setPriority(task.priority);
          if (task.type) setType(task.type);
          if (task.tags?.length) setTags(task.tags.join(', '));
          if (task.dueDate) setDueDate(task.dueDate);
          if (task.dueTime) setDueTime(task.dueTime);
          if (task.assigneeIds?.length) setAssigneeIds(task.assigneeIds);
          if (task.estimatedHours) setEstimatedHours(task.estimatedHours);
          toast.success('Formulario completado por IA');
        } else {
          toast.warning('No se detectó ninguna tarea en el audio');
        }
      } catch (err) {
        toast.error('Error al procesar el audio', {
          description: err instanceof Error ? err.message : undefined,
        });
      } finally {
        setMicState('idle');
      }
    };

    recorder.start();
    setMicState('recording');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createTask.mutate(
      {
        title, description, status, priority, type,
        assigneeIds,
        locationId: locationId || undefined,
        projectId: projectId || undefined,
        cycleId: cycleId || undefined,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        estimatedHours: estimatedHours || undefined,
        dueDate: dueDate ? new Date(`${dueDate}T${dueTime || '00:00'}`) : undefined,
        recurrence: isRecurring ? {
          frequency,
          interval,
          dayOfWeek: frequency === 'weekly' ? dayOfWeek : undefined,
          dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined
        } : undefined,
      },
      { onSuccess: () => { onOpenChange(false); reset(); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg flex flex-col max-h-[90vh]">
        <DialogHeader className="shrink-0">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>Crear Nueva Tarea</DialogTitle>
            <button
              type="button"
              onClick={handleMicClick}
              title={micState === 'recording' ? 'Detener grabación' : 'Dictar tarea por voz'}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all shadow-sm',
                micState === 'recording'
                  ? 'bg-red-600 text-white animate-pulse ring-2 ring-red-500 ring-offset-2 ring-offset-background'
                  : micState === 'processing'
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600'
              )}
            >
              {micState === 'processing' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : micState === 'recording' ? (
                <MicOff className="h-3.5 w-3.5" />
              ) : (
                <Mic className="h-3.5 w-3.5" />
              )}
              {micState === 'recording' ? 'Detener' : micState === 'processing' ? 'Procesando…' : 'Dictar'}
            </button>
          </div>
          <DialogDescription>
            {micState === 'recording'
              ? 'Grabando… hablá y describí la tarea.'
              : 'Completá los detalles o dictá la tarea por voz.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="overflow-y-auto flex-1 space-y-4 pr-1">
          <div>
            <label className="text-sm font-medium mb-1 block">Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la tarea"
              required
              maxLength={200}
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
              maxLength={2000}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <ColoredSelect
              label="Estado"
              value={status}
              options={visibleStatusOptions.length > 0 ? visibleStatusOptions : STATUS_OPTIONS}
              onChange={setStatus}
            />
            <ColoredSelect
              label="Prioridad"
              value={priority}
              options={PRIORITY_OPTIONS}
              onChange={setPriority}
            />
            <ColoredSelect
              label="Tipo"
              value={type}
              options={TYPE_OPTIONS}
              onChange={setType}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> Local/Sector (Opcional)
            </label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Sin asignar (Global)</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block flex items-center gap-1">
              <FolderKanban className="h-3.5 w-3.5" /> Tablero (Opcional)
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Sin asignar</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name}
                </option>
              ))}
            </select>
          </div>

          {cycles.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                <Timer className="h-3.5 w-3.5" /> Período/Sprint (Opcional)
              </label>
              <select
                value={cycleId}
                onChange={(e) => setCycleId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Sin período</option>
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.status === 'active' ? ' ●' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

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

          <div className="grid grid-cols-3 gap-3">
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
              <label className="text-sm font-medium mb-1 block">Hora</label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-2 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Horas est.</label>
              <input
                type="number"
                min={0.5}
                max={99}
                step={0.5}
                value={estimatedHours ?? ''}
                onChange={(e) => setEstimatedHours(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="ej: 3"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="col-span-3">
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
                      <option value="">Cualquier día (7 días desde el anterior)</option>
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
          <DialogFooter className="shrink-0 pt-4">
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false); }}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!title.trim() || createTask.isPending}>
              {createTask.isPending ? 'Creando...' : 'Crear tarea'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
