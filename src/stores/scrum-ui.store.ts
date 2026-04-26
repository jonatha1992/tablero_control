import { create } from 'zustand';

interface ScrumUIStore {
  selectedSprintId: string | null;
  viewMode: 'board' | 'backlog';

  setSelectedSprint: (id: string | null) => void;
  setViewMode: (mode: 'board' | 'backlog') => void;
}

export const useScrumUIStore = create<ScrumUIStore>((set) => ({
  selectedSprintId: null,
  viewMode: 'board',

  setSelectedSprint: (selectedSprintId) => set({ selectedSprintId }),
  setViewMode: (viewMode) => set({ viewMode }),
}));
