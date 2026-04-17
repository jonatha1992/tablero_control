'use client';

import { cn } from '@/lib/utils';
import type { PermissionSet } from '@/types/domain/custom-role';
import { basePermissions } from '@/lib/permissions/resolve';
import type { UserRole } from '@/types/domain/user';

const MODULES: Array<{
  key: keyof PermissionSet;
  label: string;
  actions: Array<{ key: string; label: string }>;
}> = [
  {
    key: 'tasks',
    label: 'Tareas',
    actions: [
      { key: 'read', label: 'Ver' },
      { key: 'create', label: 'Crear' },
      { key: 'update', label: 'Editar' },
      { key: 'delete', label: 'Eliminar' },
      { key: 'assign', label: 'Asignar' },
      { key: 'comment', label: 'Comentar' },
    ],
  },
  {
    key: 'attachments',
    label: 'Adjuntos',
    actions: [
      { key: 'upload', label: 'Subir' },
      { key: 'delete', label: 'Eliminar' },
    ],
  },
  {
    key: 'locations',
    label: 'Locales',
    actions: [
      { key: 'read', label: 'Ver' },
      { key: 'create', label: 'Crear' },
      { key: 'update', label: 'Editar' },
      { key: 'delete', label: 'Eliminar' },
    ],
  },
  {
    key: 'teams',
    label: 'Equipos',
    actions: [
      { key: 'read', label: 'Ver' },
      { key: 'create', label: 'Crear' },
      { key: 'update', label: 'Editar' },
      { key: 'delete', label: 'Eliminar' },
      { key: 'manageMembers', label: 'Gestionar miembros' },
    ],
  },
  {
    key: 'users',
    label: 'Usuarios',
    actions: [
      { key: 'read', label: 'Ver' },
      { key: 'invite', label: 'Invitar' },
      { key: 'update', label: 'Editar' },
      { key: 'deactivate', label: 'Desactivar' },
    ],
  },
  {
    key: 'reports',
    label: 'Reportes',
    actions: [
      { key: 'read', label: 'Ver' },
      { key: 'export', label: 'Exportar' },
    ],
  },
];

const PRESETS: Record<string, { label: string; fn: (base: PermissionSet) => PermissionSet }> = {
  readonly: {
    label: 'Solo lectura',
    fn: (base) => ({
      ...base,
      tasks: { ...base.tasks, create: false, update: false, delete: false, assign: false },
      attachments: { upload: false, delete: false },
      locations: { ...base.locations, create: false, update: false, delete: false },
      teams: { ...base.teams, create: false, update: false, delete: false, manageMembers: false },
      users: { ...base.users, invite: false, update: false, deactivate: false, changeRole: false },
      reports: { read: true, export: false },
    }),
  },
  operator: {
    label: 'Operador',
    fn: (base) => ({
      ...base,
      tasks: { ...base.tasks, create: true, update: true, delete: false, assign: false },
      attachments: { upload: true, delete: false },
    }),
  },
  supervisor: {
    label: 'Supervisor',
    fn: (base) => base,
  },
};

interface Props {
  value: PermissionSet;
  onChange: (p: PermissionSet) => void;
  baseRole: UserRole;
  disabled?: boolean;
}

export function PermissionGrid({ value, onChange, baseRole, disabled }: Props) {
  const base = basePermissions(baseRole);

  function toggle(module: keyof PermissionSet, action: string) {
    const mod = value[module] as Record<string, boolean>;
    onChange({ ...value, [module]: { ...mod, [action]: !mod[action] } });
  }

  function applyPreset(key: string) {
    const preset = PRESETS[key];
    if (preset) onChange(preset.fn(base));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground mr-1 self-center">Preset rápido:</span>
        {Object.entries(PRESETS).map(([key, p]) => (
          <button
            key={key}
            type="button"
            onClick={() => applyPreset(key)}
            disabled={disabled}
            className="px-3 py-1 rounded-full border text-xs hover:bg-muted transition-colors disabled:opacity-50"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {MODULES.map(({ key, label, actions }) => {
          const modVal = value[key] as Record<string, boolean>;
          const modBase = base[key] as Record<string, boolean>;

          return (
            <div key={key} className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-3 py-2 text-sm font-medium">{label}</div>
              <div className="px-3 py-2 flex flex-wrap gap-x-6 gap-y-2">
                {actions.map(({ key: ak, label: al }) => {
                  const isEnabled = Boolean(modVal[ak]);
                  const isBaseEnabled = Boolean(modBase[ak]);
                  const isDiff = isEnabled !== isBaseEnabled;

                  return (
                    <label
                      key={ak}
                      className={cn(
                        'flex items-center gap-2 text-sm cursor-pointer select-none',
                        disabled && 'cursor-not-allowed opacity-60'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => toggle(key, ak)}
                        disabled={disabled}
                        className="rounded"
                      />
                      <span className={cn(isDiff && isEnabled && 'text-green-600 font-medium', isDiff && !isEnabled && 'text-red-500 line-through')}>
                        {al}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        <span className="text-green-600 font-medium">Verde</span> = agregado vs rol base ·{' '}
        <span className="text-red-500">Tachado</span> = quitado vs rol base
      </p>
    </div>
  );
}
