'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { superadminApi } from '@/lib/api/superadmin';
import type { Business } from '@/types/domain/business';
import type { User } from '@/types/domain/user';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface Props { params: Promise<{ id: string }> }

type SortColumn = 'name' | 'email' | 'role' | 'isActive';

export default function BusinessDetailPage({ params }: Props) {
  const { id } = use(params);
  const { data, isLoading, error } = useQuery({
    queryKey: ['sa-business', id],
    queryFn: () => superadminApi.getBusiness(id),
  });
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  if (isLoading) return <div className="p-8 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Cargando…</div>;
  if (error || !data) return <div className="p-8 text-red-600 text-sm">Error al cargar negocio.</div>;

  const business = data.business as Business;
  const users = data.users as User[];
  const locations = data.locations as { id: string; name: string; type: string; status: string }[];
  const teams = data.teams as { id: string; name: string; _count: { members: number } }[];
  const projects = data.projects as { id: string; name: string; _count: { tasks: number } }[];

  const sortedUsers = [...users].sort((a, b) => {
    let valA: string | number | boolean = '';
    let valB: string | number | boolean = '';

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

  const sortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />;
    return sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/superadmin/businesses" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{business.name}</h1>
          <p className="text-muted-foreground text-sm font-mono">{business.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        {[
          ['Plan', <span key="plan" className="capitalize font-medium">{business.plan}</span>],
          ['Estado', <span key="status" className="capitalize font-medium">{business.status}</span>],
          ['Locales', locations.length],
          ['Equipos', teams.length],
          ['Usuarios', users.length],
          ['Creado', business.createdAt ? format(new Date(business.createdAt as unknown as string), 'd MMM yyyy', { locale: es }) : '—'],
        ].map(([label, value]) => (
          <div key={String(label)} className="border rounded-xl p-4">
            <p className="text-muted-foreground mb-1 text-xs">{label}</p>
            <p className="font-semibold">{value}</p>
          </div>
        ))}
      </div>

      {locations.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3 text-lg">Locales ({locations.length})</h2>
          <div className="flex flex-wrap gap-2">
            {locations.map((loc) => (
              <span key={loc.id} className="border bg-card rounded-lg px-3 py-1.5 text-sm shadow-sm">
                {loc.name} <span className="text-muted-foreground capitalize text-xs">· {loc.type}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {teams.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3 text-lg">Equipos ({teams.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {teams.map((t) => (
              <div key={t.id} className="border bg-card rounded-xl p-4 shadow-sm flex justify-between items-center">
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{t.id}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold bg-muted px-2 py-1 rounded-full">
                    {t._count.members} miembros
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-semibold mb-3">Usuarios ({users.length})</h2>
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-[11px] uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium cursor-pointer select-none" onClick={() => toggleSort('name')}>
                  <span className="inline-flex items-center">Nombre {sortIcon('name')}</span>
                </th>
                <th className="text-left px-4 py-2.5 font-medium cursor-pointer select-none" onClick={() => toggleSort('email')}>
                  <span className="inline-flex items-center">Email {sortIcon('email')}</span>
                </th>
                <th className="text-left px-4 py-2.5 font-medium cursor-pointer select-none" onClick={() => toggleSort('role')}>
                  <span className="inline-flex items-center">Rol {sortIcon('role')}</span>
                </th>
                <th className="text-left px-4 py-2.5 font-medium cursor-pointer select-none" onClick={() => toggleSort('isActive')}>
                  <span className="inline-flex items-center">Activo {sortIcon('isActive')}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedUsers.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 capitalize">{u.role}</td>
                  <td className="px-4 py-3">{u.isActive ? '✅' : '❌'}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Sin usuarios</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {projects.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Proyectos ({projects.length})</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {projects.map((p) => (
              <div key={p.id} className="border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{p.name}</h3>
                  <p className="text-xs text-muted-foreground">{p.id}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {p._count.tasks} tareas
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
