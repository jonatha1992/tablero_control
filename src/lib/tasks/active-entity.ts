type EntityStatus = { status: string | undefined };

export function isArchivedProjectStatus(status: string | undefined): boolean {
  return status === 'archived';
}

export function isArchivedLocationStatus(status: string | undefined): boolean {
  return status === 'closed' || status === 'inactive';
}

export function isTaskFromActiveEntities(
  task: { projectId?: string | null; locationId?: string | null },
  projectsById: Map<string, EntityStatus>,
  locationsById: Map<string, EntityStatus>,
): boolean {
  const projectStatus = task.projectId ? projectsById.get(task.projectId)?.status : undefined;
  if (isArchivedProjectStatus(projectStatus)) {
    return false;
  }

  const locationStatus = task.locationId ? locationsById.get(task.locationId)?.status : undefined;
  if (isArchivedLocationStatus(locationStatus)) {
    return false;
  }

  return true;
}
