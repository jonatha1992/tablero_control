'use client';

import { useState } from 'react';
import { useCyclesQuery } from '@/hooks/queries/use-cycles-query';
import { useCreateCycle } from '@/hooks/mutations/use-create-cycle';
import { useDeleteCycle, useStartCycle, useCompleteCycle, useUpdateCycle } from '@/hooks/mutations/use-update-cycle';
import { useAuth } from '@/hooks/auth-context';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Plus, Play, CheckCircle, X, Calendar, Trash2, Lock, ArrowRight, Info, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Cycle, CycleStatus } from '@/types/domain/cycle';
import { NAV_ICON_COLORS } from '@/lib/constants/ui-icon-colors';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<CycleStatus, string> = {
  planning: 'En planificación',
  active: 'Activo',
  completed: 'Completado',
  closed: 'Cerrado',
};

const STATUS_COLORS: Record<CycleStatus, string> = {
  planning: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  closed: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export default function PeriodosPage() {
  const { user } = useAuth();
  const { data: cycles = [], isLoading } = useCyclesQuery(user?.businessId ?? '');
  const createCycle = useCreateCycle();
  const updateCycle = useUpdateCycle();
  const deleteCycle = useDeleteCycle();
  const startCycle = useStartCycle();
  const completeCycle = useCompleteCycle();

  const todayStr = () => new Date().toISOString().split('T')[0];
  const twoWeeksStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  };

  const [showModal, setShowModal] = useState(false);
  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(twoWeeksStr);
  const [dateError, setDateError] = useState('');
  const [serverError, setServerError] = useState('');
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});

  const activeCycle = cycles.find((c) => c.status === 'active');

  const resetModal = () => {
    setShowModal(false);
    setEditingCycle(null);
    setName('');
    setGoal('');
    setStartDate(todayStr());
    setEndDate(twoWeeksStr());
    setDateError('');
    setServerError('');
  };

  const openCreate = () => {
    resetModal();
    setShowModal(true);
  };

  const openEdit = (cycle: Cycle) => {
    setEditingCycle(cycle);
    setName(cycle.name);
    setGoal(cycle.goal ?? '');
    setStartDate(cycle.startDate ? new Date(cycle.startDate).toISOString().split('T')[0] : '');
    setEndDate(cycle.endDate ? new Date(cycle.endDate).toISOString().split('T')[0] : '');
    setDateError('');
    setServerError('');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDateError('');
    setServerError('');
    const trimmedName = name.trim();
    if (!trimmedName) return;
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      setDateError('La fecha de fin debe ser posterior a la de inicio');
      return;
    }
    const data = { name: trimmedName, goal: goal.trim() || undefined, startDate, endDate };
    const options = {
      onSuccess: resetModal,
      onError: (err: Error) => setServerError(err.message || (editingCycle ? 'Error al actualizar el período' : 'Error al crear el período')),
    };

    if (editingCycle) {
      updateCycle.mutate({ id: editingCycle.id, data }, options);
      return;
    }

    createCycle.mutate(data, options);
  };

  const handleStart = (id: string) => {
    setActionErrors((prev) => ({ ...prev, [id]: '' }));
    startCycle.mutate(id, {
      onError: (err: Error) =>
        setActionErrors((prev) => ({ ...prev, [id]: err.message })),
    });
  };

  const handleComplete = (id: string) => {
    setActionErrors((prev) => ({ ...prev, [id]: '' }));
    completeCycle.mutate(id, {
      onError: (err: Error) =>
        setActionErrors((prev) => ({ ...prev, [id]: err.message })),
    });
  };

  const planning = cycles.filter((c) => c.status === 'planning');
  const completed = cycles.filter((c) => c.status === 'completed');
  const closed = cycles.filter((c) => c.status === 'closed');

  return (
    <div className="space-y-8 h-full overflow-auto pb-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Períodos de trabajo</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organizá tareas en bloques de tiempo (semanas, quincenas, meses)
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nuevo período
        </Button>
      </div>

      {/* Flujo explicativo */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-4 py-3">
        <Info className="h-3.5 w-3.5 shrink-0" />
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium text-foreground">Flujo:</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-foreground text-[11px]">Planificación</span>
          <ArrowRight className="h-3 w-3" />
          <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[11px]">Activo</span>
          <ArrowRight className="h-3 w-3" />
          <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-[11px]">Completado</span>
          <ArrowRight className="h-3 w-3" />
          <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[11px]">Cerrado</span>
          <span className="ml-2">· Solo 1 período puede estar activo a la vez</span>
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Cargando períodos...</p>}

      {/* Activo */}
      {activeCycle && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Sprint activo
          </h2>
          <CycleCard
            cycle={activeCycle}
            onComplete={handleComplete}
            onDelete={(id) => deleteCycle.mutate(id)}
            onEdit={openEdit}
            actionError={actionErrors[activeCycle.id]}
          />
        </section>
      )}

      {/* En planificación */}
      {planning.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            En planificación
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {planning.map((cycle) => (
              <CycleCard
                key={cycle.id}
                cycle={cycle}
                hasActiveCycle={!!activeCycle}
                onStart={handleStart}
                onDelete={(id) => deleteCycle.mutate(id)}
                onEdit={openEdit}
                actionError={actionErrors[cycle.id]}
              />
            ))}
          </div>
        </section>
      )}

      {/* Completados */}
      {completed.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Completados
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completed.map((cycle) => (
              <CycleCard
                key={cycle.id}
                cycle={cycle}
                onDelete={(id) => deleteCycle.mutate(id)}
                onEdit={openEdit}
                actionError={actionErrors[cycle.id]}
              />
            ))}
          </div>
        </section>
      )}

      {/* Cerrados */}
      {closed.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Cerrados
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-60">
            {closed.map((cycle) => (
              <CycleCard
                key={cycle.id}
                cycle={cycle}
                onDelete={(id) => deleteCycle.mutate(id)}
                onEdit={openEdit}
                actionError={actionErrors[cycle.id]}
              />
            ))}
          </div>
        </section>
      )}

      {cycles.length === 0 && !isLoading && (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <Calendar className={cn('h-10 w-10 mx-auto mb-4', NAV_ICON_COLORS.planificacion)} />
          <p className="font-medium text-muted-foreground">Sin períodos aún</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Creá un período para planificar qué tareas vas a hacer esta semana o quincena.
          </p>
          <Button size="sm" className="mt-4" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" />
            Crear primer período
          </Button>
        </div>
      )}

      {/* Modal crear/editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{editingCycle ? 'Editar período' : 'Nuevo período'}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {editingCycle ? 'Ajustá el nombre, meta o fechas del período' : 'Definí un bloque de tiempo para agrupar tareas'}
                </p>
              </div>
              <button onClick={resetModal} className="p-1 hover:bg-muted rounded">
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
                  placeholder="Ej: Semana del 9 al 23 de mayo"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                  maxLength={100}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Meta del período <span className="text-muted-foreground font-normal">(opcional)</span></label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Ej: Completar apertura de sucursal"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  maxLength={300}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Inicio</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setDateError(''); }}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setDateError(''); }}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
              {(dateError || serverError) && (
                <p className="text-sm text-destructive">{dateError || serverError}</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={resetModal}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={createCycle.isPending || updateCycle.isPending}>
                  {editingCycle
                    ? (updateCycle.isPending ? 'Guardando...' : 'Guardar cambios')
                    : (createCycle.isPending ? 'Creando...' : 'Crear período')}
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
  hasActiveCycle,
  onStart,
  onComplete,
  onDelete,
  onEdit,
  actionError,
}: {
  cycle: Cycle;
  hasActiveCycle?: boolean;
  onStart?: (id: string) => void;
  onComplete?: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (cycle: Cycle) => void;
  actionError?: string;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
    <div className={`rounded-lg border bg-card p-4 space-y-3 ${cycle.status === 'active' ? 'border-blue-300 dark:border-blue-700 shadow-sm' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold truncate">{cycle.name}</h3>
          {cycle.goal && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{cycle.goal}</p>}
        </div>
        <span className={`shrink-0 text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[cycle.status]}`}>
          {STATUS_LABELS[cycle.status]}
        </span>
      </div>

      {cycle.startDate && cycle.endDate && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>
            {format(new Date(cycle.startDate), 'd MMM', { locale: es })} → {format(new Date(cycle.endDate), 'd MMM yyyy', { locale: es })}
          </span>
        </div>
      )}

      {actionError && (
        <p className="text-xs text-destructive bg-destructive/10 px-2 py-1.5 rounded">{actionError}</p>
      )}

      <div className="flex items-center gap-2 pt-1 flex-wrap">
        {cycle.status === 'planning' && onStart && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => onStart(cycle.id)}
            disabled={hasActiveCycle}
            title={hasActiveCycle ? 'Ya hay un período activo. Completalo primero.' : 'Iniciar este período'}
          >
            {hasActiveCycle ? <Lock className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
            Iniciar
          </Button>
        )}
        {cycle.status === 'active' && onComplete && (
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onComplete(cycle.id)}>
            <CheckCircle className="h-3 w-3 mr-1" />
            Completar
          </Button>
        )}
        <button
          onClick={() => onEdit(cycle)}
          className="ml-auto p-1 text-muted-foreground hover:text-foreground transition-colors"
          title="Editar período"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setDeleteOpen(true)}
          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
          title="Eliminar período"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
    <ConfirmDialog
      open={deleteOpen}
      onOpenChange={setDeleteOpen}
      title="Eliminar período"
      description={`El período "${cycle.name}" se eliminará de forma permanente.`}
      confirmLabel="Eliminar"
      variant="destructive"
      onConfirm={() => {
        onDelete(cycle.id);
        setDeleteOpen(false);
      }}
    />
    </>
  );
}
