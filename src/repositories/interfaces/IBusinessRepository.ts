import type { Business } from '@/types/domain/business';

export interface IBusinessRepository {
  findById(id: string): Promise<Business | null>;
  create(data: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>): Promise<Business>;
  update(id: string, data: Partial<Business>): Promise<void>;
}
