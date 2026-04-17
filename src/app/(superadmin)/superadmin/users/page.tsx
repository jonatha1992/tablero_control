'use client';

import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { User } from '@/types/domain/user';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

async function fetchAllUsers(): Promise<User[]> {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<User, 'id'>) }));
}

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const { data = [], isLoading } = useQuery({ queryKey: ['sa-users'], queryFn: fetchAllUsers });

  const filtered = data.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.businessId ?? '').includes(search)
  );

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="text-muted-foreground text-sm">Todos los usuarios de la plataforma (solo lectura).</p>
      </div>

      <input
        type="search"
        placeholder="Buscar por nombre, email o businessId…"
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
              {filtered.map((u) => {
                const ts = u.createdAt as unknown as { seconds: number } | undefined;
                return (
                  <tr key={u.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3 capitalize">{u.role}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{u.businessId ?? '—'}</td>
                    <td className="px-4 py-3">{u.isActive ? '✅' : '❌'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {ts ? format(new Date(ts.seconds * 1000), 'd MMM yyyy', { locale: es }) : '—'}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
