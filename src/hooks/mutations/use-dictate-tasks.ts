'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { tasksApi } from '@/lib/api/tasks';
import { subtasksApi } from '@/lib/api/subtasks';
import { taskKeys } from '@/hooks/queries/use-tasks-query';
import { useAuth } from '@/hooks/auth-context';
import { getToken } from '@/lib/firebase/auth';
import type { ExtractedTask } from '@/lib/groq/extract-tasks';
import type { CreateTaskDTO } from '@/types/dto/task.dto';

export interface FromAudioResult {
  transcription: string;
  tasks: ExtractedTask[];
  parseError: boolean;
}

export interface FromTextResult {
  tasks: ExtractedTask[];
  parseError: boolean;
}

export interface ConfirmTasksOptions {
  /** Override when task has no projectId */
  defaultProjectId?: string;
  /** Override when task has no cycleId */
  defaultCycleId?: string;
}

function toCreateDto(t: ExtractedTask, opts: ConfirmTasksOptions): CreateTaskDTO {
  return {
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    type: t.type,
    assigneeIds: t.assigneeIds,
    tags: t.tags,
    estimatedHours: t.estimatedHours,
    locationId: t.locationId,
    projectId: t.projectId ?? opts.defaultProjectId,
    cycleId: t.cycleId ?? opts.defaultCycleId,
    objectiveId: t.objectiveId,
    checklist: t.checklist?.length ? t.checklist : undefined,
    dueDate: t.dueDate
      ? new Date(`${t.dueDate}T${t.dueTime ?? '00:00'}`)
      : undefined,
    recurrence: t.recurrence
      ? {
          frequency: t.recurrence.frequency,
          interval: t.recurrence.interval,
          dayOfWeek: t.recurrence.dayOfWeek,
          dayOfMonth: t.recurrence.dayOfMonth,
        }
      : undefined,
  };
}

export function useDictateTasksUpload() {
  return useMutation({
    mutationFn: async (audioFile: File): Promise<FromAudioResult> => {
      const token = await getToken();
      if (!token) throw new Error('No autenticado');
      return tasksApi.fromAudio(audioFile, token);
    },
    onError: (err: Error) => {
      toast.error('Error al procesar el audio', { description: err.message });
    },
  });
}

export function useDictateTasksFromText() {
  return useMutation({
    mutationFn: async (text: string): Promise<FromTextResult> => {
      return tasksApi.fromText(text);
    },
    onError: (err: Error) => {
      toast.error('Error al procesar el texto', { description: err.message });
    },
  });
}

export function useConfirmDictatedTasks() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      tasks,
      options = {},
    }: {
      tasks: ExtractedTask[];
      options?: ConfirmTasksOptions;
    }) => {
      const results = [];
      for (const t of tasks) {
        const dto = toCreateDto(t, options);
        const created = await tasksApi.create(dto, user!.id, user?.businessId ?? '');
        if (t.subtasks?.length) {
          for (const subTitle of t.subtasks) {
            await subtasksApi.create(created.id, subTitle);
          }
        }
        results.push(created);
      }
      return results;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      const n = created.length;
      toast.success(`${n} tarea${n !== 1 ? 's' : ''} creada${n !== 1 ? 's' : ''}`, {
        description: created.map((t) => t.title).join(', '),
      });
    },
    onError: (err: Error) => {
      toast.error('Error al crear las tareas', { description: err.message });
    },
  });
}
