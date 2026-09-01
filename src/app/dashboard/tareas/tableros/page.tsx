'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Archive, LayoutGrid, Loader2, Plus, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/auth-context';
import { useCreateProject, useProjectsQuery, useUpdateProject } from '@/hooks/queries/use-projects-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  const createProject = useCreateProject();
  const [tab, setTab] = useState<ProjectTab>('active');
  const [projectToArchive, setProjectToArchive] = useState<Project | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newEndDate, setNewEndDate] = useState('');

  const visibleProjects = useMemo(
    () => projects.filter((project) =>
      tab === 'archived' ? project.status === 'archived' : project.status !== 'archived'
    ),
    [projects, tab],
  );
  const activeCount = projects.filter((project) => project.status !== 'archived').length;
  const archivedCount = projects.length - activeCount;

  function openProject(project: Project) {
    if (project.status === 'archived') return;
    router.push(`/dashboard/tareas?projectId=${encodeURIComponent(project.id)}`);
  }

  function archiveProject() {
    if (!projectToArchive) return;
    updateProject.mutate(
      { id: projectToArchive.id, data: { action: 'archive' } },
      {
        onSuccess: () => {
          toast.success('Proyecto archivado');
          setProjectToArchive(null);
        },
        onError: (error) => {
          if (error.message.includes('last_active_project')) {
            toast.error('Debe quedar al menos un proyecto activo');
          } else {
            toast.error('No se pudo archivar el proyecto');
          }
        },
      },
    );
  }

  function restoreProject(project: Project) {
    updateProject.mutate(
      { id: project.id, data: { action: 'restore' } },
      {
        onSuccess: () => toast.success('Proyecto restaurado'),
        onError: (error) => {
          if (error.message.includes('projects_limit_exceeded')) {
            toast.error('El plan no tiene cupo para restaurar este proyecto');
          } else {
            toast.error('No se pudo restaurar el proyecto');
          }
        },
      },
    );
  }

  function submitCreate() {
    const name = newName.trim();
    if (!name || !businessId) return;
    createProject.mutate(
      {
        name,
        description: newDescription.trim() || undefined,
        businessId,
        endDate: newEndDate || undefined,
      },
      {
        onSuccess: (project) => {
          toast.success('Proyecto creado');
          setCreateOpen(false);
          setNewName('');
          setNewDescription('');
          setNewEndDate('');
          router.push(`/dashboard/tareas?projectId=${encodeURIComponent(project.id)}`);
        },
        onError: (error) => {
          if (error.message.includes('projects_limit_exceeded')) {
            toast.error('El plan no tiene cupo para otro proyecto');
          } else {
            toast.error('No se pudo crear el proyecto');
          }
        },
      },
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center" aria-label="Cargando proyectos">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return <p className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">No se pudieron cargar los proyectos.</p>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Entrá a un proyecto para trabajar. Mismo Kanban, backlog y sprint. Archivá sin borrar tareas.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/tareas">Ver todo</Link>
          </Button>
          {isAdmin && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Nuevo proyecto
            </Button>
          )}
          <div className="inline-flex rounded-lg border bg-muted/30 p-1" role="tablist" aria-label="Estado de proyectos">
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
      </div>

      {visibleProjects.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 text-center">
          <LayoutGrid className="mb-3 h-9 w-9 text-muted-foreground" />
          <p className="font-medium">No hay proyectos {tab === 'archived' ? 'archivados' : 'activos'}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {tab === 'archived'
              ? 'Los proyectos que archives aparecerán acá.'
              : 'Creá un proyecto para organizar el trabajo.'}
          </p>
        </div>
      ) : (
        <div className="min-h-0 overflow-auto rounded-lg border">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="sticky top-0 bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Proyecto</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Tareas</th>
                <th className="px-4 py-3 text-right font-medium">Pendientes</th>
                <th className="px-4 py-3 font-medium">Fechas</th>
                <th className="px-4 py-3 text-right font-medium">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visibleProjects.map((project) => (
                <tr
                  key={project.id}
                  className={cn(
                    'bg-card',
                    project.status !== 'archived' && 'cursor-pointer hover:bg-muted/30',
                  )}
                  onClick={() => openProject(project)}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{project.name}</p>
                    {project.description && (
                      <p className="mt-0.5 max-w-md truncate text-xs text-muted-foreground">{project.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{project.status}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{project._count?.tasks ?? 0}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{project.openTaskCount ?? 0}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {project.startDate ? new Date(project.startDate).toLocaleDateString('es-AR') : 'Sin inicio'}
                    {' · '}
                    {project.endDate ? new Date(project.endDate).toLocaleDateString('es-AR') : 'Sin fin'}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(event) => event.stopPropagation()}>
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
            <DialogTitle>Archivar proyecto</DialogTitle>
            <DialogDescription>
              {projectToArchive
                ? `“${projectToArchive.name}” tiene ${projectToArchive.openTaskCount ?? 0} tareas pendientes.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Sus tareas dejarán de aparecer en las vistas activas. Podés restaurar el proyecto cuando quieras.
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

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (createProject.isPending) return;
          setCreateOpen(open);
          if (!open) {
            setNewName('');
            setNewDescription('');
            setNewEndDate('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo proyecto</DialogTitle>
            <DialogDescription>
              Local, causa, campaña o producto: mismo funcionamiento. Fecha límite solo si se cierra.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="project-name">Nombre</label>
              <Input
                id="project-name"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Palermo, Causa Pérez, App v2…"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="project-description">Descripción</label>
              <Textarea
                id="project-description"
                value={newDescription}
                onChange={(event) => setNewDescription(event.target.value)}
                placeholder="Opcional"
                rows={3}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="project-end">Fecha límite (si se cierra)</label>
              <Input
                id="project-end"
                type="date"
                value={newEndDate}
                onChange={(event) => setNewEndDate(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createProject.isPending}>
              Cancelar
            </Button>
            <Button onClick={submitCreate} disabled={createProject.isPending || !newName.trim()}>
              {createProject.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Crear y entrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
