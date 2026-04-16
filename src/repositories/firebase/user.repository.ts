import { where } from 'firebase/firestore';
import { getById, getAll, create, update } from '@/lib/firebase/firestore';
import type { IUserRepository } from '../interfaces/IUserRepository';
import type { User, UserRole } from '@/types/domain/user';

const COLLECTION = 'users';

export class FirebaseUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    return getById<User>(COLLECTION, id);
  }

  async findByEmail(email: string): Promise<User | null> {
    const results = await getAll<User>(COLLECTION, [where('email', '==', email)]);
    return results[0] ?? null;
  }

  async findByBusiness(businessId: string): Promise<User[]> {
    return getAll<User>(COLLECTION, [where('businessId', '==', businessId)]);
  }

  async create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const id = await create(COLLECTION, data as Record<string, unknown>);
    return { id, ...data } as unknown as User;
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    await update(COLLECTION, id, data as Record<string, unknown>);
    const updated = await this.findById(id);
    if (!updated) throw new Error(`User ${id} not found after update`);
    return updated;
  }

  async updateRole(id: string, role: UserRole): Promise<void> {
    await update(COLLECTION, id, { role });
  }

  async deactivate(id: string): Promise<void> {
    await update(COLLECTION, id, { isActive: false });
  }
}
