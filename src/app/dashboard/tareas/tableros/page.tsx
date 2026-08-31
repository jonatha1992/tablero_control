'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, RotateCcw, LayoutGrid, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/auth-context';
import { useProjectsQuery, useUpdateProject } from '@/hooks/queries/use-projects-query';
import { shouldShowBoardsManager } from '@/lib/business-defaults';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { Project } from '@/lib/api/projects';

type ProjectTab = 'active' | 'archived';

export default function ProjectManagementPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const businessId = user?.businessId ?? '';
  const { data: projects = [], isLoading, isError } = useProjectsQuery(businessId);
  const updateProject = useUpdateProject();
  const [tab, setTab] = useState<ProjectTab>('active');
  const [projectToArchive, setProjectToArchive] = useState<Project | null>(null);

  const visibleProjects = useMemo(
    () => projects.filter((project) =>
      tab === 'archived' ? project.status === 'archived' : project.status !== 'archived'
    ),
    [projects, tab],
  );
  const activeCount = projects.filter((project) => project.status !== 'archived').length;
  const archivedCount = projects.length - activeCount;
  const showManager = shouldShowBoardsManager(activeCount, archivedCount);

  useEffect(() => {
    if (!isLoading && !isError && !showManager) {
      router.replace('/dashboard/tareas');
    }
  }, [isLoading, isError, showManager, router]);

  function archiveProject() {
    if (!projectToArchive) return;
    updateProject.mutate(
      { id: projectToArchive.id, data: { action: 'archive' } },
      {
        onSuccess: () => {
          toast.success('Tablero archivado');
          setProjectToArchive(null);
        },
        onError: (error) => {
          if (error.message.includes('last_active_project')) {
            toast.error('Debe quedar al menos un tablero activo');
          } else {
            toast.error('No se pudo archivar el tablero');
          }
        },
      },
    );
  }

  function restoreProject(project: Project) {
    updateProject.mutate(
      { id: project.id, data: { action: 'restore' } },
      {
        onSuccess: () => toast.success('Tablero restaurado'),
        onError: (error) => {
          if (error.message.includes('projects_limit_exceeded')) {
            toast.error('El plan no tiene cupo para restaurar este tablero');
          } else {
            toast.error('No se pudo restaurar el tablero');
          }
        },
      },
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center" aria-label="Cargando tableros">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return <p className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">No se pudieron cargar los tableros.</p>;
  }

  if (!showManager) {
    return (
      <div className="flex h-full items-center justify-center" aria-label="Cargando tableros">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Archivá trabajos terminados sin borrar tareas ni historial.
        </p>
        <div className="inline-flex rounded-lg border bg-muted/30 p-1" role="tablist" aria-label="Estado de tableros">
          {([
            ['active', `Activos (${activeCount})`],
            ['archived', `Archivados (${archivedCount})`],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                tab === value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {visibleProjects.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 text-center">
          <LayoutGrid className="mb-3 h-9 w-9 text-muted-foreground" />
          <p className="font-medium">No hay tableros {tab === 'archived' ? 'archivados' : 'activos'}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {tab === 'archived' ? 'Los tableros que archives aparecerán acá.' : 'Creá un tablero para organizar el trabajo.'}
          </p>
        </div>
      ) : (
        <div className="min-h-0 overflow-auto rounded-lg border">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="sticky top-0 bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Tablero</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Tareas</th>
                <th className="px-4 py-3 text-right font-medium">Pendientes</th>
                <th className="px-4 py-3 font-medium">Fechas</th>
                <th className="px-4 py-3 text-right font-medium">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visibleProjects.map((project) => (
                <tr key={project.id} className="bg-card hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{project.name}</p>
                    {project.description && <p className="mt-0.5 max-w-md truncate text-xs text-muted-foreground">{project.description}</p>}
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{project.status}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{project._count?.tasks ?? 0}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{project.openTaskCount ?? 0}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {project.startDate ? new Date(project.startDate).toLocaleDateString('es-AR') : 'Sin inicio'}
                    {' · '}
                    {project.endDate ? new Date(project.endDate).toLocaleDateString('es-AR') : 'Sin fin'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isAdmin && (project.status === 'archived' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        aria-label={`Restaurar ${project.name}`}
                        onClick={() => restoreProject(project)}
                        disabled={updateProject.isPending}
                      >
                        <RotateCcw className="mr-1.5 h-4 w-4" /> Restaurar
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        aria-label={`Archivar ${project.name}`}
                        onClick={() => setProjectToArchive(project)}
                        disabled={updateProject.isPending}
                      >
                        <Archive className="mr-1.5 h-4 w-4" /> Archivar
                      </Button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!projectToArchive} onOpenChange={(open) => { if (!open && !updateProject.isPending) setProjectToArchive(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Archivar tablero</DialogTitle>
            <DialogDescription>
              {projectToArchive
                ? `“${projectToArchive.name}” tiene ${projectToArchive.openTaskCount ?? 0} tareas pendientes.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Sus tareas dejarán de aparecer en las vistas activas. Podés restaurar el tablero y recuperar la vista completa cuando quieras.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectToArchive(null)} disabled={updateProject.isPending}>Cancelar</Button>
            <Button onClick={archiveProject} disabled={updateProject.isPending}>
              {updateProject.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Confirmar archivo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
