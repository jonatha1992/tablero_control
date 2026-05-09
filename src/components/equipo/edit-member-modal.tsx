'use client';

import { useState, useEffect } from 'react';
import {
  UserCog, Trash2, X, Save, Loader2,
  Mail, Lock, MapPin, Shield, Crown, Users, Eye, Star, Check, Plus,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useUpdateMember } from '@/hooks/mutations/use-update-member';
import { useLocationsQuery } from '@/hooks/queries/use-locations-query';
import { useRolesQuery } from '@/hooks/queries/use-roles-query';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuth } from '@/hooks/auth-context';
import type { User, UserRole, UserLocationAssignment } from '@/types/domain/user';
import type { LocationAssignmentInput } from '@/types/dto/team.dto';

const ROLES: {
  value: UserRole;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { value: 'admin', label: 'Administrador', description: 'Gestión completa de la empresa', icon: Crown, color: 'text-amber-500' },
  { value: 'responsable', label: 'Responsable', description: 'Gestión de locales/sectores', icon: Star, color: 'text-blue-500' },
  { value: 'miembro', label: 'Miembro', description: 'Trabaja en tareas asignadas', icon: Users, color: 'text-green-500' },
  { value: 'viewer', label: 'Visualizador', description: 'Solo lectura', icon: Eye, color: 'text-muted-foreground' },
];

const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  responsable: 'Responsable',
  miembro: 'Miembro',
  viewer: 'Viewer',
  pending: 'Pendiente',
};

function MemberAvatar({ name, avatar }: { name: string; avatar?: string | null }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className="h-10 w-10 rounded-full object-cover ring-2 ring-border"
      />
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-2 ring-border">
      {initials}
    </div>
  );
}

