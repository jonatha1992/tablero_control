'use client';

import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api/tasks';
import { useAuth } from '@/hooks/auth-context';
import type { Task, TaskFilters } from '@/types/domain/task';

export const taskKeys = {
  all: ['tasks'] as const,
  byBusiness: (businessId: string, filters?: TaskFilters) =>
    [...taskKeys.all, 'byBusiness', businessId, filters] as const,
  detail: (id: string) => [...taskKeys.all, 'detail', id] as const,
};

const MOCK_TASKS: Task[] = [
  {
    id: 'mock-1', title: 'Diseñar interfaz gráfica', description: 'Crear vistas principales en Figma', status: 'todo',
    priority: 'high', type: 'feature', assigneeIds: ['user-1'], creatorId: 'admin-1', tags: ['design', 'ui'], position: 0,
    subtaskIds: [], attachmentUrls: [], commentCount: 3, createdAt: new Date(), updatedAt: new Date(), businessId: 'demo'
  },
  {
    id: 'mock-2', title: 'Configurar base de datos', description: 'Migrar estructura antigua a Firestore.', status: 'in_progress',
    priority: 'urgent', type: 'task', assigneeIds: ['user-2'], creatorId: 'admin-1', tags: ['backend', 'db'], position: 0,
    subtaskIds: [], attachmentUrls: [], commentCount: 1, createdAt: new Date(), updatedAt: new Date(), businessId: 'demo'
  },
  {
    id: 'mock-3', title: 'Revisar PR de Login', description: 'El pull request #45 necesita review de un supervisor', status: 'in_review',
    priority: 'medium', type: 'task', assigneeIds: ['user-1'], creatorId: 'admin-1', tags: ['review'], position: 0,
    subtaskIds: [], attachmentUrls: [], commentCount: 0, createdAt: new Date(), updatedAt: new Date(), businessId: 'demo'
  },
  {
    id: 'mock-4', title: 'Arreglar bug modal tareas', description: 'Al abrir el modal en mobile, se corta la pantalla', status: 'backlog',
    priority: 'medium', type: 'bug', assigneeIds: [], creatorId: 'user-3', tags: ['ui', 'bug'], position: 1,
    subtaskIds: [], attachmentUrls: [], commentCount: 0, createdAt: new Date(), updatedAt: new Date(), businessId: 'demo'
  },
  {
    id: 'mock-5', title: 'Lanzamiento a producción', description: 'Lanzar MVP', status: 'done',
    priority: 'urgent', type: 'feature', assigneeIds: ['admin-1'], creatorId: 'admin-1', tags: ['release'], position: 0,
    subtaskIds: [], attachmentUrls: [], commentCount: 8, createdAt: new Date(), updatedAt: new Date(), businessId: 'demo'
  }
];

export function useTasksQuery(filters?: TaskFilters) {
  const { user, isSuperAdmin } = useAuth();
  const targetBusinessId = isSuperAdmin ? 'all' : user?.businessId ?? '';

  return useQuery({
    queryKey: taskKeys.byBusiness(targetBusinessId, filters),
    queryFn: async () => {
      try {
        const fetchPromise = tasksApi.getByBusiness(targetBusinessId, filters);
        const timeoutPromise = new Promise<Task[]>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 10000)
        );

        const result = await Promise.race([fetchPromise, timeoutPromise]);
        if (result && result.length > 0) return result;
        return MOCK_TASKS;
      } catch (e) {
        console.warn('Retornando tareas de prueba debido a fallo de conexión', e);
        return MOCK_TASKS;
      }
    },
    enabled: !!targetBusinessId,
  });
}

export function useTaskQuery(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => tasksApi.getById(id),
    enabled: !!id,
  });
}
