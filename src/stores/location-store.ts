import { create } from 'zustand';
import type { Location, LocationStatus } from '@/types';

interface LocationStore {
  locations: Location[];
  selectedLocation: Location | null;
  loading: boolean;

  setLocations: (locations: Location[]) => void;
  setSelectedLocation: (location: Location | null) => void;
  addLocation: (location: Location) => void;
  updateLocation: (id: string, updates: Partial<Location>) => void;
  removeLocation: (id: string) => void;
  getActiveLocations: () => Location[];
  getLocationsByStatus: (status: LocationStatus) => Location[];
  setLoading: (loading: boolean) => void;
}

export const useLocationStore = create<LocationStore>((set, get) => ({
  locations: [],
  selectedLocation: null,
  loading: false,

  setLocations: (locations) => set({ locations }),
  
  setSelectedLocation: (selectedLocation) => set({ selectedLocation }),
  
  addLocation: (location) => set((state) => ({
    locations: [...state.locations, location],
  })),

  updateLocation: (id, updates) => set((state) => ({
    locations: state.locations.map((loc) =>
      loc.id === id ? { ...loc, ...updates, updatedAt: new Date() } : loc
    ),
  })),

  removeLocation: (id) => set((state) => ({
    locations: state.locations.filter((loc) => loc.id !== id),
  })),

  getActiveLocations: () => {
    return get().locations.filter((loc) => loc.status === 'active');
  },

  getLocationsByStatus: (status) => {
    return get().locations.filter((loc) => loc.status === status);
  },

  setLoading: (loading) => set({ loading }),
}));
