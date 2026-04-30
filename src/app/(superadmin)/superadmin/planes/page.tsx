'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Pencil, Check, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { getToken } from '@/lib/firebase/auth';
import type { PlanDefinition } from '@/lib/mercadopago/plans';
import type { PlanId } from '@/types/domain/subscription';
import { toast } from 'sonner';

function fmt(value: number) {
  if (value === -1) return '∞';
  return value.toLocaleString('es-AR');
}

function fmtPrice(value: number) {
  if (value === -1) return 'A convenir';
  if (value === 0) return 'Gratis';
  return `$${value.toLocaleString('es-AR')}`;
}

async function fetchPlans(): Promise<{ plans: PlanDefinition[] }> {
  const token = await getToken();
  const res = await fetch('/api/superadmin/planes', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Error al cargar planes');
  return res.json();
}

async function updatePlan(body: {
  planId: PlanId;
  priceMonthly: number;
  priceYearly: number;
  limitUsers: number;
  limitLocations: number;
  limitProjects: number;
  limitAttachments: number;
}) {
  const token = await getToken();
  const res = await fetch('/api/superadmin/planes', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

interface EditForm {
  priceMonthly: string;
  priceYearly: string;
  limitUsers: string;
  limitLocations: string;
  limitProjects: string;
  limitAttachments: string;
}

function planToForm(plan: PlanDefinition): EditForm {
  return {
    priceMonthly: String(plan.priceMonthly),
    priceYearly: String(plan.priceYearly),
    limitUsers: String(plan.limits.users),
    limitLocations: String(plan.limits.locations),
    limitProjects: String(plan.limits.projects),
    limitAttachments: String(plan.limits.attachmentsPerMonth),
  };
}

function parseLimit(val: string): number {
  const n = parseInt(val.trim(), 10);
  return isNaN(n) ? -1 : n;
}

function parsePrice(val: string): number {
  const n = parseFloat(val.trim());
  return isNaN(n) ? 0 : n;
}

type SortColumn = 'name' | 'priceMonthly' | 'priceYearly' | 'users' | 'locations' | 'projects' | 'attachments';

export default function PlanesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<PlanDefinition | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data, isLoading } = useQuery({
    queryKey: ['sa-planes'],
    queryFn: fetchPlans,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: updatePlan,
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['sa-planes'] });
      await queryClient.refetchQueries({ queryKey: ['plans'] });
      toast.success('Plan actualizado');
      setEditing(null);
    },
    onError: (err: Error) => toast.error('Error al guardar', { description: err.message }),
  });

  function openEdit(plan: PlanDefinition) {
    setEditing(plan);
    setForm(planToForm(plan));
  }

  function handleSave() {
    if (!editing || !form) return;
    mutate({
      planId: editing.id,
      priceMonthly: parsePrice(form.priceMonthly),
      priceYearly: parsePrice(form.priceYearly),
      limitUsers: parseLimit(form.limitUsers),
      limitLocations: parseLimit(form.limitLocations),
      limitProjects: parseLimit(form.limitProjects),
      limitAttachments: parseLimit(form.limitAttachments),
    });
  }

  const plans = data?.plans ?? [];

  const sorted = [...plans].sort((a, b) => {
    let valA: string | number = '';
    let valB: string | number = '';

    switch (sortColumn) {
      case 'name':
        valA = a.name;
        valB = b.name;
        break;
      case 'priceMonthly':
        valA = a.priceMonthly;
        valB = b.priceMonthly;
        break;
      case 'priceYearly':
        valA = a.priceYearly;
        valB = b.priceYearly;
        break;
      case 'users':
        valA = a.limits.users;
        valB = b.limits.users;
        break;
      case 'locations':
        valA = a.limits.locations;
        valB = b.limits.locations;
        break;
      case 'projects':
        valA = a.limits.projects;
        valB = b.limits.projects;
        break;
      case 'attachments':
        valA = a.limits.attachmentsPerMonth;
        valB = b.limits.attachmentsPerMonth;
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
                <th className="text-left px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort('name')}>
                  <span className="inline-flex items-center">Plan {sortIcon('name')}</span>
                </th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort('priceMonthly')}>
                  <span className="inline-flex items-center">Precio/mes {sortIcon('priceMonthly')}</span>
                </th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort('priceYearly')}>
                  <span className="inline-flex items-center">Precio/año {sortIcon('priceYearly')}</span>
                </th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort('users')}>
                  <span className="inline-flex items-center">Usuarios {sortIcon('users')}</span>
                </th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort('locations')}>
                  <span className="inline-flex items-center">Locales {sortIcon('locations')}</span>
                </th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort('projects')}>
                  <span className="inline-flex items-center">Proyectos {sortIcon('projects')}</span>
                </th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort('attachments')}>
                  <span className="inline-flex items-center">Adjuntos/mes {sortIcon('attachments')}</span>
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {sorted.map((plan) => (
                <tr key={plan.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-semibold capitalize">{plan.name}</td>
                  <td className="px-4 py-3">{fmtPrice(plan.priceMonthly)}</td>
                  <td className="px-4 py-3">{fmtPrice(plan.priceYearly)}</td>
                  <td className="px-4 py-3">{fmt(plan.limits.users)}</td>
                  <td className="px-4 py-3">{fmt(plan.limits.locations)}</td>
                  <td className="px-4 py-3">{fmt(plan.limits.projects)}</td>
                  <td className="px-4 py-3">{fmt(plan.limits.attachmentsPerMonth)}</td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(plan)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => { if (!open && !isPending) setEditing(null); }}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => { if (isPending) e.preventDefault(); }}>
          <DialogHeader>
            <DialogTitle>Editar plan {editing?.name}</DialogTitle>
          </DialogHeader>
          {form && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Precio/mes (ARS)</label>
                  <Input
                    type="number"
                    value={form.priceMonthly}
                    onChange={(e) => setForm((f) => f && { ...f, priceMonthly: e.target.value })}
                    min={0}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Precio/año (ARS)</label>
                  <Input
                    type="number"
                    value={form.priceYearly}
                    onChange={(e) => setForm((f) => f && { ...f, priceYearly: e.target.value })}
                    min={0}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Límites — usá <code>-1</code> para ilimitado</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Máx. usuarios</label>
                  <Input
                    type="number"
                    value={form.limitUsers}
                    onChange={(e) => setForm((f) => f && { ...f, limitUsers: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Máx. locales</label>
                  <Input
                    type="number"
                    value={form.limitLocations}
                    onChange={(e) => setForm((f) => f && { ...f, limitLocations: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Máx. proyectos</label>
                  <Input
                    type="number"
                    value={form.limitProjects}
                    onChange={(e) => setForm((f) => f && { ...f, limitProjects: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Adjuntos/mes</label>
                  <Input
                    type="number"
                    value={form.limitAttachments}
                    onChange={(e) => setForm((f) => f && { ...f, limitAttachments: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={isPending}>
              <X className="h-4 w-4 mr-1" /> Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
