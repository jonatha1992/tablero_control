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
