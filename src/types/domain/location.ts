export type LocationStatus = 'active' | 'inactive' | 'maintenance' | 'closed' | 'incident';

export interface Location {
  id: string;
  businessId: string;
  name: string;
  type: string;
  description?: string;
  address?: string;
  managerId?: string;
  teamIds: string[];
  status: LocationStatus;
  operatingHours?: { open: string; close: string };
  metadata: Record<string, unknown>;
  taskIds: string[];
  createdAt: Date;
  updatedAt: Date;
}
