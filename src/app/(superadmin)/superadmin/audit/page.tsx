'use client';

import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, orderBy, query, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AuditLog } from '@/types/domain/audit-log';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

async function fetchAuditLogs(): Promise<AuditLog[]> {
  const snap = await getDocs(
    query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc'), limit(200))
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AuditLog, 'id'>) }));
}

export default function AuditPage() {
  const [filter, setFilter] = useState('');
  const { data = [], isLoading } = useQuery({ queryKey: ['sa-audit'], queryFn: fetchAuditLogs, staleTime: 10000 });

  const filtered = filter
    ? data.filter((l) => l.action.includes(filter) || l.actorId.includes(filter) || l.businessId?.includes(filter))
    : data;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Auditoría</h1>
        <p className="text-muted-foreground text-sm">Últimas 200 acciones de la plataforma.</p>
      </div>

      <input
        type="search"
        placeholder="Filtrar por acción, actorId, businessId…"
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
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Fecha</th>
                <th className="text-left px-4 py-3 font-medium">Acción</th>
                <th className="text-left px-4 py-3 font-medium">Actor</th>
                <th className="text-left px-4 py-3 font-medium">Negocio</th>
                <th className="text-left px-4 py-3 font-medium">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((log) => {
                const ts = log.createdAt as unknown as { seconds: number };
                return (
                  <tr key={log.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {ts ? format(new Date(ts.seconds * 1000), "d MMM yyyy HH:mm", { locale: es }) : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                    <td className="px-4 py-3 font-mono text-xs">{log.actorId}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.businessId ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {log.targetType}/{log.targetId.slice(0, 8)}…
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Sin registros</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
