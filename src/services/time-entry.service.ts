import { prisma } from '@/lib/prisma';

export interface CreateTimeEntryInput {
  taskId: string;
  userId: string;
  hours: number;
  date?: Date;
  note?: string;
}

class TimeEntryService {
  async getByTask(taskId: string) {
    return prisma.timeEntry.findMany({
      where: { taskId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { date: 'desc' },
    });
  }

  async create(data: CreateTimeEntryInput) {
    const entry = await prisma.timeEntry.create({
      data: {
        taskId: data.taskId,
        userId: data.userId,
        hours: data.hours,
        date: data.date ?? new Date(),
        note: data.note,
      },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    // Update actualHours on Task
    const totalHours = await prisma.timeEntry.aggregate({
      where: { taskId: data.taskId },
      _sum: { hours: true },
    });
    await prisma.task.update({
      where: { id: data.taskId },
      data: { actualHours: totalHours._sum.hours ?? 0 },
    });

    return entry;
  }

  async delete(id: string, taskId: string) {
    await prisma.timeEntry.delete({ where: { id } });

    // Update actualHours on Task
    const totalHours = await prisma.timeEntry.aggregate({
      where: { taskId },
      _sum: { hours: true },
    });
    await prisma.task.update({
      where: { id: taskId },
      data: { actualHours: totalHours._sum.hours ?? 0 },
    });
  }
}

export const timeEntryService = new TimeEntryService();
