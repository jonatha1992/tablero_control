'use client';

import { useState, useMemo } from 'react';
import { useObjectivesQuery } from '@/hooks/queries/use-objectives-query';
import { useTasksQuery } from '@/hooks/queries/use-tasks-query';
import { useCreateObjective } from '@/hooks/mutations/use-create-objective';
import {
  useUpdateObjective,
  useCompleteObjective,
  useDeleteObjective,
  useArchiveObjective,
} from '@/hooks/mutations/use-update-objective';
import { useAuth } from '@/hooks/auth-context';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';
import { Plus, CheckCircle, X, Target, Trash2, Calendar, Archive, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Objective, ObjectiveStatus } from '@/types/domain/objective';

type FilterTab = 'active' | 'completed' | 'archived' | 'all';

const STATUS_LABELS: Record<ObjectiveStatus, string> = {
  active: 'Activo',
  completed: 'Completado',
  archived: 'Archivado',
};

const STATUS_BADGE: Record<ObjectiveStatus, string> = {
  active: 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
  completed: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
  archived: 'text-muted-foreground bg-muted border-border',
};

interface ObjectiveWithProgress extends Objective {
  total: number;
  completed: number;
  progress: number;
}

export default function ObjetivosPage() {
  const { user } = useAuth();
  const { data: objectives = [], isLoading } = useObjectivesQuery(user?.businessId ?? '');
  const { data: tasks = [] } = useTasksQuery();
  const createObjective = useCreateObjective();
  const updateObjective = useUpdateObjective();
  const completeObjective = useCompleteObjective();
  const deleteObjective = useDeleteObjective();
  const archiveObjective = useArchiveObjective();

  const todayStr = () => new Date().toISOString().split('T')[0];

  const [filterTab, setFilterTab] = useState<FilterTab>('active');

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [targetDate, setTargetDate] = useState(todayStr);
  const [dateError, setDateError] = useState('');
  const [serverError, setServerError] = useState('');

  // Edit modal
  const [editTarget, setEditTarget] = useState<ObjectiveWithProgress | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState('#3b82f6');
  const [editTargetDate, setEditTargetDate] = useState('');
  const [editError, setEditError] = useState('');

  const objectivesWithProgress = useMemo(() => {
    return objectives.map((obj) => {
      const objTasks = tasks.filter((t) => t.objectiveId === obj.id);
      const total = objTasks.length;
      const done = objTasks.filter((t) => t.status === 'done').length;
      const progress = total > 0 ? Math.round((done / total) * 100) : 0;
      return { ...obj, total, completed: done, progress };
    });
  }, [objectives, tasks]);

  const filtered = useMemo(() => {
    if (filterTab === 'all') return objectivesWithProgress;
    return objectivesWithProgress.filter((o) => o.status === filterTab);
  }, [objectivesWithProgress, filterTab]);

  const counts = useMemo(() => ({
    active: objectivesWithProgress.filter((o) => o.status === 'active').length,
    completed: objectivesWithProgress.filter((o) => o.status === 'completed').length,
    archived: objectivesWithProgress.filter((o) => o.status === 'archived').length,
    all: objectivesWithProgress.length,
  }), [objectivesWithProgress]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setDateError('');
    setServerError('');
    const trimmed = name.trim();
    if (!trimmed) return;
    if (targetDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(targetDate) < today) {
        setDateError('La fecha objetivo no puede ser anterior a hoy');
        return;
      }
    }
    createObjective.mutate(
      { name: trimmed, description: description.trim() || undefined, color, targetDate: targetDate || undefined },
      {
        onSuccess: () => {
          setShowCreate(false);
          setName('');
          setDescription('');
          setColor('#3b82f6');
          setTargetDate(todayStr());
          setFilterTab('active');
        },
        onError: (err: Error) => setServerError(err.message || 'Error al crear el objetivo'),
      }
    );
  };

  const openEdit = (obj: ObjectiveWithProgress) => {
    setEditTarget(obj);
    setEditName(obj.name);
    setEditDescription(obj.description ?? '');
    setEditColor(obj.color);
    setEditTargetDate(obj.targetDate ? new Date(obj.targetDate).toISOString().split('T')[0] : '');
    setEditError('');
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditError('');
    const trimmed = editName.trim();
    if (!trimmed) { setEditError('El nombre es requerido'); return; }
    updateObjective.mutate(
      { id: editTarget.id, data: { name: trimmed, description: editDescription.trim() || undefined, color: editColor, targetDate: editTargetDate || undefined } },
      {
        onSuccess: () => setEditTarget(null),
        onError: (err: Error) => setEditError(err.message || 'Error al actualizar'),
      }
    );
  };

  const tabs: { value: FilterTab; label: string }[] = [
    { value: 'active', label: 'Activos' },
    { value: 'completed', label: 'Completados' },
    { value: 'archived', label: 'Archivados' },
    { value: 'all', label: 'Todos' },
  ];

  return (
    <div className="space-y-6 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Objetivos</h1>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nuevo objetivo
        </Button>
      </div>

      <div className="flex items-center gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterTab(tab.value)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 -mb-px transition-colors',
              filterTab === tab.value
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
            <span className={cn(
              'inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-medium',
              filterTab === tab.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              {counts[tab.value]}
            </span>
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Cargando objetivos...</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((obj) => (
          <ObjectiveCard
            key={obj.id}
            objective={obj}
            onComplete={() => completeObjective.mutate(obj.id)}
            onDelete={() => deleteObjective.mutate(obj.id)}
            onArchive={() => archiveObjective.mutate(obj.id)}
            onEdit={() => openEdit(obj)}
          />
        ))}
      </div>

      {filtered.length === 0 && !isLoading && (
        <div className="text-center py-12 border rounded-lg">
          <Target className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {filterTab === 'all'
              ? 'Sin objetivos aún.'
              : `Sin objetivos ${STATUS_LABELS[filterTab as ObjectiveStatus]?.toLowerCase()}.`}
          </p>
          {filterTab === 'all' && (
            <p className="text-xs text-muted-foreground mt-1">Creá uno para agrupar tareas en iniciativas grandes.</p>
          )}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Nuevo objetivo</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-muted rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Apertura Sucursal Palermo"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                  maxLength={100}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Descripción (opcional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: Completar todos los pasos para abrir la nueva sucursal"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={3}
                  maxLength={500}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Color</label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-2 py-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Fecha objetivo</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => { setTargetDate(e.target.value); setDateError(''); }}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
              {(dateError || serverError) && (
                <p className="text-sm text-destructive">{dateError || serverError}</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCreate(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={createObjective.isPending}>
                  {createObjective.isPending ? 'Creando...' : 'Crear objetivo'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Editar objetivo</h2>
              <button onClick={() => setEditTarget(null)} className="p-1 hover:bg-muted rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Nombre</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                  maxLength={100}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Descripción (opcional)</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={3}
                  maxLength={500}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Color</label>
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-2 py-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Fecha objetivo</label>
                  <input
                    type="date"
                    value={editTargetDate}
                    onChange={(e) => setEditTargetDate(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
              {editError && <p className="text-sm text-destructive">{editError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditTarget(null)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={updateObjective.isPending}>
                  {updateObjective.isPending ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ObjectiveCard({
  objective,
  onComplete,
  onDelete,
  onArchive,
  onEdit,
}: {
  objective: ObjectiveWithProgress;
  onComplete: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onEdit: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isActive = objective.status === 'active';

  return (
    <>
      <div className={cn(
        'rounded-lg border bg-card p-4 space-y-3 transition-opacity',
        !isActive && 'opacity-65'
      )}>
        <div className="flex items-start gap-3">
          <div
            className="h-10 w-10 rounded-lg shrink-0 flex items-center justify-center"
            style={{ backgroundColor: objective.color + '20' }}
          >
            <Target className="h-5 w-5" style={{ color: objective.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold truncate">{objective.name}</h3>
              {!isActive && (
                <span className={cn(
                  'shrink-0 inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium',
                  STATUS_BADGE[objective.status]
                )}>
                  {STATUS_LABELS[objective.status]}
                </span>
              )}
            </div>
            {objective.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{objective.description}</p>
            )}
          </div>
          <button
            onClick={onEdit}
            className="shrink-0 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Editar"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-medium">{objective.progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${objective.progress}%`, backgroundColor: objective.color }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground text-right">
            {objective.completed} de {objective.total} tareas completadas
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1 flex-wrap">
          {isActive && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onComplete}>
              <CheckCircle className="h-3 w-3 mr-1" />
              Completar
            </Button>
          )}
          {isActive && (
            <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={onArchive}>
              <Archive className="h-3 w-3 mr-1" />
              Archivar
            </Button>
          )}
          {objective.targetDate && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(objective.targetDate), 'd MMM', { locale: es })}
            </div>
          )}
          <button
            onClick={() => setConfirmDelete(true)}
            className="ml-auto p-1 text-muted-foreground hover:text-destructive transition-colors"
            title="Eliminar"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        variant="destructive"
        title={`¿Eliminar "${objective.name}"?`}
        description="El objetivo y su asociación con las tareas se perderán. Esta acción no se puede deshacer."
        confirmLabel="Sí, eliminar"
        onConfirm={() => {
          onDelete();
          setConfirmDelete(false);
        }}
      />
    </>
  );
}
