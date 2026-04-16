import { locationRepository } from '@/repositories';
import type { Location, LocationStatus } from '@/types/domain/location';

export class LocationService {
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

  async updateStatus(id: string, status: LocationStatus): Promise<Location> {
    return locationRepository.update(id, { status });
  }
}

export const locationService = new LocationService();
