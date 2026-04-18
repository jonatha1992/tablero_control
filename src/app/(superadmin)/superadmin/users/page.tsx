'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { superadminApi } from '@/lib/api/superadmin';
import type { User } from '@/types/domain/user';
import { Loader2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { CreateUserModal } from '@/components/equipo/create-user-modal';

const ROLE_COLORS: Record<string, string> = {
  superadmin:  'bg-purple-100 text-purple-700',
  admin:       'bg-blue-100 text-blue-700',
  responsable: 'bg-teal-100 text-teal-700',
  miembro:     'bg-green-100 text-green-700',
  viewer:      'bg-gray-100 text-gray-600',
};

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['sa-users'],
    queryFn: () => superadminApi.getUsers(),
  });

  const users = (data?.users ?? []) as User[];
  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.businessId ?? '').includes(search)
  );

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

      <input
        type="search"
        placeholder="Buscar por nombre, email o negocio…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border rounded-lg px-3 py-2 text-sm w-full max-w-sm bg-background"
      />

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando…
        </div>
      )}

      {!isLoading && (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Nombre</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Rol</th>
                <th className="text-left px-4 py-3 font-medium">Negocio</th>
                <th className="text-left px-4 py-3 font-medium">Activo</th>
                <th className="text-left px-4 py-3 font-medium">Creado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${ROLE_COLORS[u.role] ?? ''}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{u.businessId ?? '—'}</td>
                  <td className="px-4 py-3">{u.isActive ? '✅' : '❌'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.createdAt ? format(new Date(u.createdAt as unknown as string), 'd MMM yyyy', { locale: es }) : '—'}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Sin resultados</td></tr>
              )}
            </tbody>
          </table>
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
