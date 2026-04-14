import { create } from 'zustand';

// --- Sprint Types ---

export interface Sprint {
  id: string;
  name: string;
  goal: string;
  startDate: Date;
  endDate: Date;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  taskIds: string[];
  pointsCommitted: number;
  pointsCompleted: number;
  createdAt: Date;
}

export interface SprintTask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  storyPoints: number;
  assigneeId?: string;
  assigneeName?: string;
  sprintId?: string;
  type: 'story' | 'task' | 'bug' | 'spike';
  labels: string[];
  subtasks: { id: string; title: string; completed: boolean }[];
}

export interface DailyStandup {
  date: Date;
  userId: string;
  userName: string;
  yesterday: string;
  today: string;
  blockers: string;
}

// --- Scrum Store ---

interface ScrumStore {
  // Sprints
  sprints: Sprint[];
  currentSprint: Sprint | null;
  
  // Sprint tasks (backlog)
  sprintBacklog: SprintTask[];
  productBacklog: SprintTask[];
  
  // Daily standups
  standups: DailyStandup[];
  
  // Velocity history
  velocityHistory: { sprint: string; points: number }[];
  
  // Loading
  loading: boolean;

  // Sprint actions
  setSprints: (sprints: Sprint[]) => void;
  setCurrentSprint: (sprint: Sprint | null) => void;
  createSprint: (sprint: Omit<Sprint, 'id' | 'createdAt' | 'pointsCommitted' | 'pointsCompleted'>) => void;
  startSprint: (sprintId: string) => void;
  completeSprint: (sprintId: string) => void;
  
  // Task actions
  setProductBacklog: (tasks: SprintTask[]) => void;
  setSprintBacklog: (tasks: SprintTask[]) => void;
  addToSprint: (taskId: string, sprintId: string, points: number) => void;
  removeFromSprint: (taskId: string, sprintId: string) => void;
  updateTaskPoints: (taskId: string, points: number) => void;
  
  // Standup
  addStandup: (standup: DailyStandup) => void;
  getStandupsForDate: (date: Date) => DailyStandup[];
  
  // Velocity
  calculateVelocity: () => number;
  setVelocityHistory: (history: { sprint: string; points: number }[]) => void;
  
  setLoading: (loading: boolean) => void;
}

// Helper to calculate sprint dates
function getSprintDates(sprintIndex: number, startDate?: Date): { start: Date; end: Date } {
  const start = startDate || new Date();
  const end = new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks
  return { start, end };
}

export const useScrumStore = create<ScrumStore>((set, get) => ({
  sprints: [],
  currentSprint: null,
  sprintBacklog: [],
  productBacklog: [],
  standups: [],
  velocityHistory: [],
  loading: false,

  setSprints: (sprints) => set({ sprints }),
  setCurrentSprint: (currentSprint) => set({ currentSprint }),

  createSprint: (sprintData) => set((state) => {
    const { start, end } = getSprintDates(state.sprints.length, sprintData.startDate);
    const newSprint: Sprint = {
      ...sprintData,
      startDate: start,
      endDate: end,
      id: `sprint-${state.sprints.length + 1}`,
      status: 'planning',
      taskIds: [],
      pointsCommitted: 0,
      pointsCompleted: 0,
      createdAt: new Date(),
    };
    return {
      sprints: [...state.sprints, newSprint],
    };
  }),

  startSprint: (sprintId) => set((state) => ({
    sprints: state.sprints.map(s =>
      s.id === sprintId ? { ...s, status: 'active' as const } : s
    ),
    currentSprint: state.sprints.find(s => s.id === sprintId) || null,
  })),

  completeSprint: (sprintId) => set((state) => {
    const sprint = state.sprints.find(s => s.id === sprintId);
    if (!sprint) return state;
    
    return {
      sprints: state.sprints.map(s =>
        s.id === sprintId ? { ...s, status: 'completed' as const } : s
      ),
      currentSprint: null,
      velocityHistory: [
        ...state.velocityHistory,
        { sprint: sprint.name, points: sprint.pointsCompleted },
      ],
    };
  }),

  setProductBacklog: (productBacklog) => set({ productBacklog }),
  setSprintBacklog: (sprintBacklog) => set({ sprintBacklog }),

  addToSprint: (taskId, sprintId, points) => set((state) => ({
    sprints: state.sprints.map(s =>
      s.id === sprintId
        ? {
            ...s,
            taskIds: [...s.taskIds, taskId],
            pointsCommitted: s.pointsCommitted + points,
          }
        : s
    ),
  })),

  removeFromSprint: (taskId, sprintId) => set((state) => ({
    sprints: state.sprints.map(s =>
      s.id === sprintId
        ? {
            ...s,
            taskIds: s.taskIds.filter(id => id !== taskId),
          }
        : s
    ),
  })),

  updateTaskPoints: (taskId, points) => set((state) => {
    // This would need to find the task and update its points
    return state;
  }),

  addStandup: (standup) => set((state) => ({
    standups: [...state.standups, standup],
  })),

  getStandupsForDate: (date) => {
    const state = get();
    return state.standups.filter(s =>
      s.date.toDateString() === date.toDateString()
    );
  },

  calculateVelocity: () => {
    const state = get();
    if (state.velocityHistory.length === 0) return 0;
    const last3 = state.velocityHistory.slice(-3);
    const avg = last3.reduce((sum, v) => sum + v.points, 0) / last3.length;
    return Math.round(avg);
  },

  setVelocityHistory: (velocityHistory) => set({ velocityHistory }),
  setLoading: (loading) => set({ loading }),
}));
