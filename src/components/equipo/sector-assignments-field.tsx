'use client';

import { useState } from 'react';
import { MapPin, Plus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/domain/user';
import type { LocationAssignmentInput } from '@/types/dto/team.dto';

export const SECTOR_ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'responsable', label: 'Responsable' },
  { value: 'miembro', label: 'Miembro' },
  { value: 'viewer', label: 'Visualizador' },
];

export type SectorAssignmentRow = LocationAssignmentInput & { locationName: string };
export type SectorScope = 'all' | 'specific';

interface LocationRowProps {
  assignment: SectorAssignmentRow;
  showRole: boolean;
  baseRole: UserRole;
  onRemove: () => void;
  onRoleChange: (role: UserRole) => void;
}

function LocationRow({ assignment, showRole, baseRole, onRemove, onRoleChange }: LocationRowProps) {
  const baseRoleLabel = SECTOR_ROLES.find((r) => r.value === baseRole)?.label ?? baseRole;
  return (
    <div className="flex items-center gap-2 rounded-md border border-input bg-muted/20 px-3 py-2">
      <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate text-sm font-medium">{assignment.locationName}</span>
      {showRole ? (
        <select
          value={assignment.role}
          onChange={(e) => onRoleChange(e.target.value as UserRole)}
          className="h-7 appearance-none rounded border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {SECTOR_ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      ) : (
        <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
          {baseRoleLabel}
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        aria-label={`Quitar ${assignment.locationName}`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export interface SectorAssignmentsFieldProps {
  assignments: SectorAssignmentRow[];
  onChange: (assignments: SectorAssignmentRow[]) => void;
  locations: { id: string; name: string }[];
  baseRole: UserRole;
  /** Controlled: whether access covers the whole space or only specific sectors */
  scope: SectorScope;
  onScopeChange: (scope: SectorScope) => void;
  /** Controlled: whether each sector can have its own role override */
  advancedPerms: boolean;
  onAdvancedPermsChange: (v: boolean) => void;
  className?: string;
}

const SCOPE_OPTIONS = [
  {
    value: 'all' as const,
    label: 'Todo el espacio',
    desc: 'Accede a todos los sectores',
  },
  {
    value: 'specific' as const,
    label: 'Sectores específicos',
    desc: 'Acceso limitado por sector',
  },
];

export function SectorAssignmentsField({
  assignments,
  onChange,
  locations,
  baseRole,
  scope,
  onScopeChange,
  advancedPerms,
  onAdvancedPermsChange,
  className,
}: SectorAssignmentsFieldProps) {
  const [addingLocation, setAddingLocation] = useState(false);
  const [newLocationId, setNewLocationId] = useState('');

  const assignedLocationIds = new Set(assignments.map((a) => a.locationId));
  const unassignedLocations = locations.filter((l) => !assignedLocationIds.has(l.id));

  function handleScopeChange(newScope: SectorScope) {
    onScopeChange(newScope);
    if (newScope === 'all') {
      onChange([]);
      setAddingLocation(false);
      setNewLocationId('');
    }
  }

  function handleAdvancedToggle(checked: boolean) {
    onAdvancedPermsChange(checked);
    if (!checked) {
      onChange(assignments.map((a) => ({ ...a, role: baseRole })));
    }
  }

  function addLocation() {
    if (!newLocationId) return;
    const loc = locations.find((l) => l.id === newLocationId);
    if (!loc) return;
    onChange([...assignments, { locationId: loc.id, locationName: loc.name, role: baseRole }]);
    setNewLocationId('');
    setAddingLocation(false);
  }

  function removeLocation(locationId: string) {
    onChange(assignments.filter((a) => a.locationId !== locationId));
  }

  function updateLocationRole(locationId: string, newRole: UserRole) {
    onChange(assignments.map((a) => (a.locationId === locationId ? { ...a, role: newRole } : a)));
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* ── Alcance ──────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Alcance</label>
        <div className="grid grid-cols-2 gap-2">
          {SCOPE_OPTIONS.map((opt) => {
            const isSelected = scope === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleScopeChange(opt.value)}
                className={cn(
                  'rounded-lg border p-3 text-left text-xs transition-all',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/40 hover:bg-muted/30'
                )}
              >
                <div className="mb-1 flex items-center gap-1.5">
                  <span
                    className={cn(
                      'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                      isSelected ? 'border-primary' : 'border-muted-foreground/30'
                    )}
                  >
                    {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </span>
                  <span className={cn('font-semibold', isSelected ? 'text-primary' : '')}>
                    {opt.label}
                  </span>
                </div>
                <p className="pl-5 leading-tight text-muted-foreground">{opt.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Lista de sectores (solo cuando scope = specific) ───── */}
      {scope === 'specific' && (
        <div className="space-y-2">
          {/* Header + advanced toggle */}
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <MapPin className="h-3 w-3" />
              Sectores asignados
            </span>
            <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <span>Permisos distintos por sector</span>
              <button
                type="button"
                role="switch"
                aria-checked={advancedPerms}
                onClick={() => handleAdvancedToggle(!advancedPerms)}
                className={cn(
                  'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  advancedPerms ? 'bg-primary' : 'bg-input'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-sm ring-0 transition-transform',
                    advancedPerms ? 'translate-x-4' : 'translate-x-0'
                  )}
                />
              </button>
            </label>
          </div>

          <div className="space-y-1.5">
            {assignments.length === 0 && !addingLocation && (
              <p className="rounded-md border border-dashed border-input px-3 py-2.5 text-xs text-muted-foreground">
                Sin sectores asignados — agregá al menos uno.
              </p>
            )}

            {assignments.map((a) => (
              <LocationRow
                key={a.locationId}
                assignment={a}
                showRole={advancedPerms}
                baseRole={baseRole}
                onRemove={() => removeLocation(a.locationId)}
                onRoleChange={(r) => updateLocationRole(a.locationId, r)}
              />
            ))}

            {addingLocation ? (
              <div className="flex items-center gap-2 rounded-md border border-primary/40 bg-primary/5 px-3 py-2">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                <select
                  autoFocus
                  value={newLocationId}
                  onChange={(e) => setNewLocationId(e.target.value)}
                  className="h-7 flex-1 appearance-none rounded border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Elegir sector…</option>
                  {unassignedLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={addLocation}
                  disabled={!newLocationId}
                  aria-label="Confirmar sector"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setAddingLocation(false);
                    setNewLocationId('');
                  }}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              unassignedLocations.length > 0 && (
                <button
                  type="button"
                  onClick={() => setAddingLocation(true)}
                  className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Agregar sector
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
