'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { superadminApi } from '@/lib/api/superadmin';
import type { User } from '@/types/domain/user';
import {
  Loader2,
  UserPlus,
  Trash2,
  ChevronsUpDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { FilterPillGroup } from '@/components/ui/filter-pill-group';
import { CreateUserModal } from '@/components/equipo/create-user-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/auth-context';
import { toast } from 'sonner';

const ROLE_COLORS: Record<string, string> = {
  superadmin: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  responsable: 'bg-teal-100 text-teal-700',
  miembro: 'bg-green-100 text-green-700',
  viewer: 'bg-gray-100 text-gray-600',
};

type UserWithBusiness = User & {
  business?: { name: string; plan?: string; adminId?: string } | null;
};

type SortColumn = 'name' | 'email' | 'role' | 'isActive' | 'plan' | 'createdAt';

interface SingleDeleteState {
  user: UserWithBusiness;
  deleteBusinesses: boolean;
}

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState<'all' | 'free' | 'basic' | 'pro' | 'enterprise'>('all');
  const [createOpen, setCreateOpen] = useState(false);

  const [sortColumn, setSortColumn] = useState<SortColumn>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [singleDelete, setSingleDelete] = useState<SingleDeleteState | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleteBusinesses, setDeleteBusinesses] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [changingPlan, setChangingPlan] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['sa-users'],
    queryFn: () => superadminApi.getUsers(),
  });

  const users = (data?.users ?? []) as UserWithBusiness[];

  const filtered = [...users]
    .filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchPlan = filterPlan === 'all' || u.business?.plan === filterPlan;
      return matchSearch && matchPlan;
    })
    .sort((a, b) => {
      let valA: string | number | boolean | Date = '';
      let valB: string | number | boolean | Date = '';

      switch (sortColumn) {
        case 'name':
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case 'email':
          valA = a.email.toLowerCase();
          valB = b.email.toLowerCase();
          break;
        case 'role':
          valA = a.role;
          valB = b.role;
          break;
        case 'isActive':
          valA = a.isActive ? 1 : 0;
          valB = b.isActive ? 1 : 0;
          break;
        case 'plan':
          valA = a.business?.plan ?? '';
          valB = b.business?.plan ?? '';
          break;
        case 'createdAt':
          valA = new Date(a.createdAt as unknown as string).getTime();
          valB = new Date(b.createdAt as unknown as string).getTime();
          break;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const selectableUsers = filtered.filter(
    (u) => u.id !== currentUser?.id && u.role !== 'superadmin'
  );

  const allVisibleSelected =
    selectableUsers.length > 0 && selectableUsers.every((u) => selectedIds.has(u.id));

  const someVisibleSelected =
    selectableUsers.some((u) => selectedIds.has(u.id)) && !allVisibleSelected;

  function toggleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllVisible() {
    if (allVisibleSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        selectableUsers.forEach((u) => next.delete(u.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        selectableUsers.forEach((u) => next.add(u.id));
        return next;
      });
    }
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function handlePlanChange(businessId: string, plan: string) {
    setChangingPlan(businessId);
    try {
      await superadminApi.changePlan(businessId, plan);
      queryClient.invalidateQueries({ queryKey: ['sa-users'] });
      toast.success('Plan actualizado');
    } catch {
      toast.error('Error al cambiar el plan');
    } finally {
      setChangingPlan(null);
    }
  }

  async function handleSingleDeleteConfirm() {
    if (!singleDelete) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await superadminApi.deleteUser(singleDelete.user.id, deleteBusinesses);
      await queryClient.refetchQueries({ queryKey: ['sa-users'] });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(singleDelete.user.id);
        return next;
      });
      setSingleDelete(null);
      setDeleteBusinesses(false);
      toast.success('Usuario eliminado');
    } catch (err) {
      const msg = (err as Error).message;
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  }

  async function handleBulkDeleteConfirm() {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const ids = Array.from(selectedIds);
      const result = await superadminApi.bulkDeleteUsers(ids, deleteBusinesses);
      await queryClient.refetchQueries({ queryKey: ['sa-users'] });
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      setDeleteBusinesses(false);

      if (result.deleted > 0) {
        toast.success(`${result.deleted} usuario(s) eliminado(s)`);
      }
      if (result.errors.length > 0) {
        result.errors.forEach((e) => {
          toast.error(`Error con ${e.id}: ${e.reason}`);
        });
      }
    } catch (err) {
      const msg = (err as Error).message;
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  }

  function openSingleDelete(user: UserWithBusiness) {
    setDeleteBusinesses(false);
    setDeleteError('');
    setSingleDelete({ user, deleteBusinesses: false });
  }

  function closeSingleDelete() {
    setSingleDelete(null);
    setDeleteError('');
    setDeleteBusinesses(false);
  }

  const sortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />;
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Buscar por nombre, correo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm w-full max-w-sm bg-background"
        />
        <FilterPillGroup
          options={[
            { value: 'all',        label: 'Todos' },
            { value: 'free',       label: 'Free' },
            { value: 'basic',      label: 'Basic' },
            { value: 'pro',        label: 'Pro' },
            { value: 'enterprise', label: 'Enterprise' },
          ] as const}
          value={filterPlan}
          onChange={setFilterPlan}
        />

        {selectedIds.size === 0 && (
          <Button size="sm" className="ml-auto" onClick={() => setCreateOpen(true)}>
            <UserPlus className="mr-1.5 h-4 w-4" />
            Crear usuario
          </Button>
        )}

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} seleccionado{selectedIds.size > 1 ? 's' : ''}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Limpiar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                setDeleteBusinesses(false);
                setDeleteError('');
                setBulkDeleteOpen(true);
              }}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Eliminar
            </Button>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando…
        </div>
      )}

      {!isLoading && (
        <div className="border rounded-xl overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-[11px] uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-medium w-10">
                  <Checkbox
                    checked={allVisibleSelected}
                    indeterminate={someVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    aria-label="Seleccionar todos visibles"
                  />
                </th>
                <th
                  className="text-left px-4 py-3 font-medium cursor-pointer select-none"
                  onClick={() => toggleSort('name')}
                >
                  <span className="inline-flex items-center">
                    Nombre {sortIcon('name')}
                  </span>
                </th>
                <th
                  className="text-left px-4 py-3 font-medium cursor-pointer select-none"
                  onClick={() => toggleSort('email')}
                >
                  <span className="inline-flex items-center">
                    Correo {sortIcon('email')}
                  </span>
                </th>
                <th
                  className="text-left px-4 py-3 font-medium cursor-pointer select-none"
                  onClick={() => toggleSort('role')}
                >
                  <span className="inline-flex items-center">
                    Rol {sortIcon('role')}
                  </span>
                </th>
                <th
                  className="text-left px-4 py-3 font-medium cursor-pointer select-none"
                  onClick={() => toggleSort('isActive')}
                >
                  <span className="inline-flex items-center">
                    Estado {sortIcon('isActive')}
                  </span>
                </th>
                <th
                  className="text-left px-4 py-3 font-medium cursor-pointer select-none"
                  onClick={() => toggleSort('plan')}
                >
                  <span className="inline-flex items-center">
                    Plan {sortIcon('plan')}
                  </span>
                </th>
                <th
                  className="text-left px-4 py-3 font-medium cursor-pointer select-none"
                  onClick={() => toggleSort('createdAt')}
                >
                  <span className="inline-flex items-center">
                    Creado {sortIcon('createdAt')}
                  </span>
                </th>
                <th className="text-left px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((u) => {
                const isSelectable =
                  u.id !== currentUser?.id && u.role !== 'superadmin';
                const isSelected = selectedIds.has(u.id);

                return (
                  <tr
                    key={u.id}
                    className={`hover:bg-muted/30 transition-colors ${
                      isSelected ? 'bg-primary/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={isSelected}
                        disabled={!isSelectable}
                        onChange={() => isSelectable && toggleSelection(u.id)}
                        aria-label={`Seleccionar ${u.name}`}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          ROLE_COLORS[u.role] ?? ''
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.isActive ? (
                        <span className="text-green-600 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />{' '}
                          Activo
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />{' '}
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.role === 'admin' && u.businessId ? (
                        <div className="relative">
                          <select
                            value={u.business?.plan ?? 'free'}
                            disabled={changingPlan === u.businessId}
                            onChange={(e) =>
                              handlePlanChange(u.businessId!, e.target.value)
                            }
                            className="appearance-none h-7 pl-2 pr-7 rounded-md border border-input bg-background text-xs font-medium disabled:opacity-50 cursor-pointer"
                          >
                            <option value="free">Free</option>
                            <option value="basic">Basic</option>
                            <option value="pro">Pro</option>
                            <option value="enterprise">Enterprise</option>
                          </select>
                          {changingPlan === u.businessId ? (
                            <Loader2 className="absolute right-1.5 top-1.5 h-3.5 w-3.5 animate-spin text-muted-foreground pointer-events-none" />
                          ) : (
                            <ChevronsUpDown className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                          )}
                        </div>
                      ) : !u.businessId ? (
                        <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                          Sin negocio
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.createdAt
                        ? format(
                            new Date(u.createdAt as unknown as string),
                            'd MMM yyyy',
                            { locale: es }
                          )
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        disabled={!isSelectable}
                        onClick={() => openSingleDelete(u)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Single delete confirm */}
      <ConfirmDialog
        open={!!singleDelete}
        onOpenChange={(open) => {
          if (!open) closeSingleDelete();
        }}
        title="Eliminar usuario"
        description={
          singleDelete
            ? `¿Eliminar a ${singleDelete.user.name}? Esto borrará su cuenta de Firebase y PostgreSQL permanentemente. No se puede deshacer.`
            : ''
        }
        variant="destructive"
        confirmLabel="Eliminar"
        onConfirm={handleSingleDeleteConfirm}
        loading={deleting}
      >
        {singleDelete?.user.role === 'admin' && (
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none mt-4">
            <input
              type="checkbox"
              checked={deleteBusinesses}
              onChange={(e) => setDeleteBusinesses(e.target.checked)}
              className="rounded border-border h-4 w-4"
            />
            También eliminar los negocios que administra
          </label>
        )}
        {deleteError && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2 mt-3">
            {deleteError}
          </p>
        )}
      </ConfirmDialog>

      {/* Bulk delete confirm */}
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={(open) => {
          if (!open) {
            setBulkDeleteOpen(false);
            setDeleteError('');
            setDeleteBusinesses(false);
          }
        }}
        title={`Eliminar ${selectedIds.size} usuario(s)`}
        description="Esta acción eliminará permanentemente los usuarios seleccionados de Firebase y PostgreSQL. No se puede deshacer."
        variant="destructive"
        confirmLabel="Eliminar seleccionados"
        onConfirm={handleBulkDeleteConfirm}
        loading={deleting}
      >
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none mt-4">
          <input
            type="checkbox"
            checked={deleteBusinesses}
            onChange={(e) => setDeleteBusinesses(e.target.checked)}
            className="rounded border-border h-4 w-4"
          />
          También eliminar los negocios que administran estos usuarios
        </label>
        {deleteError && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2 mt-3">
            {deleteError}
          </p>
        )}
      </ConfirmDialog>

      <CreateUserModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          queryClient.invalidateQueries({ queryKey: ['sa-users'] });
        }}
        isSuperAdmin
      />
    </div>
  );
}
