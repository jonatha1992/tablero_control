'use client';

import { useCallback } from 'react';
import { useAuth } from '@/hooks/auth-context';
import { canDeleteTask } from '@/lib/task-delete-access';

export function useCanDeleteTask() {
  const { user } = useAuth();

  const canDelete = useCallback(
    (task?: { locationId?: string | null }) => canDeleteTask(user, task),
    [user],
  );

  return {
    canDeleteTask: canDelete,
    canDeleteAny: canDeleteTask(user),
  };
}
