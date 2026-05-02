'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { tasksApi } from '@/lib/api/tasks';
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
    mutationFn: async (tasks: ExtractedTask[]) => {
      const results = [];
      for (const t of tasks) {
        const dto: CreateTaskDTO = {
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          type: t.type,
          assigneeIds: t.assigneeIds,
          tags: t.tags,
          estimatedHours: t.estimatedHours,
          dueDate: t.dueDate
            ? new Date(`${t.dueDate}T${t.dueTime ?? '00:00'}`)
            : undefined,
          recurrence: t.recurrence ? {
            frequency: t.recurrence.frequency,
            interval: t.recurrence.interval,
            dayOfWeek: t.recurrence.dayOfWeek,
          } : undefined,
        };
        results.push(await tasksApi.create(dto, user!.id, user?.businessId ?? ''));
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
