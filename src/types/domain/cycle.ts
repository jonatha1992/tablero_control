export type CycleStatus = 'planning' | 'active' | 'completed' | 'closed';

export interface Cycle {
  id: string;
  name: string;
  goal?: string;
  teamId?: string;
  businessId: string;
  status: CycleStatus;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
