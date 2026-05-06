import { commentRepository } from '@/repositories';
import { prisma } from '@/lib/prisma';
import type { CreateCommentDTO } from '@/repositories/interfaces/ICommentRepository';
import type { Comment } from '@/types/domain/task';
import { parseMentions } from '@/lib/utils/mentions';
import { sendNotification } from '@/lib/notifications';

class CommentService {
  async getCommentsByTask(taskId: string): Promise<Comment[]> {
    return commentRepository.findByTask(taskId);
  }

  async addComment(data: CreateCommentDTO): Promise<Comment> {
    if (!data.content.trim()) {
      throw new Error('El comentario no puede estar vacío');
    }
    const comment = await commentRepository.create(data);

    // Procesar menciones y notificar
    const mentionNames = parseMentions(data.content);
    if (mentionNames.length > 0) {
      // Buscar usuarios por nombre o email que coincidan con las menciones
      const mentionedUsers = await prisma.user.findMany({
        where: {
          OR: mentionNames.map((name) => ({
            OR: [
              { name: { contains: name, mode: 'insensitive' } },
              { email: { contains: name, mode: 'insensitive' } },
            ],
          })),
          isActive: true,
        },
        select: { id: true, name: true, email: true },
      });

      const authorName = await prisma.user
        .findUnique({ where: { id: data.authorId }, select: { name: true } })
        .then((u) => u?.name ?? 'Un compañero');

      for (const user of mentionedUsers) {
        if (user.id === data.authorId) continue;
        sendNotification({
          userId: user.id,
          title: 'Te mencionaron en un comentario',
          body: `${authorName} te mencionó en un comentario`,
          type: 'mention',
          link: `/dashboard/tareas`,
        }).catch(() => {});
      }
    }

    return comment;
  }

  async removeComment(id: string): Promise<void> {
    return commentRepository.delete(id);
  }
}

export const commentService = new CommentService();
