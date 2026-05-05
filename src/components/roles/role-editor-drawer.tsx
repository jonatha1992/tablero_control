'use client';

import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import type { CustomRole, BaseRoleForCustom, RoleScope } from '@/types/domain/custom-role';
import { basePermissions } from '@/lib/permissions/resolve';
import { PermissionGrid } from './permission-grid';
import { useSaveRole } from '@/hooks/mutations/use-save-role';
import { X, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';

const STEPS = ['Identidad', 'Base', 'Permisos', 'Guardar'] as const;
type Step = 0 | 1 | 2 | 3;

const BASE_ROLES: Array<{ value: BaseRoleForCustom; label: string; desc: string }> = [
  { value: 'responsable', label: 'Responsable', desc: 'Jefe de local — puede crear y gestionar tareas.' },
  { value: 'miembro',    label: 'Miembro',      desc: 'Trabajador — opera sus tareas asignadas.' },
  { value: 'viewer',     label: 'Visualizador',       desc: 'Solo lectura dentro del negocio.' },
];

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#64748b',
];

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: CustomRole | null;
}

type DraftRole = Omit<CustomRole, 'id' | 'createdAt' | 'updatedAt' | 'userCount' | 'createdBy' | 'businessId'>;

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function getDefaultDraft(): DraftRole {
  return {
    name: '',
    slug: '',
    description: '',
    color: COLORS[0],
    icon: undefined,
    baseRole: 'miembro',
    scope: { type: 'business' },
    permissions: basePermissions('miembro'),
    isActive: true,
    isSystem: false,
  };
}

export function RoleEditorDrawer({ open, onClose, initial }: Props) {
  const save = useSaveRole();
  const [step, setStep] = useState<Step>(0);
  const [draft, setDraft] = useState<DraftRole>(() => getDefaultDraft());

  useEffect(() => {
    if (open) {
      setStep(0);
      if (initial) {
        setDraft({
          name: initial.name,
          slug: initial.slug,
          description: initial.description ?? '',
          color: initial.color,
          icon: initial.icon,
          baseRole: initial.baseRole,
          scope: initial.scope,
          permissions: initial.permissions,
          isActive: initial.isActive,
          isSystem: initial.isSystem,
        });
      } else {
        setDraft(getDefaultDraft());
      }
    }
  }, [open, initial]);

  function setField<K extends keyof DraftRole>(key: K, value: DraftRole[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleBaseRoleChange(br: BaseRoleForCustom) {
    setDraft((prev) => ({ ...prev, baseRole: br, permissions: basePermissions(br) }));
  }

  const [saveError, setSaveError] = useState<string>('');

  async function handleSave() {
    setSaveError('');
    try {
      await save.mutateAsync({ ...draft, id: initial?.id });
      onClose();
    } catch (err) {
      setSaveError((err as Error).message);
    }
  }

  const canNext = step === 0 ? draft.name.trim().length >= 2 : true;

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-background shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <Dialog.Title className="font-semibold text-lg">
              {initial ? 'Editar rol' : 'Nuevo rol'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </Dialog.Close>
          </div>

          {/* Steps indicator */}
          <div className="flex px-6 pt-4 gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  'h-6 w-6 rounded-full text-xs flex items-center justify-center font-medium shrink-0',
                  i === step ? 'bg-primary text-primary-foreground' :
                  i < step ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  {i + 1}
                </div>
                <span className={cn('text-xs', i === step ? 'font-medium' : 'text-muted-foreground')}>{s}</span>
                {i < STEPS.length - 1 && <div className="flex-1 h-px bg-muted" />}
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Nombre *</label>
                  <input
                    value={draft.name}
                    onChange={(e) => { setField('name', e.target.value); setField('slug', slug(e.target.value)); }}
                    placeholder="Supervisor nocturno"
                    className="border rounded-lg px-3 py-2 text-sm w-full bg-background"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-1">slug: <span className="font-mono">{draft.slug || '—'}</span></p>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Descripción</label>
                  <textarea
                    value={draft.description}
                    onChange={(e) => setField('description', e.target.value)}
                    placeholder="Describe qué puede hacer este rol…"
                    rows={3}
                    className="border rounded-lg px-3 py-2 text-sm w-full bg-background resize-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setField('color', c)}
                        className={cn('h-7 w-7 rounded-full transition-transform', draft.color === c && 'ring-2 ring-offset-2 ring-foreground scale-110')}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Elegí el rol base del que hereda este rol custom. Los permisos se pueden ajustar en el siguiente paso.</p>
                {BASE_ROLES.map(({ value, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleBaseRoleChange(value)}
                    className={cn(
                      'w-full text-left border rounded-xl p-4 transition-colors',
                      draft.baseRole === value ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    )}
                  >
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </button>
                ))}

                <div className="mt-4">
                  <label className="text-sm font-medium block mb-2">Alcance</label>
                  <div className="flex gap-3">
                    {(['business', 'location', 'team'] as RoleScope['type'][]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setField('scope', { type: t })}
                        className={cn(
                          'flex-1 border rounded-lg py-2 text-sm capitalize transition-colors',
                          draft.scope.type === t ? 'border-primary bg-primary/5 font-medium' : 'hover:bg-muted/50'
                        )}
                      >
                        {t === 'business' ? 'Todo el negocio' : t === 'location' ? 'Por local' : 'Por equipo'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <PermissionGrid
                value={draft.permissions}
                onChange={(p) => setField('permissions', p)}
                baseRole={draft.baseRole}
              />
            )}

            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Revisá el resumen antes de guardar.</p>
                {saveError && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
                    {saveError}
                  </div>
                )}
                <div className="border rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full shrink-0" style={{ backgroundColor: draft.color }} />
                    <div>
                      <p className="font-semibold">{draft.name}</p>
                      <p className="text-xs text-muted-foreground">{draft.description || 'Sin descripción'}</p>
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <div><dt className="text-muted-foreground text-xs">Rol base</dt><dd className="capitalize">{draft.baseRole}</dd></div>
                    <div><dt className="text-muted-foreground text-xs">Alcance</dt><dd className="capitalize">{draft.scope.type}</dd></div>
                    <div><dt className="text-muted-foreground text-xs">Slug</dt><dd className="font-mono">{draft.slug}</dd></div>
                    <div><dt className="text-muted-foreground text-xs">Activo</dt><dd>{draft.isActive ? 'Sí' : 'No'}</dd></div>
                  </dl>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1) as Step)}
              disabled={step === 0}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s + 1) as Step)}
                disabled={!canNext}
                className="flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                Siguiente <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={save.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {initial ? 'Guardar cambios' : 'Crear rol'}
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
