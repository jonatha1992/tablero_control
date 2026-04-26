import { create } from 'zustand';
import type { UserRole } from '@/types/domain/user';

interface TeamUIStore {
  searchQuery: string;
  roleFilter: UserRole | 'all';
  locationFilter: string;
  isInviteModalOpen: boolean;

  setSearchQuery: (query: string) => void;
  setRoleFilter: (role: UserRole | 'all') => void;
  setLocationFilter: (locationId: string) => void;
  openInviteModal: () => void;
  closeInviteModal: () => void;
}

export const useTeamUIStore = create<TeamUIStore>((set) => ({
  searchQuery: '',
  roleFilter: 'all',
  locationFilter: '',
  isInviteModalOpen: false,

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setRoleFilter: (roleFilter) => set({ roleFilter }),
  setLocationFilter: (locationFilter) => set({ locationFilter }),
  openInviteModal: () => set({ isInviteModalOpen: true }),
  closeInviteModal: () => set({ isInviteModalOpen: false }),
}));
