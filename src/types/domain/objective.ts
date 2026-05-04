export type ObjectiveStatus = 'active' | 'completed' | 'archived';

export interface Objective {
  id: string;
  name: string;
  description?: string;
  color: string;
  businessId: string;
  projectId?: string;
  targetDate?: Date;
  status: ObjectiveStatus;
  createdAt: Date;
  updatedAt: Date;
}
