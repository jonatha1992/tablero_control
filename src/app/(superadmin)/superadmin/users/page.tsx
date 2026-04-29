'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { superadminApi } from '@/lib/api/superadmin';
import type { User } from '@/types/domain/user';
import { Loader2, UserPlus, Trash2, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { CreateUserModal } from '@/components/equipo/create-user-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuth } from '@/hooks/auth-context';

const ROLE_COLORS: Record<string, string> = {
  superadmin:  'bg-purple-100 text-purple-700',
  admin:       'bg-blue-100 text-blue-700',
  responsable: 'bg-teal-100 text-teal-700',
  miembro:     'bg-green-100 text-green-700',
  viewer:      'bg-gray-100 text-gray-600',
};

type UserWithBusiness = User & { business?: { name: string; plan?: string } | null };

interface DeleteState {
  user: UserWithBusiness;
  deleteBusiness: boolean;
}

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState<'all' | 'free'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteState, setDeleteState] = useState<DeleteState | null>(null);
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

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchPlan =
      filterPlan === 'all' ||
      (filterPlan === 'free' && u.business?.plan === 'free');
    return matchSearch && matchPlan;
  });

  async function handlePlanChange(businessId: string, plan: string) {
    setChangingPlan(businessId);
    try {
      await superadminApi.changePlan(businessId, plan);
      queryClient.invalidateQueries({ queryKey: ['sa-users'] });
    } finally {
      setChangingPlan(null);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteState) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await superadminApi.deleteUser(deleteState.user.id, deleteState.deleteBusiness);
      queryClient.invalidateQueries({ queryKey: ['sa-users'] });
      setDeleteState(null);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes('user_has_tasks')) {
        setDeleteError('Este usuario tiene tareas creadas. Reasignalas antes de eliminarlo.');
      } else {
        setDeleteError(msg);
      }
      setDeleting(false);
    }
  }

  const deleteDescription = deleteState
    ? `¿Eliminar a ${deleteState.user.name}? Esto borrará su cuenta de Firebase y PostgreSQL permanentemente. No se puede deshacer.`
    : '';

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground text-sm">Todos los usuarios de la plataforma ({users.length} total).</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <UserPlus className="mr-1.5 h-4 w-4" />
          Crear usuario
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Buscar por nombre, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm w-full max-w-sm bg-background"
        />
        <div className="flex gap-1 rounded-lg border p-1 bg-background">
          <button
            onClick={() => setFilterPlan('all')}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${filterPlan === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterPlan('free')}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${filterPlan === 'free' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Plan free
          </button>
        </div>
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
                <th className="text-left px-4 py-3 font-medium">Nombre</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Rol</th>
                <th className="text-left px-4 py-3 font-medium">Estado</th>
                <th className="text-left px-4 py-3 font-medium">Plan</th>
                <th className="text-left px-4 py-3 font-medium">Creado</th>
                <th className="text-left px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${ROLE_COLORS[u.role] ?? ''}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.isActive ? (
                      <span className="text-green-600 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-current" /> Activo
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-current" /> Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.role === 'admin' && u.businessId ? (
                      <div className="relative">
                        <select
                          value={u.business?.plan ?? 'free'}
                          disabled={changingPlan === u.businessId}
                          onChange={(e) => handlePlanChange(u.businessId!, e.target.value)}
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
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.createdAt ? format(new Date(u.createdAt as unknown as string), 'd MMM yyyy', { locale: es }) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      disabled={u.id === currentUser?.id || u.role === 'superadmin'}
                      onClick={() => setDeleteState({ user: u, deleteBusiness: false })}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Eliminar usuario"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Sin resultados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {deleteState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card border rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Eliminar usuario</h2>
              <p className="text-sm text-muted-foreground">{deleteDescription}</p>
            </div>

            {deleteState.user.role === 'admin' && (
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={deleteState.deleteBusiness}
                  onChange={(e) =>
                    setDeleteState((s) => s ? { ...s, deleteBusiness: e.target.checked } : s)
                  }
                  className="rounded border-border"
                />
                También eliminar su negocio (si no tiene otros usuarios)
              </label>
            )}

            {deleteError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {deleteError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => { setDeleteState(null); setDeleteError(''); }}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </div>
      )}

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
