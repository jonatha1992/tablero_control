'use client';

import { useCallback } from 'react';
import { useAuth } from '@/hooks/auth-context';
import { canUpdateTask } from '@/lib/task-update-access';

export function useCanUpdateTask() {
  const { user } = useAuth();

  const canUpdate = useCallback(
    (task?: {
      locationId?: string | null;
      assigneeIds?: string[];
      creatorId?: string;
    }) => canUpdateTask(user, task),
    [user],
  );

  return { canUpdateTask: canUpdate };
}
