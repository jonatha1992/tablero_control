import type { User, UserRole, UserBusiness } from '@/types/domain/user';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByBusiness(businessId: string): Promise<User[]>;
  findActiveAdminsByBusiness(businessId: string, excludeId: string): Promise<User[]>;
  findMemberships(userId: string): Promise<UserBusiness[]>;
  addMembership(data: Omit<UserBusiness, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserBusiness>;
  updateMembership(userId: string, businessId: string, data: Partial<Pick<UserBusiness, 'role' | 'locationId' | 'isActive'>>): Promise<UserBusiness>;
  removeMembership(userId: string, businessId: string): Promise<void>;
  updateActiveBusiness(userId: string, businessId: string | null, role?: UserRole): Promise<void>;
  create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
  updateRole(id: string, role: UserRole): Promise<void>;
  deactivate(id: string): Promise<void>;
  reactivate(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}
