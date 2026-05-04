import type { User, UserRole } from '@/types/domain/user';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByBusiness(businessId: string): Promise<User[]>;
  findActiveAdminsByBusiness(businessId: string, excludeId: string): Promise<User[]>;
  create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
  updateRole(id: string, role: UserRole): Promise<void>;
  deactivate(id: string): Promise<void>;
  reactivate(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}
