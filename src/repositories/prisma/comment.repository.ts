import { prisma } from '@/lib/prisma';
import type { ICommentRepository, CreateCommentDTO } from '../interfaces/ICommentRepository';
import type { Comment } from '@/types/domain/task';

export class PrismaCommentRepository implements ICommentRepository {
  async findByTask(taskId: string): Promise<Comment[]> {
    const comments = await prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });
    return comments.map((c) => ({
      id: c.id,
      taskId: c.taskId,
      authorId: c.authorId,
      content: c.content,
      attachments: c.attachments,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      author: c.author
        ? { id: c.author.id, name: c.author.name, avatar: c.author.avatar ?? undefined }
        : undefined,
    }));
  }

  async create(data: CreateCommentDTO): Promise<Comment> {
    const c = await prisma.comment.create({
      data: {
        taskId: data.taskId,
        authorId: data.authorId,
        content: data.content,
        attachments: data.attachments ?? [],
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Incrementar commentCount en la tarea
    await prisma.task.update({
      where: { id: data.taskId },
      data: { commentCount: { increment: 1 } },
    });

    return {
      id: c.id,
      taskId: c.taskId,
      authorId: c.authorId,
      content: c.content,
      attachments: c.attachments,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      author: c.author
        ? { id: c.author.id, name: c.author.name, avatar: c.author.avatar ?? undefined }
        : undefined,
    };
  }

  async delete(id: string): Promise<void> {
    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) return;

    await prisma.comment.delete({ where: { id } });

    // Decrementar commentCount en la tarea
    await prisma.task.update({
      where: { id: comment.taskId },
      data: { commentCount: { decrement: 1 } },
    });
  }
}
