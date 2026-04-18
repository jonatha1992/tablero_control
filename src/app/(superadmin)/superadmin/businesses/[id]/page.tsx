'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { superadminApi } from '@/lib/api/superadmin';
import type { Business } from '@/types/domain/business';
import type { User } from '@/types/domain/user';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Props { params: Promise<{ id: string }> }

export default function BusinessDetailPage({ params }: Props) {
  const { id } = use(params);
  const { data, isLoading, error } = useQuery({
    queryKey: ['sa-business', id],
    queryFn: () => superadminApi.getBusiness(id),
  });

  if (isLoading) return <div className="p-8 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Cargando…</div>;
  if (error || !data) return <div className="p-8 text-red-600 text-sm">Error al cargar negocio.</div>;

  const business = data.business as Business;
  const users = data.users as User[];
  const locations = data.locations as { id: string; name: string; type: string; status: string }[];

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
          <h2 className="font-semibold mb-3">Locales ({locations.length})</h2>
          <div className="flex flex-wrap gap-2">
            {locations.map((loc) => (
              <span key={loc.id} className="border rounded-lg px-3 py-1.5 text-sm">
                {loc.name} <span className="text-muted-foreground capitalize text-xs">· {loc.type}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-semibold mb-3">Usuarios ({users.length})</h2>
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Nombre</th>
                <th className="text-left px-4 py-2.5 font-medium">Email</th>
                <th className="text-left px-4 py-2.5 font-medium">Rol</th>
                <th className="text-left px-4 py-2.5 font-medium">Activo</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u) => (
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
    </div>
  );
}
