'use client';

import { useState } from 'react';
import { KanbanBoard } from '@/components/tareas/kanban-board';
import type { Task } from '@/types';

const TASKS: Task[] = [
  { id: 'task-001', title: 'Diseñar mockups', description: 'Mockups homepage', status: 'in_progress', priority: 'high', type: 'feature', assigneeIds: ['member-002'], creatorId: 'resp-002', locationId: 'local-001', tags: ['design'], dueDate: new Date('2026-04-15'), position: 0, subtaskIds: [], attachmentUrls: [], commentCount: 2, createdAt: new Date(), updatedAt: new Date() },
  { id: 'task-002', title: 'Navbar responsive', description: 'Mega-menu', status: 'todo', priority: 'high', type: 'feature', assigneeIds: ['member-001'], creatorId: 'resp-001', locationId: 'local-001', tags: ['frontend'], dueDate: new Date('2026-04-20'), position: 0, subtaskIds: [], attachmentUrls: [], commentCount: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 'task-004', title: 'Fix login Google', description: 'Falla en Safari', status: 'in_review', priority: 'urgent', type: 'bug', assigneeIds: ['member-001'], creatorId: 'resp-001', locationId: 'local-001', tags: ['bug'], dueDate: new Date('2026-04-14'), position: 0, subtaskIds: [], attachmentUrls: [], commentCount: 5, createdAt: new Date(), updatedAt: new Date() },
  { id: 'task-005', title: 'Doc API', description: 'Swagger', status: 'done', priority: 'low', type: 'documentation', assigneeIds: [], creatorId: 'resp-001', locationId: 'local-001', tags: ['docs'], dueDate: new Date('2026-04-10'), completedDate: new Date('2026-04-09'), position: 0, subtaskIds: [], attachmentUrls: [], commentCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'task-015', title: 'Icon set', description: 'SVG icons', status: 'blocked', priority: 'medium', type: 'feature', assigneeIds: ['member-002'], creatorId: 'resp-002', locationId: 'local-002', tags: ['design'], dueDate: new Date('2026-04-25'), position: 0, subtaskIds: [], attachmentUrls: [], commentCount: 1, createdAt: new Date(), updatedAt: new Date() },
];

export default function TareasPage() {
  const [tasks, setTasks] = useState<Task[]>(TASKS);
  return (
    <div className="flex flex-col h-full">
      <div className="mb-4"><h1 className="text-3xl font-bold">Tareas</h1><p className="text-muted-foreground mt-1">Kanban con drag & drop</p></div>
      <KanbanBoard tasks={tasks} onTasksChange={setTasks} />
    </div>
  );
}
