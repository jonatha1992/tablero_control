import { describe, it, expect, vi, beforeEach } from 'vitest';
import { commentService } from '@/services/comment.service';

vi.mock('@/repositories', () => ({
  commentRepository: {
    findByTask: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/utils/mentions', () => ({
  parseMentions: vi.fn(() => []),
}));

vi.mock('@/lib/notifications', () => ({
  sendNotification: vi.fn(() => Promise.resolve()),
}));

import { commentRepository } from '@/repositories';
import { parseMentions } from '@/lib/utils/mentions';
import { sendNotification } from '@/lib/notifications';
import { prisma } from '@/lib/prisma';

const mockRepo = vi.mocked(commentRepository);
const mockParseMentions = vi.mocked(parseMentions);
const mockSendNotification = vi.mocked(sendNotification);

const mockComment = {
  id: 'cmt-1',
  taskId: 'task-1',
  authorId: 'user-1',
  content: 'Buen trabajo',
  createdAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockParseMentions.mockReturnValue([]);
});

describe('CommentService.getCommentsByTask', () => {
  it('retorna comentarios de la tarea', async () => {
    mockRepo.findByTask.mockResolvedValueOnce([mockComment] as never);
    const result = await commentService.getCommentsByTask('task-1');
    expect(result).toHaveLength(1);
    expect(mockRepo.findByTask).toHaveBeenCalledWith('task-1');
  });

  it('retorna array vacío si no hay comentarios', async () => {
    mockRepo.findByTask.mockResolvedValueOnce([] as never);
    const result = await commentService.getCommentsByTask('task-1');
    expect(result).toEqual([]);
  });
});

describe('CommentService.addComment', () => {
  it('crea comentario con contenido válido', async () => {
    mockRepo.create.mockResolvedValueOnce(mockComment as never);
    const result = await commentService.addComment({
      taskId: 'task-1',
      authorId: 'user-1',
      content: 'Buen trabajo',
    });
    expect(result.id).toBe('cmt-1');
    expect(mockRepo.create).toHaveBeenCalledOnce();
  });

  it('lanza error si contenido vacío', async () => {
    await expect(
      commentService.addComment({ taskId: 'task-1', authorId: 'user-1', content: '  ' })
    ).rejects.toThrow('El comentario no puede estar vacío');
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('lanza error si contenido solo espacios', async () => {
    await expect(
      commentService.addComment({ taskId: 'task-1', authorId: 'user-1', content: '\t\n' })
    ).rejects.toThrow('El comentario no puede estar vacío');
  });

  it('no envía notificaciones si no hay menciones', async () => {
    mockParseMentions.mockReturnValue([]);
    mockRepo.create.mockResolvedValueOnce(mockComment as never);
    await commentService.addComment({ taskId: 'task-1', authorId: 'user-1', content: 'Sin menciones' });
    expect(mockSendNotification).not.toHaveBeenCalled();
  });

  it('envía notificación a usuarios mencionados', async () => {
    mockParseMentions.mockReturnValue(['ana']);
    mockRepo.create.mockResolvedValueOnce(mockComment as never);

    vi.mocked(prisma.user.findMany).mockResolvedValueOnce([
      { id: 'user-ana', name: 'Ana García', email: 'ana@biz.com' },
    ] as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ name: 'Autor' } as never);

    await commentService.addComment({
      taskId: 'task-1',
      authorId: 'user-1',
      content: 'Hola @ana revisar esto',
    });

    await vi.waitFor(() => expect(mockSendNotification).toHaveBeenCalledOnce());
    expect(mockSendNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-ana', type: 'mention' })
    );
  });

  it('no notifica al propio autor si se menciona a sí mismo', async () => {
    mockParseMentions.mockReturnValue(['autor']);
    mockRepo.create.mockResolvedValueOnce(mockComment as never);

    vi.mocked(prisma.user.findMany).mockResolvedValueOnce([
      { id: 'user-1', name: 'Autor', email: 'autor@biz.com' },
    ] as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ name: 'Autor' } as never);

    await commentService.addComment({
      taskId: 'task-1',
      authorId: 'user-1',
      content: '@autor probando',
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(mockSendNotification).not.toHaveBeenCalled();
  });
});

describe('CommentService.removeComment', () => {
  it('delega delete al repository', async () => {
    mockRepo.delete.mockResolvedValueOnce(undefined as never);
    await commentService.removeComment('cmt-1');
    expect(mockRepo.delete).toHaveBeenCalledWith('cmt-1');
  });
});
