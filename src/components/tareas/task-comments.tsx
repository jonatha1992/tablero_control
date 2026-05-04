'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Send, Trash2, MessageSquare } from 'lucide-react';
import { useCommentsQuery } from '@/hooks/queries/use-comments-query';
import { useCreateComment } from '@/hooks/mutations/use-create-comment';
import { useDeleteComment } from '@/hooks/mutations/use-delete-comment';
import { MentionInput } from './mention-input';
import { useAuth } from '@/hooks/auth-context';
import type { Task } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface TaskCommentsProps {
  task: Task;
}

export function TaskComments({ task }: TaskCommentsProps) {
  const [content, setContent] = useState('');
  const { data: comments = [], isLoading } = useCommentsQuery(task.id);
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();
  const { user } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createComment.mutate(
      { taskId: task.id, content: content.trim() },
      { onSuccess: () => setContent('') }
    );
  };

  const handleDelete = (commentId: string) => {
    deleteComment.mutate({ commentId, taskId: task.id });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Comentarios</h3>
        <span className="text-xs text-muted-foreground">({comments.length})</span>
      </div>

      {isLoading && (
        <p className="text-xs text-muted-foreground">Cargando comentarios...</p>
      )}

      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {comments.length === 0 && !isLoading && (
          <p className="text-xs text-muted-foreground italic">Sin comentarios aún. Sé el primero en comentar.</p>
        )}

        {comments.map((comment) => {
          const isAuthor = comment.authorId === user?.id;
          const authorName = comment.author?.name ?? 'Usuario';
          const initials = authorName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

          return (
            <div key={comment.id} className="flex gap-2.5 group">
              <Avatar className="h-7 w-7 shrink-0">
                {comment.author?.avatar && <AvatarImage src={comment.author.avatar} alt={authorName} />}
                <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium">{authorName}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: es })}
                  </span>
                </div>
                <p className="text-sm text-foreground mt-0.5 whitespace-pre-wrap break-words">{comment.content}</p>
              </div>
              {isAuthor && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity shrink-0"
                  title="Eliminar comentario"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <MentionInput
          value={content}
          onChange={setContent}
          onSubmit={handleSubmit}
          placeholder="Escribe un comentario... Usa @ para mencionar"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!content.trim() || createComment.isPending}
          className="h-9 px-3"
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </form>
    </div>
  );
}
