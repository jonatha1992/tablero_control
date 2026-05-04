'use client';

import { useState } from 'react';
import { useCyclesQuery } from '@/hooks/queries/use-cycles-query';
import { useCreateCycle } from '@/hooks/mutations/use-create-cycle';
import { useUpdateCycle, useDeleteCycle, useStartCycle, useCompleteCycle } from '@/hooks/mutations/use-update-cycle';
import { useAuth } from '@/hooks/auth-context';
import { Button } from '@/components/ui/button';
import { Plus, Play, CheckCircle, X, Calendar, Target, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Cycle, CycleStatus } from '@/types/domain/cycle';

const STATUS_LABELS: Record<CycleStatus, string> = {
  planning: 'Planificación',
  active: 'Activo',
  completed: 'Completado',
  closed: 'Cerrado',
};

const STATUS_COLORS: Record<CycleStatus, string> = {
  planning: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  closed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export default function CiclosPage() {
  const { user } = useAuth();
  const { data: cycles = [], isLoading } = useCyclesQuery(user?.businessId ?? '');
  const createCycle = useCreateCycle();
  const updateCycle = useUpdateCycle();
  const deleteCycle = useDeleteCycle();
  const startCycle = useStartCycle();
  const completeCycle = useCompleteCycle();

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) return;
    createCycle.mutate(
      {
        name: name.trim(),
        goal: goal.trim() || undefined,
        startDate,
        endDate,
      },
      {
        onSuccess: () => {
          setShowModal(false);
          setName('');
          setGoal('');
          setStartDate('');
          setEndDate('');
        },
      }
    );
  };

  const handleStart = (id: string) => startCycle.mutate(id);
  const handleComplete = (id: string) => completeCycle.mutate(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Períodos de Trabajo</h1>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nuevo período
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Cargando períodos...</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cycles.map((cycle) => (
          <CycleCard
            key={cycle.id}
            cycle={cycle}
            onStart={handleStart}
            onComplete={handleComplete}
            onDelete={(id) => deleteCycle.mutate(id)}
          />
        ))}
      </div>

      {cycles.length === 0 && !isLoading && (
        <div className="text-center py-12 border rounded-lg">
          <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Sin períodos de trabajo aún.</p>
          <p className="text-xs text-muted-foreground">Creá uno para planificar tareas por semanas, quincenas o meses.</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Nuevo período</h2>
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
                  placeholder="Ej: Semana del 5 al 11 de mayo"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Objetivo (opcional)</label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Ej: Completar apertura de sucursal"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Inicio</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={createCycle.isPending}>
                  {createCycle.isPending ? 'Creando...' : 'Crear período'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CycleCard({
  cycle,
  onStart,
  onComplete,
  onDelete,
}: {
  cycle: Cycle;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{cycle.name}</h3>
          {cycle.goal && <p className="text-xs text-muted-foreground mt-0.5">{cycle.goal}</p>}
        </div>
        <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[cycle.status]}`}>
          {STATUS_LABELS[cycle.status]}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="h-3.5 w-3.5" />
        <span>
          {format(new Date(cycle.startDate), 'd MMM', { locale: es })} — {format(new Date(cycle.endDate), 'd MMM', { locale: es })}
        </span>
      </div>

      <div className="flex items-center gap-2 pt-2">
        {cycle.status === 'planning' && (
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onStart(cycle.id)}>
            <Play className="h-3 w-3 mr-1" />
            Iniciar
          </Button>
        )}
        {cycle.status === 'active' && (
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onComplete(cycle.id)}>
            <CheckCircle className="h-3 w-3 mr-1" />
            Completar
          </Button>
        )}
        <button
          onClick={() => {
            if (confirm('¿Eliminar este período?')) onDelete(cycle.id);
          }}
          className="ml-auto p-1 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
