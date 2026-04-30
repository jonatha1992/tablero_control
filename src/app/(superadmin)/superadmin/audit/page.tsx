'use client';

import { useQuery } from '@tanstack/react-query';
import { superadminApi } from '@/lib/api/superadmin';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AuditLogEnriched } from '@/types/domain/audit-log';
import { Loader2, X, User, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useState } from 'react';

function ActorModal({ actor, actorId, onClose }: {
  actor: AuditLogEnriched['actor'];
  actorId: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-background border rounded-xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {actor.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={actor.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="font-semibold text-base">{actor.name}</p>
              <p className="text-sm text-muted-foreground">{actor.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm border-t pt-4">
          <span className="text-muted-foreground">Rol</span>
          <span className="font-medium capitalize">{actor.role}</span>

          <span className="text-muted-foreground">Estado</span>
          <span className={actor.isActive ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
            {actor.isActive ? 'Activo' : 'Inactivo'}
          </span>

          {actor.phone && (
            <>
              <span className="text-muted-foreground">Teléfono</span>
              <span>{actor.phone}</span>
            </>
          )}

          <span className="text-muted-foreground">Creado</span>
          <span>{format(new Date(actor.createdAt as unknown as string), "d MMM yyyy", { locale: es })}</span>

          <span className="text-muted-foreground">Último login</span>
          <span>{actor.lastLogin ? format(new Date(actor.lastLogin as unknown as string), "d MMM yyyy HH:mm", { locale: es }) : '—'}</span>

          <span className="text-muted-foreground">ID</span>
          <span className="font-mono text-xs break-all text-muted-foreground">{actorId}</span>
        </div>
      </div>
    </div>
  );
}

type SortColumn = 'createdAt' | 'action' | 'actor' | 'business' | 'target';

export default function AuditPage() {
  const [filter, setFilter] = useState('');
  const [selectedActor, setSelectedActor] = useState<{ actor: AuditLogEnriched['actor']; actorId: string } | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { data, isLoading } = useQuery({
    queryKey: ['sa-audit'],
    queryFn: () => superadminApi.getAudit(),
    staleTime: 10000,
  });

  const logs = (data?.logs ?? []) as AuditLogEnriched[];

  const q = filter.toLowerCase();

  const filtered = [...logs]
    .filter((l) => {
      if (!q) return true;
      return (
        l.action.includes(q) ||
        l.actor?.name?.toLowerCase().includes(q) ||
        l.actor?.email?.toLowerCase().includes(q) ||
        l.business?.name?.toLowerCase().includes(q) ||
        l.actorRole?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortColumn) {
        case 'createdAt':
          valA = new Date(a.createdAt as unknown as string).getTime();
          valB = new Date(b.createdAt as unknown as string).getTime();
          break;
        case 'action':
          valA = a.action;
          valB = b.action;
          break;
        case 'actor':
          valA = a.actor?.name ?? '';
          valB = b.actor?.name ?? '';
          break;
        case 'business':
          valA = a.business?.name ?? '';
          valB = b.business?.name ?? '';
          break;
        case 'target':
          valA = a.targetType ?? '';
          valB = b.targetType ?? '';
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
    <div className="p-8 space-y-6">
      {selectedActor && (
        <ActorModal
          actor={selectedActor.actor}
          actorId={selectedActor.actorId}
          onClose={() => setSelectedActor(null)}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold">Auditoría</h1>
        <p className="text-muted-foreground text-sm">Últimas 200 acciones de la plataforma.</p>
      </div>

      <input
        type="search"
        placeholder="Filtrar por acción, nombre, email, negocio, rol…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
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
            <thead className="bg-muted/50 text-muted-foreground text-[11px] uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort('createdAt')}>
                  <span className="inline-flex items-center">Fecha {sortIcon('createdAt')}</span>
                </th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort('action')}>
                  <span className="inline-flex items-center">Acción {sortIcon('action')}</span>
                </th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort('actor')}>
                  <span className="inline-flex items-center">Actor {sortIcon('actor')}</span>
                </th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort('business')}>
                  <span className="inline-flex items-center">Negocio {sortIcon('business')}</span>
                </th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort('target')}>
                  <span className="inline-flex items-center">Target {sortIcon('target')}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {log.createdAt
                      ? format(new Date(log.createdAt as unknown as string), "d MMM yyyy HH:mm", { locale: es })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                  <td className="px-4 py-3">
                    {log.actor ? (
                      <button
                        onClick={() => setSelectedActor({ actor: log.actor, actorId: log.actorId })}
                        className="text-left group"
                      >
                        <p className="font-medium group-hover:underline">{log.actor.name}</p>
                        <p className="text-xs text-muted-foreground">{log.actor.email}</p>
                        <p className="text-xs text-muted-foreground capitalize">{log.actor.role}</p>
                      </button>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">{log.actorId}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {log.business?.name ?? <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {log.targetType}/{(log.targetId ?? '').slice(0, 8)}…
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Sin registros</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
