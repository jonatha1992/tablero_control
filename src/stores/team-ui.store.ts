import { create } from 'zustand';
import type { UserRole } from '@/types/domain/user';

interface TeamUIStore {
  searchQuery: string;
  roleFilter: UserRole | 'all';
  isInviteModalOpen: boolean;

  setSearchQuery: (query: string) => void;
  setRoleFilter: (role: UserRole | 'all') => void;
  openInviteModal: () => void;
  closeInviteModal: () => void;
}

export const useTeamUIStore = create<TeamUIStore>((set) => ({
  searchQuery: '',
  roleFilter: 'all',
  isInviteModalOpen: false,

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setRoleFilter: (roleFilter) => set({ roleFilter }),
  openInviteModal: () => set({ isInviteModalOpen: true }),
  closeInviteModal: () => set({ isInviteModalOpen: false }),
}));
