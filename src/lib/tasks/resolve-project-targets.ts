/** Resolved projectId per task row to create (undefined = sin tablero). */
export type ProjectTarget = string | undefined;

export interface ResolveProjectTargetsInput {
  projectIds?: string[];
  projectId?: string;
  defaultProjectId?: string;
}

export function resolveProjectTargets(input: ResolveProjectTargetsInput): ProjectTarget[] {
  if (input.projectIds?.length) return [...input.projectIds];
  if (input.projectId) return [input.projectId];
  if (input.defaultProjectId) return [input.defaultProjectId];
  return [undefined];
}
