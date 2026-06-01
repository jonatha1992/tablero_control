'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auth } from '@/lib/firebase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Building2, CheckCircle, XCircle, AlertCircle, Loader2, Trash2, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { Business, BusinessStatus } from '@/types/domain/business';
import type { PlanId } from '@/types/domain/subscription';
import { useState } from 'react';
import Link from 'next/link';
import { FilterPillGroup } from '@/components/ui/filter-pill-group';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { superadminApi } from '@/lib/api/superadmin';

async function fetchBusinesses(): Promise<Business[]> {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch('/api/superadmin/businesses', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Error al cargar espacios');
  const data = await res.json() as { businesses: Business[] };
  return data.businesses;
}

async function patchBusiness(args: { businessId: string; action: 'suspend' | 'reactivate' }): Promise<void> {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch('/api/superadmin/businesses', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error('Error al actualizar espacio');
}

const STATUS_UI: Record<BusinessStatus, { label: string; icon: React.ReactNode; color: string }> = {
  active:    { label: 'Activo',     icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600' },
  trial:     { label: 'Trial',      icon: <AlertCircle className="h-4 w-4" />, color: 'text-blue-600' },
  suspended: { label: 'Suspendido', icon: <XCircle className="h-4 w-4" />,     color: 'text-red-600' },
  cancelled: { label: 'Cancelado',  icon: <XCircle className="h-4 w-4" />,     color: 'text-zinc-400' },
};

type SortColumn = 'name' | 'plan' | 'status' | 'createdAt';

export default function BusinessesPage() {
  const qc = useQueryClient();
  const { data: businesses = [], isLoading, error } = useQuery({ queryKey: ['sa-businesses'], queryFn: fetchBusinesses });
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState<'all' | PlanId>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | BusinessStatus>('all');
  const [sortColumn, setSortColumn] = useState<SortColumn>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Business | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const mutation = useMutation({
    mutationFn: patchBusiness,
    onSuccess: async () => {
      await qc.refetchQueries({ queryKey: ['sa-businesses'] });
    },
  });

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await superadminApi.deleteBusiness(deleteTarget.id);
      await qc.refetchQueries({ queryKey: ['sa-businesses'] });
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError((err as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  async function handleBulkDeleteConfirm() {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    setDeleteError('');
    const ids = Array.from(selectedIds);
    const results = await Promise.allSettled(ids.map((id) => superadminApi.deleteBusiness(id)));
    const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    await qc.refetchQueries({ queryKey: ['sa-businesses'] });
    setSelectedIds(new Set());
    setDeleting(false);
    if (failures.length === 0) {
      setBulkDeleteOpen(false);
    } else {
      setDeleteError(`${failures.length} espacio(s) no pudieron eliminarse.`);
    }
  }

  const filtered = [...businesses]
    .filter((b) => {
      const matchSearch =
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        (b.id?.toLowerCase() ?? '').includes(search.toLowerCase());
      const matchPlan = filterPlan === 'all' || b.plan === filterPlan;
      const matchStatus = filterStatus === 'all' || b.status === filterStatus;
      return matchSearch && matchPlan && matchStatus;
    })
    .sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortColumn) {
        case 'name':
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case 'plan':
          valA = a.plan ?? '';
          valB = b.plan ?? '';
          break;
        case 'status':
          valA = a.status ?? '';
          valB = b.status ?? '';
          break;
        case 'createdAt':
          valA = a.createdAt ? new Date(a.createdAt as unknown as string).getTime() : 0;
          valB = b.createdAt ? new Date(b.createdAt as unknown as string).getTime() : 0;
          break;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  function toggleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }

  const selectableIds = filtered.map((b) => b.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));
  const someSelected = selectableIds.some((id) => selectedIds.has(id)) && !allSelected;

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        selectableIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        selectableIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const sortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />;
    return sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  return (
    <div className="p-8 space-y-6">


      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Buscar por nombre o ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm w-full max-w-sm bg-background"
        />
        <FilterPillGroup
          options={[
            { value: 'all', label: 'Todos los planes' },
            { value: 'free', label: 'Free' },
            { value: 'basic', label: 'Basic' },
            { value: 'pro', label: 'Pro' },
            { value: 'enterprise', label: 'Enterprise' },
          ] as const}
          value={filterPlan}
          onChange={setFilterPlan}
        />
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}
            </span>
            <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
              <X className="mr-1 h-3.5 w-3.5" /> Limpiar
            </Button>
            <Button size="sm" variant="destructive" onClick={() => { setDeleteError(''); setBulkDeleteOpen(true); }}>
              <Trash2 className="mr-1.5 h-4 w-4" /> Eliminar
            </Button>
          </div>
        )}
        <FilterPillGroup
          options={[
            { value: 'all', label: 'Todos los estados' },
            { value: 'active', label: 'Activo' },
            { value: 'trial', label: 'Trial' },
            { value: 'suspended', label: 'Suspendido' },
            { value: 'cancelled', label: 'Cancelado' },
          ] as const}
          value={filterStatus}
          onChange={setFilterStatus}
        />
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando…
        </div>
      )}
      {error && <p className="text-red-600 text-sm">{(error as Error).message}</p>}

      {!isLoading && (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 w-10">
                  <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleSelectAll} aria-label="Seleccionar todos" />
                </th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort('name')}>
                  <span className="inline-flex items-center">Espacio {sortIcon('name')}</span>
                </th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort('plan')}>
                  <span className="inline-flex items-center">Plan {sortIcon('plan')}</span>
                </th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort('status')}>
                  <span className="inline-flex items-center">Estado {sortIcon('status')}</span>
                </th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort('createdAt')}>
                  <span className="inline-flex items-center">Creado {sortIcon('createdAt')}</span>
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((biz) => {
                const st = STATUS_UI[biz.status ?? 'active'];
                const isMutating = mutation.isPending && mutation.variables?.businessId === biz.id;
                const isSelected = selectedIds.has(biz.id);
                return (
                  <tr key={biz.id} className={`hover:bg-muted/30 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}>
                    <td className="px-4 py-3">
                      <Checkbox checked={isSelected} onChange={() => toggleSelection(biz.id)} aria-label={`Seleccionar ${biz.name}`} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium">{biz.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono ml-6">{biz.id}</p>
                    </td>
                    <td className="px-4 py-3 capitalize">{biz.plan}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1.5 ${st.color}`}>{st.icon}{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {biz.createdAt ? format(new Date(biz.createdAt as unknown as string), 'd MMM yyyy', { locale: es }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/superadmin/businesses/${biz.id}`} className="text-xs text-primary hover:underline">
                          Ver detalle
                        </Link>
                        {biz.status !== 'suspended' ? (
                          <button
                            onClick={() => mutation.mutate({ businessId: biz.id, action: 'suspend' })}
                            disabled={mutation.isPending}
                            className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline disabled:opacity-50"
                          >
                            {isMutating && <Loader2 className="h-3 w-3 animate-spin" />}
                            Suspender
                          </button>
                        ) : (
                          <button
                            onClick={() => mutation.mutate({ businessId: biz.id, action: 'reactivate' })}
                            disabled={mutation.isPending}
                            className="inline-flex items-center gap-1 text-xs text-green-600 hover:underline disabled:opacity-50"
                          >
                            {isMutating && <Loader2 className="h-3 w-3 animate-spin" />}
                            Reactivar
                          </button>
                        )}
                        <button
                          onClick={() => { setDeleteError(''); setDeleteTarget(biz); }}
                          disabled={mutation.isPending}
                          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30"
                          title="Eliminar espacio"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && !isLoading && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={(open) => { if (!open && !deleting) { setBulkDeleteOpen(false); setDeleteError(''); } }}
        title={`Eliminar ${selectedIds.size} espacio(s)`}
        description="Se eliminarán permanentemente los espacios seleccionados con todas sus sedes, equipos, tableros y tareas. Los usuarios quedarán sin espacio asignado. No se puede deshacer."
        variant="destructive"
        confirmLabel="Eliminar seleccionados"
        onConfirm={handleBulkDeleteConfirm}
        loading={deleting}
      >
        {deleteError && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2 mt-3">{deleteError}</p>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open && !deleting) { setDeleteTarget(null); setDeleteError(''); } }}
        title="Eliminar espacio"
        description={deleteTarget ? `¿Eliminar "${deleteTarget.name}" permanentemente? Se borrarán todas sus sedes, equipos, tableros y tareas. Los usuarios quedarán sin espacio asignado. Esta acción no se puede deshacer.` : ''}
        variant="destructive"
        confirmLabel="Eliminar espacio"
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      >
        {deleteError && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2 mt-3">{deleteError}</p>
        )}
      </ConfirmDialog>
    </div>
  );
}
