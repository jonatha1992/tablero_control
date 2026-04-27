'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, Upload, Loader2, AlertCircle, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useDictateTasksUpload,
  useConfirmDictatedTasks,
} from '@/hooks/mutations/use-dictate-tasks';
import { useMembersQuery } from '@/hooks/queries/use-members-query';
import type { ExtractedTask } from '@/lib/groq/extract-tasks';
import type { TaskPriority, TaskStatus, TaskType } from '@/types/domain/task';

type Step = 'idle' | 'uploading' | 'preview' | 'creating';

interface DictateTasksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

const STATUS_LABELS: Record<string, string> = {
  todo: 'Por hacer',
  in_progress: 'En progreso',
};

const TYPE_LABELS: Record<TaskType, string> = {
  task: 'Tarea',
  feature: 'Feature',
  bug: 'Bug',
  improvement: 'Mejora',
  documentation: 'Documentación',
};

interface TaskPreviewCardProps {
  task: ExtractedTask;
  index: number;
  members: { id: string; name: string; avatar?: string }[];
  onChange: (updated: ExtractedTask) => void;
  onRemove: () => void;
}

function TaskPreviewCard({ task, members, onChange, onRemove }: TaskPreviewCardProps) {
  const priorityColors: Record<TaskPriority, string> = {
    low: 'border-l-slate-300',
    medium: 'border-l-blue-400',
    high: 'border-l-orange-400',
    urgent: 'border-l-red-500',
  };

  return (
    <div
      className={cn(
        'relative rounded-lg border border-border bg-card p-3 border-l-4',
        priorityColors[task.priority],
      )}
    >
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
        aria-label="Eliminar tarea"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <Input
        value={task.title}
        onChange={(e) => onChange({ ...task, title: e.target.value })}
        className="mb-2 h-7 text-sm font-medium border-0 border-b rounded-none px-0 focus-visible:ring-0 bg-transparent pr-6"
        placeholder="Título de la tarea"
      />

      <div className="flex flex-wrap gap-2 text-xs">
        <select
          value={task.priority}
          onChange={(e) => onChange({ ...task, priority: e.target.value as TaskPriority })}
          className="rounded border border-border bg-background px-1.5 py-0.5 text-xs"
        >
          {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </option>
          ))}
        </select>

        <select
          value={task.status}
          onChange={(e) =>
            onChange({ ...task, status: e.target.value as Extract<TaskStatus, 'todo' | 'in_progress'> })
          }
          className="rounded border border-border bg-background px-1.5 py-0.5 text-xs"
        >
          {Object.entries(STATUS_LABELS).map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={task.type}
          onChange={(e) => onChange({ ...task, type: e.target.value as TaskType })}
          className="rounded border border-border bg-background px-1.5 py-0.5 text-xs"
        >
          {(Object.keys(TYPE_LABELS) as TaskType[]).map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>

        {task.dueDate && (
          <span className="rounded border border-border bg-background px-1.5 py-0.5">
            {task.dueDate}
          </span>
        )}
      </div>

      {members.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {members.map((m) => {
            const assigned = task.assigneeIds.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() =>
                  onChange({
                    ...task,
                    assigneeIds: assigned
                      ? task.assigneeIds.filter((id) => id !== m.id)
                      : [...task.assigneeIds, m.id],
                  })
                }
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs border transition-colors',
                  assigned
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:border-primary',
                )}
              >
                {m.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DictateTasksModal({ open, onOpenChange }: DictateTasksModalProps) {
  const [step, setStep] = useState<Step>('idle');
  const [transcription, setTranscription] = useState('');
  const [tasks, setTasks] = useState<ExtractedTask[]>([]);
  const [parseError, setParseError] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: membersData } = useMembersQuery();
  const members = (membersData ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    avatar: m.avatar,
  }));

  const uploadMutation = useDictateTasksUpload();
  const confirmMutation = useConfirmDictatedTasks();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setStep('uploading');
    uploadMutation.mutate(file, {
      onSuccess: (data) => {
        setTranscription(data.transcription);
        setTasks(data.tasks);
        setParseError(data.parseError);
        setStep('preview');
      },
      onError: () => setStep('idle'),
    });
  };

  const handleConfirm = () => {
    setStep('creating');
    confirmMutation.mutate(tasks, {
      onSuccess: () => handleClose(),
      onError: () => setStep('preview'),
    });
  };

  const handleClose = () => {
    if (step === 'uploading' || step === 'creating') return;
    setStep('idle');
    setTranscription('');
    setTasks([]);
    setParseError(false);
    setTranscriptOpen(false);
    onOpenChange(false);
  };

  const updateTask = (index: number, updated: ExtractedTask) =>
    setTasks((prev) => prev.map((t, i) => (i === index ? updated : t)));

  const removeTask = (index: number) =>
    setTasks((prev) => prev.filter((_, i) => i !== index));

  const isLocked = step === 'uploading' || step === 'creating';

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-lg" onInteractOutside={(e) => { if (isLocked) e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            Dictar tareas
          </DialogTitle>
          <DialogDescription>
            {step === 'idle' && 'Subí un audio y la IA extraerá las tareas automáticamente.'}
            {step === 'uploading' && 'Procesando el audio con IA…'}
            {step === 'preview' && `Se encontraron ${tasks.length} tarea${tasks.length !== 1 ? 's' : ''}. Revisá y confirmá.`}
            {step === 'creating' && 'Creando las tareas en el tablero…'}
          </DialogDescription>
        </DialogHeader>

        {step === 'idle' && (
          <div
            className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary hover:bg-primary/5"
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Seleccioná un archivo de audio</p>
              <p className="mt-1 text-xs text-muted-foreground">
                MP3, WAV, M4A, OGG, FLAC, WEBM — máx 25 MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {step === 'uploading' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Transcribiendo audio con IA…</p>
          </div>
        )}

        {step === 'preview' && (
          <div className="flex flex-col gap-3">
            {parseError && (
              <div className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>No pudimos detectar tareas en el audio. Podés crear las tareas manualmente.</span>
              </div>
            )}

            {tasks.length > 0 ? (
              <div className="flex max-h-80 flex-col gap-2 overflow-y-auto pr-1">
                {tasks.map((task, i) => (
                  <TaskPreviewCard
                    key={i}
                    task={task}
                    index={i}
                    members={members}
                    onChange={(updated) => updateTask(i, updated)}
                    onRemove={() => removeTask(i)}
                  />
                ))}
              </div>
            ) : (
              !parseError && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No se detectaron tareas. Intentá con otro audio.
                </p>
              )
            )}

            {transcription && (
              <div className="rounded-md border border-border">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => setTranscriptOpen((v) => !v)}
                >
                  Ver transcripción
                  <ChevronDown
                    className={cn('h-3.5 w-3.5 transition-transform', transcriptOpen && 'rotate-180')}
                  />
                </button>
                {transcriptOpen && (
                  <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
                    {transcription}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {step === 'creating' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Creando {tasks.length} tarea{tasks.length !== 1 ? 's' : ''}…
            </p>
          </div>
        )}

        <DialogFooter>
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              {tasks.length > 0 && (
                <Button onClick={handleConfirm}>
                  Crear {tasks.length} tarea{tasks.length !== 1 ? 's' : ''}
                </Button>
              )}
            </>
          )}
          {step === 'idle' && (
            <Button variant="outline" onClick={handleClose}>
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
