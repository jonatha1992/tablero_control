'use client';

import { useState, useMemo } from 'react';
import { useObjectivesQuery } from '@/hooks/queries/use-objectives-query';
import { useTasksQuery } from '@/hooks/queries/use-tasks-query';
import { useCreateObjective } from '@/hooks/mutations/use-create-objective';
import { useCompleteObjective, useDeleteObjective } from '@/hooks/mutations/use-update-objective';
import { useAuth } from '@/hooks/auth-context';
import { Button } from '@/components/ui/button';
import { Plus, CheckCircle, X, Target, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Objective, ObjectiveStatus } from '@/types/domain/objective';

const _STATUS_LABELS: Record<ObjectiveStatus, string> = {
  active: 'Activo',
  completed: 'Completado',
  archived: 'Archivado',
};

export default function ObjetivosPage() {
  const { user } = useAuth();
  const { data: objectives = [], isLoading } = useObjectivesQuery(user?.businessId ?? '');
  const { data: tasks = [] } = useTasksQuery();
  const createObjective = useCreateObjective();
  const completeObjective = useCompleteObjective();
  const deleteObjective = useDeleteObjective();

  const todayStr = () => new Date().toISOString().split('T')[0];

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [targetDate, setTargetDate] = useState(todayStr);
  const [dateError, setDateError] = useState('');
  const [serverError, setServerError] = useState('');

  const objectivesWithProgress = useMemo(() => {
    return objectives.map((obj) => {
      const objTasks = tasks.filter((t) => t.objectiveId === obj.id);
      const total = objTasks.length;
      const completed = objTasks.filter((t) => t.status === 'done').length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { ...obj, total, completed, progress };
    });
  }, [objectives, tasks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDateError('');
    setServerError('');

    const trimmedName = name.trim();
    if (!trimmedName) return;

    if (targetDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(targetDate) < today) {
        setDateError('La fecha objetivo no puede ser anterior a hoy');
        return;
      }
    }

    createObjective.mutate(
      { name: trimmedName, description: description.trim() || undefined, color, targetDate: targetDate || undefined },
      {
        onSuccess: () => {
          setShowModal(false);
          setName('');
          setDescription('');
          setColor('#3b82f6');
          setTargetDate(todayStr());
          setDateError('');
          setServerError('');
        },
        onError: (err: Error) => {
          setServerError(err.message || 'Error al crear el objetivo');
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Objetivos</h1>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nuevo objetivo
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Cargando objetivos...</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {objectivesWithProgress.map((obj) => (
          <ObjectiveCard
            key={obj.id}
            objective={obj}
            total={obj.total}
            completed={obj.completed}
            progress={obj.progress}
            onComplete={() => completeObjective.mutate(obj.id)}
            onDelete={() => deleteObjective.mutate(obj.id)}
          />
        ))}
      </div>

      {objectives.length === 0 && !isLoading && (
        <div className="text-center py-12 border rounded-lg">
          <Target className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Sin objetivos aún.</p>
          <p className="text-xs text-muted-foreground">Creá uno para agrupar tareas en iniciativas grandes.</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Nuevo objetivo</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-muted rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>
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
    </div>
  );
}

function ObjectiveCard({
  objective,
  total,
  completed,
  progress,
  onComplete,
  onDelete,
}: {
  objective: Objective;
  total: number;
  completed: number;
  progress: number;
  onComplete: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div
          className="h-10 w-10 rounded-lg shrink-0 flex items-center justify-center"
          style={{ backgroundColor: objective.color + '20' }}
        >
          <Target className="h-5 w-5" style={{ color: objective.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{objective.name}</h3>
          {objective.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{objective.description}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progreso</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, backgroundColor: objective.color }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground text-right">
          {completed} de {total} tareas completadas
        </p>
      </div>

      <div className="flex items-center gap-2 pt-1">
        {objective.status === 'active' && (
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onComplete}>
            <CheckCircle className="h-3 w-3 mr-1" />
            Completar
          </Button>
        )}
        {objective.targetDate && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {format(new Date(objective.targetDate), 'd MMM', { locale: es })}
          </div>
        )}
        <button
          onClick={() => { if (confirm('¿Eliminar este objetivo?')) onDelete(); }}
          className="ml-auto p-1 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
