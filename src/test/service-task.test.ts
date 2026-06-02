import { describe, it, expect, vi, beforeEach } from 'vitest';
import { taskService } from '@/services/task.service';

vi.mock('@/repositories', () => ({
  taskRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByCreator: vi.fn(),
    findSubtasks: vi.fn(),
    findPaginated: vi.fn(),
    batchUpdatePositions: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findMany: vi.fn(),
    },
  },
}));

import { taskRepository } from '@/repositories';
import { prisma } from '@/lib/prisma';
import type { Task } from '@/types/domain/task';

const mockRepo = vi.mocked(taskRepository);

const baseTask: Task = {
  id: 'task-1',
  title: 'Tarea de prueba',
  description: 'Descripción',
  status: 'todo',
  priority: 'medium',
  type: 'task',
  assigneeIds: [],
  creatorId: 'user-1',
  businessId: 'biz-1',
  tags: [],
  checklist: [],
  subtaskIds: [],
  subtasksCompleted: 0,
  attachmentUrls: [],
  commentCount: 0,
  position: 0,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// createTask
// ---------------------------------------------------------------------------

describe('TaskService.createTask', () => {
  it('lanza error si el título está vacío', async () => {
    await expect(
      taskService.createTask({ title: '   ', description: '', status: 'todo', priority: 'medium', type: 'task', assigneeIds: [], tags: [] }, 'user-1', 'biz-1')
    ).rejects.toThrow('El título es requerido');
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('lanza error si el título es solo espacios', async () => {
    await expect(
      taskService.createTask({ title: '\t\n', description: '', status: 'todo', priority: 'medium', type: 'task', assigneeIds: [], tags: [] }, 'user-1', 'biz-1')
    ).rejects.toThrow('El título es requerido');
  });

  it('llama a repository.create con creatorId y businessId correctos', async () => {
    mockRepo.create.mockResolvedValueOnce(baseTask as never);
    const dto = { title: 'Nueva tarea', description: 'desc', status: 'todo' as const, priority: 'high' as const, type: 'feature' as const, assigneeIds: ['u-2'], tags: ['tag1'] };

    const result = await taskService.createTask(dto, 'user-1', 'biz-1');

    expect(mockRepo.create).toHaveBeenCalledOnce();
    expect(mockRepo.create).toHaveBeenCalledWith({ ...dto, creatorId: 'user-1', businessId: 'biz-1' });
    expect(result).toEqual(baseTask);
  });

  it('retorna la tarea creada por el repositorio', async () => {
    const created = { ...baseTask, id: 'task-new', title: 'Creada' };
    mockRepo.create.mockResolvedValueOnce(created as never);

    const result = await taskService.createTask(
      { title: 'Creada', description: '', status: 'todo', priority: 'low', type: 'bug', assigneeIds: [], tags: [] },
      'user-1',
      'biz-1'
    );

    expect(result.id).toBe('task-new');
    expect(result.title).toBe('Creada');
  });
});

describe('TaskService.createTasksForProjects', () => {
  it('crea una tarea por cada projectId', async () => {
    vi.mocked(prisma.project.findMany).mockResolvedValueOnce([
      { id: 'p1', businessId: 'biz-1' },
      { id: 'p2', businessId: 'biz-1' },
    ] as never);
    mockRepo.create
      .mockResolvedValueOnce({ ...baseTask, id: 't1', projectId: 'p1' } as never)
      .mockResolvedValueOnce({ ...baseTask, id: 't2', projectId: 'p2' } as never);

    const dto = {
      title: 'Multi',
      status: 'todo' as const,
      priority: 'medium' as const,
      type: 'task' as const,
      assigneeIds: [] as string[],
      tags: [] as string[],
    };
    const result = await taskService.createTasksForProjects(
      dto,
      { projectIds: ['p1', 'p2'] },
      'user-1',
      'biz-1',
    );

    expect(result).toHaveLength(2);
    expect(mockRepo.create).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// updateTask
// ---------------------------------------------------------------------------

describe('TaskService.updateTask', () => {
  it('delega update al repositorio con el id y dto correctos', async () => {
    const updated = { ...baseTask, title: 'Modificada' };
    mockRepo.update.mockResolvedValueOnce(updated as never);

    const result = await taskService.updateTask('task-1', { title: 'Modificada' });

    expect(mockRepo.update).toHaveBeenCalledWith('task-1', { title: 'Modificada' });
    expect(result.title).toBe('Modificada');
  });

  it('retorna la tarea actualizada por el repositorio', async () => {
    const updated = { ...baseTask, priority: 'urgent' as const };
    mockRepo.update.mockResolvedValueOnce(updated as never);

    const result = await taskService.updateTask('task-1', { priority: 'urgent' });

    expect(result.priority).toBe('urgent');
  });
});

// ---------------------------------------------------------------------------
// deleteTask
// ---------------------------------------------------------------------------

describe('TaskService.deleteTask', () => {
  it('delega delete al repositorio con el id correcto', async () => {
    mockRepo.delete.mockResolvedValueOnce(undefined as never);

    await taskService.deleteTask('task-1');

    expect(mockRepo.delete).toHaveBeenCalledWith('task-1', undefined);
    expect(mockRepo.delete).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// getTaskById
// ---------------------------------------------------------------------------

describe('TaskService.getTaskById', () => {
  it('retorna la tarea cuando existe', async () => {
    mockRepo.findById.mockResolvedValueOnce(baseTask as never);

    const result = await taskService.getTaskById('task-1');

    expect(result).toEqual(baseTask);
    expect(mockRepo.findById).toHaveBeenCalledWith('task-1');
  });

  it('retorna null cuando la tarea no existe', async () => {
    mockRepo.findById.mockResolvedValueOnce(null as never);

    const result = await taskService.getTaskById('no-existe');

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// moveTask
// ---------------------------------------------------------------------------

describe('TaskService.moveTask', () => {
  it('lanza error si la tarea no existe', async () => {
    mockRepo.findById.mockResolvedValueOnce(null as never);

    await expect(taskService.moveTask('no-existe', 'in_progress')).rejects.toThrow('Tarea no encontrada');
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('actualiza el status al nuevo valor', async () => {
    mockRepo.findById.mockResolvedValueOnce(baseTask as never);
    mockRepo.update.mockResolvedValueOnce({ ...baseTask, status: 'in_progress' } as never);

    await taskService.moveTask('task-1', 'in_progress');

    expect(mockRepo.update).toHaveBeenCalledWith(
      'task-1',
      expect.objectContaining({ status: 'in_progress' })
    );
  });

  it('establece completedDate cuando el nuevo status es done', async () => {
    mockRepo.findById.mockResolvedValueOnce(baseTask as never);
    mockRepo.update.mockResolvedValueOnce({ ...baseTask, status: 'done' } as never);

    await taskService.moveTask('task-1', 'done');

    const callArgs = mockRepo.update.mock.calls[0][1];
    expect(callArgs.completedDate).toBeInstanceOf(Date);
  });

  it('no establece completedDate cuando el nuevo status no es done', async () => {
    mockRepo.findById.mockResolvedValueOnce(baseTask as never);
    mockRepo.update.mockResolvedValueOnce({ ...baseTask, status: 'in_review' } as never);

    await taskService.moveTask('task-1', 'in_review');

    const callArgs = mockRepo.update.mock.calls[0][1];
    expect(callArgs.completedDate).toBeUndefined();
  });

  it('retorna null cuando no hay recurrencia al completar', async () => {
    const taskWithoutRecurrence = { ...baseTask, recurrence: undefined };
    mockRepo.findById.mockResolvedValueOnce(taskWithoutRecurrence as never);
    mockRepo.update.mockResolvedValueOnce({ ...taskWithoutRecurrence, status: 'done' } as never);

    const result = await taskService.moveTask('task-1', 'done');

    expect(result).toBeNull();
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('no crea otra ocurrencia si la tarea ya spawneó (re-finalizar)', async () => {
    const taskAlreadyDone = {
      ...baseTask,
      status: 'done' as const,
      dueDate: new Date('2026-05-29'),
      recurrence: { frequency: 'daily' as const, interval: 1 },
      recurrenceSpawnedAt: new Date('2026-05-29'), // ya generó su próxima
    };
    mockRepo.findById.mockResolvedValueOnce(taskAlreadyDone as never);
    mockRepo.update.mockResolvedValueOnce({ ...taskAlreadyDone, status: 'done' } as never);

    const result = await taskService.moveTask('task-1', 'done');

    expect(mockRepo.create).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('retorna null cuando status no es done aunque haya recurrencia', async () => {
    const taskWithRecurrence = {
      ...baseTask,
      recurrence: { frequency: 'daily' as const, interval: 1 },
    };
    mockRepo.findById.mockResolvedValueOnce(taskWithRecurrence as never);
    mockRepo.update.mockResolvedValueOnce({ ...taskWithRecurrence, status: 'in_progress' } as never);

    const result = await taskService.moveTask('task-1', 'in_progress');

    expect(result).toBeNull();
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  describe('con recurrencia al completar (status=done)', () => {
    it('crea la siguiente ocurrencia con status todo y mismos datos', async () => {
      const dueDate = new Date('2026-06-01');
      const taskWithRecurrence = {
        ...baseTask,
        dueDate,
        checklist: [{ id: 'c1', text: 'Paso 1', done: true }],
        recurrence: { frequency: 'daily' as const, interval: 1 },
      };
      const nextTask = { ...baseTask, id: 'task-next', title: baseTask.title };

      mockRepo.findById.mockResolvedValueOnce(taskWithRecurrence as never);
      mockRepo.update.mockResolvedValueOnce({ ...taskWithRecurrence, status: 'done' } as never);
      mockRepo.create.mockResolvedValueOnce(nextTask as never);

      const result = await taskService.moveTask('task-1', 'done');

      expect(mockRepo.create).toHaveBeenCalledOnce();
      const createCall = mockRepo.create.mock.calls[0][0];
      expect(createCall.status).toBe('todo');
      expect(createCall.title).toBe(baseTask.title);
      expect(createCall.recurrence).toEqual(taskWithRecurrence.recurrence);
      expect(createCall.checklist).toEqual([{ id: 'c1', text: 'Paso 1', done: false }]);
      expect(result?.id).toBe('task-next');
    });

    it('calcula correctamente la fecha siguiente con frecuencia daily', async () => {
      const dueDate = new Date('2026-06-10');
      const taskWithRecurrence = {
        ...baseTask,
        dueDate,
        recurrence: { frequency: 'daily' as const, interval: 2 },
      };
      mockRepo.findById.mockResolvedValueOnce(taskWithRecurrence as never);
      mockRepo.update.mockResolvedValueOnce({ ...taskWithRecurrence, status: 'done' } as never);
      mockRepo.create.mockResolvedValueOnce({ ...baseTask, id: 'task-next' } as never);

      await taskService.moveTask('task-1', 'done');

      const createCall = mockRepo.create.mock.calls[0][0];
      const expectedDate = new Date('2026-06-12');
      expect(createCall.dueDate!.toDateString()).toBe(expectedDate.toDateString());
    });

    it('calcula correctamente la fecha siguiente con frecuencia weekly', async () => {
      const dueDate = new Date('2026-06-01'); // lunes
      const taskWithRecurrence = {
        ...baseTask,
        dueDate,
        recurrence: { frequency: 'weekly' as const, interval: 1 },
      };
      mockRepo.findById.mockResolvedValueOnce(taskWithRecurrence as never);
      mockRepo.update.mockResolvedValueOnce({ ...taskWithRecurrence, status: 'done' } as never);
      mockRepo.create.mockResolvedValueOnce({ ...baseTask, id: 'task-next' } as never);

      await taskService.moveTask('task-1', 'done');

      const createCall = mockRepo.create.mock.calls[0][0];
      const expectedDate = new Date('2026-06-08');
      expect(createCall.dueDate!.toDateString()).toBe(expectedDate.toDateString());
    });

    it('calcula correctamente la fecha siguiente con frecuencia biweekly', async () => {
      const dueDate = new Date('2026-06-01');
      const taskWithRecurrence = {
        ...baseTask,
        dueDate,
        recurrence: { frequency: 'biweekly' as const, interval: 1 },
      };
      mockRepo.findById.mockResolvedValueOnce(taskWithRecurrence as never);
      mockRepo.update.mockResolvedValueOnce({ ...taskWithRecurrence, status: 'done' } as never);
      mockRepo.create.mockResolvedValueOnce({ ...baseTask, id: 'task-next' } as never);

      await taskService.moveTask('task-1', 'done');

      const createCall = mockRepo.create.mock.calls[0][0];
      const expectedDate = new Date('2026-06-15');
      expect(createCall.dueDate!.toDateString()).toBe(expectedDate.toDateString());
    });

    it('calcula correctamente la fecha siguiente con frecuencia monthly', async () => {
      const dueDate = new Date('2026-06-01');
      const taskWithRecurrence = {
        ...baseTask,
        dueDate,
        recurrence: { frequency: 'monthly' as const, interval: 1 },
      };
      mockRepo.findById.mockResolvedValueOnce(taskWithRecurrence as never);
      mockRepo.update.mockResolvedValueOnce({ ...taskWithRecurrence, status: 'done' } as never);
      mockRepo.create.mockResolvedValueOnce({ ...baseTask, id: 'task-next' } as never);

      await taskService.moveTask('task-1', 'done');

      const createCall = mockRepo.create.mock.calls[0][0];
      // July 1 2026 — build locally to avoid UTC/local timezone off-by-one
      const expectedDate = new Date(2026, 6, 1);
      expect(createCall.dueDate!.toDateString()).toBe(expectedDate.toDateString());
    });

    it('usa new Date() como fallback cuando la tarea no tiene dueDate', async () => {
      const taskWithRecurrence = {
        ...baseTask,
        dueDate: undefined,
        recurrence: { frequency: 'daily' as const, interval: 1 },
      };
      mockRepo.findById.mockResolvedValueOnce(taskWithRecurrence as never);
      mockRepo.update.mockResolvedValueOnce({ ...taskWithRecurrence, status: 'done' } as never);
      mockRepo.create.mockResolvedValueOnce({ ...baseTask, id: 'task-next' } as never);

      await taskService.moveTask('task-1', 'done');

      expect(mockRepo.create).toHaveBeenCalledOnce();
      const createCall = mockRepo.create.mock.calls[0][0];
      expect(createCall.dueDate).toBeInstanceOf(Date);
    });

    it('propaga creatorId y businessId de la tarea original a la nueva ocurrencia', async () => {
      const taskWithRecurrence = {
        ...baseTask,
        creatorId: 'creator-42',
        businessId: 'biz-99',
        dueDate: new Date('2026-06-01'),
        recurrence: { frequency: 'daily' as const, interval: 1 },
      };
      mockRepo.findById.mockResolvedValueOnce(taskWithRecurrence as never);
      mockRepo.update.mockResolvedValueOnce({ ...taskWithRecurrence, status: 'done' } as never);
      mockRepo.create.mockResolvedValueOnce({ ...baseTask, id: 'task-next' } as never);

      await taskService.moveTask('task-1', 'done');

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ creatorId: 'creator-42', businessId: 'biz-99' })
      );
    });
  });
});

// ---------------------------------------------------------------------------
// getTasksByBusiness
// ---------------------------------------------------------------------------

describe('TaskService.getTasksByBusiness', () => {
  it('delega al repositorio con el businessId correcto', async () => {
    mockRepo.findAll.mockResolvedValueOnce([baseTask] as never);

    const result = await taskService.getTasksByBusiness('biz-1');

    expect(mockRepo.findAll).toHaveBeenCalledWith('biz-1', undefined);
    expect(result).toHaveLength(1);
  });

  it('pasa los filtros al repositorio cuando se proporcionan', async () => {
    mockRepo.findAll.mockResolvedValueOnce([baseTask] as never);
    const filters = { status: ['todo' as const], priority: ['high' as const] };

    await taskService.getTasksByBusiness('biz-1', filters);

    expect(mockRepo.findAll).toHaveBeenCalledWith('biz-1', filters);
  });

  it('retorna array vacío si no hay tareas', async () => {
    mockRepo.findAll.mockResolvedValueOnce([] as never);

    const result = await taskService.getTasksByBusiness('biz-1');

    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getTasksByCreator
// ---------------------------------------------------------------------------

describe('TaskService.getTasksByCreator', () => {
  it('delega al repositorio con el creatorId correcto', async () => {
    mockRepo.findByCreator.mockResolvedValueOnce([baseTask] as never);

    const result = await taskService.getTasksByCreator('user-1');

    expect(mockRepo.findByCreator).toHaveBeenCalledWith('user-1', undefined);
    expect(result).toHaveLength(1);
  });

  it('pasa los filtros al repositorio cuando se proporcionan', async () => {
    mockRepo.findByCreator.mockResolvedValueOnce([baseTask] as never);
    const filters = { tags: ['urgente'] };

    await taskService.getTasksByCreator('user-1', filters);

    expect(mockRepo.findByCreator).toHaveBeenCalledWith('user-1', filters);
  });

  it('retorna array vacío si el creador no tiene tareas', async () => {
    mockRepo.findByCreator.mockResolvedValueOnce([] as never);

    const result = await taskService.getTasksByCreator('user-sin-tareas');

    expect(result).toEqual([]);
  });
});
