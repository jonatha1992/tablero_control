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

interface LocationRowProps {
  assignment: SectorAssignmentRow;
  onRemove: () => void;
  onRoleChange: (role: UserRole) => void;
}

function LocationRow({ assignment, onRemove, onRoleChange }: LocationRowProps) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-input bg-muted/20 px-3 py-2">
      <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate text-sm font-medium">{assignment.locationName}</span>
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
      <button
        type="button"
        onClick={onRemove}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
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
  className?: string;
}

export function SectorAssignmentsField({
  assignments,
  onChange,
  locations,
  baseRole,
  className,
}: SectorAssignmentsFieldProps) {
  const [addingLocation, setAddingLocation] = useState(false);
  const [newLocationId, setNewLocationId] = useState('');
  const [newLocationRole, setNewLocationRole] = useState<UserRole>(baseRole);

  const assignedLocationIds = new Set(assignments.map((a) => a.locationId));
  const unassignedLocations = locations.filter((l) => !assignedLocationIds.has(l.id));

  function applyBaseRoleToAllSectors() {
    onChange(assignments.map((a) => ({ ...a, role: baseRole })));
    setNewLocationRole(baseRole);
  }

  function addLocation() {
    if (!newLocationId) return;
    const loc = locations.find((l) => l.id === newLocationId);
    if (!loc) return;
    onChange([...assignments, { locationId: loc.id, locationName: loc.name, role: newLocationRole }]);
    setNewLocationId('');
    setNewLocationRole(baseRole);
    setAddingLocation(false);
  }

  function removeLocation(locationId: string) {
    onChange(assignments.filter((a) => a.locationId !== locationId));
  }

  function updateLocationRole(locationId: string, newRole: UserRole) {
    onChange(assignments.map((a) => (a.locationId === locationId ? { ...a, role: newRole } : a)));
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="flex items-center gap-1.5 text-sm font-medium">
        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
        Sectores asignados
        <span className="ml-1 text-xs font-normal text-muted-foreground">(rol por sector)</span>
      </label>

      <div className="space-y-1.5">
        {assignments.length > 1 && (
          <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/20 px-3 py-2">
            <p className="text-xs text-muted-foreground">
              Tip: podés aplicar el rol base a todos los sectores y luego ajustar solo excepciones.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={applyBaseRoleToAllSectors}
            >
              Aplicar rol base
            </Button>
          </div>
        )}

        {assignments.length === 0 && !addingLocation && (
          <p className="rounded-md border border-dashed border-input px-3 py-2.5 text-xs text-muted-foreground">
            Sin sectores asignados — accede a todos según rol base.
          </p>
        )}

        {assignments.map((a) => (
          <LocationRow
            key={a.locationId}
            assignment={a}
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
              className="flex-1 h-7 appearance-none rounded border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Elegir sector…</option>
              {unassignedLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
            <select
              value={newLocationRole}
              onChange={(e) => setNewLocationRole(e.target.value as UserRole)}
              className="h-7 appearance-none rounded border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {SECTOR_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
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
              onClick={() => {
                setNewLocationRole(baseRole);
                setAddingLocation(true);
              }}
              className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar sector
            </button>
          )
        )}
      </div>
    </div>
  );
}
