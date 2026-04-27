'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Pencil, Check, X } from 'lucide-react';
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

export default function PlanesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<PlanDefinition | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['sa-planes'],
    queryFn: fetchPlans,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: updatePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa-planes'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
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

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Planes</h1>
        <p className="text-muted-foreground text-sm">
          Configurá precios y límites de cada plan. Usá <strong>-1</strong> para ilimitado.
        </p>
      </div>

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
                <th className="text-left px-4 py-3 font-medium">Plan</th>
                <th className="text-left px-4 py-3 font-medium">Precio/mes</th>
                <th className="text-left px-4 py-3 font-medium">Precio/año</th>
                <th className="text-left px-4 py-3 font-medium">Usuarios</th>
                <th className="text-left px-4 py-3 font-medium">Locales</th>
                <th className="text-left px-4 py-3 font-medium">Proyectos</th>
                <th className="text-left px-4 py-3 font-medium">Adjuntos/mes</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {plans.map((plan) => (
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

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
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
