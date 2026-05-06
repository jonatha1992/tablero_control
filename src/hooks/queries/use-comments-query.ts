'use client';

import { useQuery } from '@tanstack/react-query';
import { commentsApi } from '@/lib/api/comments';
import type { Comment } from '@/types/domain/task';

export const commentKeys = {
  all: ['comments'] as const,
  byTask: (taskId: string) => [...commentKeys.all, 'byTask', taskId] as const,
};

export function useCommentsQuery(taskId: string) {
  return useQuery({
    queryKey: commentKeys.byTask(taskId),
    queryFn: async (): Promise<Comment[]> => {
      if (!taskId) return [];
      try {
        return await commentsApi.getByTask(taskId);
      } catch (e) {
        console.error('[useCommentsQuery] Error:', e);
        return [];
      }
    },
    enabled: !!taskId,
  });
}
