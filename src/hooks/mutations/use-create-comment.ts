'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { commentsApi } from '@/lib/api/comments';
import { commentKeys } from '@/hooks/queries/use-comments-query';
import { taskKeys } from '@/hooks/queries/use-tasks-query';
import type { Comment, Task } from '@/types/domain/task';

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, content, attachments }: { taskId: string; content: string; attachments?: string[] }) =>
      commentsApi.create(taskId, content, attachments),
    onMutate: async ({ taskId, content }) => {
      await queryClient.cancelQueries({ queryKey: commentKeys.byTask(taskId) });
      await queryClient.cancelQueries({ queryKey: taskKeys.all });

      const previousComments = queryClient.getQueryData<Comment[]>(commentKeys.byTask(taskId));

      // Optimistic update
      queryClient.setQueryData<Comment[]>(commentKeys.byTask(taskId), (old) => {
        if (!old) return old;
        const optimistic: Comment = {
          id: `optimistic-${Date.now()}`,
          taskId,
          authorId: 'me',
          content,
          attachments: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return [...old, optimistic];
      });

      // Incrementar commentCount en la tarea
      queryClient.setQueriesData<Task[]>({ queryKey: taskKeys.all }, (old) => {
        if (!old) return old;
        return old.map((task) => {
          if (task.id === taskId) {
            return { ...task, commentCount: task.commentCount + 1 };
          }
          return task;
        });
      });

      return { previousComments };
    },
    onError: (err, { taskId }, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(commentKeys.byTask(taskId), context.previousComments);
      }
      toast.error('Error al enviar comentario', { description: (err as Error).message });
    },
    onSettled: (_data, _error, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byTask(taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
