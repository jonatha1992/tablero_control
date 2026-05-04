import type { Location, LocationStatus } from '@/types/domain/location';

export interface ILocationRepository {
  findById(id: string): Promise<Location | null>;
  findByBusiness(businessId: string): Promise<Location[]>;
  findByStatus(businessId: string, status: LocationStatus): Promise<Location[]>;
  findByManagerId(managerId: string): Promise<Location[]>;
  create(data: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<Location>;
  update(id: string, data: Partial<Location>): Promise<Location>;
  delete(id: string): Promise<void>;
  bulkUpdateManagerId(fromManagerId: string, toManagerId: string | null): Promise<void>;
  deleteByManagerId(managerId: string): Promise<void>;
}
