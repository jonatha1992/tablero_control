'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeEntriesApi, type CreateTimeEntryBody, type TimeEntry } from '@/lib/api/time-entries';

export const timeEntryKeys = {
  all: ['timeEntries'] as const,
  byTask: (taskId: string) => [...timeEntryKeys.all, 'byTask', taskId] as const,
};

export function useTimeEntriesQuery(taskId: string) {
  return useQuery({
    queryKey: timeEntryKeys.byTask(taskId),
    queryFn: async (): Promise<TimeEntry[]> => {
      if (!taskId) return [];
      return timeEntriesApi.getByTask(taskId);
    },
    enabled: !!taskId,
  });
}

export function useCreateTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: CreateTimeEntryBody }) =>
      timeEntriesApi.create(taskId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.byTask(variables.taskId) });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, taskId: _taskId }: { id: string; taskId: string }) =>
      timeEntriesApi.delete(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.byTask(variables.taskId) });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
