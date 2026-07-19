import { locationRepository } from '@/repositories';
import { prisma } from '@/lib/prisma';
import type { Location, LocationStatus } from '@/types/domain/location';

class LocationService {
  async getByBusiness(businessId: string): Promise<Location[]> {
    return locationRepository.findByBusiness(businessId);
  }

  async getActiveLocations(businessId: string): Promise<Location[]> {
    return locationRepository.findByStatus(businessId, 'active');
  }

  async getByStatus(businessId: string, status: LocationStatus): Promise<Location[]> {
    return locationRepository.findByStatus(businessId, status);
  }

  async getById(id: string): Promise<Location | null> {
    return locationRepository.findById(id);
  }

  async create(data: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<Location> {
    return locationRepository.create(data);
  }

  async update(id: string, data: Partial<Location>): Promise<Location> {
    return locationRepository.update(id, data);
  }

  async archive(id: string): Promise<Location> {
    return locationRepository.update(id, { status: 'closed' });
  }

  async delete(id: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.task.deleteMany({ where: { locationId: id } });
      await tx.location.delete({ where: { id } });
    });
  }
}

export const locationService = new LocationService();
