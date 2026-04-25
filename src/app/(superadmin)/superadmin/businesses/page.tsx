'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auth } from '@/lib/firebase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Building2, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { Business, BusinessStatus } from '@/types/domain/business';
import { useState } from 'react';
import Link from 'next/link';

async function fetchBusinesses(): Promise<Business[]> {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch('/api/superadmin/businesses', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Error al cargar negocios');
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
  if (!res.ok) throw new Error('Error al actualizar negocio');
}

const STATUS_UI: Record<BusinessStatus, { label: string; icon: React.ReactNode; color: string }> = {
  active:    { label: 'Activo',     icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600' },
  trial:     { label: 'Trial',      icon: <AlertCircle className="h-4 w-4" />, color: 'text-blue-600' },
  suspended: { label: 'Suspendido', icon: <XCircle className="h-4 w-4" />,     color: 'text-red-600' },
  cancelled: { label: 'Cancelado',  icon: <XCircle className="h-4 w-4" />,     color: 'text-zinc-400' },
};

export default function BusinessesPage() {
  const qc = useQueryClient();
  const { data: businesses = [], isLoading, error } = useQuery({ queryKey: ['sa-businesses'], queryFn: fetchBusinesses });
  const [search, setSearch] = useState('');

  const mutation = useMutation({
    mutationFn: patchBusiness,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sa-businesses'] }),
  });

  const filtered = businesses.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.id?.toLowerCase() ?? '').includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Negocios</h1>
        <p className="text-muted-foreground text-sm">Todos los clientes registrados en la plataforma.</p>
      </div>

      <input
        type="search"
        placeholder="Buscar por nombre o ID…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border rounded-lg px-3 py-2 text-sm w-full max-w-sm bg-background"
      />

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando…
        </div>
      )}
      {error && <p className="text-red-600 text-sm">{(error as Error).message}</p>}

      {!isLoading && (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Negocio</th>
                <th className="text-left px-4 py-3 font-medium">Plan</th>
                <th className="text-left px-4 py-3 font-medium">Estado</th>
                <th className="text-left px-4 py-3 font-medium">Creado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((biz) => {
                const st = STATUS_UI[biz.status ?? 'active'];
                return (
                  <tr key={biz.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium">{biz.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono ml-6">{biz.id}</p>
                    </td>
                    <td className="px-4 py-3 capitalize">{biz.plan}</td>
                    <td className={`px-4 py-3`}>
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
                            className="text-xs text-red-600 hover:underline disabled:opacity-50"
                          >
                            Suspender
                          </button>
                        ) : (
                          <button
                            onClick={() => mutation.mutate({ businessId: biz.id, action: 'reactivate' })}
                            disabled={mutation.isPending}
                            className="text-xs text-green-600 hover:underline disabled:opacity-50"
                          >
                            Reactivar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && !isLoading && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
