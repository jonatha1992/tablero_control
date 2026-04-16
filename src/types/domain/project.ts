export type ProjectStatus = 'planning' | 'active' | 'paused' | 'completed' | 'archived';

export interface Project {
  id: string;
  name: string;
  description?: string;
  teamId: string;
  businessId?: string;
  status: ProjectStatus;
  taskIds: string[];
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
