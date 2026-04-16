import type { User, UserRole } from '@/types/domain/user';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByBusiness(businessId: string): Promise<User[]>;
  create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
  updateRole(id: string, role: UserRole): Promise<void>;
  deactivate(id: string): Promise<void>;
}
