import { where } from 'firebase/firestore';
import { getById, getAll, create, update, remove } from '@/lib/firebase/firestore';
import type { ILocationRepository } from '../interfaces/ILocationRepository';
import type { Location, LocationStatus } from '@/types/domain/location';

const COLLECTION = 'locations';

export class FirebaseLocationRepository implements ILocationRepository {
  async findById(id: string): Promise<Location | null> {
    return getById<Location>(COLLECTION, id);
  }

  async findByBusiness(businessId: string): Promise<Location[]> {
    return getAll<Location>(COLLECTION, [where('businessId', '==', businessId)]);
  }

  async findByStatus(businessId: string, status: LocationStatus): Promise<Location[]> {
    return getAll<Location>(COLLECTION, [
      where('businessId', '==', businessId),
      where('status', '==', status),
    ]);
  }

  async create(data: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<Location> {
    const id = await create(COLLECTION, data as Record<string, unknown>);
    return { id, ...data } as unknown as Location;
  }

  async update(id: string, data: Partial<Location>): Promise<Location> {
    await update(COLLECTION, id, data as Record<string, unknown>);
    const updated = await this.findById(id);
    if (!updated) throw new Error(`Location ${id} not found after update`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    return remove(COLLECTION, id);
  }
}
