import { create } from 'zustand';
import type { Task, TaskStatus, TaskPriority, TaskFilters } from '@/types';

// --- Kanban Store ---

interface KanbanStore {
  // Tasks by column
  columns: Record<TaskStatus, Task[]>;
  
  // Drag state
  draggedTask: Task | null;
  draggedFrom: TaskStatus | null;
  draggedOver: TaskStatus | null;
  
  // Filters
  filters: TaskFilters;
  searchQuery: string;
  
  // Loading
  loading: boolean;
  error: string | null;

  // Actions
  setColumns: (columns: Record<TaskStatus, Task[]>) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  removeTask: (taskId: string) => void;
  
  // Drag & Drop
  setDraggedTask: (task: Task | null, from: TaskStatus | null) => void;
  setDraggedOver: (column: TaskStatus | null) => void;
  moveTask: (taskId: string, from: TaskStatus, to: TaskStatus) => void;
  
  // Filters
  setFilters: (filters: TaskFilters) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;
  
  // Loading
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const initialColumns: Record<TaskStatus, Task[]> = {
  backlog: [],
  todo: [],
  in_progress: [],
  in_review: [],
  done: [],
  blocked: [],
};

export const useKanbanStore = create<KanbanStore>((set, get) => ({
  columns: initialColumns,
  draggedTask: null,
  draggedFrom: null,
  draggedOver: null,
  filters: {},
  searchQuery: '',
  loading: false,
  error: null,

  setColumns: (columns) => set({ columns }),
  
  addTask: (task) => set((state) => {
    const column = state.columns[task.status];
    return {
      columns: {
        ...state.columns,
        [task.status]: [...column, task],
      },
    };
  }),

  updateTask: (taskId, updates) => set((state) => {
    const newColumns = { ...state.columns };
    
    // If status is changing, move task between columns
    if (updates.status) {
      // Find and remove from old column
      for (const [status, tasks] of Object.entries(newColumns)) {
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex >= 0) {
          const task = tasks[taskIndex];
          const updatedTask = { ...task, ...updates };
          newColumns[status as TaskStatus] = tasks.filter(t => t.id !== taskId);
          newColumns[updates.status as TaskStatus] = [...newColumns[updates.status as TaskStatus], updatedTask];
          break;
        }
      }
    } else {
      // Update in place
      for (const [status, tasks] of Object.entries(newColumns)) {
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex >= 0) {
          newColumns[status as TaskStatus] = tasks.map(t =>
            t.id === taskId ? { ...t, ...updates } : t
          );
          break;
        }
      }
    }
    
    return { columns: newColumns };
  }),

  removeTask: (taskId) => set((state) => {
    const newColumns = { ...state.columns };
    for (const status of Object.keys(newColumns)) {
      newColumns[status as TaskStatus] = newColumns[status as TaskStatus].filter(t => t.id !== taskId);
    }
    return { columns: newColumns };
  }),

  setDraggedTask: (task, from) => set({ draggedTask: task, draggedFrom: from }),
  setDraggedOver: (column) => set({ draggedOver: column }),

  moveTask: (taskId, from, to) => set((state) => {
    const task = state.columns[from].find(t => t.id === taskId);
    if (!task) return state;

    const updatedTask = { ...task, status: to };
    
    return {
      columns: {
        ...state.columns,
        [from]: state.columns[from].filter(t => t.id !== taskId),
        [to]: [...state.columns[to], updatedTask],
      },
      draggedTask: null,
      draggedFrom: null,
      draggedOver: null,
    };
  }),

  setFilters: (filters) => set({ filters }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  clearFilters: () => set({ filters: {}, searchQuery: '' }),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
