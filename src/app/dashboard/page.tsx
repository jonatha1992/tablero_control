'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KanbanBoard } from '@/components/tareas/kanban-board';
import type { Task } from '@/types';

const INITIAL_TASKS: Task[] = [
  { id: 'task-001', title: 'Diseñar mockups homepage', description: 'Crear mockups de alta fidelidad', status: 'in_progress', priority: 'high', type: 'feature', assigneeIds: ['member-002'], creatorId: 'resp-002', locationId: 'local-001', tags: ['design'], dueDate: new Date('2026-04-15'), position: 0, subtaskIds: [], attachmentUrls: [], commentCount: 2, createdAt: new Date(), updatedAt: new Date() },
  { id: 'task-002', title: 'Implementar navbar', description: 'Navbar responsive', status: 'todo', priority: 'high', type: 'feature', assigneeIds: ['member-001'], creatorId: 'resp-001', locationId: 'local-001', tags: ['frontend'], dueDate: new Date('2026-04-20'), position: 0, subtaskIds: [], attachmentUrls: [], commentCount: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 'task-003', title: 'CI/CD pipeline', description: 'Deploy automático', status: 'todo', priority: 'medium', type: 'task', assigneeIds: ['member-001'], creatorId: 'resp-001', locationId: 'sector-001', tags: ['devops'], dueDate: new Date('2026-04-25'), position: 1, subtaskIds: [], attachmentUrls: [], commentCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'task-004', title: 'Fix: login Google', description: 'Auth falla en Safari', status: 'in_review', priority: 'urgent', type: 'bug', assigneeIds: ['member-001'], creatorId: 'resp-001', locationId: 'local-001', tags: ['bug'], dueDate: new Date('2026-04-14'), position: 0, subtaskIds: [], attachmentUrls: [], commentCount: 5, createdAt: new Date(), updatedAt: new Date() },
  { id: 'task-005', title: 'Documentar API', description: 'OpenAPI/Swagger', status: 'done', priority: 'low', type: 'documentation', assigneeIds: ['member-001'], creatorId: 'resp-001', locationId: 'sector-001', tags: ['docs'], dueDate: new Date('2026-04-10'), completedDate: new Date('2026-04-09'), position: 0, subtaskIds: [], attachmentUrls: [], commentCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'task-006', title: 'Optimizar Firestore', description: 'Queries lentas', status: 'in_progress', priority: 'high', type: 'improvement', assigneeIds: ['member-001'], creatorId: 'resp-001', locationId: 'local-002', tags: ['backend'], dueDate: new Date('2026-04-18'), position: 1, subtaskIds: [], attachmentUrls: [], commentCount: 3, createdAt: new Date(), updatedAt: new Date() },
  { id: 'task-007', title: 'Componente tabla', description: 'Tabla reutilizable', status: 'backlog', priority: 'medium', type: 'feature', assigneeIds: [], creatorId: 'resp-001', locationId: 'local-001', tags: ['ui'], dueDate: new Date('2026-05-01'), position: 0, subtaskIds: [], attachmentUrls: [], commentCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 'task-015', title: 'Icon set SVG', description: 'Iconos personalizados', status: 'blocked', priority: 'medium', type: 'feature', assigneeIds: ['member-002'], creatorId: 'resp-002', locationId: 'local-002', tags: ['design'], dueDate: new Date('2026-04-25'), position: 0, subtaskIds: [], attachmentUrls: [], commentCount: 1, createdAt: new Date(), updatedAt: new Date() },
];

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Vista general de tu negocio</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Tareas Activas</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{tasks.filter(t => !['done'].includes(t.status)).length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Completadas</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{tasks.filter(t => t.status === 'done').length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Bloqueadas</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-500">{tasks.filter(t => t.status === 'blocked').length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Urgentes</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-orange-500">{tasks.filter(t => t.priority === 'urgent').length}</div></CardContent>
        </Card>
      </div>

      {/* Kanban */}
      <Card>
        <CardHeader><CardTitle>Kanban Board</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="p-4">
            <KanbanBoard tasks={tasks} onTasksChange={setTasks} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
