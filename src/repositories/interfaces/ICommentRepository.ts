import type { Comment } from '@/types/domain/task';

export interface CreateCommentDTO {
  taskId: string;
  authorId: string;
  content: string;
  attachments?: string[];
}

export interface ICommentRepository {
  findByTask(taskId: string): Promise<Comment[]>;
  create(data: CreateCommentDTO): Promise<Comment>;
  delete(id: string): Promise<void>;
}
