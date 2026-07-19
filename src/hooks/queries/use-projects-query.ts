'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi, type CreateProjectBody, type Project, type UpdateProjectBody } from '@/lib/api/projects';
import { taskKeys } from '@/hooks/queries/use-tasks-query';

export const projectKeys = {
  all: ['projects'] as const,
  byBusiness: (businessId: string) => [...projectKeys.all, 'byBusiness', businessId] as const,
};

export function useProjectsQuery(businessId: string) {
  return useQuery({
    queryKey: projectKeys.byBusiness(businessId),
    queryFn: async (): Promise<Project[]> => {
      if (!businessId) return [];
      return projectsApi.getByBusiness(businessId);
    },
    enabled: !!businessId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectBody) => projectsApi.create(data),
    onSuccess: (_data, variables) => {
      if (variables.businessId) {
        queryClient.invalidateQueries({ queryKey: projectKeys.byBusiness(variables.businessId) });
      }
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectBody }) =>
      projectsApi.update(id, data),
    onSuccess: (data) => {
      if (data.businessId) {
        queryClient.invalidateQueries({ queryKey: projectKeys.byBusiness(data.businessId) });
      }
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
