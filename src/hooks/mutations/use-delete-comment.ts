'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
<<<<<<< HEAD
import { toast } from 'sonner';
=======
>>>>>>> a202b269733a744a9afd9d9fab9b95249e4de8bb
import { commentsApi } from '@/lib/api/comments';
import { commentKeys } from '@/hooks/queries/use-comments-query';
import { taskKeys } from '@/hooks/queries/use-tasks-query';
import type { Comment, Task } from '@/types/domain/task';

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, taskId: _taskId }: { commentId: string; taskId: string }) =>
      commentsApi.delete(commentId),
    onMutate: async ({ commentId, taskId }) => {
      await queryClient.cancelQueries({ queryKey: commentKeys.byTask(taskId) });
      await queryClient.cancelQueries({ queryKey: taskKeys.all });

      const previousComments = queryClient.getQueryData<Comment[]>(commentKeys.byTask(taskId));

      queryClient.setQueryData<Comment[]>(commentKeys.byTask(taskId), (old) => {
        if (!old) return old;
        return old.filter((c) => c.id !== commentId);
      });

      // Decrementar commentCount en la tarea
      queryClient.setQueriesData<Task[]>({ queryKey: taskKeys.all }, (old) => {
        if (!old) return old;
        return old.map((task) => {
          if (task.id === taskId) {
            return { ...task, commentCount: Math.max(0, task.commentCount - 1) };
          }
          return task;
        });
      });

      return { previousComments };
    },
<<<<<<< HEAD
    onSuccess: () => {
      toast.success('Comentario eliminado');
    },
    onError: (err, { taskId }, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(commentKeys.byTask(taskId), context.previousComments);
      }
      toast.error('Error al eliminar comentario', { description: (err as Error).message });
=======
    onError: (_err, { taskId }, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(commentKeys.byTask(taskId), context.previousComments);
      }
>>>>>>> a202b269733a744a9afd9d9fab9b95249e4de8bb
    },
    onSettled: (_data, _error, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byTask(taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
