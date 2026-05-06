import { create } from 'zustand';
import type { UserRole } from '@/types/domain/user';

interface TeamUIStore {
  searchQuery: string;
  roleFilter: UserRole | 'all';
  locationFilter: string;
  isInviteModalOpen: boolean;
  isCreateInviteModalOpen: boolean;
  isSelectMode: boolean;
  selectedIds: string[];

  setSearchQuery: (query: string) => void;
  setRoleFilter: (role: UserRole | 'all') => void;
  setLocationFilter: (locationId: string) => void;
  openInviteModal: () => void;
  closeInviteModal: () => void;
  openCreateInviteModal: () => void;
  closeCreateInviteModal: () => void;
  setSelectMode: (on: boolean) => void;
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
}

export const useTeamUIStore = create<TeamUIStore>((set) => ({
  searchQuery: '',
  roleFilter: 'all',
  locationFilter: '',
  isInviteModalOpen: false,
  isCreateInviteModalOpen: false,
  isSelectMode: false,
  selectedIds: [],

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setRoleFilter: (roleFilter) => set({ roleFilter }),
  setLocationFilter: (locationFilter) => set({ locationFilter }),
  openInviteModal: () => set({ isInviteModalOpen: true }),
  closeInviteModal: () => set({ isInviteModalOpen: false }),
  openCreateInviteModal: () => set({ isCreateInviteModalOpen: true }),
  closeCreateInviteModal: () => set({ isCreateInviteModalOpen: false }),
  setSelectMode: (on) => set(on ? { isSelectMode: true } : { isSelectMode: false, selectedIds: [] }),
  toggleSelect: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((i) => i !== id)
        : [...state.selectedIds, id],
    })),
  selectAll: (ids) => set({ selectedIds: ids }),
  clearSelection: () => set({ selectedIds: [] }),
}));
