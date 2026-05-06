import { describe, it, expect, vi, beforeEach } from 'vitest';
import { timeEntryService } from '@/services/time-entry.service';
import { prisma } from '@/lib/prisma';

const mockEntry = {
  id: 'te-1',
  taskId: 'task-1',
  userId: 'user-1',
  hours: 2.5,
  date: new Date('2026-05-04'),
  note: 'Revisión de PR',
  user: { id: 'user-1', name: 'Ana', avatar: null },
};

beforeEach(() => vi.clearAllMocks());

describe('TimeEntryService.getByTask', () => {
  it('retorna entradas de tiempo de la tarea', async () => {
    vi.mocked(prisma.timeEntry.findMany).mockResolvedValueOnce([mockEntry] as never);
    const result = await timeEntryService.getByTask('task-1');
    expect(result).toHaveLength(1);
    expect(prisma.timeEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { taskId: 'task-1' } })
    );
  });

  it('retorna array vacío si no hay entradas', async () => {
    vi.mocked(prisma.timeEntry.findMany).mockResolvedValueOnce([] as never);
    const result = await timeEntryService.getByTask('task-1');
    expect(result).toEqual([]);
  });
});

describe('TimeEntryService.create', () => {
  beforeEach(() => {
    vi.mocked(prisma.timeEntry.aggregate).mockResolvedValue({ _sum: { hours: 2.5 } } as never);
    vi.mocked(prisma.task.update).mockResolvedValue({} as never);
  });

  it('crea entrada y actualiza actualHours en la tarea', async () => {
    vi.mocked(prisma.timeEntry.create).mockResolvedValueOnce(mockEntry as never);

    const result = await timeEntryService.create({
      taskId: 'task-1',
      userId: 'user-1',
      hours: 2.5,
      note: 'Revisión de PR',
    });

    expect(result.id).toBe('te-1');
    expect(prisma.timeEntry.create).toHaveBeenCalledOnce();
    expect(prisma.timeEntry.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { taskId: 'task-1' } })
    );
    expect(prisma.task.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'task-1' },
        data: { actualHours: 2.5 },
      })
    );
  });

  it('usa fecha actual si no se proporciona date', async () => {
    vi.mocked(prisma.timeEntry.create).mockResolvedValueOnce(mockEntry as never);
    await timeEntryService.create({ taskId: 'task-1', userId: 'user-1', hours: 1 });

    const call = vi.mocked(prisma.timeEntry.create).mock.calls[0][0];
    expect(call.data.date).toBeInstanceOf(Date);
  });

  it('suma horas correctamente cuando hay entradas previas', async () => {
    vi.mocked(prisma.timeEntry.create).mockResolvedValueOnce(mockEntry as never);
    vi.mocked(prisma.timeEntry.aggregate).mockResolvedValueOnce({ _sum: { hours: 7.5 } } as never);

    await timeEntryService.create({ taskId: 'task-1', userId: 'user-1', hours: 5 });

    expect(prisma.task.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { actualHours: 7.5 } })
    );
  });

  it('usa 0 si aggregate retorna null en sum', async () => {
    vi.mocked(prisma.timeEntry.create).mockResolvedValueOnce(mockEntry as never);
    vi.mocked(prisma.timeEntry.aggregate).mockResolvedValueOnce({ _sum: { hours: null } } as never);

    await timeEntryService.create({ taskId: 'task-1', userId: 'user-1', hours: 2 });

    expect(prisma.task.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { actualHours: 0 } })
    );
  });
});

describe('TimeEntryService.delete', () => {
  beforeEach(() => {
    vi.mocked(prisma.timeEntry.delete).mockResolvedValue({} as never);
    vi.mocked(prisma.timeEntry.aggregate).mockResolvedValue({ _sum: { hours: 5 } } as never);
    vi.mocked(prisma.task.update).mockResolvedValue({} as never);
  });

  it('elimina entrada y actualiza actualHours', async () => {
    await timeEntryService.delete('te-1', 'task-1');
    expect(prisma.timeEntry.delete).toHaveBeenCalledWith({ where: { id: 'te-1' } });
    expect(prisma.task.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'task-1' },
        data: { actualHours: 5 },
      })
    );
  });

  it('actualiza actualHours a 0 si era la única entrada', async () => {
    vi.mocked(prisma.timeEntry.aggregate).mockResolvedValueOnce({ _sum: { hours: null } } as never);
    await timeEntryService.delete('te-1', 'task-1');
    expect(prisma.task.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { actualHours: 0 } })
    );
  });
});
