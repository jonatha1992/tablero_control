'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getToken } from '@/lib/firebase/auth';
import { useAuth } from '@/hooks/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, RotateCcw, AlertTriangle, Loader2, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/domain/task';

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-blue-400',
  low: 'bg-slate-400',
};

async function fetchDeletedTasks(): Promise<Task[]> {
  const token = await getToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch('/api/tasks/deleted', { headers });
  if (!res.ok) throw new Error('Error al cargar papelera');
  return res.json();
}

async function trashAction(taskId: string, action: 'restore' | 'hard_delete') {
  const token = await getToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch('/api/tasks/deleted', {
    method: 'POST',
    headers,
    body: JSON.stringify({ taskId, action }),
  });
  if (!res.ok) throw new Error('Error');
  return res.json();
}

function formatDate(d: Date | string | undefined): string {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function PapeleraPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', 'deleted'],
    queryFn: fetchDeletedTasks,
    enabled: !!user,
  });

  const restoreMutation = useMutation({
    mutationFn: (taskId: string) => trashAction(taskId, 'restore'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tarea restaurada');
    },
    onError: () => toast.error('Error al restaurar'),
  });

  const hardDeleteMutation = useMutation({
    mutationFn: (taskId: string) => trashAction(taskId, 'hard_delete'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', 'deleted'] });
      setConfirmId(null);
      toast.success('Tarea eliminada definitivamente');
    },
    onError: () => toast.error('Error al eliminar'),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Cargando papelera…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center gap-2">
        <Trash2 className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Papelera</h1>
        <span className="text-sm text-muted-foreground">({tasks.length} tarea{tasks.length !== 1 ? 's' : ''})</span>
      </div>

      <p className="text-sm text-muted-foreground">
        Tareas eliminadas por miembros del equipo. Podés restaurarlas o eliminarlas definitivamente.
      </p>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
          <Inbox className="h-10 w-10 opacity-20" />
          <p className="text-sm">Papelera vacía</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <Card key={task.id} className="bg-card/70">
              <CardContent className="flex items-center gap-3 py-3 px-4">
                {/* Priority dot */}
                <span className={cn('h-2 w-2 rounded-full shrink-0', PRIORITY_DOT[task.priority] ?? 'bg-slate-400')} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Eliminada {formatDate(task.deletedAt)}
                    {task.deletedBy && ` · por ${task.deletedBy}`}
                    {task.dueDate && ` · vencía ${formatDate(task.dueDate)}`}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={() => restoreMutation.mutate(task.id)}
                    disabled={restoreMutation.isPending}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Restaurar
                  </Button>

                  {confirmId === task.id ? (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 text-xs"
                        onClick={() => hardDeleteMutation.mutate(task.id)}
                        disabled={hardDeleteMutation.isPending}
                      >
                        Confirmar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => setConfirmId(null)}
                      >
                        No
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-destructive hover:text-destructive gap-1"
                      onClick={() => setConfirmId(task.id)}
                    >
                      <AlertTriangle className="h-3 w-3" />
                      Eliminar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