interface LocationRowProps {
  assignment: LocationAssignmentInput & { locationName: string };
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
        {ROLES.map((r) => (
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

interface Props {
  member: User | null;
  open: boolean;
  onClose: () => void;
  onRemove?: (id: string) => void;
}

export function EditMemberModal({ member, open, onClose, onRemove }: Props) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('miembro');
  const [error, setError] = useState('');
  const [customRoleIds, setCustomRoleIds] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [locationAssignments, setLocationAssignments] = useState<(LocationAssignmentInput & { locationName: string })[]>([]);
  const [addingLocation, setAddingLocation] = useState(false);
  const [newLocationId, setNewLocationId] = useState('');
  const [newLocationRole, setNewLocationRole] = useState<UserRole>('miembro');

  const { user: authUser } = useAuth();
  const { mutate, isPending } = useUpdateMember();
  const { data: locations = [] } = useLocationsQuery();
  const { data: allRoles = [] } = useRolesQuery(authUser?.businessId);

  const availableCustomRoles = allRoles.filter((r) => r.isActive && !r.isSystem);

  const assignedLocationIds = new Set(locationAssignments.map((a) => a.locationId));
  const unassignedLocations = locations.filter((l) => !assignedLocationIds.has(l.id));

  useEffect(() => {
    if (member) {
      setName(member.name);
      setRole(member.role);
      setCustomRoleIds(member.customRoleIds ?? []);
      setAddingLocation(false);
      setNewLocationId('');
      setNewLocationRole('miembro');

      if (member.locationAssignments?.length) {
        setLocationAssignments(
          member.locationAssignments.map((a: UserLocationAssignment) => ({
            locationId: a.locationId,
            locationName: a.locationName ?? a.locationId,
            role: a.role,
            customRoleIds: a.customRoleIds,
          }))
        );
      } else if (member.locationId) {
        // Migrate legacy single locationId
        const loc = locations.find((l) => l.id === member.locationId);
        if (loc) {
          setLocationAssignments([{ locationId: loc.id, locationName: loc.name, role: member.role }]);
        } else {
          setLocationAssignments([]);
        }
      } else {
        setLocationAssignments([]);
      }
    }
  }, [member, open, locations]);

  function addLocation() {
    if (!newLocationId) return;
    const loc = locations.find((l) => l.id === newLocationId);
    if (!loc) return;
    setLocationAssignments((prev) => [
      ...prev,
      { locationId: loc.id, locationName: loc.name, role: newLocationRole },
    ]);
    setNewLocationId('');
    setNewLocationRole('miembro');
    setAddingLocation(false);
  }

  function removeLocation(locationId: string) {
    setLocationAssignments((prev) => prev.filter((a) => a.locationId !== locationId));
  }

  function updateLocationRole(locationId: string, newRole: UserRole) {
    setLocationAssignments((prev) =>
      prev.map((a) => (a.locationId === locationId ? { ...a, role: newRole } : a))
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!member) return;
    const trimmedName = name.trim();
    if (!trimmedName || !role) return;
    setError('');

    mutate(
      {
        id: member.id,
        data: {
          name: trimmedName,
          role,
          customRoleIds,
          locationAssignments: locationAssignments.map(({ locationId, role: r, customRoleIds: cr }) => ({
            locationId,
            role: r,
            customRoleIds: cr,
          })),
        },
      },
      {
        onSuccess: () => onClose(),
        onError: (err) => setError(err.message),
      }
    );
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {member && <MemberAvatar name={member.name} avatar={member.avatar} />}
            <div>
              <DialogTitle className="flex items-center gap-2 text-base">
                <UserCog className="h-4 w-4 text-muted-foreground" />
                Editar miembro
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Modificá permisos y sectores del miembro.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium">
              <UserCog className="h-3.5 w-3.5 text-muted-foreground" />
              Nombre completo
            </label>
            <Input
              placeholder="Juan García"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
            />
          </div>

          {/* Email (read-only) */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              Correo electrónico
            </label>
            <div className="relative">
              <Input
                value={member?.email || ''}
                disabled
                className="bg-muted/40 pr-9 text-muted-foreground"
              />
              <Lock className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            </div>
          </DialogHeader>

          {/* Global Role */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium">
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
              Rol base
              <span className="ml-1 text-xs font-normal text-muted-foreground">(aplica globalmente)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const isSelected = role === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={cn(
                      'relative h-full w-full rounded-lg border p-3 text-left text-xs transition-all',
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-muted-foreground/40 hover:bg-muted/30'
                    )}
                  >
                    {isSelected && (
                      <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                      </span>
                    )}
                    <Icon className={cn('mb-1.5 h-4 w-4', isSelected ? 'text-primary' : r.color)} />
                    <p className={cn('font-semibold', isSelected ? 'text-primary' : '')}>{r.label}</p>
                    <p className="mt-0.5 text-muted-foreground line-clamp-1 leading-tight">{r.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sector assignments */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              Sectores asignados
              <span className="ml-1 text-xs font-normal text-muted-foreground">(rol por sector)</span>
            </label>

            <div className="space-y-1.5">
              {locationAssignments.length === 0 && !addingLocation && (
                <p className="rounded-md border border-dashed border-input px-3 py-2.5 text-xs text-muted-foreground">
                  Sin sectores asignados — accede a todos según rol base.
                </p>
              )}

              {locationAssignments.map((a) => (
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
                    {ROLES.map((r) => (
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
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <button
                    type="button"
                    onClick={() => { setAddingLocation(false); setNewLocationId(''); }}
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

          {/* Custom roles */}
          {role !== 'superadmin' && availableCustomRoles.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Roles personalizados</label>
              <div className="space-y-1 rounded-lg border border-input bg-muted/20 p-3">
                {availableCustomRoles.map((cr) => {
                  const checked = customRoleIds.includes(cr.id);
                  return (
                    <label
                      key={cr.id}
                      className={cn(
                        'flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors',
                        checked ? 'bg-primary/5' : 'hover:bg-muted/50'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                          checked ? 'border-primary bg-primary' : 'border-input bg-background'
                        )}
                      >
                        {checked && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setCustomRoleIds((prev) =>
                            e.target.checked ? [...prev, cr.id] : prev.filter((x) => x !== cr.id)
                          )
                        }
                        className="sr-only"
                      />
                      <span
                        className="inline-block h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: cr.color }}
                      />
                      <span className="text-sm">{cr.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter className="gap-2 sm:justify-between pt-1">
            {onRemove && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                disabled={isPending}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Eliminar
              </Button>
            )}
            <div className="flex gap-2 sm:ml-auto">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
                <X className="mr-1.5 h-3.5 w-3.5" />
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                    Guardar cambios
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <DialogFooter className="gap-2 sm:justify-between pt-1">
              {onRemove && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                  disabled={isPending}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Eliminar
                </Button>
              )}
              <div className="flex gap-2 sm:ml-auto">
                <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-1.5 h-3.5 w-3.5" />
                      Guardar cambios
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {member && onRemove && (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          variant="destructive"
          title={`¿Eliminar a ${member.name}?`}
          description="El miembro perderá el acceso al equipo. Esta acción no se puede deshacer."
          confirmLabel="Sí, eliminar"
          onConfirm={() => {
            onRemove(member.id);
            setConfirmDelete(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
