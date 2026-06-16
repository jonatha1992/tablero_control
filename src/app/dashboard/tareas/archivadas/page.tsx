'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getToken } from '@/lib/firebase/auth';
import { useAuth } from '@/hooks/auth-context';
import { useTasksQuery } from '@/hooks/queries/use-tasks-query';
import { useMoveTask } from '@/hooks/mutations/use-move-task';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Archive, RotateCcw, AlertTriangle, Loader2, Inbox, Trash2, LockKeyhole } from 'lucide-react';
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
  if (res.status === 403) throw new Error('permission_denied');
  if (!res.ok) throw new Error('fetch_failed');
  return res.json();
}

async function deletedTaskAction(taskId: string, action: 'restore' | 'hard_delete') {
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
  return new Date(d).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ArchiradasPage() {
  const { user, isManager } = useAuth();
  const queryClient = useQueryClient();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Tab: Archivadas (status = archived)
  const { data: archivedTasks = [], isLoading: loadingArchived } = useTasksQuery({
    status: ['archived'],
  });
  const moveTask = useMoveTask();

  // Tab: Eliminadas (soft-delete) — solo admin/responsable
  const {
    data: deletedTasks = [],
    isLoading: loadingDeleted,
    error: deletedError,
  } = useQuery({
    queryKey: ['tasks', 'deleted'],
    queryFn: fetchDeletedTasks,
    enabled: !!user && isManager,
    retry: false,
  });

  const restoreMutation = useMutation({
    mutationFn: (taskId: string) => deletedTaskAction(taskId, 'restore'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tarea restaurada');
    },
    onError: () => toast.error('Error al restaurar'),
  });

  const hardDeleteMutation = useMutation({
    mutationFn: (taskId: string) => deletedTaskAction(taskId, 'hard_delete'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', 'deleted'] });
      setConfirmId(null);
      toast.success('Tarea eliminada definitivamente');
    },
    onError: () => toast.error('Error al eliminar'),
  });

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center gap-2">
        <Archive className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Archivadas</h1>
      </div>

      <Tabs defaultValue="archivadas">
        <TabsList>
          <TabsTrigger value="archivadas" className="gap-1.5">
            <Archive className="h-3.5 w-3.5" />
            Archivadas
            {archivedTasks.length > 0 && (
              <span className="text-xs text-muted-foreground">({archivedTasks.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="eliminadas" className="gap-1.5">
            <Trash2 className="h-3.5 w-3.5" />
            Eliminadas
            {isManager && !loadingDeleted && !deletedError && deletedTasks.length > 0 && (
              <span className="text-xs text-muted-foreground">({deletedTasks.length})</span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Tab Archivadas ── */}
        <TabsContent value="archivadas" className="mt-4">
          <p className="text-sm text-muted-foreground mb-4">
            Tareas archivadas automáticamente o por un miembro del equipo. Podés desarchivarlas para que vuelvan al tablero.
          </p>

          {loadingArchived ? (
            <div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Cargando…</span>
            </div>
          ) : archivedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
              <Inbox className="h-10 w-10 opacity-20" />
              <p className="text-sm">No hay tareas archivadas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {archivedTasks.map((task) => (
                <Card key={task.id} className="bg-card/70">
                  <CardContent className="flex items-center gap-3 py-3 px-4">
                    <span className={cn('h-2 w-2 rounded-full shrink-0', PRIORITY_DOT[task.priority] ?? 'bg-slate-400')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      {task.dueDate && (
                        <p className="text-xs text-muted-foreground">
                          Vencía {formatDate(task.dueDate)}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 shrink-0"
                      onClick={() => moveTask.mutate({ taskId: task.id, newStatus: 'done' })}
                      disabled={moveTask.isPending}
                    >
                      <Archive className="h-3 w-3" />
                      Desarchivar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Tab Eliminadas ── */}
        <TabsContent value="eliminadas" className="mt-4">
          {!isManager ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
              <LockKeyhole className="h-10 w-10 opacity-20" />
              <p className="text-sm text-center max-w-xs">
                Solo administradores y responsables pueden ver y gestionar las tareas eliminadas.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Tareas eliminadas por miembros del equipo. Podés restaurarlas o eliminarlas definitivamente.
              </p>

              {loadingDeleted ? (
                <div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Cargando…</span>
                </div>
              ) : deletedError ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
                  <AlertTriangle className="h-10 w-10 opacity-30" />
                  <p className="text-sm">No se pudieron cargar las tareas eliminadas</p>
                </div>
              ) : deletedTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
                  <Inbox className="h-10 w-10 opacity-20" />
                  <p className="text-sm">No hay tareas eliminadas</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {deletedTasks.map((task) => (
                    <Card key={task.id} className="bg-card/70">
                      <CardContent className="flex items-center gap-3 py-3 px-4">
                        <span className={cn('h-2 w-2 rounded-full shrink-0', PRIORITY_DOT[task.priority] ?? 'bg-slate-400')} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Eliminada {formatDate(task.deletedAt)}
                            {task.deletedBy && ` · por ${task.deletedBy}`}
                            {task.dueDate && ` · vencía ${formatDate(task.dueDate)}`}
                          </p>
                        </div>
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
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
